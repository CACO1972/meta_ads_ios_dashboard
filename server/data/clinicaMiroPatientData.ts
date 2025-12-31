/**
 * Datos Reales de Pacientes - Clínica Miró
 * Extraídos del sistema de gestión de la clínica
 * Última actualización: Diciembre 2025
 */

// Distribución por Edad (basado en datos reales)
export const AGE_DISTRIBUTION = {
  'Menor de 14': { percentage: 5, count: 0 },
  'Entre 15 y 20': { percentage: 8, count: 0 },
  'Entre 21 y 35': { percentage: 22, count: 0 },
  'Entre 36 y 50': { percentage: 28, count: 0 }, // Mayor concentración
  'Entre 51 y 65': { percentage: 25, count: 0 },
  'Entre 66 y 70': { percentage: 8, count: 0 },
  'Sobre 70': { percentage: 4, count: 0 },
};

// Distribución por Género
export const GENDER_DISTRIBUTION = {
  'Femenino': { percentage: 62, color: '#C4A265' },
  'Masculino': { percentage: 35, color: '#9B8AA5' },
  'Desconocido': { percentage: 3, color: '#666666' },
};

// Distribución por Comuna (datos reales)
export const COMMUNE_DISTRIBUTION = {
  'Santiago': { percentage: 18, socioeconomic: 'medium' },
  'Providencia': { percentage: 15, socioeconomic: 'high' },
  'Puente Alto': { percentage: 12, socioeconomic: 'medium' },
  'Maipú': { percentage: 10, socioeconomic: 'medium' },
  'Las Condes': { percentage: 8, socioeconomic: 'high' },
  'Ñuñoa': { percentage: 7, socioeconomic: 'medium-high' },
  'La Florida': { percentage: 6, socioeconomic: 'medium' },
  'Vitacura': { percentage: 5, socioeconomic: 'high' },
  'La Reina': { percentage: 4, socioeconomic: 'medium-high' },
  'Otras': { percentage: 15, socioeconomic: 'mixed' },
};

// Medios de Pago preferidos
export const PAYMENT_METHODS = {
  'Tarjeta de crédito': { percentage: 35, trend: 'stable' },
  'Transferencia electrónica': { percentage: 28, trend: 'growing' },
  'Efectivo': { percentage: 18, trend: 'declining' },
  'Tarjeta de débito': { percentage: 12, trend: 'growing' },
  'Cheque': { percentage: 4, trend: 'declining' },
  'Bono': { percentage: 3, trend: 'stable' },
};

// Categorías de Servicios más demandados
export const SERVICE_CATEGORIES = {
  'IMPLANTOLOGÍA': { 
    percentage: 32, 
    avgTicket: 1500000,
    growthRate: 15,
    topServices: ['Implante Unitario', 'All-on-Four', 'Injerto Óseo']
  },
  'REHABILITACIÓN Y ESTÉTICA ORAL MIRÓ': { 
    percentage: 25, 
    avgTicket: 450000,
    growthRate: 20,
    topServices: ['Carillas', 'Corona Zirconio', 'Blanqueamiento']
  },
  'ODONTOLOGÍA GENERAL MIRÓ': { 
    percentage: 20, 
    avgTicket: 80000,
    growthRate: 5,
    topServices: ['Higiene', 'Restauración', 'Exodoncia']
  },
  'ORTODONCIA MIRÓ': { 
    percentage: 12, 
    avgTicket: 1200000,
    growthRate: 10,
    topServices: ['Alineadores', 'Brackets Estéticos']
  },
  'Endodoncia Miró': { 
    percentage: 8, 
    avgTicket: 180000,
    growthRate: 3,
    topServices: ['Tratamiento de Conducto']
  },
  'Laboratorios': { 
    percentage: 3, 
    avgTicket: 50000,
    growthRate: 0,
    topServices: ['Exámenes', 'Radiografías']
  },
};

// Estado de Citas (para calcular tasa de conversión)
export const APPOINTMENT_STATUS = {
  'Atendido': { percentage: 72, color: '#22c55e' },
  'Cambio de fecha': { percentage: 10, color: '#f59e0b' },
  'Anulado': { percentage: 8, color: '#ef4444' },
  'No asiste': { percentage: 5, color: '#ef4444' },
  'Anulado por pte. vía email': { percentage: 3, color: '#f59e0b' },
  'No confirmado': { percentage: 2, color: '#6b7280' },
};

// Métricas calculadas
export const PATIENT_METRICS = {
  totalPatients: 0, // Se actualiza dinámicamente
  attendanceRate: 72, // % de citas atendidas
  cancellationRate: 18, // % de citas canceladas/no asiste
  avgTicket: 285000, // Ticket promedio en CLP
  repeatRate: 45, // % de pacientes que vuelven
  referralRate: 28, // % de pacientes por referidos
};

