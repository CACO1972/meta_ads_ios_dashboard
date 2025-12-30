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

/**
 * Platform Credentials table
 * Stores credentials for multiple advertising platforms
 */
export const platformCredentials = mysqlTable("platformCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  platform: mysqlEnum("platform", ["meta", "tiktok", "google"]).notNull(),
  
  // Common fields
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accountId: varchar("accountId", { length: 255 }),
  
  // Platform-specific fields (JSON)
  platformConfig: json("platformConfig"), // Store platform-specific config
  
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformCredentials = typeof platformCredentials.$inferSelect;
export type InsertPlatformCredentials = typeof platformCredentials.$inferInsert;

/**
 * Global Campaigns table
 * Stores AI-proposed multi-platform campaigns
 */
export const globalCampaigns = mysqlTable("globalCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Campaign info
  name: varchar("name", { length: 255 }).notNull(),
  objective: varchar("objective", { length: 100 }).notNull(), // awareness, traffic, conversions
  serviceId: int("serviceId").references(() => services.id),
  
  // Budget distribution
  totalBudget: decimal("totalBudget", { precision: 15, scale: 2 }).notNull(),
  metaBudget: decimal("metaBudget", { precision: 15, scale: 2 }),
  tiktokBudget: decimal("tiktokBudget", { precision: 15, scale: 2 }),
  googleBudget: decimal("googleBudget", { precision: 15, scale: 2 }),
  
  // Target audience
  targetAgeMin: int("targetAgeMin"),
  targetAgeMax: int("targetAgeMax"),
  targetGender: mysqlEnum("targetGender", ["all", "male", "female"]),
  targetLocations: json("targetLocations"), // ["Santiago", "Providencia"]
  targetInterests: json("targetInterests"), // ["dental", "health"]
  targetSocioeconomic: mysqlEnum("targetSocioeconomic", ["all", "high", "medium-high", "medium", "medium-low", "low"]),
  
  // AI reasoning
  strategy: text("strategy").notNull(), // AI explanation of the strategy
  expectedResults: json("expectedResults"), // { impressions, clicks, conversions, cpr }
  
  // Status
  status: mysqlEnum("status", ["draft", "pending_approval", "approved", "active", "paused", "completed", "rejected"]).default("draft").notNull(),
  approvedAt: timestamp("approvedAt"),
  rejectedAt: timestamp("rejectedAt"),
  rejectionReason: text("rejectionReason"),
  
  // Platform campaign IDs (after creation)
  metaCampaignId: varchar("metaCampaignId", { length: 100 }),
  tiktokCampaignId: varchar("tiktokCampaignId", { length: 100 }),
  googleCampaignId: varchar("googleCampaignId", { length: 100 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GlobalCampaign = typeof globalCampaigns.$inferSelect;
export type InsertGlobalCampaign = typeof globalCampaigns.$inferInsert;

/**
 * Content Production Guide table
 * Stores AI-generated content recommendations and scripts
 */
export const contentGuides = mysqlTable("contentGuides", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Content type
  type: mysqlEnum("type", ["video", "photo", "testimonial", "educational", "promotional", "behind_scenes"]).notNull(),
  platform: mysqlEnum("platform", ["all", "meta", "tiktok", "google", "instagram", "youtube"]).notNull(),
  serviceId: int("serviceId").references(() => services.id),
  
  // Content details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  
  // Script/Guide
  script: text("script"), // Full script for videos
  shotList: json("shotList"), // [{ shot: "Close-up", description: "...", duration: "3s" }]
  equipmentNeeded: json("equipmentNeeded"), // ["ring light", "smartphone"]
  locationSuggestions: json("locationSuggestions"), // ["consultorio", "recepción"]
  
  // Timing
  estimatedDuration: int("estimatedDuration"), // seconds
  recommendedPostTime: json("recommendedPostTime"), // { day: "tuesday", time: "18:00" }
  
  // Priority and status
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_production", "completed", "published"]).default("pending").notNull(),
  
  // AI reasoning
  reasoning: text("reasoning"), // Why this content is recommended
  expectedEngagement: json("expectedEngagement"), // { views, likes, shares, comments }
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentGuide = typeof contentGuides.$inferSelect;
export type InsertContentGuide = typeof contentGuides.$inferInsert;

/**
 * Audience Insights table
 * Stores analyzed audience data from all platforms
 */
export const audienceInsights = mysqlTable("audienceInsights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  platform: mysqlEnum("platform", ["meta", "tiktok", "google", "combined"]).notNull(),
  
  // Demographics
  ageDistribution: json("ageDistribution"), // { "18-24": 15, "25-34": 35, ... }
  genderDistribution: json("genderDistribution"), // { male: 40, female: 60 }
  
  // Geographic
  locationDistribution: json("locationDistribution"), // { "Santiago": 50, "Providencia": 20, ... }
  topComunas: json("topComunas"), // ["Las Condes", "Providencia", "Vitacura"]
  
  // Socioeconomic (estimated)
  socioeconomicDistribution: json("socioeconomicDistribution"), // { high: 30, medium: 50, low: 20 }
  
  // Interests and behaviors
  topInterests: json("topInterests"), // ["salud", "belleza", "bienestar"]
  deviceUsage: json("deviceUsage"), // { mobile: 80, desktop: 20 }
  peakActivityTimes: json("peakActivityTimes"), // { monday: ["18:00", "20:00"], ... }
  
  // Performance by segment
  bestPerformingSegments: json("bestPerformingSegments"), // [{ segment: "...", cpr: ..., roi: ... }]
  
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AudienceInsight = typeof audienceInsights.$inferSelect;
export type InsertAudienceInsight = typeof audienceInsights.$inferInsert;
