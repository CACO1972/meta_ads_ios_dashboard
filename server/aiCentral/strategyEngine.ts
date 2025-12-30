/**
 * AI Central - Strategy Engine
 * Motor de estrategias globales multi-plataforma para Clínica Miró
 */

import { CLINICA_MIRO_SERVICES, ServiceDefinition, getServicesByPlatform } from '../data/clinicaMiroServices';

export interface PlatformStrategy {
  platform: 'meta' | 'tiktok' | 'google';
  budgetAllocation: number; // Percentage 0-100
  objective: string;
  targetAudience: {
    ageMin: number;
    ageMax: number;
    gender: 'all' | 'male' | 'female';
    locations: string[];
    interests: string[];
  };
  adFormats: string[];
  contentRecommendations: string[];
  expectedMetrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    cpr: number;
    roi: number;
  };
}

export interface GlobalStrategy {
  id: string;
  name: string;
  service: ServiceDefinition;
  totalBudget: number;
  duration: number; // days
  platforms: PlatformStrategy[];
  overallObjective: string;
  reasoning: string;
  expectedResults: {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    averageCPR: number;
    expectedROI: number;
    expectedRevenue: number;
  };
  contentCalendar: ContentCalendarItem[];
  productionGuide: ProductionGuideItem[];
}

export interface ContentCalendarItem {
  day: number;
  platform: 'meta' | 'tiktok' | 'google' | 'instagram' | 'youtube';
  contentType: string;
  description: string;
  bestTime: string;
}

export interface ProductionGuideItem {
  priority: 'high' | 'medium' | 'low';
  type: 'video' | 'photo' | 'testimonial' | 'educational';
  title: string;
  description: string;
  script?: string;
  shotList?: string[];
  duration?: number; // seconds
  equipment: string[];
  location: string;
}

// Platform-specific configurations
const PLATFORM_CONFIG = {
  meta: {
    name: 'Meta Ads (Facebook/Instagram)',
    strengths: ['Segmentación detallada', 'Retargeting', 'Audiencias similares', 'Formatos visuales'],
    bestFor: ['Awareness', 'Consideration', 'Conversions'],
    adFormats: ['Imagen', 'Video', 'Carrusel', 'Stories', 'Reels'],
    avgCPM: 8000, // CLP
    avgCTR: 0.015,
    avgConversionRate: 0.02,
  },
  tiktok: {
    name: 'TikTok Ads',
    strengths: ['Alcance joven', 'Contenido viral', 'Engagement alto', 'Tendencias'],
    bestFor: ['Awareness', 'Engagement', 'Brand Building'],
    adFormats: ['In-Feed Video', 'TopView', 'Branded Hashtag', 'Spark Ads'],
    avgCPM: 6000, // CLP
    avgCTR: 0.02,
    avgConversionRate: 0.015,
  },
  google: {
    name: 'Google Ads',
    strengths: ['Intención de búsqueda', 'Alta conversión', 'Remarketing', 'Local'],
    bestFor: ['Conversions', 'Lead Generation', 'Local Search'],
    adFormats: ['Search', 'Display', 'YouTube', 'Performance Max'],
    avgCPM: 12000, // CLP
    avgCTR: 0.03,
    avgConversionRate: 0.04,
  },
};

// Chilean communes by socioeconomic level
const COMMUNES_BY_LEVEL = {
  high: ['Las Condes', 'Vitacura', 'Lo Barnechea', 'Providencia', 'Ñuñoa'],
  'medium-high': ['La Reina', 'Peñalolén', 'Macul', 'San Miguel', 'Santiago Centro'],
  medium: ['Maipú', 'La Florida', 'Puente Alto', 'San Bernardo', 'Quilicura'],
};

/**
 * Generate a global multi-platform strategy for a service
 */
