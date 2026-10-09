import { listarClientes, obterCliente } from "./clientesMicrocredito";
import { eliminarAnexo } from "./anexosLocais";
import { CHAVES_LIGADAS, REGRAS, alterarEmprestimo, arredondar, formatarMT, listarEmprestimos, obterEmprestimo } from "./emprestimosMicrocredito";
import { resumoEmprestimo } from "./pagamentosMicrocredito";

const CHAVE_GARANTIAS = CHAVES_LIGADAS.garantias;
const CHAVE_AVALISTAS = CHAVES_LIGADAS.avalistas;
const CHAVE_MOVIMENTOS = CHAVES_LIGADAS.movimentosGarantia;

export const REGRAS_GARANTIA = {
  get obrigatoriaAcima() { return REGRAS.garantiaAcima; },
  coberturaMinima: 100,
  coberturaRecomendada: 120,
  get diasPenhor() { return REGRAS.diasPenhor; },
  get diasExecucao() { return REGRAS.diasExecucao; },
  get diasAvisoExecucao() { return Math.max(1, REGRAS.diasExecucao - 15); },
  validadeAvaliacaoMeses: 12,
  diasAvisoValidade: 30,
  diasAvaliacaoPendente: 7,
  maxFotos: 5,
  maxFicheiroMB: 10,
};

export const SEM_GARANTIA_G = "Sem Garantia";
export const AVAL = "Aval/Fiador";
export const BEM_MOVEL = "Bem Móvel";
export const BEM_IMOVEL = "Bem Imóvel";

export const TIPOS_GARANTIA = [
  { id: SEM_GARANTIA_G, label: "Sem Garantia", detalhe: "Crédito pessoal" },
  { id: AVAL, label: "Aval/Fiador", detalhe: "Um ou mais avalistas" },
  { id: BEM_MOVEL, label: "Bem Móvel", detalhe: "Carro, moto, joias..." },
  { id: BEM_IMOVEL, label: "Bem Imóvel", detalhe: "Casa, terreno" },
  { id: "Cheque Caução", label: "Cheque Caução", detalhe: "Cheque em garantia" },
  { id: "Depósito Caução", label: "Depósito Caução", detalhe: "Valor depositado" },
  { id: "Outro", label: "Outro", detalhe: "Outra garantia" },
];

export const SUBTIPOS = {
  [BEM_MOVEL]: ["Carro", "Moto", "Joias", "Equipamento"],
  [BEM_IMOVEL]: ["Casa", "Terreno"],
};

export const ESTADOS_CONSERVACAO = ["Novo", "Bom", "Razoável", "Mau"];
export const ESTADOS_GARANTIA = ["Em Avaliação", "Ativa", "Penhorada", "Libertada", "Executada", "Cancelada"];
export const DOCUMENTOS_AVALISTA = ["BI", "Passaporte", "NUIT"];
export const MEIOS_NOTIFICACAO = ["Carta registada", "Entrega em mão", "Email", "SMS", "Notificação judicial"];

const ESTADOS_EMPRESTIMO_VALIDOS = ["Pendente", "Ativo", "Em Atraso", "Vencido"];
const PERFIS_GESTOR = ["admin", "administrador", "gestor", "supervisor"];

export const eBem = (tipo) => tipo === BEM_MOVEL || tipo === BEM_IMOVEL;

const ler = (chave) => {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
};

const gravar = (chave, lista) => {
  try {
    localStorage.setItem(chave, JSON.stringify(lista));
  } catch (erro) {
    if (erro?.name === "QuotaExceededError") throw new Error("O armazenamento do navegador está cheio. Não foi possível gravar a garantia.");
    throw erro;
  }
};

export const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const diasDesde = (data) => Math.floor((Date.now() - new Date(data).getTime()) / 86400000);

export const valorGarantia = (g) => Number(g?.valor_avaliado || 0) || Number(g?.valor_estimado || 0);

export const coberturaGarantia = (g, emprestimo) =>
  emprestimo?.valor_emprestado ? (valorGarantia(g) / Number(emprestimo.valor_emprestado)) * 100 : 0;

export const diasAtrasoEmprestimo = (emprestimo) =>
  Math.max(0, ...(emprestimo?.parcelas || []).filter((p) => p.status !== "Pago" && p.status !== "Cancelado").map((p) => Number(p.dias_atraso || 0)));

