# Meta Ads iOS Dashboard - TODO

## ✅ Completado
- [x] Actualizar proyecto a full-stack (web-db-user)
- [x] Solicitar credenciales de Meta Ads API al usuario
- [x] Crear página de configuración de credenciales
- [x] Crear formulario seguro para ingresar tokens
- [x] Guardar credenciales en variables de entorno
- [x] Agregar enlace de Settings al menú lateral del dashboard
- [x] Corregir error 404 en ruta /settings
- [x] Probar conexión exitosa con Meta Ads API

## ✅ Completado
- [x] Implementar endpoint para obtener campañas desde Meta Ads API
- [x] Implementar endpoint para obtener anuncios desde Meta Ads API
- [x] Implementar endpoint para obtener insights/métricas desde Meta Ads API
- [x] Crear guía estratégica de uso del dashboard
- [x] Crear procedimientos tRPC para exponer datos de Meta Ads al frontend
- [x] Actualizar Home.tsx para obtener datos reales desde tRPC
- [x] Reemplazar datos mock con datos reales en métricas principales
- [x] Actualizar gráficos para usar datos en tiempo real
- [x] Implementar funcionalidad de pausar anuncios
- [x] Agregar manejo de errores y estados de carga

## 📋 Pendiente
- [x] Implementar persistencia de credenciales en base de datos
- [ ] Agregar página de detalles de campaña individual
- [ ] Agregar página de detalles de anuncio individual
- [ ] Implementar alertas automáticas por CPR alto
- [ ] Agregar exportación de reportes en PDF

## 🤖 AI CO-PILOT - SISTEMA DE OPTIMIZACIÓN ASISTIDA
- [x] Diseñar arquitectura del sistema de sugerencias (similar a Meta Ads)
- [x] Implementar backend: análisis automático de todos los factores
- [x] Implementar backend: generación de sugerencias con IA
- [x] Implementar backend: sistema de aprobación/rechazo con un click
- [x] Implementar backend: ejecución automática de acciones aprobadas
- [x] Implementar frontend: panel de sugerencias pendientes
- [x] Implementar frontend: modal de aprobación con detalles e impacto
- [x] Implementar frontend: historial de sugerencias (aprobadas/rechazadas)
- [x] Integrar datos reales de servicios (precios, LTV, ROI por servicio)
- [x] Implementar sugerencias multi-factor: presupuesto, audiencia, creativos, horarios
- [x] Implementar prompt maestro configurable
- [x] Agregar modo automático (sin aprobación) para sugerencias de alto confianza
- [x] Crear tests para validar sugerencias (13 tests pasando)
- [ ] Implementar notificaciones por email

## 🐛 Bugs a Corregir
- [x] Sugerencias no desaparecen después de aprobarlas (VERIFICADO: Funciona correctamente)
- [x] Verificar que las acciones se ejecuten realmente en Meta Ads (VERIFICADO: Las acciones se ejecutan y se registran en la BD)
- [x] Mejorar feedback visual al aprobar/rechazar sugerencias (Toast mejorado con descripción)
- [x] Agregar tests de autenticación para AI Co-Pilot router

## 🚀 AI CO-PILOT AVANZADO
- [x] Implementar modo automático con toggle on/off
- [x] Agregar umbral de confianza configurable para auto-aprobación (default 95%)
- [x] Crear sistema de predicciones de rendimiento basado en histórico
- [x] Implementar análisis de creativos (cuáles funcionan mejor)
- [x] Agregar sugerencias de nuevos creativos basadas en patrones exitosos
- [x] Crear panel de predicciones en la UI
- [x] Agregar indicador visual de modo automático activo
- [ ] Implementar log de acciones auto-ejecutadas
- [x] Agregar tests de validación para configuración (13 tests pasando)

## 📊 ANÁLISIS AVANZADO DE PÚBLICOS
- [x] Implementar análisis demográfico (edad, género)
- [x] Implementar análisis geográfico (comuna, región)
- [x] Implementar análisis de nivel socioeconómico
- [x] Crear visualizaciones de segmentos de audiencia
- [x] Identificar mejores públicos por servicio dental
- [x] Analizar intereses y comportamientos

