import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  IconeAlerta, IconeCarteira, IconeCasa, IconeDocumento, IconeEngrenagem, IconeEscudo, IconeEstrela,
  IconeLupa, IconeMapa, IconeMoeda, IconePin, IconeSol, IconeTelemovel, IconeVoltar,
} from "../componentes/Icones";
import { guardarDespesa, guardarMovimento, usarDados } from "../dados/operacao";
import { cores, fonte } from "../tema";

const FUNDO = "#f4f8f5";
const COR = "#1e3a8a";
const LOGOS = {
  mpesa: require("../../assets/mpesa.png"),
  emola: require("../../assets/emola.png"),
  mkesh: require("../../assets/mkesh.png"),
  bci: require("../../assets/bci.png"),
  bim: require("../../assets/bim.png"),
  standard: require("../../assets/standard.png"),
  letshego: require("../../assets/letshego.jpg"),
  moza: require("../../assets/moza.png"),
};
const CATEGORIAS = [
  ["Transporte", IconeMapa],
  ["Material", IconeDocumento],
  ["Salário", IconeMoeda],
  ["Renda", IconeCasa],
  ["Água", IconePin],
  ["Energia", IconeSol],
  ["Internet", IconeTelemovel],
  ["Manutenção", IconeEngrenagem],
  ["Marketing", IconeEstrela],
  ["Outro", IconeDocumento],
];
const mt = (valor) => `${Number(valor || 0).toLocaleString("pt-PT")} MT`;
const hoje = () => new Date().toISOString().slice(0, 10);

const Entrada = ({ atraso = 0, children, style }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 480, delay: atraso, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [atraso, v]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>{children}</Animated.View>;
};

