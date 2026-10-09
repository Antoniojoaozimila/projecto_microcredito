import { personsImgs } from "../utils/images";

const modulo = (area, pagina) => `/microcredito/dashboard/modulo/${area}/${pagina}`;

export const navigationLinks = [
  { id: 'div-painel', type: 'divider', title: 'Painel' },
  { id: 'dashboard', title: 'Dashboard', icon: 'dashboard', path: '/microcredito/dashboard/home' },

  { id: 'div-credito', type: 'divider', title: 'Clientes e crédito' },
  {
    id: 'clientes',
    title: 'Clientes',
    icon: 'clientes',
    type: 'submenu',
    children: [
      { id: 'cli-lista', title: 'Listar Clientes', icon: 'lista', path: '/microcredito/dashboard/clientes' },
      { id: 'cli-novo', title: 'Novo cliente', icon: 'novo-cliente', path: '/microcredito/dashboard/clientes/novo' },
      { id: 'cli-mapa', title: 'Mapa de clientes', icon: 'mapa', path: '/microcredito/dashboard/clientes/mapa' },
    ],
  },
  {
    id: 'emprestimos',
    title: 'Empréstimos',
    icon: 'emprestimos',
    type: 'submenu',
    children: [
      { id: 'emp-novo', title: 'Novo Empréstimo', icon: 'novo-emprestimo', path: '/microcredito/dashboard/emprestimos/novo' },
      { id: 'emp-lista', title: 'Listar Empréstimos', icon: 'lista', path: '/microcredito/dashboard/emprestimos' },
      { id: 'emp-calendario', title: 'Calendário', icon: 'calendario', path: '/microcredito/dashboard/emprestimos/calendario' },
    ],
  },

  { id: 'div-financeiro', type: 'divider', title: 'Financeiro' },
  {
    id: 'pagamentos',
    title: 'Pagamentos',
    icon: 'pagamentos',
    type: 'submenu',
    children: [
      { id: 'pag-registar', title: 'Registar Pagamento', icon: 'registar', path: '/microcredito/dashboard/pagamentos/registar' },
      { id: 'pag-historico', title: 'Histórico de Pagamentos', icon: 'historico', path: '/microcredito/dashboard/pagamentos' },
    ],
  },
  {
    id: 'garantias',
    title: 'Garantias',
    icon: 'garantias',
    type: 'submenu',
    children: [
      { id: 'gar-nova', title: 'Nova Garantia', icon: 'nova-garantia', path: '/microcredito/dashboard/garantias/nova' },
      { id: 'gar-lista', title: 'Lista de Garantias', icon: 'lista', path: '/microcredito/dashboard/garantias' },
      { id: 'gar-penhoradas', title: 'Garantias penhoradas', icon: 'penhoradas', path: '/microcredito/dashboard/garantias/penhoradas' },
      { id: 'gar-execucao', title: 'Execução de garantias', icon: 'execucao', path: '/microcredito/dashboard/garantias/execucao' },
      { id: 'gar-alertas', title: 'Alertas de garantias', icon: 'alertas', path: '/microcredito/dashboard/garantias/alertas' },
    ],
  },
  {
    id: 'cobrancas',
    title: 'Cobranças',
    icon: 'cobrancas',
    type: 'submenu',
    children: [
      { id: 'cob-agenda', title: 'Agenda de cobranças', icon: 'agenda', path: modulo('cobrancas', 'agenda') },
      { id: 'cob-historico', title: 'Histórico de Cobranças', icon: 'historico', path: modulo('cobrancas', 'historico') },
      { id: 'cob-rota', title: 'Rota de cobrança', icon: 'rota', path: modulo('cobrancas', 'rota') },
      { id: 'cob-zonas', title: 'Zonas e territórios', icon: 'zonas', path: modulo('cobrancas', 'zonas') },
      { id: 'cob-cobradores', title: 'Cobradores', icon: 'cobradores', path: modulo('cobrancas', 'cobradores') },
    ],
  },
  {
    id: 'carteiras',
    title: 'Carteiras',
    icon: 'carteiras',
    type: 'submenu',
    children: [
      { id: 'car-gestao', title: 'Gestão de Carteiras', icon: 'gestao-carteiras', path: modulo('carteiras', 'gestao') },
      { id: 'car-movimentos', title: 'Movimentos e transferências', icon: 'movimentos', path: modulo('carteiras', 'movimentos') },
      { id: 'car-despesas', title: 'Despesas', icon: 'despesas', path: modulo('carteiras', 'despesas') },
    ],
  },

  { id: 'div-gestao', type: 'divider', title: 'Gestão' },
  {
    id: 'relatorios',
    title: 'Relatórios',
    icon: 'relatorios',
    type: 'submenu',
    children: [
      { id: 'rel-financeiro', title: 'Relatório financeiro', icon: 'rel-financeiro', path: '/microcredito/dashboard/relatorios' },
      { id: 'rel-inadimplencia', title: 'Relatório de inadimplência', icon: 'inadimplencia', path: modulo('relatorios', 'inadimplencia') },
      { id: 'rel-performance', title: 'Relatório de performance', icon: 'performance', path: modulo('relatorios', 'performance') },
      { id: 'rel-clientes', title: 'Relatório de clientes', icon: 'rel-clientes', path: modulo('relatorios', 'clientes') },
      { id: 'rel-carteiras', title: 'Relatório de carteiras', icon: 'rel-carteiras', path: modulo('relatorios', 'carteiras') },
      { id: 'rel-exportacao', title: 'Exportação', icon: 'exportacao', path: modulo('relatorios', 'exportacao') },
      { id: 'rel-modelo-bm', title: 'Modelo BM', icon: 'modelo-bm', path: modulo('relatorios', 'modelo-bm') },
    ],
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    icon: 'configuracoes',
    type: 'submenu',
    children: [
      { id: 'cfg-utilizadores', title: 'Utilizadores', icon: 'utilizadores', path: modulo('configuracoes', 'utilizadores') },
      { id: 'cfg-identidade', title: 'Identidade da empresa', icon: 'identidade', path: modulo('configuracoes', 'identidade') },
      { id: 'cfg-perfis', title: 'Perfis e permissões', icon: 'perfis', path: modulo('configuracoes', 'perfis') },
      { id: 'cfg-zonas', title: 'Zonas e territórios', icon: 'zonas', path: modulo('configuracoes', 'zonas') },
      { id: 'cfg-tipos', title: 'Tipos de garantia', icon: 'tipos-garantia', path: modulo('configuracoes', 'tipos-garantia') },
      { id: 'cfg-taxas', title: 'Taxas e juros', icon: 'taxas', path: modulo('configuracoes', 'taxas') },
      { id: 'cfg-notificacoes', title: 'Notificações', icon: 'notificacoes', path: modulo('configuracoes', 'notificacoes') },
      { id: 'cfg-backup', title: 'Backup e segurança', icon: 'backup', path: modulo('configuracoes', 'backup') },
      { id: 'cfg-integracoes', title: 'Integrações', icon: 'integracoes', path: modulo('configuracoes', 'integracoes') },
    ],
  },
];

