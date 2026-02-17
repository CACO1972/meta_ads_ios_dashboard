# Resultados Auditoría BD

## Tablas existentes (24 total)
- __drizzle_migrations: ~6 filas (migraciones)
- aiCopilotConfig: ~1 fila
- audienceInsights: 0
- automationLogs: 0
- automationRules: 0 (TABLA NUEVA, DUPLICADA con automation_rules)
- automation_rules: 0 (TABLA NUEVA, DUPLICADA con automationRules)
- campaignSnapshots: 0
- contentGuides: ~15 filas
- dentalinkAppointments: 0
- dentalinkCredentials: 1 (TIENE DATOS - token 81 chars)
- dentalinkPatients: 0
- dentalinkTreatments: 0
- globalCampaigns: ~5 filas
- leadPatientMatches: 0
- leadToPatientConversions: 0
- metaAdsCredentials: ~1 fila (TABLA ORIGINAL del schema)
- metaAdsLeads: 0
- meta_ads_credentials: 0 (TABLA DUPLICADA creada manualmente)
- platformCredentials: 0
- services: 0
- suggestionApprovals: ~33 filas
- suggestionExecutions: ~33 filas
- suggestions: ~65 filas
- users: 1

## Hallazgos Críticos
1. HAY TABLAS DUPLICADAS: metaAdsCredentials vs meta_ads_credentials, automationRules vs automation_rules
2. La tabla ORIGINAL es metaAdsCredentials (del schema Drizzle) - tiene ~1 fila
3. La tabla meta_ads_credentials fue creada manualmente y está VACÍA
4. Dentalink tiene credenciales pero da error 401 constantemente
5. emailNotificationSettings NO EXISTE
6. Muchas tablas están vacías (0 registros)
