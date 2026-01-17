import { google } from 'googleapis';

/**
 * Google Ads API Service
 * Gestiona la autenticación y operaciones con Google Ads API usando REST
 */

interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  customerId: string; // Customer ID (sin guiones)
}

export class GoogleAdsService {
  private oauth2Client: any;
  private credentials: GoogleAdsCredentials | null = null;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2();
  }

  /**
   * Configurar credenciales de Google Ads
   */
  setCredentials(credentials: GoogleAdsCredentials) {
    this.credentials = credentials;
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );
    this.oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });
  }

  /**
   * Verificar si las credenciales están configuradas
   */
  isConfigured(): boolean {
    return this.credentials !== null;
  }

  /**
   * Obtener access token
   */
  private async getAccessToken(): Promise<string> {
    const tokenResponse = await this.oauth2Client.getAccessToken();
    if (!tokenResponse.token) {
      throw new Error('Failed to get access token');
    }
    return tokenResponse.token;
  }

  /**
   * Hacer request a Google Ads API
   */
  private async makeRequest(query: string) {
    if (!this.credentials) {
      throw new Error('Google Ads credentials not configured');
    }

    const accessToken = await this.getAccessToken();
    
    const response = await fetch(
      `https://googleads.googleapis.com/v17/customers/${this.credentials.customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': this.credentials.developerToken,
          'Content-Type': 'application/json',
          'login-customer-id': this.credentials.customerId,
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Ads API error:', errorText);
      throw new Error(`Google Ads API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Obtener campañas de Google Ads
   */
  async getCampaigns() {
    try {
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
      `;

      const data = await this.makeRequest(query);
      return this.parseCampaigns(data);
    } catch (error: any) {
      console.error('Error fetching Google Ads campaigns:', error);
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }
  }

  /**
   * Obtener métricas de rendimiento
   */
  async getPerformanceMetrics(campaignId?: string) {
    try {
      let query = `
        SELECT
          campaign.id,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_micros,
          metrics.conversions,
          metrics.cost_per_conversion
        FROM campaign
        WHERE segments.date DURING LAST_7_DAYS
      `;

      if (campaignId) {
        query += ` AND campaign.id = ${campaignId}`;
      }

      const data = await this.makeRequest(query);
      return this.parseMetrics(data);
    } catch (error: any) {
      console.error('Error fetching Google Ads metrics:', error);
      throw new Error(`Failed to fetch metrics: ${error.message}`);
    }
  }

  /**
   * Crear campaña en Google Ads
   */
  async createCampaign(campaignData: {
    name: string;
    budget: number; // en CLP
    startDate: string; // YYYY-MM-DD
    endDate?: string;
    targetLocations?: string[];
  }) {
    if (!this.credentials) {
      throw new Error('Google Ads credentials not configured');
    }

    try {
      const accessToken = await this.getAccessToken();
      
      // Convertir CLP a micros (1 CLP = 1,000,000 micros)
      const budgetMicros = Math.round(campaignData.budget * 1000000);

      // Primero crear el presupuesto
      const budgetResponse = await fetch(
        `https://googleads.googleapis.com/v17/customers/${this.credentials.customerId}/campaignBudgets:mutate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.credentials.developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operations: [
              {
                create: {
                  name: `Budget for ${campaignData.name}`,
                  amount_micros: budgetMicros,
                  delivery_method: 'STANDARD',
                },
              },
            ],
          }),
        }
      );

      if (!budgetResponse.ok) {
        const error = await budgetResponse.text();
        throw new Error(`Failed to create budget: ${error}`);
      }

      const budgetResult = await budgetResponse.json();
      const budgetResourceName = budgetResult.results[0].resourceName;

      // Luego crear la campaña
      const campaignResponse = await fetch(
        `https://googleads.googleapis.com/v17/customers/${this.credentials.customerId}/campaigns:mutate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.credentials.developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operations: [
              {
                create: {
                  name: campaignData.name,
                  status: 'PAUSED', // Crear pausada por seguridad
                  advertising_channel_type: 'SEARCH',
                  campaign_budget: budgetResourceName,
                  start_date: campaignData.startDate.replace(/-/g, ''),
                  end_date: campaignData.endDate?.replace(/-/g, ''),
                },
              },
            ],
          }),
        }
      );

      if (!campaignResponse.ok) {
        const error = await campaignResponse.text();
        throw new Error(`Failed to create campaign: ${error}`);
      }

      return await campaignResponse.json();
    } catch (error: any) {
      console.error('Error creating Google Ads campaign:', error);
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  /**
   * Pausar/Activar campaña
   */
  async updateCampaignStatus(campaignId: string, status: 'ENABLED' | 'PAUSED') {
    if (!this.credentials) {
      throw new Error('Google Ads credentials not configured');
    }

    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://googleads.googleapis.com/v17/customers/${this.credentials.customerId}/campaigns:mutate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': this.credentials.developerToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operations: [
              {
                update: {
                  resourceName: `customers/${this.credentials.customerId}/campaigns/${campaignId}`,
                  status,
                },
                updateMask: 'status',
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Ads API error: ${error}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error updating campaign status:', error);
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
  }

  /**
   * Parsear respuesta de campañas
   */
  private parseCampaigns(data: any) {
    const campaigns = [];
    
    for (const result of data.results || []) {
      const campaign = result.campaign;
      const metrics = result.metrics;
      
      campaigns.push({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        type: campaign.advertising_channel_type,
        impressions: parseInt(metrics?.impressions || '0'),
        clicks: parseInt(metrics?.clicks || '0'),
        cost: parseInt(metrics?.cost_micros || '0') / 1000000, // Convertir micros a CLP
        conversions: parseFloat(metrics?.conversions || '0'),
        conversionsValue: parseFloat(metrics?.conversions_value || '0'),
      });
    }
    
    return campaigns;
  }

  /**
   * Parsear métricas
   */
  private parseMetrics(data: any) {
    const metrics = [];
    
    for (const result of data.results || []) {
      const campaign = result.campaign;
      const m = result.metrics;
      
      metrics.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        impressions: parseInt(m?.impressions || '0'),
        clicks: parseInt(m?.clicks || '0'),
        ctr: parseFloat(m?.ctr || '0'),
        avgCpc: parseInt(m?.average_cpc || '0') / 1000000,
        cost: parseInt(m?.cost_micros || '0') / 1000000,
        conversions: parseFloat(m?.conversions || '0'),
        costPerConversion: parseInt(m?.cost_per_conversion || '0') / 1000000,
      });
    }
    
    return metrics;
  }
}

// Singleton instance
export const googleAdsService = new GoogleAdsService();
