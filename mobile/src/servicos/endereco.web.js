// Na web o telemóvel é servido pelo mesmo domínio da API (o Caddy encaminha /api para o backend).
export const URL_API = typeof window !== "undefined" ? window.location.origin : "";