const Cabeca = ({ titulo, sub, Icone, onVoltar, voltar = "Módulos" }) => {
  const sobe = useRef(new Animated.Value(0)).current;
  const moeda = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.timing(sobe, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(moeda, { toValue: 1, duration: 1600, useNativeDriver: true }),
      Animated.timing(moeda, { toValue: 0.92, duration: 1600, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [moeda, sobe]);
  return (
    <Animated.View style={[estilos.cabeca, { opacity: sobe, transform: [{ translateY: sobe.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]}>
      <Animated.View style={[estilos.moeda, { transform: [{ scale: moeda }] }]} />
      <View style={estilos.corte} />
      <Pressable style={estilos.voltar} onPress={onVoltar}><IconeVoltar size={16} color="#ffffff" /><Text style={estilos.voltarTexto}>{voltar}</Text></Pressable>
      <View style={estilos.cabecaLinha}>
        <View style={estilos.cabecaIcone}><Icone size={22} color="#ffffff" /></View>
        <View style={estilos.flex}><Text style={estilos.cabecaTitulo}>{titulo}</Text><Text style={estilos.cabecaSub}>{sub}</Text></View>
      </View>
    </Animated.View>
  );
};

const Botao = ({ Icone, texto, claro, onPress }) => {
  const escala = useRef(new Animated.Value(1)).current;
  const mover = (para) => Animated.spring(escala, { toValue: para, useNativeDriver: true, speed: 28, bounciness: 5 }).start();
  return (
    <Animated.View style={{ transform: [{ scale: escala }], alignSelf: "stretch" }}>
      <Pressable style={[estilos.botao, claro && estilos.botaoClaro]} onPressIn={() => mover(0.97)} onPressOut={() => mover(1)} onPress={onPress}>
        <View style={[estilos.botaoIcone, claro && estilos.botaoIconeClaro]}><Icone size={18} color={claro ? COR : "#ffffff"} /></View>
        <Text style={[estilos.botaoTexto, claro && estilos.botaoTextoClaro]}>{texto}</Text>
      </Pressable>
    </Animated.View>
  );
};

const Logo = ({ carteira, tamanho = 48 }) => {
  const fonteLogo = LOGOS[carteira?.logo];
  if (!fonteLogo) return <View style={[estilos.logoCaixa, { width: tamanho, height: tamanho }]}><IconeCarteira size={22} color={COR} /></View>;
  return <Image source={fonteLogo} style={{ width: tamanho, height: tamanho, borderRadius: 14 }} resizeMode="contain" />;
};

const Painel = ({ visivel, titulo, Icone, children, onFechar, onOk }) => (
  <Modal transparent visible={visivel} animationType="slide" onRequestClose={onFechar}>
    <Pressable style={estilos.vela} onPress={onFechar}>
      <Pressable style={estilos.folha} onPress={() => {}}>
        <View style={estilos.puxador} />
        <View style={estilos.folhaTopo}><View style={estilos.folhaSelo}><Icone size={20} color={COR} /></View><Text style={estilos.folhaTitulo}>{titulo}</Text></View>
        <ScrollView style={estilos.folhaLista}>{children}</ScrollView>
        <Botao Icone={IconeEscudo} texto="Confirmar" onPress={onOk} />
      </Pressable>
    </Pressable>
  </Modal>
);

const Opcao = ({ activo, Icone, logo, texto, onPress }) => (
  <Pressable style={[estilos.opcao, activo && estilos.opcaoOn]} onPress={onPress}>
    {logo ? <Logo carteira={logo} tamanho={40} /> : <View style={[estilos.opcaoIcone, { backgroundColor: activo ? "rgba(255,255,255,0.2)" : "#e0e7ff" }]}><Icone size={18} color={activo ? "#ffffff" : COR} /></View>}
    <Text style={[estilos.opcaoTexto, activo && estilos.claro]}>{texto}</Text>
  </Pressable>
);

const Gestao = ({ onVoltar }) => {
  const { carteiras } = usarDados();
  const [busca, setBusca] = useState("");
  const visiveis = carteiras.filter((c) => `${c.nome} ${c.codigo} ${c.tipo}`.toLowerCase().includes(busca.trim().toLowerCase()));
  const total = carteiras.reduce((s, c) => s + Number(c.saldo || 0), 0);
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Carteiras" sub={`${carteiras.length} saldos disponíveis`} Icone={IconeCarteira} onVoltar={onVoltar} />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        <View style={estilos.grelha}>
          <Entrada style={estilos.meio}><View style={estilos.stat}><IconeCarteira size={16} color={COR} /><Text style={estilos.statValor}>{carteiras.length}</Text><Text style={estilos.statRotulo}>Carteiras</Text></View></Entrada>
          <Entrada style={estilos.meio} atraso={40}><View style={estilos.stat}><IconeMoeda size={16} color="#0f766e" /><Text style={estilos.statValor} numberOfLines={1}>{mt(total)}</Text><Text style={estilos.statRotulo}>Saldo total</Text></View></Entrada>
        </View>
        <View style={estilos.painel}>
          <View style={estilos.busca}><IconeLupa size={16} color={COR} /><TextInput value={busca} onChangeText={setBusca} placeholder="Nome, código ou tipo" placeholderTextColor={cores.placeholder} style={estilos.buscaInput} /></View>
        </View>
        {visiveis.map((c, i) => (
          <CartaoCarteira key={c.id} carteira={c} atraso={i * 40} />
        ))}
      </ScrollView>
    </View>
  );
};

const CartaoCarteira = ({ carteira, atraso }) => {
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1.03, duration: 1400, useNativeDriver: true }),
      Animated.timing(pulso, { toValue: 1, duration: 1400, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso]);
  return (
    <Entrada atraso={atraso}>
      <View style={estilos.cartaoRico}>
        <View style={estilos.linha}>
          <Logo carteira={carteira} />
          <View style={estilos.flex}><Text style={estilos.nome}>{carteira.nome}</Text><Text style={estilos.nota}>{carteira.tipo}</Text></View>
          <View style={estilos.estadoPill}><IconeEscudo size={12} color="#0f766e" /><Text style={estilos.estadoTexto}>{carteira.estado}</Text></View>
        </View>
        <Animated.View style={[estilos.saldoCaixa, { transform: [{ scale: pulso }] }]}>
          <View style={estilos.saldoIcone}><IconeMoeda size={18} color={COR} /></View>
          <View><Text style={estilos.rotulo}>Saldo actual</Text><Text style={estilos.saldo}>{mt(carteira.saldo)}</Text></View>
        </Animated.View>
        <View style={estilos.metaLinha}><View style={estilos.metaIcone}><IconeDocumento size={14} color={COR} /></View><Text style={estilos.meta}>{carteira.codigo}</Text></View>
        <View style={estilos.metaLinha}><View style={estilos.metaIcone}><IconeCarteira size={14} color="#0f766e" /></View><Text style={estilos.meta}>{carteira.moeda}</Text></View>
      </View>
    </Entrada>
  );
};

const Movimentos = ({ onVoltar }) => {
  const { carteiras, movimentos } = usarDados();
  const [aberto, setAberto] = useState(false);
  const [origem, setOrigem] = useState(carteiras[0]?.nome || "");
  const [destino, setDestino] = useState(carteiras[1]?.nome || "");
  const [valor, setValor] = useState("");
  const [aviso, setAviso] = useState("");
  const confirmar = () => {
    const erro = guardarMovimento({ origem, destino, valor, data: hoje(), tipo: "Transferência" });
    setAviso(erro || "Transferência registada. Os saldos foram actualizados.");
    if (!erro) setAberto(false);
  };
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Transferências" sub={`${movimentos.length} movimentos`} Icone={IconeMoeda} onVoltar={onVoltar} />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
        <Botao Icone={IconeMoeda} texto="Nova transferência" onPress={() => setAberto(true)} />
        {movimentos.map((m, i) => (
          <Entrada key={m.id} atraso={i * 30}>
            <View style={estilos.cartaoRico}>
              <View style={estilos.linha}><View style={estilos.metaIcone}><IconeMoeda size={16} color={COR} /></View><Text style={estilos.nome}>{mt(m.valor)}</Text></View>
              <View style={estilos.metaLinha}><View style={estilos.metaIcone}><IconeCarteira size={14} color="#0f766e" /></View><Text style={estilos.meta}>{m.origem} → {m.destino}</Text></View>
              <View style={estilos.metaLinha}><View style={estilos.metaIcone}><IconeDocumento size={14} color={COR} /></View><Text style={estilos.meta}>{m.data} · {m.tipo}</Text></View>
            </View>
          </Entrada>
        ))}
      </ScrollView>
      <Painel visivel={aberto} titulo="Nova transferência" Icone={IconeMoeda} onFechar={() => setAberto(false)} onOk={confirmar}>
        <Text style={estilos.rotulo}>Origem</Text>
        {carteiras.map((c) => <Opcao key={`o-${c.id}`} activo={origem === c.nome} logo={c} texto={`${c.nome} · ${mt(c.saldo)}`} onPress={() => setOrigem(c.nome)} />)}
        <Text style={estilos.rotulo}>Destino</Text>
        {carteiras.map((c) => <Opcao key={`d-${c.id}`} activo={destino === c.nome} logo={c} texto={c.nome} onPress={() => setDestino(c.nome)} />)}
        <Text style={estilos.rotulo}>Valor (MT)</Text>
        <TextInput value={valor} onChangeText={setValor} keyboardType="decimal-pad" style={estilos.campo} />
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      </Painel>
    </View>
  );
};

const Despesas = ({ onVoltar }) => {
  const { carteiras, despesas } = usarDados();
  const [aberto, setAberto] = useState(false);
  const [carteira, setCarteira] = useState(carteiras[0]?.nome || "");
  const [categoria, setCategoria] = useState(CATEGORIAS[0][0]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [aviso, setAviso] = useState("");
  const total = despesas.reduce((s, d) => s + Number(d.valor || 0), 0);
  const confirmar = () => {
    const erro = guardarDespesa({ carteira, categoria, descricao, valor, data: hoje() });
    setAviso(erro || "Despesa paga e descontada do saldo.");
    if (!erro) {
      setAberto(false);
      setDescricao("");
      setValor("");
    }
  };
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Despesas" sub={`${mt(total)} já lançadas`} Icone={IconeDocumento} onVoltar={onVoltar} />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
        <Botao Icone={IconeDocumento} texto="Nova despesa" onPress={() => setAberto(true)} />
        {despesas.map((d, i) => (
          <Entrada key={d.id} atraso={i * 30}>
            <View style={estilos.cartaoRico}>
              <View style={estilos.linha}>
                <View style={estilos.metaIcone}><IconeDocumento size={16} color="#9b2c2c" /></View>
                <View style={estilos.flex}><Text style={estilos.nome}>{d.descricao}</Text><Text style={estilos.nota}>{d.codigo}</Text></View>
              </View>
              <View style={estilos.saldoCaixa}><View style={estilos.saldoIcone}><IconeMoeda size={18} color="#9b2c2c" /></View><View><Text style={estilos.rotulo}>Valor pago</Text><Text style={estilos.saldo}>{mt(d.valor)}</Text></View></View>
              <View style={estilos.metaLinha}><View style={estilos.metaIcone}><IconeCarteira size={14} color={COR} /></View><Text style={estilos.meta}>{d.carteira} · {d.categoria}</Text></View>
              <View style={estilos.metaLinha}><View style={estilos.metaIcone}><IconeEscudo size={14} color="#0f766e" /></View><Text style={estilos.meta}>{d.data} · {d.estado || "Paga"}</Text></View>
            </View>
          </Entrada>
        ))}
      </ScrollView>
      <Painel visivel={aberto} titulo="Nova despesa" Icone={IconeDocumento} onFechar={() => setAberto(false)} onOk={confirmar}>
        <Text style={estilos.rotulo}>Carteira</Text>
        {carteiras.map((c) => <Opcao key={c.id} activo={carteira === c.nome} logo={c} texto={`${c.nome} · ${mt(c.saldo)}`} onPress={() => setCarteira(c.nome)} />)}
        <Text style={estilos.rotulo}>Categoria</Text>
        {CATEGORIAS.map(([nome, Icone]) => <Opcao key={nome} activo={categoria === nome} Icone={Icone} texto={nome} onPress={() => setCategoria(nome)} />)}
        <Text style={estilos.rotulo}>Descrição</Text>
        <TextInput value={descricao} onChangeText={setDescricao} placeholder="O que foi pago" placeholderTextColor={cores.placeholder} style={estilos.campo} />
        <Text style={estilos.rotulo}>Valor (MT)</Text>
        <TextInput value={valor} onChangeText={setValor} keyboardType="decimal-pad" style={estilos.campo} />
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      </Painel>
    </View>
  );
};

const Carteiras = ({ modo, onVoltar }) => {
  if (modo === "movimentos") return <Movimentos onVoltar={onVoltar} />;
  if (modo === "despesas") return <Despesas onVoltar={onVoltar} />;
  return <Gestao onVoltar={onVoltar} />;
};

const estilos = StyleSheet.create({
  ecra: { flex: 1, backgroundColor: FUNDO },
  scroll: { flex: 1 },
  corpo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, gap: 10 },
  flex: { flex: 1 },
  cabeca: { overflow: "hidden", backgroundColor: COR, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 58, minHeight: 150 },
  moeda: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "#fbbf24", left: -36, bottom: -48, opacity: 0.9 },
  corte: { position: "absolute", width: 160, height: 70, borderRadius: 70, backgroundColor: FUNDO, right: -24, bottom: -36 },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  voltarTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "700" },
  cabecaLinha: { flexDirection: "row", alignItems: "center", gap: 12 },
  cabecaIcone: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  cabecaTitulo: { color: "#ffffff", fontFamily: fonte, fontSize: 24, fontWeight: "800" },
  cabecaSub: { color: "rgba(255,255,255,0.9)", fontFamily: fonte, marginTop: 2 },
  grelha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  meio: { width: "48%" },
  stat: { backgroundColor: cores.branco, borderRadius: 18, padding: 12, gap: 4, minHeight: 92 },
  statValor: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, fontSize: 16 },
  statRotulo: { fontFamily: fonte, color: cores.texto, fontSize: 11 },
  painel: { backgroundColor: cores.branco, borderRadius: 20, padding: 14 },
  busca: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: FUNDO, borderRadius: 16, paddingHorizontal: 12 },
  buscaInput: { flex: 1, fontFamily: fonte, color: cores.titulo, paddingVertical: 12 },
  cartaoRico: { backgroundColor: cores.branco, borderRadius: 22, padding: 14, gap: 10, shadowColor: "#1e3a8a", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  estadoPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#d1fae5", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  estadoTexto: { fontFamily: fonte, color: "#0f766e", fontSize: 11, fontWeight: "800" },
  saldoCaixa: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#eef2ff", borderRadius: 18, padding: 12 },
  saldoIcone: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  metaLinha: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaIcone: { width: 32, height: 32, borderRadius: 12, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  meta: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "700" },
  linha: { flexDirection: "row", alignItems: "center", gap: 12 },
  nome: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  nota: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  saldo: { fontFamily: fonte, color: COR, fontSize: 22, fontWeight: "800" },
  logoCaixa: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center" },
  talao: { backgroundColor: cores.branco, borderRadius: 28, padding: 22, alignItems: "center", gap: 8 },
  talaoLegenda: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  talaoValor: { fontFamily: fonte, color: COR, fontSize: 32, fontWeight: "800" },
  botao: { flexDirection: "row", alignItems: "center", gap: 14, alignSelf: "stretch", backgroundColor: COR, borderRadius: 18, minHeight: 58, paddingVertical: 12, paddingHorizontal: 16 },
  botaoClaro: { backgroundColor: "#e0e7ff" },
  botaoIcone: { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  botaoIconeClaro: { backgroundColor: "#ffffff" },
  botaoTexto: { flex: 1, color: "#ffffff", fontFamily: fonte, fontWeight: "800", fontSize: 15 },
  botaoTextoClaro: { color: COR },
  aviso: { fontFamily: fonte, color: COR, fontWeight: "800" },
  vela: { flex: 1, backgroundColor: "rgba(15, 23, 20, 0.48)", justifyContent: "flex-end" },
  folha: { backgroundColor: cores.branco, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, maxHeight: "82%" },
  puxador: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#c7d2fe", alignSelf: "center", marginBottom: 8 },
  folhaTopo: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  folhaSelo: { width: 44, height: 44, borderRadius: 16, backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center" },
  folhaTitulo: { fontFamily: fonte, color: cores.titulo, fontSize: 18, fontWeight: "800" },
  folhaLista: { marginBottom: 12 },
  rotulo: { fontFamily: fonte, color: "#8d9390", fontSize: 12, fontWeight: "700", marginTop: 8, marginBottom: 6 },
  campo: { backgroundColor: FUNDO, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonte, color: cores.titulo, marginBottom: 8 },
  opcao: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: FUNDO, borderRadius: 18, padding: 12, marginBottom: 8 },
  opcaoOn: { backgroundColor: COR },
  opcaoIcone: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  opcaoTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 15 },
  claro: { color: "#ffffff" },
});

export default Carteiras;
