// Endereço público da API (a mesma que o site usa, atrás do Caddy).
// Native (APK): EXPO_PUBLIC_API_URL no build, senão o endereço da VPS.
// Web (/m/): o próprio origin do browser, para ficar sempre na mesma API.
const API_PUBLICA = "https://148-230-115-150.sslip.io";

const configurado = String(process.env.EXPO_PUBLIC_API_URL || "").trim().replace(/\/$/, "");

const origemDoNavegador = () => {
  if (typeof window === "undefined") return "";
  const protocolo = window.location?.protocol;
  if (protocolo !== "http:" && protocolo !== "https:") return "";
  return String(window.location.origin || "").replace(/\/$/, "");
};

export const URL_API = configurado.startsWith("http")
  ? configurado
  : (origemDoNavegador() || API_PUBLICA);
