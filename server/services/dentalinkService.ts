/**
 * Dentalink CRM API Service
 * Gestiona la autenticación y operaciones con Dentalink API
 * 
 * Documentación: https://api.dentalink.healthatom.com/docs/
 */

interface DentalinkCredentials {
  apiToken: string; // Token de acceso generado en la plataforma
}

interface DentalinkPatient {
  id: number;
  nombre: string;
  apellidos: string;
  rut: string;
  email: string | null;
  celular: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  sexo: 'M' | 'F' | null;
  direccion: string | null;
  comuna: string | null;
  ciudad: string | null;
  fecha_creacion: string;
  fecha_modificacion: string;
}

interface DentalinkAppointment {
  id: number;
  id_paciente: number;
  id_dentista: number;
  id_sucursal: number;
  id_estado: number;
  fecha: string;
  hora_inicio: string;
  duracion: number;
  comentarios: string | null;
  paciente?: {
    nombre: string;
    apellidos: string;
    rut: string;
  };
  estado?: {
    nombre: string;
    color: string;
  };
}

interface DentalinkTreatment {
  id: number;
  id_paciente: number;
  id_dentista: number;
  id_sucursal: number;
  nombre: string;
  fecha: string;
  finalizado: number;
  expirado: number;
  bloqueado: number;
  total: number;
  pagado: number;
  saldo: number;
  detalles?: Array<{
    id: number;
    id_prestacion: number;
    precio: number;
    descuento: number;
    estado: string;
    prestacion: {
      nombre: string;
      codigo: string;
    };
  }>;
}

export class DentalinkService {
  private credentials: DentalinkCredentials | null = null;
  private baseUrl = 'https://api.dentalink.healthatom.com/api/v1';

  /**
   * Configurar credenciales de Dentalink
   */
  setCredentials(credentials: DentalinkCredentials) {
    this.credentials = credentials;
  }

  /**
   * Verificar si las credenciales están configuradas
   */
  isConfigured(): boolean {
    return this.credentials !== null;
  }

  /**
   * Hacer request a Dentalink API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.credentials) {
      throw new Error('Dentalink credentials not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Token ${this.credentials.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dentalink API error:', errorText);
      throw new Error(`Dentalink API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Obtener lista de pacientes
   */
  async getPatients(filters?: {
    nombre?: string;
    rut?: string;
    email?: string;
    celular?: string;
    fecha_desde?: string; // YYYY-MM-DD
    fecha_hasta?: string;
  }): Promise<{ data: DentalinkPatient[] }> {
    try {
      let endpoint = '/pacientes';
      
      // Construir query string con filtros
      if (filters) {
        const queryObj: any = {};
        
        if (filters.nombre) {
          queryObj.nombre = { lk: filters.nombre }; // like
        }
        if (filters.rut) {
          queryObj.rut = { eq: filters.rut }; // equals
        }
        if (filters.email) {
          queryObj.email = { lk: filters.email };
        }
        if (filters.celular) {
          queryObj.celular = { lk: filters.celular };
        }
        // Note: Dentalink API does NOT support filtering by fecha_creacion
        // Use fecha_afiliacion instead which is the registration date
        if (filters.fecha_desde) {
          queryObj.fecha_afiliacion = { gte: filters.fecha_desde };
        }
        if (filters.fecha_hasta) {
          queryObj.fecha_afiliacion = { ...queryObj.fecha_afiliacion, lte: filters.fecha_hasta };
        }
        
        if (Object.keys(queryObj).length > 0) {
          const queryString = encodeURIComponent(JSON.stringify(queryObj));
          endpoint += `?q=${queryString}`;
        }
      }

      return await this.makeRequest<{ data: DentalinkPatient[] }>(endpoint);
    } catch (error: any) {
      console.error('Error fetching Dentalink patients:', error);
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }
  }

  /**
   * Obtener un paciente específico
   */
  async getPatient(patientId: number): Promise<{ data: DentalinkPatient }> {
    try {
      return await this.makeRequest<{ data: DentalinkPatient }>(`/pacientes/${patientId}`);
    } catch (error: any) {
      console.error('Error fetching Dentalink patient:', error);
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }
  }

  /**
   * Obtener citas
   */
  async getAppointments(filters?: {
    id_paciente?: number;
    id_dentista?: number;
    id_sucursal?: number;
    fecha_desde?: string; // YYYY-MM-DD
    fecha_hasta?: string;
    id_estado?: number;
  }): Promise<{ data: DentalinkAppointment[] }> {
    try {
      let endpoint = '/citas';
      
      if (filters) {
        const queryObj: any = {};
        
        if (filters.id_paciente) {
          queryObj.id_paciente = { eq: filters.id_paciente };
        }
        if (filters.id_dentista) {
          queryObj.id_dentista = { eq: filters.id_dentista };
        }
        if (filters.id_sucursal) {
          queryObj.id_sucursal = { eq: filters.id_sucursal };
        }
        if (filters.fecha_desde) {
          queryObj.fecha = { gte: filters.fecha_desde };
        }
        if (filters.fecha_hasta) {
          queryObj.fecha = { ...queryObj.fecha, lte: filters.fecha_hasta };
        }
        if (filters.id_estado) {
          queryObj.id_estado = { eq: filters.id_estado };
        }
        
        if (Object.keys(queryObj).length > 0) {
          const queryString = encodeURIComponent(JSON.stringify(queryObj));
          endpoint += `?q=${queryString}`;
        }
      }

      return await this.makeRequest<{ data: DentalinkAppointment[] }>(endpoint);
    } catch (error: any) {
      console.error('Error fetching Dentalink appointments:', error);
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }
  }

