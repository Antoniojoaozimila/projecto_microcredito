import { listarClientes, obterCliente } from "./clientesMicrocredito";
import {
  arredondar, diasEntre, formatarData, formatarMT, gravarLista, lerLista, listarCarteiras, listarEmprestimos, obterEmprestimo, proximoCodigo, REGRAS,
} from "./emprestimosMicrocredito";
import { detalheParcela, hojeIso, horaActual, listarPagamentos, parcelasAbertas, registarPagamento, sugerirTipo } from "./pagamentosMicrocredito";

const CHAVES = {
  zonas: "microcredito-zonas-v1",
  cobradores: "microcredito-cobradores-v1",
  agendas: "microcredito-agendas-cobranca-v1",
  itens: "microcredito-agendas-itens-v1",
  rotas: "microcredito-agendas-rotas-v1",
  notificacoes: "microcredito-notificacoes-cobranca-v1",
  promessas: "microcredito-promessas-pagamento-v1",
  configuracao: "microcredito-notificacoes-config-v1",
};

export const REGRAS_COBRANCA = {
  get maxClientesRota() { return REGRAS.maxClientesRota; },
  get diasAntecedencia() { return REGRAS.diasLembreteAntes; },
  get raioMaxKm() { return REGRAS.raioMaxKm; },
  velocidadeMediaKmH: 25,
  paragemMin: 10,
  inadimplenciaAceitavel: 10,
  maxTexto: 5000,
};

export const ESTADOS_ZONA = ["Ativa", "Inativa"];
export const ESTADOS_COBRADOR = ["Ativo", "Inativo", "Suspenso"];
export const ESTADOS_AGENDA = ["Pendente", "Em Curso", "Concluída", "Cancelada"];
export const ESTADOS_ITEM = ["Pendente", "Cobrado", "Parcialmente Cobrado", "Não Cobrado", "Reagendado"];
export const ESTADOS_ROTA = ["Pendente", "Visitado", "Não Visitado"];
export const TIPOS_NOTIFICACAO = ["Lembrete Antes", "Lembrete No Dia", "Aviso Atraso", "Aviso Final", "Acordo Pagamento"];
export const CANAIS = ["SMS", "Email", "WhatsApp", "Chamada", "Presencial"];
export const ESTADOS_NOTIFICACAO = ["Pendente", "Enviada", "Entregue", "Lida", "Falhou"];
export const ESTADOS_PROMESSA = ["Pendente", "Cumprida", "Não Cumprida", "Reagendada"];
export const MOTIVOS_NAO_COBRO = [
  "Cliente ausente",
  "Sem dinheiro no momento",
  "Recusou pagar",
  "Endereço não encontrado",
  "Telefone desligado",
  "Cliente doente",
  "Outro",
];

const ESTADOS_COBRAVEIS = ["Ativo", "Em Atraso", "Vencido"];
const nomeDe = (utilizador) => utilizador?.nome || "Sistema";
const agoraIso = () => new Date().toISOString();
const texto = (v) => String(v ?? "").trim();
const numero = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const normalizar = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const telefoneOk = (v) => /^(\+258)?8[2-7]\d{7}$/.test(String(v || "").replace(/\s/g, ""));
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || ""));

export const somarDias = (iso, dias) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ---------- Geografia ----------

export const lerCoordenadas = (valor) => {
  const m = String(valor || "").match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
};

