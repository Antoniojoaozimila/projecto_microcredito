import { useEffect, useState } from "react";

const ouvintes = new Set();
const avisar = () => ouvintes.forEach((fn) => fn());

const vazio = () => ({
  clientes: [],
  emprestimos: [],
  pagamentos: [],
  garantias: [],
  carteiras: [],
  movimentos: [],
  despesas: [],
  agendas: [],
  cobrancas: [],
  cobradores: [],
  zonas: [],
  utilizadores: [],
  empresa: null,
  auditoria: [],
  origem: "servidor",
  avisoApi: "",
});

export const dados = vazio();

export const esvaziarDados = () => {
  Object.assign(dados, vazio());
  avisar();
};

export const aplicarServidor = (parcial) => {
  Object.assign(dados, parcial, { origem: "servidor", avisoApi: "" });
  avisar();
};

export const marcarAvisoApi = (mensagem) => {
  dados.avisoApi = mensagem || "";
  avisar();
};

export function usarDados() {
  const [, atualizar] = useState(0);
  useEffect(() => {
    const fn = () => atualizar((n) => n + 1);
    ouvintes.add(fn);
    return () => ouvintes.delete(fn);
  }, []);
  return dados;
}

export const guardarCliente = (cliente) => {
  dados.clientes = [{ ...cliente, id: cliente.id || String(Date.now()) }, ...dados.clientes.filter((item) => item.id !== cliente.id)];
  avisar();
};

export const guardarEmprestimo = (item) => {
  dados.emprestimos = [{ ...item, id: item.id || String(Date.now()) }, ...dados.emprestimos];
  avisar();
};

export const guardarPagamento = (item) => {
  const valor = Number(item.valor) || 0;
  const recibo = item.recibo || `RC-${2210 + dados.pagamentos.length}`;
  const emp = dados.emprestimos.find((e) => e.id === item.emprestimoId || e.contrato === item.contrato);
  let juros = Number(item.juros);
  let capital = Number(item.capital);
  if (!Number.isFinite(juros)) juros = Math.round(valor * (Number(emp?.taxa) || 0)) / 100;
  if (!Number.isFinite(capital)) capital = Math.max(0, valor - juros);
  if (emp) {
    const plano = emp.plano || [];
    if (item.tipo === "Quitação Total") {
      plano.forEach((parcela) => { if (parcela.status !== "Pago") parcela.status = "Pago"; });
      emp.saldo = 0;
      emp.estado = "Quitado";
    } else {
      const alvo = plano.find((parcela) => parcela.id === item.parcelaId) || plano.find((parcela) => parcela.status !== "Pago");
      if (alvo && valor + 0.5 >= Number(alvo.valor_parcela)) alvo.status = "Pago";
      emp.saldo = Math.max(0, Number(emp.saldo || 0) - (alvo && valor + 0.5 >= Number(alvo.valor_parcela) ? Number(alvo.valor_parcela) : capital));
      const aindaAtraso = plano.some((parcela) => parcela.status === "Atrasado");
      if (emp.saldo <= 0) emp.estado = "Quitado";
      else if (!aindaAtraso && emp.estado === "Em atraso") emp.estado = "Activo";
    }
    const carteira = dados.carteiras.find((c) => c.nome === item.carteira);
    if (carteira) carteira.saldo += valor;
  }
  dados.pagamentos = [{ ...item, id: String(Date.now()), recibo, valor, juros, capital, estado: item.estado || "Confirmado" }, ...dados.pagamentos];
  avisar();
  return recibo;
};

export const guardarGarantia = (item) => {
  dados.garantias = [{ ...item, id: item.id || String(Date.now()), estado: item.estado || "Ativa" }, ...dados.garantias.filter((g) => g.id !== item.id)];
  avisar();
};

export const mudarGarantia = (id, estado) => {
  dados.garantias = dados.garantias.map((item) => (item.id === id ? { ...item, estado } : item));
  avisar();
};

