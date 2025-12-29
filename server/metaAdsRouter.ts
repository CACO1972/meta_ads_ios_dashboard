import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { saveMetaAdsCredentials, getMetaAdsCredentials } from "./db";

export const metaAdsRouter = router({
  saveCredentials: protectedProcedure
    .input(z.object({
      appId: z.string().min(1),
      appSecret: z.string().min(1),
      accessToken: z.string().min(1),
      adAccountId: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      try {
        await saveMetaAdsCredentials(ctx.user.id, {
          appId: input.appId,
          appSecret: input.appSecret,
          accessToken: input.accessToken,
          adAccountId: input.adAccountId,
        });

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save credentials',
        });
      }
    }),

  testConnection: protectedProcedure
    .input(z.object({
      appId: z.string().min(1),
      appSecret: z.string().min(1),
      accessToken: z.string().min(1),
      adAccountId: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        // Test connection to Meta Ads API
        const response = await fetch(
          `https://graph.facebook.com/v21.0/${input.adAccountId}?fields=name,account_status&access_token=${input.accessToken}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.error?.message || 'Failed to connect to Meta Ads API',
          });
        }

        const data = await response.json();

        return {
          success: true,
          accountName: data.name,
          accountStatus: data.account_status,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to test connection',
        });
      }
    }),

  getCredentials: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const credentials = await getMetaAdsCredentials(ctx.user.id);

      if (!credentials) {
        return { configured: false };
      }

      return {
        configured: true,
        appId: credentials.appId,
        adAccountId: credentials.adAccountId,
        // Don't return sensitive data
      };
    }),

  getCampaigns: protectedProcedure.query(async ({ ctx }) => {
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
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${credentials.adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&access_token=${credentials.accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.error?.message || 'Failed to fetch campaigns',
        });
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch campaigns',
      });
    }
  }),

  getAds: protectedProcedure.query(async ({ ctx }) => {
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
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${credentials.adAccountId}/ads?fields=id,name,status,creative{id,title,body}&limit=100&access_token=${credentials.accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.error?.message || 'Failed to fetch ads',
        });
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch ads',
      });
    }
  }),

  getInsights: protectedProcedure
    .input(
      z.object({
        datePreset: z.string().optional().default("this_year"),
        level: z.enum(["account", "campaign", "adset", "ad"]).optional().default("account"),
      })
    )
    .query(async ({ input, ctx }) => {
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
        const fields = [
          "spend",
          "impressions",
          "clicks",
          "actions",
          "ctr",
          "frequency",
          "date_start",
          "date_end",
        ].join(",");

        const response = await fetch(
          `https://graph.facebook.com/v21.0/${credentials.adAccountId}/insights?fields=${fields}&date_preset=${input.datePreset}&level=${input.level}&access_token=${credentials.accessToken}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.error?.message || 'Failed to fetch insights',
          });
        }

        const data = await response.json();
        return data.data || [];
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch insights',
        });
      }
    }),

  getAdInsights: protectedProcedure.query(async ({ ctx }) => {
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
      const fields = [
        "ad_id",
        "ad_name",
        "spend",
        "impressions",
        "clicks",
        "actions",
        "ctr",
        "frequency",
        "objective",
      ].join(",");

      const response = await fetch(
        `https://graph.facebook.com/v21.0/${credentials.adAccountId}/insights?fields=${fields}&date_preset=this_year&level=ad&limit=100&access_token=${credentials.accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.error?.message || 'Failed to fetch ad insights',
        });
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch ad insights',
      });
    }
  }),

  pauseAd: protectedProcedure
    .input(z.object({
      adId: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
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
        const response = await fetch(
          `https://graph.facebook.com/v21.0/${input.adId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'PAUSED',
              access_token: credentials.accessToken,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.error?.message || 'Failed to pause ad',
          });
        }

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to pause ad',
        });
      }
    }),

  pauseMultipleAds: protectedProcedure
    .input(z.object({
      adIds: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
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

      const results = [];
      const errors = [];

      for (const adId of input.adIds) {
        try {
          const response = await fetch(
            `https://graph.facebook.com/v21.0/${adId}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'PAUSED',
                access_token: credentials.accessToken,
              }),
            }
          );

          if (response.ok) {
            results.push({ adId, success: true });
          } else {
            const error = await response.json();
            errors.push({ adId, error: error.error?.message || 'Unknown error' });
          }
        } catch (error) {
          errors.push({ adId, error: 'Network error' });
        }
      }

      return {
        success: errors.length === 0,
        paused: results.length,
        failed: errors.length,
        errors,
      };
    }),
});
