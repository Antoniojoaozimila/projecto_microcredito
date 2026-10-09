import { DataTypes } from "sequelize";
import { sequelize } from "../config/baseDados.js";

const texto = (valor, max = 255) => String(valor ?? "").slice(0, max);
const numero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const colunasBase = {
  id: { type: DataTypes.STRING(64), primaryKey: true },
  dados: { type: DataTypes.JSON, allowNull: false },
};

const opcoes = (tableName) => ({
  tableName,
  freezeTableName: true,
  timestamps: true,
  createdAt: "criado_em",
  updatedAt: "atualizado_em",
});

const definir = (tabela, extra = {}) =>
  sequelize.define(tabela, { ...colunasBase, ...extra }, opcoes(tabela));

const s = (campo, max = 200) => (item) => texto(item[campo], max) || null;
const n = (campo) => (item) => numero(item[campo]);

export const DEFINICOES = [
  {
    chave: "microcredito-clientes-v1",
    tabela: "clientes",
    modelo: definir("clientes", {
      nome_completo: DataTypes.STRING(200),
      documento_numero: DataTypes.STRING(50),
      telefone_principal: DataTypes.STRING(30),
      email: DataTypes.STRING(150),
      provincia: DataTypes.STRING(100),
      cidade: DataTypes.STRING(100),
      perfil_risco: DataTypes.STRING(10),
      score: DataTypes.INTEGER,
      limite_credito: DataTypes.DECIMAL(15, 2),
      cliente_ativo: DataTypes.BOOLEAN,
    }),
    campos: {
      nome_completo: s("nome_completo"),
      documento_numero: s("documento_numero", 50),
      telefone_principal: s("telefone_principal", 30),
      email: s("email", 150),
      provincia: s("provincia", 100),
      cidade: s("cidade", 100),
      perfil_risco: s("perfil_risco", 10),
      score: n("score"),
      limite_credito: n("limite_credito"),
      cliente_ativo: (item) => item.cliente_ativo !== false,
    },
  },
  {
    chave: "microcredito-emprestimos-v1",
    tabela: "emprestimos",
    modelo: definir("emprestimos", {
      numero_contrato: DataTypes.STRING(50),
      cliente_id: DataTypes.STRING(64),
      valor_emprestado: DataTypes.DECIMAL(15, 2),
      taxa_juros: DataTypes.DECIMAL(8, 2),
      tipo_juros: DataTypes.STRING(40),
      sistema_amortizacao: DataTypes.STRING(40),
      modalidade: DataTypes.STRING(40),
      num_parcelas: DataTypes.INTEGER,
      saldo_devedor: DataTypes.DECIMAL(15, 2),
      status: DataTypes.STRING(40),
    }),
    campos: {
      numero_contrato: s("numero_contrato", 50),
      cliente_id: (item) => texto(item.client_id, 64) || null,
      valor_emprestado: n("valor_emprestado"),
      taxa_juros: n("taxa_juros"),
      tipo_juros: s("tipo_juros", 40),
      sistema_amortizacao: s("sistema_amortizacao", 40),
      modalidade: s("modalidade", 40),
      num_parcelas: n("num_parcelas"),
      saldo_devedor: n("saldo_devedor"),
      status: s("status", 40),
    },
  },
  {
    chave: "microcredito-carteiras-v2",
    tabela: "carteiras",
    modelo: definir("carteiras", {
      nome: DataTypes.STRING(120),
      codigo: DataTypes.STRING(40),
      tipo: DataTypes.STRING(40),
      saldo: DataTypes.DECIMAL(15, 2),
      status: DataTypes.STRING(40),
    }),
    campos: {
      nome: s("nome", 120),
      codigo: s("codigo", 40),
      tipo: s("tipo", 40),
      saldo: n("saldo"),
      status: s("status", 40),
    },
  },
  {
    chave: "microcredito-pagamentos-v1",
    tabela: "pagamentos",
    modelo: definir("pagamentos", {
      numero_recibo: DataTypes.STRING(50),
      emprestimo_id: DataTypes.STRING(64),
      cliente_id: DataTypes.STRING(64),
      valor_pago: DataTypes.DECIMAL(15, 2),
      forma_pagamento: DataTypes.STRING(60),
      status: DataTypes.STRING(40),
    }),
    campos: {
      numero_recibo: s("numero_recibo", 50),
      emprestimo_id: (item) => texto(item.loan_id, 64) || null,
      cliente_id: (item) => texto(item.client_id, 64) || null,
      valor_pago: n("valor_pago"),
      forma_pagamento: s("forma_pagamento", 60),
      status: s("status", 40),
    },
  },
  {
    chave: "microcredito-alocacoes-v1",
    tabela: "alocacoes_pagamento",
    modelo: definir("alocacoes_pagamento"),
    campos: {},
  },
  {
    chave: "microcredito-garantias-v1",
    tabela: "garantias",
    modelo: definir("garantias", {
      cliente_id: DataTypes.STRING(64),
      emprestimo_id: DataTypes.STRING(64),
      tipo: DataTypes.STRING(80),
      status: DataTypes.STRING(40),
      valor_estimado: DataTypes.DECIMAL(15, 2),
    }),
    campos: {
      cliente_id: (item) => texto(item.client_id, 64) || null,
      emprestimo_id: (item) => texto(item.loan_id, 64) || null,
      tipo: s("tipo", 80),
      status: s("status", 40),
      valor_estimado: n("valor_estimado"),
    },
  },
  { chave: "microcredito-avalistas-v1", tabela: "avalistas", modelo: definir("avalistas"), campos: {} },
  { chave: "microcredito-garantias-movimentos-v1", tabela: "movimentos_garantia", modelo: definir("movimentos_garantia"), campos: {} },
  { chave: "microcredito-transacoes-v1", tabela: "transacoes_carteira", modelo: definir("transacoes_carteira"), campos: {} },
  { chave: "microcredito-carteiras-movimentos-v1", tabela: "movimentos_carteira", modelo: definir("movimentos_carteira"), campos: {} },
  { chave: "microcredito-transferencias-v1", tabela: "transferencias", modelo: definir("transferencias"), campos: {} },
  {
    chave: "microcredito-despesas-v1",
    tabela: "despesas",
    modelo: definir("despesas", {
      carteira_id: DataTypes.STRING(64),
      valor: DataTypes.DECIMAL(15, 2),
      status: DataTypes.STRING(40),
    }),
    campos: {
      carteira_id: (item) => texto(item.carteira_id, 64) || null,
      valor: n("valor"),
      status: s("status", 40),
    },
  },
  { chave: "microcredito-carteiras-fechos-v1", tabela: "fechos_carteira", modelo: definir("fechos_carteira"), campos: {} },
  {
    chave: "microcredito-zonas-v1",
    tabela: "zonas",
    modelo: definir("zonas", { nome: DataTypes.STRING(150), codigo: DataTypes.STRING(40), status: DataTypes.STRING(40) }),
    campos: { nome: s("nome", 150), codigo: s("codigo", 40), status: s("status", 40) },
  },
  {
    chave: "microcredito-cobradores-v1",
    tabela: "cobradores",
    modelo: definir("cobradores", { nome_completo: DataTypes.STRING(200), zona_id: DataTypes.STRING(64), status: DataTypes.STRING(40) }),
    campos: { nome_completo: s("nome_completo"), zona_id: (item) => texto(item.zona_id, 64) || null, status: s("status", 40) },
  },
  { chave: "microcredito-agendas-cobranca-v1", tabela: "agendas_cobranca", modelo: definir("agendas_cobranca"), campos: {} },
  { chave: "microcredito-agendas-itens-v1", tabela: "itens_agenda", modelo: definir("itens_agenda"), campos: {} },
  { chave: "microcredito-agendas-rotas-v1", tabela: "rotas_cobranca", modelo: definir("rotas_cobranca"), campos: {} },
  {
    chave: "microcredito-notificacoes-cobranca-v1",
    tabela: "notificacoes",
    modelo: definir("notificacoes", {
      cliente_id: DataTypes.STRING(64),
      canal: DataTypes.STRING(40),
      status: DataTypes.STRING(40),
      email_enviado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }),
    campos: {
      cliente_id: (item) => texto(item.client_id, 64) || null,
      canal: s("canal", 40),
      status: s("status", 40),
    },
    notificacao: true,
  },
  { chave: "microcredito-promessas-pagamento-v1", tabela: "promessas_pagamento", modelo: definir("promessas_pagamento"), campos: {} },
  { chave: "microcredito-perfis-v1", tabela: "perfis", modelo: definir("perfis", { nome: DataTypes.STRING(100), codigo: DataTypes.STRING(50) }), campos: { nome: s("nome", 100), codigo: s("codigo", 50) } },
  { chave: "microcredito-auditoria-v1", tabela: "auditoria", modelo: definir("auditoria"), campos: {} },
  { chave: "microcredito-integracoes-v1", tabela: "integracoes", modelo: definir("integracoes"), campos: {} },
  { chave: "microcredito-relatorios-v1", tabela: "relatorios", modelo: definir("relatorios"), campos: {} },
  { chave: "microcredito-relatorios-agendas-v1", tabela: "agendamentos_relatorio", modelo: definir("agendamentos_relatorio"), campos: {} },
  { chave: "microcredito-utilizadores-v1", tabela: "utilizadores_equipa", modelo: definir("utilizadores_equipa", { nome_completo: DataTypes.STRING(200), email: DataTypes.STRING(150), status: DataTypes.STRING(40) }), campos: { nome_completo: s("nome_completo"), email: s("email", 150), status: s("status", 40) } },
];

export const CHAVES_OBJECTO = [
  "microcredito-config-v1",
  "microcredito-marca-v1",
  "microcredito-notificacoes-config-v1",
];

export const Configuracao = sequelize.define("configuracoes", {
  chave: { type: DataTypes.STRING(120), primaryKey: true },
  valor: { type: DataTypes.JSON, allowNull: false },
}, opcoes("configuracoes"));

export const Extra = sequelize.define("registos_extra", {
  id: { type: DataTypes.STRING(80), primaryKey: true },
  colecao: DataTypes.STRING(120),
  dados: { type: DataTypes.JSON, allowNull: false },
}, opcoes("registos_extra"));

export const porChave = Object.fromEntries(DEFINICOES.map((d) => [d.chave, d]));

export const sincronizarTabelas = () => sequelize.sync();
