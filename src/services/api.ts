const API_BASE_URL = '/api';

export interface OrderEntry {
  id?: number;
  auftragsnummer: string;
  prioritaet: 1 | 2;
  zeitstempel: Date;
  abteilung?: string;
  zusatzinfo?: string;
  zusatzDaten: Record<string, any>;
}

export interface ExcelData {
  filename: string;
  data: any[][];
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AdditionalInfo {
  id: string;
  name: string;
  department_id: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnSetting {
  id: string;
  title: string;
  column_number: number;
  created_at: string;
  updated_at: string;
}

export interface ExcelSettings {
  id: string;
  auftragsnummer_column: number;
  created_at: string;
  updated_at: string;
}

class ApiService {
  private async fetchWithErrorHandling(url: string, options?: RequestInit) {
    try {
      console.log('Making API request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Check if we're getting HTML instead of an API response
        if (errorText.includes('<!DOCTYPE html>')) {
          throw new Error(`Backend server not available. Please ensure your PostgreSQL API server is running on localhost:3002. Status: ${response.status}`);
        }
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        
        // Check if we're getting HTML instead of an API response
        if (responseText.includes('<!DOCTYPE html>')) {
          throw new Error('Backend server not available. Please ensure your PostgreSQL API server is running on localhost:3002.');
        }
        
        throw new Error('Server returned non-JSON response');
      }

      const jsonData = await response.json();
      console.log('JSON response:', jsonData);
      return jsonData;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async importExcelData(filename: string, data: any[][]): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/excel-import`, {
        method: 'POST',
        body: JSON.stringify({ filename, data }),
      });
    } catch (error) {
      console.error('Excel import failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getExcelData(): Promise<{ success: boolean; data?: any[][]; filename?: string; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/excel-data`);
    } catch (error) {
      console.error('Get Excel data failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async saveOrder(order: OrderEntry): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/scan-orders`, {
        method: 'POST',
        body: JSON.stringify(order),
      });
    } catch (error) {
      console.error('Save order failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getOrders(): Promise<{ success: boolean; orders?: OrderEntry[]; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/orders`);
    } catch (error) {
      console.error('Get orders failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getExcelSettings(): Promise<{ success: boolean; settings?: any; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/excel-settings`);
    } catch (error) {
      console.error('Get Excel settings failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async saveExcelSettings(settings: any): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/excel-settings`, {
        method: 'POST',
        body: JSON.stringify({ settings }),
      });
    } catch (error) {
      console.error('Save Excel settings failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getColumnSettings(): Promise<{ success: boolean; settings?: any[]; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/column-settings`);
    } catch (error) {
      console.error('Get column settings failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async completeOrder(auftragsnummer: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/complete-order`, {
        method: 'POST',
        body: JSON.stringify({ auftragsnummer }),
      });
    } catch (error) {
      console.error('Complete order failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async saveMedia(mediaData: { 
    auftragsnummer: string; 
    file_path: string; 
    file_type: string; 
    content?: string; 
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/media`, {
        method: 'POST',
        body: JSON.stringify(mediaData),
      });
    } catch (error) {
      console.error('Save media failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getMedia(): Promise<{ success: boolean; media?: any[]; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/media`);
    } catch (error) {
      console.error('Get media failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getMediaByAuftragsnummer(auftragsnummer: string): Promise<{ success: boolean; media?: any[]; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/media/${encodeURIComponent(auftragsnummer)}`);
    } catch (error) {
      console.error('Get media by auftragsnummer failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Department methods
  async getDepartments(): Promise<{ success: boolean; departments?: Department[]; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/departments`);
    } catch (error) {
      console.error('Get departments failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createDepartment(name: string): Promise<{ success: boolean; department?: Department; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/departments`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    } catch (error) {
      console.error('Create department failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteDepartment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/departments/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete department failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Additional Info methods
  async getAdditionalInfos(): Promise<{ success: boolean; additionalInfos?: AdditionalInfo[]; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/additional-infos`);
    } catch (error) {
      console.error('Get additional infos failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createAdditionalInfo(name: string, departmentId: string): Promise<{ success: boolean; additionalInfo?: AdditionalInfo; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/additional-infos`, {
        method: 'POST',
        body: JSON.stringify({ name, department_id: departmentId }),
      });
    } catch (error) {
      console.error('Create additional info failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteAdditionalInfo(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/additional-infos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete additional info failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Column Settings methods
  async saveColumnSettings(settings: ColumnSetting[]): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.fetchWithErrorHandling(`${API_BASE_URL}/column-settings`, {
        method: 'POST',
        body: JSON.stringify({ settings }),
      });
    } catch (error) {
      console.error('Save column settings failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const apiService = new ApiService();