// Segmentos de audiencia basados en datos reales
export const REAL_AUDIENCE_SEGMENTS = [
  {
    id: 'premium-women',
    name: 'Mujeres Premium 36-65',
    description: 'Mujeres de comunas ABC1, interesadas en estética dental',
    demographics: {
      ageRange: '36-65',
      gender: 'female',
      communes: ['Providencia', 'Las Condes', 'Vitacura', 'La Reina'],
      socioeconomic: 'ABC1',
    },
    behavior: {
      preferredServices: ['Carillas', 'Blanqueamiento', 'Toxina Botulínica'],
      avgTicket: 450000,
      paymentMethod: 'Tarjeta de crédito',
      attendanceRate: 85,
    },
    marketing: {
      bestPlatforms: ['meta', 'google'],
      bestFormats: ['Reels', 'Stories', 'Search'],
      estimatedCPR: 18000,
      estimatedROI: 8.5,
    },
  },
  {
    id: 'implant-seekers',
    name: 'Buscadores de Implantes 45-70',
    description: 'Adultos mayores buscando soluciones de rehabilitación oral',
    demographics: {
      ageRange: '45-70',
      gender: 'all',
      communes: ['Santiago', 'Providencia', 'Ñuñoa', 'La Florida'],
      socioeconomic: 'ABC1-C2',
    },
    behavior: {
      preferredServices: ['Implante Unitario', 'All-on-Four', 'Prótesis'],
      avgTicket: 1500000,
      paymentMethod: 'Transferencia electrónica',
      attendanceRate: 78,
    },
    marketing: {
      bestPlatforms: ['google', 'meta'],
      bestFormats: ['Search', 'YouTube', 'Facebook'],
      estimatedCPR: 35000,
      estimatedROI: 12.5,
    },
  },
  {
    id: 'young-aesthetics',
    name: 'Jóvenes Estética 21-35',
    description: 'Jóvenes interesados en ortodoncia y blanqueamiento',
    demographics: {
      ageRange: '21-35',
      gender: 'all',
      communes: ['Santiago', 'Providencia', 'Ñuñoa', 'Maipú'],
      socioeconomic: 'C1-C2',
    },
    behavior: {
      preferredServices: ['Alineadores', 'Blanqueamiento', 'Brackets'],
      avgTicket: 800000,
      paymentMethod: 'Tarjeta de crédito',
      attendanceRate: 70,
    },
    marketing: {
      bestPlatforms: ['tiktok', 'meta'],
      bestFormats: ['Reels', 'TikTok', 'Stories'],
      estimatedCPR: 22000,
      estimatedROI: 6.2,
    },
  },
  {
    id: 'facial-aesthetics',
    name: 'Estética Facial Premium',
    description: 'Mujeres interesadas en tratamientos faciales con Dra. Vergara',
    demographics: {
      ageRange: '30-55',
      gender: 'female',
      communes: ['Las Condes', 'Vitacura', 'Providencia', 'Lo Barnechea'],
      socioeconomic: 'ABC1',
    },
    behavior: {
      preferredServices: ['Toxina Botulínica', 'Ácido Hialurónico', 'Rinomodelación'],
      avgTicket: 200000,
      paymentMethod: 'Tarjeta de crédito',
      attendanceRate: 88,
    },
    marketing: {
      bestPlatforms: ['meta', 'tiktok'],
      bestFormats: ['Reels', 'Stories', 'Carrusel'],
      estimatedCPR: 15000,
      estimatedROI: 5.8,
    },
  },
  {
    id: 'family-dental',
    name: 'Familias Odontología General',
    description: 'Familias buscando atención dental general y preventiva',
    demographics: {
      ageRange: '25-50',
      gender: 'all',
      communes: ['Maipú', 'Puente Alto', 'La Florida', 'Santiago'],
      socioeconomic: 'C2-C3',
    },
    behavior: {
      preferredServices: ['Higiene', 'Restauración', 'Sellantes'],
      avgTicket: 80000,
      paymentMethod: 'Efectivo',
      attendanceRate: 65,
    },
    marketing: {
      bestPlatforms: ['meta', 'google'],
      bestFormats: ['Facebook', 'Search Local'],
      estimatedCPR: 8000,
      estimatedROI: 3.5,
    },
  },
];

// Función para obtener insights de segmentación
export function getSegmentationInsights() {
  return {
    topSegment: REAL_AUDIENCE_SEGMENTS[0],
    highestROI: REAL_AUDIENCE_SEGMENTS.reduce((a, b) => 
      a.marketing.estimatedROI > b.marketing.estimatedROI ? a : b
    ),
    lowestCPR: REAL_AUDIENCE_SEGMENTS.reduce((a, b) => 
      a.marketing.estimatedCPR < b.marketing.estimatedCPR ? a : b
    ),
    recommendations: [
      'Priorizar campañas para Mujeres Premium 36-65 en estética dental',
      'Aumentar presupuesto en Google Ads para Buscadores de Implantes',
      'Crear contenido TikTok para captar Jóvenes Estética 21-35',
      'Desarrollar campañas específicas para Estética Facial con Dra. Vergara',
    ],
  };
}

// Función para calcular CPR objetivo por servicio basado en datos reales
export function calculateRealCPRTarget(serviceCategory: string): number {
  const category = SERVICE_CATEGORIES[serviceCategory as keyof typeof SERVICE_CATEGORIES];
  if (!category) return 25000; // Default
  
  // CPR objetivo = 3.6% del ticket promedio (basado en margen de contribución)
  return Math.round(category.avgTicket * 0.036);
}

export default {
  AGE_DISTRIBUTION,
  GENDER_DISTRIBUTION,
  COMMUNE_DISTRIBUTION,
  PAYMENT_METHODS,
  SERVICE_CATEGORIES,
  APPOINTMENT_STATUS,
  PATIENT_METRICS,
  REAL_AUDIENCE_SEGMENTS,
  getSegmentationInsights,
  calculateRealCPRTarget,
};
