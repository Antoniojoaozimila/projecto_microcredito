import { useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import {
  IconeAlerta, IconeCarteira, IconeDocumento, IconeEdificio, IconeEquipa, IconeEscudo,
  IconeGrafico, IconeMapa, IconeMoeda, IconePessoa, IconePin, IconeSino,
} from "../../componentes/Icones";
import {
  dados, guardarAgenda, guardarCarteira, guardarCobrador, guardarDespesa, guardarEmprestimo,
  guardarGarantia, guardarMovimento, guardarPagamento, guardarZona, mudarGarantia, pontoDe, usarDados,
} from "../../dados/operacao";
import { cores, fonte } from "../../tema";
import Mapa from "./Mapa";
import { Botao, Caixa, Campo, Chips, Faixa, Linha, Seccao } from "./pecas";

const mt = (valor) => `${Number(valor || 0).toLocaleString("pt-PT")} MT`;
const paginaDe = (lista, pagina) => lista.slice((pagina - 1) * 5, pagina * 5);

const Paginacao = ({ pagina, total, onMudar }) => {
  const paginas = Math.max(1, Math.ceil(total / 5));
  if (paginas <= 1) return null;
  return (
    <View style={estilos.paginas}>
      <Pressable onPress={() => onMudar(Math.max(1, pagina - 1))}><Text style={estilos.pagina}>Anterior</Text></Pressable>
      <Text style={estilos.pagina}>{pagina} / {paginas}</Text>
      <Pressable onPress={() => onMudar(Math.min(paginas, pagina + 1))}><Text style={estilos.pagina}>Seguinte</Text></Pressable>
    </View>
  );
};

const Moldura = ({ children }) => (
  <ScrollView style={estilos.scroll} contentContainerStyle={estilos.pagina} keyboardShouldPersistTaps="handled">{children}</ScrollView>
);

const ListaClientes = ({ onVoltar }) => {
  const { clientes } = usarDados();
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const lista = clientes.filter((c) => `${c.nome_completo} ${c.cidade} ${c.telefone_principal}`.toLowerCase().includes(busca.toLowerCase()));
  return (
    <Moldura>
      <Faixa titulo="Listar clientes" sub={`${clientes.length} clientes`} Icone={IconeEquipa} cor="#1d4ed8" onVoltar={onVoltar} />
      <Caixa value={busca} onChangeText={(v) => { setBusca(v); setPagina(1); }} placeholder="Pesquisar nome, cidade ou telefone" />
      {paginaDe(lista, pagina).map((c) => (
        <Linha key={c.id} Icone={IconePessoa} cor="#1d4ed8" titulo={c.nome_completo} nota={`${c.tipo_cliente} · ${c.cidade} · ${c.telefone_principal}`} />
      ))}
      <Paginacao pagina={pagina} total={lista.length} onMudar={setPagina} />
    </Moldura>
  );
};

const MapaClientes = ({ onVoltar }) => {
  const { clientes } = usarDados();
  const pontos = clientes.map((c) => {
    const ponto = pontoDe(c.coordenadas_gps);
    return ponto ? { ...ponto, titulo: c.nome_completo, texto: `${c.cidade} · ${c.zona_id || ""}` } : null;
  }).filter(Boolean);
  return (
    <Moldura>
      <Faixa titulo="Mapa de clientes" sub="Moçambique, com a posição de cada cliente" Icone={IconeMapa} cor="#0369a1" onVoltar={onVoltar} />
      <Mapa pontos={pontos} />
      {clientes.map((c) => <Linha key={c.id} Icone={IconePin} cor="#0369a1" titulo={c.nome_completo} nota={`${c.provincia} · ${c.cidade} · ${c.coordenadas_gps || "sem GPS"}`} />)}
    </Moldura>
  );
};

const NovoEmprestimo = ({ onVoltar }) => {
  const { clientes, carteiras } = usarDados();
  const [form, setForm] = useState({ clienteId: clientes[0]?.id || "", valor: "", modalidade: "Mensal", parcelas: "6", taxa: "4.5", tipo_juros: "Simples", sistema: "Tabela Price", inicio: "", vencimento: "", garantia: "Sem Garantia", garantiaOutra: "", descricao: "", valorGarantia: "", carteira: carteiras[0]?.nome || "", observacoes: "" });
  const [aviso, setAviso] = useState("");
  const set = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }));
  const cliente = clientes.find((c) => c.id === form.clienteId);
  const resumo = useMemo(() => {
    const valor = Number(form.valor) || 0;
    const n = Number(form.parcelas) || 1;
    const taxa = Number(form.taxa) || 0;
    const total = valor * (1 + taxa / 100);
    return { total, parcela: n ? total / n : 0 };
  }, [form.parcelas, form.taxa, form.valor]);
  const guardar = () => {
    if (!cliente || !(Number(form.valor) > 0)) { setAviso("Escolha o cliente e o valor."); return; }
    const numero = `EMP-${1040 + dados.emprestimos.length + 1}`;
    guardarEmprestimo({ contrato: numero, clienteId: cliente.id, cliente: cliente.nome_completo, valor: Number(form.valor), taxa: Number(form.taxa), parcelas: Number(form.parcelas), modalidade: form.modalidade, tipo_juros: form.tipo_juros === "Outro" ? form.garantiaOutra : form.tipo_juros, sistema: form.sistema, inicio: form.inicio, vencimento: form.vencimento, garantia: form.garantia === "Outro" ? form.garantiaOutra : form.garantia, estado: "Activo", carteira: form.carteira, observacoes: form.observacoes });
    setAviso(`Empréstimo ${numero} registado.`);
  };
  return (
    <Moldura>
      <Faixa titulo="Novo empréstimo" sub="Contrato, juros, garantia e desembolso" Icone={IconeMoeda} cor="#166534" onVoltar={onVoltar} />
      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      <Seccao Icone={IconePessoa} titulo="Cliente" cor="#1d4ed8">
        <Chips valor={cliente?.nome_completo} opcoes={clientes.map((c) => c.nome_completo)} onChange={(nome) => set("clienteId", clientes.find((c) => c.nome_completo === nome)?.id)} />
      </Seccao>
      <Seccao Icone={IconeMoeda} titulo="Dados do empréstimo" cor="#166534">
        <Campo rotulo="Valor (MT) *"><Caixa value={form.valor} keyboardType="decimal-pad" onChangeText={(v) => set("valor", v)} /></Campo>
        <Campo rotulo="Modalidade *"><Chips valor={form.modalidade} opcoes={["Diária", "Semanal", "Quinzenal", "Mensal"]} onChange={(v) => set("modalidade", v)} /></Campo>
        <Campo rotulo="Nº de parcelas *"><Caixa value={form.parcelas} keyboardType="number-pad" onChangeText={(v) => set("parcelas", v)} /></Campo>
        <Campo rotulo="Taxa de juros (%) *"><Caixa value={form.taxa} keyboardType="decimal-pad" onChangeText={(v) => set("taxa", v)} /></Campo>
        <Campo rotulo="Tipo de juros *"><Chips valor={form.tipo_juros} opcoes={["Simples", "Composto", "Outro"]} onChange={(v) => set("tipo_juros", v)} /></Campo>
        <Campo rotulo="Data de início *"><Caixa value={form.inicio} placeholder="AAAA-MM-DD" onChangeText={(v) => set("inicio", v)} /></Campo>
        <Campo rotulo="Sistema de amortização *"><Chips valor={form.sistema} opcoes={["Tabela Price", "SAC", "Americano"]} onChange={(v) => set("sistema", v)} /></Campo>
        <Campo rotulo="Data do 1.º vencimento *"><Caixa value={form.vencimento} placeholder="AAAA-MM-DD" onChangeText={(v) => set("vencimento", v)} /></Campo>
      </Seccao>
      <Seccao Icone={IconeGrafico} titulo="Resumo do cálculo" cor="#0f766e">
        <Text style={estilos.nota}>Total com juros: {mt(resumo.total)}</Text>
        <Text style={estilos.nota}>Prestação estimada: {mt(resumo.parcela)}</Text>
      </Seccao>
      <Seccao Icone={IconeEscudo} titulo="Garantias" cor="#9a3412">
        <Chips valor={form.garantia} opcoes={["Sem Garantia", "Aval/Fiador", "Bem Móvel", "Bem Imóvel", "Cheque Caução", "Depósito Caução", "Outro"]} onChange={(v) => set("garantia", v)} />
        {form.garantia === "Outro" ? <Caixa value={form.garantiaOutra} placeholder="Tipo de garantia" onChangeText={(v) => set("garantiaOutra", v)} /> : null}
        {form.garantia !== "Sem Garantia" ? (
          <>
            <Campo rotulo="Descrição da garantia *"><Caixa value={form.descricao} onChangeText={(v) => set("descricao", v)} /></Campo>
            <Campo rotulo="Valor estimado (MT) *"><Caixa value={form.valorGarantia} keyboardType="decimal-pad" onChangeText={(v) => set("valorGarantia", v)} /></Campo>
          </>
        ) : null}
      </Seccao>
      <Seccao Icone={IconeCarteira} titulo="Carteira de desembolso" cor="#1e3a8a">
        <Chips valor={form.carteira} opcoes={carteiras.map((c) => c.nome)} onChange={(v) => set("carteira", v)} />
      </Seccao>
      <Campo rotulo="Observações"><Caixa value={form.observacoes} multiline onChangeText={(v) => set("observacoes", v)} /></Campo>
      <Botao texto="Registar empréstimo" onPress={guardar} />
    </Moldura>
  );
};

