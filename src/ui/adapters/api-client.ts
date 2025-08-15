/**
 * API Client Adapter - Frontend to Backend Communication
 * Handles authentication, error responses, and trust context
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiContext {
  trust?: string;
  trustId?: number;
  token?: string;
  sessionToken?: string;
}

interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private retries: number;
  private retryDelay: number;

  constructor(config: ApiClientConfig = {}) {
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.client = axios.create({
      baseURL: config.baseURL || process.env.BACKEND_URL || 'http://localhost:4000',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };

        // Log requests in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime();
        
        // Log slow requests
        if (duration > 5000) {
          console.warn(`[API] Slow request: ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`);
        }

        // Log responses in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
        }

        return response;
      },
      async (error) => {
        const config = error.config;
        
        // Don't retry if we've already retried max times
        if (!config || config._retryCount >= this.retries) {
          return this.handleError(error);
        }

        // Don't retry certain error types
        if (
          error.response?.status === 401 ||
          error.response?.status === 403 ||
          error.response?.status === 404 ||
          error.response?.status === 422 ||
          error.code === 'ECONNABORTED' // Timeout
        ) {
          return this.handleError(error);
        }

        // Increment retry count
        config._retryCount = (config._retryCount || 0) + 1;

        // Calculate delay with exponential backoff
        const delay = this.retryDelay * Math.pow(2, config._retryCount - 1);

        console.log(`[API] Retrying request (${config._retryCount}/${this.retries}) after ${delay}ms: ${config.method?.toUpperCase()} ${config.url}`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        return this.client(config);
      }
    );
  }

  private handleError(error: any) {
    // Log error details
    if (error.response) {
      console.error(`[API] Response error: ${error.response.status} ${error.response.statusText}`, {
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('[API] Network error:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
    } else {
      console.error('[API] Request setup error:', error.message);
    }

    return Promise.reject(error);
  }

  private addContextToConfig(config: AxiosRequestConfig, context?: ApiContext): AxiosRequestConfig {
    if (!config.headers) {
      config.headers = {};
    }

    if (context) {
      // Add trust context
      if (context.trust) {
        config.headers['X-Trust-Context'] = context.trust;
      }

      if (context.trustId) {
        config.headers['X-Trust-ID'] = context.trustId.toString();
      }

      // Add authentication
      if (context.token) {
        config.headers['Authorization'] = `Bearer ${context.token}`;
      } else if (context.sessionToken) {
        config.headers['X-Session-Token'] = context.sessionToken;
      }
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = this.generateRequestId();

    // Add user agent
    config.headers['User-Agent'] = `SchoolERP-Frontend/1.0.0`;

    return config;
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // GET request
  async get<T = any>(url: string, options: { ctx?: ApiContext, config?: AxiosRequestConfig } = {}): Promise<AxiosResponse<T>> {
    const config = this.addContextToConfig(options.config || {}, options.ctx);
    return this.client.get<T>(url, config);
  }

  // POST request
  async post<T = any>(url: string, data?: any, options: { ctx?: ApiContext, config?: AxiosRequestConfig } = {}): Promise<AxiosResponse<T>> {
    const config = this.addContextToConfig(options.config || {}, options.ctx);
    return this.client.post<T>(url, data, config);
  }

  // PUT request
  async put<T = any>(url: string, data?: any, options: { ctx?: ApiContext, config?: AxiosRequestConfig } = {}): Promise<AxiosResponse<T>> {
    const config = this.addContextToConfig(options.config || {}, options.ctx);
    return this.client.put<T>(url, data, config);
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, options: { ctx?: ApiContext, config?: AxiosRequestConfig } = {}): Promise<AxiosResponse<T>> {
    const config = this.addContextToConfig(options.config || {}, options.ctx);
    return this.client.patch<T>(url, data, config);
  }

  // DELETE request
  async delete<T = any>(url: string, options: { ctx?: ApiContext, config?: AxiosRequestConfig } = {}): Promise<AxiosResponse<T>> {
    const config = this.addContextToConfig(options.config || {}, options.ctx);
    return this.client.delete<T>(url, config);
  }

  // File upload
  async upload<T = any>(
    url: string, 
    formData: FormData, 
    options: { 
      ctx?: ApiContext, 
      config?: AxiosRequestConfig,
      onUploadProgress?: (progressEvent: any) => void
    } = {}
  ): Promise<AxiosResponse<T>> {
    const config = this.addContextToConfig({
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: options.onUploadProgress,
      ...options.config
    }, options.ctx);

    return this.client.post<T>(url, formData, config);
  }

  // Download file
  async download(
    url: string, 
    options: { 
      ctx?: ApiContext, 
      config?: AxiosRequestConfig,
      onDownloadProgress?: (progressEvent: any) => void
    } = {}
  ): Promise<AxiosResponse<Blob>> {
    const config = this.addContextToConfig({
      responseType: 'blob',
      onDownloadProgress: options.onDownloadProgress,
      ...options.config
    }, options.ctx);

    return this.client.get<Blob>(url, config);
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean, latency: number }> {
    try {
      const startTime = Date.now();
      const response = await this.client.get('/health');
      const latency = Date.now() - startTime;
      
      return {
        healthy: response.status === 200 && response.data?.ok === true,
        latency
      };
    } catch (error) {
      return {
        healthy: false,
        latency: -1
      };
    }
  }

  // Get current configuration
  getConfig() {
    return {
      baseURL: this.client.defaults.baseURL,
      timeout: this.client.defaults.timeout,
      retries: this.retries,
      retryDelay: this.retryDelay
    };
  }

  // Update configuration
  updateConfig(config: ApiClientConfig) {
    if (config.baseURL) {
      this.client.defaults.baseURL = config.baseURL;
    }
    if (config.timeout) {
      this.client.defaults.timeout = config.timeout;
    }
    if (config.retries !== undefined) {
      this.retries = config.retries;
    }
    if (config.retryDelay !== undefined) {
      this.retryDelay = config.retryDelay;
    }
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for custom instances
export { ApiClient };

// Type exports
export type { ApiContext, ApiClientConfig };

export default api;