## 🎯 CREADOR DE CAMPAÑAS CON APROBACIÓN
- [x] Diseñar sistema de propuestas de campañas completas
- [x] Implementar generación automática de estructura de campaña
- [x] Crear flujo de aprobación con un click
- [ ] Implementar creación automática en Meta Ads tras aprobación
- [x] Agregar estimaciones de presupuesto y resultados esperados

## 🎨 INTEGRACIÓN CON CANVA
- [ ] Conectar con API de Canva (requiere autorización del usuario)
- [ ] Implementar generación automática de diseños gráficos
- [ ] Implementar generación de videos promocionales
- [ ] Crear biblioteca de templates por servicio dental
- [ ] Agregar editor de diseños generados

## 🎬 GUÍA DE PRODUCCIÓN DE CONTENIDO
- [x] Crear módulo de recomendaciones de contenido a grabar
- [x] Implementar generador de guiones para videos
- [ ] Agregar calendario de producción sugerido
- [x] Crear templates de guiones por tipo de servicio
- [x] Implementar sugerencias de tomas y escenas

## 🌐 AI CENTRAL - SISTEMA MULTI-PLATAFORMA
- [x] Crear motor de AI Central para estrategias globales
- [x] Implementar coordinación entre Meta Ads, TikTok y Google Ads
- [x] Crear sistema de presupuesto distribuido entre plataformas
- [ ] Implementar optimización automática cross-platform

## 📱 MÓDULO TIKTOK ADS
- [ ] Integrar API de TikTok Ads
- [ ] Implementar análisis de métricas TikTok
- [ ] Crear sugerencias específicas para TikTok
- [ ] Implementar creación de campañas TikTok

## 🔍 MÓDULO GOOGLE ADS
- [ ] Integrar API de Google Ads
- [ ] Implementar análisis de métricas Google Ads
- [ ] Crear sugerencias para Search y Display
- [ ] Implementar creación de campañas Google Ads

## 💰 ARANCELES CLÍNICA MIRÓ (ACTUALIZADOS)
- [x] Prevención: Higiene $59,000 | Sellante $20,000
- [x] Rehabilitación: Implante $759,000 | Injerto $215,000 | All-on-four $3,945,000
- [x] Estética: Carilla $350,000 | Corona $370,000 | Blanqueamiento $235,000
- [x] Ortodoncia: Brackets $990,000/año | Alineadores $990,000-$3,000,000
- [x] General: Restauración $59,000 | Plano $180,000 | Exodoncia $50,000
- [x] Regenerativo: Tratamiento esmalte $80,000

## 💉 ARANCELES ESTÉTICA FACIAL (DRA. VERGARA)
- [x] Ácido Hialurónico por Grupo: $85,284
- [x] Ácido Hialurónico Labios: $191,889
- [x] Ácido Hialurónico Surcos Nasogenianos: $170,568
- [x] Ácido Hialurónico Surcos x2 Jeringas: $277,173
- [x] Mesoterapia por Sesión: $58,633
- [x] Pack Toxina Botulínica 3 Zonas: $226,600
- [x] Toxina Botulínica Frente: $118,289
- [x] Toxina Botulínica Entrecejo: $90,614
- [x] Toxina Botulínica Frente + Entrecejo: $170,568
- [x] Toxina Botulínica Sonrisa Gingival: $106,402
- [x] Toxina Botulínica Zona Periocular: $127,926
- [x] Rinomodelación: $191,889

## 🎨 BRANDING CLÍNICA MIRÓ (INTEGRADO)
- [x] Extraer Brand Voice del documento oficial
- [x] Extraer paleta de colores del Brand Book
- [x] Integrar logos (icono y completo) al proyecto
- [x] Agregar variables CSS de colores Miró
- [x] Actualizar guiones con Brand Voice oficial
- [x] Configurar tono: Profesional, calmo, seguro, educativo, premium
- [x] Implementar reglas de contenido prohibido (sin urgencia, sin garantías)
- [x] Crear archivo de configuración de branding

