import { API_CONFIG, getApiHeaders } from '../config/api';

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const apiHeaders = getApiHeaders();
    
    // Debug: API Key'i console'a yazdır (sadece development'ta)
    if (import.meta.env.DEV) {
      console.log('[API Call]', {
        url,
        method: options.method || 'GET',
        'X-API-Key': apiHeaders['X-API-Key'] ? `${apiHeaders['X-API-Key'].substring(0, 20)}...` : 'MISSING',
        'X-App-Id': apiHeaders['X-App-Id'],
      });
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...apiHeaders,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const status = response.status;

    if (!response.ok) {
      const errorText = await response.text();
      
      // 401 hatası için daha detaylı log
      if (status === 401) {
        console.error('❌ 401 Unauthorized:', {
          url,
          'X-API-Key': apiHeaders['X-API-Key'] ? `${apiHeaders['X-API-Key'].substring(0, 30)}...` : 'MISSING',
          'X-App-Id': apiHeaders['X-App-Id'],
          error: errorText,
        });
      }
      
      return {
        status,
        error: errorText || `HTTP ${status}`,
      };
    }

    // 204 No Content
    if (status === 204) {
      return { status, data: undefined as T };
    }

    const data = await response.json();
    
    // Debug: Response data'yı logla
    if (import.meta.env.DEV) {
      console.log('[API Response]', {
        url,
        status,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : 'N/A',
        data: Array.isArray(data) && data.length > 0 ? data.slice(0, 2) : data
      });
    }
    
    return { status, data };
  } catch (error) {
    return {
      status: 0,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// API Methods
export const api = {
  get: <T>(endpoint: string) => apiCall<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, body?: unknown) =>
    apiCall<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  put: <T>(endpoint: string, body?: unknown) =>
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  delete: <T>(endpoint: string) => apiCall<T>(endpoint, { method: 'DELETE' }),
};

