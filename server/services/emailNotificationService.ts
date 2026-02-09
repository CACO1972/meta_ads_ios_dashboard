import { notifyOwner } from '../_core/notification';

/**
 * Servicio de Notificaciones por Email
 * 
 * Envía alertas por email cuando el sistema de automatización
 * toma decisiones críticas sobre las campañas de Meta Ads.
 */

export interface EmailNotificationConfig {
  userId: number;
  email: string;
  notifyOnPause: boolean;
  notifyOnScale: boolean;
  notifyOnExcessiveSpend: boolean;
  notifyDailySummary: boolean;
}

export interface NotificationData {
  action: string;
  campaignId: string;
  campaignName: string;
  reason: string;
  previousValue?: number;
  newValue?: number;
  timestamp: Date;
}

export class EmailNotificationService {
  /**
   * Enviar notificación de campaña pausada
   */
  async notifyCampaignPaused(data: NotificationData): Promise<boolean> {
    const title = `🛑 Campaña Pausada Automáticamente`;
    const content = `
**Acción Ejecutada:** Campaña pausada

**Campaña:** ${data.campaignName} (ID: ${data.campaignId})

**Razón:** ${data.reason}

**Fecha:** ${data.timestamp.toLocaleString('es-CL')}

---

Esta acción fue ejecutada automáticamente por el sistema de optimización para proteger tu presupuesto.

Puedes revisar el dashboard para más detalles o reactivar la campaña manualmente si lo consideras necesario.
    `;

    try {
      const result = await notifyOwner({ title, content });
      console.log(`[EmailNotification] Campaign paused notification sent: ${result ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } catch (error) {
      console.error(`[EmailNotification] Error sending campaign paused notification:`, error);
      return false;
    }
  }

  /**
   * Enviar notificación de presupuesto escalado
   */
  async notifyBudgetScaled(data: NotificationData): Promise<boolean> {
    const title = `📈 Presupuesto Escalado Automáticamente`;
    const content = `
**Acción Ejecutada:** Presupuesto aumentado +20%

**Campaña:** ${data.campaignName} (ID: ${data.campaignId})

**Presupuesto:**
- Anterior: $${data.previousValue?.toLocaleString('es-CL')} CLP
- Nuevo: $${data.newValue?.toLocaleString('es-CL')} CLP

**Razón:** ${data.reason}

**Fecha:** ${data.timestamp.toLocaleString('es-CL')}

---

Esta campaña está teniendo un buen rendimiento, por lo que el sistema aumentó automáticamente su presupuesto para maximizar resultados.
    `;

    try {
      const result = await notifyOwner({ title, content });
      console.log(`[EmailNotification] Budget scaled notification sent: ${result ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } catch (error) {
      console.error(`[EmailNotification] Error sending budget scaled notification:`, error);
      return false;
    }
  }

  /**
   * Enviar notificación de presupuesto reducido
   */
  async notifyBudgetReduced(data: NotificationData): Promise<boolean> {
    const title = `📉 Presupuesto Reducido Automáticamente`;
    const content = `
**Acción Ejecutada:** Presupuesto reducido -10%

**Campaña:** ${data.campaignName} (ID: ${data.campaignId})

**Presupuesto:**
- Anterior: $${data.previousValue?.toLocaleString('es-CL')} CLP
- Nuevo: $${data.newValue?.toLocaleString('es-CL')} CLP

**Razón:** ${data.reason}

**Fecha:** ${data.timestamp.toLocaleString('es-CL')}

---

Esta campaña no está alcanzando los objetivos esperados, por lo que el sistema redujo su presupuesto para optimizar la inversión.
    `;

    try {
      const result = await notifyOwner({ title, content });
      console.log(`[EmailNotification] Budget reduced notification sent: ${result ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } catch (error) {
      console.error(`[EmailNotification] Error sending budget reduced notification:`, error);
      return false;
    }
  }

  /**
   * Enviar notificación de gasto excesivo detectado
   */
  async notifyExcessiveSpend(campaignName: string, currentSpend: number, threshold: number): Promise<boolean> {
    const title = `⚠️ Alerta: Gasto Excesivo Detectado`;
    const content = `
**Alerta Crítica:** Gasto diario excesivo

**Campaña:** ${campaignName}

**Gasto actual:** $${currentSpend.toLocaleString('es-CL')} CLP
**Umbral configurado:** $${threshold.toLocaleString('es-CL')} CLP
**Exceso:** +${((currentSpend / threshold - 1) * 100).toFixed(1)}%

**Fecha:** ${new Date().toLocaleString('es-CL')}

---

El gasto de esta campaña ha superado significativamente el umbral configurado. Revisa la campaña inmediatamente para evitar gastos no planificados.

Considera pausar la campaña o ajustar el presupuesto manualmente.
    `;

    try {
      const result = await notifyOwner({ title, content });
      console.log(`[EmailNotification] Excessive spend notification sent: ${result ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } catch (error) {
      console.error(`[EmailNotification] Error sending excessive spend notification:`, error);
      return false;
    }
  }

  /**
   * Enviar notificación de Kill Switch activado
   */
  async notifyKillSwitch(pausedCount: number, reason: string): Promise<boolean> {
    const title = `🚨 KILL SWITCH ACTIVADO`;
    const content = `
**ALERTA CRÍTICA:** Kill Switch activado

**Campañas pausadas:** ${pausedCount}

**Razón:** ${reason}

**Fecha:** ${new Date().toLocaleString('es-CL')}

---

TODAS las campañas activas han sido pausadas automáticamente por el sistema de emergencia.

Esta acción se ejecutó para proteger tu presupuesto ante una situación crítica detectada.

Revisa el dashboard inmediatamente y reactiva las campañas manualmente cuando estés listo.
    `;

    try {
      const result = await notifyOwner({ title, content });
      console.log(`[EmailNotification] Kill switch notification sent: ${result ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } catch (error) {
      console.error(`[EmailNotification] Error sending kill switch notification:`, error);
      return false;
    }
  }

  /**
   * Enviar resumen diario de acciones
   */
  async sendDailySummary(actions: NotificationData[]): Promise<boolean> {
    if (actions.length === 0) {
      console.log(`[EmailNotification] No actions to report in daily summary`);
      return true;
    }

    const pausedCount = actions.filter(a => a.action === 'pause').length;
    const scaledCount = actions.filter(a => a.action === 'scale_budget').length;
    const reducedCount = actions.filter(a => a.action === 'reduce_budget').length;

    const title = `📊 Resumen Diario de Automatización`;
    const content = `
**Resumen de Acciones Automáticas - ${new Date().toLocaleDateString('es-CL')}**

**Total de acciones ejecutadas:** ${actions.length}

**Desglose:**
- Campañas pausadas: ${pausedCount}
- Presupuestos escalados: ${scaledCount}
- Presupuestos reducidos: ${reducedCount}

**Detalle de acciones:**

${actions.map((a, i) => `
${i + 1}. **${a.action === 'pause' ? '🛑 Pausada' : a.action === 'scale_budget' ? '📈 Escalada' : '📉 Reducida'}:** ${a.campaignName}
   - Razón: ${a.reason}
   - Hora: ${a.timestamp.toLocaleTimeString('es-CL')}
`).join('\n')}

---

Revisa el dashboard para más detalles sobre cada acción ejecutada.
    `;

    try {
      const result = await notifyOwner({ title, content });
      console.log(`[EmailNotification] Daily summary sent: ${result ? 'SUCCESS' : 'FAILED'}`);
      return result;
    } catch (error) {
      console.error(`[EmailNotification] Error sending daily summary:`, error);
      return false;
    }
  }
}

export const emailNotificationService = new EmailNotificationService();
