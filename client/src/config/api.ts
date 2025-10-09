// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    reports: {
      drivers: `${API_BASE_URL}/api/reports/drivers`,
      mileage: `${API_BASE_URL}/api/reports/mileage`,
    },
    auth: {
      login: `${API_BASE_URL}/api/auth/login`,
      register: `${API_BASE_URL}/api/auth/register`,
      profile: `${API_BASE_URL}/api/auth/profile`,
    },
    vehicles: `${API_BASE_URL}/api/vehicles`,
    drivers: `${API_BASE_URL}/api/drivers`,
    dashboard: `${API_BASE_URL}/api/dashboard`,
    location: `${API_BASE_URL}/api/location`,
    notifications: `${API_BASE_URL}/api/notifications`,
  }
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};
