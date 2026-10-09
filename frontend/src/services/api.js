import axios from 'axios';

// Vazio = mesmo endereço onde o site está aberto; o Vite reencaminha /api para o backend.
export const baseURL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  config.headers['ngrok-skip-browser-warning'] = 'true';
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
