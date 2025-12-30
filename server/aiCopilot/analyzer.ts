/**
 * AI Co-Pilot Campaign Analyzer
 * Analyzes campaigns and detects optimization opportunities
 */

// Service definitions with pricing (from Clínica Miró data)
export const SERVICES = [
  {
    name: 'All on Four',
    price: 1850000,
    ltv: 2220000,
    cprTarget: 33300,  // 1.5% of LTV
    cprMax: 66600,     // 3% of LTV
    roiMin: 5,
    keywords: ['all on four', 'all-on-4', 'allon4', 'protesis fija', 'dientes fijos']
  },
  {
    name: 'Estética Facial',
    price: 1500000,
    ltv: 1800000,
    cprTarget: 27000,
    cprMax: 54000,
    roiMin: 5,
    keywords: ['estetica facial', 'botox', 'rellenos', 'acido hialuronico', 'facial']
  },
  {
    name: 'Ortodoncia',
    price: 950000,
    ltv: 1140000,
    cprTarget: 17100,
    cprMax: 34200,
    roiMin: 5,
    keywords: ['ortodoncia', 'brackets', 'invisalign', 'alineadores', 'frenillos']
  },
  {
    name: 'Implante Dental',
    price: 850000,
    ltv: 1020000,
    cprTarget: 15300,
    cprMax: 30600,
    roiMin: 5,
    keywords: ['implante', 'implant', 'dental implant', 'titanio']
  },
  {
    name: 'Carillas',
    price: 320000,
    ltv: 384000,
    cprTarget: 5760,
    cprMax: 11520,
    roiMin: 5,
    keywords: ['carillas', 'carilla', 'veneer', 'sonrisa', 'diseño de sonrisa']
  },
  {
    name: 'Caries Incipiente',
    price: 180000,
    ltv: 216000,
    cprTarget: 3240,
    cprMax: 6480,
    roiMin: 5,
    keywords: ['caries', 'limpieza', 'profilaxis', 'blanqueamiento']
  }
];

export interface ServiceType {
  name: string;
  price: number;
  ltv: number;
  cprTarget: number;
  cprMax: number;
  roiMin: number;
  keywords: string[];
}

// Default service for unmatched ads
export const DEFAULT_SERVICE: ServiceType = {
  name: 'General',
  price: 500000,
  ltv: 600000,
  cprTarget: 9000,
  cprMax: 18000,
  roiMin: 5,
  keywords: [] as string[]
};

export type CPRStatus = 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
export type ROIStatus = 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
export type TrendDirection = 'improving' | 'stable' | 'declining';

export interface AdMetrics {
  spend: number;
  results: number;
  cpr: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  frequency: number;
  reach: number;
}

export interface AdAnalysis {
  adId: string;
  adName: string;
  campaignId: string;
  campaignName: string;
  adsetId: string;
  adsetName: string;
  status: string;
  
  // Service mapping
  service: ServiceType;
  
  // Current metrics
  metrics: AdMetrics;
  
  // Calculated values
  roi: number;
  roiStatus: ROIStatus;
  cprStatus: CPRStatus;
  
  // Trends (if historical data available)
  trends?: {
    cprTrend: TrendDirection;
    roiTrend: TrendDirection;
    spendTrend: TrendDirection;
  };
  
  // Issues detected
  issues: string[];
  
  // Opportunities detected
  opportunities: string[];
  
  // Score (0-100)
  score: number;
}

export interface CampaignAnalysis {
  campaignId: string;
  campaignName: string;
  status: string;
  objective: string;
  
  // Aggregated metrics
  totalSpend: number;
  totalResults: number;
  avgCPR: number;
  avgROI: number;
  
  // Ad analyses
  ads: AdAnalysis[];
  
  // Campaign-level issues
  issues: string[];
  
  // Campaign-level opportunities
  opportunities: string[];
}

export interface FullAnalysis {
  timestamp: Date;
  accountId: string;
  
  // Summary
  totalCampaigns: number;
  totalAds: number;
  totalSpend: number;
  totalResults: number;
  avgCPR: number;
  avgROI: number;
  
  // Campaigns
  campaigns: CampaignAnalysis[];
  
  // All ads (flat list for easy access)
  allAds: AdAnalysis[];
  
  // Top performers
  topPerformers: AdAnalysis[];
  
  // Worst performers
  worstPerformers: AdAnalysis[];
  
  // Global issues
  globalIssues: string[];
  
  // Global opportunities
  globalOpportunities: string[];
}

/**
 * Match an ad to a service based on its name
 */
