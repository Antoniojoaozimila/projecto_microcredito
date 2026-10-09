import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  IconeAlerta, IconeCadeado, IconeDocumento, IconeEscudo, IconeFicha, IconeGrafico, IconeLupa, IconeMoeda,
  IconeNascer, IconeOlho, IconePercentagem, IconePessoa, IconePin, IconeSeta, IconeSino, IconeVoltar,
} from "../componentes/Icones";
import { aprovarGarantia, executarGarantia, notificarGarantia, penhorarGarantia, usarDados } from "../dados/operacao";
import { cores, fonte } from "../tema";

const FUNDO = "#f4f8f5";
const COR = "#9a3412";
const POR_PAGINA = 5;
const DIAS_EXEC = 30;
const ESTADOS = ["Em Avaliação", "Ativa", "Penhorada", "Libertada", "Executada", "Cancelada"];
const TIPOS = ["Sem Garantia", "Aval/Fiador", "Bem Móvel", "Bem Imóvel", "Cheque Caução", "Depósito Caução", "Outro"];
const MEIOS = ["Carta registada", "Entrega em mão", "Email", "SMS", "Notificação judicial"];
const mt = (valor) => `${Number(valor || 0).toLocaleString("pt-PT")} MT`;
const corEstado = (estado) => ({ "Em Avaliação": "#b45309", Ativa: "#0f766e", Penhorada: "#9b2c2c", Libertada: "#1d4ed8", Executada: "#7c3aed", Cancelada: "#5f6662" })[estado] || "#5f6662";
const diasDesde = (iso) => {
  if (!iso) return 0;
  const data = new Date(`${iso}T12:00:00`);
  return Math.max(0, Math.floor((Date.now() - data.getTime()) / 86400000));
};

const Entrada = ({ atraso = 0, children, style }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 460, delay: atraso, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [atraso, v]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>{children}</Animated.View>;
};

const Cabeca = ({ titulo, sub, Icone, onVoltar, voltar }) => {
  const sobe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sobe, { toValue: 1, duration: 520, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
  }, [sobe]);
  return (
    <Animated.View style={[estilos.cabeca, { opacity: sobe, transform: [{ translateY: sobe.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }] }]}>
      <View style={estilos.faixa} />
      <View style={estilos.losango} />
      <Pressable style={estilos.voltar} onPress={onVoltar}><IconeVoltar size={16} color="#ffffff" /><Text style={estilos.voltarTexto}>{voltar}</Text></Pressable>
      <View style={estilos.cabecaLinha}>
        <View style={estilos.cabecaIcone}><Icone size={22} color="#ffffff" /></View>
        <View style={estilos.flex}><Text style={estilos.cabecaTitulo}>{titulo}</Text><Text style={estilos.cabecaSub}>{sub}</Text></View>
      </View>
    </Animated.View>
  );
};

const Estatistica = ({ Icone, cor, rotulo, valor }) => {
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1.1, duration: 900, useNativeDriver: true }),
      Animated.timing(pulso, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso]);
  return (
    <View style={estilos.stat}>
      <Animated.View style={[estilos.statIcone, { backgroundColor: `${cor}18`, transform: [{ scale: pulso }] }]}><Icone size={16} color={cor} /></Animated.View>
      <Text style={estilos.statValor} numberOfLines={1}>{valor}</Text>
      <Text style={estilos.statRotulo}>{rotulo}</Text>
    </View>
  );
};

const Titulo = ({ Icone, cor, texto }) => (
  <View style={estilos.tituloLinha}><View style={[estilos.tituloIcone, { backgroundColor: `${cor}18` }]}><Icone size={15} color={cor} /></View><Text style={estilos.titulo}>{texto}</Text></View>
);
const Dado = ({ Icone, cor, rotulo, valor }) => (
  <View style={estilos.dado}><View style={[estilos.dadoIcone, { backgroundColor: `${cor}16` }]}><Icone size={15} color={cor} /></View><View style={estilos.flex}><Text style={estilos.rotulo}>{rotulo}</Text><Text style={estilos.dadoValor}>{valor || "—"}</Text></View></View>
);
const Etiqueta = ({ texto, cor }) => <View style={[estilos.etiqueta, { backgroundColor: `${cor}16` }]}><Text style={[estilos.etiquetaTexto, { color: cor }]}>{texto}</Text></View>;

const requisitos = (g) => ({
  dias: g.diasAtraso || 0,
  diasOk: (g.diasAtraso || 0) >= DIAS_EXEC,
  notificado: Boolean(g.notificacao),
  pronta: g.estado === "Penhorada" && (g.diasAtraso || 0) >= DIAS_EXEC && Boolean(g.notificacao),
});