const ListaEmprestimos = ({ onVoltar, filtro }) => {
  const { emprestimos } = usarDados();
  const [pagina, setPagina] = useState(1);
  const lista = emprestimos.filter((e) => !filtro || e.estado === filtro);
  return (
    <Moldura>
      <Faixa titulo={filtro || "Listar empréstimos"} sub={`${lista.length} contratos`} Icone={IconeDocumento} cor="#166534" onVoltar={onVoltar} />
      {paginaDe(lista, pagina).map((e) => <Linha key={e.id} Icone={IconeMoeda} cor="#166534" titulo={e.contrato} nota={`${e.cliente} · ${mt(e.valor)} · ${e.estado}`} />)}
      <Paginacao pagina={pagina} total={lista.length} onMudar={setPagina} />
    </Moldura>
  );
};

const Calendario = ({ onVoltar }) => {
  const { emprestimos } = usarDados();
  const dias = emprestimos.map((e) => ({ dia: (e.vencimento || "").slice(8, 10) || "--", ...e }));
  return (
    <Moldura>
      <Faixa titulo="Calendário" sub="Vencimentos dos contratos" Icone={IconeDocumento} cor="#0f766e" onVoltar={onVoltar} />
      <View style={estilos.grelha}>
        {dias.map((e) => (
          <View key={e.id} style={estilos.dia}>
            <Text style={estilos.diaNum}>{e.dia}</Text>
            <Text style={estilos.nota}>{e.contrato}</Text>
          </View>
        ))}
      </View>
      {emprestimos.map((e) => <Linha key={e.id} Icone={IconeDocumento} cor="#0f766e" titulo={e.vencimento || "Sem data"} nota={`${e.contrato} · ${e.cliente} · ${e.modalidade}`} />)}
    </Moldura>
  );
};