export function matchAdToService(adName: string): ServiceType {
  const lowerName = adName.toLowerCase();
  
  for (const service of SERVICES) {
    for (const keyword of service.keywords) {
      if (lowerName.includes(keyword.toLowerCase())) {
        return service;
      }
    }
  }
  
  return DEFAULT_SERVICE;
}

/**
 * Calculate ROI for an ad
 */
export function calculateROI(results: number, spend: number, ltv: number): number {
  if (spend === 0) return 0;
  const revenue = results * ltv;
  return revenue / spend;
}

/**
 * Get CPR status based on service thresholds
 */
export function getCPRStatus(cpr: number, service: ServiceType): CPRStatus {
  if (cpr <= service.cprTarget * 0.5) return 'excellent';
  if (cpr <= service.cprTarget) return 'good';
  if (cpr <= service.cprMax * 0.75) return 'acceptable';
  if (cpr <= service.cprMax) return 'poor';
  return 'critical';
}

/**
 * Get ROI status
 */
export function getROIStatus(roi: number, minROI: number): ROIStatus {
  if (roi >= minROI * 2) return 'excellent';
  if (roi >= minROI * 1.5) return 'good';
  if (roi >= minROI) return 'acceptable';
  if (roi >= minROI * 0.5) return 'poor';
  return 'critical';
}

/**
 * Calculate ad score (0-100)
 */
