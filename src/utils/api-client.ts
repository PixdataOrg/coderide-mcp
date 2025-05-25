import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { logger } from './logger';
import { env } from './env'; // Import the updated env

const API_BASE = env.CODERIDE_API_URL;
const API_KEY = env.CODERIDE_API_KEY;

// Custom error class for API errors
export class ApiError extends Error {
  status?: number;
  requestDetails?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    data?: any;
  };
  responseData?: any;

  constructor(message: string, status?: number, requestDetails?: any, responseData?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestDetails = requestDetails;
    this.responseData = responseData;
  }
}

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'API_KEY': API_KEY
  }
});

// Add request logging
apiClient.interceptors.request.use(request => {
  const { method, url, data } = request;
  logger.debug(`API Request: ${method?.toUpperCase()} ${url}`, { 
    headers: request.headers,
    data: data ? JSON.stringify(data).substring(0, 500) : undefined
  });
  return request;
});

// Add response handling and error logging
apiClient.interceptors.response.use(response => {
  logger.debug(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
  return response.data;
}, (error: AxiosError) => {
  const config = error.config as AxiosRequestConfig;
  const requestDetails = {
    url: `${config?.baseURL}${config?.url}`,
    method: config?.method?.toUpperCase() || 'UNKNOWN',
    headers: config?.headers as Record<string, string>,
    data: config?.data
  };
  
  const status = error.response?.status;
  const responseData = error.response?.data;
  
  // Log the error with details
  logger.error(`API Error: ${error.message}`);
  logger.debug('API Error Details', {
    statusCode: status,
    request: requestDetails,
    response: responseData
  });
  
  // Extract error message safely
  const errorMessage = typeof error.response?.data === 'object' && error.response?.data !== null
    ? (error.response.data as any).message || error.message || 'API request failed'
    : error.message || 'API request failed';
    
  throw new ApiError(
    errorMessage,
    status,
    requestDetails,
    responseData
  );
});