export function generateGlobalStrategy(
  service: ServiceDefinition,
  totalBudget: number,
  durationDays: number = 30
): GlobalStrategy {
  // Determine budget allocation based on service characteristics
  const budgetAllocation = calculateBudgetAllocation(service);
  
  // Generate platform-specific strategies
  const platforms: PlatformStrategy[] = [];
  
  if (budgetAllocation.meta > 0) {
    platforms.push(generateMetaStrategy(service, totalBudget * budgetAllocation.meta / 100, durationDays));
  }
  if (budgetAllocation.tiktok > 0) {
    platforms.push(generateTikTokStrategy(service, totalBudget * budgetAllocation.tiktok / 100, durationDays));
  }
  if (budgetAllocation.google > 0) {
    platforms.push(generateGoogleStrategy(service, totalBudget * budgetAllocation.google / 100, durationDays));
  }
  
  // Calculate expected results
  const expectedResults = calculateExpectedResults(platforms, service);
  
  // Generate content calendar
  const contentCalendar = generateContentCalendar(service, durationDays);
  
  // Generate production guide
  const productionGuide = generateProductionGuide(service);
  
  return {
    id: `strategy-${service.id}-${Date.now()}`,
    name: `Campaña Global: ${service.name}`,
    service,
    totalBudget,
    duration: durationDays,
    platforms,
    overallObjective: determineObjective(service),
    reasoning: generateStrategyReasoning(service, budgetAllocation),
    expectedResults,
    contentCalendar,
    productionGuide,
  };
}

function calculateBudgetAllocation(service: ServiceDefinition): { meta: number; tiktok: number; google: number } {
  const platforms = service.bestPlatforms;
  
  // Base allocation
  let meta = 0, tiktok = 0, google = 0;
  
  if (platforms.includes('meta')) meta = 40;
  if (platforms.includes('tiktok')) tiktok = 30;
  if (platforms.includes('google')) google = 30;
  
  // Adjust based on service characteristics
  if (service.category === 'Estética Facial') {
    // Estética facial performs better on visual platforms
    tiktok += 15;
    meta += 10;
    google -= 25;
  } else if (service.price > 1000000) {
    // High-value services need more consideration time
    google += 20;
    meta += 10;
    tiktok -= 30;
  } else if (service.targetAudience.ageMax < 35) {
    // Younger audience
    tiktok += 20;
    meta -= 10;
    google -= 10;
  }
  
  // Normalize to 100%
  const total = meta + tiktok + google;
  if (total > 0) {
    meta = Math.round(meta / total * 100);
    tiktok = Math.round(tiktok / total * 100);
    google = 100 - meta - tiktok;
  }
  
  return { meta: Math.max(0, meta), tiktok: Math.max(0, tiktok), google: Math.max(0, google) };
}

function generateMetaStrategy(service: ServiceDefinition, budget: number, days: number): PlatformStrategy {
  const config = PLATFORM_CONFIG.meta;
  const dailyBudget = budget / days;
  const impressions = Math.round(budget / config.avgCPM * 1000);
  const clicks = Math.round(impressions * config.avgCTR);
  const conversions = Math.round(clicks * config.avgConversionRate);
  
  return {
    platform: 'meta',
    budgetAllocation: Math.round(budget),
    objective: service.price > 500000 ? 'Conversiones' : 'Tráfico',
    targetAudience: {
      ageMin: service.targetAudience.ageMin,
      ageMax: service.targetAudience.ageMax,
      gender: service.targetAudience.gender,
      locations: getTargetLocations(service),
      interests: service.targetAudience.interests,
    },
    adFormats: ['Reels', 'Stories', 'Carrusel'],
    contentRecommendations: [
      'Videos cortos de antes/después',
      'Testimonios de pacientes',
      'Proceso del tratamiento',
      'Ofertas especiales',
    ],
    expectedMetrics: {
      impressions,
      clicks,
      conversions,
      cpr: conversions > 0 ? Math.round(budget / conversions) : 0,
      roi: conversions > 0 ? (conversions * service.ltv - budget) / budget : 0,
    },
  };
}