export const validadeAvaliacao = (g) => {
  if (!g?.data_avaliacao) return null;
  const d = new Date(`${g.data_avaliacao}T00:00:00`);
  d.setMonth(d.getMonth() + REGRAS_GARANTIA.validadeAvaliacaoMeses);
  return d;
};

export const classeEstadoGarantia = (estado) =>
  ({
    "Em Avaliação": "is-pendente",
    Ativa: "is-activo",
    Penhorada: "is-atraso",
    Libertada: "is-quitado",
    Executada: "is-executada",
    Cancelada: "is-cancelado",
  })[estado] || "";

const registarMovimento = (garantia, anterior, novo, motivo, utilizador) => {
  gravar(CHAVE_MOVIMENTOS, [
    ...ler(CHAVE_MOVIMENTOS),
    {
      id: crypto.randomUUID(),
      guarantee_id: garantia.id,
      status_anterior: anterior,
      status_novo: novo,
      motivo: motivo || "",
      utilizador: utilizador?.nome || "Sistema",
      data_movimento: new Date().toISOString(),
    },
  ]);
};

export const sincronizarGarantias = () => {
  const lista = ler(CHAVE_GARANTIAS);
  if (!lista.length) return lista;
  const emprestimos = Object.fromEntries(listarEmprestimos().map((e) => [String(e.id), e]));
  let mudou = false;
  const agora = new Date().toISOString();
  const nova = lista.map((g) => {
    const e = emprestimos[String(g.loan_id)];
    if (!e) return g;
    if ((g.status === "Ativa" || g.status === "Penhorada") && e.status === "Quitado") {
      mudou = true;
      registarMovimento(g, g.status, "Libertada", "Libertação automática: empréstimo quitado", null);
      return { ...g, status: "Libertada", data_libertacao: hojeIso(), data_atualizacao: agora };
    }
    if (g.status === "Em Avaliação" && (e.status === "Cancelado" || e.status === "Rejeitado")) {
      mudou = true;
      registarMovimento(g, g.status, "Cancelada", `Cancelamento automático: empréstimo ${e.status.toLowerCase()}`, null);
      return { ...g, status: "Cancelada", data_atualizacao: agora };
    }
    return g;
  });
  if (mudou) gravar(CHAVE_GARANTIAS, nova);
  return nova;
};

export const listarGarantias = () =>
  sincronizarGarantias().sort((a, b) => String(b.data_registo).localeCompare(String(a.data_registo)));

export const obterGarantia = (id) => listarGarantias().find((g) => String(g.id) === String(id)) || null;

export const avalistasDaGarantia = (id) => ler(CHAVE_AVALISTAS).filter((a) => String(a.guarantee_id) === String(id));

export const movimentosDaGarantia = (id) =>
  ler(CHAVE_MOVIMENTOS).filter((m) => String(m.guarantee_id) === String(id)).sort((a, b) => String(b.data_movimento).localeCompare(String(a.data_movimento)));

export const garantiasDoEmprestimo = (loanId) => listarGarantias().filter((g) => String(g.loan_id) === String(loanId));

export const garantiasDetalhadas = () => {
  const clientes = Object.fromEntries(listarClientes().map((c) => [String(c.id), c]));
  const emprestimos = Object.fromEntries(listarEmprestimos().map((e) => [String(e.id), e]));
  const avalistas = ler(CHAVE_AVALISTAS);
  return listarGarantias().map((g) => {
    const emprestimo = emprestimos[String(g.loan_id)] || null;
    return {
      ...g,
      emprestimo,
      cliente: clientes[String(g.client_id)] || null,
      avalistas: avalistas.filter((a) => String(a.guarantee_id) === String(g.id)),
      valor: valorGarantia(g),
      cobertura: coberturaGarantia(g, emprestimo),
      dias_atraso: diasAtrasoEmprestimo(emprestimo),
    };
  });
};

export const emprestimosParaGarantia = () => {
  const clientes = Object.fromEntries(listarClientes().map((c) => [String(c.id), c]));
  return listarEmprestimos()
    .filter((e) => ESTADOS_EMPRESTIMO_VALIDOS.includes(e.status))
    .map((e) => ({ ...e, cliente: clientes[String(e.client_id)] || null, resumo: resumoEmprestimo(e) }));
};

