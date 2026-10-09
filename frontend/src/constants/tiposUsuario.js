/** Opções do campo «Tipo de usuário» (criar / editar). */
export const TIPOS_USUARIO_OPTIONS = [
  { value: "agente", label: "Agente (sem acesso a Pagamentos)" },
  { value: "supervisor", label: "Supervisor (acesso à sua equipa)" },
  { value: "subscricao", label: "Subscrição (finaliza apólices emitidas)" },
  { value: "admin", label: "Admin (acesso pleno)" },
];

export const labelTipoUsuario = (tipo) => {
  const map = {
    admin: "Admin",
    supervisor: "Supervisor",
    subscricao: "Subscrição",
    agente: "Agente",
  };
  return map[String(tipo || "").toLowerCase()] || tipo || "—";
};

/** Admin e Subscrição — edição de clientes, seguros, viaturas e imagens. */
export const ROLES_EDICAO_SUBSCRICAO = ["admin", "subscricao"];

export const podeEditarSubscricao = (tipo) =>
  ROLES_EDICAO_SUBSCRICAO.includes(String(tipo || "").toLowerCase());
