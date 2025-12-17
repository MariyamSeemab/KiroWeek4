// API Configuration for different environments
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    HEALTH: '/api/health',
    GENERATE: '/api/ai/generate',
    STATUS: '/api/ai/status',
    RESULT: '/api/ai/result',
    PROVIDERS: '/api/ai/providers'
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Environment detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;