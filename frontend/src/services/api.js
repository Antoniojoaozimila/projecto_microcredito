import axios from 'axios';
import { encerrarSessaoExpirada, tokenEstaValido } from '../utils/sessaoToken';

// Vazio = mesmo endereço onde o site está aberto; o Vite reencaminha /api para o backend.
export const baseURL = import.meta.env.VITE_API_URL || "";

const ePedidoDeLogin = (url = "") => String(url).includes("/autenticacao/entrar");

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
  if (!ePedidoDeLogin(config.url) && token && !tokenEstaValido(token)) {
    encerrarSessaoExpirada();
    return Promise.reject(new Error("A sessão expirou. Faça login novamente."));
  }
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
  (error) => {
    if (error.response?.status === 401 && !ePedidoDeLogin(error.config?.url)) {
      encerrarSessaoExpirada();
    }
    return Promise.reject(error);
  }
);

export default api;