const RegistarPagamento = ({ onVoltar }) => {
  const { emprestimos } = usarDados();
  const [form, setForm] = useState({ contrato: emprestimos[0]?.contrato || "", valor: "", data: "", hora: "", forma: "M-Pesa", tipo: "Parcela", referencia: "", observacoes: "" });
  const [aviso, setAviso] = useState("");
  const set = (c, v) => setForm((a) => ({ ...a, [c]: v }));
  const emp = emprestimos.find((e) => e.contrato === form.contrato);
  const juros = emp ? (Number(form.valor) || 0) * (Number(emp.taxa) || 0) / 100 : 0;
  return (
    <Moldura>
      <Faixa titulo="Registar pagamento" sub="Parcela, forma e comprovativo" Icone={IconeCarteira} cor="#0f766e" onVoltar={onVoltar} />
      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      <Seccao Icone={IconeDocumento} titulo="Empréstimo" cor="#166534">
        <Chips valor={form.contrato} opcoes={emprestimos.map((e) => e.contrato)} onChange={(v) => set("contrato", v)} />
        {emp ? <Text style={estilos.nota}>{emp.cliente} · em dívida {mt(emp.valor)}</Text> : null}
      </Seccao>
      <Seccao Icone={IconeMoeda} titulo="Dados do pagamento" cor="#0f766e">
        <Campo rotulo="Valor (MT) *"><Caixa value={form.valor} keyboardType="decimal-pad" onChangeText={(v) => set("valor", v)} /></Campo>
        <Campo rotulo="Data *"><Caixa value={form.data} placeholder="AAAA-MM-DD" onChangeText={(v) => set("data", v)} /></Campo>
        <Campo rotulo="Hora"><Caixa value={form.hora} placeholder="09:30" onChangeText={(v) => set("hora", v)} /></Campo>
        <Campo rotulo="Forma *"><Chips valor={form.forma} opcoes={["Dinheiro", "M-Pesa", "E-Mola", "Banco"]} onChange={(v) => set("forma", v)} /></Campo>
        <Campo rotulo="Tipo *"><Chips valor={form.tipo} opcoes={["Parcela", "Abatimento", "Liquidação"]} onChange={(v) => set("tipo", v)} /></Campo>
        <Campo rotulo="Referência"><Caixa value={form.referencia} onChangeText={(v) => set("referencia", v)} /></Campo>
        <Campo rotulo="Observações"><Caixa value={form.observacoes} onChangeText={(v) => set("observacoes", v)} /></Campo>
      </Seccao>
      <Seccao Icone={IconeGrafico} titulo="Alocação automática" cor="#1e3a8a">
        <Text style={estilos.nota}>Juros estimados: {mt(juros)}</Text>
        <Text style={estilos.nota}>Capital: {mt((Number(form.valor) || 0) - juros)}</Text>
      </Seccao>
      <Botao texto="Confirmar pagamento" onPress={() => {
        if (!form.contrato || !(Number(form.valor) > 0)) { setAviso("Indique o contrato e o valor."); return; }
        guardarPagamento({ ...form, valor: Number(form.valor), estado: "Confirmado" });
        setAviso("Pagamento registado.");
      }} />
    </Moldura>
  );
};