export const guardarCarteira = (item) => {
  dados.carteiras = [{ ...item, id: item.id || String(Date.now()), saldo: Number(item.saldo) || 0 }, ...dados.carteiras.filter((c) => c.id !== item.id)];
  avisar();
};

export const guardarMovimento = (item) => {
  const valor = Number(item.valor) || 0;
  const origem = dados.carteiras.find((c) => c.nome === item.origem);
  const destino = dados.carteiras.find((c) => c.nome === item.destino);
  if (!origem || !destino || origem.nome === destino.nome) return "Escolha duas carteiras diferentes.";
  if (valor <= 0) return "Indique um valor maior que zero.";
  if (Number(origem.saldo) < valor) return "Saldo insuficiente na carteira de origem.";
  origem.saldo -= valor;
  destino.saldo += valor;
  dados.movimentos = [{ ...item, id: String(Date.now()), valor, tipo: "Transferência" }, ...dados.movimentos];
  avisar();
  return "";
};

export const guardarDespesa = (item) => {
  const valor = Number(item.valor) || 0;
  const carteira = dados.carteiras.find((c) => c.nome === item.carteira);
  if (!carteira) return "Escolha a carteira.";
  if (!String(item.categoria || "").trim() || !String(item.descricao || "").trim()) return "Categoria e descrição são obrigatórias.";
  if (valor <= 0) return "Indique um valor maior que zero.";
  if (Number(carteira.saldo) < valor) return "Saldo insuficiente nesta carteira.";
  carteira.saldo -= valor;
  dados.despesas = [{ ...item, id: String(Date.now()), valor, estado: "Paga", codigo: item.codigo || `DS-${3100 + dados.despesas.length}` }, ...dados.despesas];
  avisar();
  return "";
};

export const guardarAgenda = (item) => {
  dados.agendas = [{ ...item, id: item.id || String(Date.now()), estado: item.estado || "Agendada" }, ...dados.agendas.filter((a) => a.id !== item.id)];
  avisar();
};

export const guardarCobrador = (item) => {
  dados.cobradores = [{ ...item, id: item.id || String(Date.now()) }, ...dados.cobradores.filter((c) => c.id !== item.id)];
  avisar();
};

export const guardarZona = (item) => {
  dados.zonas = [{ ...item, id: item.id || String(Date.now()) }, ...dados.zonas.filter((z) => z.id !== item.id)];
  avisar();
};

