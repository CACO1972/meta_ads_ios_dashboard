/**
 * AI Co-Pilot Suggestion Generator
 * Generates optimization suggestions based on analysis
 */

import type { AdAnalysis, FullAnalysis, ServiceType } from './analyzer';

export type SuggestionType = 
  | 'budget' 
  | 'audience' 
  | 'creative' 
  | 'schedule' 
  | 'service' 
  | 'objective' 
  | 'placement' 
  | 'device' 
  | 'location' 
  | 'strategy';

export type SuggestionPriority = 'high' | 'medium' | 'low';
export type SuggestionRisk = 'low' | 'medium' | 'high';
export type TargetType = 'ad' | 'adset' | 'campaign';

export interface SuggestionAction {
  type: string;
  params: Record<string, unknown>;
}

export interface SuggestionImpact {
  estimatedRevenue?: number;
  estimatedProfit?: number;
  estimatedSavings?: number;
  estimatedROI?: number;
  additionalResults?: number;
  resultsLost?: number;
}

export interface MonitoringConfig {
  checkInterval: number; // hours
  rollbackConditions: Array<{
    metric: string;
    operator: 'gt' | 'lt' | 'gte' | 'lte';
    value: number;
    duration: number; // hours
  }>;
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  action: string;
  
  // Target
  targetType: TargetType;
  targetId: string;
  targetName: string;
  serviceName?: string;
  
  // State
  currentState: Record<string, unknown>;
  proposedState: Record<string, unknown>;
  
  // Impact
  impact: SuggestionImpact;
  confidence: number; // 0-1
  risk: SuggestionRisk;
  
  // Reasoning
  title: string;
  description: string;
  reasoning: string;
  
  // Monitoring
  monitoringConfig?: MonitoringConfig;
  
