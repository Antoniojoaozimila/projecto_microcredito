import axios from "axios";
import { lerItem } from "./armazenamento";
import { URL_API } from "./endereco";

const MENSAGEM_GENERICA = "Não foi possível iniciar sessão. Verifique os dados e tente novamente.";

const api = axios.create({
  baseURL: URL_API,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await lerItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    /* o pedido segue mesmo sem sessão guardada */
  }
  config.headers["ngrok-skip-browser-warning"] = "true";
  return config;
});

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
