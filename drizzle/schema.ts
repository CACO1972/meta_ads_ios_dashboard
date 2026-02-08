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

/**
 * Dentalink CRM Credentials table
 * Stores credentials for Dentalink API integration
 */
export const dentalinkCredentials = mysqlTable("dentalinkCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  
  apiToken: text("apiToken").notNull(),
  
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DentalinkCredentials = typeof dentalinkCredentials.$inferSelect;
export type InsertDentalinkCredentials = typeof dentalinkCredentials.$inferInsert;

/**
 * Dentalink Patients table
 * Stores synchronized patients from Dentalink CRM
 */
export const dentalinkPatients = mysqlTable("dentalinkPatients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Dentalink patient data
  dentalinkId: int("dentalinkId").notNull(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  apellidos: varchar("apellidos", { length: 255 }).notNull(),
  rut: varchar("rut", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  celular: varchar("celular", { length: 20 }),
  telefono: varchar("telefono", { length: 20 }),
  fechaNacimiento: varchar("fechaNacimiento", { length: 10 }), // YYYY-MM-DD
  sexo: mysqlEnum("sexo", ["M", "F"]),
  direccion: text("direccion"),
  comuna: varchar("comuna", { length: 100 }),
  ciudad: varchar("ciudad", { length: 100 }),
  
  // Timestamps from Dentalink
  dentalinkCreatedAt: timestamp("dentalinkCreatedAt"),
  dentalinkUpdatedAt: timestamp("dentalinkUpdatedAt"),
  
  // Sync tracking
  lastSyncAt: timestamp("lastSyncAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DentalinkPatient = typeof dentalinkPatients.$inferSelect;
export type InsertDentalinkPatient = typeof dentalinkPatients.$inferInsert;

/**
 * Lead to Patient Conversion table
 * Tracks conversion from Meta Ads lead to Dentalink patient
 */
export const leadToPatientConversions = mysqlTable("leadToPatientConversions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Lead information (from Meta Ads)
  leadId: varchar("leadId", { length: 255 }).notNull(),
  leadName: varchar("leadName", { length: 255 }),
  leadPhone: varchar("leadPhone", { length: 20 }),
  leadEmail: varchar("leadEmail", { length: 320 }),
  leadSource: varchar("leadSource", { length: 100 }), // "meta", "tiktok", "google"
  campaignId: varchar("campaignId", { length: 255 }),
  campaignName: varchar("campaignName", { length: 255 }),
  adId: varchar("adId", { length: 255 }),
  adName: varchar("adName", { length: 255 }),
  leadCreatedAt: timestamp("leadCreatedAt"),
  
  // Patient information (from Dentalink)
  patientId: int("patientId").references(() => dentalinkPatients.id),
  dentalinkPatientId: int("dentalinkPatientId"),
  
  // Conversion tracking
  conversionStatus: mysqlEnum("conversionStatus", [
    "pending",        // Lead received, not yet matched
    "matched",        // Matched to existing patient
    "converted",      // New patient created in Dentalink
    "appointment_scheduled", // Appointment scheduled
    "treatment_started",     // Treatment started
    "treatment_completed",   // Treatment completed
    "lost"            // Lead lost (no conversion)
  ]).default("pending").notNull(),
  
  // Matching confidence (0-1)
  matchingConfidence: decimal("matchingConfidence", { precision: 5, scale: 2 }),
  matchingMethod: varchar("matchingMethod", { length: 50 }), // "phone", "email", "rut", "manual"
  
  // Conversion metrics
  daysToConversion: int("daysToConversion"), // Days from lead to patient
  appointmentDate: timestamp("appointmentDate"),
  treatmentValue: decimal("treatmentValue", { precision: 15, scale: 2 }), // Total treatment value
  paidAmount: decimal("paidAmount", { precision: 15, scale: 2 }), // Amount paid
  
  // Notes
  notes: text("notes"),
  
  // Timestamps
  matchedAt: timestamp("matchedAt"),
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadToPatientConversion = typeof leadToPatientConversions.$inferSelect;
export type InsertLeadToPatientConversion = typeof leadToPatientConversions.$inferInsert;

/**
 * Dentalink Appointments table
 * Stores synchronized appointments from Dentalink CRM
 */
export const dentalinkAppointments = mysqlTable("dentalinkAppointments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Dentalink appointment data
  dentalinkId: int("dentalinkId").notNull(),
  patientId: int("patientId").references(() => dentalinkPatients.id),
  dentalinkPatientId: int("dentalinkPatientId").notNull(),
  dentistId: int("dentistId"),
  sucursalId: int("sucursalId"),
  estadoId: int("estadoId"),
  
  fecha: varchar("fecha", { length: 10 }).notNull(), // YYYY-MM-DD
  horaInicio: varchar("horaInicio", { length: 5 }).notNull(), // HH:MM
  duracion: int("duracion").notNull(), // minutes
  comentarios: text("comentarios"),
  
  estadoNombre: varchar("estadoNombre", { length: 100 }),
  estadoColor: varchar("estadoColor", { length: 20 }),
  
  // Sync tracking
  lastSyncAt: timestamp("lastSyncAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DentalinkAppointment = typeof dentalinkAppointments.$inferSelect;
export type InsertDentalinkAppointment = typeof dentalinkAppointments.$inferInsert;

/**
 * Dentalink Treatments table
 * Stores synchronized treatments from Dentalink CRM
 */
export const dentalinkTreatments = mysqlTable("dentalinkTreatments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Dentalink treatment data
  dentalinkId: int("dentalinkId").notNull(),
  patientId: int("patientId").references(() => dentalinkPatients.id),
  dentalinkPatientId: int("dentalinkPatientId").notNull(),
  dentistId: int("dentistId"),
  sucursalId: int("sucursalId"),
  
  nombre: varchar("nombre", { length: 255 }).notNull(),
  fecha: varchar("fecha", { length: 10 }).notNull(), // YYYY-MM-DD
  finalizado: boolean("finalizado").default(false).notNull(),
  expirado: boolean("expirado").default(false).notNull(),
  bloqueado: boolean("bloqueado").default(false).notNull(),
  
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  pagado: decimal("pagado", { precision: 15, scale: 2 }).notNull(),
  saldo: decimal("saldo", { precision: 15, scale: 2 }).notNull(),
  
  // Sync tracking
  lastSyncAt: timestamp("lastSyncAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DentalinkTreatment = typeof dentalinkTreatments.$inferSelect;
export type InsertDentalinkTreatment = typeof dentalinkTreatments.$inferInsert;

/**
 * Meta Ads Leads table
 * Stores leads from Meta Ads campaigns for matching with Dentalink patients
 */
export const metaAdsLeads = mysqlTable("metaAdsLeads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Lead contact information
  nombre: varchar("nombre", { length: 100 }),
  apellido: varchar("apellido", { length: 100 }),
  email: varchar("email", { length: 255 }),
  telefono: varchar("telefono", { length: 50 }),
  
  // Meta Ads campaign data
  campaignId: varchar("campaignId", { length: 100 }),
  campaignName: varchar("campaignName", { length: 255 }),
  adId: varchar("adId", { length: 100 }),
  adName: varchar("adName", { length: 255 }),
  adsetId: varchar("adsetId", { length: 100 }),
  adsetName: varchar("adsetName", { length: 255 }),
  
  // Cost data
  costPerResult: decimal("costPerResult", { precision: 15, scale: 2 }),
  spend: decimal("spend", { precision: 15, scale: 2 }),
  
  // Lead timestamp
  leadTimestamp: timestamp("leadTimestamp").notNull(),
  
  // Tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MetaAdsLead = typeof metaAdsLeads.$inferSelect;
export type InsertMetaAdsLead = typeof metaAdsLeads.$inferInsert;

/**
 * Lead Patient Matches table
 * Stores matches between Meta Ads leads and Dentalink patients with confidence scoring
 */
export const leadPatientMatches = mysqlTable("leadPatientMatches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Match relationship
  leadId: int("leadId").notNull().references(() => metaAdsLeads.id),
  patientId: int("patientId").notNull().references(() => dentalinkPatients.id),
  
  // Match scoring
  matchScore: int("matchScore").notNull(), // 0-100
  matchMethod: varchar("matchMethod", { length: 50 }).notNull(), // 'email', 'phone', 'name_fuzzy'
  matchDetails: json("matchDetails"), // Store detailed match info
  
  // Match status
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'confirmed', 'rejected'
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy").references(() => users.id),
  
  // Tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeadPatientMatch = typeof leadPatientMatches.$inferSelect;
export type InsertLeadPatientMatch = typeof leadPatientMatches.$inferInsert;

/**
 * Automation Rules table
 * Stores user-defined automation rules for campaign optimization
 */
export const automationRules = mysqlTable("automationRules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Rule configuration
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ruleType: varchar("ruleType", { length: 50 }).notNull(), // 'pause_high_cpr', 'scale_winner', 'redistribute_budget', 'alert_only'
  
  // Condition configuration (JSON)
  conditions: json("conditions").notNull(), // { metric: 'cpr', operator: '>', threshold: 50, duration: '3d' }
  
  // Action configuration (JSON)
  actions: json("actions").notNull(), // { type: 'pause_campaign', notify: true, channels: ['email', 'dashboard'] }
  
  // Rule status
  isActive: boolean("isActive").default(true).notNull(),
  priority: int("priority").default(0).notNull(), // Higher priority rules execute first
  
  // Execution settings
  cooldownHours: int("cooldownHours").default(24), // Minimum hours between executions
  lastExecutedAt: timestamp("lastExecutedAt"),
  executionCount: int("executionCount").default(0).notNull(),
  
  // Tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

/**
 * Automation Logs table
 * Records all automated decisions and actions taken by the system
 */
export const automationLogs = mysqlTable("automationLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  ruleId: int("ruleId").references(() => automationRules.id),
  
  // Campaign affected
  campaignId: varchar("campaignId", { length: 100 }),
  campaignName: varchar("campaignName", { length: 255 }),
  
  // Decision details
  ruleType: varchar("ruleType", { length: 50 }).notNull(),
  conditionsMet: json("conditionsMet").notNull(), // What triggered the rule
  actionTaken: varchar("actionTaken", { length: 100 }).notNull(), // 'paused', 'scaled_up', 'scaled_down', 'alert_sent'
  actionDetails: json("actionDetails"), // Detailed action info
  
  // Metrics at decision time
  metricsSnapshot: json("metricsSnapshot"), // CPR, spend, conversions, etc.
  
  // Execution result
  success: boolean("success").notNull(),
  errorMessage: text("errorMessage"),
  
  // Simulation mode
  isSimulation: boolean("isSimulation").default(false).notNull(),
  
  // Tracking
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AutomationLog = typeof automationLogs.$inferSelect;
export type InsertAutomationLog = typeof automationLogs.$inferInsert;

/**
 * Campaign Performance Snapshots table
 * Stores historical performance data for trend analysis
 */
export const campaignSnapshots = mysqlTable("campaignSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  
  // Campaign identification
  campaignId: varchar("campaignId", { length: 100 }).notNull(),
  campaignName: varchar("campaignName", { length: 255 }),
  objective: varchar("objective", { length: 100 }),
  
  // Performance metrics
  spend: decimal("spend", { precision: 15, scale: 2 }),
  impressions: int("impressions"),
  clicks: int("clicks"),
  results: int("results"),
  cpr: decimal("cpr", { precision: 15, scale: 2 }),
  ctr: decimal("ctr", { precision: 10, scale: 4 }),
  cpc: decimal("cpc", { precision: 15, scale: 2 }),
  
  // Calculated metrics
  cprTrend: varchar("cprTrend", { length: 20 }), // 'improving', 'stable', 'degrading'
  performanceScore: int("performanceScore"), // 0-100
  
  // Snapshot metadata
  snapshotDate: varchar("snapshotDate", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CampaignSnapshot = typeof campaignSnapshots.$inferSelect;
export type InsertCampaignSnapshot = typeof campaignSnapshots.$inferInsert;
