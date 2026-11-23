import axios from 'axios';

// Base API configuration
const envApiUrl = import.meta.env.VITE_API_URL || 'https://backend-swapnil-68e2.vercel.app';
// Normalize URL so requests to '/employees' map to '.../api/employees'
const API_BASE_URL = envApiUrl.endsWith('/api')
  ? envApiUrl
  : `${envApiUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to catch HTML responses (e.g., if Vercel Deployment Protection login redirects the request)
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      return Promise.reject(new Error('Backend returned HTML instead of JSON. If your Vercel project has "Deployment Protection" enabled, please disable it in Vercel Project Settings -> Deployment Protection.'));
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper for formatting currency
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
};

// Helper for formatting dates
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// Dashboard Service
export const getDashboardData = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

// Employee Services
export const getEmployees = async (search = '') => {
  const params = search ? { search } : {};
  const response = await api.get('/employees', { params });
  return response.data;
};

export const getEmployeeById = async (id) => {
  const response = await api.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employeeData) => {
  const response = await api.post('/employees', employeeData);
  return response.data;
};

export const updateEmployee = async (id, employeeData) => {
  const response = await api.put(`/employees/${id}`, employeeData);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await api.delete(`/employees/${id}`);
  return response.data;
};

// Payroll Services
export const getPayrolls = async (params = {}) => {
  const response = await api.get('/payroll', { params });
  return response.data;
};

export const getPayrollById = async (id) => {
  const response = await api.get(`/payroll/${id}`);
  return response.data;
};

export const createPayroll = async (payrollData) => {
  const response = await api.post('/payroll', payrollData);
  return response.data;
};

export const deletePayroll = async (id) => {
  const response = await api.delete(`/payroll/${id}`);
  return response.data;
};

export default api;