const Historico = ({ onVoltar }) => {
  const { pagamentos } = usarDados();
  const [pagina, setPagina] = useState(1);
  return (
    <Moldura>
      <Faixa titulo="Histórico de pagamentos" sub={`${pagamentos.length} recibos`} Icone={IconeDocumento} cor="#0f766e" onVoltar={onVoltar} />
      {paginaDe(pagamentos, pagina).map((p) => <Linha key={p.id} Icone={IconeCarteira} cor="#0f766e" titulo={p.contrato} nota={`${mt(p.valor)} · ${p.forma} · ${p.data} ${p.hora || ""}`} />)}
      <Paginacao pagina={pagina} total={pagamentos.length} onMudar={setPagina} />
    </Moldura>
  );
};

const NovaGarantia = ({ onVoltar }) => {
  const { emprestimos } = usarDados();
  const [form, setForm] = useState({ contrato: emprestimos[0]?.contrato || "", tipo: "Bem Móvel", descricao: "", conservacao: "Bom", local: "", valor: "", avaliado: "", avaliador: "", nomeAval: "", docAval: "", telAval: "", enderecoAval: "", observacoes: "" });
  const [aviso, setAviso] = useState("");
  const set = (c, v) => setForm((a) => ({ ...a, [c]: v }));
  return (
    <Moldura>
      <Faixa titulo="Nova garantia" sub="Bem, avaliação e avalista" Icone={IconeEscudo} cor="#9a3412" onVoltar={onVoltar} />
      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      <Seccao Icone={IconeDocumento} titulo="Empréstimo associado" cor="#166534">
        <Chips valor={form.contrato} opcoes={emprestimos.map((e) => e.contrato)} onChange={(v) => set("contrato", v)} />
      </Seccao>
      <Seccao Icone={IconeEscudo} titulo="Tipo de garantia" cor="#9a3412">
        <Chips valor={form.tipo} opcoes={["Aval/Fiador", "Bem Móvel", "Bem Imóvel", "Cheque Caução", "Depósito Caução"]} onChange={(v) => set("tipo", v)} />
        <Campo rotulo="Descrição *"><Caixa value={form.descricao} onChangeText={(v) => set("descricao", v)} /></Campo>
        <Campo rotulo="Estado de conservação"><Chips valor={form.conservacao} opcoes={["Novo", "Bom", "Razoável", "Mau"]} onChange={(v) => set("conservacao", v)} /></Campo>
        <Campo rotulo="Localização"><Caixa value={form.local} onChangeText={(v) => set("local", v)} /></Campo>
      </Seccao>
      <Seccao Icone={IconeMoeda} titulo="Avaliação" cor="#166534">
        <Campo rotulo="Valor estimado (MT) *"><Caixa value={form.valor} keyboardType="decimal-pad" onChangeText={(v) => set("valor", v)} /></Campo>
        <Campo rotulo="Valor avaliado (MT)"><Caixa value={form.avaliado} keyboardType="decimal-pad" onChangeText={(v) => set("avaliado", v)} /></Campo>
        <Campo rotulo="Avaliador"><Caixa value={form.avaliador} onChangeText={(v) => set("avaliador", v)} /></Campo>
      </Seccao>
      {form.tipo === "Aval/Fiador" ? (
        <Seccao Icone={IconePessoa} titulo="Avalista" cor="#1d4ed8">
          <Campo rotulo="Nome *"><Caixa value={form.nomeAval} onChangeText={(v) => set("nomeAval", v)} /></Campo>
          <Campo rotulo="Documento *"><Caixa value={form.docAval} onChangeText={(v) => set("docAval", v)} /></Campo>
          <Campo rotulo="Telefone *"><Caixa value={form.telAval} onChangeText={(v) => set("telAval", v)} /></Campo>
          <Campo rotulo="Endereço *"><Caixa value={form.enderecoAval} onChangeText={(v) => set("enderecoAval", v)} /></Campo>
        </Seccao>
      ) : null}
      <Campo rotulo="Observações"><Caixa value={form.observacoes} onChangeText={(v) => set("observacoes", v)} /></Campo>
      <Botao texto="Guardar garantia" onPress={() => {
        if (!form.descricao || !(Number(form.valor) > 0)) { setAviso("Indique a descrição e o valor."); return; }
        guardarGarantia({ ...form, valor: Number(form.valor) });
        setAviso("Garantia registada.");
      }} />
    </Moldura>
  );
};

const ListaGarantias = ({ onVoltar, estado, titulo, cor }) => {
  const { garantias } = usarDados();
  const lista = garantias.filter((g) => !estado || g.estado === estado);
  return (
    <Moldura>
      <Faixa titulo={titulo} sub={`${lista.length} registos`} Icone={IconeEscudo} cor={cor} onVoltar={onVoltar} />
      {lista.map((g) => (
        <View key={g.id} style={estilos.bloco}>
          <Linha Icone={IconeCadeadoSeguro} cor={cor} titulo={g.descricao} nota={`${g.contrato} · ${g.tipo} · ${mt(g.valor)} · ${g.estado}`} />
          <View style={estilos.chips}>
            {["Ativa", "Penhorada", "Em execução", "Alerta"].map((novo) => (
              <Pressable key={novo} onPress={() => mudarGarantia(g.id, novo)} style={estilos.chip}><Text style={estilos.chipTexto}>{novo}</Text></Pressable>
            ))}
          </View>
        </View>
      ))}
    </Moldura>
  );
};