export const distanciaKm = (a, b) => {
  if (!a || !b) return 0;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const formatarDuracao = (minutos) => {
  const total = Math.round(Number(minutos) || 0);
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h ${String(m).padStart(2, "0")}min` : `${h}h`;
};

// ---------- Zonas ----------

const ZONAS_INICIAIS = [
  { id: 1, nome: "Zona Centro", codigo: "ZC-001", provincia: "Cidade de Maputo", distrito: "KaMpfumo", bairro: "Central", coordenadas_centro: "-25.969200, 32.573200", raio_km: 4 },
  { id: 2, nome: "Zona 01 · Matola", codigo: "ZM-001", provincia: "Maputo", distrito: "Matola", bairro: "Matola A", coordenadas_centro: "-25.962200, 32.458900", raio_km: 8 },
  { id: 3, nome: "Zona Zimpeto", codigo: "ZN-001", provincia: "Cidade de Maputo", distrito: "KaMubukwana", bairro: "Zimpeto", coordenadas_centro: "-25.855000, 32.563000", raio_km: 6 },
  { id: 4, nome: "Zona Costa do Sol", codigo: "ZE-001", provincia: "Cidade de Maputo", distrito: "KaMavota", bairro: "Costa do Sol", coordenadas_centro: "-25.920000, 32.620000", raio_km: 5 },
];

export const listarZonas = () => {
  const bruto = localStorage.getItem(CHAVES.zonas);
  if (bruto === null) {
    const agora = agoraIso();
    const iniciais = ZONAS_INICIAIS.map((z) => ({ ...z, responsavel: "", status: "Ativa", observacoes: "", data_registo: agora, data_atualizacao: agora, criado_por: "Sistema" }));
    gravarLista(CHAVES.zonas, iniciais);
    return iniciais;
  }
  return lerLista(CHAVES.zonas).sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt"));
};

export const zonasActivas = () => listarZonas().filter((z) => z.status === "Ativa");

export const obterZona = (id) => listarZonas().find((z) => String(z.id) === String(id)) || null;

export const zonaDoCliente = (cliente, zonas = zonasActivas()) => {
  if (!cliente) return null;
  const declarada = normalizar(cliente.zona_id === "__outro" ? cliente.zona_outra : cliente.zona_id);
  const porNome = declarada ? zonas.find((z) => normalizar(z.nome) === declarada) : null;
  if (porNome) return porNome;
  const posicao = lerCoordenadas(cliente.coordenadas_gps);
  if (posicao) {
    const cobertas = zonas
      .map((z) => ({ z, centro: lerCoordenadas(z.coordenadas_centro) }))
      .filter(({ z, centro }) => centro && Number(z.raio_km) > 0 && distanciaKm(centro, posicao) <= Number(z.raio_km))
      .sort((a, b) => distanciaKm(a.centro, posicao) - distanciaKm(b.centro, posicao));
    if (cobertas.length) return cobertas[0].z;
  }
  const bairro = normalizar(cliente.bairro === "__outro" ? cliente.bairro_outro : cliente.bairro);
  const cidade = normalizar(cliente.cidade === "__outro" ? cliente.cidade_outra : cliente.cidade);
  return zonas.find((z) => z.bairro && normalizar(z.bairro) === bairro && (!z.distrito || normalizar(z.distrito) === cidade)) || null;
};

export const clientesDaZona = (zonaId) => {
  const zonas = zonasActivas();
  return listarClientes().filter((c) => String(zonaDoCliente(c, zonas)?.id) === String(zonaId));
};

export const codigoZonaExiste = (codigo, ignorarId) =>
  listarZonas().some((z) => String(z.id) !== String(ignorarId || "") && texto(z.codigo).toUpperCase() === texto(codigo).toUpperCase());

export const sugerirCodigoZona = (nome) => {
  const letra = normalizar(nome).replace(/^zona\s*/, "").replace(/[^a-z]/g, "").charAt(0).toUpperCase() || "X";
  let n = 1;
  while (codigoZonaExiste(`Z${letra}-${String(n).padStart(3, "0")}`)) n += 1;
  return `Z${letra}-${String(n).padStart(3, "0")}`;
};

export const validarZona = (dados) => {
  const erros = {};
  if (!texto(dados.nome)) erros.nome = "Indique o nome da zona.";
  else if (texto(dados.nome).length > 100) erros.nome = "Máximo de 100 caracteres.";
  else if (listarZonas().some((z) => String(z.id) !== String(dados.id || "") && normalizar(z.nome) === normalizar(dados.nome))) erros.nome = "Já existe uma zona com este nome.";
  const codigo = texto(dados.codigo).toUpperCase();
  if (!codigo) erros.codigo = "Indique o código.";
  else if (!/^[A-Z0-9-]{2,20}$/.test(codigo)) erros.codigo = "Use 2 a 20 letras, números ou hífen (Ex: ZC-001).";
  else if (codigoZonaExiste(codigo, dados.id)) erros.codigo = "Já existe uma zona com este código.";
  if (!texto(dados.provincia)) erros.provincia = "Seleccione a província.";
  if (texto(dados.coordenadas_centro) && !lerCoordenadas(dados.coordenadas_centro)) erros.coordenadas_centro = "Use o formato «latitude, longitude».";
  const raio = numero(dados.raio_km);
  if (raio !== null && (!Number.isFinite(raio) || raio <= 0 || raio > REGRAS_COBRANCA.raioMaxKm)) erros.raio_km = `O raio máximo configurado é ${REGRAS_COBRANCA.raioMaxKm} km.`;
  if (!ESTADOS_ZONA.includes(dados.status)) erros.status = "Seleccione o estado.";
  if (String(dados.observacoes || "").length > REGRAS_COBRANCA.maxTexto) erros.observacoes = "Máximo de 5000 caracteres.";
  return erros;
};

export const guardarZona = (dados, utilizador) => {
  const erros = validarZona(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  const lista = listarZonas();
  const agora = agoraIso();
  const coordenadas = lerCoordenadas(dados.coordenadas_centro);
  const base = {
    nome: texto(dados.nome),
    codigo: texto(dados.codigo).toUpperCase(),
    provincia: texto(dados.provincia),
    distrito: texto(dados.distrito),
    bairro: texto(dados.bairro),
    coordenadas_centro: coordenadas ? `${coordenadas.lat.toFixed(6)}, ${coordenadas.lon.toFixed(6)}` : "",
    raio_km: numero(dados.raio_km),
    responsavel: texto(dados.responsavel),
    status: dados.status,
    observacoes: texto(dados.observacoes),
    data_atualizacao: agora,
  };
  if (dados.id) {
    const actual = lista.find((z) => String(z.id) === String(dados.id));
    if (!actual) throw new Error("Zona não encontrada.");
    const zona = { ...actual, ...base };
    gravarLista(CHAVES.zonas, lista.map((z) => (String(z.id) === String(dados.id) ? zona : z)));
    return zona;
  }
  const zona = { ...base, id: lista.reduce((m, z) => Math.max(m, Number(z.id) || 0), 0) + 1, data_registo: agora, criado_por: nomeDe(utilizador) };
  gravarLista(CHAVES.zonas, [...lista, zona]);
  return zona;
};

export const eliminarZona = (id) => {
  if (listarCobradores().some((c) => String(c.zona_id) === String(id))) throw new Error("Há cobradores associados a esta zona. Mude-os de zona ou inactive a zona.");
  if (listarAgendas().some((a) => String(a.zona_id) === String(id))) throw new Error("Há agendas de cobrança nesta zona. Inactive a zona em vez de a eliminar.");
  gravarLista(CHAVES.zonas, listarZonas().filter((z) => String(z.id) !== String(id)));
};

// ---------- Cobradores ----------

export const listarCobradores = () => lerLista(CHAVES.cobradores).sort((a, b) => String(a.nome_completo).localeCompare(String(b.nome_completo), "pt"));

export const cobradoresActivos = () => listarCobradores().filter((c) => c.status === "Ativo");

export const obterCobrador = (id) => listarCobradores().find((c) => String(c.id) === String(id)) || null;

export const cobradorDoUtilizador = (utilizador) => {
  const nome = normalizar(utilizador?.nome);
  const email = normalizar(utilizador?.email);
  return listarCobradores().find((c) => (nome && (normalizar(c.utilizador) === nome || normalizar(c.nome_completo) === nome)) || (email && normalizar(c.email) === email)) || null;
};

export const validarCobrador = (dados) => {
  const erros = {};
  const outros = listarCobradores().filter((c) => String(c.id) !== String(dados.id || ""));
  if (!texto(dados.utilizador)) erros.utilizador = "Indique o utilizador de acesso.";
  else if (outros.some((c) => normalizar(c.utilizador) === normalizar(dados.utilizador))) erros.utilizador = "Este utilizador já está associado a outro cobrador.";
  if (!texto(dados.nome_completo)) erros.nome_completo = "Indique o nome do cobrador.";
  else if (texto(dados.nome_completo).length > 200) erros.nome_completo = "Máximo de 200 caracteres.";
  if (!texto(dados.documento)) erros.documento = "Indique o número do documento.";
  else if (texto(dados.documento).length > 50) erros.documento = "Máximo de 50 caracteres.";
  else if (outros.some((c) => normalizar(c.documento) === normalizar(dados.documento))) erros.documento = "Já existe um cobrador com este documento.";
  if (!telefoneOk(dados.telefone_principal)) erros.telefone_principal = "Use um número moçambicano (Ex: 84xxxxxxx).";
  if (texto(dados.telefone_alternativo) && !telefoneOk(dados.telefone_alternativo)) erros.telefone_alternativo = "Número inválido.";
  if (texto(dados.email) && !emailOk(dados.email)) erros.email = "Email inválido.";
  const zona = obterZona(dados.zona_id);
  if (!zona) erros.zona_id = "Seleccione a zona.";
  else if (zona.status !== "Ativa" && dados.status === "Ativo") erros.zona_id = "A zona está inactiva.";
  const meta = numero(dados.meta_mensal);
  if (meta !== null && (!Number.isFinite(meta) || meta < 0)) erros.meta_mensal = "Valor inválido.";
  const comissao = numero(dados.comissao_percentual);
  if (comissao !== null && (!Number.isFinite(comissao) || comissao < 0 || comissao > 100)) erros.comissao_percentual = "Entre 0 e 100%.";
  if (!ESTADOS_COBRADOR.includes(dados.status)) erros.status = "Seleccione o estado.";
  if (dados.data_admissao && dados.data_admissao > hojeIso()) erros.data_admissao = "Não pode ser futura.";
  if (String(dados.observacoes || "").length > REGRAS_COBRANCA.maxTexto) erros.observacoes = "Máximo de 5000 caracteres.";
  return erros;
};

export const guardarCobrador = (dados, utilizador) => {
  const erros = validarCobrador(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  const lista = listarCobradores();
  const agora = agoraIso();
  const base = {
    utilizador: texto(dados.utilizador),
    nome_completo: texto(dados.nome_completo),
    documento: texto(dados.documento).toUpperCase(),
    telefone_principal: String(dados.telefone_principal).replace(/\s/g, ""),
    telefone_alternativo: String(dados.telefone_alternativo || "").replace(/\s/g, ""),
    email: texto(dados.email).toLowerCase(),
    zona_id: Number(dados.zona_id) || dados.zona_id,
    meta_mensal: numero(dados.meta_mensal),
    comissao_percentual: numero(dados.comissao_percentual),
    status: dados.status,
    data_admissao: dados.data_admissao || null,
    observacoes: texto(dados.observacoes),
    data_atualizacao: agora,
  };
  if (dados.id) {
    const actual = lista.find((c) => String(c.id) === String(dados.id));
    if (!actual) throw new Error("Cobrador não encontrado.");
    const cobrador = { ...actual, ...base };
    gravarLista(CHAVES.cobradores, lista.map((c) => (String(c.id) === String(dados.id) ? cobrador : c)));
    return cobrador;
  }
  const cobrador = { ...base, id: lista.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1, data_registo: agora, criado_por: nomeDe(utilizador) };
  gravarLista(CHAVES.cobradores, [...lista, cobrador]);
  return cobrador;
};

export const eliminarCobrador = (id) => {
  if (listarAgendas().some((a) => String(a.collector_id) === String(id))) throw new Error("O cobrador tem agendas registadas. Altere o estado para «Inativo» em vez de o eliminar.");
  gravarLista(CHAVES.cobradores, listarCobradores().filter((c) => String(c.id) !== String(id)));
};

export const utilizadoresConhecidos = (utilizador) => {
  const nomes = [
    utilizador?.nome,
    ...listarCobradores().map((c) => c.nome_completo),
    ...listarZonas().map((z) => z.responsavel),
    ...listarCarteiras().map((c) => c.responsavel),
  ].map(texto).filter(Boolean);
  return [...new Set(nomes)].sort((a, b) => a.localeCompare(b, "pt"));
};

// ---------- Candidatos e rota ----------

export const listarAgendas = () =>
  lerLista(CHAVES.agendas).sort((a, b) => String(b.data_agendada).localeCompare(String(a.data_agendada)) || String(b.data_registo).localeCompare(String(a.data_registo)));

export const obterAgenda = (id) => lerLista(CHAVES.agendas).find((a) => String(a.id) === String(id)) || null;

const listarItens = () => lerLista(CHAVES.itens);
const listarRotas = () => lerLista(CHAVES.rotas);

const parcelasOcupadas = (ignorarAgendaId) => {
  const abertas = new Set(
    lerLista(CHAVES.agendas).filter((a) => ["Pendente", "Em Curso"].includes(a.status) && String(a.id) !== String(ignorarAgendaId || "")).map((a) => String(a.id))
  );
  return new Set(listarItens().filter((i) => abertas.has(String(i.schedule_id)) && i.status === "Pendente").map((i) => String(i.installment_id)));
};

const itemDeParcela = (emprestimo, cliente, parcela, data) => {
  const d = detalheParcela(parcela, data);
  return {
    chave: parcela.id,
    client_id: cliente.id,
    loan_id: emprestimo.id,
    installment_id: parcela.id,
    cliente_nome: cliente.nome_completo,
    telefone: cliente.telefone_principal || "",
    contrato: emprestimo.numero_contrato,
    num_parcela: parcela.num_parcela,
    total_parcelas: emprestimo.num_parcelas,
    data_vencimento: parcela.data_vencimento,
    dias_atraso: parcela.data_vencimento < data ? d.dias_atraso : 0,
    valor_esperado: d.total_devido,
    coordenadas: cliente.coordenadas_gps || "",
    endereco: cliente.endereco_completo || "",
  };
};

export const parcelasParaCobranca = ({ zonaId, data, clienteId, ignorarAgendaId, todas = false }) => {
  const zonas = zonasActivas();
  const limite = somarDias(data, REGRAS_COBRANCA.diasAntecedencia);
  const ocupadas = parcelasOcupadas(ignorarAgendaId);
  const clientes = Object.fromEntries(listarClientes().map((c) => [String(c.id), c]));
  const itens = [];
  listarEmprestimos()
    .filter((e) => ESTADOS_COBRAVEIS.includes(e.status))
    .forEach((e) => {
      const cliente = clientes[String(e.client_id)];
      if (!cliente) return;
      if (clienteId ? String(cliente.id) !== String(clienteId) : String(zonaDoCliente(cliente, zonas)?.id) !== String(zonaId)) return;
      const abertas = parcelasAbertas(e).filter((p) => !ocupadas.has(String(p.id)));
      const escolhidas = todas ? abertas.filter((p, i) => p.data_vencimento <= limite || i === 0) : abertas.filter((p) => p.data_vencimento <= limite);
      escolhidas.forEach((p) => {
        const item = itemDeParcela(e, cliente, p, data);
        if (item.valor_esperado > 0) itens.push(item);
      });
    });
  return itens;
};

export const agruparPorCliente = (itens) => {
  const mapa = new Map();
  itens.forEach((i) => {
    const chave = String(i.client_id);
    const actual = mapa.get(chave) || { client_id: i.client_id, cliente_nome: i.cliente_nome, telefone: i.telefone, coordenadas: i.coordenadas, endereco: i.endereco, itens: [] };
    if (!actual.itens.some((x) => String(x.installment_id) === String(i.installment_id))) actual.itens.push(i);
    mapa.set(chave, actual);
  });
  return [...mapa.values()].map((p) => ({
    ...p,
    itens: p.itens.sort((a, b) => String(a.data_vencimento).localeCompare(String(b.data_vencimento))),
    valor: arredondar(p.itens.reduce((s, i) => s + i.valor_esperado, 0)),
    dias_atraso: Math.max(0, ...p.itens.map((i) => i.dias_atraso)),
  }));
};

export const clientesComParcelas = ({ data, ignorarAgendaId }) =>
  agruparPorCliente(
    listarClientes().flatMap((c) => parcelasParaCobranca({ clienteId: c.id, data, ignorarAgendaId, todas: true }))
  ).sort((a, b) => b.dias_atraso - a.dias_atraso || String(a.cliente_nome).localeCompare(String(b.cliente_nome), "pt"));

export const optimizarRota = (paragens, origem) => {
  const comCoordenadas = paragens.filter((p) => lerCoordenadas(p.coordenadas));
  const semCoordenadas = paragens.filter((p) => !lerCoordenadas(p.coordenadas)).sort((a, b) => b.dias_atraso - a.dias_atraso);
  let actual = origem || null;
  const ordenar = (grupo) => {
    const restantes = [...grupo];
    const saida = [];
    while (restantes.length) {
      let melhor = 0;
      let menor = Infinity;
      restantes.forEach((p, i) => {
        const d = actual ? distanciaKm(actual, lerCoordenadas(p.coordenadas)) : 0;
        if (d < menor) {
          menor = d;
          melhor = i;
        }
      });
      const [escolhida] = restantes.splice(melhor, 1);
      saida.push(escolhida);
      actual = lerCoordenadas(escolhida.coordenadas);
    }
    return saida;
  };
  return [...ordenar(comCoordenadas.filter((p) => p.dias_atraso > 0)), ...ordenar(comCoordenadas.filter((p) => !(p.dias_atraso > 0))), ...semCoordenadas];
};

export const calcularRota = (paragens, origem) => {
  let anterior = origem || null;
  let distancia = 0;
  const ordenadas = paragens.map((p, i) => {
    const posicao = lerCoordenadas(p.coordenadas);
    const km = posicao && anterior ? arredondar(distanciaKm(anterior, posicao)) : 0;
    if (posicao) anterior = posicao;
    distancia += km;
    return { ...p, ordem_visita: i + 1, distancia_anterior_km: posicao ? km : null, tempo_estimado_min: posicao ? Math.round((km / REGRAS_COBRANCA.velocidadeMediaKmH) * 60) : null };
  });
  const deslocacao = (distancia / REGRAS_COBRANCA.velocidadeMediaKmH) * 60;
  return {
    paragens: ordenadas,
    distancia_total_km: arredondar(distancia),
    tempo_estimado_min: Math.round(deslocacao + ordenadas.length * REGRAS_COBRANCA.paragemMin),
    sem_coordenadas: ordenadas.filter((p) => !lerCoordenadas(p.coordenadas)).length,
  };
};

export const origemDaZona = (zonaId) => lerCoordenadas(obterZona(zonaId)?.coordenadas_centro);

export const propostaAgenda = ({ zonaId, data, ignorarAgendaId }) => {
  const paragens = agruparPorCliente(parcelasParaCobranca({ zonaId, data, ignorarAgendaId }))
    .sort((a, b) => b.dias_atraso - a.dias_atraso || b.valor - a.valor);
  const escolhidas = paragens.slice(0, REGRAS_COBRANCA.maxClientesRota);
  return {
    paragens: optimizarRota(escolhidas, origemDaZona(zonaId)),
    excedentes: paragens.slice(REGRAS_COBRANCA.maxClientesRota),
  };
};

export const metaDaAgenda = (esperado) => arredondar(Number(esperado || 0) * (1 - REGRAS_COBRANCA.inadimplenciaAceitavel / 100));

export const taxaSucesso = (cobrado, esperado) => (Number(esperado) > 0 ? (Number(cobrado || 0) / Number(esperado)) * 100 : 0);

// ---------- Agendas ----------

export const validarAgenda = (dados) => {
  const erros = {};
  if (!dados.data_agendada) erros.data_agendada = "Indique a data da cobrança.";
  else if (dados.data_agendada < hojeIso()) erros.data_agendada = "Use a data de hoje ou uma data futura.";
  if (dados.hora_inicio && dados.hora_fim && dados.hora_fim <= dados.hora_inicio) erros.hora_fim = "Tem de ser depois da hora de início.";
  const cobrador = obterCobrador(dados.collector_id);
  if (!cobrador) erros.collector_id = "Seleccione o cobrador.";
  else if (cobrador.status !== "Ativo") erros.collector_id = `O cobrador está ${cobrador.status.toLowerCase()}.`;
  else if (dados.data_agendada && listarAgendas().some((a) => String(a.collector_id) === String(cobrador.id) && a.data_agendada === dados.data_agendada && a.status !== "Cancelada")) {
    erros.collector_id = "Este cobrador já tem uma agenda nesta data.";
  }
  const zona = obterZona(dados.zona_id);
  if (!zona) erros.zona_id = "Seleccione a zona.";
  else if (zona.status !== "Ativa") erros.zona_id = "A zona está inactiva.";
  const paragens = dados.paragens || [];
  if (!paragens.length) erros.paragens = "Adicione pelo menos um cliente à rota.";
  else if (paragens.length > REGRAS_COBRANCA.maxClientesRota) erros.paragens = `Máximo de ${REGRAS_COBRANCA.maxClientesRota} clientes por rota.`;
  if (String(dados.observacoes || "").length > REGRAS_COBRANCA.maxTexto) erros.observacoes = "Máximo de 5000 caracteres.";
  return erros;
};

export const criarAgenda = (dados, utilizador) => {
  const erros = validarAgenda(dados);
  if (Object.keys(erros).length) throw new Error(Object.values(erros)[0]);
  const ocupadas = parcelasOcupadas();
  const emUso = dados.paragens.flatMap((p) => p.itens).find((i) => ocupadas.has(String(i.installment_id)));
  if (emUso) throw new Error(`A parcela ${emUso.num_parcela} de ${emUso.contrato} já está noutra agenda aberta.`);
  const agora = agoraIso();
  const nome = nomeDe(utilizador);
  const id = crypto.randomUUID();
  const rota = calcularRota(dados.paragens, origemDaZona(dados.zona_id));
  const itens = rota.paragens.flatMap((p) => p.itens.map((i) => ({
    id: crypto.randomUUID(),
    schedule_id: id,
    client_id: i.client_id,
    loan_id: i.loan_id,
    installment_id: i.installment_id,
    contrato: i.contrato,
    num_parcela: i.num_parcela,
    total_parcelas: i.total_parcelas,
    data_vencimento: i.data_vencimento,
    dias_atraso: i.dias_atraso,
    valor_esperado: arredondar(i.valor_esperado),
    valor_cobrado: 0,
    data_cobranca: null,
    hora_cobranca: null,
    status: "Pendente",
    motivo_nao_cobro: null,
    promessa_pagamento: null,
    observacoes: "",
    payment_ids: [],
    sincronizado: true,
    data_registo: agora,
    data_atualizacao: agora,
  })));
  const rotas = rota.paragens.map((p) => ({
    id: crypto.randomUUID(),
    schedule_id: id,
    ordem_visita: p.ordem_visita,
    client_id: p.client_id,
    coordenadas: p.coordenadas || null,
    distancia_anterior_km: p.distancia_anterior_km,
    tempo_estimado_min: p.tempo_estimado_min,
    status: "Pendente",
    data_registo: agora,
  }));
  const total = arredondar(itens.reduce((s, i) => s + i.valor_esperado, 0));
  const agenda = {
    id,
    codigo_agenda: proximoCodigo(CHAVES.agendas, "codigo_agenda", "AGD"),
    collector_id: Number(dados.collector_id) || dados.collector_id,
    zona_id: Number(dados.zona_id) || dados.zona_id,
    data_agendada: dados.data_agendada,
    hora_inicio: dados.hora_inicio || null,
    hora_fim: dados.hora_fim || null,
    total_clientes: rotas.length,
    total_esperado: total,
    total_cobrado: 0,
    meta: metaDaAgenda(total),
    distancia_total_km: rota.distancia_total_km,
    tempo_estimado_min: rota.tempo_estimado_min,
    status: "Pendente",
    automatica: Boolean(dados.automatica),
    observacoes: texto(dados.observacoes),
    historico: [{ data: agora, accao: dados.automatica ? "Agenda gerada automaticamente" : "Agenda criada", por: nome }],
    criado_por: nome,
    data_registo: agora,
    data_atualizacao: agora,
  };
  gravarLista(CHAVES.agendas, [...lerLista(CHAVES.agendas), agenda]);
  gravarLista(CHAVES.itens, [...listarItens(), ...itens]);
  gravarLista(CHAVES.rotas, [...listarRotas(), ...rotas]);
  return agenda;
};

export const gerarAgendasDoDia = (data, utilizador) => {
  const criadas = [];
  const ignoradas = [];
  cobradoresActivos().forEach((c) => {
    const zona = obterZona(c.zona_id);
    if (!zona || zona.status !== "Ativa") return ignoradas.push(`${c.nome_completo}: zona inactiva`);
    if (listarAgendas().some((a) => String(a.collector_id) === String(c.id) && a.data_agendada === data && a.status !== "Cancelada")) return ignoradas.push(`${c.nome_completo}: já tem agenda`);
    const { paragens } = propostaAgenda({ zonaId: zona.id, data });
    if (!paragens.length) return ignoradas.push(`${c.nome_completo}: sem parcelas a cobrar em ${zona.nome}`);
    criadas.push(criarAgenda({ data_agendada: data, hora_inicio: "08:00", hora_fim: "17:00", collector_id: c.id, zona_id: zona.id, paragens, automatica: true }, utilizador));
    return null;
  });
  return { criadas, ignoradas };
};

const recalcularAgenda = (agendaId, extra = {}) => {
  const itens = listarItens().filter((i) => String(i.schedule_id) === String(agendaId));
  const agendas = lerLista(CHAVES.agendas);
  const agora = agoraIso();
  const lista = agendas.map((a) => {
    if (String(a.id) !== String(agendaId)) return a;
    const total_esperado = arredondar(itens.reduce((s, i) => s + i.valor_esperado, 0));
    return {
      ...a,
      ...extra,
      total_esperado,
      total_cobrado: arredondar(itens.reduce((s, i) => s + Number(i.valor_cobrado || 0), 0)),
      total_clientes: new Set(itens.map((i) => String(i.client_id))).size,
      meta: metaDaAgenda(total_esperado),
      historico: extra.historico || a.historico,
      data_atualizacao: agora,
    };
  });
  gravarLista(CHAVES.agendas, lista);
  return lista.find((a) => String(a.id) === String(agendaId));
};

const comHistorico = (agenda, accao, utilizador) => [...(agenda.historico || []), { data: agoraIso(), accao, por: nomeDe(utilizador) }];

export const dadosAgenda = (id) => {
  const agenda = obterAgenda(id);
  if (!agenda) return null;
  const clientes = Object.fromEntries(listarClientes().map((c) => [String(c.id), c]));
  const itens = listarItens().filter((i) => String(i.schedule_id) === String(id));
  const rota = listarRotas()
    .filter((r) => String(r.schedule_id) === String(id))
    .sort((a, b) => a.ordem_visita - b.ordem_visita)
    .map((r) => ({
      ...r,
      cliente: clientes[String(r.client_id)] || null,
      itens: itens.filter((i) => String(i.client_id) === String(r.client_id)).sort((a, b) => String(a.data_vencimento).localeCompare(String(b.data_vencimento))),
    }));
  const cobrados = itens.filter((i) => i.status === "Cobrado").length;
  return {
    agenda,
    cobrador: obterCobrador(agenda.collector_id),
    zona: obterZona(agenda.zona_id),
    itens,
    rota,
    resumo: {
      clientes: rota.length,
      itens: itens.length,
      cobrados,
      parciais: itens.filter((i) => i.status === "Parcialmente Cobrado").length,
      naoCobrados: itens.filter((i) => i.status === "Não Cobrado").length,
      reagendados: itens.filter((i) => i.status === "Reagendado").length,
      pendentes: itens.filter((i) => i.status === "Pendente").length,
      visitados: rota.filter((r) => r.status === "Visitado").length,
      esperado: agenda.total_esperado,
      cobrado: agenda.total_cobrado,
      meta: agenda.meta,
      taxa: taxaSucesso(agenda.total_cobrado, agenda.total_esperado),
      porSincronizar: itens.filter((i) => i.sincronizado === false).length,
    },
  };
};

export const agendasDoCobrador = (cobradorId, data) =>
  listarAgendas().filter((a) => String(a.collector_id) === String(cobradorId) && (!data || a.data_agendada === data));

const exigirAgendaAberta = (agenda) => {
  if (!agenda) throw new Error("Agenda não encontrada.");
  if (!["Pendente", "Em Curso"].includes(agenda.status)) throw new Error(`A agenda está ${agenda.status.toLowerCase()}.`);
};

export const iniciarAgenda = (id, utilizador) => {
  const agenda = obterAgenda(id);
  exigirAgendaAberta(agenda);
  if (agenda.status === "Em Curso") return agenda;
  return recalcularAgenda(id, { status: "Em Curso", hora_inicio_real: horaActual(), historico: comHistorico(agenda, "Rota iniciada", utilizador) });
};

const alterarItem = (itemId, mudar) => {
  const itens = listarItens();
  const idx = itens.findIndex((i) => String(i.id) === String(itemId));
  if (idx < 0) throw new Error("Item da agenda não encontrado.");
  itens[idx] = { ...mudar(itens[idx]), data_atualizacao: agoraIso() };
  gravarLista(CHAVES.itens, itens);
  return itens[idx];
};

const marcarVisita = (agendaId, clienteId, status) => {
  gravarLista(CHAVES.rotas, listarRotas().map((r) => (String(r.schedule_id) === String(agendaId) && String(r.client_id) === String(clienteId) ? { ...r, status, data_visita: agoraIso() } : r)));
};

const emLinha = () => (typeof navigator === "undefined" ? true : navigator.onLine !== false);

const prepararExecucao = (itemId, utilizador) => {
  const item = listarItens().find((i) => String(i.id) === String(itemId));
  if (!item) throw new Error("Item da agenda não encontrado.");
  const agenda = obterAgenda(item.schedule_id);
  exigirAgendaAberta(agenda);
  if (agenda.status === "Pendente") iniciarAgenda(agenda.id, utilizador);
  return { item, agenda: obterAgenda(agenda.id) };
};

export const valorEmDivida = (item) => {
  const emprestimo = obterEmprestimo(item.loan_id);
  const parcela = emprestimo?.parcelas?.find((p) => String(p.id) === String(item.installment_id));
  return parcela && parcela.status !== "Pago" ? detalheParcela(parcela, hojeIso()).total_devido : 0;
};

export const registarCobranca = (itemId, dados, utilizador) => {
  const { item, agenda } = prepararExecucao(itemId, utilizador);
  if (item.status === "Cobrado") throw new Error("Esta parcela já foi cobrada.");
  const emprestimo = obterEmprestimo(item.loan_id);
  if (!emprestimo) throw new Error("O empréstimo já não existe.");
  const valor = arredondar(Number(dados.valor));
  const pagamento = registarPagamento({
    loan_id: item.loan_id,
    installment_id: item.installment_id,
    valor_pago: valor,
    data_pagamento: hojeIso(),
    hora_pagamento: horaActual(),
    forma_pagamento: dados.forma_pagamento,
    referencia_transacao: dados.referencia_transacao,
    carteira_id: dados.carteira_id,
    tipo_pagamento: sugerirTipo(emprestimo, { installmentId: item.installment_id, valor, dataPagamento: hojeIso() }),
    observacoes: `Cobrança ${agenda.codigo_agenda}${texto(dados.observacoes) ? ` · ${texto(dados.observacoes)}` : ""}`,
  }, utilizador);
  const cobrado = arredondar(Number(item.valor_cobrado || 0) + valor);
  const actualizado = alterarItem(itemId, (i) => ({
    ...i,
    valor_cobrado: cobrado,
    status: cobrado >= i.valor_esperado - 0.005 || valorEmDivida(i) <= 0.005 ? "Cobrado" : "Parcialmente Cobrado",
    data_cobranca: hojeIso(),
    hora_cobranca: horaActual(),
    motivo_nao_cobro: null,
    observacoes: texto(dados.observacoes) || i.observacoes,
    payment_ids: [...(i.payment_ids || []), pagamento.id],
    sincronizado: emLinha(),
  }));
  marcarVisita(agenda.id, item.client_id, "Visitado");
  recalcularAgenda(agenda.id);
  return { item: actualizado, pagamento };
};

export const registarNaoCobrado = (itemId, { motivo, observacoes }, utilizador) => {
  const { item, agenda } = prepararExecucao(itemId, utilizador);
  if (!texto(motivo)) throw new Error("Indique o motivo.");
  if (item.status === "Cobrado") throw new Error("Esta parcela já foi cobrada.");
  const actualizado = alterarItem(itemId, (i) => ({
    ...i,
    status: Number(i.valor_cobrado || 0) > 0 ? "Parcialmente Cobrado" : "Não Cobrado",
    motivo_nao_cobro: texto(motivo),
    observacoes: texto(observacoes) || i.observacoes,
    data_cobranca: hojeIso(),
    hora_cobranca: horaActual(),
    sincronizado: emLinha(),
  }));
  marcarVisita(agenda.id, item.client_id, "Visitado");
  recalcularAgenda(agenda.id);
  return actualizado;
};

// ---------- Promessas ----------

export const listarPromessas = () => lerLista(CHAVES.promessas).sort((a, b) => String(a.data_prometida).localeCompare(String(b.data_prometida)));

const reagendarNaAgenda = (item, data) => {
  const destino = listarAgendas().find((a) =>
    a.status === "Pendente" && a.data_agendada === data && String(a.collector_id) === String(obterAgenda(item.schedule_id)?.collector_id)
  );
  if (!destino) return null;
  if (listarItens().some((i) => String(i.schedule_id) === String(destino.id) && String(i.installment_id) === String(item.installment_id))) return destino;
  const agora = agoraIso();
  gravarLista(CHAVES.itens, [...listarItens(), {
    ...item,
    id: crypto.randomUUID(),
    schedule_id: destino.id,
    valor_esperado: valorEmDivida(item) || item.valor_esperado,
    valor_cobrado: 0,
    status: "Pendente",
    motivo_nao_cobro: null,
    promessa_pagamento: null,
    payment_ids: [],
    reagendado_de: item.schedule_id,
    data_registo: agora,
    data_atualizacao: agora,
  }]);
  const rotas = listarRotas();
  if (!rotas.some((r) => String(r.schedule_id) === String(destino.id) && String(r.client_id) === String(item.client_id))) {
    const ordem = rotas.filter((r) => String(r.schedule_id) === String(destino.id)).length + 1;
    const cliente = obterCliente(item.client_id);
    gravarLista(CHAVES.rotas, [...rotas, {
      id: crypto.randomUUID(), schedule_id: destino.id, ordem_visita: ordem, client_id: item.client_id, coordenadas: cliente?.coordenadas_gps || null,
      distancia_anterior_km: null, tempo_estimado_min: null, status: "Pendente", data_registo: agora,
    }]);
  }
  recalcularAgenda(destino.id);
  return destino;
};

export const registarPromessa = (itemId, { data_prometida, valor_prometido, observacoes }, utilizador) => {
  const { item, agenda } = prepararExecucao(itemId, utilizador);
  if (item.status === "Cobrado") throw new Error("Esta parcela já foi cobrada.");
  if (!data_prometida || data_prometida <= hojeIso()) throw new Error("A data prometida tem de ser futura.");
  const valor = arredondar(Number(valor_prometido));
  if (!(valor >= 1)) throw new Error("Indique o valor prometido (mínimo 1 MT).");
  const agora = agoraIso();
  const nome = nomeDe(utilizador);
  const promessa = {
    id: crypto.randomUUID(),
    client_id: item.client_id,
    loan_id: item.loan_id,
    installment_id: item.installment_id,
    schedule_id: agenda.id,
    item_id: item.id,
    valor_prometido: valor,
    data_prometida,
    data_registo: agora,
    registado_por: nome,
    status: "Pendente",
    observacoes: texto(observacoes),
    historico: [{ data: agora, accao: `Promessa de ${formatarMT(valor)} para ${formatarData(data_prometida)}`, por: nome }],
    data_atualizacao: agora,
  };
  gravarLista(CHAVES.promessas, [...lerLista(CHAVES.promessas), promessa]);
  const actualizado = alterarItem(itemId, (i) => ({ ...i, status: "Reagendado", promessa_pagamento: data_prometida, observacoes: texto(observacoes) || i.observacoes, sincronizado: emLinha() }));
  marcarVisita(agenda.id, item.client_id, "Visitado");
  recalcularAgenda(agenda.id);
  const destino = reagendarNaAgenda(actualizado, data_prometida);
  criarNotificacao({ client_id: item.client_id, loan_id: item.loan_id, installment_id: item.installment_id, tipo: "Acordo Pagamento", valor, data: data_prometida }, utilizador);
  return { item: actualizado, promessa, reagendadaEm: destino };
};

export const actualizarPromessas = () => {
  const pagamentos = listarPagamentos().filter((p) => p.status === "Confirmado");
  const hoje = hojeIso();
  let mudou = false;
  const lista = lerLista(CHAVES.promessas).map((p) => {
    if (!["Pendente", "Reagendada"].includes(p.status)) return p;
    const pago = pagamentos
      .filter((x) => String(x.loan_id) === String(p.loan_id) && String(x.data_registo) >= String(p.data_registo))
      .reduce((s, x) => s + Number(x.valor_pago || 0), 0);
    const status = pago >= p.valor_prometido - 0.005 ? "Cumprida" : p.data_prometida < hoje ? "Não Cumprida" : p.status;
    if (status === p.status) return p;
    mudou = true;
    return { ...p, status, valor_pago: arredondar(pago), historico: [...(p.historico || []), { data: agoraIso(), accao: `Promessa ${status.toLowerCase()} (verificação automática)`, por: "Sistema" }], data_atualizacao: agoraIso() };
  });
  if (mudou) gravarLista(CHAVES.promessas, lista);
  return lista;
};

const alterarPromessa = (id, mudar) => {
  const lista = lerLista(CHAVES.promessas);
  const idx = lista.findIndex((p) => String(p.id) === String(id));
  if (idx < 0) throw new Error("Promessa não encontrada.");
  lista[idx] = { ...mudar(lista[idx]), data_atualizacao: agoraIso() };
  gravarLista(CHAVES.promessas, lista);
  return lista[idx];
};

export const marcarPromessa = (id, status, utilizador) => {
  if (!ESTADOS_PROMESSA.includes(status)) throw new Error("Estado inválido.");
  return alterarPromessa(id, (p) => ({ ...p, status, historico: [...(p.historico || []), { data: agoraIso(), accao: `Marcada como ${status.toLowerCase()}`, por: nomeDe(utilizador) }] }));
};

export const reagendarPromessa = (id, novaData, utilizador) => {
  if (!novaData || novaData <= hojeIso()) throw new Error("A nova data tem de ser futura.");
  const promessa = alterarPromessa(id, (p) => {
    if (["Cumprida"].includes(p.status)) throw new Error("A promessa já foi cumprida.");
    return {
      ...p,
      status: "Reagendada",
      data_prometida: novaData,
      reagendamentos: (p.reagendamentos || 0) + 1,
      historico: [...(p.historico || []), { data: agoraIso(), accao: `Reagendada para ${formatarData(novaData)}`, por: nomeDe(utilizador) }],
    };
  });
  const item = listarItens().find((i) => String(i.id) === String(promessa.item_id));
  if (item) reagendarNaAgenda(item, novaData);
  criarNotificacao({ client_id: promessa.client_id, loan_id: promessa.loan_id, installment_id: promessa.installment_id, tipo: "Acordo Pagamento", valor: promessa.valor_prometido, data: novaData }, utilizador);
  return promessa;
};

// ---------- Finalização ----------

export const finalizarAgenda = (id, utilizador) => {
  const agenda = obterAgenda(id);
  exigirAgendaAberta(agenda);
  const agora = agoraIso();
  gravarLista(CHAVES.itens, listarItens().map((i) =>
    String(i.schedule_id) === String(id) && i.status === "Pendente"
      ? { ...i, status: "Não Cobrado", motivo_nao_cobro: i.motivo_nao_cobro || "Cliente não visitado", data_atualizacao: agora }
      : i
  ));
  gravarLista(CHAVES.rotas, listarRotas().map((r) => (String(r.schedule_id) === String(id) && r.status === "Pendente" ? { ...r, status: "Não Visitado" } : r)));
  const final = recalcularAgenda(id, { status: "Concluída", hora_fim_real: horaActual(), data_conclusao: agora, historico: comHistorico(agenda, "Rota finalizada", utilizador) });
  return final;
};

export const cancelarAgenda = (id, motivo, utilizador) => {
  const agenda = obterAgenda(id);
  exigirAgendaAberta(agenda);
  if (texto(motivo).length < 5) throw new Error("Indique o motivo do cancelamento (mínimo 5 caracteres).");
  if (listarItens().some((i) => String(i.schedule_id) === String(id) && Number(i.valor_cobrado || 0) > 0)) {
    throw new Error("Já há cobranças registadas nesta agenda. Finalize a rota em vez de cancelar.");
  }
  return recalcularAgenda(id, { status: "Cancelada", motivo_cancelamento: texto(motivo), historico: comHistorico(agenda, `Agenda cancelada: ${texto(motivo)}`, utilizador) });
};

export const eliminarAgenda = (id) => {
  const agenda = obterAgenda(id);
  if (!agenda) throw new Error("Agenda não encontrada.");
  if (listarItens().some((i) => String(i.schedule_id) === String(id) && Number(i.valor_cobrado || 0) > 0)) {
    throw new Error("A agenda tem cobranças registadas e não pode ser eliminada.");
  }
  gravarLista(CHAVES.agendas, lerLista(CHAVES.agendas).filter((a) => String(a.id) !== String(id)));
  gravarLista(CHAVES.itens, listarItens().filter((i) => String(i.schedule_id) !== String(id)));
  gravarLista(CHAVES.rotas, listarRotas().filter((r) => String(r.schedule_id) !== String(id)));
};

export const sincronizarCobrancas = () => {
  let total = 0;
  const agora = agoraIso();
  gravarLista(CHAVES.itens, listarItens().map((i) => {
    if (i.sincronizado !== false) return i;
    total += 1;
    return { ...i, sincronizado: true, data_sincronizacao: agora };
  }));
  return total;
};

// ---------- Histórico e relatórios ----------

export const historicoCobrancas = () => {
  const agendas = Object.fromEntries(lerLista(CHAVES.agendas).map((a) => [String(a.id), a]));
  const clientes = Object.fromEntries(listarClientes().map((c) => [String(c.id), c]));
  const cobradores = Object.fromEntries(listarCobradores().map((c) => [String(c.id), c]));
  const zonas = Object.fromEntries(listarZonas().map((z) => [String(z.id), z]));
  return listarItens()
    .map((i) => {
      const agenda = agendas[String(i.schedule_id)];
      return { ...i, agenda, cliente: clientes[String(i.client_id)] || null, cobrador: cobradores[String(agenda?.collector_id)] || null, zona: zonas[String(agenda?.zona_id)] || null };
    })
    .filter((i) => i.agenda)
    .sort((a, b) => String(b.data_cobranca || b.agenda.data_agendada).localeCompare(String(a.data_cobranca || a.agenda.data_agendada)) || String(b.hora_cobranca || "").localeCompare(String(a.hora_cobranca || "")));
};

const agregar = (agendas, chave, nomeDoGrupo, comissaoDe) => {
  const grupos = new Map();
  agendas.forEach((a) => {
    const id = String(a[chave]);
    const g = grupos.get(id) || { id, nome: nomeDoGrupo(id), agendas: 0, clientes: 0, esperado: 0, cobrado: 0, comissao: 0 };
    g.agendas += 1;
    g.clientes += Number(a.total_clientes || 0);
    g.esperado = arredondar(g.esperado + Number(a.total_esperado || 0));
    g.cobrado = arredondar(g.cobrado + Number(a.total_cobrado || 0));
    g.comissao = arredondar(g.comissao + (comissaoDe ? comissaoDe(a) : 0));
    grupos.set(id, g);
  });
  return [...grupos.values()].map((g) => ({ ...g, taxa: taxaSucesso(g.cobrado, g.esperado) })).sort((a, b) => b.cobrado - a.cobrado);
};

const comissaoDaAgenda = (agenda) => {
  const cobrador = obterCobrador(agenda.collector_id);
  return arredondar(Number(agenda.total_cobrado || 0) * (Number(cobrador?.comissao_percentual || 0) / 100));
};

export const relatorioPeriodo = (de, ate) => {
  const agendas = listarAgendas().filter((a) => a.status !== "Cancelada" && a.data_agendada >= de && a.data_agendada <= ate);
  const ids = new Set(agendas.map((a) => String(a.id)));
  const itens = listarItens().filter((i) => ids.has(String(i.schedule_id)));
  const esperado = arredondar(agendas.reduce((s, a) => s + Number(a.total_esperado || 0), 0));
  const cobrado = arredondar(agendas.reduce((s, a) => s + Number(a.total_cobrado || 0), 0));
  return {
    de,
    ate,
    agendas,
    totais: {
      agendas: agendas.length,
      clientes: agendas.reduce((s, a) => s + Number(a.total_clientes || 0), 0),
      esperado,
      cobrado,
      taxa: taxaSucesso(cobrado, esperado),
      comissao: arredondar(agendas.reduce((s, a) => s + comissaoDaAgenda(a), 0)),
      cobrados: itens.filter((i) => i.status === "Cobrado").length,
      parciais: itens.filter((i) => i.status === "Parcialmente Cobrado").length,
      naoCobrados: itens.filter((i) => i.status === "Não Cobrado").length,
      reagendados: itens.filter((i) => i.status === "Reagendado").length,
    },
    porCobrador: agregar(agendas, "collector_id", (id) => obterCobrador(id)?.nome_completo || "Cobrador removido", comissaoDaAgenda),
    porZona: agregar(agendas, "zona_id", (id) => obterZona(id)?.nome || "Zona removida"),
  };
};

export const desempenhoCobrador = (cobradorId, mes = hojeIso().slice(0, 7)) => {
  const cobrador = obterCobrador(cobradorId);
  const agendas = agendasDoCobrador(cobradorId).filter((a) => a.status !== "Cancelada" && String(a.data_agendada).startsWith(mes));
  const esperado = arredondar(agendas.reduce((s, a) => s + Number(a.total_esperado || 0), 0));
  const cobrado = arredondar(agendas.reduce((s, a) => s + Number(a.total_cobrado || 0), 0));
  const meta = Number(cobrador?.meta_mensal || 0);
  return {
    agendas: agendas.length,
    esperado,
    cobrado,
    taxa: taxaSucesso(cobrado, esperado),
    comissao: arredondar(cobrado * (Number(cobrador?.comissao_percentual || 0) / 100)),
    meta,
    progressoMeta: meta > 0 ? (cobrado / meta) * 100 : 0,
  };
};

export const estatisticasZona = (zonaId) => {
  const clientes = clientesDaZona(zonaId);
  const ids = new Set(clientes.map((c) => String(c.id)));
  const hoje = hojeIso();
  let atrasados = 0;
  let valorAtraso = 0;
  listarEmprestimos().filter((e) => ids.has(String(e.client_id)) && ESTADOS_COBRAVEIS.includes(e.status)).forEach((e) => {
    const vencidas = parcelasAbertas(e).filter((p) => p.data_vencimento < hoje);
    if (vencidas.length) atrasados += 1;
    valorAtraso += vencidas.reduce((s, p) => s + detalheParcela(p, hoje).total_devido, 0);
  });
  return {
    clientes: clientes.length,
    cobradores: listarCobradores().filter((c) => String(c.zona_id) === String(zonaId) && c.status === "Ativo").length,
    atrasados,
    valorAtraso: arredondar(valorAtraso),
    agendas: listarAgendas().filter((a) => String(a.zona_id) === String(zonaId) && ["Pendente", "Em Curso"].includes(a.status)).length,
  };
};

// ---------- Notificações ----------

export const MODELOS_PADRAO = {
  "Lembrete Antes": { quando: "3 dias antes do vencimento", canais: ["SMS", "Email"], mensagem: "Olá {NOME}! Sua parcela de {VALOR} MT vence em {DIAS} dias ({DATA}). Pague e evite multas. {EMPRESA}" },
  "Lembrete No Dia": { quando: "No dia do vencimento", canais: ["SMS", "Email"], mensagem: "Olá {NOME}! Sua parcela de {VALOR} MT vence hoje ({DATA}). Pague agora. {EMPRESA}" },
  "Aviso Atraso": { quando: "1 dia após o vencimento", canais: ["SMS", "Email"], mensagem: "Olá {NOME}! Sua parcela de {VALOR} MT está em atraso há {DIAS} dias. Regularize. {EMPRESA}" },
  "Aviso Final": { quando: "7 dias após o vencimento", canais: ["SMS", "Email", "Chamada"], mensagem: "Olá {NOME}! Sua parcela de {VALOR} MT está em atraso há {DIAS} dias. Evite ações legais. {EMPRESA}" },
  "Acordo Pagamento": { quando: "Após negociação", canais: ["SMS", "Email"], mensagem: "Olá {NOME}! Acordo de pagamento registado para {DATA}. Valor: {VALOR} MT. {EMPRESA}" },
};

export const configuracaoNotificacoes = () => {
  const base = {
    empresa: REGRAS.nomeEmpresa,
    diasAntes: REGRAS.diasLembreteAntes,
    diasApos: REGRAS.diasLembreteApos,
    diasFinal: 7,
  };
  try {
    const guardada = JSON.parse(localStorage.getItem(CHAVES.configuracao) || "null");
    const modelos = Object.fromEntries(TIPOS_NOTIFICACAO.map((t) => [t, { ...MODELOS_PADRAO[t], activo: true, ...(guardada?.modelos?.[t] || {}) }]));
    const config = { ...base, ...(guardada || {}), modelos };
    if (modelos["Lembrete Antes"]) modelos["Lembrete Antes"].quando = `${config.diasAntes} dia(s) antes do vencimento`;
    if (modelos["Aviso Atraso"]) modelos["Aviso Atraso"].quando = `${config.diasApos} dia(s) após o vencimento`;
    return config;
  } catch {
    return { ...base, modelos: Object.fromEntries(TIPOS_NOTIFICACAO.map((t) => [t, { ...MODELOS_PADRAO[t], activo: true }])) };
  }
};

export const guardarConfiguracaoNotificacoes = (config) => {
  if (!texto(config.empresa)) throw new Error("Indique o nome da empresa.");
  const diasAntes = Number(config.diasAntes);
  const diasFinal = Number(config.diasFinal);
  if (!Number.isInteger(diasAntes) || diasAntes < 1 || diasAntes > 30) throw new Error("Os dias do lembrete antes devem estar entre 1 e 30.");
  if (!Number.isInteger(diasFinal) || diasFinal < 2 || diasFinal > 90) throw new Error("Os dias do aviso final devem estar entre 2 e 90.");
  TIPOS_NOTIFICACAO.forEach((t) => {
    if (!texto(config.modelos[t]?.mensagem)) throw new Error(`Escreva a mensagem de «${t}».`);
    if (!config.modelos[t]?.canais?.length) throw new Error(`Escolha pelo menos um canal para «${t}».`);
  });
  localStorage.setItem(CHAVES.configuracao, JSON.stringify({ ...config, empresa: texto(config.empresa), diasAntes, diasFinal }));
};

const valorSemMoeda = (v) => Number(v || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const montarMensagem = (modelo, { nome, valor, dias, data }, empresa) =>
  String(modelo || "")
    .replaceAll("{NOME}", String(nome || "").split(" ")[0] || "Cliente")
    .replaceAll("{VALOR}", valorSemMoeda(valor))
    .replaceAll("{DIAS}", String(dias ?? ""))
    .replaceAll("{DATA}", formatarData(data))
    .replaceAll("{EMPRESA}", empresa || "");

export const listarNotificacoes = () => lerLista(CHAVES.notificacoes).sort((a, b) => String(b.data_registo).localeCompare(String(a.data_registo)));

const canalPreferido = (canais, cliente) => {
  const lista = canais?.length ? canais : ["SMS"];
  if (lista[0] === "Email" && !cliente?.email) return lista.find((c) => c !== "Email") || "SMS";
  return lista[0];
};

const criarNotificacao = ({ client_id, loan_id, installment_id, tipo, valor, data, dias }, utilizador, automatica = false) => {
  const config = configuracaoNotificacoes();
  const modelo = config.modelos[tipo];
  if (!modelo?.activo) return null;
  const cliente = obterCliente(client_id);
  const agora = agoraIso();
  const notificacao = {
    id: crypto.randomUUID(),
    client_id,
    loan_id,
    installment_id: installment_id || null,
    tipo_notificacao: tipo,
    canal: canalPreferido(modelo.canais, cliente),
    mensagem: montarMensagem(modelo.mensagem, { nome: cliente?.nome_completo, valor, dias, data }, config.empresa),
    data_envio: null,
    status: "Pendente",
    resposta_cliente: "",
    data_resposta: null,
    observacoes: "",
    automatica,
    data_referencia: data,
    criado_por: automatica ? "Sistema" : nomeDe(utilizador),
    data_registo: agora,
  };
  gravarLista(CHAVES.notificacoes, [...lerLista(CHAVES.notificacoes), notificacao]);
  return notificacao;
};

export const gerarNotificacoesAutomaticas = (utilizador) => {
  const config = configuracaoNotificacoes();
  const hoje = hojeIso();
  const existentes = new Set(lerLista(CHAVES.notificacoes).map((n) => `${n.installment_id}|${n.tipo_notificacao}`));
  const clientes = Object.fromEntries(listarClientes().map((c) => [String(c.id), c]));
  const novas = [];
  listarEmprestimos().filter((e) => ESTADOS_COBRAVEIS.includes(e.status)).forEach((e) => {
    if (!clientes[String(e.client_id)]) return;
    parcelasAbertas(e).forEach((p) => {
      const antes = p.data_vencimento > hoje ? diasEntre(hoje, p.data_vencimento) : 0;
      const atraso = p.data_vencimento < hoje ? diasEntre(p.data_vencimento, hoje) : 0;
      let tipo = null;
      if (antes >= 1 && antes <= config.diasAntes) tipo = "Lembrete Antes";
      else if (p.data_vencimento === hoje) tipo = "Lembrete No Dia";
      else if (atraso >= config.diasFinal) tipo = "Aviso Final";
      else if (atraso >= Number(config.diasApos || 1)) tipo = "Aviso Atraso";
      if (!tipo || existentes.has(`${p.id}|${tipo}`)) return;
      const d = detalheParcela(p, hoje);
      const criada = criarNotificacao({ client_id: e.client_id, loan_id: e.id, installment_id: p.id, tipo, valor: d.total_devido, data: p.data_vencimento, dias: antes || atraso }, utilizador, true);
      if (criada) {
        existentes.add(`${p.id}|${tipo}`);
        novas.push(criada);
      }
    });
  });
  return novas;
};

const telefoneInternacional = (tel) => {
  const limpo = String(tel || "").replace(/[^\d]/g, "");
  if (!limpo) return "";
  return limpo.startsWith("258") ? limpo : `258${limpo}`;
};

export const ligacaoNotificacao = (notificacao, canal = notificacao.canal) => {
  const cliente = obterCliente(notificacao.client_id);
  const tel = telefoneInternacional(cliente?.telefone_principal);
  const msg = encodeURIComponent(notificacao.mensagem);
  if (canal === "SMS") return tel ? `sms:+${tel}?body=${msg}` : null;
  if (canal === "WhatsApp") return tel ? `https://wa.me/${tel}?text=${msg}` : null;
  if (canal === "Chamada") return tel ? `tel:+${tel}` : null;
  if (canal === "Email") return cliente?.email ? `mailto:${cliente.email}?subject=${encodeURIComponent(notificacao.tipo_notificacao)}&body=${msg}` : null;
  return null;
};

const alterarNotificacao = (id, mudar) => {
  const lista = lerLista(CHAVES.notificacoes);
  const idx = lista.findIndex((n) => String(n.id) === String(id));
  if (idx < 0) throw new Error("Notificação não encontrada.");
  lista[idx] = mudar(lista[idx]);
  gravarLista(CHAVES.notificacoes, lista);
  return lista[idx];
};

export const enviarNotificacao = (id, canal) => {
  const actual = lerLista(CHAVES.notificacoes).find((n) => String(n.id) === String(id));
  if (!actual) throw new Error("Notificação não encontrada.");
  const escolhido = CANAIS.includes(canal) ? canal : actual.canal;
  const ligacao = ligacaoNotificacao(actual, escolhido);
  if (!ligacao && escolhido !== "Presencial") throw new Error(escolhido === "Email" ? "O cliente não tem email registado." : "O cliente não tem telefone registado.");
  const notificacao = alterarNotificacao(id, (n) => ({ ...n, canal: escolhido, status: "Enviada", data_envio: agoraIso() }));
  return { notificacao, ligacao };
};

export const actualizarNotificacao = (id, { status, resposta_cliente, observacoes }) =>
  alterarNotificacao(id, (n) => {
    const resposta = texto(resposta_cliente);
    return {
      ...n,
      status: ESTADOS_NOTIFICACAO.includes(status) ? status : n.status,
      resposta_cliente: resposta || n.resposta_cliente,
      data_resposta: resposta && resposta !== n.resposta_cliente ? agoraIso() : n.data_resposta,
      observacoes: observacoes !== undefined ? texto(observacoes) : n.observacoes,
    };
  });

export const eliminarNotificacao = (id) => gravarLista(CHAVES.notificacoes, lerLista(CHAVES.notificacoes).filter((n) => String(n.id) !== String(id)));

export const resumoCobrancas = () => {
  const hoje = hojeIso();
  const agendas = listarAgendas();
  const deHoje = agendas.filter((a) => a.data_agendada === hoje && a.status !== "Cancelada");
  const esperado = arredondar(deHoje.reduce((s, a) => s + Number(a.total_esperado || 0), 0));
  const cobrado = arredondar(deHoje.reduce((s, a) => s + Number(a.total_cobrado || 0), 0));
  return {
    total: agendas.length,
    hoje: deHoje.length,
    esperadoHoje: esperado,
    cobradoHoje: cobrado,
    taxaHoje: taxaSucesso(cobrado, esperado),
    emCurso: agendas.filter((a) => a.status === "Em Curso").length,
    pendentes: agendas.filter((a) => a.status === "Pendente").length,
  };
};
