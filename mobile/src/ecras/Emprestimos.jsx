import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import {
  IconeAlerta, IconeCarteira, IconeDocumento, IconeEdificio, IconeEscudo, IconeFicha, IconeGrafico, IconeLupa,
  IconeMoeda, IconeNascer, IconeOlho, IconePercentagem, IconePessoa, IconeSeta, IconeVoltar,
} from "../componentes/Icones";
import { usarDados } from "../dados/operacao";
import { cores, fonte } from "../tema";

const FUNDO = "#f4f8f5";
const POR_PAGINA = 5;
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const ESTADOS = ["Activo", "Em atraso", "Pendente", "Quitado"];
const MODALIDADES = ["Diária", "Semanal", "Quinzenal", "Mensal"];

const iso = (data) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
const mt = (valor) => `${Number(valor || 0).toLocaleString("pt-PT")} MT`;
const corEstado = (estado) => ({ Activo: "#14924a", "Em atraso": "#b45309", Pendente: "#1d4ed8", Quitado: "#0f766e" })[estado] || "#5f6662";
const estadoParcela = (parcela, emprestimo) => {
  if (parcela.status === "Pago") return "pago";
  if (parcela.status === "Atrasado") return "atraso";
  if (emprestimo.estado === "Pendente") return "aprovacao";
  return "pendente";
};
const rotuloParcela = { pago: "Pago", atraso: "Em atraso", aprovacao: "A aguardar aprovação", pendente: "Por pagar" };
const corParcela = { pago: "#14924a", atraso: "#dc2626", aprovacao: "#d97706", pendente: "#2563eb" };

const Entrada = ({ atraso = 0, children, style }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 480, delay: atraso, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [atraso, v]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
};