function generateTikTokStrategy(service: ServiceDefinition, budget: number, days: number): PlatformStrategy {
  const config = PLATFORM_CONFIG.tiktok;
  const impressions = Math.round(budget / config.avgCPM * 1000);
  const clicks = Math.round(impressions * config.avgCTR);
  const conversions = Math.round(clicks * config.avgConversionRate);
  
  return {
    platform: 'tiktok',
    budgetAllocation: Math.round(budget),
    objective: 'Awareness y Engagement',
    targetAudience: {
      ageMin: Math.max(18, service.targetAudience.ageMin),
      ageMax: Math.min(45, service.targetAudience.ageMax),
      gender: service.targetAudience.gender,
      locations: ['Santiago', 'Chile'],
      interests: [...service.targetAudience.interests, 'belleza', 'salud', 'bienestar'],
    },
    adFormats: ['In-Feed Video', 'Spark Ads'],
    contentRecommendations: [
      'Transformaciones dramáticas',
      'Tendencias y challenges',
      'Contenido educativo entretenido',
      'Behind the scenes',
      'POV del paciente',
    ],
    expectedMetrics: {
      impressions,
      clicks,
      conversions,
      cpr: conversions > 0 ? Math.round(budget / conversions) : 0,
      roi: conversions > 0 ? (conversions * service.ltv - budget) / budget : 0,
    },
  };
}

function generateGoogleStrategy(service: ServiceDefinition, budget: number, days: number): PlatformStrategy {
  const config = PLATFORM_CONFIG.google;
  const impressions = Math.round(budget / config.avgCPM * 1000);
  const clicks = Math.round(impressions * config.avgCTR);
  const conversions = Math.round(clicks * config.avgConversionRate);
  
  return {
    platform: 'google',
    budgetAllocation: Math.round(budget),
    objective: 'Conversiones',
    targetAudience: {
      ageMin: service.targetAudience.ageMin,
      ageMax: service.targetAudience.ageMax,
      gender: service.targetAudience.gender,
      locations: getTargetLocations(service),
      interests: service.keywords,
    },
    adFormats: ['Search', 'Performance Max'],
    contentRecommendations: [
      `Keywords principales: ${service.keywords.slice(0, 5).join(', ')}`,
      'Extensiones de ubicación y llamada',
      'Landing page optimizada',
      'Remarketing a visitantes del sitio',
    ],
    expectedMetrics: {
      impressions,
      clicks,
      conversions,
      cpr: conversions > 0 ? Math.round(budget / conversions) : 0,
      roi: conversions > 0 ? (conversions * service.ltv - budget) / budget : 0,
    },
  };
}

function getTargetLocations(service: ServiceDefinition): string[] {
  const levels = service.targetAudience.socioeconomic;
  const locations: string[] = [];
  
  for (const level of levels) {
    if (COMMUNES_BY_LEVEL[level as keyof typeof COMMUNES_BY_LEVEL]) {
      locations.push(...COMMUNES_BY_LEVEL[level as keyof typeof COMMUNES_BY_LEVEL]);
    }
  }
  
  return locations.length > 0 ? locations : ['Santiago', 'Región Metropolitana'];
}

function calculateExpectedResults(platforms: PlatformStrategy[], service: ServiceDefinition) {
  const totalImpressions = platforms.reduce((sum, p) => sum + p.expectedMetrics.impressions, 0);
  const totalClicks = platforms.reduce((sum, p) => sum + p.expectedMetrics.clicks, 0);
  const totalConversions = platforms.reduce((sum, p) => sum + p.expectedMetrics.conversions, 0);
  const totalBudget = platforms.reduce((sum, p) => sum + p.budgetAllocation, 0);
  
  return {
    totalImpressions,
    totalClicks,
    totalConversions,
    averageCPR: totalConversions > 0 ? Math.round(totalBudget / totalConversions) : 0,
    expectedROI: totalConversions > 0 ? (totalConversions * service.ltv - totalBudget) / totalBudget : 0,
    expectedRevenue: totalConversions * service.ltv,
  };
}

function determineObjective(service: ServiceDefinition): string {
  if (service.price > 1000000) {
    return 'Generación de leads calificados para tratamientos de alto valor';
  } else if (service.category === 'Estética Facial') {
    return 'Awareness y conversiones para servicios de estética';
  } else {
    return 'Tráfico y conversiones para servicios dentales';
  }
}