const telefoneOk = (valor) => /^(\+258)?8[2-7]\d{7}$/.test(String(valor || "").replace(/\s/g, ""));
const emailOk = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || ""));

const documentoOk = (tipo, numero) => {
  const n = String(numero || "").trim();
  if (tipo === "BI") return /^\d{9}[A-Za-z]$|^\d{12}[A-Za-z]$/.test(n);
  if (tipo === "NUIT") return /^\d{9}$/.test(n);
  return /^[A-Za-z0-9]{6,15}$/.test(n);
};

export const documentosEmFalta = (dados, avalistas = dados.avalistas || []) => {
  const falta = [];
  const docs = dados.documentos_anexos || {};
  if (dados.tipo_garantia === BEM_IMOVEL && !docs.titulo?.length) falta.push("Título de propriedade");
  if (dados.tipo_garantia === BEM_MOVEL && !docs.factura?.length) falta.push("Factura/Recibo");
  if (eBem(dados.tipo_garantia) && !(dados.fotos_garantia || []).length) falta.push("Fotos da garantia");
  if (dados.tipo_garantia === AVAL && avalistas.some((a) => !(a.documentos_anexos || []).length)) falta.push("Documentos do avalista");
  return falta;
};

export const validarGarantia = (dados) => {
  const erros = {};
  const emprestimo = obterEmprestimo(dados.loan_id);
  if (!emprestimo) erros.loan_id = "Seleccione o empréstimo.";
  else if (!ESTADOS_EMPRESTIMO_VALIDOS.includes(emprestimo.status)) erros.loan_id = `Não é possível associar garantias a um empréstimo «${emprestimo.status}».`;
  const tipo = dados.tipo_garantia;
  if (!TIPOS_GARANTIA.some((t) => t.id === tipo)) erros.tipo_garantia = "Seleccione o tipo de garantia.";
  if (eBem(tipo) && !SUBTIPOS[tipo].includes(dados.subtipo_garantia)) erros.subtipo_garantia = "Seleccione o subtipo.";
  if (String(dados.descricao || "").trim().length < 10) erros.descricao = "Descreva a garantia (mínimo 10 caracteres).";
  if (eBem(tipo)) {
    if (!ESTADOS_CONSERVACAO.includes(dados.estado_conservacao)) erros.estado_conservacao = "Obrigatório para bens.";
    if (String(dados.localizacao_garantia || "").trim().length < 3) erros.localizacao_garantia = "Indique onde o bem está localizado.";
  }
  const estimado = Number(dados.valor_estimado);
  if (tipo !== SEM_GARANTIA_G && (!Number.isFinite(estimado) || estimado <= 0)) erros.valor_estimado = "Indique o valor estimado.";
  if (dados.valor_avaliado !== "" && dados.valor_avaliado != null && !(Number(dados.valor_avaliado) >= 0)) erros.valor_avaliado = "Valor inválido.";
  if (dados.data_avaliacao && dados.data_avaliacao > hojeIso()) erros.data_avaliacao = "A data não pode ser futura.";
  if (String(dados.avaliador || "").length > 100) erros.avaliador = "Máximo de 100 caracteres.";
  if (tipo === AVAL) {
    const avalistas = dados.avalistas || [];
    if (!avalistas.length) erros.avalistas = "Adicione pelo menos um avalista.";
    avalistas.forEach((a, i) => {
      const k = (campo) => `avalistas.${i}.${campo}`;
      if (String(a.nome_completo || "").trim().split(/\s+/).length < 2) erros[k("nome_completo")] = "Indique o nome completo.";
      if (!DOCUMENTOS_AVALISTA.includes(a.documento_tipo)) erros[k("documento_tipo")] = "Seleccione o documento.";
      else if (!documentoOk(a.documento_tipo, a.documento_numero)) {
        erros[k("documento_numero")] = a.documento_tipo === "BI" ? "Formato: 000000000A ou 000000000000A." : a.documento_tipo === "NUIT" ? "O NUIT tem 9 dígitos." : "Número de passaporte inválido.";
      }
      if (!telefoneOk(a.telefone_principal)) erros[k("telefone_principal")] = "Formato: 84xxxxxxx.";
      if (a.telefone_alternativo && !telefoneOk(a.telefone_alternativo)) erros[k("telefone_alternativo")] = "Formato: 82xxxxxxx.";
      if (a.email && !emailOk(a.email)) erros[k("email")] = "Email inválido.";
      if (String(a.endereco_completo || "").trim().length < 5) erros[k("endereco_completo")] = "Indique o endereço completo.";
      if (a.rendimento_mensal !== "" && a.rendimento_mensal != null && !(Number(a.rendimento_mensal) >= 0)) erros[k("rendimento_mensal")] = "Valor inválido.";
    });
  }
  if ((dados.fotos_garantia || []).length > REGRAS_GARANTIA.maxFotos) erros.fotos_garantia = `Máximo de ${REGRAS_GARANTIA.maxFotos} fotos.`;
  const falta = documentosEmFalta(dados);
  if (falta.length) erros.documentos = `Em falta: ${falta.join(", ")}.`;
  if (String(dados.observacoes || "").length > 5000) erros.observacoes = "Máximo de 5000 caracteres.";
  return erros;
};

