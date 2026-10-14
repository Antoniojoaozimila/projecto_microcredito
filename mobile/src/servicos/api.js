import axios from "axios";
import { lerItem } from "./armazenamento";
import { URL_API } from "./endereco";
import { encerrarSessaoExpirada, tokenEstaValido } from "./sessao";

const MENSAGEM_GENERICA = "Não foi possível iniciar sessão. Verifique os dados e tente novamente.";

const api = axios.create({
  baseURL: URL_API, // https://nbmm.tech → /api/autenticacao, /api/sincronizar, /api/utilizadores
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await lerItem("token");
    if (token && !tokenEstaValido(token)) {
      await encerrarSessaoExpirada();
      return Promise.reject(new Error("A sessão expirou. Faça login novamente."));
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (erro) {
    if (erro?.message?.includes("expirou")) return Promise.reject(erro);
  }
  config.headers["ngrok-skip-browser-warning"] = "true";
  return config;
});

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    if (erro.response?.status === 401) await encerrarSessaoExpirada();
    return Promise.reject(erro);
  }
);

const cabecalhos = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};

export const entrar = async (nome, senha) => {
  let resposta;
  try {
    resposta = await fetch(`${URL_API}/api/autenticacao/entrar`, {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify({ nome, senha, recaptchaToken: "" }),
    });
  } catch {
    throw new Error("Sem ligação ao servidor. Confirme a internet do telemóvel e volte a abrir a aplicação.");
  }

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok || !dados?.token) {
    throw new Error(dados?.mensagem || MENSAGEM_GENERICA);
  }
  return dados;
};

export default api;
