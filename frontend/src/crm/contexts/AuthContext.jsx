import { useContext, useMemo } from "react";
import { AuthContext as PlatformAuthContext } from "../../contexts/AuthContext";

const mapRole = (tipo) => {
  const t = String(tipo || "").toLowerCase();
  if (t === "subscricao" || t === "subscritor") return "subscritor";
  if (t === "admin") return "admin";
  if (t === "supervisor") return "supervisor";
  return "agente";
};

export const useAuth = () => {
  const ctx = useContext(PlatformAuthContext);
  const usuario = useMemo(() => {
    if (!ctx?.usuario) return null;
    return {
      ...ctx.usuario,
      role: mapRole(ctx.usuario.tipo || ctx.usuario.role),
    };
  }, [ctx?.usuario]);

  return {
    usuario,
    carregando: ctx?.carregando ?? false,
    logout: ctx?.logout,
    isAuthenticated: !!usuario,
  };
};

export const AuthContext = PlatformAuthContext;