const proximoCodigo = (lista) => {
  const prefixo = `GAR-${new Date().getFullYear()}-`;
  const maior = lista
    .map((g) => String(g.codigo_garantia || ""))
    .filter((c) => c.startsWith(prefixo))
    .reduce((m, c) => Math.max(m, Number(c.slice(prefixo.length)) || 0), 0);
  return `${prefixo}${String(maior + 1).padStart(6, "0")}`;
};

const numeroOuNulo = (valor) => (valor === "" || valor == null ? null : arredondar(Number(valor)));

export const criarGarantia = (dados, utilizador) => {
  const erros = validarGarantia(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  const emprestimo = obterEmprestimo(dados.loan_id);
  const lista = ler(CHAVE_GARANTIAS);
  const agora = new Date().toISOString();
  const id = crypto.randomUUID();
  const tipo = dados.tipo_garantia;
  const garantia = {
    id,
    codigo_garantia: proximoCodigo(lista),
    loan_id: emprestimo.id,
    client_id: emprestimo.client_id,
    tipo_garantia: tipo,
    subtipo_garantia: eBem(tipo) ? dados.subtipo_garantia : null,
    descricao: dados.descricao.trim(),
    valor_estimado: numeroOuNulo(dados.valor_estimado) || 0,
    valor_avaliado: numeroOuNulo(dados.valor_avaliado),
    moeda: "MZN",
    data_avaliacao: dados.data_avaliacao || null,
    avaliador: String(dados.avaliador || "").trim() || null,
    estado_conservacao: eBem(tipo) ? dados.estado_conservacao : null,
    localizacao_garantia: eBem(tipo) ? dados.localizacao_garantia.trim() : String(dados.localizacao_garantia || "").trim() || null,
    documentos_anexos: dados.documentos_anexos || {},
    fotos_garantia: dados.fotos_garantia || [],
    status: "Em Avaliação",
    data_registo: agora,
    data_penhor: null,
    data_libertacao: null,
    data_execucao: null,
    motivo_execucao: null,
    notificacao: null,
    observacoes: String(dados.observacoes || "").trim(),
    registado_por: utilizador?.nome || "Sistema",
    data_atualizacao: agora,
  };
  gravar(CHAVE_GARANTIAS, [...lista, garantia]);
  if (tipo === AVAL) {
    gravar(CHAVE_AVALISTAS, [
      ...ler(CHAVE_AVALISTAS),
      ...(dados.avalistas || []).map((a) => ({
        id: crypto.randomUUID(),
        guarantee_id: id,
        nome_completo: a.nome_completo.trim(),
        documento_tipo: a.documento_tipo,
        documento_numero: a.documento_numero.trim().toUpperCase(),
        telefone_principal: a.telefone_principal.replace(/\s/g, ""),
        telefone_alternativo: String(a.telefone_alternativo || "").replace(/\s/g, "") || null,
        email: String(a.email || "").trim() || null,
        endereco_completo: a.endereco_completo.trim(),
        profissao: String(a.profissao || "").trim() || null,
        rendimento_mensal: numeroOuNulo(a.rendimento_mensal),
        relacao_com_cliente: String(a.relacao_com_cliente || "").trim() || null,
        documentos_anexos: a.documentos_anexos || [],
        status: "Ativo",
        data_registo: agora,
      })),
    ]);
  }
  registarMovimento(garantia, "Nova", "Em Avaliação", "Garantia registada", utilizador);
  alterarEmprestimo(emprestimo.id, (e) => ({
    ...e,
    historico: [...(e.historico || []), { data: agora, accao: `Garantia ${garantia.codigo_garantia} registada (${tipo})`, por: garantia.registado_por }],
  }));
  return garantia;
};

const mudarEstado = (id, validar, mudanca, motivo, utilizador) => {
  const lista = ler(CHAVE_GARANTIAS);
  const garantia = lista.find((g) => String(g.id) === String(id));
  if (!garantia) throw new Error("Garantia não encontrada.");
  const emprestimo = obterEmprestimo(garantia.loan_id);
  validar(garantia, emprestimo);
  const agora = new Date().toISOString();
  const actualizada = { ...garantia, ...mudanca(garantia, emprestimo), data_atualizacao: agora };
  gravar(CHAVE_GARANTIAS, lista.map((g) => (g.id === garantia.id ? actualizada : g)));
  if (actualizada.status !== garantia.status) {
    registarMovimento(garantia, garantia.status, actualizada.status, motivo, utilizador);
    if (emprestimo) {
      alterarEmprestimo(emprestimo.id, (e) => ({
        ...e,
        historico: [...(e.historico || []), { data: agora, accao: `Garantia ${garantia.codigo_garantia}: ${garantia.status} → ${actualizada.status}${motivo ? ` (${motivo})` : ""}`, por: utilizador?.nome || "Sistema" }],
      }));
    }
  }
  return actualizada;
};

const exigirMotivo = (motivo, minimo = 5) => {
  if (String(motivo || "").trim().length < minimo) throw new Error(`Indique o motivo (mínimo ${minimo} caracteres).`);
};

export const podeAprovar = (utilizador) => PERFIS_GESTOR.includes(String(utilizador?.tipo || "").toLowerCase());

export const bloqueiosAprovacao = (garantia) => {
  const bloqueios = [];
  if (eBem(garantia.tipo_garantia) && (!garantia.valor_avaliado || !garantia.data_avaliacao || !garantia.avaliador)) {
    bloqueios.push("Bens móveis e imóveis exigem avaliação formal (valor avaliado, data e avaliador).");
  }
  const falta = documentosEmFalta(garantia, avalistasDaGarantia(garantia.id));
  if (falta.length) bloqueios.push(`Documentação incompleta: ${falta.join(", ")}.`);
  return bloqueios;
};

export const registarAvaliacao = (id, { valor_avaliado, data_avaliacao, avaliador }, utilizador) =>
  mudarEstado(
    id,
    (g) => {
      if (!["Em Avaliação", "Ativa", "Penhorada"].includes(g.status)) throw new Error("Esta garantia já não pode ser avaliada.");
      if (!(Number(valor_avaliado) > 0)) throw new Error("Indique o valor avaliado.");
      if (!data_avaliacao || data_avaliacao > hojeIso()) throw new Error("Indique uma data de avaliação válida.");
      if (String(avaliador || "").trim().length < 3) throw new Error("Indique o nome do avaliador.");
    },
    () => ({ valor_avaliado: arredondar(Number(valor_avaliado)), data_avaliacao, avaliador: avaliador.trim(), avaliado_por: utilizador?.nome || "Sistema" }),
    "",
    utilizador
  );

export const aprovarGarantia = (id, utilizador) =>
  mudarEstado(
    id,
    (g, e) => {
      if (g.status !== "Em Avaliação") throw new Error("Só garantias em avaliação podem ser aprovadas.");
      if (!podeAprovar(utilizador)) throw new Error("Apenas um gestor ou administrador pode aprovar garantias.");
      if (!e || !ESTADOS_EMPRESTIMO_VALIDOS.includes(e.status)) throw new Error("O empréstimo associado já não está activo.");
      const bloqueios = bloqueiosAprovacao(g);
      if (bloqueios.length) throw new Error(bloqueios[0]);
    },
    () => ({ status: "Ativa", aprovado_por: utilizador?.nome || "Sistema", data_aprovacao: new Date().toISOString() }),
    "Garantia aprovada e associada ao empréstimo",
    utilizador
  );

export const cancelarGarantia = (id, motivo, utilizador) =>
  mudarEstado(
    id,
    (g) => {
      if (!["Em Avaliação", "Ativa"].includes(g.status)) throw new Error("Só garantias em avaliação ou activas podem ser canceladas.");
      exigirMotivo(motivo);
    },
    () => ({ status: "Cancelada" }),
    String(motivo || "").trim(),
    utilizador
  );

export const podePenhorar = (g, e) =>
  g.status === "Ativa" && e?.data_desembolso && ["Em Atraso", "Vencido"].includes(e.status) && diasAtrasoEmprestimo(e) >= REGRAS_GARANTIA.diasPenhor;

export const penhorarGarantia = (id, motivo, utilizador) =>
  mudarEstado(
    id,
    (g, e) => {
      if (g.status !== "Ativa") throw new Error("Só garantias activas podem ser penhoradas.");
      if (!e?.data_desembolso) throw new Error("A garantia só pode ser penhorada após o desembolso do empréstimo.");
      if (!["Em Atraso", "Vencido"].includes(e.status)) throw new Error("O empréstimo não está em atraso.");
      if (diasAtrasoEmprestimo(e) < REGRAS_GARANTIA.diasPenhor) throw new Error(`O penhor exige ${REGRAS_GARANTIA.diasPenhor} dias de atraso.`);
      exigirMotivo(motivo);
    },
    () => ({ status: "Penhorada", data_penhor: hojeIso() }),
    String(motivo || "").trim(),
    utilizador
  );

export const notificarCliente = (id, { meio, observacao }, utilizador) =>
  mudarEstado(
    id,
    (g) => {
      if (g.status !== "Penhorada") throw new Error("Só garantias penhoradas recebem a notificação formal de execução.");
      if (!MEIOS_NOTIFICACAO.includes(meio)) throw new Error("Seleccione o meio de notificação.");
    },
    () => ({ notificacao: { data: new Date().toISOString(), meio, observacao: String(observacao || "").trim(), por: utilizador?.nome || "Sistema" } }),
    "",
    utilizador
  );

export const podeLibertar = (g, e) =>
  (g.status === "Ativa" && (!e || ["Quitado", "Cancelado", "Rejeitado"].includes(e.status))) ||
  (g.status === "Penhorada" && (!e || ["Ativo", "Quitado"].includes(e.status)));

export const libertarGarantia = (id, motivo, utilizador) =>
  mudarEstado(
    id,
    (g, e) => {
      if (g.status === "Ativa" && e && !["Quitado", "Cancelado", "Rejeitado"].includes(e.status)) {
        throw new Error("A garantia só é libertada após a quitação total do empréstimo.");
      }
      if (g.status === "Penhorada" && e && !["Ativo", "Quitado"].includes(e.status)) {
        throw new Error("O cliente ainda tem parcelas em atraso. Regularize os pagamentos antes de libertar.");
      }
      if (!["Ativa", "Penhorada"].includes(g.status)) throw new Error("Esta garantia não pode ser libertada.");
      exigirMotivo(motivo);
    },
    () => ({ status: "Libertada", data_libertacao: hojeIso() }),
    String(motivo || "").trim(),
    utilizador
  );

export const requisitosExecucao = (g, e) => {
  const dias = diasAtrasoEmprestimo(e);
  return {
    dias,
    diasOk: dias >= REGRAS_GARANTIA.diasExecucao,
    notificado: Boolean(g.notificacao),
    pronta: g.status === "Penhorada" && dias >= REGRAS_GARANTIA.diasExecucao && Boolean(g.notificacao),
  };
};

export const executarGarantia = (id, { motivo, valor_recuperado }, utilizador) =>
  mudarEstado(
    id,
    (g, e) => {
      if (g.status !== "Penhorada") throw new Error("Só garantias penhoradas podem ser executadas.");
      const r = requisitosExecucao(g, e);
      if (!r.diasOk) throw new Error(`A execução exige ${REGRAS_GARANTIA.diasExecucao} dias de atraso (actual: ${r.dias}).`);
      if (!r.notificado) throw new Error("Registe primeiro a notificação formal ao cliente.");
      exigirMotivo(motivo, 10);
      if (valor_recuperado !== "" && valor_recuperado != null && !(Number(valor_recuperado) >= 0)) throw new Error("Valor recuperado inválido.");
    },
    () => ({ status: "Executada", data_execucao: hojeIso(), motivo_execucao: motivo.trim(), valor_recuperado: numeroOuNulo(valor_recuperado) }),
    String(motivo || "").trim(),
    utilizador
  );

export const eliminarGarantia = (id) => {
  const garantia = ler(CHAVE_GARANTIAS).find((g) => String(g.id) === String(id));
  if (!garantia) throw new Error("Garantia não encontrada.");
  const avalistas = avalistasDaGarantia(id);
  const anexos = [
    ...Object.values(garantia.documentos_anexos || {}).flat(),
    ...(garantia.fotos_garantia || []),
    ...avalistas.flatMap((a) => a.documentos_anexos || []),
  ];
  anexos.forEach((a) => { if (a?.anexo_id) eliminarAnexo(a.anexo_id).catch(() => {}); });
  gravar(CHAVE_GARANTIAS, ler(CHAVE_GARANTIAS).filter((g) => String(g.id) !== String(id)));
  gravar(CHAVE_AVALISTAS, ler(CHAVE_AVALISTAS).filter((a) => String(a.guarantee_id) !== String(id)));
  gravar(CHAVE_MOVIMENTOS, ler(CHAVE_MOVIMENTOS).filter((m) => String(m.guarantee_id) !== String(id)));
};

export const alertasGarantias = () => {
  const alertas = [];
  const garantias = garantiasDetalhadas();
  const rota = (g) => `/imperial/dashboard/garantias/${g.id}`;
  garantias.forEach((g) => {
    const nome = g.cliente?.nome_completo || "Cliente";
    const contrato = g.emprestimo?.numero_contrato || "—";
    const base = { garantia: g, chave: `${g.id}` };
    if (g.status === "Penhorada") {
      const r = requisitosExecucao(g, g.emprestimo);
      if (r.diasOk) {
        alertas.push({
          ...base, chave: `${g.id}-exec`, nivel: "critico", categoria: "Execução",
          titulo: r.notificado ? "Pronta para execução" : "Falta notificação formal",
          texto: `${g.codigo_garantia} · ${nome} · ${r.dias} dias de atraso (${contrato}).${r.notificado ? "" : " Notifique o cliente antes de executar."}`,
          accao: { rotulo: r.notificado ? "Executar" : "Notificar", rota: "/imperial/dashboard/garantias/execucao" },
        });
      } else if (r.dias >= REGRAS_GARANTIA.diasAvisoExecucao) {
        alertas.push({
          ...base, chave: `${g.id}-quase`, nivel: "alto", categoria: "Execução",
          titulo: `Execução em ${REGRAS_GARANTIA.diasExecucao - r.dias} dia(s)`,
          texto: `${g.codigo_garantia} · ${nome} · ${r.dias} dias de atraso.${r.notificado ? "" : " Prepare a notificação formal."}`,
          accao: { rotulo: "Ver penhoradas", rota: "/imperial/dashboard/garantias/penhoradas" },
        });
      }
    }
    if (g.status === "Ativa" && g.emprestimo && ["Em Atraso", "Vencido"].includes(g.emprestimo.status)) {
      alertas.push({
        ...base, chave: `${g.id}-atraso`, nivel: "alto", categoria: "Atraso",
        titulo: "Empréstimo em atraso",
        texto: `${g.codigo_garantia} · ${nome} · ${g.dias_atraso} dia(s) de atraso em ${contrato}. Considere a penhora.`,
        accao: { rotulo: "Penhorar", rota: "/imperial/dashboard/garantias/penhoradas" },
      });
    }
    if (g.status === "Em Avaliação") {
      const dias = diasDesde(g.data_registo);
      if (dias >= REGRAS_GARANTIA.diasAvaliacaoPendente) {
        alertas.push({
          ...base, chave: `${g.id}-aval`, nivel: "medio", categoria: "Avaliação",
          titulo: `Em avaliação há ${dias} dias`,
          texto: `${g.codigo_garantia} · ${nome} aguarda análise do gestor.`,
          accao: { rotulo: "Analisar", rota: rota(g) },
        });
      }
      const bloqueios = bloqueiosAprovacao(g);
      if (bloqueios.length) {
        alertas.push({
          ...base, chave: `${g.id}-doc`, nivel: "medio", categoria: "Documentação",
          titulo: "Aprovação bloqueada",
          texto: `${g.codigo_garantia} · ${bloqueios.join(" ")}`,
          accao: { rotulo: "Completar", rota: rota(g) },
        });
      }
    }
    if (["Em Avaliação", "Ativa"].includes(g.status) && g.tipo_garantia !== SEM_GARANTIA_G && g.emprestimo && g.cobertura < REGRAS_GARANTIA.coberturaMinima) {
      alertas.push({
        ...base, chave: `${g.id}-cob`, nivel: "medio", categoria: "Cobertura",
        titulo: `Cobertura insuficiente (${g.cobertura.toFixed(0)}%)`,
        texto: `${g.codigo_garantia} vale ${formatarMT(g.valor)} para um empréstimo de ${formatarMT(g.emprestimo.valor_emprestado)}. O mínimo é ${REGRAS_GARANTIA.coberturaMinima}% (recomendado ${REGRAS_GARANTIA.coberturaRecomendada}%).`,
        accao: { rotulo: "Ver garantia", rota: rota(g) },
      });
    }
    const validade = validadeAvaliacao(g);
    if (validade && ["Ativa", "Penhorada"].includes(g.status)) {
      const faltam = Math.ceil((validade.getTime() - Date.now()) / 86400000);
      if (faltam <= REGRAS_GARANTIA.diasAvisoValidade) {
        alertas.push({
          ...base, chave: `${g.id}-val`, nivel: faltam < 0 ? "alto" : "medio", categoria: "Expiração",
          titulo: faltam < 0 ? "Avaliação expirada" : `Avaliação expira em ${faltam} dia(s)`,
          texto: `${g.codigo_garantia} · avaliada em ${new Date(`${g.data_avaliacao}T00:00:00`).toLocaleDateString("pt-PT")}. Agende uma nova avaliação.`,
          accao: { rotulo: "Reavaliar", rota: rota(g) },
        });
      }
    }
  });
  const activasPorEmprestimo = {};
  garantias.filter((g) => g.status === "Ativa" || g.status === "Penhorada").forEach((g) => {
    activasPorEmprestimo[g.loan_id] = (activasPorEmprestimo[g.loan_id] || 0) + g.valor;
  });
  emprestimosParaGarantia()
    .filter((e) => Number(e.valor_emprestado) > REGRAS_GARANTIA.obrigatoriaAcima && (activasPorEmprestimo[e.id] || 0) < Number(e.valor_emprestado))
    .forEach((e) => {
      alertas.push({
        chave: `${e.id}-obrig`, nivel: e.status === "Pendente" ? "medio" : "alto", categoria: "Obrigatória",
        titulo: activasPorEmprestimo[e.id] ? "Garantia abaixo do valor do empréstimo" : "Empréstimo sem garantia obrigatória",
        texto: `${e.numero_contrato} · ${e.cliente?.nome_completo || "Cliente"} · ${formatarMT(e.valor_emprestado)} (acima de ${formatarMT(REGRAS_GARANTIA.obrigatoriaAcima)} exige garantia activa).`,
        accao: { rotulo: "Nova garantia", rota: `/imperial/dashboard/garantias/nova?emprestimo=${e.id}` },
      });
    });
  const ordem = { critico: 0, alto: 1, medio: 2, info: 3 };
  return alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
};

export const dadosGarantia = (id) => {
  const garantia = obterGarantia(id);
  if (!garantia) return null;
  const emprestimo = obterEmprestimo(garantia.loan_id);
  return {
    garantia,
    emprestimo,
    cliente: obterCliente(garantia.client_id),
    avalistas: avalistasDaGarantia(id),
    movimentos: movimentosDaGarantia(id),
    valor: valorGarantia(garantia),
    cobertura: coberturaGarantia(garantia, emprestimo),
    dias_atraso: diasAtrasoEmprestimo(emprestimo),
  };
};