  /**
   * Obtener tratamientos
   */
  async getTreatments(filters?: {
    id_paciente?: number;
    id_dentista?: number;
    finalizado?: 0 | 1;
    expirado?: 0 | 1;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<{ data: DentalinkTreatment[] }> {
    try {
      let endpoint = '/tratamientos';
      
      if (filters) {
        const queryObj: any = {};
        
        if (filters.id_paciente) {
          queryObj.id_paciente = { eq: filters.id_paciente };
        }
        if (filters.id_dentista) {
          queryObj.id_dentista = { eq: filters.id_dentista };
        }
        if (filters.finalizado !== undefined) {
          queryObj.finalizado = { eq: filters.finalizado };
        }
        if (filters.expirado !== undefined) {
          queryObj.expirado = { eq: filters.expirado };
        }
        if (filters.fecha_desde) {
          queryObj.fecha = { gte: filters.fecha_desde };
        }
        if (filters.fecha_hasta) {
          queryObj.fecha = { ...queryObj.fecha, lte: filters.fecha_hasta };
        }
        
        if (Object.keys(queryObj).length > 0) {
          const queryString = encodeURIComponent(JSON.stringify(queryObj));
          endpoint += `?q=${queryString}`;
        }
      }

      return await this.makeRequest<{ data: DentalinkTreatment[] }>(endpoint);
    } catch (error: any) {
      console.error('Error fetching Dentalink treatments:', error);
      throw new Error(`Failed to fetch treatments: ${error.message}`);
    }
  }

  /**
   * Obtener detalles de un tratamiento específico
   */
  async getTreatmentDetails(treatmentId: number): Promise<{ data: DentalinkTreatment }> {
    try {
      return await this.makeRequest<{ data: DentalinkTreatment }>(`/tratamientos/${treatmentId}`);
    } catch (error: any) {
      console.error('Error fetching Dentalink treatment details:', error);
      throw new Error(`Failed to fetch treatment details: ${error.message}`);
    }
  }

  /**
   * Crear nuevo paciente
   */
  async createPatient(patientData: {
    nombre: string;
    apellidos: string;
    rut: string;
    email?: string;
    celular?: string;
    telefono?: string;
    fecha_nacimiento?: string; // YYYY-MM-DD
    sexo?: 'M' | 'F';
    direccion?: string;
    comuna?: string;
    ciudad?: string;
  }): Promise<{ data: DentalinkPatient }> {
    try {
      return await this.makeRequest<{ data: DentalinkPatient }>('/pacientes', {
        method: 'POST',
        body: JSON.stringify(patientData),
      });
    } catch (error: any) {
      console.error('Error creating Dentalink patient:', error);
      throw new Error(`Failed to create patient: ${error.message}`);
    }
  }

  /**
   * Actualizar paciente existente
   */
  async updatePatient(
    patientId: number,
    patientData: Partial<{
      nombre: string;
      apellidos: string;
      email: string;
      celular: string;
      telefono: string;
      direccion: string;
      comuna: string;
      ciudad: string;
    }>
  ): Promise<{ data: DentalinkPatient }> {
    try {
      return await this.makeRequest<{ data: DentalinkPatient }>(`/pacientes/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(patientData),
      });
    } catch (error: any) {
      console.error('Error updating Dentalink patient:', error);
      throw new Error(`Failed to update patient: ${error.message}`);
    }
  }

  /**
   * Crear nueva cita
   */
  async createAppointment(appointmentData: {
    id_paciente: number;
    id_dentista: number;
    id_sucursal: number;
    id_estado: number;
    id_sillon: number;
    fecha: string; // YYYY-MM-DD
    hora_inicio: string; // HH:MM
    duracion: number; // minutos
    comentarios?: string;
  }): Promise<{ data: DentalinkAppointment }> {
    try {
      return await this.makeRequest<{ data: DentalinkAppointment }>('/citas', {
        method: 'POST',
        body: JSON.stringify(appointmentData),
      });
    } catch (error: any) {
      console.error('Error creating Dentalink appointment:', error);
      throw new Error(`Failed to create appointment: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de conversión
   * (pacientes nuevos en un rango de fechas)
   */
  async getConversionStats(dateFrom: string, dateTo: string): Promise<{
    totalPatients: number;
    newPatients: number;
    appointmentsScheduled: number;
    treatmentsCompleted: number;
    totalRevenue: number;
  }> {
    try {
      // Obtener pacientes nuevos
      const patientsResponse = await this.getPatients({
        fecha_desde: dateFrom,
        fecha_hasta: dateTo,
      });

      // Obtener citas agendadas
      const appointmentsResponse = await this.getAppointments({
        fecha_desde: dateFrom,
        fecha_hasta: dateTo,
      });

      // Obtener tratamientos finalizados
      const treatmentsResponse = await this.getTreatments({
        finalizado: 1,
        fecha_desde: dateFrom,
        fecha_hasta: dateTo,
      });

      // Calcular revenue total
      const totalRevenue = treatmentsResponse.data.reduce((sum, treatment) => {
        return sum + (treatment.pagado || 0);
      }, 0);

      return {
        totalPatients: patientsResponse.data.length,
        newPatients: patientsResponse.data.length,
        appointmentsScheduled: appointmentsResponse.data.length,
        treatmentsCompleted: treatmentsResponse.data.length,
        totalRevenue,
      };
    } catch (error: any) {
      console.error('Error fetching Dentalink conversion stats:', error);
      throw new Error(`Failed to fetch conversion stats: ${error.message}`);
    }
  }
}

// Singleton instance
export const dentalinkService = new DentalinkService();
