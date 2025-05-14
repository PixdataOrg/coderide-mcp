import axios from 'axios';
import { logger } from './logger';
import { env } from './env'; // Import the updated env

const API_BASE = env.CODERIDE_API_URL;
const API_KEY = env.CODERIDE_API_KEY;

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  }
});

apiClient.interceptors.response.use(response => {
  logger.debug(`API Response: ${response.status}`);
  return response.data;
}, error => {
  logger.error(`API Error: ${error.message}`);
  throw new Error(error.response?.data?.message || 'API request failed');
});
