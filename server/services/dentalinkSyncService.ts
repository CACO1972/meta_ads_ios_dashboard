/**
 * Dentalink Sync Service
 * Sincronización automática de pacientes, citas y tratamientos
 */

import { getDb } from "../db";
import { dentalinkCredentials, dentalinkPatients, dentalinkAppointments, dentalinkTreatments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { dentalinkService } from "./dentalinkService";

export class DentalinkSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hora

  /**
   * Iniciar sincronización automática
   */
  start() {
    console.log("[DentalinkSync] Starting automatic sync service...");
    
    // Ejecutar sincronización inmediatamente al iniciar
    this.syncAll().catch(error => {
      console.error("[DentalinkSync] Error in initial sync:", error);
    });

    // Configurar intervalo de sincronización
    this.syncInterval = setInterval(() => {
      this.syncAll().catch(error => {
        console.error("[DentalinkSync] Error in scheduled sync:", error);
      });
    }, this.SYNC_INTERVAL_MS);

    console.log(`[DentalinkSync] Automatic sync scheduled every ${this.SYNC_INTERVAL_MS / 1000 / 60} minutes`);
  }

  /**
   * Detener sincronización automática
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("[DentalinkSync] Automatic sync service stopped");
    }
  }

  /**
   * Sincronizar todos los datos de todos los usuarios
   */
  private async syncAll() {
    const db = await getDb();
    if (!db) {
      console.warn("[DentalinkSync] Database not available, skipping sync");
      return;
    }

    try {
      // Obtener todos los usuarios con credenciales activas
      const allCredentials = await db
        .select()
        .from(dentalinkCredentials)
        .where(eq(dentalinkCredentials.isActive, true));

      console.log(`[DentalinkSync] Found ${allCredentials.length} active Dentalink accounts`);

      for (const creds of allCredentials) {
        try {
          await this.syncUserData(creds.userId, creds.apiToken);
        } catch (error: any) {
          console.error(`[DentalinkSync] Error syncing user ${creds.userId}:`, error.message);
        }
      }

      console.log("[DentalinkSync] Sync completed for all users");
    } catch (error: any) {
      console.error("[DentalinkSync] Error in syncAll:", error);
    }
  }

  /**
   * Sincronizar datos de un usuario específico
   */
  private async syncUserData(userId: number, apiToken: string) {
    console.log(`[DentalinkSync] Syncing data for user ${userId}...`);

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Configurar servicio de Dentalink
    dentalinkService.setCredentials({ apiToken });

    // Calcular rango de fechas (últimos 30 días)
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);

    const dateFromStr = dateFrom.toISOString().split("T")[0];
    const dateToStr = dateTo.toISOString().split("T")[0];

    // Sincronizar pacientes
    try {
      const patientsResult = await this.syncPatients(userId, dateFromStr, dateToStr);
      console.log(`[DentalinkSync] User ${userId} - Patients: ${patientsResult.synced} new, ${patientsResult.updated} updated`);
    } catch (error: any) {
      console.error(`[DentalinkSync] User ${userId} - Error syncing patients:`, error.message);
    }

    // Sincronizar citas
    try {
      const appointmentsResult = await this.syncAppointments(userId, dateFromStr, dateToStr);
      console.log(`[DentalinkSync] User ${userId} - Appointments: ${appointmentsResult.synced} new, ${appointmentsResult.updated} updated`);
    } catch (error: any) {
      console.error(`[DentalinkSync] User ${userId} - Error syncing appointments:`, error.message);
    }

    // Sincronizar tratamientos
    try {
      const treatmentsResult = await this.syncTreatments(userId, dateFromStr, dateToStr);
      console.log(`[DentalinkSync] User ${userId} - Treatments: ${treatmentsResult.synced} new, ${treatmentsResult.updated} updated`);
    } catch (error: any) {
      console.error(`[DentalinkSync] User ${userId} - Error syncing treatments:`, error.message);
    }

    // Actualizar lastSyncAt
    await db
      .update(dentalinkCredentials)
      .set({ lastSyncAt: new Date() })
      .where(eq(dentalinkCredentials.userId, userId));
  }

  /**
   * Sincronizar pacientes
   */
  private async syncPatients(userId: number, dateFrom: string, dateTo: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const response = await dentalinkService.getPatients({
      fecha_desde: dateFrom,
      fecha_hasta: dateTo,
    });

    let syncedCount = 0;
    let updatedCount = 0;

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

    return { synced: syncedCount, updated: updatedCount };
  }

  /**
   * Sincronizar citas
   */
  private async syncAppointments(userId: number, dateFrom: string, dateTo: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const response = await dentalinkService.getAppointments({
      fecha_desde: dateFrom,
      fecha_hasta: dateTo,
    });

    let syncedCount = 0;
    let updatedCount = 0;

    for (const appointment of response.data) {
      const patient = await db
        .select()
        .from(dentalinkPatients)
        .where(
          and(
            eq(dentalinkPatients.userId, userId),
            eq(dentalinkPatients.dentalinkId, appointment.id_paciente)
          )
        )
        .limit(1);

      const existing = await db
        .select()
        .from(dentalinkAppointments)
        .where(
          and(
            eq(dentalinkAppointments.userId, userId),
            eq(dentalinkAppointments.dentalinkId, appointment.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(dentalinkAppointments)
          .set({
            patientId: patient.length > 0 ? patient[0].id : null,
            dentalinkPatientId: appointment.id_paciente,
            dentistId: appointment.id_dentista,
            sucursalId: appointment.id_sucursal,
            estadoId: appointment.id_estado,
            fecha: appointment.fecha,
            horaInicio: appointment.hora_inicio,
            duracion: appointment.duracion,
            comentarios: appointment.comentarios,
            estadoNombre: appointment.estado?.nombre,
            estadoColor: appointment.estado?.color,
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(dentalinkAppointments.id, existing[0].id));
        updatedCount++;
      } else {
        await db.insert(dentalinkAppointments).values({
          userId,
          dentalinkId: appointment.id,
          patientId: patient.length > 0 ? patient[0].id : null,
          dentalinkPatientId: appointment.id_paciente,
          dentistId: appointment.id_dentista,
          sucursalId: appointment.id_sucursal,
          estadoId: appointment.id_estado,
          fecha: appointment.fecha,
          horaInicio: appointment.hora_inicio,
          duracion: appointment.duracion,
          comentarios: appointment.comentarios,
          estadoNombre: appointment.estado?.nombre,
          estadoColor: appointment.estado?.color,
          lastSyncAt: new Date(),
        });
        syncedCount++;
      }
    }

    return { synced: syncedCount, updated: updatedCount };
  }

  /**
   * Sincronizar tratamientos
   */
  private async syncTreatments(userId: number, dateFrom: string, dateTo: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const response = await dentalinkService.getTreatments({
      fecha_desde: dateFrom,
      fecha_hasta: dateTo,
    });

    let syncedCount = 0;
    let updatedCount = 0;

    for (const treatment of response.data) {
      const patient = await db
        .select()
        .from(dentalinkPatients)
        .where(
          and(
            eq(dentalinkPatients.userId, userId),
            eq(dentalinkPatients.dentalinkId, treatment.id_paciente)
          )
        )
        .limit(1);

      const existing = await db
        .select()
        .from(dentalinkTreatments)
        .where(
          and(
            eq(dentalinkTreatments.userId, userId),
            eq(dentalinkTreatments.dentalinkId, treatment.id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(dentalinkTreatments)
          .set({
            patientId: patient.length > 0 ? patient[0].id : null,
            dentalinkPatientId: treatment.id_paciente,
            dentistId: treatment.id_dentista,
            sucursalId: treatment.id_sucursal,
            nombre: treatment.nombre,
            fecha: treatment.fecha,
            finalizado: treatment.finalizado === 1,
            expirado: treatment.expirado === 1,
            bloqueado: treatment.bloqueado === 1,
            total: treatment.total.toString(),
            pagado: treatment.pagado.toString(),
            saldo: treatment.saldo.toString(),
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(dentalinkTreatments.id, existing[0].id));
        updatedCount++;
      } else {
        await db.insert(dentalinkTreatments).values({
          userId,
          dentalinkId: treatment.id,
          patientId: patient.length > 0 ? patient[0].id : null,
          dentalinkPatientId: treatment.id_paciente,
          dentistId: treatment.id_dentista,
          sucursalId: treatment.id_sucursal,
          nombre: treatment.nombre,
          fecha: treatment.fecha,
          finalizado: treatment.finalizado === 1,
          expirado: treatment.expirado === 1,
          bloqueado: treatment.bloqueado === 1,
          total: treatment.total.toString(),
          pagado: treatment.pagado.toString(),
          saldo: treatment.saldo.toString(),
          lastSyncAt: new Date(),
        });
        syncedCount++;
      }
    }

    return { synced: syncedCount, updated: updatedCount };
  }
}

// Singleton instance
export const dentalinkSyncService = new DentalinkSyncService();
