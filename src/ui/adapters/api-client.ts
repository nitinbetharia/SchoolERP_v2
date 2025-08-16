/**
 * API Client Adapter
 * Provides axios-like interface for making API calls from frontend routes
 */

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

interface APIResponse<T = any> {
  data: {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
  };
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
  }

  async request<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const requestInit: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    if (data && method.toUpperCase() !== 'GET') {
      requestInit.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, requestInit);
      const responseData = await response.json();

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error: any) {
      throw {
        response: {
          status: 500,
          data: {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: error.message || 'Network request failed',
            },
          },
        },
      };
    }
  }

  async get<T = any>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async delete<T = any>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }
}

export const api = new APIClient();