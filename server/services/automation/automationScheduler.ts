import cron from 'node-cron';
import { evaluateCampaignRules, CampaignMetrics } from '../ruleEngine';
import { automationActionsService } from '../automationActions';
import { getDb } from '../../db';
import { automationRules } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { metaAdsCredentials } from '../../../drizzle/schema';

/**
 * Servicio de Scheduler Automático
 * 
 * Ejecuta reglas de automatización en intervalos configurados usando node-cron
 * 
 * Funcionalidades:
 * - Ejecuta evaluación de reglas cada 1-6 horas (configurable)
 * - Procesa todas las campañas activas automáticamente
 * - Ejecuta acciones según decisiones del motor de reglas
 * - Logging completo de todas las ejecuciones
 * - Control de inicio/parada del scheduler
 */

interface SchedulerConfig {
  enabled: boolean;
  cronExpression: string; // Expresión cron (ej: '0 * * * *' = cada hora)
  lastRun: Date | null;
  nextRun: Date | null;
}

let schedulerTask: ReturnType<typeof cron.schedule> | null = null;
let schedulerConfig: SchedulerConfig = {
  enabled: false,
  cronExpression: '0 * * * *', // Default: cada hora en punto
  lastRun: null,
  nextRun: null,
};

/**
 * Ejecuta el proceso completo de automatización
 */
async function executeAutomationRun(userId: number): Promise<void> {
  console.log(`[AutomationScheduler] Starting automation run for user ${userId} at ${new Date().toISOString()}`);
  
  try {
    // 1. Obtener todas las reglas activas del usuario
    const db = await getDb();
    if (!db) {
      console.error('[AutomationScheduler] Database not available');
      return;
    }

    const activeRules = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.userId, userId));

    if (activeRules.length === 0) {
      console.log(`[AutomationScheduler] No active rules found for user ${userId}`);
      return;
    }

    console.log(`[AutomationScheduler] Found ${activeRules.length} active rules`);

    // 2. Obtener credenciales de Meta Ads
    const creds = await db
      .select()
      .from(metaAdsCredentials)
      .where(eq(metaAdsCredentials.userId, userId))
      .limit(1);

    if (creds.length === 0) {
      console.error(`[AutomationScheduler] No Meta Ads credentials found for user ${userId}`);
      return;
    }

    const credentials = creds[0];

    // 3. Obtener todas las campañas activas desde Meta Ads API
    let campaigns: any[] = [];
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${credentials.adAccountId}/campaigns?fields=id,name,status,objective,insights{spend,impressions,clicks,actions,cost_per_action_type,ctr,cpc}&access_token=${credentials.accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        console.error(`[AutomationScheduler] Meta Ads API error:`, error);
        return;
      }

      const data = await response.json();
      campaigns = data.data || [];
    } catch (error) {
      console.error(`[AutomationScheduler] Error fetching campaigns:`, error);
      return;
    }

    if (campaigns.length === 0) {
      console.log(`[AutomationScheduler] No active campaigns found`);
      return;
    }

    console.log(`[AutomationScheduler] Processing ${campaigns.length} campaigns`);

    let actionsExecuted = 0;

    // 4. Evaluar cada campaña
    for (const campaign of campaigns) {
      try {
        const campaignId = campaign.id;
        const campaignName = campaign.name || 'Unknown';

        console.log(`[AutomationScheduler] Evaluating campaign ${campaignId} (${campaignName})`);

        // Construir métricas de la campaña
        const metrics: CampaignMetrics = {
          campaignId,
          campaignName,
          objective: campaign.objective || 'UNKNOWN',
          spend: parseFloat(campaign.spend || '0'),
          impressions: parseInt(campaign.impressions || '0'),
          clicks: parseInt(campaign.clicks || '0'),
          results: parseInt(campaign.actions?.[0]?.value || '0'),
          cpr: parseFloat(campaign.cost_per_action_type?.[0]?.value || '0'),
          ctr: parseFloat(campaign.ctr || '0'),
          cpc: parseFloat(campaign.cpc || '0'),
          status: campaign.status || 'UNKNOWN',
        };

        // Evaluar reglas para esta campaña
        const evaluation = await evaluateCampaignRules(
          userId,
          metrics,
          false // simulationMode = false (ejecutar acciones reales)
        );

        // 4. Ejecutar acciones según decisiones
        for (const actionItem of evaluation.actionsToTake) {
          const action = actionItem.action;
          const reason = `Condiciones cumplidas: ${actionItem.conditionsMet.map(c => `${c.metric} ${c.operator} ${c.threshold}`).join(', ')}`;

          console.log(`[AutomationScheduler] Executing action ${action.type} for campaign ${campaignId}`);

          try {
            let actionResult: any = null;

            // Ejecutar la acción correspondiente
            switch (action.type) {
              case 'pause_campaign':
                actionResult = await automationActionsService.pauseCampaignAction(
                  userId,
                  campaignId,
                  campaignName,
                  reason
                );
                break;
              case 'scale_up':
                // Necesitamos obtener el presupuesto actual de la campaña
                const currentBudgetUp = parseFloat(campaign.daily_budget || campaign.lifetime_budget || '0');
                actionResult = await automationActionsService.scaleBudgetAction(
                  userId,
                  campaignId,
                  campaignName,
                  currentBudgetUp,
                  reason
                );
                break;
              case 'scale_down':
                // Necesitamos obtener el presupuesto actual de la campaña
                const currentBudgetDown = parseFloat(campaign.daily_budget || campaign.lifetime_budget || '0');
                actionResult = await automationActionsService.reduceBudgetAction(
                  userId,
                  campaignId,
                  campaignName,
                  currentBudgetDown,
                  reason
                );
                break;
              default:
                console.warn(`[AutomationScheduler] Unknown action type: ${action.type}`);
            }

            if (actionResult?.success) {
              actionsExecuted++;
              console.log(`[AutomationScheduler] ✅ Action executed successfully`);
            } else {
              console.error(`[AutomationScheduler] ❌ Action failed: ${actionResult?.error}`);
            }
          } catch (actionError) {
            console.error(`[AutomationScheduler] Error executing action:`, actionError);
          }
        }
      } catch (campaignError) {
        console.error(`[AutomationScheduler] Error processing campaign:`, campaignError);
      }
    }

    console.log(`[AutomationScheduler] ✅ Automation run completed. Actions executed: ${actionsExecuted}`);

    // Actualizar última ejecución
    schedulerConfig.lastRun = new Date();
  } catch (error) {
    console.error(`[AutomationScheduler] Fatal error during automation run:`, error);
  }
}

