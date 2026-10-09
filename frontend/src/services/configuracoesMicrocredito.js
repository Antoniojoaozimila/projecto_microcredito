import { gravarLista, lerLista } from "./emprestimosMicrocredito";
import { chavesDados } from "./ponteServidor";

const CHAVE_CONFIG = "microcredito-config-v1";
const CHAVE_USERS = "microcredito-utilizadores-v1";
const CHAVE_PERFIS = "microcredito-perfis-v1";
const CHAVE_AUDIT = "microcredito-auditoria-v1";
const CHAVE_INTEG = "microcredito-integracoes-v1";

export const PADRAO_CONFIG = {
  nome_empresa: "Mukuru Finance",
  endereco_empresa: "",
  telefone_empresa: "",
  email_empresa: "",
  nuit_empresa: "",
  moeda_padrao: "MZN",
  idioma_padrao: "pt",
  fuso_horario: "Africa/Maputo",
  formato_data: "DD/MM/YYYY",
  taxa_juros_padrao: 20,
  tipo_juros_padrao: "Simples",
  sistema_amortizacao_padrao: "Tabela Price",
  valor_minimo_emprestimo: 100,
  valor_maximo_emprestimo: 1000000,
  prazo_minimo_parcelas: 1,
  prazo_maximo_parcelas: 52,
  idade_minima_cliente: 18,
  idade_maxima_cliente: 70,
  score_minimo_aprovacao: 400,
  max_emprestimos_ativos: 2,
  garantia_obrigatoria_acima: 50000,
  aprovacao_gestor_acima: 100000,
  dias_carencia: 0,
  taxa_multa_atraso: 2,
  dias_para_penhor: 90,
  dias_para_execucao: 180,
  max_clientes_rota: 15,
  raio_max_cobranca_km: 20,
  meta_mensal_cobrador: 500000,
  comissao_cobrador: 5,
  dias_lembrete_antes: 3,
  dias_lembrete_apos: 1,
  notificacoes_email_ativo: true,
  notificacoes_sms_ativo: true,
  notificacoes_push_ativo: true,
  notificacoes_whatsapp_ativo: false,
  email_smtp_host: "",
  email_smtp_port: 587,
  email_smtp_user: "",
  email_smtp_pass: "",
  sms_api_key: "",
  sms_api_secret: "",
  sms_sender_id: "MUKURU",
  min_caracteres_senha: 8,
  requer_maiuscula: true,
  requer_minuscula: true,
  requer_numero: true,
  requer_simbolo: false,
  expiracao_senha_dias: 90,
  max_tentativas_login: 5,
  bloqueio_minutos: 30,
  sessao_expiracao_min: 60,
  two_factor_obrigatorio: false,
  log_auditoria_ativo: true,
  backup_automatico: true,
  backup_frequencia: "Diário",
  backup_hora: "02:00",
  mpesa_api_url: "",
  mpesa_api_key: "",
  mpesa_api_secret: "",
  emola_api_url: "",
  emola_api_key: "",
  emola_api_secret: "",
  banco_api_url: "",
  banco_api_key: "",
  google_maps_api_key: "",
  tipos_garantia_inactivos: [],
  bm_provincia: "",
  bm_fax: "N/A",
  bm_nr_trabalhadores: "",
  bm_inicio_actividades: "",
  bm_nome_operador: "",
  bm_capital_inicial: 0,
  bm_capital_actual: 0,
  bm_capitais_proprios: "",
  bm_alheios_nacionais: 0,
  bm_alheios_estrangeiros: 0,
};

const agora = () => new Date().toISOString();
const nomeDe = (u) => u?.nome || "Sistema";

export const lerConfig = () => {
  try {
    return { ...PADRAO_CONFIG, ...(JSON.parse(localStorage.getItem(CHAVE_CONFIG) || "null") || {}) };
  } catch {
    return { ...PADRAO_CONFIG };
  }
};

