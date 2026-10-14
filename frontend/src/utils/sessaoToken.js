const LOGIN = "/microcredito/login";
const EVENTO_SESSAO = "microcredito-sessao-expirada";

const payloadDoToken = (token) => {
  const partes = String(token || "").split(".");
  if (partes.length < 2) return null;
  try {
    const texto = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(texto)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const eTokenDemo = (token) => String(token || "").startsWith("demo-");

export const tokenEstaValido = (token) => {
  if (!token) return false;
  if (eTokenDemo(token)) return Boolean(import.meta.env.DEV);
  const dados = payloadDoToken(token);
  if (!dados) return false;
  if (!dados.exp) return true;
  return dados.exp * 1000 > Date.now();
};

export const milissegundosAteExpirar = (token) => {
  if (!token || eTokenDemo(token)) return null;
  const dados = payloadDoToken(token);
  if (!dados?.exp) return null;
  return dados.exp * 1000 - Date.now();
};

let aRedirecionar = false;

export const encerrarSessaoExpirada = () => {
  if (aRedirecionar) return;
  aRedirecionar = true;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("userProfile");
  } catch {
    /* o redireccionamento segue mesmo se o armazenamento falhar */
  }
  window.dispatchEvent(new CustomEvent(EVENTO_SESSAO));
  if (!window.location.pathname.startsWith(LOGIN)) {
    window.location.replace(LOGIN);
  } else {
    aRedirecionar = false;
  }
};

export const EVENTO_SESSAO_EXPIRADA = EVENTO_SESSAO;
