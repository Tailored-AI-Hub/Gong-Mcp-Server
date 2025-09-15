import axios, { AxiosInstance } from 'axios';

export interface GongConnectionConfig {
  accessKey: string;
  accessKeySecret: string;
  baseUrl?: string;
}

export class GongConnection {
  private client: AxiosInstance;
  private accessKey: string;
  private accessKeySecret: string;

  constructor(config: GongConnectionConfig) {
    this.accessKey = config.accessKey;
    this.accessKeySecret = config.accessKeySecret;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.gong.io/v2',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      const auth = Buffer.from(`${this.accessKey}:${this.accessKeySecret}`).toString('base64');
      config.headers.Authorization = `Basic ${auth}`;
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          throw new Error(`Gong API Error ${status}: ${data?.message || error.message}`);
        }
        throw error;
      }
    );
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete(endpoint);
    return response.data;
  }
}

export async function createGongConnection(): Promise<GongConnection> {
  const accessKey = process.env.GONG_ACCESS_KEY;
  const accessKeySecret = process.env.GONG_ACCESS_KEY_SECRET;
  const baseUrl = process.env.GONG_BASE_URL;

  if (!accessKey || !accessKeySecret) {
    throw new Error('GONG_ACCESS_KEY and GONG_ACCESS_KEY_SECRET environment variables are required');
  }

  return new GongConnection({
    accessKey,
    accessKeySecret,
    baseUrl,
  });
}
