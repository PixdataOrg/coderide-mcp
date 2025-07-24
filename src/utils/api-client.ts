import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { logger } from './logger';
import { env } from './env'; // Import the updated env

const API_BASE = env.CODERIDE_API_URL;
const API_KEY = env.CODERIDE_API_KEY;

// --- API Response Type Definitions ---
// Consolidating and refining response types based on tool usage.

export interface TaskApiResponse {
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  agent?: string;
  agent_prompt?: string; // Keep this if other endpoints return it as snake_case
  context?: string;
  instructions?: string;
  taskPrompt?: string; // Changed to camelCase for /task/number/:taskNumber/prompt endpoint
  // Other fields the API might return but are not strictly typed here yet
  [key: string]: any; 
}

export interface UpdateTaskApiResponse {
  success: boolean;
  message?: string;
  task?: {
    number: string;
    title: string;
    description: string;
    status: string;
  };
  notFound?: boolean;
}

export interface ProjectApiResponse {
  slug: string;
  name: string;
  description: string;
  projectKnowledge?: object; // Corrected to camelCase based on GET API response
  projectDiagram?: string; // Corrected to camelCase based on GET API response
  projectStandards?: object | string; // Assuming camelCase for consistency with GET, or confirm API
  // Other fields the API might return
  [key: string]: any;
}

export interface UpdateProjectApiResponse {
  success: boolean;
  message?: string;
  project?: {
    slug: string;
    name: string;
    description: string;
    project_knowledge?: object; // Stays snake_case based on PUT API response
    project_diagram?: string; // Stays snake_case based on PUT API response
  };
  notFound?: boolean;
}

export interface StartProjectApiResponse {
  project?: {
    slug: string;
    name: string;
  };
  task?: {
    number: string;
    title: string;
    prompt?: string; // Changed to camelCase 'prompt' to match API for this endpoint
    // Removed other optional prompt fields if this endpoint only returns 'prompt'
  };
  error?: string; // If the API returns an error object directly in the response body
  // Other fields the API might return
  [key: string]: any;
}

// --- New API Response Types for MCP Tools ---

export interface ProjectListApiResponse {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  createdAt: string;
  icon: string;
  slug: string;
  status?: string; // Project status field
  workspace: {
    id: string;
    name: string;
  };
}

export interface TaskListApiResponse {
  id: string;
  name: string;
  slug: string;
  workspaceId: string;
  status: string;
  columns: Array<{
    id: string; // 'to-do', 'in-progress', 'in-review', 'done'
    name: string;
    tasks: Array<{
      id: string;
      title: string;
      number: string;
      description: string;
      status: string;
      priority: string;
      dueDate: string | null;
      createdAt: string;
      position: number;
      userEmail: string | null;
      assigneeName: string | null;
      assigneeEmail: string | null;
      projectId: string;
      context: any;
      instructions: any;
    }>;
  }>;
}

export interface NextTaskApiResponse {
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assigneeEmail: string | null;
  context: any;
  instructions: any;
}


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
    'api_key': API_KEY // Changed 'API_KEY' to 'api_key' (lowercase)
  }
});

// Add request logging
apiClient.interceptors.request.use(request => {
  const { method, url, data } = request;
  // Clone headers and remove/mask sensitive ones before logging
  const headersToLog = { ...request.headers };
  if (headersToLog['api_key']) { // Check for lowercase 'api_key'
    headersToLog['api_key'] = '***REDACTED***';
  }
  // Also consider redacting other sensitive headers like 'Authorization' if used
  // if (headersToLog['Authorization']) {
  //   headersToLog['Authorization'] = '***REDACTED***';
  // }

  logger.debug(`API Request: ${method?.toUpperCase()} ${url}`, { 
    headers: headersToLog,
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
    request: { // Log only safe request details
      url: requestDetails.url,
      method: requestDetails.method,
      // Avoid logging full headers or data by default in production if sensitive
    },
    response: responseData // Be cautious if responseData can contain sensitive info
  });
  
  // Determine a safe error message for the ApiError instance
  let safeErrorMessage = 'API request failed';
  if (status) {
    if (status === 401) {
      safeErrorMessage = 'Authentication failed. Please check your API key.';
    } else if (status === 403) {
      safeErrorMessage = 'Permission denied for the requested operation.';
    } else if (status === 404) {
      safeErrorMessage = 'The requested resource was not found.';
    } else if (status >= 500) {
      safeErrorMessage = 'An unexpected error occurred on the server.';
    } else if (typeof error.response?.data === 'object' && error.response?.data !== null && (error.response.data as any).message) {
      // If the backend provides a message and it's deemed safe, use it.
      // For now, let's prefer generic messages for external errors.
      // safeErrorMessage = (error.response.data as any).message; 
      // Defaulting to generic messages is safer unless backend messages are guaranteed safe.
    }
  }
    
  throw new ApiError(
    safeErrorMessage, // Use the determined safe error message
    status,
    requestDetails,
    responseData
  );
});
