import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { dentalinkService } from "../services/dentalinkService";
import { getDb } from "../db";
import { 
  dentalinkCredentials, 
  dentalinkPatients, 
  dentalinkAppointments, 
  dentalinkTreatments,
  leadToPatientConversions 
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export const dentalinkRouter = router({
  /**
   * Configurar credenciales de Dentalink
   */
  setCredentials: protectedProcedure
    .input(
      z.object({
        apiToken: z.string().min(1, "API Token is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verificar que el token funcione
      dentalinkService.setCredentials({ apiToken: input.apiToken });
      
      try {
        // Test connection
        await dentalinkService.getPatients();
      } catch (error: any) {
        throw new Error(`Invalid Dentalink credentials: ${error.message}`);
      }

      // Guardar o actualizar credenciales
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db
        .select()
        .from(dentalinkCredentials)
        .where(eq(dentalinkCredentials.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(dentalinkCredentials)
          .set({
            apiToken: input.apiToken,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(dentalinkCredentials.userId, userId));
      } else {
        await db.insert(dentalinkCredentials).values({
          userId,
          apiToken: input.apiToken,
          isActive: true,
        });
      }

      return { success: true, message: "Dentalink credentials saved successfully" };
    }),

  /**
   * Obtener credenciales configuradas
   */
  getCredentials: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const creds = await db
      .select()
      .from(dentalinkCredentials)
      .where(eq(dentalinkCredentials.userId, userId))
      .limit(1);

    if (creds.length === 0) {
      return { configured: false };
    }

    return {
      configured: true,
      isActive: creds[0].isActive,
      lastSyncAt: creds[0].lastSyncAt,
    };
  }),

  /**
   * Sincronizar pacientes desde Dentalink
   */
  syncPatients: protectedProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(), // YYYY-MM-DD
        dateTo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Obtener credenciales
      const creds = await db
        .select()
        .from(dentalinkCredentials)
        .where(eq(dentalinkCredentials.userId, userId))
        .limit(1);

      if (creds.length === 0) {
        throw new Error("Dentalink credentials not configured");
      }

      dentalinkService.setCredentials({ apiToken: creds[0].apiToken });

      // Obtener pacientes desde Dentalink
      const response = await dentalinkService.getPatients({
        fecha_desde: input.dateFrom,
        fecha_hasta: input.dateTo,
      });

      let syncedCount = 0;
      let updatedCount = 0;

      // Guardar o actualizar pacientes en BD
      for (const patient of response.data) {
        const existing = await db
          .select()
          .from(dentalinkPatients)
          .where(
            and(
              eq(dentalinkPatients.userId, userId),
              eq(dentalinkPatients.dentalinkId, patient.id)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Actualizar paciente existente
          await db
            .update(dentalinkPatients)
            .set({
              nombre: patient.nombre,
              apellidos: patient.apellidos,
              rut: patient.rut,
              email: patient.email,
              celular: patient.celular,
              telefono: patient.telefono,
              fechaNacimiento: patient.fecha_nacimiento,
              sexo: patient.sexo,
              direccion: patient.direccion,
              comuna: patient.comuna,
              ciudad: patient.ciudad,
              dentalinkUpdatedAt: patient.fecha_modificacion ? new Date(patient.fecha_modificacion) : null,
              lastSyncAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(dentalinkPatients.id, existing[0].id));
          updatedCount++;
        } else {
          // Insertar nuevo paciente
          await db.insert(dentalinkPatients).values({
            userId,
            dentalinkId: patient.id,
            nombre: patient.nombre,
            apellidos: patient.apellidos,
            rut: patient.rut,
            email: patient.email,
            celular: patient.celular,
            telefono: patient.telefono,
            fechaNacimiento: patient.fecha_nacimiento,
            sexo: patient.sexo,
            direccion: patient.direccion,
            comuna: patient.comuna,
            ciudad: patient.ciudad,
            dentalinkCreatedAt: patient.fecha_creacion ? new Date(patient.fecha_creacion) : null,
            dentalinkUpdatedAt: patient.fecha_modificacion ? new Date(patient.fecha_modificacion) : null,
            lastSyncAt: new Date(),
          });
          syncedCount++;
        }
      }

      // Actualizar lastSyncAt en credenciales
      await db
        .update(dentalinkCredentials)
        .set({ lastSyncAt: new Date() })
        .where(eq(dentalinkCredentials.userId, userId));

      return {
        success: true,
        synced: syncedCount,
        updated: updatedCount,
        total: response.data.length,
      };
    }),

  /**
   * Obtener lista de pacientes sincronizados
   */
  getPatients: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const patients = await db
        .select()
        .from(dentalinkPatients)
        .where(eq(dentalinkPatients.userId, userId))
        .orderBy(desc(dentalinkPatients.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return { data: patients };
    }),

  /**
   * Obtener estadísticas de conversión
   */
  getConversionStats: protectedProcedure
    .input(
      z.object({
        dateFrom: z.string(), // YYYY-MM-DD
        dateTo: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Obtener credenciales
      const creds = await db
        .select()
        .from(dentalinkCredentials)
        .where(eq(dentalinkCredentials.userId, userId))
        .limit(1);

      if (creds.length === 0) {
        throw new Error("Dentalink credentials not configured");
      }

      dentalinkService.setCredentials({ apiToken: creds[0].apiToken });

      // Obtener stats desde Dentalink API
      const stats = await dentalinkService.getConversionStats(input.dateFrom, input.dateTo);

      // Obtener conversiones desde BD
      const conversions = await db
        .select()
        .from(leadToPatientConversions)
        .where(
          and(
            eq(leadToPatientConversions.userId, userId),
            gte(leadToPatientConversions.createdAt, new Date(input.dateFrom)),
            lte(leadToPatientConversions.createdAt, new Date(input.dateTo))
          )
        );

      const conversionsByStatus = conversions.reduce((acc: Record<string, number>, conv) => {
        acc[conv.conversionStatus] = (acc[conv.conversionStatus] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...stats,
        conversions: {
          total: conversions.length,
          byStatus: conversionsByStatus,
        },
      };
    }),
});