const alertasDe = (garantias) => garantias.flatMap((g) => {
  const lista = [];
  if (g.estado === "Penhorada") {
    const r = requisitos(g);
    if (r.diasOk) lista.push({ chave: `${g.id}-exec`, nivel: "critico", categoria: "Execução", titulo: r.notificado ? "Pronta para execução" : "Falta notificação formal", texto: `${g.codigo} · ${g.cliente} · ${r.dias} dias de atraso.`, destino: "execucao", rotulo: r.notificado ? "Executar" : "Notificar", garantia: g });
    else if (r.dias >= 15) lista.push({ chave: `${g.id}-quase`, nivel: "alto", categoria: "Execução", titulo: `Execução em ${DIAS_EXEC - r.dias} dia(s)`, texto: `${g.codigo} · ${g.cliente} · ${r.dias} dias de atraso.`, destino: "penhoradas", rotulo: "Ver penhoradas", garantia: g });
  }
  if (g.estado === "Ativa" && g.diasAtraso > 0) lista.push({ chave: `${g.id}-atraso`, nivel: "alto", categoria: "Atraso", titulo: "Empréstimo em atraso", texto: `${g.codigo} · ${g.cliente} · ${g.diasAtraso} dia(s). Considere a penhora.`, destino: "penhoradas", rotulo: "Penhorar", garantia: g });
  if (g.estado === "Em Avaliação" && diasDesde(g.data) >= 7) lista.push({ chave: `${g.id}-aval`, nivel: "medio", categoria: "Avaliação", titulo: `Em avaliação há ${diasDesde(g.data)} dias`, texto: `${g.codigo} · ${g.cliente} aguarda análise.`, destino: "lista", rotulo: "Analisar", garantia: g });
  if (g.docsEmFalta) lista.push({ chave: `${g.id}-doc`, nivel: "medio", categoria: "Documentação", titulo: "Aprovação bloqueada", texto: `${g.codigo} · faltam documentos do aval ou da garantia.`, destino: "lista", rotulo: "Ver", garantia: g });
  if (g.estado !== "Executada" && g.tipo !== "Sem Garantia" && g.cobertura < 100) lista.push({ chave: `${g.id}-cob`, nivel: "medio", categoria: "Cobertura", titulo: `Cobertura insuficiente (${g.cobertura}%)`, texto: `${g.codigo} · ${g.cliente} · a garantia cobre ${g.cobertura}% do crédito.`, destino: "lista", rotulo: "Ver", garantia: g });
  return lista;
});

const Ficha = ({ garantia, onVoltar }) => {
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1.04, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulso, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso]);
  const linhas = [
    [IconeDocumento, COR, "Código", garantia.codigo],
    [IconePessoa, "#1d4ed8", "Cliente", garantia.cliente],
    [IconeFicha, "#14532d", "Contrato", garantia.contrato],
    [IconeGrafico, "#7c3aed", "Tipo", garantia.subtipo ? `${garantia.tipo} · ${garantia.subtipo}` : garantia.tipo],
    [IconePin, "#0f766e", "Local", garantia.local],
    [IconeNascer, "#1d4ed8", "Registo", garantia.data],
    [IconeAlerta, "#9b2c2c", "Atraso", garantia.diasAtraso ? `${garantia.diasAtraso} dias` : "Em dia"],
    [IconeSino, "#b45309", "Notificação", garantia.notificacao ? `${garantia.notificacao.meio} · ${garantia.notificacao.data}` : "Por notificar"],
    [IconeDocumento, "#5f6662", "Descrição", garantia.descricao],
  ];
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Garantia" sub={garantia.codigo} Icone={IconeEscudo} onVoltar={onVoltar} voltar="Voltar" />
      <ScrollView contentContainerStyle={estilos.corpo} showsVerticalScrollIndicator={false}>
        <Entrada>
          <View style={estilos.talao}>
            <View style={estilos.furoEsq} />
            <View style={estilos.furoDir} />
            <Animated.View style={[estilos.talaoHero, { transform: [{ scale: pulso }] }]}>
              <View style={estilos.talaoSelo}><IconeEscudo size={22} color={COR} /></View>
              <Text style={estilos.talaoLegenda}>Valor da garantia</Text>
              <Text style={estilos.talaoValor}>{mt(garantia.valor)}</Text>
              <View style={[estilos.talaoEstado, { backgroundColor: `${corEstado(garantia.estado)}16` }]}>
                <IconeEscudo size={14} color={corEstado(garantia.estado)} />
                <Text style={[estilos.talaoEstadoTexto, { color: corEstado(garantia.estado) }]}>{garantia.estado}</Text>
              </View>
            </Animated.View>
            <View style={estilos.picotes} />
            <View style={estilos.talaoPar}>
              <View style={estilos.talaoBloco}>
                <View style={[estilos.talaoBlocoIcone, { backgroundColor: "#ffedd5" }]}><IconePercentagem size={18} color="#b45309" /></View>
                <Text style={estilos.talaoBlocoRotulo}>Cobertura</Text>
                <Text style={estilos.talaoBlocoValor}>{garantia.cobertura || 0}%</Text>
              </View>
              <View style={estilos.talaoBloco}>
                <View style={[estilos.talaoBlocoIcone, { backgroundColor: "#fee2e2" }]}><IconeAlerta size={18} color="#9b2c2c" /></View>
                <Text style={estilos.talaoBlocoRotulo}>Atraso</Text>
                <Text style={estilos.talaoBlocoValor}>{garantia.diasAtraso ? `${garantia.diasAtraso} dias` : "Em dia"}</Text>
              </View>
            </View>
            {linhas.map(([Icone, cor, rotulo, valor], indice) => (
              <Entrada key={rotulo} atraso={80 + indice * 35}>
                <View style={estilos.reciboLinha}>
                  <View style={[estilos.reciboIcone, { backgroundColor: `${cor}14` }]}><Icone size={18} color={cor} /></View>
                  <View style={estilos.reciboTexto}>
                    <Text style={estilos.reciboRotulo}>{rotulo}</Text>
                    <Text style={estilos.reciboValor}>{valor || "—"}</Text>
                  </View>
                </View>
              </Entrada>
            ))}
          </View>
        </Entrada>
      </ScrollView>
    </View>
  );
};