const IconeCadeadoSeguro = IconeEscudo;

const NovaCarteira = ({ onVoltar }) => {
  const [form, setForm] = useState({ tipo: "Dinheiro", nome: "", codigo: "", moeda: "MZN", descricao: "", numero_conta: "", iban: "", titular: "", agencia: "", saldo: "0", minimo: "", maximo: "", responsavel: "", estado: "Activa" });
  const [aviso, setAviso] = useState("");
  const set = (c, v) => setForm((a) => ({ ...a, [c]: v }));
  return (
    <Moldura>
      <Faixa titulo="Nova carteira" sub="Caixa, banco ou carteira móvel" Icone={IconeCarteira} cor="#1e3a8a" onVoltar={onVoltar} />
      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      <Campo rotulo="Tipo *"><Chips valor={form.tipo} opcoes={["Dinheiro", "Banco", "M-Pesa", "E-Mola"]} onChange={(v) => set("tipo", v)} /></Campo>
      <Campo rotulo="Nome *"><Caixa value={form.nome} onChangeText={(v) => set("nome", v)} /></Campo>
      <Campo rotulo="Código *"><Caixa value={form.codigo} onChangeText={(v) => set("codigo", v)} /></Campo>
      <Campo rotulo="Moeda *"><Chips valor={form.moeda} opcoes={["MZN", "USD", "ZAR"]} onChange={(v) => set("moeda", v)} /></Campo>
      <Campo rotulo="Descrição"><Caixa value={form.descricao} onChangeText={(v) => set("descricao", v)} /></Campo>
      {form.tipo === "Banco" ? (
        <Seccao Icone={IconeEdificio} titulo="Dados bancários" cor="#1e3a8a">
          <Campo rotulo="Número da conta *"><Caixa value={form.numero_conta} onChangeText={(v) => set("numero_conta", v)} /></Campo>
          <Campo rotulo="IBAN *"><Caixa value={form.iban} onChangeText={(v) => set("iban", v)} /></Campo>
          <Campo rotulo="Titular *"><Caixa value={form.titular} onChangeText={(v) => set("titular", v)} /></Campo>
          <Campo rotulo="Agência"><Caixa value={form.agencia} onChangeText={(v) => set("agencia", v)} /></Campo>
        </Seccao>
      ) : null}
      <Campo rotulo="Saldo inicial (MT) *"><Caixa value={form.saldo} keyboardType="decimal-pad" onChangeText={(v) => set("saldo", v)} /></Campo>
      <Campo rotulo="Limite mínimo"><Caixa value={form.minimo} keyboardType="decimal-pad" onChangeText={(v) => set("minimo", v)} /></Campo>
      <Campo rotulo="Limite máximo"><Caixa value={form.maximo} keyboardType="decimal-pad" onChangeText={(v) => set("maximo", v)} /></Campo>
      <Campo rotulo="Responsável"><Caixa value={form.responsavel} onChangeText={(v) => set("responsavel", v)} /></Campo>
      <Campo rotulo="Estado"><Chips valor={form.estado} opcoes={["Activa", "Inactiva"]} onChange={(v) => set("estado", v)} /></Campo>
      <Botao texto="Guardar carteira" onPress={() => {
        if (!form.nome.trim()) { setAviso("Indique o nome."); return; }
        guardarCarteira(form);
        setAviso("Carteira guardada.");
      }} />
    </Moldura>
  );
};

const GestaoCarteiras = ({ onVoltar }) => {
  const { carteiras } = usarDados();
  const [nova, setNova] = useState(false);
  if (nova) return <NovaCarteira onVoltar={() => setNova(false)} />;
  return (
    <Moldura>
      <Faixa titulo="Gestão de carteiras" sub="Saldos de caixa, banco e móvel" Icone={IconeCarteira} cor="#1e3a8a" onVoltar={onVoltar} />
      {carteiras.map((c) => <Linha key={c.id} Icone={IconeCarteira} cor="#1e3a8a" titulo={c.nome} nota={`${c.tipo} · ${c.codigo} · ${mt(c.saldo)} · ${c.estado}`} />)}
      <Botao texto="Nova carteira" onPress={() => setNova(true)} />
    </Moldura>
  );
};

