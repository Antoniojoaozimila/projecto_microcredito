import { apagarItem, gravarItem, gravarVarios, lerItem } from "./armazenamento";

const TOKEN = "token";
const PERFIL = "userProfile";
const LEMBRAR = "microcredito-remember-nome";

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