/**
 * Inicia el scheduler automático
 */
export function startScheduler(userId: number, cronExpression?: string): boolean {
  try {
    // Si ya está corriendo, detenerlo primero
    if (schedulerTask) {
      stopScheduler();
    }

    // Actualizar expresión cron si se proporciona
    if (cronExpression) {
      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression: ${cronExpression}`);
      }
      schedulerConfig.cronExpression = cronExpression;
    }

    console.log(`[AutomationScheduler] Starting scheduler with cron: ${schedulerConfig.cronExpression}`);

    // Crear tarea programada
    schedulerTask = cron.schedule(schedulerConfig.cronExpression, async () => {
      await executeAutomationRun(userId);
    });

    schedulerConfig.enabled = true;
    schedulerConfig.nextRun = getNextRunTime(schedulerConfig.cronExpression);

    console.log(`[AutomationScheduler] ✅ Scheduler started. Next run: ${schedulerConfig.nextRun?.toISOString()}`);

    return true;
  } catch (error) {
    console.error(`[AutomationScheduler] Error starting scheduler:`, error);
    return false;
  }
}

/**
 * Detiene el scheduler automático
 */
export function stopScheduler(): boolean {
  try {
    if (schedulerTask) {
      schedulerTask.stop();
      schedulerTask = null;
      schedulerConfig.enabled = false;
      schedulerConfig.nextRun = null;
      console.log(`[AutomationScheduler] ✅ Scheduler stopped`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[AutomationScheduler] Error stopping scheduler:`, error);
    return false;
  }
}

/**
 * Obtiene el estado actual del scheduler
 */
export function getSchedulerStatus(): SchedulerConfig {
  if (schedulerConfig.enabled && schedulerTask) {
    schedulerConfig.nextRun = getNextRunTime(schedulerConfig.cronExpression);
  }
  return { ...schedulerConfig };
}

/**
 * Ejecuta el scheduler manualmente (útil para testing)
 */
export async function executeSchedulerManually(userId: number): Promise<void> {
  console.log(`[AutomationScheduler] Manual execution triggered`);
  await executeAutomationRun(userId);
}

/**
 * Actualiza la expresión cron del scheduler
 */
export function updateSchedulerCron(userId: number, cronExpression: string): boolean {
  try {
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    schedulerConfig.cronExpression = cronExpression;

    // Si está corriendo, reiniciar con nueva expresión
    if (schedulerConfig.enabled && schedulerTask) {
      stopScheduler();
      startScheduler(userId, cronExpression);
    }

    console.log(`[AutomationScheduler] Cron expression updated: ${cronExpression}`);
    return true;
  } catch (error) {
    console.error(`[AutomationScheduler] Error updating cron:`, error);
    return false;
  }
}

/**
 * Calcula la próxima ejecución basada en la expresión cron
 */
function getNextRunTime(cronExpression: string): Date | null {
  try {
    const now = new Date();
    
    // Para '0 * * * *' (cada hora)
    if (cronExpression === '0 * * * *') {
      const next = new Date(now);
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      return next;
    }

    // Para '0 */2 * * *' (cada 2 horas)
    if (cronExpression === '0 */2 * * *') {
      const next = new Date(now);
      next.setHours(next.getHours() + 2);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      return next;
    }

    // Para '0 */6 * * *' (cada 6 horas)
    if (cronExpression === '0 */6 * * *') {
      const next = new Date(now);
      next.setHours(next.getHours() + 6);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      return next;
    }

    // Default: agregar 1 hora
    const next = new Date(now);
    next.setHours(next.getHours() + 1);
    return next;
  } catch {
    return null;
  }
}

/**
 * Expresiones cron predefinidas
 */
export const CRON_PRESETS = {
  EVERY_HOUR: '0 * * * *',
  EVERY_2_HOURS: '0 */2 * * *',
  EVERY_4_HOURS: '0 */4 * * *',
  EVERY_6_HOURS: '0 */6 * * *',
  EVERY_DAY_9AM: '0 9 * * *',
  EVERY_DAY_NOON: '0 12 * * *',
};