export const flattenNavigationLinks = (links = navigationLinks) =>
  links.flatMap((link) => {
    if (link.type === 'divider' || link.type === 'logout') return [];
    return link.children?.length ? link.children : [link];
  });


export const transactions = [
    {
        id: 11, 
        name: "Sarah Parker",
        image: personsImgs.person_four,
        date: "23/12/04",
        amount: 22000
    },
    {
        id: 12, 
        name: "Krisitine Carter",
        image: personsImgs.person_three,
        date: "23/07/21",
        amount: 20000
    },
    {
        id: 13, 
        name: "Irene Doe",
        image: personsImgs.person_two,
        date: "23/08/25",
        amount: 30000
    }
];

export const reportData = [
    {
        id: 14,
        month: "Jan",
        value1: 45,
        value2: null
    },
    {
        id: 15,
        month: "Feb",
        value1: 45,
        value2: 60
    },
    {
        id: 16,
        month: "Mar",
        value1: 45,
        value2: null
    },
    {
        id: 17,
        month: "Apr",
        value1: 45,
        value2: null
    },
    {
        id: 18,
        month: "May",
        value1: 45,
        value2: null
    }
];

export const budget = [
    {
        id: 19, 
        title: "Subscriptions",
        type: "Automated",
        amount: 22000
    },
    {
        id: 20, 
        title: "Loan Payment",
        type: "Automated",
        amount: 16000
    },
    {
        id: 21, 
        title: "Foodstuff",
        type: "Automated",
        amount: 20000
    },
    {
        id: 22, 
        title: "Subscriptions",
        type: null,
        amount: 10000
    },
    {
        id: 23, 
        title: "Subscriptions",
        type: null,
        amount: 40000
    }
];

export const subscriptions = [
    {
        id: 24,
        title: "LinkedIn",
        due_date: "23/12/04",
        amount: 20000
    },
    {
        id: 25,
        title: "Netflix",
        due_date: "23/12/10",
        amount: 5000
    },
    {
        id: 26,
        title: "DSTV",
        due_date: "23/12/22",
        amount: 2000
    }
];

export const savings = [
    {
        id: 27,
        image: personsImgs.person_one,
        saving_amount: 250000,
        title: "Pay kid bro’s fees",
        date_taken: "23/12/22",
        amount_left: 40000
    }
]