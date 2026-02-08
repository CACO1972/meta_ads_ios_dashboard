/**
 * Rule Engine Service
 * Evaluates campaign metrics against user-defined rules and determines actions
 */

import { getDb } from "../db";
import { automationRules, automationLogs, campaignSnapshots } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Types for rule configuration
export interface RuleCondition {
  metric: 'cpr' | 'spend' | 'conversions' | 'ctr' | 'cpc' | 'spend_daily' | 'cpr_trend';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration?: string; // '1d', '3d', '7d' - how long condition must be true
  comparison?: 'absolute' | 'vs_avg_7d' | 'vs_avg_30d'; // Compare to absolute value or historical average
}

export interface RuleAction {
  type: 'pause_campaign' | 'scale_up' | 'scale_down' | 'alert_only' | 'redistribute_budget';
  params?: {
    percentage?: number; // For scale_up/scale_down
    maxChange?: number; // Maximum budget change per day
  };
  notify: boolean;
  channels?: ('email' | 'whatsapp' | 'dashboard')[];
}

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  cpr: number;
  ctr: number;
  cpc: number;
  status: string;
  // Historical data
  spend7dAvg?: number;
  cpr7dAvg?: number;
  cprTrend?: 'improving' | 'stable' | 'degrading';
}

/**
 * Evaluate a single condition against campaign metrics
 */
export function evaluateCondition(
  condition: RuleCondition,
  metrics: CampaignMetrics,
  historicalData?: CampaignMetrics[]
): boolean {
  let value = metrics[condition.metric as keyof CampaignMetrics] as number;
  let threshold = condition.threshold;

  // Adjust threshold based on comparison type
  if (condition.comparison && condition.comparison !== 'absolute') {
    if (condition.comparison === 'vs_avg_7d') {
      const avg = calculateAverage(historicalData || [], condition.metric, 7);
      threshold = avg * (1 + condition.threshold / 100); // threshold is percentage
    } else if (condition.comparison === 'vs_avg_30d') {
      const avg = calculateAverage(historicalData || [], condition.metric, 30);
      threshold = avg * (1 + condition.threshold / 100);
    }
  }

  // Evaluate operator
  switch (condition.operator) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    case '==':
      return Math.abs(value - threshold) < 0.01; // Float comparison
    case '!=':
      return Math.abs(value - threshold) >= 0.01;
    default:
      return false;
  }
}

/**
 * Calculate average of a metric over N days
 */
function calculateAverage(
  historicalData: CampaignMetrics[],
  metric: string,
  days: number
): number {
  if (historicalData.length === 0) return 0;
  
  const recentData = historicalData.slice(0, Math.min(days, historicalData.length));
  const sum = recentData.reduce((acc, data) => {
    return acc + (data[metric as keyof CampaignMetrics] as number || 0);
  }, 0);
  
  return sum / recentData.length;
}

/**
 * Evaluate all conditions for a rule (AND logic)
 */
export function evaluateRule(
  conditions: RuleCondition[],
  metrics: CampaignMetrics,
  historicalData?: CampaignMetrics[]
): { passed: boolean; conditionsMet: RuleCondition[] } {
  const conditionsMet: RuleCondition[] = [];
  
  for (const condition of conditions) {
    if (evaluateCondition(condition, metrics, historicalData)) {
      conditionsMet.push(condition);
    }
  }
  
  // All conditions must be met (AND logic)
  const passed = conditionsMet.length === conditions.length;
  
  return { passed, conditionsMet };
}

/**
 * Check if rule is in cooldown period
 */
