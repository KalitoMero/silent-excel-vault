
const API_BASE_URL = '/api';

export interface OrderEntry {
  id?: number;
  auftragsnummer: string;
  prioritaet: 1 | 2;
  zeitstempel: Date;
  zusatzDaten: Record<string, any>;
}

export interface ExcelData {
  filename: string;
  data: any[][];
  created_at: string;
}

class ApiService {
  private async fetchWithErrorHandling(url: string, options?: RequestInit) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async importExcelData(filename: string, data: any[][]): Promise<{ success: boolean; id?: number; error?: string }> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/excel-import`, {
      method: 'POST',
      body: JSON.stringify({ filename, data }),
    });
  }

  async getExcelData(): Promise<{ success: boolean; data?: any[][]; filename?: string; error?: string }> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/excel-data`);
  }

  async saveOrder(order: OrderEntry): Promise<{ success: boolean; order?: any; error?: string }> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/scan-orders`, {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getOrders(): Promise<{ success: boolean; orders?: OrderEntry[]; error?: string }> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/orders`);
  }

  async getExcelSettings(): Promise<{ success: boolean; settings?: any; error?: string }> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/excel-settings`);
  }

  async saveExcelSettings(settings: any): Promise<{ success: boolean; id?: number; error?: string }> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/excel-settings`, {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  }
}

export const apiService = new ApiService();
