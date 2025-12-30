/**
 * AI Central Router
 * Endpoints para el sistema de estrategias multi-plataforma
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { globalCampaigns, contentGuides, platformCredentials, GlobalCampaign, ContentGuide, PlatformCredentials } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { CLINICA_MIRO_SERVICES, getServiceById, getServicesByCategory } from "./data/clinicaMiroServices";
import { generateGlobalStrategy } from "./aiCentral/strategyEngine";

export const aiCentralRouter = router({
  // Get all available services with pricing
  getServices: protectedProcedure.query(async () => {
    return {
      services: CLINICA_MIRO_SERVICES,
      categories: [
        { id: 'odontologia', name: 'Odontología', count: CLINICA_MIRO_SERVICES.filter(s => s.category === 'Odontología').length },
        { id: 'estetica-facial', name: 'Estética Facial', count: CLINICA_MIRO_SERVICES.filter(s => s.category === 'Estética Facial').length },
      ],
      totalServices: CLINICA_MIRO_SERVICES.length,
    };
  }),

  // Get services by category
  getServicesByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const categoryMap: Record<string, string> = {
        'odontologia': 'Odontología',
        'estetica-facial': 'Estética Facial',
      };
      const categoryName = categoryMap[input.category] || input.category;
      return getServicesByCategory(categoryName);
    }),

  // Generate a global multi-platform strategy
  generateStrategy: protectedProcedure
    .input(z.object({
      serviceId: z.string(),
      totalBudget: z.number().min(100000),
      durationDays: z.number().min(7).max(90).default(30),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const service = getServiceById(input.serviceId);
      if (!service) {
        throw new Error(`Servicio no encontrado: ${input.serviceId}`);
      }

      const strategy = generateGlobalStrategy(service, input.totalBudget, input.durationDays);
      
      // Save to database
      const [campaign] = await db.insert(globalCampaigns).values({
        userId: ctx.user.id,
        name: strategy.name,
        objective: strategy.overallObjective,
        totalBudget: String(input.totalBudget),
        metaBudget: String(strategy.platforms.find(p => p.platform === 'meta')?.budgetAllocation || 0),
        tiktokBudget: String(strategy.platforms.find(p => p.platform === 'tiktok')?.budgetAllocation || 0),
        googleBudget: String(strategy.platforms.find(p => p.platform === 'google')?.budgetAllocation || 0),
        targetAgeMin: service.targetAudience.ageMin,
        targetAgeMax: service.targetAudience.ageMax,
        targetGender: service.targetAudience.gender,
        targetLocations: strategy.platforms[0]?.targetAudience.locations || [],
        targetInterests: service.targetAudience.interests,
        strategy: strategy.reasoning,
        expectedResults: strategy.expectedResults,
        status: 'pending_approval',
      }).$returningId();

      // Save content guides
      for (const guide of strategy.productionGuide) {
        await db.insert(contentGuides).values({
          userId: ctx.user.id,
          type: guide.type,
          platform: 'all',
          title: guide.title,
          description: guide.description,
          script: guide.script,
          shotList: guide.shotList,
          equipmentNeeded: guide.equipment,
          locationSuggestions: [guide.location],
          estimatedDuration: guide.duration,
          priority: guide.priority,
          status: 'pending',
          reasoning: `Contenido generado para campaña: ${strategy.name}`,
        });
      }

      return {
        campaignId: campaign.id,
        strategy,
      };
    }),

  // Get pending campaign proposals
  getPendingCampaigns: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const campaigns = await db.select()
      .from(globalCampaigns)
      .where(and(
        eq(globalCampaigns.userId, ctx.user.id),
        eq(globalCampaigns.status, 'pending_approval')
      ))
      .orderBy(desc(globalCampaigns.createdAt));

    return campaigns.map((c: GlobalCampaign) => ({
      ...c,
      totalBudget: Number(c.totalBudget),
      metaBudget: Number(c.metaBudget),
      tiktokBudget: Number(c.tiktokBudget),
      googleBudget: Number(c.googleBudget),
    }));
  }),

  // Get all campaigns
  getAllCampaigns: protectedProcedure
    .input(z.object({
      status: z.enum(['all', 'draft', 'pending_approval', 'approved', 'active', 'paused', 'completed', 'rejected']).default('all'),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const campaigns = await db.select()
        .from(globalCampaigns)
        .where(eq(globalCampaigns.userId, ctx.user.id))
        .orderBy(desc(globalCampaigns.createdAt))
        .limit(input.limit);
      
      const filtered = input.status === 'all' 
        ? campaigns 
        : campaigns.filter((c: GlobalCampaign) => c.status === input.status);

      return filtered.map((c: GlobalCampaign) => ({
        ...c,
        totalBudget: Number(c.totalBudget),
        metaBudget: Number(c.metaBudget),
        tiktokBudget: Number(c.tiktokBudget),
        googleBudget: Number(c.googleBudget),
      }));
    }),

  // Approve a campaign
  approveCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const [campaign] = await db.select()
        .from(globalCampaigns)
        .where(and(
          eq(globalCampaigns.id, input.campaignId),
          eq(globalCampaigns.userId, ctx.user.id)
        ));

      if (!campaign) {
        throw new Error('Campaña no encontrada');
      }

      if (campaign.status !== 'pending_approval') {
        throw new Error('La campaña no está pendiente de aprobación');
      }

      // Update status
      await db.update(globalCampaigns)
        .set({
          status: 'approved',
          approvedAt: new Date(),
        })
        .where(eq(globalCampaigns.id, input.campaignId));

      // TODO: Create campaigns in Meta, TikTok, Google APIs

      return { success: true, message: 'Campaña aprobada. Se crearán las campañas en cada plataforma.' };
    }),

  // Reject a campaign
  rejectCampaign: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.update(globalCampaigns)
        .set({
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        })
        .where(and(
          eq(globalCampaigns.id, input.campaignId),
          eq(globalCampaigns.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  // Get content production guides
  getContentGuides: protectedProcedure
    .input(z.object({
      status: z.enum(['all', 'pending', 'in_production', 'completed', 'published']).default('all'),
      type: z.enum(['all', 'video', 'photo', 'testimonial', 'educational', 'promotional', 'behind_scenes']).default('all'),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const guides = await db.select()
        .from(contentGuides)
        .where(eq(contentGuides.userId, ctx.user.id))
        .orderBy(desc(contentGuides.createdAt));

      let filtered = guides as ContentGuide[];
      if (input.status !== 'all') {
        filtered = filtered.filter((g: ContentGuide) => g.status === input.status);
      }
      if (input.type !== 'all') {
        filtered = filtered.filter((g: ContentGuide) => g.type === input.type);
      }

      return filtered;
    }),

  // Update content guide status
  updateContentGuideStatus: protectedProcedure
    .input(z.object({
      guideId: z.number(),
      status: z.enum(['pending', 'in_production', 'completed', 'published']),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.update(contentGuides)
        .set({ status: input.status })
        .where(and(
          eq(contentGuides.id, input.guideId),
          eq(contentGuides.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  // Get audience insights
  getAudienceInsights: protectedProcedure
    .input(z.object({
      platform: z.enum(['all', 'meta', 'tiktok', 'google', 'combined']).default('combined'),
    }))
    .query(async ({ input }) => {
      // For now, return mock data based on typical Chilean demographics
      // In production, this would pull from actual platform APIs
      
      return {
        platform: input.platform,
        demographics: {
          ageDistribution: {
            '18-24': 12,
            '25-34': 28,
            '35-44': 25,
            '45-54': 20,
            '55-64': 10,
            '65+': 5,
          },
          genderDistribution: {
            female: 65,
            male: 35,
          },
        },
        geographic: {
          topLocations: [
            { name: 'Las Condes', percentage: 22 },
            { name: 'Providencia', percentage: 18 },
            { name: 'Vitacura', percentage: 15 },
            { name: 'Ñuñoa', percentage: 12 },
            { name: 'La Reina', percentage: 10 },
            { name: 'Santiago Centro', percentage: 8 },
            { name: 'Otros', percentage: 15 },
          ],
        },
        socioeconomic: {
          distribution: {
            'ABC1': 45,
            'C2': 30,
            'C3': 20,
            'D': 5,
          },
        },
        interests: {
          top: [
            { name: 'Salud y bienestar', affinity: 85 },
            { name: 'Belleza', affinity: 78 },
            { name: 'Cuidado personal', affinity: 72 },
            { name: 'Fitness', affinity: 65 },
            { name: 'Moda', affinity: 58 },
          ],
        },
        behavior: {
          peakHours: ['18:00', '19:00', '20:00', '21:00'],
          bestDays: ['Martes', 'Miércoles', 'Jueves'],
          deviceUsage: {
            mobile: 78,
            desktop: 22,
          },
        },
        bestPerformingSegments: [
          { segment: 'Mujeres 25-44, ABC1, Las Condes/Vitacura', cpr: 15000, roi: 8.5 },
          { segment: 'Mujeres 35-54, ABC1, interés en anti-aging', cpr: 18000, roi: 7.2 },
          { segment: 'Adultos 45-65, ABC1, interés en implantes', cpr: 45000, roi: 12.3 },
        ],
      };
    }),

  // Get platform connection status
  getPlatformStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        meta: { connected: false, lastSync: null },
        tiktok: { connected: false, lastSync: null },
        google: { connected: false, lastSync: null },
      };
    }

    const credentials = await db.select()
      .from(platformCredentials)
      .where(eq(platformCredentials.userId, ctx.user.id)) as PlatformCredentials[];

    return {
      meta: {
        connected: credentials.some((c: PlatformCredentials) => c.platform === 'meta' && c.isActive),
        lastSync: credentials.find((c: PlatformCredentials) => c.platform === 'meta')?.lastSyncAt || null,
      },
      tiktok: {
        connected: credentials.some((c: PlatformCredentials) => c.platform === 'tiktok' && c.isActive),
        lastSync: credentials.find((c: PlatformCredentials) => c.platform === 'tiktok')?.lastSyncAt || null,
      },
      google: {
        connected: credentials.some((c: PlatformCredentials) => c.platform === 'google' && c.isActive),
        lastSync: credentials.find((c: PlatformCredentials) => c.platform === 'google')?.lastSyncAt || null,
      },
    };
  }),

  // Get dashboard stats
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        campaigns: { total: 0, pending: 0, active: 0, completed: 0 },
        content: { total: 0, pending: 0, inProduction: 0, completed: 0 },
        services: {
          total: CLINICA_MIRO_SERVICES.length,
          dental: CLINICA_MIRO_SERVICES.filter(s => s.category === 'Odontología').length,
          facial: CLINICA_MIRO_SERVICES.filter(s => s.category === 'Estética Facial').length,
        },
      };
    }

    const campaigns = await db.select()
      .from(globalCampaigns)
      .where(eq(globalCampaigns.userId, ctx.user.id)) as GlobalCampaign[];

    const guides = await db.select()
      .from(contentGuides)
      .where(eq(contentGuides.userId, ctx.user.id)) as ContentGuide[];

    return {
      campaigns: {
        total: campaigns.length,
        pending: campaigns.filter((c: GlobalCampaign) => c.status === 'pending_approval').length,
        active: campaigns.filter((c: GlobalCampaign) => c.status === 'active').length,
        completed: campaigns.filter((c: GlobalCampaign) => c.status === 'completed').length,
      },
      content: {
        total: guides.length,
        pending: guides.filter((g: ContentGuide) => g.status === 'pending').length,
        inProduction: guides.filter((g: ContentGuide) => g.status === 'in_production').length,
        completed: guides.filter((g: ContentGuide) => g.status === 'completed').length,
      },
      services: {
        total: CLINICA_MIRO_SERVICES.length,
        dental: CLINICA_MIRO_SERVICES.filter(s => s.category === 'Odontología').length,
        facial: CLINICA_MIRO_SERVICES.filter(s => s.category === 'Estética Facial').length,
      },
    };
  }),
});