## 🎨 PALETA DE COLORES OFICIAL
- Oro Principal: #C4A265 (elementos de acción y premium)
- Lila Secundario: #9B8AA5 (categorías y labels)
- Negro Profundo: #0A0A0D (fondo oscuro)
- Crema Cálido: #FCFBF9 (fondo claro)
- Blanco Puro: #FFFFFF

## 📝 BRAND VOICE OFICIAL
- Tono: Profesional, calmo, seguro, educativo, premium
- NUNCA usar: garantías, urgencia, "antes/después" explícito, diagnósticos
- SÍ usar: orientación clínica, evaluación responsable, transparencia
- Tagline: "Tu sonrisa, nuestra pasión"

## 📈 INTEGRACIÓN DATOS REALES DE PACIENTES
- [ ] Integrar datos demográficos reales (edad, género, comuna)
- [ ] Integrar datos de medios de pago
- [ ] Integrar datos de categorías de servicios más usados
- [ ] Integrar datos de estado de citas
- [ ] Actualizar análisis de públicos con datos reales

## 🎨 INTEGRACIÓN CANVA
- [x] Subir logos de Clínica Miró a biblioteca de Canva
- [x] Buscar diseños existentes en cuenta de Canva
- [ ] Crear endpoint para listar diseños de Canva
- [ ] Crear endpoint para exportar diseños
- [ ] Agregar UI para ver y seleccionar diseños
- [ ] Integrar generación con IA cuando esté disponible

## 🔐 PERSISTENCIA DE CREDENCIALES (BUG CORREGIDO)
- [x] Diagnosticar por qué las credenciales no persisten entre sesiones (tabla no existía)
- [x] Implementar guardado permanente de credenciales en base de datos (tabla creada)
- [x] Implementar carga automática de credenciales al iniciar sesión (ya implementado en código)
- [ ] Verificar que Meta API Token se guarde encriptado (pendiente)
- [ ] Probar que las credenciales persistan después de cerrar el navegador

## 🚀 EJECUCIÓN REAL DE ACCIONES META ADS
- [x] Crear servicio de ejecución de acciones Meta Ads (metaAdsExecutor.ts)
- [x] Implementar acción: pausar anuncio (POST /{ad-id} status=PAUSED)
- [x] Implementar acción: activar anuncio (POST /{ad-id} status=ACTIVE)
- [x] Implementar acción: cambiar presupuesto de adset
- [x] Implementar acción: cambiar presupuesto de campaña
- [x] Integrar ejecución en flujo de aprobación de sugerencias
- [x] Agregar manejo de errores y logging
- [x] Implementar rollback en caso de fallo
- [x] Tests unitarios (11 tests pasando)

## 🎯 GOOGLE POMELLI (Herramienta de IA de Google)
- [ ] Investigar integración con Pomelli API (si existe)
- [ ] Evaluar si Pomelli puede generar assets automáticamente para campañas
- [ ] Documentar flujo: Dashboard → Pomelli → Assets → Campañas

## 🔴 GOOGLE ADS API INTEGRATION
- [ ] Crear cuenta de servicio en Google Cloud Console
- [ ] Habilitar Google Ads API
- [ ] Implementar autenticación OAuth 2.0
- [ ] Crear servicio de lectura de campañas Google Ads
- [ ] Crear servicio de creación/modificación de campañas
- [ ] Implementar lectura de métricas (impresiones, clicks, conversiones, CPC)
- [ ] Agregar UI para configurar credenciales de Google Ads
- [ ] Integrar en AI Central para estrategias multi-plataforma
- [ ] Tests unitarios para Google Ads service

## 🎵 TIKTOK ADS API INTEGRATION
- [ ] Crear app en TikTok for Business
- [ ] Implementar autenticación OAuth 2.0 de TikTok
- [ ] Crear servicio de lectura de campañas TikTok Ads
- [ ] Crear servicio de creación/modificación de campañas
- [ ] Implementar lectura de métricas (views, engagement, conversiones)
- [ ] Agregar UI para configurar credenciales de TikTok Ads
- [ ] Integrar en AI Central para estrategias multi-plataforma
- [ ] Tests unitarios para TikTok Ads service

