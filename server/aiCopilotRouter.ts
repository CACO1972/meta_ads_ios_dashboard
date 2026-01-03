/**
 * AI Co-Pilot Router
 * Exposes AI Co-Pilot functionality to the frontend
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getMetaAdsCredentials, getDb } from "./db";
import { analyzeAdsData, SERVICES, DEFAULT_SERVICE } from "./aiCopilot/analyzer";
import { generateSuggestions, getSuggestionsSummary, type Suggestion } from "./aiCopilot/suggestionGenerator";
import { suggestions, suggestionApprovals, suggestionExecutions, services, aiCopilotConfig } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { executeSuggestionAction, rollbackAction } from "./services/metaAdsExecutor";

// Helper to get database with error handling
async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database not available',
    });
  }
  return db;
}

export const aiCopilotRouter = router({
  /**
   * Analyze campaigns and generate suggestions
   */
  analyze: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const credentials = await getMetaAdsCredentials(ctx.user.id);
    if (!credentials) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Meta Ads credentials not configured',
      });
    }

    try {
      // Fetch campaigns
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v21.0/${credentials.adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${credentials.accessToken}`
      );
      const campaignsData = await campaignsResponse.json();
      const campaigns = campaignsData.data || [];

      // Fetch ads
      const adsResponse = await fetch(
        `https://graph.facebook.com/v21.0/${credentials.adAccountId}/ads?fields=id,name,status,campaign_id,adset_id&limit=100&access_token=${credentials.accessToken}`
      );
      const adsData = await adsResponse.json();
      const ads = adsData.data || [];

      // Fetch insights at ad level
      const insightsResponse = await fetch(
        `https://graph.facebook.com/v21.0/${credentials.adAccountId}/insights?fields=ad_id,ad_name,spend,impressions,clicks,actions,ctr,frequency,reach&date_preset=this_year&level=ad&limit=100&access_token=${credentials.accessToken}`
      );
      const insightsData = await insightsResponse.json();
      const insights = insightsData.data || [];

      // Analyze data
      const analysis = analyzeAdsData(ads, insights, campaigns, credentials.adAccountId);

      // Generate suggestions
      const newSuggestions = generateSuggestions(analysis);

      // Save suggestions to database
      const db = await requireDb();
      for (const suggestion of newSuggestions) {
        await db.insert(suggestions).values({
          userId: ctx.user.id,
          type: suggestion.type,
          priority: suggestion.priority,
          action: suggestion.action,
          targetType: suggestion.targetType,
          targetId: suggestion.targetId,
          targetName: suggestion.targetName,
          serviceName: suggestion.serviceName,
          currentState: suggestion.currentState,
          proposedState: suggestion.proposedState,
          estimatedRevenue: suggestion.impact.estimatedRevenue?.toString(),
          estimatedProfit: suggestion.impact.estimatedProfit?.toString(),
          estimatedSavings: suggestion.impact.estimatedSavings?.toString(),
          estimatedROI: suggestion.impact.estimatedROI?.toString(),
          confidence: suggestion.confidence.toString(),
          risk: suggestion.risk,
          reasoning: suggestion.reasoning,
          monitoringConfig: suggestion.monitoringConfig,
          status: 'pending',
          expiresAt: suggestion.expiresAt,
        });
      }

      // Get summary
      const summary = getSuggestionsSummary(newSuggestions);

      return {
        success: true,
        analysis: {
          totalCampaigns: analysis.totalCampaigns,
          totalAds: analysis.totalAds,
          totalSpend: analysis.totalSpend,
          totalResults: analysis.totalResults,
          avgCPR: analysis.avgCPR,
          avgROI: analysis.avgROI,
          globalIssues: analysis.globalIssues,
          globalOpportunities: analysis.globalOpportunities,
          topPerformers: analysis.topPerformers.slice(0, 3),
          worstPerformers: analysis.worstPerformers.slice(0, 3),
        },
        suggestions: newSuggestions,
        summary,
      };
    } catch (error) {
      console.error('Analysis error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to analyze campaigns',
      });
    }
  }),

  /**
   * Get pending suggestions
   */
  getPendingSuggestions: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const db = await requireDb();
    const pendingSuggestions = await db
      .select()
      .from(suggestions)
      .where(
        and(
          eq(suggestions.userId, ctx.user.id),
          eq(suggestions.status, 'pending')
        )
      )
      .orderBy(desc(suggestions.createdAt))
      .limit(50);

    return pendingSuggestions;
  }),

  /**
   * Get all suggestions with history
   */
  getAllSuggestions: protectedProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'executed', 'failed', 'rolled_back', 'expired', 'all']).optional().default('all'),
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const db = await requireDb();
      let query = db
        .select()
        .from(suggestions)
        .where(eq(suggestions.userId, ctx.user.id))
        .orderBy(desc(suggestions.createdAt))
        .limit(input.limit);

      if (input.status !== 'all') {
        query = db
          .select()
          .from(suggestions)
          .where(
            and(
              eq(suggestions.userId, ctx.user.id),
              eq(suggestions.status, input.status)
            )
          )
          .orderBy(desc(suggestions.createdAt))
          .limit(input.limit);
      }

      return await query;
    }),

  /**
   * Approve a suggestion
   */
  approveSuggestion: protectedProcedure
    .input(z.object({
      suggestionId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Get the suggestion
      const db = await requireDb();
      const [suggestion] = await db
        .select()
        .from(suggestions)
        .where(
          and(
            eq(suggestions.id, input.suggestionId),
            eq(suggestions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!suggestion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Suggestion not found',
        });
      }

      if (suggestion.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Suggestion is not pending',
        });
      }

      // Record approval
      await db.insert(suggestionApprovals).values({
        suggestionId: input.suggestionId,
        userId: ctx.user.id,
        decision: 'approved',
        notes: input.notes,
      });

      // Update suggestion status
      await db
        .update(suggestions)
        .set({
          status: 'approved',
          approvedAt: new Date(),
        })
        .where(eq(suggestions.id, input.suggestionId));

      // Execute the action
      const credentials = await getMetaAdsCredentials(ctx.user.id);
      if (!credentials) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Meta Ads credentials not configured',
        });
      }

      let executionSuccess = false;
      let errorMessage: string | null = null;
      let apiResponse: unknown = null;

      try {
        // Use the Meta Ads Executor service for real execution
        const executionResult = await executeSuggestionAction(
          suggestion.action,
          suggestion.targetType as 'ad' | 'adset' | 'campaign',
          suggestion.targetId,
          suggestion.proposedState,
          {
            accessToken: credentials.accessToken,
            adAccountId: credentials.adAccountId,
          }
        );

        executionSuccess = executionResult.success;
        errorMessage = executionResult.error || null;
        apiResponse = {
          action: executionResult.action,
          targetId: executionResult.targetId,
          targetType: executionResult.targetType,
          previousState: executionResult.previousState,
          newState: executionResult.newState,
          metaApiResponse: executionResult.metaApiResponse,
        };

        console.log(`[AI Co-Pilot] Action ${suggestion.action} on ${suggestion.targetId}: ${executionSuccess ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[AI Co-Pilot] Execution error:`, error);
      }

      // Record execution
      await db.insert(suggestionExecutions).values({
        suggestionId: input.suggestionId,
        success: executionSuccess,
        errorMessage,
        apiResponse,
      });

      // Update suggestion status
      await db
        .update(suggestions)
        .set({
          status: executionSuccess ? 'executed' : 'failed',
          executedAt: new Date(),
        })
        .where(eq(suggestions.id, input.suggestionId));

      return {
        success: executionSuccess,
        error: errorMessage,
        apiResponse,
      };
    }),

  /**
   * Reject a suggestion
   */
  rejectSuggestion: protectedProcedure
    .input(z.object({
      suggestionId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Get the suggestion
      const db = await requireDb();
      const [suggestion] = await db
        .select()
        .from(suggestions)
        .where(
          and(
            eq(suggestions.id, input.suggestionId),
            eq(suggestions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!suggestion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Suggestion not found',
        });
      }

      if (suggestion.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Suggestion is not pending',
        });
      }

      // Record rejection
      await db.insert(suggestionApprovals).values({
        suggestionId: input.suggestionId,
        userId: ctx.user.id,
        decision: 'rejected',
        notes: input.notes,
      });

      // Update suggestion status
      await db
        .update(suggestions)
        .set({ status: 'rejected' })
        .where(eq(suggestions.id, input.suggestionId));

      return { success: true };
    }),

  /**
   * Postpone a suggestion
   */
  postponeSuggestion: protectedProcedure
    .input(z.object({
      suggestionId: z.number(),
      postponeUntil: z.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Record postponement
      const db = await requireDb();
      await db.insert(suggestionApprovals).values({
        suggestionId: input.suggestionId,
        userId: ctx.user.id,
        decision: 'postponed',
        notes: input.notes,
        postponeUntil: input.postponeUntil,
      });

      // Update expiration
      await db
        .update(suggestions)
        .set({ expiresAt: input.postponeUntil })
        .where(eq(suggestions.id, input.suggestionId));

      return { success: true };
    }),

  /**
   * Get services configuration
   */
  getServices: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const db = await requireDb();
    const userServices = await db
      .select()
      .from(services)
      .where(eq(services.userId, ctx.user.id));

    // Return user services or defaults
    if (userServices.length > 0) {
      return userServices;
    }

    // Return default services
    return SERVICES.map((s, i) => ({
      id: i + 1,
      userId: ctx.user!.id,
      name: s.name,
      price: s.price.toString(),
      ltv: s.ltv.toString(),
      cprTarget: s.cprTarget.toString(),
      cprMax: s.cprMax.toString(),
      roiMin: s.roiMin.toString(),
      keywords: s.keywords,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }),

  /**
   * Save services configuration
   */
  saveServices: protectedProcedure
    .input(z.array(z.object({
      name: z.string(),
      price: z.number(),
      ltv: z.number(),
      cprTarget: z.number(),
      cprMax: z.number(),
      roiMin: z.number().optional().default(5),
      keywords: z.array(z.string()).optional().default([]),
    })))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Delete existing services
      const db = await requireDb();
      await db.delete(services).where(eq(services.userId, ctx.user.id));

      // Insert new services
      for (const service of input) {
        await db.insert(services).values({
          userId: ctx.user.id,
          name: service.name,
          price: service.price.toString(),
          ltv: service.ltv.toString(),
          cprTarget: service.cprTarget.toString(),
          cprMax: service.cprMax.toString(),
          roiMin: service.roiMin.toString(),
          keywords: service.keywords,
        });
      }

      return { success: true };
    }),

  /**
   * Get AI Co-Pilot configuration
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const db = await requireDb();
    const [config] = await db
      .select()
      .from(aiCopilotConfig)
      .where(eq(aiCopilotConfig.userId, ctx.user.id))
      .limit(1);

    return config || {
      promptMaestro: null,
      maxCPR: null,
      minROI: null,
      maxFrequency: null,
      maxDailySpend: null,
      autoApproveHighConfidence: false,
      autoApproveThreshold: '0.95',
      analysisInterval: 60,
      emailNotifications: true,
      highPriorityOnly: false,
    };
  }),

  /**
   * Save AI Co-Pilot configuration
   */
  saveConfig: protectedProcedure
    .input(z.object({
      promptMaestro: z.string().optional(),
      maxCPR: z.number().optional(),
      minROI: z.number().optional(),
      maxFrequency: z.number().optional(),
      maxDailySpend: z.number().optional(),
      autoApproveHighConfidence: z.boolean().optional(),
      autoApproveThreshold: z.number().optional(),
      analysisInterval: z.number().optional(),
      emailNotifications: z.boolean().optional(),
      highPriorityOnly: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Check if config exists
      const db = await requireDb();
      const [existingConfig] = await db
        .select()
        .from(aiCopilotConfig)
        .where(eq(aiCopilotConfig.userId, ctx.user.id))
        .limit(1);

      if (existingConfig) {
        // Update existing config
        await db
          .update(aiCopilotConfig)
          .set({
            promptMaestro: input.promptMaestro,
            maxCPR: input.maxCPR?.toString(),
            minROI: input.minROI?.toString(),
            maxFrequency: input.maxFrequency?.toString(),
            maxDailySpend: input.maxDailySpend?.toString(),
            autoApproveHighConfidence: input.autoApproveHighConfidence,
            autoApproveThreshold: input.autoApproveThreshold?.toString(),
            analysisInterval: input.analysisInterval,
            emailNotifications: input.emailNotifications,
            highPriorityOnly: input.highPriorityOnly,
          })
          .where(eq(aiCopilotConfig.userId, ctx.user.id));
      } else {
        // Create new config
        await db.insert(aiCopilotConfig).values({
          userId: ctx.user.id,
          promptMaestro: input.promptMaestro,
          maxCPR: input.maxCPR?.toString(),
          minROI: input.minROI?.toString(),
          maxFrequency: input.maxFrequency?.toString(),
          maxDailySpend: input.maxDailySpend?.toString(),
          autoApproveHighConfidence: input.autoApproveHighConfidence ?? false,
          autoApproveThreshold: input.autoApproveThreshold?.toString() ?? '0.95',
          analysisInterval: input.analysisInterval ?? 60,
          emailNotifications: input.emailNotifications ?? true,
          highPriorityOnly: input.highPriorityOnly ?? false,
        });
      }

      return { success: true };
    }),

  /**
   * Get suggestion statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const db = await requireDb();
    const allSuggestions = await db
      .select()
      .from(suggestions)
      .where(eq(suggestions.userId, ctx.user.id));

    type SuggestionRecord = typeof allSuggestions[0];
    const pending = allSuggestions.filter((s: SuggestionRecord) => s.status === 'pending').length;
    const approved = allSuggestions.filter((s: SuggestionRecord) => s.status === 'approved' || s.status === 'executed').length;
    const rejected = allSuggestions.filter((s: SuggestionRecord) => s.status === 'rejected').length;
    const executed = allSuggestions.filter((s: SuggestionRecord) => s.status === 'executed').length;

    // Calculate total estimated savings from executed suggestions
    const executedSuggestions = allSuggestions.filter((s: SuggestionRecord) => s.status === 'executed');
    const totalSavings = executedSuggestions.reduce((sum: number, s: typeof executedSuggestions[0]) => {
      return sum + (parseFloat(s.estimatedSavings?.toString() || '0') || 0);
    }, 0);
    const totalProfit = executedSuggestions.reduce((sum: number, s: typeof executedSuggestions[0]) => {
      return sum + (parseFloat(s.estimatedProfit?.toString() || '0') || 0);
    }, 0);

    return {
      total: allSuggestions.length,
      pending,
      approved,
      rejected,
      executed,
      totalSavings,
      totalProfit,
      approvalRate: approved + rejected > 0 ? approved / (approved + rejected) : 0,
    };
  }),
});
