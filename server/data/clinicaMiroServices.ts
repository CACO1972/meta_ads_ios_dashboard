/**
 * Clínica Miró - Aranceles Oficiales
 * Precios en CLP (Pesos Chilenos)
 * Última actualización: Diciembre 2025
 */

export interface ServiceDefinition {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  priceRange?: { min: number; max: number };
  ltv: number; // Lifetime Value estimado
  cprTarget: number; // CPR objetivo (1.8% del LTV)
  cprMax: number; // CPR máximo (3.6% del LTV)
  keywords: string[];
  targetAudience: {
    ageMin: number;
    ageMax: number;
    gender: 'all' | 'male' | 'female';
    interests: string[];
    socioeconomic: string[];
  };
  bestPlatforms: ('meta' | 'tiktok' | 'google')[];
  contentSuggestions: string[];
}

export const CLINICA_MIRO_SERVICES: ServiceDefinition[] = [
  // ==================== ODONTOLOGÍA ====================
  
  // Prevención
  {
    id: 'higiene-ultrasonica',
    name: 'Higiene Ultrasónica',
    category: 'Odontología',
    subcategory: 'Prevención',
    price: 59000,
    ltv: 177000, // 3 visitas anuales
    cprTarget: 3186,
    cprMax: 6372,
    keywords: ['higiene dental', 'limpieza dental', 'profilaxis', 'sarro'],
    targetAudience: {
      ageMin: 25,
      ageMax: 65,
      gender: 'all',
      interests: ['salud', 'bienestar', 'cuidado personal'],
      socioeconomic: ['medium', 'medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'google'],
    contentSuggestions: ['Antes/después de limpieza', 'Proceso de higiene', 'Tips de cuidado dental'],
  },
  {
    id: 'sellante-unitario',
    name: 'Sellante Unitario',
    category: 'Odontología',
    subcategory: 'Prevención',
    price: 20000,
    ltv: 80000, // 4 dientes promedio
    cprTarget: 1440,
    cprMax: 2880,
    keywords: ['sellante dental', 'prevención caries', 'niños'],
    targetAudience: {
      ageMin: 25,
      ageMax: 45,
      gender: 'all',
      interests: ['familia', 'niños', 'salud infantil'],
      socioeconomic: ['medium', 'medium-high', 'high'],
    },
    bestPlatforms: ['meta'],
    contentSuggestions: ['Educativo para padres', 'Proceso simple y rápido'],
  },

  // Rehabilitación
  {
    id: 'implante-unitario',
    name: 'Implante Unitario',
    category: 'Odontología',
    subcategory: 'Rehabilitación',
    price: 759000,
    ltv: 1518000, // Implante + mantenimiento
    cprTarget: 27324,
    cprMax: 54648,
    keywords: ['implante dental', 'implante', 'diente perdido', 'rehabilitación oral'],
    targetAudience: {
      ageMin: 35,
      ageMax: 70,
      gender: 'all',
      interests: ['salud', 'calidad de vida', 'estética dental'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'google'],
    contentSuggestions: ['Testimonios de pacientes', 'Proceso paso a paso', 'Antes/después'],
  },
  {
    id: 'injerto-oseo',
    name: 'Injerto Óseo',
    category: 'Odontología',
    subcategory: 'Rehabilitación',
    price: 215000,
    ltv: 974000, // Suele ir con implante
    cprTarget: 17532,
    cprMax: 35064,
    keywords: ['injerto óseo', 'hueso dental', 'regeneración ósea'],
    targetAudience: {
      ageMin: 40,
      ageMax: 70,
      gender: 'all',
      interests: ['salud dental', 'implantes'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['google'],
    contentSuggestions: ['Explicación del procedimiento', 'Casos complejos resueltos'],
  },
  {
    id: 'all-on-four',
    name: 'All-on-Four',
    category: 'Odontología',
    subcategory: 'Rehabilitación',
    price: 3945000,
    ltv: 5917500, // Tratamiento completo + mantenimiento
    cprTarget: 106515,
    cprMax: 213030,
    keywords: ['all on four', 'all on 4', 'prótesis fija', 'dientes en un día', 'rehabilitación completa'],
    targetAudience: {
      ageMin: 50,
      ageMax: 75,
      gender: 'all',
      interests: ['calidad de vida', 'salud', 'tercera edad'],
      socioeconomic: ['high'],
    },
    bestPlatforms: ['meta', 'google'],
    contentSuggestions: ['Transformaciones dramáticas', 'Testimonios emotivos', 'Proceso completo'],
  },

  // Estética Dental
  {
    id: 'carilla-disilicato-zirconio',
    name: 'Carilla (Disilicato/Zirconio)',
    category: 'Odontología',
    subcategory: 'Estética',
    price: 350000,
    ltv: 2100000, // 6 carillas promedio
    cprTarget: 37800,
    cprMax: 75600,
    keywords: ['carillas dentales', 'carillas', 'sonrisa perfecta', 'diseño de sonrisa'],
    targetAudience: {
      ageMin: 25,
      ageMax: 55,
      gender: 'all',
      interests: ['estética', 'belleza', 'moda', 'imagen personal'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'tiktok'],
    contentSuggestions: ['Transformaciones de sonrisa', 'Proceso de diseño', 'Influencers'],
  },
  {
    id: 'corona-zirconio',
    name: 'Corona Zirconio',
    category: 'Odontología',
    subcategory: 'Estética',
    price: 370000,
    ltv: 740000, // 2 coronas promedio
    cprTarget: 13320,
    cprMax: 26640,
    keywords: ['corona dental', 'corona zirconio', 'restauración dental'],
    targetAudience: {
      ageMin: 30,
      ageMax: 65,
      gender: 'all',
      interests: ['salud dental', 'estética'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'google'],
    contentSuggestions: ['Calidad del material', 'Durabilidad', 'Casos clínicos'],
  },
  {
    id: 'blanqueamiento',
    name: 'Blanqueamiento Dental',
    category: 'Odontología',
    subcategory: 'Estética',
    price: 235000,
    ltv: 470000, // Repetición cada 2 años
    cprTarget: 8460,
    cprMax: 16920,
    keywords: ['blanqueamiento dental', 'dientes blancos', 'sonrisa blanca', 'aclaramiento dental'],
    targetAudience: {
      ageMin: 20,
      ageMax: 50,
      gender: 'all',
      interests: ['estética', 'belleza', 'cuidado personal', 'bodas'],
      socioeconomic: ['medium', 'medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'tiktok'],
    contentSuggestions: ['Antes/después inmediato', 'Proceso en consultorio', 'Tips de mantenimiento'],
  },

  // Ortodoncia
  {
    id: 'brackets-esteticos',
    name: 'Brackets Estéticos',
    category: 'Odontología',
    subcategory: 'Ortodoncia',
    price: 990000,
    ltv: 1485000, // Tratamiento + retención
    cprTarget: 26730,
    cprMax: 53460,
    keywords: ['brackets', 'ortodoncia', 'dientes chuecos', 'alineación dental'],
    targetAudience: {
      ageMin: 12,
      ageMax: 40,
      gender: 'all',
      interests: ['estética', 'salud dental', 'adolescentes'],
      socioeconomic: ['medium', 'medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'tiktok'],
    contentSuggestions: ['Transformaciones', 'Día a día con brackets', 'Tips de cuidado'],
  },
  {
    id: 'alineadores',
    name: 'Alineadores Invisibles',
    category: 'Odontología',
    subcategory: 'Ortodoncia',
    price: 1500000, // Promedio del rango
    priceRange: { min: 990000, max: 3000000 },
    ltv: 2250000,
    cprTarget: 40500,
    cprMax: 81000,
    keywords: ['alineadores invisibles', 'invisalign', 'ortodoncia invisible', 'alineadores transparentes'],
    targetAudience: {
      ageMin: 18,
      ageMax: 55,
      gender: 'all',
      interests: ['estética', 'profesionales', 'discreción'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'tiktok', 'google'],
    contentSuggestions: ['Comparación con brackets', 'Comodidad', 'Casos adultos'],
  },

  // General
  {
    id: 'restauracion-composite',
    name: 'Restauración Composite',
    category: 'Odontología',
    subcategory: 'General',
    price: 59000,
    ltv: 177000, // 3 restauraciones promedio
    cprTarget: 3186,
    cprMax: 6372,
    keywords: ['tapadura', 'restauración dental', 'caries', 'composite'],
    targetAudience: {
      ageMin: 18,
      ageMax: 65,
      gender: 'all',
      interests: ['salud dental'],
      socioeconomic: ['medium', 'medium-high', 'high'],
    },
    bestPlatforms: ['google'],
    contentSuggestions: ['Proceso rápido', 'Sin dolor', 'Estética natural'],
  },
  {
    id: 'plano-relajacion',
    name: 'Plano de Relajación',
    category: 'Odontología',
    subcategory: 'General',
    price: 180000,
    ltv: 360000,
    cprTarget: 6480,
    cprMax: 12960,
    keywords: ['bruxismo', 'plano relajación', 'rechinar dientes', 'férula'],
    targetAudience: {
      ageMin: 25,
      ageMax: 55,
      gender: 'all',
      interests: ['estrés', 'salud', 'bienestar'],
      socioeconomic: ['medium', 'medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'google'],
    contentSuggestions: ['Síntomas del bruxismo', 'Solución al dolor', 'Testimonios'],
  },
  {
    id: 'exodoncia',
    name: 'Exodoncia',
    category: 'Odontología',
    subcategory: 'General',
    price: 50000,
    ltv: 50000,
    cprTarget: 900,
    cprMax: 1800,
    keywords: ['extracción dental', 'sacar muela', 'muela del juicio'],
    targetAudience: {
      ageMin: 16,
      ageMax: 65,
      gender: 'all',
      interests: ['salud dental', 'urgencia'],
      socioeconomic: ['all'],
    },
    bestPlatforms: ['google'],
    contentSuggestions: ['Proceso sin dolor', 'Cuidados post-extracción'],
  },
  {
    id: 'tratamiento-regenerativo-esmalte',
    name: 'Tratamiento Regenerativo del Esmalte',
    category: 'Odontología',
    subcategory: 'General',
    price: 80000,
    ltv: 240000,
    cprTarget: 4320,
    cprMax: 8640,
    keywords: ['esmalte dental', 'sensibilidad dental', 'regeneración esmalte'],
    targetAudience: {
      ageMin: 25,
      ageMax: 55,
      gender: 'all',
      interests: ['salud dental', 'sensibilidad'],
      socioeconomic: ['medium', 'medium-high', 'high'],
    },
    bestPlatforms: ['meta'],
    contentSuggestions: ['Solución a la sensibilidad', 'Proceso innovador'],
  },

  // ==================== ESTÉTICA FACIAL (Dra. Vergara) ====================
  
  // Ácido Hialurónico
  {
    id: 'acido-hialuronico-grupo',
    name: 'Ácido Hialurónico por Grupo',
    category: 'Estética Facial',
    subcategory: 'Ácido Hialurónico',
    price: 85284,
    ltv: 255852, // 3 sesiones anuales
    cprTarget: 4605,
    cprMax: 9211,
    keywords: ['ácido hialurónico', 'relleno facial', 'rejuvenecimiento'],
    targetAudience: {
      ageMin: 30,
      ageMax: 60,
      gender: 'female',
      interests: ['belleza', 'estética', 'anti-aging', 'cuidado facial'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'tiktok'],
    contentSuggestions: ['Resultados naturales', 'Proceso rápido', 'Sin cirugía'],
  },
  {
    id: 'acido-hialuronico-labios',
    name: 'Ácido Hialurónico Labios',
    category: 'Estética Facial',
    subcategory: 'Ácido Hialurónico',
    price: 191889,
    ltv: 575667,
    cprTarget: 10362,
    cprMax: 20724,
    keywords: ['relleno labios', 'labios volumen', 'aumento labios', 'lip filler'],
    targetAudience: {
      ageMin: 20,
      ageMax: 45,
      gender: 'female',
      interests: ['belleza', 'maquillaje', 'influencers', 'moda'],
      socioeconomic: ['medium', 'medium-high', 'high'],
    },
    bestPlatforms: ['tiktok', 'meta'],
    contentSuggestions: ['Antes/después', 'Proceso en tiempo real', 'Resultados naturales'],
  },
  {
    id: 'acido-hialuronico-surcos',
    name: 'Ácido Hialurónico Surcos Nasogenianos',
    category: 'Estética Facial',
    subcategory: 'Ácido Hialurónico',
    price: 170568,
    ltv: 511704,
    cprTarget: 9211,
    cprMax: 18422,
    keywords: ['surcos nasogenianos', 'arrugas', 'líneas expresión', 'rejuvenecimiento'],
    targetAudience: {
      ageMin: 35,
      ageMax: 65,
      gender: 'female',
      interests: ['anti-aging', 'belleza', 'cuidado facial'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta'],
    contentSuggestions: ['Rejuvenecimiento facial', 'Resultados inmediatos'],
  },
  {
    id: 'acido-hialuronico-surcos-x2',
    name: 'Ácido Hialurónico Surcos x2 Jeringas',
    category: 'Estética Facial',
    subcategory: 'Ácido Hialurónico',
    price: 277173,
    ltv: 831519,
    cprTarget: 14968,
    cprMax: 29935,
    keywords: ['surcos profundos', 'relleno facial', 'rejuvenecimiento intensivo'],
    targetAudience: {
      ageMin: 40,
      ageMax: 65,
      gender: 'female',
      interests: ['anti-aging', 'belleza', 'cuidado facial'],
      socioeconomic: ['high'],
    },
    bestPlatforms: ['meta'],
    contentSuggestions: ['Casos de transformación', 'Tratamiento completo'],
  },

  // Mesoterapia
  {
    id: 'mesoterapia-sesion',
    name: 'Mesoterapia por Sesión',
    category: 'Estética Facial',
    subcategory: 'Mesoterapia',
    price: 58633,
    ltv: 351798, // 6 sesiones
    cprTarget: 6332,
    cprMax: 12665,
    keywords: ['mesoterapia', 'vitaminas faciales', 'hidratación piel', 'rejuvenecimiento'],
    targetAudience: {
      ageMin: 25,
      ageMax: 55,
      gender: 'female',
      interests: ['skincare', 'belleza', 'cuidado facial'],
      socioeconomic: ['medium', 'medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'tiktok'],
    contentSuggestions: ['Piel luminosa', 'Proceso de aplicación', 'Resultados progresivos'],
  },

  // Toxina Botulínica
  {
    id: 'botox-pack-3-zonas',
    name: 'Pack Toxina Botulínica 3 Zonas',
    category: 'Estética Facial',
    subcategory: 'Toxina Botulínica',
    price: 226600,
    ltv: 679800, // 3 aplicaciones anuales
    cprTarget: 12236,
    cprMax: 24473,
    keywords: ['botox', 'toxina botulínica', 'arrugas', 'anti-aging', 'frente', 'entrecejo'],
    targetAudience: {
      ageMin: 30,
      ageMax: 60,
      gender: 'female',
      interests: ['belleza', 'anti-aging', 'cuidado facial'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'tiktok'],
    contentSuggestions: ['Resultados naturales', 'Sin expresión congelada', 'Proceso rápido'],
  },
  {
    id: 'botox-frente',
    name: 'Toxina Botulínica Frente',
    category: 'Estética Facial',
    subcategory: 'Toxina Botulínica',
    price: 118289,
    ltv: 354867,
    cprTarget: 6388,
    cprMax: 12775,
    keywords: ['botox frente', 'arrugas frente', 'líneas expresión'],
    targetAudience: {
      ageMin: 28,
      ageMax: 55,
      gender: 'female',
      interests: ['belleza', 'anti-aging'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta'],
    contentSuggestions: ['Frente lisa', 'Expresión natural'],
  },
  {
    id: 'botox-entrecejo',
    name: 'Toxina Botulínica Entrecejo',
    category: 'Estética Facial',
    subcategory: 'Toxina Botulínica',
    price: 90614,
    ltv: 271842,
    cprTarget: 4893,
    cprMax: 9786,
    keywords: ['botox entrecejo', 'líneas del ceño', 'arrugas entrecejo'],
    targetAudience: {
      ageMin: 28,
      ageMax: 55,
      gender: 'female',
      interests: ['belleza', 'anti-aging'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta'],
    contentSuggestions: ['Expresión relajada', 'Sin ceño fruncido'],
  },
  {
    id: 'botox-frente-entrecejo',
    name: 'Toxina Botulínica Frente + Entrecejo',
    category: 'Estética Facial',
    subcategory: 'Toxina Botulínica',
    price: 170568,
    ltv: 511704,
    cprTarget: 9211,
    cprMax: 18422,
    keywords: ['botox completo', 'frente y entrecejo', 'anti-aging'],
    targetAudience: {
      ageMin: 30,
      ageMax: 55,
      gender: 'female',
      interests: ['belleza', 'anti-aging'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'tiktok'],
    contentSuggestions: ['Combo más popular', 'Resultados completos'],
  },
  {
    id: 'botox-sonrisa-gingival',
    name: 'Toxina Botulínica Sonrisa Gingival',
    category: 'Estética Facial',
    subcategory: 'Toxina Botulínica',
    price: 106402,
    ltv: 319206,
    cprTarget: 5746,
    cprMax: 11492,
    keywords: ['sonrisa gingival', 'encías', 'sonrisa perfecta'],
    targetAudience: {
      ageMin: 20,
      ageMax: 45,
      gender: 'female',
      interests: ['sonrisa', 'estética dental', 'belleza'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta', 'tiktok'],
    contentSuggestions: ['Antes/después de sonrisa', 'Solución simple'],
  },
  {
    id: 'botox-periocular',
    name: 'Toxina Botulínica Zona Periocular',
    category: 'Estética Facial',
    subcategory: 'Toxina Botulínica',
    price: 127926,
    ltv: 383778,
    cprTarget: 6908,
    cprMax: 13816,
    keywords: ['patas de gallo', 'arrugas ojos', 'contorno ojos'],
    targetAudience: {
      ageMin: 30,
      ageMax: 60,
      gender: 'female',
      interests: ['anti-aging', 'belleza', 'cuidado facial'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['meta'],
    contentSuggestions: ['Mirada rejuvenecida', 'Ojos más abiertos'],
  },

  // Rinomodelación
  {
    id: 'rinomodelacion',
    name: 'Rinomodelación',
    category: 'Estética Facial',
    subcategory: 'Rinomodelación',
    price: 191889,
    ltv: 383778,
    cprTarget: 6908,
    cprMax: 13816,
    keywords: ['rinomodelación', 'nariz sin cirugía', 'perfilado nariz', 'rinoplastia sin cirugía'],
    targetAudience: {
      ageMin: 20,
      ageMax: 45,
      gender: 'female',
      interests: ['belleza', 'estética', 'perfil facial'],
      socioeconomic: ['medium-high', 'high'],
    },
    bestPlatforms: ['tiktok', 'meta'],
    contentSuggestions: ['Transformación de perfil', 'Sin cirugía', 'Resultados inmediatos'],
  },
];

// Helper functions
export function getServiceById(id: string): ServiceDefinition | undefined {
  return CLINICA_MIRO_SERVICES.find(s => s.id === id);
}

export function getServicesByCategory(category: string): ServiceDefinition[] {
  return CLINICA_MIRO_SERVICES.filter(s => s.category === category);
}

export function getServicesByPlatform(platform: 'meta' | 'tiktok' | 'google'): ServiceDefinition[] {
  return CLINICA_MIRO_SERVICES.filter(s => s.bestPlatforms.includes(platform));
}

export function getHighValueServices(minPrice: number = 500000): ServiceDefinition[] {
  return CLINICA_MIRO_SERVICES.filter(s => s.price >= minPrice);
}

export function getServicesForTikTok(): ServiceDefinition[] {
  return CLINICA_MIRO_SERVICES.filter(s => s.bestPlatforms.includes('tiktok'));
}

export function calculateROI(service: ServiceDefinition, spend: number, conversions: number): number {
  const revenue = conversions * service.ltv;
  return (revenue - spend) / spend;
}

export const SERVICE_CATEGORIES = [
  { id: 'odontologia', name: 'Odontología', subcategories: ['Prevención', 'Rehabilitación', 'Estética', 'Ortodoncia', 'General'] },
  { id: 'estetica-facial', name: 'Estética Facial', subcategories: ['Ácido Hialurónico', 'Mesoterapia', 'Toxina Botulínica', 'Rinomodelación'] },
];
