// Clínica Miró - Brand Configuration
// Extracted from official Brand Book 2025

export const clinicaMiroBranding = {
  // Brand Identity
  name: "Clínica Miró",
  tagline: "Odontología",
  alternateTagline: "Clínica",
  
  // Color Palette
  colors: {
    primary: {
      gold: "#C4A265",
      description: "Elementos de acción y premium. Nunca usar para textos largos. Reservar para momentos de impacto visual."
    },
    secondary: {
      lilac: "#9B8AA5",
      description: "Elementos secundarios que necesitan destacar sin competir con el oro. Ideal para categorías y labels."
    },
    backgrounds: {
      dark: "#0A0A0D",
      cream: "#FCFBF9",
      white: "#FFFFFF"
    },
    text: {
      dark: "#1A1A1A",
      muted: "#888888",
      light: "#666666"
    }
  },
  
  // Typography
  typography: {
    primary: {
      family: "'Didot', 'Bodoni MT', Georgia, serif",
      usage: "Títulos principales, logo"
    },
    secondary: {
      family: "'Cormorant Garamond', Georgia, serif",
      usage: "Subtítulos, categorías, texto elegante"
    },
    body: {
      family: "system-ui, -apple-system, sans-serif",
      usage: "Texto de cuerpo, descripciones"
    }
  },
  
  // Logos
  logos: {
    icon: "/logo-miro-icon.png",
    full: "/logo-miro-full.png"
  }
};

// Brand Voice Configuration
export const clinicaMiroBrandVoice = {
  // Tone
  tone: [
    "Profesional",
    "Calmo",
    "Seguro",
    "Educativo",
    "Premium",
    "Sin exageraciones",
    "Sin urgencia artificial"
  ],
  
  // Communication Style
  style: {
    approach: "Explicativo, no persuasivo agresivo",
    focus: "Orientado a informar antes de decidir",
    language: "Lenguaje claro, adulto, respetuoso",
    technical: "Evita tecnicismos innecesarios",
    promises: "Nunca usa promesas"
  },
  
  // What we NEVER do
  prohibited: {
    actions: [
      "No usamos 'antes y después'",
      "No garantizamos resultados",
      "No diagnosticamos en anuncios",
      "No decimos 'eres candidato'",
      "No usamos miedo ni urgencia"
    ],
    phrases: [
      "Resultados garantizados",
      "Recupera tu sonrisa perfecta",
      "Implantes sin dolor",
      "Te aseguramos éxito",
      "Última oportunidad",
      "Solo por hoy",
      "No te lo pierdas"
    ]
  },
  
  // What we DO
  recommended: {
    actions: [
      "Invitamos a evaluar",
      "Invitamos a entender el caso",
      "Hablamos de orientación clínica",
      "Hablamos de transparencia",
      "Posicionamos IA como apoyo al criterio profesional"
    ],
    phrases: [
      "Orientación clínica inicial",
      "Evaluación responsable",
      "Referencia estética orientativa",
      "Antes de decidir, entiende tu caso",
      "Agenda tu evaluación sin costo",
      "Tu sonrisa, nuestra pasión",
      "Conoce las opciones disponibles"
    ]
  },
  
  // Content Guidelines
  contentGuidelines: {
    testimonials: {
      allowed: true,
      rules: [
        "Paciente debe verse natural, no actuado",
        "Incluir consentimiento firmado",
        "No mostrar antes/después explícito",
        "Enfocarse en la experiencia, no en resultados"
      ]
    },
    educational: {
      allowed: true,
      rules: [
        "Explicar procedimientos de forma clara",
        "No hacer promesas de resultados",
        "Mencionar que cada caso es único",
        "Invitar a evaluación profesional"
      ]
    },
    promotional: {
      allowed: true,
      rules: [
        "Sin urgencia artificial",
        "Sin descuentos agresivos",
        "Enfatizar calidad y experiencia",
        "Mantener tono premium"
      ]
    }
  }
};

// Script Templates with Brand Voice
export const scriptTemplates = {
  testimonial: {
    structure: [
      {
        section: "INTRO",
        duration: "5 segundos",
        template: "Hola, soy [Nombre] y quiero compartir mi experiencia en Clínica Miró.",
        notes: "Tono natural, cercano pero profesional"
      },
      {
        section: "CONTEXTO",
        duration: "10 segundos",
        template: "Hace [tiempo], tenía [situación] que afectaba [aspecto de vida]. Decidí buscar orientación profesional.",
        notes: "No mencionar 'problema' directamente, usar 'situación'"
      },
      {
        section: "EXPERIENCIA",
        duration: "15 segundos",
        template: "En Clínica Miró, el equipo me explicó todas las opciones disponibles para mi caso. El proceso fue [descripción de experiencia].",
        notes: "Enfatizar la evaluación y explicación, no prometer resultados"
      },
      {
        section: "RESULTADO",
        duration: "15 segundos",
        template: "Hoy me siento [emoción positiva]. La experiencia superó mis expectativas.",
        notes: "Hablar de sensaciones, no de resultados clínicos específicos"
      },
      {
        section: "CIERRE",
        duration: "10 segundos",
        template: "Si estás considerando [tratamiento], te invito a agendar una evaluación. Cada caso es único.",
        notes: "Invitación suave, sin urgencia"
      }
    ]
  },
  educational: {
    structure: [
      {
        section: "HOOK",
        duration: "5 segundos",
        template: "¿Sabías que [dato interesante sobre el tratamiento]?",
        notes: "Captar atención con información, no con miedo"
      },
      {
        section: "EXPLICACIÓN",
        duration: "20 segundos",
        template: "[Explicación clara del tratamiento o procedimiento]",
        notes: "Lenguaje accesible, sin tecnicismos innecesarios"
      },
      {
        section: "BENEFICIOS",
        duration: "15 segundos",
        template: "Este tratamiento puede ayudar a [beneficios generales], dependiendo de cada caso.",
        notes: "Siempre mencionar que depende del caso"
      },
      {
        section: "CTA",
        duration: "10 segundos",
        template: "Para saber si es adecuado para ti, agenda una evaluación sin costo en Clínica Miró.",
        notes: "Invitación a evaluación, no a tratamiento directo"
      }
    ]
  },
  promotional: {
    structure: [
      {
        section: "APERTURA",
        duration: "5 segundos",
        template: "En Clínica Miró, [propuesta de valor].",
        notes: "Directo al punto, tono premium"
      },
      {
        section: "DIFERENCIADOR",
        duration: "15 segundos",
        template: "[Qué hace diferente a Clínica Miró: tecnología, equipo, experiencia]",
        notes: "Enfatizar calidad, no precio"
      },
      {
        section: "SERVICIO",
        duration: "15 segundos",
        template: "Ofrecemos [servicio] con [característica distintiva].",
        notes: "Describir sin prometer resultados"
      },
      {
        section: "CIERRE",
        duration: "10 segundos",
        template: "Agenda tu orientación clínica inicial. Tu sonrisa, nuestra pasión.",
        notes: "Usar tagline oficial"
      }
    ]
  }
};

export default {
  branding: clinicaMiroBranding,
  brandVoice: clinicaMiroBrandVoice,
  scriptTemplates
};
