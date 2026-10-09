import api from "./api";
import { lerItem } from "./armazenamento";
import { aplicarServidor, esvaziarDados, marcarAvisoApi } from "../dados/operacao";

const lista = (colecoes, chave) => (Array.isArray(colecoes?.[chave]) ? colecoes[chave] : []);
const texto = (valor) => String(valor ?? "").trim();
const numero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};
const dia = (valor) => texto(valor).slice(0, 10);

const parGps = (valor) => {
  if (valor && typeof valor === "object") {
    const lat = Number(valor.lat ?? valor.latitude);
    const lon = Number(valor.lon ?? valor.lng ?? valor.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  const partes = texto(valor).split(",").map((parte) => Number(parte.trim()));
  if (partes.length >= 2 && partes.every(Number.isFinite)) return { lat: partes[0], lon: partes[1] };
  return { lat: 0, lon: 0 };
};

const logoDe = (carteira) => {
  const fonte = `${carteira?.logo || ""} ${carteira?.logo_ficheiro || ""} ${carteira?.nome || ""} ${carteira?.tipo || ""}`.toLowerCase();
  const pares = [
    ["bci", "bci"], ["millennium", "bim"], ["bim", "bim"], ["standard", "standard"],
    ["letshego", "letshego"], ["moza", "moza"], ["mkesh", "mkesh"], ["m-kesh", "mkesh"],
    ["mpesa", "mpesa"], ["m-pesa", "mpesa"], ["emola", "emola"], ["e-mola", "emola"],
  ];
  return pares.find(([marca]) => fonte.includes(marca))?.[1] || "";
};

const estadoEmprestimo = (status) => {
  const s = texto(status);
  if (/atras/i.test(s)) return "Em atraso";
  if (/quit|liquid/i.test(s)) return "Quitado";
  if (/pend|an[aá]l/i.test(s)) return "Pendente";
  if (/ativ|activ|desembols|aprov/i.test(s)) return "Activo";
  return s || "Activo";
};

const estadoPessoa = (status) => {
  const s = texto(status);
  if (/inativ|inactiv/i.test(s)) return "Inactivo";
  if (/ativ|activ/i.test(s)) return "Activo";
  return s || "Activo";
};

const estadoParcela = (status, data) => {
  const s = texto(status);
  if (/pago/i.test(s) && !/parcial/i.test(s)) return "Pago";
  if (/atras/i.test(s)) return "Atrasado";
  if (/cancel/i.test(s)) return "Cancelado";
  if (data && data < new Date().toISOString().slice(0, 10) && !/pago/i.test(s)) return "Atrasado";
  return s || "Pendente";
};

const mapear = (colecoes, utilizadoresApi) => {
  const clientes = lista(colecoes, "microcredito-clientes-v1").map((c) => ({
    ...c,
    id: String(c.id),
    nome_completo: c.nome_completo || c.nome || "Cliente",
    telefone_principal: c.telefone_principal || c.telefone || "",
    coordenadas_gps: c.coordenadas_gps || (c.coordenadas ? `${parGps(c.coordenadas).lat}, ${parGps(c.coordenadas).lon}` : ""),
    cliente_ativo: c.cliente_ativo !== false && !/inativ|inactiv/i.test(c.status || ""),
    limite_credito: numero(c.limite_credito),
    score: numero(c.score),
  }));
  const porCliente = new Map(clientes.map((c) => [String(c.id), c]));

  const carteirasBrutas = lista(colecoes, "microcredito-carteiras-v2");
  const carteiras = carteirasBrutas.map((c) => ({
    id: String(c.id),
    tipo: c.tipo || "",
    nome: c.nome || "Carteira",
    logo: logoDe(c),
    codigo: c.codigo || "",
    moeda: c.moeda || "MZN",
    saldo: numero(c.saldo),
    estado: c.status || c.estado || "Activa",
  }));
  const nomeCarteira = (id) => carteiras.find((c) => c.id === String(id))?.nome || carteirasBrutas.find((c) => String(c.id) === String(id))?.nome || "";

  const emprestimos = lista(colecoes, "microcredito-emprestimos-v1").map((e) => {
    const cliente = porCliente.get(String(e.client_id));
    const parcelas = Array.isArray(e.parcelas) ? e.parcelas : Array.isArray(e.cronograma) ? e.cronograma : [];
    const plano = parcelas.map((p, indice) => ({
      id: String(p.id || `${e.id}-${p.num_parcela || indice + 1}`),
      numero: p.num_parcela || indice + 1,
      data_vencimento: dia(p.data_vencimento),
      valor_parcela: numero(p.valor_parcela || e.valor_parcela),
      status: estadoParcela(p.status, dia(p.data_vencimento)),
    }));
    const pagas = plano.filter((p) => p.status === "Pago").length;
    const emAtraso = plano.some((p) => p.status === "Atrasado");
    return {
      id: String(e.id),
      contrato: e.numero_contrato || e.contrato || "",
      clienteId: String(e.client_id || ""),
      cliente: cliente?.nome_completo || e.cliente_nome || "Cliente",
      valor: numero(e.valor_emprestado || e.valor),
      prestacao: numero(e.valor_parcela || plano[0]?.valor_parcela),
      taxa: numero(e.taxa_juros),
      parcelas: numero(e.num_parcelas) || plano.length,
      pagas,
      modalidade: e.modalidade || "",
      tipo_juros: e.tipo_juros || "",
      sistema: e.sistema_amortizacao || "",
      inicio: dia(e.data_desembolso || e.data_inicio || e.data_registo),
      garantia: e.tipo_garantia || "",
      estado: emAtraso && !/quit|liquid/i.test(e.status || "") ? "Em atraso" : estadoEmprestimo(e.status),
      carteira: nomeCarteira(e.carteira_id) || e.carteira_nome || "",
      plano,
      saldo: numero(e.saldo_devedor ?? e.saldo),
      vencimento: dia(e.data_vencimento) || plano[plano.length - 1]?.data_vencimento || "",
    };
  });
  const porEmprestimo = new Map(emprestimos.map((e) => [e.id, e]));

  const pagamentos = lista(colecoes, "microcredito-pagamentos-v1").map((p) => {
    const emp = porEmprestimo.get(String(p.loan_id));
    const cliente = porCliente.get(String(p.client_id || emp?.clienteId));
    return {
      id: String(p.id),
      recibo: p.numero_recibo || p.recibo || "",
      contrato: emp?.contrato || p.contrato || "",
      cliente: cliente?.nome_completo || emp?.cliente || "Cliente",
      valor: numero(p.valor_pago || p.valor),
      juros: numero(p.valor_juros_pago),
      capital: numero(p.valor_principal_pago),
      data: dia(p.data_pagamento || p.data_registo),
      hora: texto(p.hora_pagamento).slice(0, 5),
      forma: p.forma_pagamento || p.forma || "",
      tipo: p.tipo_pagamento || p.tipo || "",
      referencia: p.referencia_transacao || "",
      carteira: nomeCarteira(p.carteira_id) || p.carteira || "",
      estado: p.status || p.estado || "Confirmado",
      parcela: p.num_parcela ? `${p.num_parcela}/${p.total_parcelas || emp?.parcelas || ""}` : "",
      emprestimoId: String(p.loan_id || ""),
    };
  });

  const garantias = lista(colecoes, "microcredito-garantias-v1").map((g) => {
    const emp = porEmprestimo.get(String(g.loan_id));
    const cliente = porCliente.get(String(g.client_id || emp?.clienteId));
    const valor = numero(g.valor_avaliado || g.valor_estimado);
    const base = numero(emp?.valor);
    return {
      id: String(g.id),
      codigo: g.codigo_garantia || g.codigo || "",
      contrato: emp?.contrato || "",
      cliente: cliente?.nome_completo || emp?.cliente || "Cliente",
      tipo: g.tipo || "",
      subtipo: g.subtipo || g.descricao_bem || "",
      descricao: g.descricao || g.observacoes || "",
      valor,
      estado: g.status || g.estado || "Em Avaliação",
      data: dia(g.data_registo),
      local: g.localizacao || g.endereco || "",
      conservacao: g.estado_conservacao || "",
      diasAtraso: 0,
      cobertura: base > 0 ? Math.round((valor / base) * 100) : 0,
      notificacao: g.ultima_notificacao || "",
      docsEmFalta: g.documentos_em_falta || "",
      dataPenhor: dia(g.data_penhor),
      dataExecucao: dia(g.data_execucao),
      motivo: g.motivo || "",
      valorRecuperado: numero(g.valor_recuperado),
    };
  });

  const zonasBrutas = lista(colecoes, "microcredito-zonas-v1");
  const cobradoresBrutos = lista(colecoes, "microcredito-cobradores-v1");
  const nomeZona = (id) => zonasBrutas.find((z) => String(z.id) === String(id))?.nome || "";
  const nomeCobrador = (id) => cobradoresBrutos.find((c) => String(c.id) === String(id))?.nome_completo || "";

  const itens = lista(colecoes, "microcredito-agendas-itens-v1");
  const rotas = lista(colecoes, "microcredito-agendas-rotas-v1");
  const agendas = lista(colecoes, "microcredito-agendas-cobranca-v1").map((a) => {
    const daAgenda = itens.filter((item) => String(item.schedule_id) === String(a.id));
    const rotasAgenda = rotas.filter((item) => String(item.schedule_id) === String(a.id));
    const grupos = new Map();
    daAgenda.forEach((item) => {
      const chave = String(item.client_id);
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(item);
    });
    const paragens = [...grupos.entries()].map(([clientId, grupo], indice) => {
      const rota = rotasAgenda.find((item) => String(item.client_id) === clientId) || {};
      const cliente = porCliente.get(clientId);
      const gps = parGps(rota.coordenadas || cliente?.coordenadas_gps);
      const primeiro = grupo[0] || {};
      return {
        id: String(rota.id || primeiro.id || `${a.id}-${indice}`),
        ordem: rota.ordem_visita || indice + 1,
        cliente: cliente?.nome_completo || "Cliente",
        telefone: cliente?.telefone_principal || "",
        endereco: cliente?.endereco_completo || "",
        lat: gps.lat,
        lon: gps.lon,
        contrato: primeiro.contrato || porEmprestimo.get(String(primeiro.loan_id))?.contrato || "",
        emprestimoId: String(primeiro.loan_id || ""),
        parcela: primeiro.num_parcela ? `${primeiro.num_parcela}/${primeiro.total_parcelas || ""}` : "",
        parcelaId: String(primeiro.installment_id || ""),
        esperado: grupo.reduce((soma, item) => soma + numero(item.valor_esperado), 0),
        cobrado: grupo.reduce((soma, item) => soma + numero(item.valor_cobrado), 0),
        estado: primeiro.status || "Pendente",
        motivo: primeiro.motivo_nao_cobro || "",
        promessa: primeiro.promessa_pagamento || "",
      };
    }).sort((a1, b1) => a1.ordem - b1.ordem);
    return {
      id: String(a.id),
      codigo: a.codigo_agenda || a.codigo || "",
      data: dia(a.data_agendada),
      inicio: texto(a.hora_inicio).slice(0, 5),
      fim: texto(a.hora_fim).slice(0, 5),
      cobrador: nomeCobrador(a.collector_id),
      zona: nomeZona(a.zona_id),
      clientes: paragens.map((p) => p.cliente),
      estado: a.status || "Pendente",
      esperado: numero(a.total_esperado) || paragens.reduce((soma, p) => soma + p.esperado, 0),
      cobrado: numero(a.total_cobrado) || paragens.reduce((soma, p) => soma + p.cobrado, 0),
      paragens,
    };
  });

  const cobrancas = itens
    .filter((item) => item.status && item.status !== "Pendente")
    .map((item) => {
      const agenda = agendas.find((a) => a.id === String(item.schedule_id));
      const cliente = porCliente.get(String(item.client_id));
      return {
        id: String(item.id),
        data: dia(item.data_cobranca || item.data_atualizacao),
        cliente: cliente?.nome_completo || "Cliente",
        contrato: item.contrato || "",
        parcela: item.num_parcela ? `${item.num_parcela}/${item.total_parcelas || ""}` : "",
        cobrador: agenda?.cobrador || "",
        zona: agenda?.zona || "",
        esperado: numero(item.valor_esperado),
        cobrado: numero(item.valor_cobrado),
        estado: item.status,
      };
    });

  const zonas = zonasBrutas.map((z) => {
    const gps = parGps(z.coordenadas_centro || z.coordenadas);
    const clientesZona = clientes.filter((c) => String(c.zona_id) === String(z.id) || c.zona_id === z.nome);
    return {
      id: String(z.id),
      nome: z.nome || "Zona",
      codigo: z.codigo || "",
      provincia: z.provincia || "",
      distrito: z.distrito || "",
      bairro: z.bairro || "",
      responsavel: z.responsavel || nomeCobrador(cobradoresBrutos.find((c) => String(c.zona_id) === String(z.id))?.id),
      raio: String(z.raio_km ?? z.raio ?? ""),
      estado: z.status || "Ativa",
      lat: gps.lat,
      lon: gps.lon,
      clientes: clientesZona.length,
      atraso: 0,
    };
  });

  const cobradores = cobradoresBrutos.map((c) => ({
    id: String(c.id),
    nome: c.nome_completo || c.nome || "Cobrador",
    telefone: c.telefone_principal || "",
    documento: c.documento || "",
    zona: nomeZona(c.zona_id),
    comissao: numero(c.comissao_percentual),
    estado: estadoPessoa(c.status),
    cobradoMes: numero(c.cobrado_mes || c.total_cobrado),
  }));

  const movimentos = lista(colecoes, "microcredito-transferencias-v1").map((t) => ({
    id: String(t.id),
    tipo: "Transferência",
    origem: nomeCarteira(t.wallet_origem_id),
    destino: nomeCarteira(t.wallet_destino_id),
    valor: numero(t.valor),
    data: dia(t.data_transferencia || t.data || t.data_registo),
  }));

  const despesas = lista(colecoes, "microcredito-despesas-v1").map((d) => ({
    id: String(d.id),
    codigo: d.codigo_despesa || d.codigo || "",
    carteira: nomeCarteira(d.wallet_id || d.carteira_id),
    categoria: d.categoria || "",
    valor: numero(d.valor),
    data: dia(d.data_despesa || d.data_registo),
    descricao: d.descricao || "",
    estado: d.status || "Paga",
  }));

  const config = colecoes["microcredito-config-v1"] && typeof colecoes["microcredito-config-v1"] === "object"
    ? colecoes["microcredito-config-v1"]
    : {};
  const marca = colecoes["microcredito-marca-v1"] && typeof colecoes["microcredito-marca-v1"] === "object"
    ? colecoes["microcredito-marca-v1"]
    : {};
  const empresa = {
    nome_sistema: marca.nome || config.nome_empresa || "",
    nome_empresa: config.nome_empresa || marca.nome || "",
    endereco_empresa: config.endereco_empresa || "",
    telefone_empresa: config.telefone_empresa || "",
    email_empresa: config.email_empresa || "",
    nuit_empresa: config.nuit_empresa || "",
    moeda_padrao: config.moeda_padrao || "",
    idioma_padrao: config.idioma_padrao === "pt" ? "Português" : (config.idioma_padrao || ""),
    fuso_horario: config.fuso_horario || "",
    formato_data: config.formato_data || "",
    logo: marca.logo || null,
  };

  const daEquipa = lista(colecoes, "microcredito-utilizadores-v1").map((u) => ({
    id: String(u.id),
    nome: u.nome_completo || u.nome || "",
    email: u.email || "",
    telefone: u.telefone || "",
    perfil: u.perfil || "",
    estado: u.status || "Ativo",
    zona: nomeZona(u.zona_id),
  }));
  const utilizadores = (Array.isArray(utilizadoresApi) && utilizadoresApi.length ? utilizadoresApi : daEquipa).map((u) => ({
    id: String(u.id),
    nome: u.nome_completo || u.nome || "",
    email: u.email || "",
    telefone: u.telefone || "",
    perfil: u.perfil || "",
    estado: u.status || u.estado || "Ativo",
    zona: u.zona || nomeZona(u.zona_id),
  }));

  const auditoria = lista(colecoes, "microcredito-auditoria-v1").slice(0, 30).map((linha) => ({
    id: String(linha.id),
    accao: linha.accao || "Registo",
    modulo: linha.modulo || "",
    por: linha.por || "",
  }));

  const avisos = lista(colecoes, "microcredito-notificacoes-cobranca-v1").slice(0, 12).map((n) => ({
    id: String(n.id),
    titulo: n.tipo_notificacao || n.canal || "Aviso",
    texto: n.mensagem || n.observacoes || "",
    tipo: /pag/i.test(n.tipo_notificacao || "") ? "pagamento" : "cobranca",
    lida: /lida|enviada/i.test(n.status || ""),
  }));

  return {
    clientes, emprestimos, pagamentos, garantias, carteiras, movimentos, despesas,
    agendas, cobrancas, cobradores, zonas, utilizadores, empresa, auditoria, avisos,
  };
};

export const carregarConsulta = async () => {
  const token = await lerItem("token");
  if (!token) {
    esvaziarDados();
    return { origem: "servidor", avisos: [] };
  }
  try {
    const { data } = await api.get("/api/sincronizar");
    let utilizadoresApi = [];
    try {
      const resposta = await api.get("/api/utilizadores");
      utilizadoresApi = Array.isArray(resposta.data) ? resposta.data : [];
    } catch {
      utilizadoresApi = [];
    }
    const mapeado = mapear(data?.colecoes || {}, utilizadoresApi);
    const { avisos, ...resto } = mapeado;
    aplicarServidor(resto);
    return { origem: "servidor", avisos };
  } catch (erro) {
    const mensagem = erro.response?.status === 401
      ? "A sessão expirou. Entre novamente para ver os dados da empresa."
      : "Sem ligação à API. Confirme o endereço do servidor no telemóvel.";
    esvaziarDados();
    marcarAvisoApi(mensagem);
    return { origem: "erro", mensagem, avisos: [] };
  }
};
