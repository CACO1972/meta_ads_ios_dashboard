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
import { 
  AGE_DISTRIBUTION, 
  GENDER_DISTRIBUTION, 
  COMMUNE_DISTRIBUTION, 
  PAYMENT_METHODS,
  SERVICE_CATEGORIES,
  APPOINTMENT_STATUS,
  PATIENT_METRICS,
  REAL_AUDIENCE_SEGMENTS,
  getSegmentationInsights 
} from "./data/clinicaMiroPatientData";
import canvaService from "./services/canvaService";

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

  // Get audience insights - DATOS REALES DE PACIENTES CLÍNICA MIRÓ
  getAudienceInsights: protectedProcedure
    .input(z.object({
      platform: z.enum(['all', 'meta', 'tiktok', 'google', 'combined']).default('combined'),
    }))
    .query(async ({ input }) => {
      // Datos reales extraídos del sistema de gestión de Clínica Miró
      const insights = getSegmentationInsights();
      
      // Convertir distribución de edad al formato esperado
      const ageDistribution: Record<string, number> = {};
      Object.entries(AGE_DISTRIBUTION).forEach(([key, value]) => {
        ageDistribution[key] = value.percentage;
      });
      
      // Convertir distribución de comunas
      const topLocations = Object.entries(COMMUNE_DISTRIBUTION).map(([name, data]) => ({
        name,
        percentage: data.percentage,
        socioeconomic: data.socioeconomic,
      }));
      
      // Convertir categorías de servicios
      const serviceCategories = Object.entries(SERVICE_CATEGORIES).map(([name, data]) => ({
        name,
        percentage: data.percentage,
        avgTicket: data.avgTicket,
        growthRate: data.growthRate,
        topServices: data.topServices,
      }));
      
      return {
        platform: input.platform,
        source: 'DATOS REALES - Sistema Clínica Miró',
        lastUpdated: 'Diciembre 2025',
        demographics: {
          ageDistribution,
          genderDistribution: {
            female: GENDER_DISTRIBUTION.Femenino.percentage,
            male: GENDER_DISTRIBUTION.Masculino.percentage,
            unknown: GENDER_DISTRIBUTION.Desconocido.percentage,
          },
        },
        geographic: {
          topLocations,
        },
        socioeconomic: {
          distribution: {
            'ABC1': 28, // Las Condes, Vitacura, Providencia
            'C1a': 22, // Ñuñoa, La Reina
            'C1b': 20, // Santiago, La Florida
            'C2': 18, // Maipú, Puente Alto
            'C3': 12, // Otras comunas
          },
        },
        paymentMethods: Object.entries(PAYMENT_METHODS).map(([method, data]) => ({
          method,
          percentage: data.percentage,
          trend: data.trend,
        })),
        serviceCategories,
        appointmentMetrics: {
          attendanceRate: PATIENT_METRICS.attendanceRate,
          cancellationRate: PATIENT_METRICS.cancellationRate,
          avgTicket: PATIENT_METRICS.avgTicket,
          repeatRate: PATIENT_METRICS.repeatRate,
          referralRate: PATIENT_METRICS.referralRate,
          statusBreakdown: Object.entries(APPOINTMENT_STATUS).map(([status, data]) => ({
            status,
            percentage: data.percentage,
            color: data.color,
          })),
        },
        interests: {
          top: [
            { name: 'Implantología y rehabilitación oral', affinity: 92 },
            { name: 'Estética dental (carillas, blanqueamiento)', affinity: 85 },
            { name: 'Ortodoncia y alineadores', affinity: 78 },
            { name: 'Estética facial (toxina, hialurónico)', affinity: 75 },
            { name: 'Odontología preventiva', affinity: 65 },
          ],
        },
        behavior: {
          peakHours: ['10:00', '11:00', '17:00', '18:00'],
          bestDays: ['Martes', 'Miércoles', 'Jueves'],
          deviceUsage: {
            mobile: 72,
            desktop: 28,
          },
        },
        bestPerformingSegments: REAL_AUDIENCE_SEGMENTS.map(seg => ({
          id: seg.id,
          segment: seg.name,
          description: seg.description,
          demographics: seg.demographics,
          cpr: seg.marketing.estimatedCPR,
          roi: seg.marketing.estimatedROI,
          bestPlatforms: seg.marketing.bestPlatforms,
          bestFormats: seg.marketing.bestFormats,
          preferredServices: seg.behavior.preferredServices,
          avgTicket: seg.behavior.avgTicket,
        })),
        recommendations: insights.recommendations,
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

  // ========== CANVA INTEGRATION ==========
  
  // Search Canva designs
  searchCanvaDesigns: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      sortBy: z.enum(['relevance', 'modified_descending', 'modified_ascending']).default('relevance'),
    }))
    .query(async ({ input }) => {
      const result = await canvaService.searchDesigns(input.query, input.sortBy);
      return {
        designs: result.items || [],
        hasMore: !!result.continuation,
      };
    }),

  // Get dental designs from Canva
  getCanvaDentalDesigns: protectedProcedure.query(async () => {
    const designs = await canvaService.getDentalDesigns();
    return { designs };
  }),

  // Get Canva brand kits
  getCanvaBrandKits: protectedProcedure.query(async () => {
    const brandKits = await canvaService.listBrandKits();
    return {
      brandKits,
      uploadedAssets: canvaService.CANVA_ASSETS,
    };
  }),

  // Export Canva design
  exportCanvaDesign: protectedProcedure
    .input(z.object({
      designId: z.string(),
      format: z.enum(['pdf', 'png', 'jpg', 'pptx', 'mp4']).default('png'),
    }))
    .mutation(async ({ input }) => {
      // First get available formats
      const formats = await canvaService.getExportFormats(input.designId);
      if (!formats.includes(input.format)) {
        throw new Error(`Formato ${input.format} no disponible. Formatos disponibles: ${formats.join(', ')}`);
      }
      
      const result = await canvaService.exportDesign(input.designId, input.format);
      if (!result) {
        throw new Error('Error al exportar el diseño');
      }
      
      return result;
    }),

  // Generate design with AI (Canva Pro required)
  generateCanvaDesign: protectedProcedure
    .input(z.object({
      serviceName: z.string(),
      designType: z.enum([
        'instagram_post', 'facebook_post', 'your_story', 
        'poster', 'flyer', 'presentation'
      ]).default('instagram_post'),
      includePrice: z.boolean().default(true),
      useBrandKit: z.boolean().default(true),
      useLogo: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      // Build the query based on service and brand voice
      const service = CLINICA_MIRO_SERVICES.find(s => 
        s.name.toLowerCase().includes(input.serviceName.toLowerCase())
      );
      
      const priceText = service && input.includePrice 
        ? `Price: $${service.price.toLocaleString('es-CL')} CLP.` 
        : '';
      
      const query = `
        Professional dental clinic ${input.designType} for ${input.serviceName}.
        Elegant gold (#C4A265) and black (#0A0A0D) color scheme.
        Premium luxury aesthetic with minimalist design.
        Brand: Clínica Miró - "Tu sonrisa, nuestra pasión"
        ${priceText}
        Call to action: Agenda tu evaluación sin costo.
        Tone: Professional, calm, educational, premium.
      `.trim();
      
      const assetIds = input.useLogo ? [canvaService.CANVA_ASSETS.logoFull] : undefined;
      const brandKitId = input.useBrandKit ? canvaService.CANVA_BRAND_KITS.default : undefined;
      
      const result = await canvaService.generateDesign(
        query,
        input.designType,
        brandKitId,
        assetIds
      );
      
      if (!result) {
        throw new Error('Error al generar el diseño. Verifica que tengas Canva Pro activo.');
      }
      
      return result;
    }),

  // Get Canva connection status
  getCanvaStatus: protectedProcedure.query(async () => {
    try {
      const brandKits = await canvaService.listBrandKits();
      return {
        connected: true,
        brandKitsCount: brandKits.length,
        uploadedAssets: canvaService.CANVA_ASSETS,
      };
    } catch {
      return {
        connected: false,
        brandKitsCount: 0,
        uploadedAssets: {},
      };
    }
  }),
});