function generateStrategyReasoning(service: ServiceDefinition, allocation: { meta: number; tiktok: number; google: number }): string {
  let reasoning = `**Estrategia para ${service.name}**\n\n`;
  
  reasoning += `**Análisis del servicio:**\n`;
  reasoning += `- Precio: $${service.price.toLocaleString('es-CL')} CLP\n`;
  reasoning += `- LTV estimado: $${service.ltv.toLocaleString('es-CL')} CLP\n`;
  reasoning += `- CPR objetivo: $${service.cprTarget.toLocaleString('es-CL')} CLP\n`;
  reasoning += `- Audiencia: ${service.targetAudience.ageMin}-${service.targetAudience.ageMax} años, ${service.targetAudience.gender === 'all' ? 'todos los géneros' : service.targetAudience.gender}\n\n`;
  
  reasoning += `**Distribución de presupuesto:**\n`;
  if (allocation.meta > 0) reasoning += `- Meta Ads: ${allocation.meta}% - Ideal para segmentación precisa y retargeting\n`;
  if (allocation.tiktok > 0) reasoning += `- TikTok Ads: ${allocation.tiktok}% - Excelente para awareness y contenido viral\n`;
  if (allocation.google > 0) reasoning += `- Google Ads: ${allocation.google}% - Captura intención de búsqueda activa\n\n`;
  
  reasoning += `**Justificación:**\n`;
  if (service.category === 'Estética Facial') {
    reasoning += `Los servicios de estética facial tienen alto potencial en plataformas visuales. TikTok es especialmente efectivo para mostrar transformaciones y resultados inmediatos que generan engagement viral.`;
  } else if (service.price > 1000000) {
    reasoning += `Para tratamientos de alto valor como ${service.name}, priorizamos Google Ads para capturar búsquedas con alta intención de compra, complementado con Meta para nurturing y remarketing.`;
  } else {
    reasoning += `Este servicio se beneficia de una estrategia balanceada entre awareness (Meta/TikTok) y captura de demanda (Google).`;
  }
  
  return reasoning;
}

function generateContentCalendar(service: ServiceDefinition, days: number): ContentCalendarItem[] {
  const calendar: ContentCalendarItem[] = [];
  const contentTypes = getContentTypesForService(service);
  
  for (let day = 1; day <= Math.min(days, 14); day++) {
    const dayOfWeek = day % 7;
    
    // Meta/Instagram content
    if (service.bestPlatforms.includes('meta')) {
      calendar.push({
        day,
        platform: dayOfWeek % 2 === 0 ? 'instagram' : 'meta',
        contentType: contentTypes[day % contentTypes.length],
        description: `${contentTypes[day % contentTypes.length]} de ${service.name}`,
        bestTime: dayOfWeek < 5 ? '18:00-20:00' : '10:00-12:00',
      });
    }
    
    // TikTok content (3x per week)
    if (service.bestPlatforms.includes('tiktok') && day % 2 === 0) {
      calendar.push({
        day,
        platform: 'tiktok',
        contentType: 'Video corto',
        description: `Transformación o tip sobre ${service.name}`,
        bestTime: '19:00-21:00',
      });
    }
  }
  
  return calendar;
}

function getContentTypesForService(service: ServiceDefinition): string[] {
  if (service.category === 'Estética Facial') {
    return ['Antes/Después', 'Proceso en vivo', 'Testimonial', 'Tips de cuidado', 'FAQ'];
  } else if (service.subcategory === 'Ortodoncia') {
    return ['Transformación', 'Día a día', 'Tips', 'Comparativa', 'Testimonial'];
  } else {
    return ['Educativo', 'Testimonial', 'Proceso', 'Antes/Después', 'FAQ'];
  }
}

function generateProductionGuide(service: ServiceDefinition): ProductionGuideItem[] {
  const guides: ProductionGuideItem[] = [];
  
  // Video testimonial
  guides.push({
    priority: 'high',
    type: 'testimonial',
    title: `Testimonial: Paciente de ${service.name}`,
    description: `Video de paciente real compartiendo su experiencia con ${service.name}`,
    script: generateTestimonialScript(service),
    shotList: [
      'Paciente hablando a cámara (plano medio)',
      'B-roll del procedimiento',
      'Antes y después',
      'Paciente sonriendo/resultado final',
    ],
    duration: 60,
    equipment: ['Smartphone con buena cámara', 'Ring light', 'Micrófono lavalier'],
    location: 'Consultorio o sala de espera',
  });
  
  // Transformation video
  guides.push({
    priority: 'high',
    type: 'video',
    title: `Transformación: ${service.name}`,
    description: `Video mostrando el antes y después del tratamiento`,
    script: generateTransformationScript(service),
    shotList: [
      'Close-up del área a tratar (antes)',
      'Proceso del tratamiento (time-lapse)',
      'Resultado inmediato',
      'Paciente reaccionando al resultado',
    ],
    duration: 30,
    equipment: ['Smartphone', 'Trípode', 'Buena iluminación'],
    location: 'Consultorio',
  });
  
  // Educational content
  guides.push({
    priority: 'medium',
    type: 'educational',
    title: `¿Qué es ${service.name}?`,
    description: `Video educativo explicando el tratamiento`,
    script: generateEducationalScript(service),
    shotList: [
      'Doctor hablando a cámara',
      'Gráficos o animaciones explicativas',
      'Demostración con modelo/paciente',
    ],
    duration: 90,
    equipment: ['Cámara profesional o smartphone', 'Micrófono', 'Iluminación de estudio'],
    location: 'Consultorio o set preparado',
  });
  
  return guides;
}