const Movimentos = ({ onVoltar }) => {
  const { carteiras, movimentos } = usarDados();
  const [form, setForm] = useState({ tipo: "Transferência", origem: carteiras[0]?.nome || "", destino: carteiras[1]?.nome || "", valor: "", data: "" });
  const set = (c, v) => setForm((a) => ({ ...a, [c]: v }));
  return (
    <Moldura>
      <Faixa titulo="Movimentos e transferências" sub="Entradas, saídas e transferências" Icone={IconeMoeda} cor="#1e3a8a" onVoltar={onVoltar} />
      <Chips valor={form.tipo} opcoes={["Entrada", "Saída", "Transferência"]} onChange={(v) => set("tipo", v)} />
      <Campo rotulo="Origem"><Chips valor={form.origem} opcoes={carteiras.map((c) => c.nome)} onChange={(v) => set("origem", v)} /></Campo>
      <Campo rotulo="Destino"><Chips valor={form.destino} opcoes={carteiras.map((c) => c.nome)} onChange={(v) => set("destino", v)} /></Campo>
      <Campo rotulo="Valor (MT)"><Caixa value={form.valor} keyboardType="decimal-pad" onChangeText={(v) => set("valor", v)} /></Campo>
      <Campo rotulo="Data"><Caixa value={form.data} placeholder="AAAA-MM-DD" onChangeText={(v) => set("data", v)} /></Campo>
      <Botao texto="Registar movimento" onPress={() => guardarMovimento({ ...form, valor: Number(form.valor) })} />
      {movimentos.map((m) => <Linha key={m.id} Icone={IconeMoeda} cor="#1e3a8a" titulo={m.tipo} nota={`${m.origem} → ${m.destino} · ${mt(m.valor)}`} />)}
    </Moldura>
  );
};

const Despesas = ({ onVoltar }) => {
  const { carteiras, despesas } = usarDados();
  const [form, setForm] = useState({ carteira: carteiras[0]?.nome || "", categoria: "Transporte", valor: "", data: "", descricao: "" });
  const set = (c, v) => setForm((a) => ({ ...a, [c]: v }));
  return (
    <Moldura>
      <Faixa titulo="Despesas" sub="Saídas por carteira" Icone={IconeAlerta} cor="#9a3412" onVoltar={onVoltar} />
      <Campo rotulo="Carteira"><Chips valor={form.carteira} opcoes={carteiras.map((c) => c.nome)} onChange={(v) => set("carteira", v)} /></Campo>
      <Campo rotulo="Categoria"><Chips valor={form.categoria} opcoes={["Transporte", "Comunicação", "Pessoal", "Outra"]} onChange={(v) => set("categoria", v)} /></Campo>
      <Campo rotulo="Valor (MT)"><Caixa value={form.valor} keyboardType="decimal-pad" onChangeText={(v) => set("valor", v)} /></Campo>
      <Campo rotulo="Data"><Caixa value={form.data} placeholder="AAAA-MM-DD" onChangeText={(v) => set("data", v)} /></Campo>
      <Campo rotulo="Descrição"><Caixa value={form.descricao} onChangeText={(v) => set("descricao", v)} /></Campo>
      <Botao texto="Registar despesa" onPress={() => guardarDespesa({ ...form, valor: Number(form.valor) })} />
      {despesas.map((d) => <Linha key={d.id} Icone={IconeAlerta} cor="#9a3412" titulo={d.categoria} nota={`${d.carteira} · ${mt(d.valor)} · ${d.descricao}`} />)}
    </Moldura>
  );
};

const Agenda = ({ onVoltar }) => {
  const { agendas, cobradores, zonas, clientes } = usarDados();
  const [form, setForm] = useState({ data: "", inicio: "09:00", fim: "12:00", cobrador: cobradores[0]?.nome || "", zona: zonas[0]?.nome || "", cliente: clientes[0]?.nome_completo || "" });
  const set = (c, v) => setForm((a) => ({ ...a, [c]: v }));
  return (
    <Moldura>
      <Faixa titulo="Agenda de cobranças" sub="Visitas, cobrador e rota" Icone={IconeSino} cor="#0369a1" onVoltar={onVoltar} />
      <Campo rotulo="Data *"><Caixa value={form.data} placeholder="AAAA-MM-DD" onChangeText={(v) => set("data", v)} /></Campo>
      <Campo rotulo="Início"><Caixa value={form.inicio} onChangeText={(v) => set("inicio", v)} /></Campo>
      <Campo rotulo="Fim"><Caixa value={form.fim} onChangeText={(v) => set("fim", v)} /></Campo>
      <Campo rotulo="Cobrador *"><Chips valor={form.cobrador} opcoes={cobradores.map((c) => c.nome)} onChange={(v) => set("cobrador", v)} /></Campo>
      <Campo rotulo="Zona *"><Chips valor={form.zona} opcoes={zonas.map((z) => z.nome)} onChange={(v) => set("zona", v)} /></Campo>
      <Campo rotulo="Cliente na rota"><Chips valor={form.cliente} opcoes={clientes.map((c) => c.nome_completo)} onChange={(v) => set("cliente", v)} /></Campo>
      <Botao texto="Agendar visita" onPress={() => guardarAgenda({ ...form, clientes: [form.cliente], estado: "Agendada" })} />
      {agendas.map((a) => <Linha key={a.id} Icone={IconeSino} cor="#0369a1" titulo={`${a.data} ${a.inicio}`} nota={`${a.cobrador} · ${a.zona} · ${(a.clientes || []).join(", ")}`} />)}
    </Moldura>
  );
};

