/**
 * Report Service
 * 
 * Generates comprehensive reports from Meta Ads campaign data
 * Calculates key metrics: CPR, ROAS, CTR, Conversion Rate, etc.
 */

interface CampaignData {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  reach: number;
  frequency: number;
  cpr: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

interface ReportSummary {
  period: {
    start: string;
    end: string;
    days: number;
  };
  totals: {
    campaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalResults: number;
    totalReach: number;
  };
  averages: {
    avgCPR: number;
    avgCTR: number;
    avgCPC: number;
    avgCPM: number;
    avgFrequency: number;
  };
  topPerformers: {
    bestCPR: CampaignData | null;
    worstCPR: CampaignData | null;
    highestSpend: CampaignData | null;
    mostResults: CampaignData | null;
  };
  byObjective: Record<string, {
    campaigns: number;
    spend: number;
    results: number;
    avgCPR: number;
  }>;
}

interface ComparisonReport extends ReportSummary {
  comparison: {
    spendChange: number;
    resultsChange: number;
    cprChange: number;
    ctrChange: number;
  };
}

/**
 * Calculate key metrics from raw campaign data
 */
export function calculateMetrics(campaigns: any[]): CampaignData[] {
  return campaigns.map(campaign => {
    const spend = parseFloat(campaign.spend || 0);
    const impressions = parseInt(campaign.impressions || 0);
    const clicks = parseInt(campaign.clicks || 0);
    const results = parseInt(campaign.results || 0);
    const reach = parseInt(campaign.reach || 0);
    
    // Calculate derived metrics
    const cpr = results > 0 ? spend / results : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const frequency = reach > 0 ? impressions / reach : 0;
    
    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective || 'UNKNOWN',
      spend,
      impressions,
      clicks,
      results,
      reach,
      frequency,
      cpr,
      ctr,
      cpc,
      cpm,
    };
  });
}

/**
 * Generate summary report from campaign data
 */
export function generateSummaryReport(
  campaigns: CampaignData[],
  startDate: string,
  endDate: string
): ReportSummary {
  // Calculate totals
  const totals = campaigns.reduce(
    (acc, campaign) => ({
      campaigns: acc.campaigns + 1,
      activeCampaigns: acc.activeCampaigns + (campaign.status === 'ACTIVE' ? 1 : 0),
      totalSpend: acc.totalSpend + campaign.spend,
      totalImpressions: acc.totalImpressions + campaign.impressions,
      totalClicks: acc.totalClicks + campaign.clicks,
      totalResults: acc.totalResults + campaign.results,
      totalReach: acc.totalReach + campaign.reach,
    }),
    {
      campaigns: 0,
      activeCampaigns: 0,
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalResults: 0,
      totalReach: 0,
    }
  );
  
  // Calculate averages
  const avgCPR = totals.totalResults > 0 ? totals.totalSpend / totals.totalResults : 0;
  const avgCTR = totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0;
  const avgCPC = totals.totalClicks > 0 ? totals.totalSpend / totals.totalClicks : 0;
  const avgCPM = totals.totalImpressions > 0 ? (totals.totalSpend / totals.totalImpressions) * 1000 : 0;
  const avgFrequency = totals.totalReach > 0 ? totals.totalImpressions / totals.totalReach : 0;
  
  // Find top performers
  const sortedByCPR = [...campaigns].filter(c => c.results > 0).sort((a, b) => a.cpr - b.cpr);
  const sortedBySpend = [...campaigns].sort((a, b) => b.spend - a.spend);
  const sortedByResults = [...campaigns].sort((a, b) => b.results - a.results);
  
  const topPerformers = {
    bestCPR: sortedByCPR[0] || null,
    worstCPR: sortedByCPR[sortedByCPR.length - 1] || null,
    highestSpend: sortedBySpend[0] || null,
    mostResults: sortedByResults[0] || null,
  };
  
  // Group by objective
  const byObjective: Record<string, { campaigns: number; spend: number; results: number; avgCPR: number }> = {};
  
  campaigns.forEach(campaign => {
    const obj = campaign.objective;
    if (!byObjective[obj]) {
      byObjective[obj] = { campaigns: 0, spend: 0, results: 0, avgCPR: 0 };
    }
    byObjective[obj].campaigns++;
    byObjective[obj].spend += campaign.spend;
    byObjective[obj].results += campaign.results;
  });
  
  // Calculate avgCPR for each objective
  Object.keys(byObjective).forEach(obj => {
    const data = byObjective[obj];
    data.avgCPR = data.results > 0 ? data.spend / data.results : 0;
  });
  
  // Calculate period days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    period: {
      start: startDate,
      end: endDate,
      days,
    },
    totals,
    averages: {
      avgCPR,
      avgCTR,
      avgCPC,
      avgCPM,
      avgFrequency,
    },
    topPerformers,
    byObjective,
  };
}

/**
 * Generate comparison report between two periods
 */
export function generateComparisonReport(
  currentCampaigns: CampaignData[],
  previousCampaigns: CampaignData[],
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string
): ComparisonReport {
  const currentReport = generateSummaryReport(currentCampaigns, currentStart, currentEnd);
  const previousReport = generateSummaryReport(previousCampaigns, previousStart, previousEnd);
  
  // Calculate percentage changes
  const spendChange = previousReport.totals.totalSpend > 0
    ? ((currentReport.totals.totalSpend - previousReport.totals.totalSpend) / previousReport.totals.totalSpend) * 100
    : 0;
  
  const resultsChange = previousReport.totals.totalResults > 0
    ? ((currentReport.totals.totalResults - previousReport.totals.totalResults) / previousReport.totals.totalResults) * 100
    : 0;
  
  const cprChange = previousReport.averages.avgCPR > 0
    ? ((currentReport.averages.avgCPR - previousReport.averages.avgCPR) / previousReport.averages.avgCPR) * 100
    : 0;
  
  const ctrChange = previousReport.averages.avgCTR > 0
    ? ((currentReport.averages.avgCTR - previousReport.averages.avgCTR) / previousReport.averages.avgCTR) * 100
    : 0;
  
  return {
    ...currentReport,
    comparison: {
      spendChange,
      resultsChange,
      cprChange,
      ctrChange,
    },
  };
}

/**
 * Format currency for reports (Chilean Pesos)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for reports
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CL').format(value);
}

export const reportService = {
  calculateMetrics,
  generateSummaryReport,
  generateComparisonReport,
  formatCurrency,
  formatPercentage,
  formatNumber,
};