export function calculateAdScore(ad: Partial<AdAnalysis>): number {
  let score = 50; // Base score
  
  // CPR impact (max ±30 points)
  if (ad.cprStatus === 'excellent') score += 30;
  else if (ad.cprStatus === 'good') score += 20;
  else if (ad.cprStatus === 'acceptable') score += 5;
  else if (ad.cprStatus === 'poor') score -= 15;
  else if (ad.cprStatus === 'critical') score -= 30;
  
  // ROI impact (max ±20 points)
  if (ad.roiStatus === 'excellent') score += 20;
  else if (ad.roiStatus === 'good') score += 15;
  else if (ad.roiStatus === 'acceptable') score += 5;
  else if (ad.roiStatus === 'poor') score -= 10;
  else if (ad.roiStatus === 'critical') score -= 20;
  
  // Frequency impact (max ±10 points)
  const frequency = ad.metrics?.frequency || 0;
  if (frequency > 0 && frequency < 2) score += 10;
  else if (frequency >= 2 && frequency < 3) score += 5;
  else if (frequency >= 3 && frequency < 4) score -= 5;
  else if (frequency >= 4) score -= 10;
  
  // CTR impact (max ±10 points)
  const ctr = ad.metrics?.ctr || 0;
  if (ctr >= 3) score += 10;
  else if (ctr >= 2) score += 5;
  else if (ctr >= 1) score += 0;
  else if (ctr < 0.5) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Detect issues for an ad
 */
export function detectAdIssues(ad: Partial<AdAnalysis>): string[] {
  const issues: string[] = [];
  
  // CPR issues
  if (ad.cprStatus === 'critical') {
    issues.push(`CPR crítico: $${ad.metrics?.cpr?.toFixed(2)} supera el máximo $${ad.service?.cprMax}`);
  } else if (ad.cprStatus === 'poor') {
    issues.push(`CPR alto: $${ad.metrics?.cpr?.toFixed(2)} cerca del máximo $${ad.service?.cprMax}`);
  }
  
  // ROI issues
  if (ad.roiStatus === 'critical') {
    issues.push(`ROI crítico: ${ad.roi?.toFixed(2)}x por debajo del mínimo ${ad.service?.roiMin}x`);
  } else if (ad.roiStatus === 'poor') {
    issues.push(`ROI bajo: ${ad.roi?.toFixed(2)}x cerca del mínimo ${ad.service?.roiMin}x`);
  }
  
  // Frequency issues
  const frequency = ad.metrics?.frequency || 0;
  if (frequency >= 4) {
    issues.push(`Frecuencia muy alta: ${frequency.toFixed(1)} (audiencia saturada)`);
  } else if (frequency >= 3.5) {
    issues.push(`Frecuencia alta: ${frequency.toFixed(1)} (riesgo de fatiga)`);
  }
  
  // CTR issues
  const ctr = ad.metrics?.ctr || 0;
  if (ctr < 0.5) {
    issues.push(`CTR muy bajo: ${ctr.toFixed(2)}% (creativo poco atractivo)`);
  }
  
  // No results
  if ((ad.metrics?.spend || 0) > 50000 && (ad.metrics?.results || 0) === 0) {
    issues.push(`Sin resultados: $${ad.metrics?.spend?.toFixed(0)} gastados sin conversiones`);
  }
  
  return issues;
}

/**
 * Detect opportunities for an ad
 */
export function detectAdOpportunities(ad: Partial<AdAnalysis>): string[] {
  const opportunities: string[] = [];
  
  // Excellent CPR - scaling opportunity
  if (ad.cprStatus === 'excellent') {
    opportunities.push(`CPR excelente: $${ad.metrics?.cpr?.toFixed(2)} muy por debajo del objetivo $${ad.service?.cprTarget} - oportunidad de escalar`);
  }
  
  // High ROI - scaling opportunity
  if (ad.roiStatus === 'excellent') {
    opportunities.push(`ROI excelente: ${ad.roi?.toFixed(2)}x - oportunidad de aumentar presupuesto`);
  }
  
  // Low frequency - room to scale
  const frequency = ad.metrics?.frequency || 0;
  if (frequency > 0 && frequency < 2) {
    opportunities.push(`Frecuencia baja: ${frequency.toFixed(1)} - audiencia no saturada, puede escalar`);
  }
  
  // High CTR - engaging creative
  const ctr = ad.metrics?.ctr || 0;
  if (ctr >= 3) {
    opportunities.push(`CTR alto: ${ctr.toFixed(2)}% - creativo muy efectivo, crear variaciones`);
  }
  
  // Good performer with low spend
  if (ad.score && ad.score >= 70 && (ad.metrics?.spend || 0) < 100000) {
    opportunities.push(`Alto rendimiento con bajo gasto: score ${ad.score}/100 - aumentar inversión`);
  }
  
  return opportunities;
}

/**
 * Analyze ads data from Meta Ads API
 */
export function analyzeAdsData(
  ads: Array<{
    id: string;
    name?: string;
    status?: string;
    campaign_id?: string;
    campaign?: { name?: string };
    adset_id?: string;
    adset?: { name?: string };
  }>,
  insights: Array<{
    ad_id?: string;
    ad_name?: string;
    spend?: string;
    impressions?: string;
    clicks?: string;
    actions?: Array<{ action_type: string; value: string }>;
    ctr?: string;
    frequency?: string;
    reach?: string;
  }>,
  campaigns: Array<{
    id: string;
    name?: string;
    status?: string;
    objective?: string;
  }>,
  accountId: string
): FullAnalysis {
  const timestamp = new Date();
  
  // Create insights map by ad_id
  const insightsMap = new Map<string, typeof insights[0]>();
  for (const insight of insights) {
    if (insight.ad_id) {
      insightsMap.set(insight.ad_id, insight);
    }
  }
  
  // Analyze each ad
  const allAds: AdAnalysis[] = [];
  
  for (const ad of ads) {
    const insight = insightsMap.get(ad.id) || {};
    const service = matchAdToService(ad.name || '');
    
    const spend = parseFloat(insight.spend || '0');
    const results = parseInt(insight.actions?.find((a) => 
      ['lead', 'omni_complete_registration', 'contact_total', 'onsite_conversion.messaging_conversation_started_7d'].includes(a.action_type)
    )?.value || '0');
    const impressions = parseInt(insight.impressions || '0');
    const clicks = parseInt(insight.clicks || '0');
    const reach = parseInt(insight.reach || '0');
    
    const cpr = results > 0 ? spend / results : spend > 0 ? spend : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const frequency = reach > 0 ? impressions / reach : 0;
    
    const roi = calculateROI(results, spend, service.ltv);
    const cprStatus = getCPRStatus(cpr, service);
    const roiStatus = getROIStatus(roi, service.roiMin);
    
    const adAnalysis: AdAnalysis = {
      adId: ad.id,
      adName: ad.name || 'Sin nombre',
      campaignId: ad.campaign_id || '',
      campaignName: ad.campaign?.name || 'Sin campaña',
      adsetId: ad.adset_id || '',
      adsetName: ad.adset?.name || 'Sin adset',
      status: ad.status || 'UNKNOWN',
      service,
      metrics: {
        spend,
        results,
        cpr,
        impressions,
        clicks,
        ctr,
        cpc,
        frequency,
        reach
      },
      roi,
      roiStatus,
      cprStatus,
      issues: [],
      opportunities: [],
      score: 0
    };
    
    // Detect issues and opportunities
    adAnalysis.issues = detectAdIssues(adAnalysis);
    adAnalysis.opportunities = detectAdOpportunities(adAnalysis);
    adAnalysis.score = calculateAdScore(adAnalysis);
    
    allAds.push(adAnalysis);
  }
  
  // Sort by score
  allAds.sort((a, b) => b.score - a.score);
  
  // Group by campaign
  const campaignMap = new Map<string, CampaignAnalysis>();
  
  for (const ad of allAds) {
    if (!campaignMap.has(ad.campaignId)) {
      const campaign = campaigns.find((c) => c.id === ad.campaignId);
      campaignMap.set(ad.campaignId, {
        campaignId: ad.campaignId,
        campaignName: ad.campaignName,
        status: campaign?.status || 'UNKNOWN',
        objective: campaign?.objective || 'UNKNOWN',
        totalSpend: 0,
        totalResults: 0,
        avgCPR: 0,
        avgROI: 0,
        ads: [],
        issues: [],
        opportunities: []
      });
    }
    
    const campaignAnalysis = campaignMap.get(ad.campaignId)!;
    campaignAnalysis.ads.push(ad);
    campaignAnalysis.totalSpend += ad.metrics.spend;
    campaignAnalysis.totalResults += ad.metrics.results;
  }
  
  // Calculate campaign-level metrics
  const campaignAnalyses: CampaignAnalysis[] = [];
  campaignMap.forEach((campaign) => {
    campaign.avgCPR = campaign.totalResults > 0 ? campaign.totalSpend / campaign.totalResults : 0;
    
    // Calculate weighted average ROI
    let totalWeightedROI = 0;
    let totalWeight = 0;
    for (const ad of campaign.ads) {
      if (ad.metrics.spend > 0) {
        totalWeightedROI += ad.roi * ad.metrics.spend;
        totalWeight += ad.metrics.spend;
      }
    }
    campaign.avgROI = totalWeight > 0 ? totalWeightedROI / totalWeight : 0;
    
    // Detect campaign-level issues
    if (campaign.ads.length > 5) {
      campaign.issues.push(`Fragmentación: ${campaign.ads.length} anuncios en una campaña dificulta optimización`);
    }
    
    const lowPerformers = campaign.ads.filter((a: AdAnalysis) => a.score < 40);
    if (lowPerformers.length > campaign.ads.length * 0.5) {
      campaign.issues.push(`${lowPerformers.length}/${campaign.ads.length} anuncios con bajo rendimiento`);
    }
    
    // Detect campaign-level opportunities
    const highPerformers = campaign.ads.filter((a: AdAnalysis) => a.score >= 70);
    if (highPerformers.length > 0) {
      campaign.opportunities.push(`${highPerformers.length} anuncios con alto rendimiento - oportunidad de escalar`);
    }
    
    campaignAnalyses.push(campaign);
  });
  
  // Calculate global metrics
  const totalSpend = allAds.reduce((sum, ad) => sum + ad.metrics.spend, 0);
  const totalResults = allAds.reduce((sum, ad) => sum + ad.metrics.results, 0);
  const avgCPR = totalResults > 0 ? totalSpend / totalResults : 0;
  
  let totalWeightedROI = 0;
  let totalWeight = 0;
  for (const ad of allAds) {
    if (ad.metrics.spend > 0) {
      totalWeightedROI += ad.roi * ad.metrics.spend;
      totalWeight += ad.metrics.spend;
    }
  }
  const avgROI = totalWeight > 0 ? totalWeightedROI / totalWeight : 0;
  
  // Top and worst performers
  const activeAds = allAds.filter((a) => a.status === 'ACTIVE' && a.metrics.spend > 0);
  const topPerformers = activeAds.slice(0, 5);
  const worstPerformers = [...activeAds].sort((a, b) => a.score - b.score).slice(0, 5);
  
  // Global issues
  const globalIssues: string[] = [];
  if (campaignAnalyses.length > 5) {
    globalIssues.push(`Fragmentación de campañas: ${campaignAnalyses.length} campañas activas dificultan el aprendizaje del algoritmo`);
  }
  
  const criticalAds = allAds.filter((a) => a.cprStatus === 'critical' && a.status === 'ACTIVE');
  if (criticalAds.length > 0) {
    globalIssues.push(`${criticalAds.length} anuncios activos con CPR crítico requieren atención inmediata`);
  }
  
  // Global opportunities
  const globalOpportunities: string[] = [];
  const excellentAds = allAds.filter((a) => a.cprStatus === 'excellent' && a.status === 'ACTIVE');
  if (excellentAds.length > 0) {
    globalOpportunities.push(`${excellentAds.length} anuncios con CPR excelente - oportunidad de escalar agresivamente`);
  }
  
  return {
    timestamp,
    accountId,
    totalCampaigns: campaignAnalyses.length,
    totalAds: allAds.length,
    totalSpend,
    totalResults,
    avgCPR,
    avgROI,
    campaigns: campaignAnalyses,
    allAds,
    topPerformers,
    worstPerformers,
    globalIssues,
    globalOpportunities
  };
}