const CabecaV = ({ titulo, sub, Icone, onVoltar, voltar }) => {
  const sobe = useRef(new Animated.Value(0)).current;
  const deriva = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sobe, { toValue: 1, duration: 560, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(deriva, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(deriva, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [deriva, sobe]);
  const dy = deriva.interpolate({ inputRange: [0, 1], outputRange: [10, -14] });
  return (
    <Animated.View style={[estilos.cabeca, { opacity: sobe, transform: [{ translateY: sobe.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }]}>
      <Animated.View style={[estilos.lasca, { transform: [{ rotate: "-34deg" }, { translateY: dy }] }]} />
      <View style={estilos.losango} />
      <View style={estilos.traco} />
      <View style={estilos.bicoEsq} />
      <View style={estilos.bicoDir} />
      <Pressable style={estilos.voltar} onPress={onVoltar}>
        <IconeVoltar size={16} color="#ffffff" />
        <Text style={estilos.voltarTexto}>{voltar}</Text>
      </Pressable>
      <View style={estilos.cabecaLinha}>
        <View style={estilos.cabecaIcone}><Icone size={22} color="#ffffff" /></View>
        <View style={estilos.flex}>
          <Text style={estilos.cabecaTitulo}>{titulo}</Text>
          <Text style={estilos.cabecaSub}>{sub}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const Estatistica = ({ Icone, cor, rotulo, valor }) => {
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1.12, duration: 900, useNativeDriver: true }),
      Animated.timing(pulso, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso]);
  return (
    <View style={estilos.stat}>
      <Animated.View style={[estilos.statIcone, { backgroundColor: `${cor}18`, transform: [{ scale: pulso }] }]}>
        <Icone size={16} color={cor} />
      </Animated.View>
      <Text style={estilos.statValor} numberOfLines={1}>{valor}</Text>
      <Text style={estilos.statRotulo} numberOfLines={1}>{rotulo}</Text>
    </View>
  );
};

const Etiqueta = ({ texto, cor }) => (
  <View style={[estilos.etiqueta, { backgroundColor: `${cor}16` }]}>
    <Text style={[estilos.etiquetaTexto, { color: cor }]}>{texto}</Text>
  </View>
);

const Barra = ({ pct, cor }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct, v]);
  return (
    <View style={estilos.barra}>
      <Animated.View style={[estilos.barraCheia, { backgroundColor: cor, width: v.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${Math.max(pct, 4)}%`] }) }]} />
    </View>
  );
};

const Titulo = ({ Icone, cor, texto, nota }) => (
  <View style={estilos.tituloLinha}>
    <View style={[estilos.tituloIcone, { backgroundColor: `${cor}18` }]}><Icone size={15} color={cor} /></View>
    <Text style={estilos.titulo}>{texto}</Text>
    {nota ? <Text style={estilos.tituloNota}>{nota}</Text> : null}
  </View>
);

const Dado = ({ Icone, cor, rotulo, valor }) => (
  <View style={estilos.dado}>
    <View style={[estilos.dadoIcone, { backgroundColor: `${cor}16` }]}><Icone size={16} color={cor} /></View>
    <View style={estilos.flex}>
      <Text style={estilos.infoRotulo}>{rotulo}</Text>
      <Text style={estilos.dadoValor}>{valor || "—"}</Text>
    </View>
  </View>
);

const Ficha = ({ emprestimo, onVoltar }) => {
  const plano = emprestimo.plano || [];
  const pagas = plano.filter((p) => p.status === "Pago").length;
  const contrato = [
    [IconeDocumento, "#166534", "Número", emprestimo.contrato],
    [IconePessoa, "#1d4ed8", "Cliente", emprestimo.cliente],
    [IconeEscudo, corEstado(emprestimo.estado), "Estado", emprestimo.estado],
    [IconeNascer, "#0f766e", "Modalidade", emprestimo.modalidade],
    [IconeGrafico, "#7c3aed", "Amortização", emprestimo.sistema],
    [IconePercentagem, "#b45309", "Juros", `${emprestimo.tipo_juros || "—"} · ${emprestimo.taxa}%`],
  ];
  const valores = [
    [IconeMoeda, "#166534", "Emprestado", mt(emprestimo.valor)],
    [IconeCarteira, "#14532d", "Prestação", mt(emprestimo.prestacao)],
    [IconeAlerta, "#b45309", "Saldo devedor", mt(emprestimo.saldo)],
    [IconeFicha, "#1d4ed8", "Parcelas", `${pagas}/${emprestimo.parcelas}`],
    [IconeEdificio, "#0f766e", "Carteira", emprestimo.carteira],
    [IconeEscudo, "#9a3412", "Garantia", emprestimo.garantia],
    [IconeNascer, "#166534", "Início", emprestimo.inicio],
    [IconeDocumento, "#1d4ed8", "Último vencimento", emprestimo.vencimento],
  ];
  return (
    <View style={estilos.ecra}>
      <CabecaV titulo={emprestimo.contrato} sub={emprestimo.cliente} Icone={IconeDocumento} onVoltar={onVoltar} voltar="Voltar" />
      <ScrollView contentContainerStyle={estilos.corpo} showsVerticalScrollIndicator={false}>
        <View style={estilos.linhaEtiquetas}>
          <Etiqueta texto={emprestimo.estado} cor={corEstado(emprestimo.estado)} />
          <Etiqueta texto={emprestimo.modalidade} cor="#166534" />
          <Etiqueta texto={emprestimo.sistema} cor="#0f766e" />
        </View>
        <Entrada atraso={40}>
          <View style={estilos.painel}>
            <Titulo Icone={IconeDocumento} cor="#166534" texto="Contrato" />
            {contrato.map(([Icone, cor, rotulo, valor]) => <Dado key={rotulo} Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} />)}
          </View>
        </Entrada>
        <Entrada atraso={110}>
          <View style={estilos.painel}>
            <Titulo Icone={IconeMoeda} cor="#14532d" texto="Valores" />
            {valores.map(([Icone, cor, rotulo, valor]) => <Dado key={rotulo} Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} />)}
          </View>
        </Entrada>
        <Entrada atraso={160}>
          <View style={estilos.painel}>
            <Titulo Icone={IconeFicha} cor="#166534" texto="Plano de parcelas" nota={`${pagas} pagas`} />
            <Barra pct={emprestimo.parcelas ? (pagas / emprestimo.parcelas) * 100 : 0} cor="#166534" />
            {plano.map((parcela, indice) => {
              const tipo = estadoParcela(parcela, emprestimo);
              const IconeEstado = tipo === "pago" ? IconeEscudo : tipo === "atraso" ? IconeAlerta : IconeNascer;
              return (
                <Entrada key={parcela.id} atraso={indice * 45}>
                  <View style={estilos.tempo}>
                    <View style={estilos.eixo}>
                      <View style={[estilos.no, { backgroundColor: corParcela[tipo] }]}><IconeEstado size={12} color="#ffffff" /></View>
                      {indice < plano.length - 1 ? <View style={estilos.fio} /> : null}
                    </View>
                    <View style={estilos.cartaoTempo}>
                      <View style={estilos.cartaoTopo}>
                        <Text style={estilos.nome}>Parcela {parcela.numero}/{emprestimo.parcelas}</Text>
                        <Etiqueta texto={rotuloParcela[tipo]} cor={corParcela[tipo]} />
                      </View>
                      <View style={estilos.meta}><IconeNascer size={14} color="#166534" /><Text style={estilos.metaTexto}>{parcela.data_vencimento}</Text></View>
                      <View style={estilos.meta}><IconeMoeda size={14} color="#14532d" /><Text style={estilos.metaTexto}>{mt(parcela.valor_parcela)}</Text></View>
                    </View>
                  </View>
                </Entrada>
              );
            })}
          </View>
        </Entrada>
      </ScrollView>
    </View>
  );
};

const Opcoes = ({ actual, opcoes, onEscolher }) => (
  <View style={estilos.opcoes}>
    {opcoes.map((opcao) => (
      <Pressable key={opcao.id} style={[estilos.opcao, actual === opcao.id && estilos.opcaoActiva]} onPress={() => onEscolher(opcao.id)}>
        <Text style={[estilos.opcaoTexto, actual === opcao.id && estilos.opcaoTextoActiva]}>{opcao.label}</Text>
      </Pressable>
    ))}
  </View>
);

const ListaEmprestimos = ({ onVoltar }) => {
  const { emprestimos } = usarDados();
  const [ficha, setFicha] = useState(null);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);

  const visiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return emprestimos.filter((item) => {
      if (estado && item.estado !== estado) return false;
      if (modalidade && item.modalidade !== modalidade) return false;
      if (!texto) return true;
      return `${item.contrato} ${item.cliente}`.toLowerCase().includes(texto);
    });
  }, [busca, emprestimos, estado, modalidade]);

  const emCurso = emprestimos.filter((item) => ["Activo", "Em atraso"].includes(item.estado));
  const carteira = emCurso.reduce((soma, item) => soma + Number(item.saldo || 0), 0);
  const pendentes = emprestimos.filter((item) => item.estado === "Pendente").length;
  const atraso = emprestimos.filter((item) => item.estado === "Em atraso").length;
  const paginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const inicio = (actual - 1) * POR_PAGINA;
  const itens = visiveis.slice(inicio, inicio + POR_PAGINA);

  const partilhar = () => {
    const linhas = visiveis.map((item) => `${item.contrato} | ${item.cliente} | ${mt(item.valor)} | saldo ${mt(item.saldo)} | ${item.estado}`);
    Share.share({ message: `Empréstimos (${visiveis.length})\n${linhas.join("\n")}` });
  };

  if (ficha) return <Ficha emprestimo={ficha} onVoltar={() => setFicha(null)} />;

  return (
    <View style={estilos.ecra}>
      <CabecaV titulo="Listar empréstimos" sub={`${emprestimos.length} contratos na carteira`} Icone={IconeMoeda} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={estilos.tres}>
          {[
            [IconeCarteira, "#166534", "Em curso", mt(carteira)],
            [IconeEscudo, "#1d4ed8", "Pendentes", String(pendentes)],
            [IconeAlerta, "#b45309", "Em atraso", String(atraso)],
          ].map(([Icone, cor, rotulo, valor], indice) => (
            <Entrada key={rotulo} atraso={indice * 60} style={estilos.flex}>
              <Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} />
            </Entrada>
          ))}
        </View>
        <Entrada atraso={160}>
          <View style={estilos.painel}>
            <Titulo Icone={IconeLupa} cor="#166534" texto="Encontrar" />
            <View style={estilos.busca}>
              <IconeLupa size={16} color="#166534" />
              <TextInput value={busca} onChangeText={(valor) => { setBusca(valor); setPagina(1); }} placeholder="Contrato ou cliente" placeholderTextColor={cores.placeholder} style={estilos.buscaInput} />
            </View>
            <View style={estilos.filtros}>
              <Pressable style={[estilos.filtro, menu === "estado" && estilos.filtroAberto]} onPress={() => setMenu(menu === "estado" ? null : "estado")}>
                <IconeEscudo size={14} color={menu === "estado" ? "#fff" : "#166534"} />
                <Text style={[estilos.filtroRotulo, menu === "estado" && estilos.claro]}>Estado</Text>
                <Text style={[estilos.filtroValor, menu === "estado" && estilos.claro]} numberOfLines={1}>{estado || "Todos"}</Text>
              </Pressable>
              <Pressable style={[estilos.filtro, menu === "modalidade" && estilos.filtroAberto]} onPress={() => setMenu(menu === "modalidade" ? null : "modalidade")}>
                <IconeNascer size={14} color={menu === "modalidade" ? "#fff" : "#166534"} />
                <Text style={[estilos.filtroRotulo, menu === "modalidade" && estilos.claro]}>Modalidade</Text>
                <Text style={[estilos.filtroValor, menu === "modalidade" && estilos.claro]} numberOfLines={1}>{modalidade || "Todas"}</Text>
              </Pressable>
            </View>
            {menu === "estado" ? <Opcoes actual={estado} opcoes={[{ id: "", label: "Todos" }, ...ESTADOS.map((item) => ({ id: item, label: item }))]} onEscolher={(valor) => { setEstado(valor); setPagina(1); setMenu(null); }} /> : null}
            {menu === "modalidade" ? <Opcoes actual={modalidade} opcoes={[{ id: "", label: "Todas" }, ...MODALIDADES.map((item) => ({ id: item, label: item }))]} onEscolher={(valor) => { setModalidade(valor); setPagina(1); setMenu(null); }} /> : null}
            <View style={estilos.accoes}>
              {(busca || estado || modalidade) ? (
                <Pressable onPress={() => { setBusca(""); setEstado(""); setModalidade(""); setPagina(1); setMenu(null); }}><Text style={estilos.limpar}>Limpar filtros</Text></Pressable>
              ) : <View />}
              <Pressable style={estilos.partilhar} onPress={partilhar}>
                <IconeDocumento size={15} color="#166534" />
                <Text style={estilos.partilharTexto}>Partilhar</Text>
              </Pressable>
            </View>
          </View>
        </Entrada>
        <Titulo Icone={IconeDocumento} cor="#166534" texto="Contratos" nota={`${visiveis.length} visíveis`} />
        {itens.length === 0 ? (
          <View style={estilos.vazio}>
            <IconeMoeda size={28} color="#166534" />
            <Text style={estilos.vazioTitulo}>{emprestimos.length ? "Nenhum empréstimo encontrado." : "Ainda não há empréstimos."}</Text>
            <Text style={estilos.nota}>{emprestimos.length ? "Ajuste os filtros ou a pesquisa." : "A carteira de crédito está vazia."}</Text>
          </View>
        ) : itens.map((item, indice) => {
          const pagas = (item.plano || []).filter((p) => p.status === "Pago").length;
          return (
            <Entrada key={`${actual}-${item.id}`} atraso={indice * 55}>
              <Pressable style={estilos.cartao} onPress={() => setFicha(item)}>
                <View style={estilos.cartaoTopo}>
                  <View style={estilos.avatar}><IconeDocumento size={18} color="#166534" /></View>
                  <View style={estilos.flex}>
                    <Text style={estilos.nome}>{item.contrato}</Text>
                    <Text style={estilos.nota}>{item.cliente}</Text>
                  </View>
                  <View style={estilos.ver}><IconeOlho size={16} color="#166534" /></View>
                </View>
                <View style={estilos.duas}>
                  <View style={estilos.meta}><IconeMoeda size={14} color="#166534" /><Text style={estilos.metaTexto}>{mt(item.valor)}</Text></View>
                  <View style={estilos.meta}><IconeCarteira size={14} color="#0f766e" /><Text style={estilos.metaTexto}>{mt(item.saldo)}</Text></View>
                  <View style={estilos.meta}><IconeGrafico size={14} color="#1d4ed8" /><Text style={estilos.metaTexto}>{pagas}/{item.parcelas} parcelas</Text></View>
                  <View style={estilos.meta}><IconeNascer size={14} color="#b45309" /><Text style={estilos.metaTexto}>{item.vencimento}</Text></View>
                </View>
                <Barra pct={item.parcelas ? (pagas / item.parcelas) * 100 : 0} cor={corEstado(item.estado)} />
                <View style={estilos.linhaEtiquetas}>
                  <Etiqueta texto={item.estado} cor={corEstado(item.estado)} />
                  <Etiqueta texto={item.modalidade} cor="#166534" />
                </View>
              </Pressable>
            </Entrada>
          );
        })}
        {visiveis.length > 0 ? (
          <View style={estilos.paginacao}>
            <Text style={estilos.nota}>{inicio + 1}–{Math.min(inicio + POR_PAGINA, visiveis.length)} de {visiveis.length}</Text>
            <View style={estilos.paginas}>
              <Pressable disabled={actual <= 1} onPress={() => setPagina(actual - 1)}><Text style={[estilos.paginaTexto, actual <= 1 && estilos.off]}>Anterior</Text></Pressable>
              <Text style={estilos.paginaTexto}>{actual} / {paginas}</Text>
              <Pressable disabled={actual >= paginas} onPress={() => setPagina(actual + 1)}><Text style={[estilos.paginaTexto, actual >= paginas && estilos.off]}>Seguinte</Text></Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const Calendario = ({ onVoltar }) => {
  const { emprestimos } = usarDados();
  const hoje = new Date();
  const hojeIso = iso(hoje);
  const [mes, setMes] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [diaActivo, setDiaActivo] = useState(hojeIso);
  const [ficha, setFicha] = useState(null);

  const porDia = useMemo(() => {
    const mapa = {};
    emprestimos.filter((item) => item.estado !== "Quitado").forEach((item) => {
      (item.plano || []).forEach((parcela) => {
        if (parcela.status === "Cancelado") return;
        const tipo = estadoParcela(parcela, item);
        (mapa[parcela.data_vencimento] ||= []).push({ ...parcela, tipo, contrato: item.contrato, cliente: item.cliente, modalidade: item.modalidade, total: item.parcelas, emprestimo: item });
      });
    });
    return mapa;
  }, [emprestimos]);

  const celulas = useMemo(() => {
    const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const deslocar = (primeiro.getDay() + 6) % 7;
    const inicio = new Date(primeiro);
    inicio.setDate(primeiro.getDate() - deslocar);
    return Array.from({ length: 42 }, (_, i) => {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + i);
      return data;
    });
  }, [mes]);

  const prefixo = iso(mes).slice(0, 7);
  const doMes = Object.entries(porDia).filter(([dia]) => dia.startsWith(prefixo)).flatMap(([, lista]) => lista);
  const totais = {
    valor: doMes.reduce((s, p) => s + p.valor_parcela, 0),
    parcelas: doMes.length,
    atraso: doMes.filter((p) => p.tipo === "atraso").length,
    pagas: doMes.filter((p) => p.tipo === "pago").length,
  };
  const lista = porDia[diaActivo] || [];
  const totalDia = lista.reduce((s, p) => s + p.valor_parcela, 0);
  const dataActiva = new Date(`${diaActivo}T00:00:00`);

  const mudarMes = (passo) => setMes(new Date(mes.getFullYear(), mes.getMonth() + passo, 1));

  if (ficha) return <Ficha emprestimo={ficha} onVoltar={() => setFicha(null)} />;

  return (
    <View style={estilos.ecra}>
      <CabecaV titulo="Calendário" sub={`${mt(totais.valor)} a receber em ${MESES[mes.getMonth()].toLowerCase()}`} Icone={IconeNascer} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo} showsVerticalScrollIndicator={false}>
        <View style={estilos.grelha}>
          {[
            [IconeMoeda, "#166534", "A receber", mt(totais.valor)],
            [IconeGrafico, "#1d4ed8", "Parcelas", String(totais.parcelas)],
            [IconeAlerta, "#dc2626", "Em atraso", String(totais.atraso)],
            [IconeEscudo, "#14924a", "Pagas", String(totais.pagas)],
          ].map(([Icone, cor, rotulo, valor], indice) => (
            <Entrada key={rotulo} atraso={indice * 50} style={estilos.statMeio}>
              <Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} />
            </Entrada>
          ))}
        </View>
        <Entrada key={prefixo} atraso={80}>
          <View style={estilos.painel}>
            <View style={estilos.mesTopo}>
              <View>
                <Text style={estilos.mesNome}>{MESES[mes.getMonth()]}</Text>
                <Text style={estilos.nota}>{mes.getFullYear()}</Text>
              </View>
              <View style={estilos.nav}>
                <Pressable style={estilos.hoje} onPress={() => { setMes(new Date(hoje.getFullYear(), hoje.getMonth(), 1)); setDiaActivo(hojeIso); }}>
                  <Text style={estilos.hojeTexto}>Hoje</Text>
                </Pressable>
                <Pressable style={estilos.seta} onPress={() => mudarMes(-1)}><IconeVoltar size={16} color="#166534" /></Pressable>
                <Pressable style={estilos.seta} onPress={() => mudarMes(1)}><IconeSeta size={16} color="#166534" /></Pressable>
              </View>
            </View>
            <View style={estilos.legenda}>
              {[["pago", "Pago"], ["pendente", "Por pagar"], ["atraso", "Atraso"], ["aprovacao", "Aprovação"]].map(([id, rotulo]) => (
                <View key={id} style={estilos.legendaItem}>
                  <View style={[estilos.ponto, { backgroundColor: corParcela[id] }]} />
                  <Text style={estilos.nota}>{rotulo}</Text>
                </View>
              ))}
            </View>
            <View style={estilos.semana}>
              {SEMANA.map((dia, indice) => <Text key={dia} style={[estilos.semanaTexto, indice >= 5 && estilos.fim]}>{dia}</Text>)}
            </View>
            {Array.from({ length: 6 }, (_, linha) => (
              <View key={`${prefixo}-${linha}`} style={estilos.linhaDias}>
                {celulas.slice(linha * 7, linha * 7 + 7).map((data) => {
                  const chave = iso(data);
                  const parcelas = porDia[chave] || [];
                  const tipos = [...new Set(parcelas.map((p) => p.tipo))];
                  const principal = ["atraso", "aprovacao", "pendente", "pago"].find((tipo) => tipos.includes(tipo));
                  const fora = data.getMonth() !== mes.getMonth();
                  return (
                    <Pressable key={chave} style={[estilos.dia, chave === diaActivo && estilos.diaActivo, chave === hojeIso && estilos.diaHoje]} onPress={() => { setDiaActivo(chave); if (fora) setMes(new Date(data.getFullYear(), data.getMonth(), 1)); }}>
                      <Text style={[estilos.diaNum, fora && estilos.off, chave === diaActivo && { color: "#ffffff" }]}>{data.getDate()}</Text>
                      {parcelas.length ? <View style={[estilos.ponto, { backgroundColor: corParcela[principal] }]} /> : <View style={estilos.pontoVazio} />}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </Entrada>
        <View style={estilos.painel}>
          <View style={estilos.diaTopo}>
            <View style={estilos.folha}>
              <Text style={estilos.folhaMes}>{MESES[dataActiva.getMonth()].slice(0, 3)}</Text>
              <Text style={estilos.folhaDia}>{dataActiva.getDate()}</Text>
            </View>
            <View style={estilos.flex}>
              <Text style={estilos.nome}>{DIAS[dataActiva.getDay()]}</Text>
              <Text style={estilos.nota}>{diaActivo}{diaActivo === hojeIso ? " · Hoje" : ""}</Text>
            </View>
            <Text style={estilos.rankTotal}>{mt(totalDia)}</Text>
          </View>
          <Text style={estilos.nota}>{lista.length} parcela{lista.length === 1 ? "" : "s"}</Text>
          {lista.length === 0 ? (
            <View style={estilos.vazio}>
              <IconeEscudo size={26} color="#166534" />
              <Text style={estilos.vazioTitulo}>Dia livre</Text>
              <Text style={estilos.nota}>Sem parcelas a vencer neste dia.</Text>
            </View>
          ) : lista.map((parcela, indice) => (
            <Entrada key={parcela.id} atraso={indice * 40}>
              <Pressable style={estilos.mini} onPress={() => setFicha(parcela.emprestimo)}>
                <View style={[estilos.faixaCor, { backgroundColor: corParcela[parcela.tipo] }]} />
                <View style={estilos.flex}>
                  <Text style={estilos.nome}>{parcela.cliente}</Text>
                  <Text style={estilos.nota}>{parcela.contrato} · parcela {parcela.numero}/{parcela.total}</Text>
                  <Etiqueta texto={rotuloParcela[parcela.tipo]} cor={corParcela[parcela.tipo]} />
                </View>
                <Text style={estilos.metaValor}>{mt(parcela.valor_parcela)}</Text>
              </Pressable>
            </Entrada>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const Emprestimos = ({ modo, onVoltar }) => (modo === "calendario" ? <Calendario onVoltar={onVoltar} /> : <ListaEmprestimos onVoltar={onVoltar} />);

const estilos = StyleSheet.create({
  ecra: { flex: 1, backgroundColor: FUNDO },
  scroll: { flex: 1 },
  corpo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, gap: 10 },
  flex: { flex: 1 },
  cabeca: { overflow: "hidden", backgroundColor: "#14532d", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 58, minHeight: 156 },
  lasca: { position: "absolute", width: 150, height: 320, left: -70, top: -30, backgroundColor: "#22c55e" },
  losango: { position: "absolute", width: 72, height: 72, right: -16, top: -22, backgroundColor: "rgba(255,255,255,0.18)", transform: [{ rotate: "45deg" }] },
  traco: { position: "absolute", width: 180, height: 16, right: -20, top: 54, backgroundColor: "rgba(255,255,255,0.14)", transform: [{ rotate: "-12deg" }] },
  bicoEsq: { position: "absolute", width: "62%", height: 54, left: -16, bottom: -20, backgroundColor: FUNDO, transform: [{ rotate: "8deg" }] },
  bicoDir: { position: "absolute", width: "62%", height: 54, right: -16, bottom: -20, backgroundColor: FUNDO, transform: [{ rotate: "-8deg" }] },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  voltarTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "700" },
  cabecaLinha: { flexDirection: "row", alignItems: "center", gap: 12 },
  cabecaIcone: { width: 46, height: 46, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  cabecaTitulo: { color: "#ffffff", fontFamily: fonte, fontSize: 24, fontWeight: "800" },
  cabecaSub: { color: "rgba(255,255,255,0.9)", fontFamily: fonte, marginTop: 2 },
  tres: { flexDirection: "row", gap: 8 },
  grelha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statMeio: { width: "48%" },
  stat: { backgroundColor: cores.branco, borderRadius: 18, padding: 12, gap: 4, minHeight: 92 },
  statIcone: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statValor: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, fontSize: 16 },
  statRotulo: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  painel: { backgroundColor: cores.branco, borderRadius: 20, padding: 14, gap: 10 },
  tituloLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
  tituloIcone: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  titulo: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 16 },
  tituloNota: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  busca: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: FUNDO, borderRadius: 14, paddingHorizontal: 12 },
  buscaInput: { flex: 1, fontFamily: fonte, color: cores.titulo, paddingVertical: 12 },
  filtros: { flexDirection: "row", gap: 8 },
  filtro: { flex: 1, backgroundColor: FUNDO, borderRadius: 14, padding: 10, gap: 2 },
  filtroAberto: { backgroundColor: "#14532d" },
  filtroRotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 11, fontWeight: "700" },
  filtroValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  claro: { color: "#ffffff" },
  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  opcao: { backgroundColor: FUNDO, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  opcaoActiva: { backgroundColor: "#166534" },
  opcaoTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 12, fontWeight: "700" },
  opcaoTextoActiva: { color: "#ffffff" },
  accoes: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  limpar: { fontFamily: fonte, color: "#9b2c2c", fontWeight: "800" },
  partilhar: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#dcfce7", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  partilharTexto: { fontFamily: fonte, color: "#166534", fontWeight: "800" },
  cartao: { backgroundColor: cores.branco, borderRadius: 20, padding: 14, gap: 8 },
  cartaoTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" },
  nome: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  nota: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  ver: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" },
  duas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  meta: { width: "47%", flexDirection: "row", alignItems: "center", gap: 6 },
  metaTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontSize: 12 },
  metaValor: { fontFamily: fonte, color: "#166534", fontWeight: "800", fontSize: 12 },
  linhaEtiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  etiqueta: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  etiquetaTexto: { fontFamily: fonte, fontSize: 12, fontWeight: "800" },
  barra: { height: 7, borderRadius: 99, backgroundColor: "#e7f0ea", overflow: "hidden" },
  barraCheia: { height: 7, borderRadius: 99 },
  vazio: { backgroundColor: FUNDO, borderRadius: 16, padding: 16, alignItems: "center", gap: 4 },
  vazioTitulo: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  paginacao: { backgroundColor: cores.branco, borderRadius: 16, padding: 12, gap: 8 },
  paginas: { flexDirection: "row", justifyContent: "space-between" },
  paginaTexto: { fontFamily: fonte, color: "#166534", fontWeight: "800" },
  off: { color: "#c5ccc8" },
  infoRotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 12 },
  dado: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  dadoIcone: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dadoValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", marginTop: 1 },
  tempo: { flexDirection: "row", gap: 10 },
  eixo: { width: 28, alignItems: "center" },
  no: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  fio: { width: 2, flex: 1, minHeight: 18, backgroundColor: "#d7e8dc", marginTop: 4 },
  cartaoTempo: { flex: 1, backgroundColor: FUNDO, borderRadius: 16, padding: 12, gap: 6, marginBottom: 8 },
  mesTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mesNome: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 22 },
  nav: { flexDirection: "row", alignItems: "center", gap: 6 },
  hoje: { backgroundColor: "#dcfce7", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 },
  hojeTexto: { fontFamily: fonte, color: "#166534", fontWeight: "800" },
  seta: { width: 34, height: 34, borderRadius: 12, backgroundColor: FUNDO, alignItems: "center", justifyContent: "center" },
  legenda: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  pontoVazio: { width: 8, height: 8 },
  semana: { flexDirection: "row" },
  semanaTexto: { flex: 1, textAlign: "center", fontFamily: fonte, color: "#5f6662", fontSize: 11, fontWeight: "700" },
  fim: { color: "#b45309" },
  linhaDias: { flexDirection: "row", gap: 4 },
  dia: { flex: 1, minHeight: 48, borderRadius: 10, backgroundColor: FUNDO, alignItems: "center", justifyContent: "center", gap: 3 },
  diaActivo: { backgroundColor: "#14532d" },
  diaHoje: { borderWidth: 1.5, borderColor: "#22c55e" },
  diaNum: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 13 },
  diaTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  folha: { width: 52, height: 56, borderRadius: 14, backgroundColor: "#14532d", alignItems: "center", justifyContent: "center" },
  folhaMes: { color: "rgba(255,255,255,0.8)", fontFamily: fonte, fontSize: 11, fontWeight: "700" },
  folhaDia: { color: "#ffffff", fontFamily: fonte, fontSize: 20, fontWeight: "800" },
  rankTotal: { fontFamily: fonte, color: "#166534", fontWeight: "800" },
  mini: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: FUNDO, borderRadius: 14, padding: 10 },
  faixaCor: { width: 4, alignSelf: "stretch", borderRadius: 4 },
});

export default Emprestimos;