export async function isRuleInCooldown(
  ruleId: number,
  cooldownHours: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const rule = await db
    .select()
    .from(automationRules)
    .where(eq(automationRules.id, ruleId))
    .limit(1);
  
  if (rule.length === 0 || !rule[0].lastExecutedAt) {
    return false;
  }
  
  const lastExecuted = new Date(rule[0].lastExecutedAt);
  const now = new Date();
  const hoursSinceLastExecution = (now.getTime() - lastExecuted.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastExecution < cooldownHours;
}

/**
 * Get historical data for a campaign
 */
export async function getCampaignHistory(
  userId: number,
  campaignId: string,
  days: number = 30
): Promise<CampaignMetrics[]> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const snapshots = await db
    .select()
    .from(campaignSnapshots)
    .where(
      and(
        eq(campaignSnapshots.userId, userId),
        eq(campaignSnapshots.campaignId, campaignId)
      )
    )
    .orderBy(desc(campaignSnapshots.snapshotDate))
    .limit(days);
  
  return snapshots.map(snapshot => ({
    campaignId: snapshot.campaignId,
    campaignName: snapshot.campaignName || '',
    objective: snapshot.objective || '',
    spend: Number(snapshot.spend) || 0,
    impressions: snapshot.impressions || 0,
    clicks: snapshot.clicks || 0,
    results: snapshot.results || 0,
    cpr: Number(snapshot.cpr) || 0,
    ctr: Number(snapshot.ctr) || 0,
    cpc: Number(snapshot.cpc) || 0,
    status: 'ACTIVE',
    cprTrend: snapshot.cprTrend as 'improving' | 'stable' | 'degrading' | undefined,
  }));
}

/**
 * Log automation decision
 */
export async function logAutomationDecision(
  userId: number,
  ruleId: number | null,
  campaignId: string,
  campaignName: string,
  ruleType: string,
  conditionsMet: RuleCondition[],
  actionTaken: string,
  actionDetails: any,
  metrics: CampaignMetrics,
  success: boolean,
  errorMessage?: string,
  isSimulation: boolean = false
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  await db.insert(automationLogs).values({
    userId,
    ruleId,
    campaignId,
    campaignName,
    ruleType,
    conditionsMet: JSON.stringify(conditionsMet),
    actionTaken,
    actionDetails: JSON.stringify(actionDetails),
    metricsSnapshot: JSON.stringify(metrics),
    success,
    errorMessage: errorMessage || null,
    isSimulation,
  });
}

/**
 * Update rule execution timestamp
 */
export async function updateRuleExecution(ruleId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  await db
    .update(automationRules)
    .set({
      lastExecutedAt: new Date(),
      executionCount: sql`${automationRules.executionCount} + 1`,
    })
    .where(eq(automationRules.id, ruleId));
}

/**
 * Get active rules for a user
 */
export async function getActiveRules(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  return await db
    .select()
    .from(automationRules)
    .where(
      and(
        eq(automationRules.userId, userId),
        eq(automationRules.isActive, true)
      )
    )
    .orderBy(desc(automationRules.priority));
}

/**
 * Evaluate all rules for a campaign
 */
export async function evaluateCampaignRules(
  userId: number,
  metrics: CampaignMetrics,
  isSimulation: boolean = false
): Promise<{
  actionsToTake: Array<{
    rule: any;
    action: RuleAction;
    conditionsMet: RuleCondition[];
  }>;
}> {
  const rules = await getActiveRules(userId);
  const historicalData = await getCampaignHistory(userId, metrics.campaignId);
  
  const actionsToTake: Array<{
    rule: any;
    action: RuleAction;
    conditionsMet: RuleCondition[];
  }> = [];
  
  for (const rule of rules) {
    // Check cooldown
    if (!isSimulation && await isRuleInCooldown(rule.id, rule.cooldownHours || 24)) {
      continue;
    }
    
    // Evaluate conditions
    const conditions = rule.conditions as unknown as RuleCondition[];
    const { passed, conditionsMet } = evaluateRule(conditions, metrics, historicalData);
    
    if (passed) {
      const actions = rule.actions as unknown as RuleAction;
      actionsToTake.push({
        rule,
        action: actions,
        conditionsMet,
      });
      
      // Log the decision
      await logAutomationDecision(
        userId,
        rule.id,
        metrics.campaignId,
        metrics.campaignName,
        rule.ruleType,
        conditionsMet,
        actions.type,
        actions.params || {},
        metrics,
        true,
        undefined,
        isSimulation
      );
      
      // Update execution timestamp (only if not simulation)
      if (!isSimulation) {
        await updateRuleExecution(rule.id);
      }
    }
  }
  
  return { actionsToTake };
}

export default {
  evaluateCondition,
  evaluateRule,
  isRuleInCooldown,
  getCampaignHistory,
  logAutomationDecision,
  updateRuleExecution,
  getActiveRules,
  evaluateCampaignRules,
};
