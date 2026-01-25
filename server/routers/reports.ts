/**
 * Reports Router
 * 
 * tRPC endpoints for generating and retrieving campaign reports
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { reportService } from "../services/reportService";
import { getDb } from "../db";
import { metaAdsCredentials } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Fetch campaigns from Meta Ads API
 */
async function fetchCampaignsFromMeta(
  accessToken: string,
  adAccountId: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const fields = [
    'id',
    'name',
    'status',
    'objective',
    'insights.time_range({since:\'' + startDate + '\',until:\'' + endDate + '\'}).fields(spend,impressions,clicks,actions,reach,frequency)',
  ].join(',');
  
  const url = `${META_API_BASE}/act_${adAccountId}/campaigns?fields=${fields}&access_token=${accessToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Meta API error: ${data.error.message}`);
  }
  
  // Transform data to include insights
  return (data.data || []).map((campaign: any) => {
    const insights = campaign.insights?.data?.[0] || {};
    const actions = insights.actions || [];
    
    // Find results based on objective
    let results = 0;
    const resultAction = actions.find((a: any) => 
      a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
      a.action_type === 'link_click' ||
      a.action_type === 'post_engagement' ||
      a.action_type === 'onsite_conversion.post_save'
    );
    if (resultAction) {
      results = parseInt(resultAction.value || 0);
    }
    
    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      spend: insights.spend || 0,
      impressions: insights.impressions || 0,
      clicks: insights.clicks || 0,
      results,
      reach: insights.reach || 0,
      frequency: insights.frequency || 0,
    };
  });
}

export const reportsRouter = router({
  /**
   * Get campaign summary report for a date range
   */
  getSummary: protectedProcedure
    .input(z.object({
      startDate: z.string(), // YYYY-MM-DD
      endDate: z.string(),   // YYYY-MM-DD
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get user's Meta Ads credentials
      const credentials = await db
        .select()
        .from(metaAdsCredentials)
        .where(eq(metaAdsCredentials.userId, ctx.user.id))
        .limit(1);
      
      if (credentials.length === 0) {
        throw new Error("Meta Ads credentials not found. Please configure API access first.");
      }
      
      const { accessToken, adAccountId } = credentials[0];
      
      // Fetch campaigns from Meta API
      const rawCampaigns = await fetchCampaignsFromMeta(
        accessToken,
        adAccountId,
        input.startDate,
        input.endDate
      );
      
      // Calculate metrics
      const campaigns = reportService.calculateMetrics(rawCampaigns);
      
      // Generate summary report
      const report = reportService.generateSummaryReport(
        campaigns,
        input.startDate,
        input.endDate
      );
      
      return report;
    }),
  
  /**
   * Get comparison report between two periods
   */
  getComparison: protectedProcedure
    .input(z.object({
      currentStart: z.string(),
      currentEnd: z.string(),
      previousStart: z.string(),
      previousEnd: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get user's Meta Ads credentials
      const credentials = await db
        .select()
        .from(metaAdsCredentials)
        .where(eq(metaAdsCredentials.userId, ctx.user.id))
        .limit(1);
      
      if (credentials.length === 0) {
        throw new Error("Meta Ads credentials not found. Please configure API access first.");
      }
      
      const { accessToken, adAccountId } = credentials[0];
      
      // Fetch campaigns for both periods
      const [currentRaw, previousRaw] = await Promise.all([
        fetchCampaignsFromMeta(accessToken, adAccountId, input.currentStart, input.currentEnd),
        fetchCampaignsFromMeta(accessToken, adAccountId, input.previousStart, input.previousEnd),
      ]);
      
      // Calculate metrics
      const currentCampaigns = reportService.calculateMetrics(currentRaw);
      const previousCampaigns = reportService.calculateMetrics(previousRaw);
      
      // Generate comparison report
      const report = reportService.generateComparisonReport(
        currentCampaigns,
        previousCampaigns,
        input.currentStart,
        input.currentEnd,
        input.previousStart,
        input.previousEnd
      );
      
      return report;
    }),
  
  /**
   * Get detailed campaign list with metrics
   */
  getCampaignDetails: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      sortBy: z.enum(['spend', 'cpr', 'results', 'ctr']).optional().default('spend'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get user's Meta Ads credentials
      const credentials = await db
        .select()
        .from(metaAdsCredentials)
        .where(eq(metaAdsCredentials.userId, ctx.user.id))
        .limit(1);
      
      if (credentials.length === 0) {
        throw new Error("Meta Ads credentials not found. Please configure API access first.");
      }
      
      const { accessToken, adAccountId } = credentials[0];
      
      // Fetch campaigns from Meta API
      const rawCampaigns = await fetchCampaignsFromMeta(
        accessToken,
        adAccountId,
        input.startDate,
        input.endDate
      );
      
      // Calculate metrics
      let campaigns = reportService.calculateMetrics(rawCampaigns);
      
      // Sort campaigns
      campaigns.sort((a, b) => {
        const aVal = a[input.sortBy];
        const bVal = b[input.sortBy];
        return input.sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
      
      return campaigns;
    }),
});