function generateTestimonialScript(service: ServiceDefinition): string {
  return `**GUIÓN: Testimonial ${service.name}**

[INTRO - 5 segundos]
Paciente: "Hola, soy [Nombre] y quiero contarles mi experiencia en Clínica Miró."

[PROBLEMA - 10 segundos]
"Hace [tiempo], tenía [problema relacionado al servicio]. Me sentía [emoción negativa]."

[SOLUCIÓN - 15 segundos]
"Llegué a Clínica Miró y el equipo me explicó todo sobre ${service.name}. El proceso fue [descripción positiva]."

[RESULTADO - 20 segundos]
"Ahora [beneficio obtenido]. Me siento [emoción positiva]. Lo recomiendo totalmente."

[CALL TO ACTION - 10 segundos]
"Si estás pensando en hacerte ${service.name}, no lo dudes. Agenda tu hora en Clínica Miró."

---
NOTAS DE PRODUCCIÓN:
- Grabar en ambiente tranquilo
- Paciente debe verse natural, no actuado
- Incluir consentimiento firmado
- Mostrar antes/después si es posible`;
}

function generateTransformationScript(service: ServiceDefinition): string {
  return `**GUIÓN: Transformación ${service.name}**

[HOOK - 3 segundos]
Texto en pantalla: "Mira esta transformación increíble 😱"

[ANTES - 5 segundos]
- Mostrar área a tratar
- Texto: "ANTES"

[PROCESO - 10 segundos]
- Time-lapse del procedimiento
- Música trending de fondo
- Texto: "El proceso..."

[DESPUÉS - 7 segundos]
- Resultado final
- Texto: "DESPUÉS ✨"
- Reacción del paciente

[CTA - 5 segundos]
Texto: "¿Quieres tu transformación? 📍 Clínica Miró"
Logo y contacto

---
NOTAS:
- Video vertical (9:16) para TikTok/Reels
- Usar música trending
- Transiciones rápidas
- Colores vibrantes`;
}

function generateEducationalScript(service: ServiceDefinition): string {
  return `**GUIÓN: Educativo ${service.name}**

[INTRO - 10 segundos]
Doctor: "Hola, soy [Nombre], [especialidad] de Clínica Miró. Hoy les voy a explicar todo sobre ${service.name}."

[¿QUÉ ES? - 20 segundos]
"${service.name} es un tratamiento que [explicación simple del procedimiento]. Es ideal para personas que [perfil del paciente ideal]."

[BENEFICIOS - 20 segundos]
"Los principales beneficios son:
1. [Beneficio 1]
2. [Beneficio 2]
3. [Beneficio 3]"

[PROCESO - 20 segundos]
"El procedimiento consiste en [pasos simplificados]. Dura aproximadamente [tiempo] y [información sobre dolor/recuperación]."

[PREGUNTAS FRECUENTES - 15 segundos]
"La pregunta más común es [pregunta]. La respuesta es [respuesta]."

[CTA - 5 segundos]
"Si tienes más preguntas, agenda una evaluación gratuita en Clínica Miró. Link en la bio."

---
NOTAS:
- Tono profesional pero cercano
- Usar gráficos para explicar
- Subtítulos siempre`;
}

// Export utility functions
export { PLATFORM_CONFIG, COMMUNES_BY_LEVEL };