const Rota = ({ onVoltar }) => {
  const { zonas, clientes } = usarDados();
  const pontos = [
    ...zonas.map((z) => ({ lat: z.lat, lon: z.lon, titulo: z.nome, texto: z.responsavel })),
    ...clientes.map((c) => { const p = pontoDe(c.coordenadas_gps); return p ? { ...p, titulo: c.nome_completo, texto: "Cliente" } : null; }).filter(Boolean),
  ];
  return (
    <Moldura>
      <Faixa titulo="Rota de cobrança" sub="Mapa de Moçambique com zonas e clientes" Icone={IconeMapa} cor="#0369a1" onVoltar={onVoltar} />
      <Mapa pontos={pontos} altura={320} />
      {zonas.map((z) => <Linha key={z.id} Icone={IconePin} cor="#0369a1" titulo={z.nome} nota={`${z.provincia} · raio ${z.raio} km · ${z.responsavel}`} />)}
    </Moldura>
  );
};

const Zonas = ({ onVoltar }) => {
  const { zonas } = usarDados();
  const [form, setForm] = useState(null);
  const set = (c, v) => setForm((a) => ({ ...a, [c]: v }));
  const pontos = zonas.filter((z) => z.lat).map((z) => ({ lat: z.lat, lon: z.lon, titulo: z.nome, texto: z.provincia }));
  return (
    <Moldura>
      <Faixa titulo="Zonas e territórios" sub="Mapa e ficha de cada zona" Icone={IconeMapa} cor="#0369a1" onVoltar={onVoltar} />
      <Mapa pontos={pontos} />
      {form ? (
        <Seccao Icone={IconePin} titulo={form.id ? "Editar zona" : "Nova zona"} cor="#0369a1">
          {["nome", "codigo", "provincia", "distrito", "bairro", "responsavel", "raio"].map((campo) => (
            <Campo key={campo} rotulo={campo}><Caixa value={form[campo] || ""} onChangeText={(v) => set(campo, v)} /></Campo>
          ))}
          <Botao texto="Guardar zona" onPress={() => { guardarZona(form); setForm(null); }} />
        </Seccao>
      ) : <Botao texto="Nova zona" onPress={() => setForm({ nome: "", codigo: "", provincia: "", distrito: "", bairro: "", responsavel: "", raio: "5", estado: "Ativa" })} />}
      {zonas.map((z) => <Linha key={z.id} Icone={IconePin} cor="#0369a1" titulo={z.nome} nota={`${z.codigo} · ${z.distrito} · ${z.estado}`} onPress={() => setForm(z)} />)}
    </Moldura>
  );
};

const Cobradores = ({ onVoltar }) => {
  const { cobradores, zonas } = usarDados();
  const [form, setForm] = useState({ nome: "", telefone: "", zona: zonas[0]?.nome || "", estado: "Activo" });
  const set = (c, v) => setForm((a) => ({ ...a, [c]: v }));
  return (
    <Moldura>
      <Faixa titulo="Cobradores" sub="Equipa de campo" Icone={IconeEquipa} cor="#0369a1" onVoltar={onVoltar} />
      <Campo rotulo="Nome *"><Caixa value={form.nome} onChangeText={(v) => set("nome", v)} /></Campo>
      <Campo rotulo="Telefone *"><Caixa value={form.telefone} keyboardType="phone-pad" onChangeText={(v) => set("telefone", v)} /></Campo>
      <Campo rotulo="Zona"><Chips valor={form.zona} opcoes={zonas.map((z) => z.nome)} onChange={(v) => set("zona", v)} /></Campo>
      <Campo rotulo="Estado"><Chips valor={form.estado} opcoes={["Activo", "Inactivo"]} onChange={(v) => set("estado", v)} /></Campo>
      <Botao texto="Guardar cobrador" onPress={() => { if (form.nome.trim()) guardarCobrador(form); }} />
      {cobradores.map((c) => <Linha key={c.id} Icone={IconePessoa} cor="#0369a1" titulo={c.nome} nota={`${c.telefone} · ${c.zona} · ${c.estado}`} />)}
    </Moldura>
  );
};

