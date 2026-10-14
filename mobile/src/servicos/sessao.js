import { apagarItem, gravarItem, gravarVarios, lerItem } from "./armazenamento";

const TOKEN = "token";
const PERFIL = "userProfile";
const LEMBRAR = "microcredito-remember-nome";

const payloadDoToken = (token) => {
  const partes = String(token || "").split(".");
  if (partes.length < 2) return null;
  try {
    const texto = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const preenchido = texto.padEnd(Math.ceil(texto.length / 4) * 4, "=");
    const json = globalThis.atob
      ? globalThis.atob(preenchido)
      : globalThis.Buffer
        ? globalThis.Buffer.from(preenchido, "base64").toString("utf8")
        : "";
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const tokenEstaValido = (token) => {
  if (!token) return false;
  const dados = payloadDoToken(token);
  if (!dados) return false;
  if (!dados.exp) return true;
  return dados.exp * 1000 > Date.now();
};

export const milissegundosAteExpirar = (token) => {
  const dados = payloadDoToken(token);
  if (!dados?.exp) return null;
  return dados.exp * 1000 - Date.now();
};

export const limparSessao = async () => {
  await apagarItem(TOKEN);
  await apagarItem(PERFIL);
};

let aoExpirar = null;

export const aoSessaoExpirar = (fn) => {
  aoExpirar = fn;
};

export const encerrarSessaoExpirada = async () => {
  await limparSessao();
  aoExpirar?.();
};

export const guardarSessao = async ({ token, nome, email, tipo }) => {
  await gravarVarios([
    [TOKEN, token],
    [PERFIL, JSON.stringify({ nome, email: email || "", tipo: tipo || "agente" })],
  ]);
};

export const lerNomeLembrado = async () => {
  try {
    return (await lerItem(LEMBRAR)) || "";
  } catch {
    return "";
  }
};

export const guardarNomeLembrado = async (nome) => {
  if (nome) await gravarItem(LEMBRAR, nome);
  else await apagarItem(LEMBRAR);
};
