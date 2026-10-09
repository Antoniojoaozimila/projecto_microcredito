export const GRUPOS = [
  {
    titulo: "Painel",
    itens: [{ id: "dashboard", titulo: "Dashboard", grupo: "painel" }],
  },
  {
    titulo: "Clientes e crédito",
    itens: [
      { id: "cli-lista", titulo: "Listar clientes", grupo: "clientes" },
      { id: "cli-mapa", titulo: "Mapa de clientes", grupo: "clientes" },
      { id: "emp-lista", titulo: "Listar empréstimos", grupo: "emprestimos" },
      { id: "emp-calendario", titulo: "Calendário", grupo: "emprestimos" },
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      { id: "pag-registar", titulo: "Registar pagamento", grupo: "pagamentos" },
      { id: "pag-historico", titulo: "Histórico de pagamentos", grupo: "pagamentos" },
      { id: "gar-lista", titulo: "Lista de garantias", grupo: "garantias" },
      { id: "gar-penhoradas", titulo: "Garantias penhoradas", grupo: "garantias" },
      { id: "gar-execucao", titulo: "Execução de garantias", grupo: "garantias" },
      { id: "gar-alertas", titulo: "Alertas de garantias", grupo: "garantias" },
      { id: "cob-agenda", titulo: "Agenda de cobranças", grupo: "cobrancas" },
      { id: "cob-historico", titulo: "Histórico de cobranças", grupo: "cobrancas" },
      { id: "cob-rota", titulo: "Rota de cobrança", grupo: "cobrancas" },
      { id: "cob-zonas", titulo: "Zonas e territórios", grupo: "cobrancas" },
      { id: "cob-cobradores", titulo: "Cobradores", grupo: "cobrancas" },
      { id: "car-gestao", titulo: "Gestão de carteiras", grupo: "carteiras" },
      { id: "car-movimentos", titulo: "Movimentos e transferências", grupo: "carteiras" },
      { id: "car-despesas", titulo: "Despesas", grupo: "carteiras" },
    ],
  },
  {
    titulo: "Gestão",
    itens: [
      { id: "cfg-utilizadores", titulo: "Utilizadores", grupo: "config" },
      { id: "cfg-identidade", titulo: "Identidade da empresa", grupo: "config" },
      { id: "cfg-backup", titulo: "Backup e segurança", grupo: "config" },
    ],
  },
];

const TABELAS = {
  clientes: {
    colunas: ["Cliente", "Zona", "Estado"],
    linhas: [],
  },
  emprestimos: {
    colunas: ["Contrato", "Valor", "Estado"],
    linhas: [],
  },
  pagamentos: {
    colunas: ["Recibo", "Valor", "Forma"],
    linhas: [],
  },
  garantias: {
    colunas: ["Bem", "Valor", "Estado"],
    linhas: [],
  },
  cobrancas: {
    colunas: ["Visita", "Cobrador", "Estado"],
    linhas: [],
  },
  carteiras: {
    colunas: ["Carteira", "Saldo", "Movimento"],
    linhas: [],
  },
  relatorios: {
    colunas: ["Indicador", "Mês", "Valor"],
    linhas: [],
  },
  config: {
    colunas: ["Item", "Valor", "Estado"],
    linhas: [],
  },
  painel: {
    colunas: ["Área", "Registos", "Situação"],
    linhas: [],
  },
};

export const tabelaDe = (grupo) => TABELAS[grupo] || TABELAS.painel;

export const MESES = [];

export const RESUMOS = [];

const folha = (id, titulo, grupo) => ({ id, titulo, grupo });

export const MENU = [
  {
    titulo: "Painel",
    entradas: [folha("dashboard", "Dashboard", "painel")],
  },
  {
    titulo: "Clientes e crédito",
    entradas: [
      {
        id: "clientes",
        titulo: "Clientes",
        filhos: [
          folha("cli-lista", "Listar clientes", "clientes"),
          folha("cli-mapa", "Mapa de clientes", "clientes"),
        ],
      },
      {
        id: "emprestimos",
        titulo: "Empréstimos",
        filhos: [
          folha("emp-lista", "Listar empréstimos", "emprestimos"),
          folha("emp-calendario", "Calendário", "emprestimos"),
        ],
      },
    ],
  },
  {
    titulo: "Financeiro",
    entradas: [
      {
        id: "pagamentos",
        titulo: "Pagamentos",
        filhos: [
          folha("pag-registar", "Registar pagamento", "pagamentos"),
          folha("pag-historico", "Histórico de pagamentos", "pagamentos"),
        ],
      },
      {
        id: "garantias",
        titulo: "Garantias",
        filhos: [
          folha("gar-lista", "Lista de garantias", "garantias"),
          folha("gar-penhoradas", "Garantias penhoradas", "garantias"),
          folha("gar-execucao", "Execução de garantias", "garantias"),
          folha("gar-alertas", "Alertas de garantias", "garantias"),
        ],
      },
      {
        id: "cobrancas",
        titulo: "Cobranças",
        filhos: [
          folha("cob-agenda", "Agenda de cobranças", "cobrancas"),
          folha("cob-historico", "Histórico de cobranças", "cobrancas"),
          folha("cob-rota", "Rota de cobrança", "cobrancas"),
          folha("cob-zonas", "Zonas e territórios", "cobrancas"),
          folha("cob-cobradores", "Cobradores", "cobrancas"),
        ],
      },
      {
        id: "carteiras",
        titulo: "Carteiras",
        filhos: [
          folha("car-gestao", "Gestão de carteiras", "carteiras"),
          folha("car-movimentos", "Movimentos e transferências", "carteiras"),
          folha("car-despesas", "Despesas", "carteiras"),
        ],
      },
    ],
  },
  {
    titulo: "Gestão",
    entradas: [
      {
        id: "configuracoes",
        titulo: "Configurações",
        filhos: [
          folha("cfg-utilizadores", "Utilizadores", "config"),
          folha("cfg-identidade", "Identidade da empresa", "config"),
          folha("cfg-backup", "Backup e segurança", "config"),
        ],
      },
    ],
  },
];

export const FATIAS = [];

export const MOVIMENTOS = [];

export const itensDoMenu = () =>
  MENU.flatMap((grupo) =>
    grupo.entradas.flatMap((entrada) => (entrada.filhos ? entrada.filhos : [entrada]))
  );
