import { pauseCampaign, changeCampaignBudget } from './metaAdsExecutor';
import { getDb } from '../db';
import { metaAdsCredentials } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Servicio de Acciones Automáticas para Meta Ads
 * 
 * Este servicio ejecuta acciones sobre campañas de Meta Ads:
 * - Pausar campañas
 * - Escalar presupuesto (+20%)
 * - Reducir presupuesto (-10%)
 */

export interface AutomationActionResult {
  success: boolean;
  action: string;
  campaignId: string;
  campaignName: string;
  previousValue?: number;
  newValue?: number;
  error?: string;
}

interface MetaAdsCredentials {
  accessToken: string;
  adAccountId: string;
}

export class AutomationActionsService {
  /**
   * Obtener credenciales de Meta Ads para un usuario
   */
  private async getCredentials(userId: number): Promise<MetaAdsCredentials | null> {
    try {
      const db = await getDb();
      if (!db) {
        console.error(`[AutomationActions] Database connection failed`);
        return null;
      }
      const creds = await db
        .select()
        .from(metaAdsCredentials)
        .where(eq(metaAdsCredentials.userId, userId))
        .limit(1);

      if (creds.length === 0) {
        console.error(`[AutomationActions] No credentials found for user ${userId}`);
        return null;
      }

      return {
        accessToken: creds[0].accessToken,
        adAccountId: creds[0].adAccountId,
      };
    } catch (error) {
      console.error(`[AutomationActions] Error fetching credentials:`, error);
      return null;
    }
  }

  /**
   * Pausar una campaña
   */
  async pauseCampaignAction(
    userId: number,
    campaignId: string,
    campaignName: string,
    reason: string
  ): Promise<AutomationActionResult> {
    try {
      console.log(`[AutomationActions] Pausing campaign ${campaignId} (${campaignName}) - Reason: ${reason}`);
      
      // Obtener credenciales
      const credentials = await this.getCredentials(userId);
      if (!credentials) {
        return {
          success: false,
          action: 'pause',
          campaignId,
          campaignName,
          error: 'No credentials found for user',
        };
      }

      // Llamar a la función de metaAdsExecutor
      const result = await pauseCampaign(campaignId, credentials);
      
      return {
        success: result.success,
        action: 'pause',
        campaignId,
        campaignName,
        error: result.error,
      };
    } catch (error: any) {
      console.error(`[AutomationActions] Error pausing campaign ${campaignId}:`, error);
      return {
        success: false,
        action: 'pause',
        campaignId,
        campaignName,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Escalar presupuesto de una campaña (+20%)
   */
  async scaleBudgetAction(
    userId: number,
    campaignId: string,
    campaignName: string,
    currentBudget: number,
    reason: string
  ): Promise<AutomationActionResult> {
    try {
      const newBudget = Math.round(currentBudget * 1.2); // +20%
      console.log(`[AutomationActions] Scaling budget for campaign ${campaignId} (${campaignName}): $${currentBudget} → $${newBudget} - Reason: ${reason}`);
      
      // Obtener credenciales
      const credentials = await this.getCredentials(userId);
      if (!credentials) {
        return {
          success: false,
          action: 'scale_budget',
          campaignId,
          campaignName,
          previousValue: currentBudget,
          error: 'No credentials found for user',
        };
      }

      // Llamar a la función de metaAdsExecutor
      const result = await changeCampaignBudget(campaignId, newBudget, credentials);
      
      return {
        success: result.success,
        action: 'scale_budget',
        campaignId,
        campaignName,
        previousValue: currentBudget,
        newValue: newBudget,
        error: result.error,
      };
    } catch (error: any) {
      console.error(`[AutomationActions] Error scaling budget for campaign ${campaignId}:`, error);
      return {
        success: false,
        action: 'scale_budget',
        campaignId,
        campaignName,
        previousValue: currentBudget,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Reducir presupuesto de una campaña (-10%)
   */
  async reduceBudgetAction(
    userId: number,
    campaignId: string,
    campaignName: string,
    currentBudget: number,
    reason: string
  ): Promise<AutomationActionResult> {
    try {
      const newBudget = Math.round(currentBudget * 0.9); // -10%
      console.log(`[AutomationActions] Reducing budget for campaign ${campaignId} (${campaignName}): $${currentBudget} → $${newBudget} - Reason: ${reason}`);
      
      // Obtener credenciales
      const credentials = await this.getCredentials(userId);
      if (!credentials) {
        return {
          success: false,
          action: 'reduce_budget',
          campaignId,
          campaignName,
          previousValue: currentBudget,
          error: 'No credentials found for user',
        };
      }

      // Llamar a la función de metaAdsExecutor
      const result = await changeCampaignBudget(campaignId, newBudget, credentials);
      
      return {
        success: result.success,
        action: 'reduce_budget',
        campaignId,
        campaignName,
        previousValue: currentBudget,
        newValue: newBudget,
        error: result.error,
      };
    } catch (error: any) {
      console.error(`[AutomationActions] Error reducing budget for campaign ${campaignId}:`, error);
      return {
        success: false,
        action: 'reduce_budget',
        campaignId,
        campaignName,
        previousValue: currentBudget,
        error: error.message || 'Unknown error',
      };
    }
  }
}

export const automationActionsService = new AutomationActionsService();