export const pontoDe = (texto) => {
  const [lat, lon] = String(texto || "").split(",").map((parte) => Number(parte.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
};

const hojeIso = () => new Date().toISOString().slice(0, 10);
const garantiaDe = (id) => dados.garantias.find((item) => item.id === id);

export const aprovarGarantia = (id) => {
  const garantia = garantiaDe(id);
  if (!garantia || garantia.estado !== "Em Avaliação") return;
  garantia.estado = "Ativa";
  avisar();
};

export const penhorarGarantia = (id) => {
  const garantia = garantiaDe(id);
  if (!garantia || garantia.estado !== "Ativa") return;
  garantia.estado = "Penhorada";
  garantia.dataPenhor = hojeIso();
  avisar();
};

export const notificarGarantia = (id, meio) => {
  const garantia = garantiaDe(id);
  if (!garantia || garantia.estado !== "Penhorada" || !meio) return;
  garantia.notificacao = { meio, data: hojeIso() };
  avisar();
};

export const executarGarantia = (id, motivo, valorRecuperado) => {
  const garantia = garantiaDe(id);
  if (!garantia || garantia.estado !== "Penhorada") return;
  garantia.estado = "Executada";
  garantia.dataExecucao = hojeIso();
  garantia.motivo = String(motivo || "").trim();
  garantia.valorRecuperado = Number(valorRecuperado) || 0;
  avisar();
};

const paragemDe = (emp, ordem) => {
  const cliente = dados.clientes.find((item) => item.id === emp.clienteId);
  const ponto = pontoDe(cliente?.coordenadas_gps);
  const parcela = (emp.plano || []).find((item) => item.status !== "Pago");
  return {
    id: `${emp.id}-${ordem}`,
    ordem,
    cliente: emp.cliente,
    telefone: cliente?.telefone_principal || "",
    endereco: cliente?.endereco_completo || cliente?.bairro || "",
    lat: ponto?.lat,
    lon: ponto?.lon,
    contrato: emp.contrato,
    emprestimoId: emp.id,
    parcela: parcela ? `${parcela.numero}/${emp.parcelas}` : "",
    parcelaId: parcela?.id,
    esperado: Number(emp.prestacao || 0),
    cobrado: 0,
    estado: "Pendente",
  };
};

export const mudarAgenda = (id, estado) => {
  const agenda = dados.agendas.find((item) => item.id === id);
  if (!agenda) return;
  agenda.estado = estado;
  avisar();
};

export const registarVisita = (agendaId, paragemId, info) => {
  const agenda = dados.agendas.find((item) => item.id === agendaId);
  const paragem = agenda?.paragens?.find((item) => item.id === paragemId);
  if (!agenda || !paragem) return;
  const cobrado = Number(info.cobrado) || 0;
  const delta = cobrado - (Number(paragem.cobrado) || 0);
  paragem.estado = info.estado;
  paragem.cobrado = cobrado;
  paragem.motivo = info.motivo || "";
  paragem.promessa = info.promessa || "";
  agenda.cobrado = agenda.paragens.reduce((soma, item) => soma + Number(item.cobrado || 0), 0);
  if (delta > 0) {
    guardarPagamento({
      emprestimoId: paragem.emprestimoId,
      contrato: paragem.contrato,
      cliente: paragem.cliente,
      valor: delta,
      data: hojeIso(),
      hora: new Date().toTimeString().slice(0, 5),
      forma: info.forma || "Dinheiro",
      tipo: cobrado + 0.5 >= Number(paragem.esperado) ? "Pagamento de Parcela" : "Pagamento Parcial",
      carteira: info.carteira || "Caixa",
      parcela: paragem.parcela,
      parcelaId: paragem.parcelaId,
      estado: "Confirmado",
    });
    const cobrador = dados.cobradores.find((item) => item.nome === agenda.cobrador);
    if (cobrador) cobrador.cobradoMes = Number(cobrador.cobradoMes || 0) + delta;
  }
  dados.cobrancas = [{
    id: `h-${Date.now()}`,
    data: hojeIso(),
    cliente: paragem.cliente,
    contrato: paragem.contrato,
    parcela: paragem.parcela,
    cobrador: agenda.cobrador,
    zona: agenda.zona,
    esperado: paragem.esperado,
    cobrado,
    estado: info.estado,
  }, ...dados.cobrancas];
  avisar();
};

export const gerarRotaDoDia = () => {
  const dia = hojeIso();
  if (dados.agendas.some((item) => item.data === dia && item.estado !== "Cancelada")) return 0;
  const atrasados = dados.emprestimos.filter((item) => item.estado === "Em atraso");
  const paragens = atrasados.map(paragemDe);
  dados.agendas = [{
    id: `a-${Date.now()}`,
    codigo: `AG-${1000 + dados.agendas.length}`,
    data: dia,
    inicio: "08:30",
    fim: "12:30",
    cobrador: dados.cobradores.find((item) => item.estado === "Activo")?.nome || "Cobrador",
    zona: dados.zonas.find((item) => item.estado === "Ativa")?.nome || "Zona",
    clientes: atrasados.map((item) => item.cliente),
    paragens,
    estado: "Pendente",
    esperado: paragens.reduce((soma, item) => soma + Number(item.esperado || 0), 0),
    cobrado: 0,
  }, ...dados.agendas];
  avisar();
  return atrasados.length;
};