## 🌐 DASHBOARD MULTI-PLATAFORMA UNIFICADO
- [ ] Crear vista consolidada de todas las plataformas (Meta + Google + TikTok)
- [ ] Comparativa de rendimiento cross-platform
- [ ] Recomendaciones de redistribución de presupuesto entre plataformas
- [ ] Alertas unificadas de todas las plataformas

## 🦷 DENTALINK CRM INTEGRATION
- [x] Revisar documentación de Dentalink API (https://api.dentalink.healthatom.com/docs/)
- [x] Crear servicio de autenticación Dentalink (API Key)
- [x] Implementar endpoint para obtener lista de pacientes
- [x] Implementar endpoint para obtener citas agendadas
- [x] Implementar endpoint para obtener tratamientos completados
- [x] Crear tabla en BD para sincronización de pacientes (dentalinkPatients)
- [x] Crear tabla en BD para rastreo de conversiones (leadToPatientConversions)
- [x] Implementar sincronización automática de pacientes (cada 1 hora)
- [x] Crear UI de configuración de credenciales Dentalink
- [ ] Implementar matching de leads (WhatsApp/Meta) con pacientes (Dentalink)
- [x] Crear dashboard de conversiones: Lead → Paciente → Tratamiento
- [x] Calcular ROI real basado en tratamientos completados
- [x] Agregar métricas: Tasa de conversión Lead→Paciente, Valor promedio de tratamiento
- [ ] Implementar alertas de seguimiento (lead sin convertir en 7 días)
- [ ] Tests unitarios para Dentalink service

## 🔧 NAVIGATION FIX
- [x] Agregar opciones de Dentalink al menú de CyberpunkLayout
- [x] Verificar que las rutas /dentalink-settings y /dentalink-conversions sean accesibles desde el menú

## 🧠 MATCHING INTELIGENTE (LEAD → PACIENTE)
- [x] Crear tabla `metaAdsLeads` en BD (nombre, apellido, email, teléfono, campaignId, adId, timestamp)
- [x] Crear tabla `leadPatientMatches` en BD (leadId, patientId, matchScore, matchMethod, status)
- [x] Implementar normalización de teléfonos chilenos (+56, espacios, guiones)
- [x] Implementar algoritmo de similitud fuzzy para nombres (Levenshtein distance)
- [x] Crear servicio de matching con scoring (email=100%, teléfono=90%, nombre=70-85%)
- [x] Implementar matching automático al sincronizar pacientes
- [ ] Crear endpoint tRPC para ejecutar matching manual
- [ ] Crear endpoint tRPC para obtener ROI por campaña
- [ ] Crear endpoint tRPC para obtener ROI por anuncio
- [ ] Crear UI de dashboard de atribución con ROI por campaña/anuncio
- [ ] Visualizar métricas: Total leads, matches confirmados, revenue total, ROI promedio
- [ ] Tests unitarios para algoritmo de matching (email, teléfono, nombre fuzzy)

## 📊 SISTEMA DE REPORTES
- [x] Verificar integración de Meta Ads API y credenciales del usuario
- [x] Crear servicio de generación de reportes (reportService.ts)
- [x] Implementar cálculo de métricas clave (CPR, ROAS, CTR, Conversiones)
- [x] Crear endpoint tRPC para obtener resumen de campañas activas
- [x] Crear endpoint tRPC para generar reporte completo
- [x] Diseñar UI de dashboard de resumen (métricas principales, gráficos)
- [ ] Implementar generador de reportes PDF descargables
- [ ] Implementar generador de reportes Excel descargables
- [ ] Agregar filtros de fecha (últimos 7/30/90 días, personalizado)
- [ ] Agregar comparación de períodos (vs período anterior)
- [ ] Tests del sistema de reportes