export const registarAuditoria = (entrada, utilizador) => {
  if (lerConfig().log_auditoria_ativo === false && entrada.modulo !== "configuracoes") return;
  const lista = lerLista(CHAVE_AUDIT);
  gravarLista(CHAVE_AUDIT, [{
    id: crypto.randomUUID(),
    accao: entrada.accao,
    modulo: entrada.modulo,
    entidade_id: entrada.entidade_id || null,
    dados_novos: entrada.dados_novos || null,
    ip: "local",
    por: nomeDe(utilizador),
    data_acao: agora(),
  }, ...lista].slice(0, 200));
};

export const listarAuditoria = () => lerLista(CHAVE_AUDIT);

export const guardarConfig = (parcial, utilizador) => {
  const actual = { ...lerConfig(), ...parcial, data_atualizacao: agora(), atualizado_por: nomeDe(utilizador) };
  localStorage.setItem(CHAVE_CONFIG, JSON.stringify(actual));
  registarAuditoria({ accao: "ALTERAR_CONFIGURACAO", modulo: "configuracoes", dados_novos: Object.keys(parcial) }, utilizador);
  return actual;
};

const hashSenha = async (senha) => {
  const dados = new TextEncoder().encode(String(senha));
  const digest = await crypto.subtle.digest("SHA-256", dados);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const listarUtilizadoresLocais = () => lerLista(CHAVE_USERS);

export const guardarUtilizadorLocal = async (dados, utilizador) => {
  const lista = listarUtilizadoresLocais();
  const email = String(dados.email || "").trim().toLowerCase();
  if (!dados.nome_completo?.trim()) throw new Error("Indique o nome completo.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("Email inválido.");
  if (lista.some((u) => u.email === email && String(u.id) !== String(dados.id || ""))) throw new Error("Já existe um utilizador com este email.");
  if (!/^(\+258)?8[2-7]\d{7}$/.test(String(dados.telefone || "").replace(/\s/g, ""))) throw new Error("Use um telefone moçambicano (Ex: 84xxxxxxx).");
  if (dados.perfil === "Cobrador" && !dados.zona_id) throw new Error("O cobrador precisa de uma zona.");
  let senha_hash = dados.senha_hash || "";
  if (!dados.id || dados.senha) {
    if (String(dados.senha || "").length < Number(lerConfig().min_caracteres_senha || 8)) throw new Error("A senha não cumpre o mínimo de caracteres.");
    if (dados.senha !== dados.confirmar) throw new Error("A confirmação da senha não coincide.");
    senha_hash = await hashSenha(dados.senha);
  }
  const base = {
    nome_completo: dados.nome_completo.trim(),
    email,
    telefone: String(dados.telefone).replace(/\s/g, ""),
    foto_perfil: dados.foto_perfil || "",
    perfil: dados.perfil,
    zona_id: dados.zona_id || null,
    status: dados.status || "Ativo",
    two_factor_enabled: Boolean(dados.two_factor_enabled),
    observacoes: dados.observacoes || "",
    senha_hash,
    data_atualizacao: agora(),
  };
  if (dados.id) {
    gravarLista(CHAVE_USERS, lista.map((u) => (String(u.id) === String(dados.id) ? { ...u, ...base } : u)));
    registarAuditoria({ accao: "ATUALIZAR_UTILIZADOR", modulo: "utilizadores", entidade_id: dados.id }, utilizador);
    return { ...base, id: dados.id };
  }
  const novo = { ...base, id: crypto.randomUUID(), tentativas_login: 0, ultimo_acesso: null, data_registo: agora(), criado_por: nomeDe(utilizador) };
  gravarLista(CHAVE_USERS, [...lista, novo]);
  registarAuditoria({ accao: "CRIAR_UTILIZADOR", modulo: "utilizadores", entidade_id: novo.id }, utilizador);
  return novo;
};

export const eliminarUtilizadorLocal = (id, utilizador) => {
  gravarLista(CHAVE_USERS, listarUtilizadoresLocais().filter((u) => String(u.id) !== String(id)));
  registarAuditoria({ accao: "EXCLUIR_UTILIZADOR", modulo: "utilizadores", entidade_id: id }, utilizador);
};

const PERFIS_INICIAIS = [
  { id: 1, nome: "Administrador", codigo: "ADMIN", descricao: "Acesso total ao sistema", nivel_acesso: 1, status: "Ativo", permissoes: ["*"] },
  { id: 2, nome: "Gestor", codigo: "GESTOR", descricao: "Aprova crédito, despesas e relatórios", nivel_acesso: 2, status: "Ativo", permissoes: ["clientes.ler", "clientes.criar", "emprestimos.ler", "emprestimos.aprovar", "pagamentos.ler", "relatorios.exportar", "configuracoes.ler"] },
  { id: 3, nome: "Analista", codigo: "ANALISTA", descricao: "Consulta e registo operacional", nivel_acesso: 3, status: "Ativo", permissoes: ["clientes.ler", "clientes.criar", "emprestimos.ler", "emprestimos.criar", "pagamentos.ler", "pagamentos.criar"] },
  { id: 4, nome: "Cobrador", codigo: "COBRADOR", descricao: "Rotas e cobranças da sua zona", nivel_acesso: 4, status: "Ativo", permissoes: ["cobrancas.ler", "cobrancas.criar", "pagamentos.criar", "clientes.ler"] },
];

export const MODULOS_PERMISSAO = ["clientes", "emprestimos", "pagamentos", "garantias", "cobrancas", "carteiras", "relatorios", "configuracoes"];
export const ACCOES_PERMISSAO = ["criar", "ler", "atualizar", "excluir", "aprovar", "exportar"];

export const listarPerfis = () => {
  const lista = lerLista(CHAVE_PERFIS);
  if (!lista.length) {
    gravarLista(CHAVE_PERFIS, PERFIS_INICIAIS);
    return PERFIS_INICIAIS;
  }
  return lista;
};

export const guardarPerfil = (perfil, utilizador) => {
  const lista = listarPerfis();
  gravarLista(CHAVE_PERFIS, lista.map((p) => (String(p.id) === String(perfil.id) ? { ...p, ...perfil, data_atualizacao: agora() } : p)));
  registarAuditoria({ accao: "ATUALIZAR_PERFIL", modulo: "perfis", entidade_id: perfil.id }, utilizador);
};

const INTEG_INICIAIS = [
  { id: "mpesa", nome: "M-Pesa", tipo: "Pagamento", provedor: "Vodacom", chaves: ["mpesa_api_url", "mpesa_api_key", "mpesa_api_secret"] },
  { id: "emola", nome: "E-Mola", tipo: "Pagamento", provedor: "Movitel", chaves: ["emola_api_url", "emola_api_key", "emola_api_secret"] },
  { id: "banco", nome: "Banco", tipo: "Banco", provedor: "API bancária", chaves: ["banco_api_url", "banco_api_key"] },
  { id: "maps", nome: "Google Maps", tipo: "Outro", provedor: "Google", chaves: ["google_maps_api_key"] },
];

export const listarIntegracoes = () => {
  const extra = Object.fromEntries(lerLista(CHAVE_INTEG).map((i) => [i.id, i]));
  return INTEG_INICIAIS.map((i) => ({ status: "Inativa", ultimo_teste: null, ...i, ...(extra[i.id] || {}) }));
};

export const testarIntegracao = (id, utilizador) => {
  const config = lerConfig();
  const item = listarIntegracoes().find((i) => i.id === id);
  const preenchidas = item.chaves.every((c) => String(config[c] || "").trim());
  const estado = { id, status: preenchidas ? "Ativa" : "Erro", ultimo_teste: agora() };
  const lista = lerLista(CHAVE_INTEG).filter((i) => i.id !== id);
  gravarLista(CHAVE_INTEG, [...lista, estado]);
  registarAuditoria({ accao: "TESTAR_INTEGRACAO", modulo: "integracoes", entidade_id: id, dados_novos: estado.status }, utilizador);
  if (!preenchidas) throw new Error("Preencha a URL e as chaves antes de testar.");
  return estado;
};

export const exportarBackup = () => {
  const dados = {};
  chavesDados().forEach((chave) => {
    dados[chave] = localStorage.getItem(chave);
  });
  return dados;
};

export const importarBackup = (dados, utilizador) => {
  Object.entries(dados || {}).forEach(([chave, valor]) => {
    if (chave.startsWith("microcredito-")) localStorage.setItem(chave, valor);
  });
  registarAuditoria({ accao: "RESTAURAR_BACKUP", modulo: "seguranca" }, utilizador);
};