const Relatorio = ({ onVoltar, tipo }) => {
  const { clientes, emprestimos, pagamentos, carteiras, despesas } = usarDados();
  const carteira = emprestimos.reduce((s, e) => s + Number(e.valor), 0);
  const recebido = pagamentos.reduce((s, p) => s + Number(p.valor), 0);
  const atraso = emprestimos.filter((e) => e.estado === "Em atraso").length;
  const linhas = {
    Financeiro: [["Desembolsado", mt(carteira)], ["Recebido", mt(recebido)], ["Saldo das carteiras", mt(carteiras.reduce((s, c) => s + Number(c.saldo), 0))]],
    Inadimplência: [["Contratos em atraso", String(atraso)], ["Taxa", carteira ? `${((atraso / emprestimos.length) * 100).toFixed(1)}%` : "0%"]],
    Performance: [["Pagamentos", String(pagamentos.length)], ["Clientes activos", String(clientes.filter((c) => c.cliente_ativo).length)]],
    Clientes: [["Total", String(clientes.length)], ["Empresas", String(clientes.filter((c) => c.tipo_cliente === "Pessoa Jurídica").length)]],
    Carteiras: carteiras.map((c) => [c.nome, mt(c.saldo)]),
  }[tipo] || [];
  return (
    <Moldura>
      <Faixa titulo={`Relatório ${tipo.toLowerCase()}`} sub="Números calculados com os registos deste telemóvel" Icone={IconeGrafico} cor="#6d28d9" onVoltar={onVoltar} />
      {linhas.map(([nome, valor]) => <Linha key={nome} Icone={IconeGrafico} cor="#6d28d9" titulo={nome} nota={valor} />)}
      <Text style={estilos.nota}>Despesas: {mt(despesas.reduce((s, d) => s + Number(d.valor), 0))}</Text>
    </Moldura>
  );
};

const Exportacao = ({ onVoltar }) => {
  const info = usarDados();
  return (
    <Moldura>
      <Faixa titulo="Exportação" sub="Cópia dos registos do telemóvel" Icone={IconeDocumento} cor="#6d28d9" onVoltar={onVoltar} />
      <Botao texto="Partilhar dados" onPress={() => Share.share({ message: JSON.stringify(info, null, 2) })} />
    </Moldura>
  );
};

const EcraModulo = ({ item, onVoltar }) => {
  const id = item?.id;
  if (id === "cli-lista") return <ListaClientes onVoltar={onVoltar} />;
  if (id === "cli-mapa") return <MapaClientes onVoltar={onVoltar} />;
  if (id === "emp-novo") return <NovoEmprestimo onVoltar={onVoltar} />;
  if (id === "emp-lista") return <ListaEmprestimos onVoltar={onVoltar} />;
  if (id === "emp-calendario") return <Calendario onVoltar={onVoltar} />;
  if (id === "pag-registar") return <RegistarPagamento onVoltar={onVoltar} />;
  if (id === "pag-historico") return <Historico onVoltar={onVoltar} />;
  if (id === "gar-nova") return <NovaGarantia onVoltar={onVoltar} />;
  if (id === "gar-lista") return <ListaGarantias onVoltar={onVoltar} titulo="Lista de garantias" cor="#9a3412" />;
  if (id === "gar-penhoradas") return <ListaGarantias onVoltar={onVoltar} estado="Penhorada" titulo="Garantias penhoradas" cor="#9a3412" />;
  if (id === "gar-execucao") return <ListaGarantias onVoltar={onVoltar} estado="Em execução" titulo="Execução de garantias" cor="#7f1d1d" />;
  if (id === "gar-alertas") return <ListaGarantias onVoltar={onVoltar} estado="Alerta" titulo="Alertas de garantias" cor="#b45309" />;
  if (id === "cob-agenda" || id === "cob-historico") return <Agenda onVoltar={onVoltar} />;
  if (id === "cob-rota") return <Rota onVoltar={onVoltar} />;
  if (id === "cob-zonas" || id === "cfg-zonas") return <Zonas onVoltar={onVoltar} />;
  if (id === "cob-cobradores") return <Cobradores onVoltar={onVoltar} />;
  if (id === "car-gestao") return <GestaoCarteiras onVoltar={onVoltar} />;
  if (id === "car-movimentos") return <Movimentos onVoltar={onVoltar} />;
  if (id === "car-despesas") return <Despesas onVoltar={onVoltar} />;
  if (id === "rel-financeiro") return <Relatorio onVoltar={onVoltar} tipo="Financeiro" />;
  if (id === "rel-inadimplencia") return <Relatorio onVoltar={onVoltar} tipo="Inadimplência" />;
  if (id === "rel-performance") return <Relatorio onVoltar={onVoltar} tipo="Performance" />;
  if (id === "rel-clientes") return <Relatorio onVoltar={onVoltar} tipo="Clientes" />;
  if (id === "rel-carteiras") return <Relatorio onVoltar={onVoltar} tipo="Carteiras" />;
  if (id === "rel-exportacao") return <Exportacao onVoltar={onVoltar} />;
  return null;
};

const estilos = StyleSheet.create({
  scroll: { flex: 1 },
  pagina: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
  aviso: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "700" },
  nota: { fontFamily: fonte, color: cores.texto },
  paginas: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pagina: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "800" },
  grelha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dia: { width: 72, backgroundColor: cores.branco, borderRadius: 12, padding: 8 },
  diaNum: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, fontSize: 18 },
  bloco: { gap: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { backgroundColor: "#f4f8f5", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipTexto: { fontFamily: fonte, fontSize: 11, fontWeight: "700", color: cores.titulo },
});

export default EcraModulo;
