/** Contas fictícias — usadas apenas em `npm run dev`. Não entram no build de produção. */
export const DEMO_ADMIN = {
  email: "admin@microcredito.local",
  senha: "Admin@Microcredito2026",
  nome: "Administrador Demo",
  tipo: "admin",
};

export const TEST_USER = {
  email: "elton.matsinhe@microcredito.local",
  senha: "Teste123",
  nome: "Elton Matsinhe",
  tipo: "admin",
};

const LOCAL_USERS = [DEMO_ADMIN, TEST_USER];
const CHAVE_SENHAS = "microcredito-senhas-locais";

const lerSenhas = () => {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_SENHAS) || "{}");
    return dados && typeof dados === "object" ? dados : {};
  } catch {
    return {};
  }
};

export const senhaDemoActual = (identificador) => {
  const value = String(identificador || "").trim().replace(/\s+/g, " ").toLowerCase();
  const user = LOCAL_USERS.find(
    (item) => item.nome.trim().toLowerCase() === value || item.email.trim().toLowerCase() === value
  );
  if (!user) return "";
  return lerSenhas()[user.email] || user.senha;
};

export const gravarSenhaDemo = (identificador, senha) => {
  const value = String(identificador || "").trim().replace(/\s+/g, " ").toLowerCase();
  const user = LOCAL_USERS.find(
    (item) => item.nome.trim().toLowerCase() === value || item.email.trim().toLowerCase() === value
  );
  if (!user) return false;
  const senhas = lerSenhas();
  senhas[user.email] = String(senha || "");
  localStorage.setItem(CHAVE_SENHAS, JSON.stringify(senhas));
  return true;
};

export const isDemoAdminLogin = (identificador, senha) => {
  if (!import.meta.env.DEV) return false;
  const value = String(identificador || "").trim().replace(/\s+/g, " ").toLowerCase();
  const password = String(senha || "").trim();
  const user = LOCAL_USERS.find((item) => value === item.nome.trim().toLowerCase());
  return Boolean(user) && password === senhaDemoActual(user.nome);
};

export const buildDemoAdminSession = (identificador) => {
  const value = String(identificador || "").trim().toLowerCase();
  const user = LOCAL_USERS.find((item) => item.nome.toLowerCase() === value) || TEST_USER;
  return {
    token: `demo-${user.tipo}-${Date.now()}`,
    tipo: user.tipo,
    nome: user.nome,
    email: user.email,
    fotoPerfil: null,
  };
};
