import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Meta Ads API credentials table
 * Stores encrypted credentials for connecting to Meta Ads API
 */
export const metaAdsCredentials = mysqlTable("metaAdsCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  appId: varchar("appId", { length: 255 }).notNull(),
  appSecret: text("appSecret").notNull(),
  accessToken: text("accessToken").notNull(),
  adAccountId: varchar("adAccountId", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MetaAdsCredentials = typeof metaAdsCredentials.$inferSelect;
export type InsertMetaAdsCredentials = typeof metaAdsCredentials.$inferInsert;

/**
 * AI Co-Pilot Suggestions table
 * Stores AI-generated optimization suggestions for campaigns
 */
export const suggestions = mysqlTable("suggestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Suggestion type and priority
  type: mysqlEnum("type", [
    "budget", "audience", "creative", "schedule", 
    "service", "objective", "placement", "device", 
    "location", "strategy"
  ]).notNull(),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "scale_budget", "pause_ad"
  
  // Target information
  targetType: mysqlEnum("targetType", ["ad", "adset", "campaign"]).notNull(),
  targetId: varchar("targetId", { length: 100 }).notNull(),
  targetName: varchar("targetName", { length: 255 }).notNull(),
  serviceName: varchar("serviceName", { length: 100 }),
  
  // Current and proposed state (JSON)
  currentState: json("currentState").notNull(),
  proposedState: json("proposedState").notNull(),
  
  // Impact estimation
  estimatedRevenue: decimal("estimatedRevenue", { precision: 15, scale: 2 }),
  estimatedProfit: decimal("estimatedProfit", { precision: 15, scale: 2 }),
  estimatedSavings: decimal("estimatedSavings", { precision: 15, scale: 2 }),
  estimatedROI: decimal("estimatedROI", { precision: 10, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-1
  risk: mysqlEnum("risk", ["low", "medium", "high"]).notNull(),
  
  // AI reasoning
  reasoning: text("reasoning").notNull(),
  
  // Monitoring configuration (JSON)
  monitoringConfig: json("monitoringConfig"),
  
  // Status
  status: mysqlEnum("status", [
    "pending", "approved", "rejected", "executed", 
    "failed", "rolled_back", "expired"
  ]).default("pending").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  approvedAt: timestamp("approvedAt"),
  executedAt: timestamp("executedAt"),
});

export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = typeof suggestions.$inferInsert;

/**
 * Suggestion Approvals table
 * Tracks user decisions on suggestions
 */
export const suggestionApprovals = mysqlTable("suggestionApprovals", {
  id: int("id").autoincrement().primaryKey(),
  suggestionId: int("suggestionId").notNull().references(() => suggestions.id),
  userId: int("userId").notNull().references(() => users.id),
  
  decision: mysqlEnum("decision", ["approved", "rejected", "postponed"]).notNull(),
  notes: text("notes"),
  postponeUntil: timestamp("postponeUntil"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SuggestionApproval = typeof suggestionApprovals.$inferSelect;
export type InsertSuggestionApproval = typeof suggestionApprovals.$inferInsert;

/**
 * Suggestion Executions table
 * Tracks execution results of approved suggestions
 */
export const suggestionExecutions = mysqlTable("suggestionExecutions", {
  id: int("id").autoincrement().primaryKey(),
  suggestionId: int("suggestionId").notNull().references(() => suggestions.id),
  
  success: boolean("success").notNull(),
  errorMessage: text("errorMessage"),
  
  // Actual impact (measured after execution)
  actualRevenue: decimal("actualRevenue", { precision: 15, scale: 2 }),
  actualProfit: decimal("actualProfit", { precision: 15, scale: 2 }),
  actualSavings: decimal("actualSavings", { precision: 15, scale: 2 }),
  actualROI: decimal("actualROI", { precision: 10, scale: 2 }),
  
  // Meta API response
  apiResponse: json("apiResponse"),
  
  // Rollback info
  rolledBack: boolean("rolledBack").default(false).notNull(),
  rollbackReason: text("rollbackReason"),
  rollbackAt: timestamp("rollbackAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SuggestionExecution = typeof suggestionExecutions.$inferSelect;
export type InsertSuggestionExecution = typeof suggestionExecutions.$inferInsert;

/**
 * Services table
 * Stores clinic services with pricing for ROI calculations
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  name: varchar("name", { length: 100 }).notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  ltv: decimal("ltv", { precision: 15, scale: 2 }).notNull(), // Lifetime value
  cprTarget: decimal("cprTarget", { precision: 15, scale: 2 }).notNull(), // Target CPR (1.8% of LTV)
  cprMax: decimal("cprMax", { precision: 15, scale: 2 }).notNull(), // Max CPR (3.6% of LTV)
  roiMin: decimal("roiMin", { precision: 10, scale: 2 }).default("5").notNull(), // Minimum acceptable ROI
  
  // Keywords to match ads to services
  keywords: json("keywords"), // ["implante", "dental", "implant"]
  
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * AI Co-Pilot Configuration table
 * Stores user's prompt maestro and preferences
 */
export const aiCopilotConfig = mysqlTable("aiCopilotConfig", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  
  // Prompt Maestro (custom rules)
  promptMaestro: text("promptMaestro"),
  
  // Global thresholds
  maxCPR: decimal("maxCPR", { precision: 15, scale: 2 }),
  minROI: decimal("minROI", { precision: 10, scale: 2 }),
  maxFrequency: decimal("maxFrequency", { precision: 5, scale: 2 }),
  maxDailySpend: decimal("maxDailySpend", { precision: 15, scale: 2 }),
  
  // Automation settings
  autoApproveHighConfidence: boolean("autoApproveHighConfidence").default(false).notNull(),
  autoApproveThreshold: decimal("autoApproveThreshold", { precision: 5, scale: 2 }).default("0.95"),
  analysisInterval: int("analysisInterval").default(60).notNull(), // minutes
  
  // Notification settings
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  highPriorityOnly: boolean("highPriorityOnly").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AICopilotConfig = typeof aiCopilotConfig.$inferSelect;
export type InsertAICopilotConfig = typeof aiCopilotConfig.$inferInsert;