  // Metadata
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Generate a unique suggestion ID
 */
function generateSuggestionId(): string {
  return `sug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate expiration date (24 hours from now)
 */
function getExpirationDate(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date;
}

/**
 * Generate budget scaling suggestion for high-performing ads
 */
function generateScaleBudgetSuggestion(ad: AdAnalysis): Suggestion | null {
  // Only suggest for excellent/good performers
  if (ad.cprStatus !== 'excellent' && ad.cprStatus !== 'good') return null;
  if (ad.status !== 'ACTIVE') return null;
  if (ad.metrics.spend < 10000) return null; // Need some data
  
  // Calculate scale percentage based on performance
  let scalePercentage: number;
  let confidence: number;
  let risk: SuggestionRisk;
  
  if (ad.cprStatus === 'excellent' && ad.roiStatus === 'excellent') {
    scalePercentage = 70;
    confidence = 0.95;
    risk = 'low';
  } else if (ad.cprStatus === 'excellent') {
    scalePercentage = 50;
    confidence = 0.90;
    risk = 'low';
  } else if (ad.cprStatus === 'good' && ad.roiStatus === 'excellent') {
    scalePercentage = 40;
    confidence = 0.85;
    risk = 'low';
  } else if (ad.cprStatus === 'good') {
    scalePercentage = 30;
    confidence = 0.80;
    risk = 'medium';
  } else {
    return null;
  }
  
  // Check frequency - don't scale if audience is saturated
  if (ad.metrics.frequency >= 3) {
    scalePercentage = Math.min(scalePercentage, 20);
    confidence *= 0.8;
    risk = 'medium';
  }
  
  // Calculate impact
  const currentDailySpend = ad.metrics.spend / 30; // Approximate
  const newDailySpend = currentDailySpend * (1 + scalePercentage / 100);
  const additionalSpend = (newDailySpend - currentDailySpend) * 30;
  const additionalResults = Math.floor(additionalSpend / ad.metrics.cpr);
  const additionalRevenue = additionalResults * ad.service.ltv;
  const additionalProfit = additionalRevenue - additionalSpend;
  
  return {
    id: generateSuggestionId(),
    type: 'budget',
    priority: ad.cprStatus === 'excellent' ? 'high' : 'medium',
    action: 'scale_budget',
    
    targetType: 'ad',
    targetId: ad.adId,
    targetName: ad.adName,
    serviceName: ad.service.name,
    
    currentState: {
      dailyBudget: currentDailySpend,
      cpr: ad.metrics.cpr,
      roi: ad.roi,
      frequency: ad.metrics.frequency
    },
    proposedState: {
      dailyBudget: newDailySpend,
      scalePercentage
    },
    
    impact: {
      estimatedRevenue: additionalRevenue,
      estimatedProfit: additionalProfit,
      estimatedROI: ad.roi * 0.9, // Assume slight decrease
      additionalResults
    },
    confidence,
    risk,
    
    title: `Escalar presupuesto de "${ad.adName}" +${scalePercentage}%`,
    description: `Este anuncio tiene un CPR excelente de $${ad.metrics.cpr.toFixed(2)} (objetivo: $${ad.service.cprTarget}) y un ROI de ${ad.roi.toFixed(1)}x. Aumentar el presupuesto puede generar ${additionalResults} resultados adicionales.`,
    reasoning: `
**Análisis:**
• CPR actual: $${ad.metrics.cpr.toFixed(2)} (${Math.round((1 - ad.metrics.cpr / ad.service.cprTarget) * 100)}% mejor que objetivo)
• ROI: ${ad.roi.toFixed(2)}x (${ad.roiStatus})
• Frecuencia: ${ad.metrics.frequency.toFixed(1)} (${ad.metrics.frequency < 2 ? 'audiencia no saturada' : 'moderada'})
• Score: ${ad.score}/100

**Justificación:**
Este anuncio muestra señales excepcionales de rendimiento. Basado en el análisis de métricas, escalar el presupuesto en ${scalePercentage}% tiene alta probabilidad de mantener el ROI positivo.

**Impacto estimado:**
• Revenue adicional: $${additionalRevenue.toLocaleString()} CLP/mes
• Profit adicional: $${additionalProfit.toLocaleString()} CLP/mes
• Resultados adicionales: +${additionalResults}/mes

**Plan de monitoreo:**
Si apruebas, revisaré el CPR cada 6 horas y haré rollback automático si CPR > $${(ad.service.cprMax * 0.8).toFixed(0)} por 2 días consecutivos.
    `.trim(),
    
    monitoringConfig: {
      checkInterval: 6,
      rollbackConditions: [
        {
          metric: 'cpr',
          operator: 'gt',
          value: ad.service.cprMax * 0.8,
          duration: 48
        }
      ]
    },
    
    createdAt: new Date(),
    expiresAt: getExpirationDate()
  };
}

/**
 * Generate pause suggestion for poor-performing ads
 */
function generatePauseAdSuggestion(ad: AdAnalysis): Suggestion | null {
  // Only suggest for critical/poor performers
  if (ad.cprStatus !== 'critical' && ad.cprStatus !== 'poor') return null;
  if (ad.status !== 'ACTIVE') return null;
  if (ad.metrics.spend < 30000) return null; // Need enough data
  
  let confidence: number;
  let priority: SuggestionPriority;
  
  if (ad.cprStatus === 'critical') {
    confidence = 0.95;
    priority = 'high';
  } else {
    confidence = 0.85;
    priority = 'medium';
  }
  
  // Calculate savings
  const dailySpend = ad.metrics.spend / 30;
  const monthlySavings = dailySpend * 30;
  const resultsLost = ad.metrics.results;
  
  return {
    id: generateSuggestionId(),
    type: 'budget',
    priority,
    action: 'pause_ad',
    
    targetType: 'ad',
    targetId: ad.adId,
    targetName: ad.adName,
    serviceName: ad.service.name,
    
    currentState: {
      status: 'ACTIVE',
      cpr: ad.metrics.cpr,
      roi: ad.roi,
      spend: ad.metrics.spend
    },
    proposedState: {
      status: 'PAUSED'
    },
    
    impact: {
      estimatedSavings: monthlySavings,
      resultsLost
    },
    confidence,
    risk: 'low',
    
    title: `Pausar "${ad.adName}" (CPR ${ad.cprStatus})`,
    description: `Este anuncio tiene un CPR de $${ad.metrics.cpr.toFixed(2)} que supera el máximo de $${ad.service.cprMax} para ${ad.service.name}. Pausarlo ahorrará $${monthlySavings.toLocaleString()} CLP/mes.`,
    reasoning: `
**Análisis:**
• CPR actual: $${ad.metrics.cpr.toFixed(2)} (${Math.round((ad.metrics.cpr / ad.service.cprMax - 1) * 100)}% sobre el máximo)
• ROI: ${ad.roi.toFixed(2)}x (${ad.roiStatus})
• Gasto acumulado: $${ad.metrics.spend.toLocaleString()} CLP
• Resultados: ${ad.metrics.results}
• Score: ${ad.score}/100

**Justificación:**
Este anuncio está generando pérdidas. El CPR de $${ad.metrics.cpr.toFixed(2)} supera significativamente el umbral máximo de $${ad.service.cprMax} para el servicio "${ad.service.name}".

**Impacto estimado:**
• Ahorro mensual: $${monthlySavings.toLocaleString()} CLP
• Resultados perdidos: ~${resultsLost} (pero a CPR ineficiente)

**Recomendación adicional:**
Considera crear un nuevo anuncio con diferente creativo o audiencia para este servicio.
    `.trim(),
    
    createdAt: new Date(),
    expiresAt: getExpirationDate()
  };
}

/**
 * Generate creative refresh suggestion for high-frequency ads
 */
function generateCreativeRefreshSuggestion(ad: AdAnalysis): Suggestion | null {
  // Only suggest for ads with high frequency
  if (ad.metrics.frequency < 3.5) return null;
  if (ad.status !== 'ACTIVE') return null;
  
  const priority: SuggestionPriority = ad.metrics.frequency >= 4 ? 'high' : 'medium';
  const confidence = ad.metrics.frequency >= 4 ? 0.90 : 0.80;
  
  return {
    id: generateSuggestionId(),
    type: 'creative',
    priority,
    action: 'refresh_creative',
    
    targetType: 'ad',
    targetId: ad.adId,
    targetName: ad.adName,
    serviceName: ad.service.name,
    
    currentState: {
      frequency: ad.metrics.frequency,
      ctr: ad.metrics.ctr,
      cpr: ad.metrics.cpr
    },
    proposedState: {
      action: 'create_variation',
      keepOriginal: true
    },
    
    impact: {
      estimatedROI: ad.roi * 1.2 // Assume improvement
    },
    confidence,
    risk: 'low',
    
    title: `Refrescar creativo de "${ad.adName}"`,
    description: `La frecuencia de ${ad.metrics.frequency.toFixed(1)} indica que la audiencia está viendo el anuncio demasiadas veces. Crear una variación puede mejorar el rendimiento.`,
    reasoning: `
**Análisis:**
• Frecuencia actual: ${ad.metrics.frequency.toFixed(1)} (${ad.metrics.frequency >= 4 ? 'muy alta' : 'alta'})
• CTR: ${ad.metrics.ctr.toFixed(2)}%
• CPR: $${ad.metrics.cpr.toFixed(2)}

**Justificación:**
Una frecuencia alta indica fatiga de audiencia. Los usuarios han visto este anuncio múltiples veces, lo que puede causar:
• Disminución del CTR
• Aumento del CPR
• Menor engagement

**Recomendación:**
1. Crear 2-3 variaciones del creativo (diferente imagen/video)
2. Mantener el copy que funciona
3. Probar diferentes formatos (carrusel, video corto)
4. Considerar actualizar la oferta o CTA

**Impacto esperado:**
• Reducción de frecuencia
• Mejora de CTR en 20-30%
• Reducción de CPR en 15-25%
    `.trim(),
    
    createdAt: new Date(),
    expiresAt: getExpirationDate()
  };
}

/**
 * Generate campaign consolidation suggestion
 */
function generateConsolidationSuggestion(analysis: FullAnalysis): Suggestion | null {
  // Only suggest if there are too many campaigns
  if (analysis.totalCampaigns <= 3) return null;
  
  const activeCampaigns = analysis.campaigns.filter(c => c.status === 'ACTIVE');
  if (activeCampaigns.length <= 3) return null;
  
  return {
    id: generateSuggestionId(),
    type: 'strategy',
    priority: 'high',
    action: 'consolidate_campaigns',
    
    targetType: 'campaign',
    targetId: 'all',
    targetName: 'Todas las campañas',
    
    currentState: {
      campaignCount: analysis.totalCampaigns,
      activeCampaigns: activeCampaigns.length
    },
    proposedState: {
      campaignCount: 3,
      structure: ['Prospecting', 'Retargeting', 'Advantage+']
    },
    
    impact: {
      estimatedROI: analysis.avgROI * 1.3
    },
    confidence: 0.85,
    risk: 'medium',
    
    title: `Consolidar ${activeCampaigns.length} campañas en 3`,
    description: `Tienes ${activeCampaigns.length} campañas activas. Consolidarlas en 3 campañas principales (Prospecting, Retargeting, Advantage+) mejorará el aprendizaje del algoritmo.`,
    reasoning: `
**Análisis:**
• Campañas activas: ${activeCampaigns.length}
• Fragmentación detectada: Alta
• Gasto distribuido en múltiples campañas

**Problema:**
La fragmentación de campañas dificulta que el algoritmo de Meta aprenda y optimice. Cada campaña necesita ~50 conversiones/semana para salir de la fase de aprendizaje.

**Estructura recomendada:**
1. **Prospecting (60% presupuesto):** Audiencias frías, intereses amplios
2. **Retargeting (25% presupuesto):** Visitantes web, engagement, lookalikes
3. **Advantage+ (15% presupuesto):** Automatización completa de Meta

**Impacto esperado:**
• Salir de fase de aprendizaje más rápido
• Mejor optimización del algoritmo
• Reducción de CPR en 20-30%
• Mejora de ROI en 30%

**Nota:** Esta es una acción manual que requiere reorganizar campañas en Meta Ads Manager.
    `.trim(),
    
    createdAt: new Date(),
    expiresAt: getExpirationDate()
  };
}

/**
 * Generate schedule optimization suggestion
 */
function generateScheduleSuggestion(ad: AdAnalysis): Suggestion | null {
  // This would require hourly data which we don't have
  // For now, generate generic suggestion for high-spend ads
  if (ad.metrics.spend < 200000) return null;
  if (ad.status !== 'ACTIVE') return null;
  if (ad.cprStatus === 'excellent' || ad.cprStatus === 'good') return null;
  
  return {
    id: generateSuggestionId(),
    type: 'schedule',
    priority: 'low',
    action: 'optimize_schedule',
    
    targetType: 'adset',
    targetId: ad.adsetId,
    targetName: ad.adsetName,
    serviceName: ad.service.name,
    
    currentState: {
      schedule: '24/7',
      cpr: ad.metrics.cpr
    },
    proposedState: {
      schedule: 'optimized',
      pauseHours: '00:00-08:00'
    },
    
    impact: {
      estimatedSavings: ad.metrics.spend * 0.15
    },
    confidence: 0.70,
    risk: 'low',
    
    title: `Optimizar horarios de "${ad.adsetName}"`,
    description: `Pausar anuncios durante horas de bajo rendimiento (00:00-08:00) puede reducir el gasto innecesario y mejorar el CPR.`,
    reasoning: `
**Análisis:**
• Gasto actual: $${ad.metrics.spend.toLocaleString()} CLP
• CPR: $${ad.metrics.cpr.toFixed(2)}
• Horario actual: 24/7

**Recomendación:**
Basado en patrones típicos de comportamiento:
• Las horas 00:00-08:00 suelen tener menor intención de compra
• El CPR durante estas horas suele ser 30-50% más alto
• Pausar durante estas horas puede ahorrar 15-20% del presupuesto

**Acción sugerida:**
1. Ir a configuración del Ad Set
2. Editar programación de anuncios
3. Pausar de 00:00 a 08:00

**Impacto esperado:**
• Ahorro: ~$${(ad.metrics.spend * 0.15).toLocaleString()} CLP/mes
• Mejora de CPR: 10-15%
    `.trim(),
    
    createdAt: new Date(),
    expiresAt: getExpirationDate()
  };
}

/**
 * Generate all suggestions from analysis
 */
export function generateSuggestions(analysis: FullAnalysis): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Generate suggestions for each ad
  for (const ad of analysis.allAds) {
    // Budget suggestions
    const scaleSuggestion = generateScaleBudgetSuggestion(ad);
    if (scaleSuggestion) suggestions.push(scaleSuggestion);
    
    const pauseSuggestion = generatePauseAdSuggestion(ad);
    if (pauseSuggestion) suggestions.push(pauseSuggestion);
    
    // Creative suggestions
    const creativeSuggestion = generateCreativeRefreshSuggestion(ad);
    if (creativeSuggestion) suggestions.push(creativeSuggestion);
    
    // Schedule suggestions
    const scheduleSuggestion = generateScheduleSuggestion(ad);
    if (scheduleSuggestion) suggestions.push(scheduleSuggestion);
  }
  
  // Generate global suggestions
  const consolidationSuggestion = generateConsolidationSuggestion(analysis);
  if (consolidationSuggestion) suggestions.push(consolidationSuggestion);
  
  // Sort by priority and confidence
  suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });
  
  return suggestions;
}

/**
 * Get summary of suggestions
 */
export function getSuggestionsSummary(suggestions: Suggestion[]): {
  total: number;
  byPriority: { high: number; medium: number; low: number };
  byType: Record<SuggestionType, number>;
  totalEstimatedProfit: number;
  totalEstimatedSavings: number;
} {
  const byPriority = { high: 0, medium: 0, low: 0 };
  const byType: Record<SuggestionType, number> = {
    budget: 0,
    audience: 0,
    creative: 0,
    schedule: 0,
    service: 0,
    objective: 0,
    placement: 0,
    device: 0,
    location: 0,
    strategy: 0
  };
  
  let totalEstimatedProfit = 0;
  let totalEstimatedSavings = 0;
  
  for (const suggestion of suggestions) {
    byPriority[suggestion.priority]++;
    byType[suggestion.type]++;
    totalEstimatedProfit += suggestion.impact.estimatedProfit || 0;
    totalEstimatedSavings += suggestion.impact.estimatedSavings || 0;
  }
  
  return {
    total: suggestions.length,
    byPriority,
    byType,
    totalEstimatedProfit,
    totalEstimatedSavings
  };
}