const Folha = ({ visivel, titulo, children, onFechar, onConfirmar, texto }) => (
  <Modal transparent visible={visivel} animationType="slide" onRequestClose={onFechar}>
    <Pressable style={estilos.vela} onPress={onFechar}>
      <Pressable style={estilos.folha} onPress={() => {}}>
        <View style={estilos.puxador} />
        <Text style={estilos.folhaTitulo}>{titulo}</Text>
        {children}
        <Pressable style={estilos.botao} onPress={onConfirmar}><Text style={estilos.botaoTexto}>{texto}</Text></Pressable>
      </Pressable>
    </Pressable>
  </Modal>
);

const Lista = ({ onVoltar, onAbrir }) => {
  const { garantias } = usarDados();
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return garantias.filter((g) => {
      if (estado && g.estado !== estado) return false;
      if (tipo && g.tipo !== tipo) return false;
      if (!q) return true;
      return `${g.codigo} ${g.contrato} ${g.cliente} ${g.descricao}`.toLowerCase().includes(q);
    });
  }, [busca, estado, garantias, tipo]);
  const paginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const inicio = (actual - 1) * POR_PAGINA;
  const itens = visiveis.slice(inicio, inicio + POR_PAGINA);
  const activas = garantias.filter((g) => g.estado === "Ativa");
  const penhoradas = garantias.filter((g) => g.estado === "Penhorada");
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Lista de garantias" sub={`${garantias.length} garantias na carteira`} Icone={IconeEscudo} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo} keyboardShouldPersistTaps="handled">
        <View style={estilos.grelha}>
          {[
            [IconeNascer, "#b45309", "Em avaliação", String(garantias.filter((g) => g.estado === "Em Avaliação").length)],
            [IconeEscudo, "#0f766e", "Activas", String(activas.length)],
            [IconeCadeado, "#9b2c2c", "Penhoradas", String(penhoradas.length)],
            [IconeMoeda, "#1d4ed8", "Em garantia", mt([...activas, ...penhoradas].reduce((s, g) => s + Number(g.valor), 0))],
          ].map(([Icone, cor, rotulo, valor], i) => <Entrada key={rotulo} atraso={i * 50} style={estilos.meio}><Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} /></Entrada>)}
        </View>
        <Entrada atraso={120}>
          <View style={estilos.painel}>
            <Titulo Icone={IconeLupa} cor={COR} texto="Encontrar" />
            <View style={estilos.busca}><IconeLupa size={16} color={COR} /><TextInput value={busca} onChangeText={(v) => { setBusca(v); setPagina(1); }} placeholder="Código, contrato, cliente" placeholderTextColor={cores.placeholder} style={estilos.buscaInput} /></View>
            <View style={estilos.filtroGrelha}>
              {[
                ["estado", IconeEscudo, "Estado", estado || "Todos"],
                ["tipo", IconeGrafico, "Tipo", tipo || "Todos"],
              ].map(([id, Icone, rotulo, texto]) => (
                <Pressable key={id} style={[estilos.filtroCartao, menu === id && estilos.filtroCartaoOn]} onPress={() => setMenu(id)}>
                  <View style={estilos.filtroIcone}><Icone size={18} color={COR} /></View>
                  <Text style={estilos.filtroRotulo}>{rotulo}</Text>
                  <Text style={estilos.filtroValor} numberOfLines={1}>{texto}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Entrada>
        {itens.map((g, i) => (
          <Entrada key={g.id} atraso={i * 40}>
            <Pressable style={estilos.cartao} onPress={() => onAbrir(g)}>
              <View style={estilos.cartaoTopo}>
                <View style={estilos.avatar}><IconeEscudo size={16} color={COR} /></View>
                <View style={estilos.flex}><Text style={estilos.nome}>{g.codigo}</Text><Text style={estilos.nota}>{g.cliente} · {g.contrato}</Text></View>
                <View style={estilos.ver}><IconeOlho size={16} color={COR} /></View>
              </View>
              <View style={estilos.par}>
                <View style={estilos.meta}><IconeGrafico size={14} color="#7c3aed" /><Text style={estilos.metaTexto}>{g.tipo}</Text></View>
                <View style={estilos.meta}><IconeMoeda size={14} color="#0f766e" /><Text style={estilos.metaTexto}>{mt(g.valor)}</Text></View>
                <View style={estilos.meta}><IconePercentagem size={14} color="#b45309" /><Text style={estilos.metaTexto}>{g.cobertura}%</Text></View>
                <View style={estilos.meta}><IconeNascer size={14} color="#1d4ed8" /><Text style={estilos.metaTexto}>{g.data}</Text></View>
              </View>
              <View style={estilos.etiquetas}><Etiqueta texto={g.estado} cor={corEstado(g.estado)} /></View>
              {g.estado === "Em Avaliação" ? <Pressable style={estilos.acao} onPress={() => aprovarGarantia(g.id)}><Text style={estilos.acaoTexto}>Aprovar</Text></Pressable> : null}
            </Pressable>
          </Entrada>
        ))}
        {visiveis.length ? <Text style={estilos.nota}>{inicio + 1}–{Math.min(inicio + POR_PAGINA, visiveis.length)} de {visiveis.length}</Text> : <Text style={estilos.nota}>Nenhuma garantia encontrada.</Text>}
        <View style={estilos.paginas}>
          <Pressable disabled={actual <= 1} onPress={() => setPagina(actual - 1)}><Text style={[estilos.link, actual <= 1 && estilos.off]}>Anterior</Text></Pressable>
          <Text style={estilos.link}>{actual} / {paginas}</Text>
          <Pressable disabled={actual >= paginas} onPress={() => setPagina(actual + 1)}><Text style={[estilos.link, actual >= paginas && estilos.off]}>Seguinte</Text></Pressable>
        </View>
      </ScrollView>
      <Modal transparent visible={Boolean(menu)} animationType="slide" onRequestClose={() => setMenu(null)}>
        <Pressable style={estilos.vela} onPress={() => setMenu(null)}>
          <Pressable style={estilos.folhaFiltro} onPress={() => {}}>
            <View style={estilos.puxador} />
            <Text style={estilos.folhaTitulo}>{menu === "tipo" ? "Tipo de garantia" : "Estado da garantia"}</Text>
            <ScrollView style={estilos.folhaLista} showsVerticalScrollIndicator={false}>
              {(menu === "tipo" ? ["Todos", ...TIPOS] : ["Todos", ...ESTADOS]).map((opcao, indice) => {
                const actualFiltro = menu === "tipo" ? (tipo || "Todos") : (estado || "Todos");
                const activo = actualFiltro === opcao;
                const cor = menu === "tipo" ? "#7c3aed" : corEstado(opcao === "Todos" ? "" : opcao);
                const Icone = menu === "tipo" ? IconeGrafico : IconeEscudo;
                return (
                  <Entrada key={opcao} atraso={indice * 28}>
                    <Pressable
                      style={[estilos.opcaoFolha, activo && estilos.opcaoFolhaOn]}
                      onPress={() => {
                        if (menu === "tipo") setTipo(opcao === "Todos" ? "" : opcao);
                        else setEstado(opcao === "Todos" ? "" : opcao);
                        setPagina(1);
                        setMenu(null);
                      }}
                    >
                      <View style={[estilos.opcaoFolhaIcone, { backgroundColor: activo ? "rgba(255,255,255,0.2)" : `${cor}16` }]}>
                        <Icone size={18} color={activo ? "#ffffff" : cor} />
                      </View>
                      <Text style={[estilos.opcaoFolhaTexto, activo && estilos.claro]}>{opcao}</Text>
                      <View style={[estilos.opcaoMarca, activo && estilos.opcaoMarcaOn]}>{activo ? <Text style={estilos.checkEscuro}>✓</Text> : null}</View>
                    </Pressable>
                  </Entrada>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const Penhoradas = ({ onVoltar, onAbrir }) => {
  const { garantias, emprestimos } = usarDados();
  const [busca, setBusca] = useState("");
  const [accao, setAccao] = useState(null);
  const [meio, setMeio] = useState(MEIOS[0]);
  const filtrar = (lista) => {
    const q = busca.trim().toLowerCase();
    return q ? lista.filter((g) => `${g.codigo} ${g.cliente} ${g.contrato}`.toLowerCase().includes(q)) : lista;
  };
  const penhoradas = filtrar(garantias.filter((g) => g.estado === "Penhorada")).sort((a, b) => b.diasAtraso - a.diasAtraso);
  const elegiveis = filtrar(garantias.filter((g) => g.estado === "Ativa" && emprestimos.find((e) => e.contrato === g.contrato)?.estado === "Em atraso"));
  const confirmar = () => {
    if (!accao) return;
    if (accao.tipo === "penhorar") penhorarGarantia(accao.garantia.id);
    if (accao.tipo === "notificar") notificarGarantia(accao.garantia.id, meio);
    if (accao.tipo === "executar") executarGarantia(accao.garantia.id, "Execução após notificação e prazo", accao.garantia.valor);
    setAccao(null);
  };
  const Cartao = ({ g, accoes }) => (
    <Pressable style={estilos.cartao} onPress={() => onAbrir(g)}>
      <View style={estilos.cartaoTopo}>
        <View style={estilos.avatar}><IconePessoa size={16} color={COR} /></View>
        <View style={estilos.flex}><Text style={estilos.nome}>{g.cliente}</Text><Text style={estilos.nota}>{g.codigo} · {g.contrato}</Text></View>
        <IconeOlho size={16} color={COR} />
      </View>
      <View style={estilos.par}>
        <View style={estilos.meta}><IconeMoeda size={14} color="#0f766e" /><Text style={estilos.metaTexto}>{mt(g.valor)}</Text></View>
        <View style={estilos.meta}><IconeAlerta size={14} color="#9b2c2c" /><Text style={estilos.metaTexto}>{g.diasAtraso} dias</Text></View>
        <View style={estilos.meta}><IconeSino size={14} color="#b45309" /><Text style={estilos.metaTexto}>{g.notificacao ? g.notificacao.meio : "Por notificar"}</Text></View>
      </View>
      <View style={estilos.accoes}>{accoes}</View>
    </Pressable>
  );
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Penhoradas" sub={`${penhoradas.length} penhoradas · ${elegiveis.length} elegíveis`} Icone={IconeCadeado} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        <View style={estilos.grelha}>
          {[
            [IconeCadeado, "#9b2c2c", "Penhoradas", String(garantias.filter((g) => g.estado === "Penhorada").length)],
            [IconeMoeda, "#1d4ed8", "Valor", mt(garantias.filter((g) => g.estado === "Penhorada").reduce((s, g) => s + g.valor, 0))],
            [IconeSino, "#b45309", "Notificadas", String(garantias.filter((g) => g.estado === "Penhorada" && g.notificacao).length)],
            [IconeGrafico, "#0f766e", "Prontas", String(garantias.filter((g) => requisitos(g).pronta).length)],
          ].map(([Icone, cor, rotulo, valor], i) => <Entrada key={rotulo} atraso={i * 40} style={estilos.meio}><Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} /></Entrada>)}
        </View>
        <View style={estilos.busca}><IconeLupa size={16} color={COR} /><TextInput value={busca} onChangeText={setBusca} placeholder="Código, contrato ou cliente" placeholderTextColor={cores.placeholder} style={estilos.buscaInput} /></View>
        <Titulo Icone={IconeCadeado} cor="#9b2c2c" texto="Garantias penhoradas" />
        {penhoradas.map((g) => <Cartao key={g.id} g={g} accoes={
          <>
            <Pressable style={estilos.acao} onPress={() => setAccao({ tipo: "notificar", garantia: g })}><Text style={estilos.acaoTexto}>Notificar</Text></Pressable>
            <Pressable style={[estilos.acao, !requisitos(g).pronta && estilos.acaoOff]} disabled={!requisitos(g).pronta} onPress={() => setAccao({ tipo: "executar", garantia: g })}><Text style={estilos.acaoTexto}>Executar</Text></Pressable>
          </>
        } />)}
        <Titulo Icone={IconeAlerta} cor="#b45309" texto="Activas com empréstimo em atraso" />
        {elegiveis.length === 0 ? <Text style={estilos.nota}>Nenhuma garantia a penhorar.</Text> : elegiveis.map((g) => <Cartao key={g.id} g={g} accoes={<Pressable style={estilos.acao} onPress={() => setAccao({ tipo: "penhorar", garantia: g })}><Text style={estilos.acaoTexto}>Penhorar</Text></Pressable>} />)}
      </ScrollView>
      <Folha visivel={Boolean(accao)} titulo={accao?.tipo === "notificar" ? "Notificar cliente" : accao?.tipo === "executar" ? "Executar garantia" : "Penhorar garantia"} texto="Confirmar" onFechar={() => setAccao(null)} onConfirmar={confirmar}>
        <Text style={estilos.nota}>{accao?.garantia.codigo} · {accao?.garantia.cliente}</Text>
        {accao?.tipo === "notificar" ? MEIOS.map((op, indice) => (
          <Entrada key={op} atraso={indice * 30}>
            <Pressable style={[estilos.opcaoFolha, meio === op && estilos.opcaoFolhaOn]} onPress={() => setMeio(op)}>
              <View style={[estilos.opcaoFolhaIcone, { backgroundColor: meio === op ? "rgba(255,255,255,0.2)" : "#ffedd5" }]}><IconeSino size={18} color={meio === op ? "#ffffff" : COR} /></View>
              <Text style={[estilos.opcaoFolhaTexto, meio === op && estilos.claro]}>{op}</Text>
              <View style={[estilos.opcaoMarca, meio === op && estilos.opcaoMarcaOn]}>{meio === op ? <Text style={estilos.checkEscuro}>✓</Text> : null}</View>
            </Pressable>
          </Entrada>
        )) : <Text style={estilos.nota}>A penhora e a execução seguem o prazo e a notificação do web.</Text>}
      </Folha>
    </View>
  );
};

const Execucao = ({ onVoltar, onAbrir }) => {
  const { garantias } = usarDados();
  const [accao, setAccao] = useState(null);
  const [meio, setMeio] = useState(MEIOS[0]);
  const [motivo, setMotivo] = useState("");
  const penhoradas = garantias.filter((g) => g.estado === "Penhorada").map((g) => ({ ...g, r: requisitos(g) })).sort((a, b) => Number(b.r.pronta) - Number(a.r.pronta));
  const executadas = garantias.filter((g) => g.estado === "Executada");
  const confirmar = () => {
    if (!accao) return;
    if (accao.tipo === "notificar") notificarGarantia(accao.garantia.id, meio);
    if (accao.tipo === "executar") executarGarantia(accao.garantia.id, motivo || "Execução da garantia", accao.garantia.valor);
    setAccao(null);
    setMotivo("");
  };
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Execução" sub={`Após ${DIAS_EXEC} dias de atraso`} Icone={IconeGrafico} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        <View style={estilos.grelha}>
          {[
            [IconeGrafico, "#9b2c2c", "Prontas", String(penhoradas.filter((g) => g.r.pronta).length)],
            [IconeSino, "#b45309", "Sem notificação", String(penhoradas.filter((g) => g.r.diasOk && !g.r.notificado).length)],
            [IconeNascer, "#1d4ed8", "Dentro do prazo", String(penhoradas.filter((g) => !g.r.diasOk).length)],
            [IconeMoeda, "#0f766e", "Recuperado", mt(executadas.reduce((s, g) => s + Number(g.valorRecuperado || 0), 0))],
          ].map(([Icone, cor, rotulo, valor], i) => <Entrada key={rotulo} atraso={i * 40} style={estilos.meio}><Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} /></Entrada>)}
        </View>
        <Titulo Icone={IconeGrafico} cor={COR} texto="Processos de execução" />
        {penhoradas.map((g, i) => (
          <Entrada key={g.id} atraso={i * 40}>
            <View style={[estilos.cartao, g.r.pronta && estilos.cartaoPronto]}>
              <Text style={estilos.nome}>{g.cliente}</Text>
              <Text style={estilos.nota}>{g.codigo} · {g.contrato}</Text>
              {[
                [true, `Penhorada em ${g.dataPenhor || "—"}`],
                [g.r.diasOk, g.r.diasOk ? `${g.r.dias} dias de atraso` : `Faltam ${DIAS_EXEC - g.r.dias} dia(s)`],
                [g.r.notificado, g.r.notificado ? `Notificado por ${g.notificacao.meio}` : "Notificação formal ao cliente"],
              ].map(([ok, texto]) => (
                <View key={texto} style={estilos.meta}><IconeEscudo size={14} color={ok ? "#0f766e" : "#b45309"} /><Text style={estilos.metaTexto}>{texto}</Text></View>
              ))}
              <View style={estilos.accoes}>
                <Pressable style={estilos.acaoClara} onPress={() => onAbrir(g)}><Text style={estilos.acaoClaraTexto}>Ver</Text></Pressable>
                {!g.r.notificado ? <Pressable style={estilos.acao} onPress={() => setAccao({ tipo: "notificar", garantia: g })}><Text style={estilos.acaoTexto}>Notificar</Text></Pressable> : null}
                <Pressable style={[estilos.acao, !g.r.pronta && estilos.acaoOff]} disabled={!g.r.pronta} onPress={() => setAccao({ tipo: "executar", garantia: g })}><Text style={estilos.acaoTexto}>Executar</Text></Pressable>
              </View>
            </View>
          </Entrada>
        ))}
        <Titulo Icone={IconeDocumento} cor="#7c3aed" texto="Garantias executadas" />
        {executadas.map((g) => (
          <Pressable key={g.id} style={estilos.cartao} onPress={() => onAbrir(g)}>
            <View style={estilos.par}>
              <View style={estilos.celula}><Dado Icone={IconePessoa} cor="#1d4ed8" rotulo="Cliente" valor={g.cliente} /></View>
              <View style={estilos.celula}><Dado Icone={IconeNascer} cor="#7c3aed" rotulo="Execução" valor={g.dataExecucao} /></View>
              <View style={estilos.celula}><Dado Icone={IconeMoeda} cor="#0f766e" rotulo="Recuperado" valor={mt(g.valorRecuperado)} /></View>
              <View style={estilos.celula}><Dado Icone={IconeDocumento} cor={COR} rotulo="Motivo" valor={g.motivo} /></View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Folha visivel={Boolean(accao)} titulo={accao?.tipo === "executar" ? "Executar garantia" : "Notificar cliente"} texto="Confirmar" onFechar={() => setAccao(null)} onConfirmar={confirmar}>
        {accao?.tipo === "notificar" ? MEIOS.map((op, indice) => (
          <Entrada key={op} atraso={indice * 30}>
            <Pressable style={[estilos.opcaoFolha, meio === op && estilos.opcaoFolhaOn]} onPress={() => setMeio(op)}>
              <View style={[estilos.opcaoFolhaIcone, { backgroundColor: meio === op ? "rgba(255,255,255,0.2)" : "#ffedd5" }]}><IconeSino size={18} color={meio === op ? "#ffffff" : COR} /></View>
              <Text style={[estilos.opcaoFolhaTexto, meio === op && estilos.claro]}>{op}</Text>
              <View style={[estilos.opcaoMarca, meio === op && estilos.opcaoMarcaOn]}>{meio === op ? <Text style={estilos.checkEscuro}>✓</Text> : null}</View>
            </Pressable>
          </Entrada>
        )) : <TextInput value={motivo} onChangeText={setMotivo} placeholder="Motivo da execução" placeholderTextColor={cores.placeholder} style={estilos.input} />}
      </Folha>
    </View>
  );
};

const NIVEIS = [
  ["critico", "Críticos", "Acção imediata", IconeAlerta, "#9b2c2c"],
  ["alto", "Altos", "Resolver hoje", IconeSino, "#b45309"],
  ["medio", "Médios", "Acompanhar", IconeGrafico, "#1d4ed8"],
];
const ICONE_CAT = { Execução: IconeGrafico, Atraso: IconeNascer, Avaliação: IconeFicha, Documentação: IconeDocumento, Cobertura: IconePercentagem };

const Alertas = ({ onVoltar, onIr }) => {
  const { garantias } = usarDados();
  const alertas = useMemo(() => alertasDe(garantias), [garantias]);
  const [nivel, setNivel] = useState("");
  const [categoria, setCategoria] = useState("");
  const categorias = [...new Set(alertas.map((a) => a.categoria))];
  const visiveis = alertas.filter((a) => (!nivel || a.nivel === nivel) && (!categoria || a.categoria === categoria));
  const criticos = alertas.filter((a) => a.nivel === "critico").length;
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Alertas" sub={`${alertas.length} alertas de garantias`} Icone={IconeSino} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        <Entrada>
          <View style={[estilos.hero, criticos ? estilos.heroCritico : null]}>
            <IconeSino size={26} color={criticos ? "#9b2c2c" : COR} />
            <View style={estilos.flex}>
              <Text style={estilos.nome}>{criticos ? `${criticos} alerta${criticos === 1 ? "" : "s"} crítico${criticos === 1 ? "" : "s"}` : alertas.length ? "Há garantias para acompanhar" : "Todas as garantias estão em ordem"}</Text>
              <Text style={estilos.nota}>Prazos, atraso, avaliação, documentação e cobertura.</Text>
            </View>
          </View>
        </Entrada>
        <View style={estilos.grelha}>
          {NIVEIS.map(([id, rotulo, texto, Icone, cor], i) => {
            const total = alertas.filter((a) => a.nivel === id).length;
            return (
              <Entrada key={id} atraso={i * 50} style={estilos.meio}>
                <Pressable onPress={() => setNivel(nivel === id ? "" : id)}><Estatistica Icone={Icone} cor={nivel === id ? COR : cor} rotulo={`${rotulo} · ${texto}`} valor={String(total)} /></Pressable>
              </Entrada>
            );
          })}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
          <Pressable style={[estilos.chip, !categoria && estilos.chipOn]} onPress={() => setCategoria("")}><Text style={[estilos.chipTexto, !categoria && estilos.claro]}>Todas</Text></Pressable>
          {categorias.map((c) => <Pressable key={c} style={[estilos.chip, categoria === c && estilos.chipOn]} onPress={() => setCategoria(categoria === c ? "" : c)}><Text style={[estilos.chipTexto, categoria === c && estilos.claro]}>{c}</Text></Pressable>)}
        </ScrollView>
        {visiveis.map((a, i) => {
          const Icone = ICONE_CAT[a.categoria] || IconeAlerta;
          return (
            <Entrada key={a.chave} atraso={i * 35}>
              <View style={estilos.cartao}>
                <View style={estilos.cartaoTopo}>
                  <View style={[estilos.avatar, { backgroundColor: `${corEstado(a.nivel === "critico" ? "Penhorada" : "Em Avaliação")}18` }]}><Icone size={16} color={a.nivel === "critico" ? "#9b2c2c" : COR} /></View>
                  <View style={estilos.flex}>
                    <Text style={estilos.nome}>{a.titulo}</Text>
                    <Text style={estilos.nota}>{a.texto}</Text>
                  </View>
                </View>
                <View style={estilos.etiquetas}><Etiqueta texto={a.categoria} cor={COR} /><Etiqueta texto={a.garantia.codigo} cor="#1d4ed8" /></View>
                <Pressable style={estilos.acao} onPress={() => onIr(a.destino, a.garantia)}><Text style={estilos.acaoTexto}>{a.rotulo}</Text></Pressable>
              </View>
            </Entrada>
          );
        })}
      </ScrollView>
    </View>
  );
};

const Garantias = ({ modo, onVoltar }) => {
  const [destino, setDestino] = useState(null);
  const [ficha, setFicha] = useState(null);
  useEffect(() => { setDestino(null); setFicha(null); }, [modo]);
  const actual = destino || modo;
  const voltar = destino ? () => setDestino(null) : onVoltar;
  if (ficha) return <Ficha garantia={ficha} onVoltar={() => setFicha(null)} />;
  if (actual === "penhoradas") return <Penhoradas onVoltar={voltar} onAbrir={setFicha} />;
  if (actual === "execucao") return <Execucao onVoltar={voltar} onAbrir={setFicha} />;
  if (actual === "alertas") return <Alertas onVoltar={voltar} onIr={(prox, garantia) => { if (prox === "lista") setFicha(garantia); else setDestino(prox); }} />;
  return <Lista onVoltar={voltar} onAbrir={setFicha} />;
};

const estilos = StyleSheet.create({
  ecra: { flex: 1, backgroundColor: FUNDO },
  scroll: { flex: 1 },
  corpo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, gap: 10 },
  flex: { flex: 1 },
  cabeca: { overflow: "hidden", backgroundColor: COR, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 56, minHeight: 148 },
  faixa: { position: "absolute", width: 160, height: 280, left: -70, top: -40, backgroundColor: "#c2410c", transform: [{ rotate: "-28deg" }] },
  losango: { position: "absolute", width: 86, height: 86, backgroundColor: FUNDO, bottom: -54, alignSelf: "center", left: "42%", transform: [{ rotate: "45deg" }] },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  voltarTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "700" },
  cabecaLinha: { flexDirection: "row", alignItems: "center", gap: 12 },
  cabecaIcone: { width: 46, height: 46, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  cabecaTitulo: { color: "#ffffff", fontFamily: fonte, fontSize: 24, fontWeight: "800" },
  cabecaSub: { color: "rgba(255,255,255,0.9)", fontFamily: fonte, marginTop: 2 },
  grelha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  meio: { width: "48%" },
  stat: { backgroundColor: cores.branco, borderRadius: 18, padding: 12, gap: 4, minHeight: 96 },
  statIcone: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  statValor: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, fontSize: 16 },
  statRotulo: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  painel: { backgroundColor: cores.branco, borderRadius: 20, padding: 14, gap: 10 },
  tituloLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
  tituloIcone: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  titulo: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 16 },
  dado: { flexDirection: "row", alignItems: "center", gap: 8 },
  dadoIcone: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  dadoValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  rotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700" },
  par: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  celula: { width: "47%" },
  busca: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: FUNDO, borderRadius: 14, paddingHorizontal: 12 },
  buscaInput: { flex: 1, fontFamily: fonte, color: cores.titulo, paddingVertical: 11 },
  menuBotao: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: FUNDO, borderRadius: 14, padding: 10 },
  selectorIcone: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" },
  menu: { backgroundColor: cores.branco, borderRadius: 14, borderWidth: 1, borderColor: "#f3d7c8", overflow: "hidden" },
  menuItem: { paddingHorizontal: 12, paddingVertical: 11 },
  menuItemOn: { backgroundColor: COR },
  menuTexto: { fontFamily: fonte, color: cores.titulo, fontWeight: "700" },
  claro: { color: "#ffffff" },
  cartao: { backgroundColor: cores.branco, borderRadius: 18, padding: 12, gap: 8 },
  cartaoPronto: { borderWidth: 1.5, borderColor: "#9b2c2c" },
  cartaoTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" },
  nome: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  nota: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  ver: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 13 },
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  etiqueta: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  etiquetaTexto: { fontFamily: fonte, fontSize: 11, fontWeight: "800" },
  accoes: { flexDirection: "row", gap: 8 },
  acao: { backgroundColor: COR, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  acaoOff: { opacity: 0.4 },
  acaoTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "800", fontSize: 12 },
  acaoClara: { backgroundColor: "#ffedd5", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  acaoClaraTexto: { color: COR, fontFamily: fonte, fontWeight: "800", fontSize: 12 },
  paginas: { flexDirection: "row", justifyContent: "space-between", backgroundColor: cores.branco, borderRadius: 14, padding: 12 },
  link: { fontFamily: fonte, color: COR, fontWeight: "800" },
  off: { color: "#c5ccc8" },
  hero: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: cores.branco, borderRadius: 20, padding: 14 },
  heroCritico: { borderWidth: 1.5, borderColor: "#fecaca" },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { backgroundColor: cores.branco, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: COR },
  chipTexto: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 12 },
  vela: { flex: 1, backgroundColor: "rgba(15, 23, 20, 0.48)", justifyContent: "flex-end" },
  folha: { backgroundColor: cores.branco, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 28, gap: 10 },
  puxador: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#e7d5cb", alignSelf: "center" },
  folhaTitulo: { fontFamily: fonte, color: cores.titulo, fontSize: 18, fontWeight: "800" },
  botao: { backgroundColor: COR, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  botaoTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "800" },
  input: { backgroundColor: FUNDO, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonte, color: cores.titulo },
  talao: { backgroundColor: cores.branco, borderRadius: 28, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 12, overflow: "hidden" },
  furoEsq: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: FUNDO, left: -14, top: 168 },
  furoDir: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: FUNDO, right: -14, top: 168 },
  talaoHero: { alignItems: "center", gap: 6, paddingBottom: 18 },
  talaoSelo: { width: 56, height: 56, borderRadius: 20, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  talaoLegenda: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  talaoValor: { fontFamily: fonte, color: COR, fontSize: 32, fontWeight: "800" },
  talaoEstado: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: 6 },
  talaoEstadoTexto: { fontFamily: fonte, fontWeight: "800", fontSize: 13 },
  picotes: { height: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: "#f3d7c8", marginBottom: 16 },
  talaoPar: { flexDirection: "row", gap: 12, marginBottom: 8 },
  talaoBloco: { flex: 1, backgroundColor: FUNDO, borderRadius: 20, padding: 14, gap: 6 },
  talaoBlocoIcone: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  talaoBlocoRotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700" },
  talaoBlocoValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 16 },
  reciboLinha: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 16 },
  reciboIcone: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  reciboTexto: { flex: 1, gap: 3 },
  reciboRotulo: { fontFamily: fonte, color: "#8d9390", fontSize: 12, fontWeight: "700" },
  reciboValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 15 },
  filtroGrelha: { flexDirection: "row", gap: 10 },
  filtroCartao: { flex: 1, backgroundColor: FUNDO, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 8, alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: "transparent" },
  filtroCartaoOn: { borderColor: COR },
  filtroIcone: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" },
  filtroRotulo: { fontFamily: fonte, color: "#8d9390", fontSize: 11, fontWeight: "700" },
  filtroValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 12, textAlign: "center" },
  folhaFiltro: { backgroundColor: cores.branco, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, maxHeight: "78%" },
  folhaLista: { marginTop: 8 },
  opcaoFolha: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: FUNDO, borderRadius: 18, padding: 12, marginBottom: 8 },
  opcaoFolhaOn: { backgroundColor: COR },
  opcaoFolhaIcone: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  opcaoFolhaTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 15 },
  opcaoMarca: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: "#e7d5cb", alignItems: "center", justifyContent: "center" },
  opcaoMarcaOn: { backgroundColor: "#ffffff", borderColor: "#ffffff" },
  checkEscuro: { color: COR, fontWeight: "800", fontSize: 12 },
});

export default Garantias;
