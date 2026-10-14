// src/contexts/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { isDemoAdminLogin, buildDemoAdminSession } from "../constants/demoAdmin";
import { hidratarDoServidor } from "../services/ponteServidor";
import { guardarConfig, lerConfig } from "../services/configuracoesMicrocredito";
import {
  encerrarSessaoExpirada,
  EVENTO_SESSAO_EXPIRADA,
  milissegundosAteExpirar,
  tokenEstaValido,
} from "../utils/sessaoToken";

const STORAGE_PROFILE = "userProfile";

const alinharDuracaoSessao = () => {
  try {
    const guardada = JSON.parse(localStorage.getItem("microcredito-config-v1") || "null") || {};
    if (Number(guardada.sessao_expiracao_min) === 60) {
      guardarConfig({ sessao_expiracao_min: lerConfig().sessao_expiracao_min });
    }
  } catch {
    /* a sessão segue com o valor por omissão de 5 horas */
  }
};

export const AuthContext = createContext();

const loadProfile = () => {
  try {
    const s = localStorage.getItem(STORAGE_PROFILE);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

const saveProfile = (data) => {
  try {
    if (data) localStorage.setItem(STORAGE_PROFILE, JSON.stringify(data));
    else localStorage.removeItem(STORAGE_PROFILE);
  } catch (e) {
    console.error("Erro ao salvar perfil:", e);
  }
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    saveProfile(null);
    setUsuario(null);
    delete api.defaults.headers.common["Authorization"];
  }, []);

  useEffect(() => {
    const aoExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  useEffect(() => {
    if (!usuario?.token) return undefined;
    const resto = milissegundosAteExpirar(usuario.token);
    if (resto == null) return undefined;
    if (resto <= 0) {
      encerrarSessaoExpirada();
      return undefined;
    }
    const temporizador = setTimeout(() => encerrarSessaoExpirada(), resto);
    return () => clearTimeout(temporizador);
  }, [usuario?.token]);

  useEffect(() => {
    let activo = true;
    (async () => {
      const token = localStorage.getItem("token");
      const profile = loadProfile();
      if (token && !tokenEstaValido(token)) {
        encerrarSessaoExpirada();
        if (activo) setCarregando(false);
        return;
      }
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        if (!String(token).startsWith("demo-")) {
          try {
            await hidratarDoServidor();
            alinharDuracaoSessao();
          } catch {
            /* sem resposta do servidor os ecrãs ficam vazios até a base voltar */
          }
        }
        if (!activo) return;
        setUsuario({
          token,
          tipo: profile?.tipo ?? "agente",
          nome: profile?.nome ?? "Utilizador",
          email: profile?.email ?? "",
          fotoPerfil: profile?.fotoPerfil ?? null,
        });
      }
      if (activo) setCarregando(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  const login = async (nome, senha, recaptchaToken = "") => {
    if (isDemoAdminLogin(nome, senha)) {
      const newUser = buildDemoAdminSession(nome);
      try {
        localStorage.setItem("token", newUser.token);
        saveProfile({
          nome: newUser.nome,
          email: newUser.email,
          tipo: newUser.tipo,
          fotoPerfil: undefined,
        });
      } catch {
        /* a sessão segue mesmo se o browser bloquear o armazenamento */
      }
      api.defaults.headers.common["Authorization"] = `Bearer ${newUser.token}`;
      setUsuario(newUser);
      return;
    }

    const response = await api.post("/api/autenticacao/entrar", {
      nome,
      senha,
      recaptchaToken,
    });
    const { token, tipo, nome: nomeApi } = response.data;
    if (!token || typeof token !== "string") {
      throw new Error("Sessão inválida");
    }

    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    try {
      await hidratarDoServidor();
      alinharDuracaoSessao();
    } catch {
      /* a sessão fica válida; os ecrãs voltam a pedir os dados */
    }

    const profile = loadProfile();
    const newUser = {
      token,
      tipo,
      nome: nomeApi ?? nome ?? profile?.nome ?? "Utilizador",
      email: response.data?.email ?? profile?.email ?? "",
      fotoPerfil: profile?.fotoPerfil ?? null,
    };
    saveProfile({
      nome: newUser.nome,
      email: newUser.email,
      tipo: newUser.tipo,
      fotoPerfil: newUser.fotoPerfil ?? undefined,
    });
    setUsuario(newUser);
  };

  const updateUser = useCallback((updates) => {
    setUsuario((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      saveProfile({
        nome: next.nome,
        email: next.email,
        tipo: next.tipo,
        fotoPerfil: next.fotoPerfil ?? undefined,
      });
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
