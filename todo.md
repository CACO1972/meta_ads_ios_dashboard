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
- [ ] Crear tests para validar sugerencias
- [ ] Implementar notificaciones por email

## 🐛 Bugs a Corregir
- [x] Sugerencias no desaparecen después de aprobarlas (VERIFICADO: Funciona correctamente)
- [x] Verificar que las acciones se ejecuten realmente en Meta Ads (VERIFICADO: Las acciones se ejecutan y se registran en la BD)
- [x] Mejorar feedback visual al aprobar/rechazar sugerencias (Toast mejorado con descripción)
- [x] Agregar tests de autenticación para AI Co-Pilot router
