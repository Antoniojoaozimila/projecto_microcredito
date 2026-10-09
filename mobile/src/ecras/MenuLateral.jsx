import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  IconeAlerta,
  IconeBase,
  IconeCadeado,
  IconeCarteira,
  IconeCasa,
  IconeDocumento,
  IconeEdificio,
  IconeEngrenagem,
  IconeEquipa,
  IconeEscudo,
  IconeEstrela,
  IconeFechar,
  IconeFicha,
  IconeGrafico,
  IconeMapa,
  IconeMoeda,
  IconeNascer,
  IconePercentagem,
  IconePin,
  IconeSino,
} from "../componentes/Icones";
import { MENU } from "../dados/menu";
import { cores, fonte } from "../tema";

const ICONES = {
  dashboard: [IconeCasa, "#0f7a3c"],
  clientes: [IconeEquipa, "#1d4ed8"],
  emprestimos: [IconeMoeda, "#166534"],
  pagamentos: [IconeCarteira, "#0f766e"],
  garantias: [IconeCadeado, "#9a3412"],
  cobrancas: [IconePin, "#0369a1"],
  carteiras: [IconeDocumento, "#1e3a8a"],
  relatorios: [IconeGrafico, "#6d28d9"],
  configuracoes: [IconeEngrenagem, "#0f7a3c"],
  "cli-lista": [IconeDocumento, "#1d4ed8"],
  "cli-mapa": [IconeMapa, "#1d4ed8"],
  "emp-lista": [IconeDocumento, "#166534"],
  "emp-calendario": [IconeNascer, "#166534"],
  "pag-registar": [IconeCarteira, "#0f766e"],
  "pag-historico": [IconeDocumento, "#0f766e"],
  "gar-lista": [IconeDocumento, "#9a3412"],
  "gar-penhoradas": [IconeAlerta, "#9a3412"],
  "gar-execucao": [IconeCadeado, "#9a3412"],
  "gar-alertas": [IconeSino, "#9a3412"],
  "cob-agenda": [IconeNascer, "#0369a1"],
  "cob-historico": [IconeDocumento, "#0369a1"],
  "cob-rota": [IconeMapa, "#0369a1"],
  "cob-zonas": [IconePin, "#0369a1"],
  "cob-cobradores": [IconeEquipa, "#0369a1"],
  "car-gestao": [IconeCarteira, "#1e3a8a"],
  "car-movimentos": [IconeMoeda, "#1e3a8a"],
  "car-despesas": [IconePercentagem, "#1e3a8a"],
  "rel-financeiro": [IconeGrafico, "#6d28d9"],
  "rel-inadimplencia": [IconeAlerta, "#6d28d9"],
  "rel-performance": [IconeEstrela, "#6d28d9"],
  "rel-clientes": [IconeEquipa, "#6d28d9"],
  "rel-carteiras": [IconeCarteira, "#6d28d9"],
  "rel-exportacao": [IconeBase, "#6d28d9"],
  "cfg-utilizadores": [IconeEquipa, "#0f7a3c"],
  "cfg-identidade": [IconeEdificio, "#1d4ed8"],
  "cfg-perfis": [IconeEscudo, "#0f766e"],
  "cfg-zonas": [IconeMapa, "#0369a1"],
  "cfg-tipos": [IconeCadeado, "#9a3412"],
  "cfg-taxas": [IconePercentagem, "#166534"],
  "cfg-notificacoes": [IconeSino, "#9f1239"],
  "cfg-backup": [IconeBase, "#1e3a8a"],
  "cfg-integracoes": [IconeFicha, "#6d28d9"],
};

const iconeDe = (id) => ICONES[id] || [IconeDocumento, cores.verde];

const Filho = ({ filho, indice, onAbrir }) => {
  const valor = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(valor, {
      toValue: 1,
      duration: 260,
      delay: indice * 45,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [indice, valor]);
  const [Icone, cor] = iconeDe(filho.id);
  return (
    <Animated.View style={{ opacity: valor, transform: [{ translateX: valor.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }}>
      <Pressable style={estilos.filho} onPress={() => onAbrir(filho)}>
        <View style={[estilos.filhoIcone, { backgroundColor: `${cor}18` }]}>
          <Icone size={14} color={cor} />
        </View>
        <Text style={estilos.filhoTexto}>{filho.titulo}</Text>
      </Pressable>
    </Animated.View>
  );
};

const Entrada = ({ entrada, aberto, indice, onAlternar, onAbrir }) => {
  const surge = useRef(new Animated.Value(0)).current;
  const giro = useRef(new Animated.Value(aberto ? 1 : 0)).current;
  const filhos = useRef(new Animated.Value(aberto ? 1 : 0)).current;
  const [mostrar, setMostrar] = useState(aberto);
  useEffect(() => {
    Animated.timing(surge, {
      toValue: 1,
      duration: 340,
      delay: 80 + indice * 50,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [indice, surge]);
  useEffect(() => {
    if (aberto) setMostrar(true);
    Animated.spring(giro, { toValue: aberto ? 1 : 0, friction: 6, useNativeDriver: true }).start();
    Animated.timing(filhos, { toValue: aberto ? 1 : 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished && !aberto) setMostrar(false);
    });
  }, [aberto, filhos, giro]);
  const [Icone, cor] = iconeDe(entrada.id);
  const rotacao = giro.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "135deg"] });
  return (
    <Animated.View style={{ opacity: surge, transform: [{ translateY: surge.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      <Pressable style={[estilos.item, aberto && estilos.itemAberto]} onPress={() => (entrada.filhos ? onAlternar(entrada.id) : onAbrir(entrada))}>
        <View style={[estilos.itemIcone, { backgroundColor: `${cor}18` }]}>
          <Icone size={16} color={cor} />
        </View>
        <Text style={estilos.itemTexto}>{entrada.titulo}</Text>
        {entrada.filhos ? (
          <Animated.View style={[estilos.mais, { backgroundColor: cor, transform: [{ rotate: rotacao }] }]}>
            <Text style={estilos.maisTexto}>+</Text>
          </Animated.View>
        ) : null}
      </Pressable>
      {mostrar && entrada.filhos ? (
        <Animated.View style={{ opacity: filhos, transform: [{ translateY: filhos.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }}>
          {entrada.filhos.map((filho, ordem) => <Filho key={filho.id} filho={filho} indice={ordem} onAbrir={onAbrir} />)}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

const MenuLateral = ({ aberto, deslocamento, grupoAberto, onAlternar, onFechar, onAbrir }) => {
  const brilho = useRef(new Animated.Value(0)).current;
  const fecho = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(brilho, { toValue: 1, duration: 2400, useNativeDriver: true }),
      Animated.timing(brilho, { toValue: 0, duration: 2400, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [brilho]);
  const fechar = () => {
    Animated.timing(fecho, { toValue: 1, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) onFechar();
    });
  };
  let ordem = 0;
  return (
    <View style={estilos.camada}>
      <Pressable style={[estilos.cortina, { opacity: aberto ? 1 : 0 }]} onPress={fechar} />
      <Animated.View style={[estilos.gaveta, { transform: [{ translateX: deslocamento }] }]}>
        <View style={estilos.faixa}>
          <Animated.View style={[estilos.corte, { transform: [{ rotate: "32deg" }, { translateX: brilho.interpolate({ inputRange: [0, 1], outputRange: [-12, 18] }) }] }]} />
          <Animated.View style={[estilos.corte3, { transform: [{ rotate: "-24deg" }, { translateY: brilho.interpolate({ inputRange: [0, 1], outputRange: [8, -10] }) }] }]} />
          <View style={estilos.corte2} />
          <View style={estilos.faixaTopo}>
            <View style={estilos.marcaIcone}><IconeEdificio size={18} color="#ffffff" /></View>
            <View style={estilos.flex}>
              <Text style={estilos.marca}>NBMM Microcrédito</Text>
              <Text style={estilos.descricao}>Módulos do sistema</Text>
            </View>
            <Pressable onPress={fechar} style={estilos.fechar}>
              <Animated.View style={{ transform: [{ rotate: fecho.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }, { scale: fecho.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] }) }] }}>
                <IconeFechar size={16} color="#0f7a3c" />
              </Animated.View>
            </Pressable>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.lista}>
          {MENU.map((grupo) => (
            <View key={grupo.titulo} style={estilos.grupo}>
              <Text style={estilos.grupoTitulo}>{grupo.titulo}</Text>
              {grupo.entradas.map((entrada) => {
                const indice = ordem;
                ordem += 1;
                return (
                  <Entrada
                    key={entrada.id}
                    entrada={entrada}
                    aberto={grupoAberto === entrada.id}
                    indice={indice}
                    onAlternar={onAlternar}
                    onAbrir={onAbrir}
                  />
                );
              })}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const estilos = StyleSheet.create({
  camada: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  cortina: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(12, 24, 18, 0.35)" },
  gaveta: { width: "86%", maxWidth: 340, height: "100%", backgroundColor: "#f7fbf8" },
  faixa: { overflow: "hidden", backgroundColor: "#0f7a3c", paddingHorizontal: 16, paddingTop: 18, paddingBottom: 22, minHeight: 132 },
  corte: { position: "absolute", width: 180, height: 180, right: -50, top: -80, backgroundColor: "#34d399" },
  corte3: { position: "absolute", width: 90, height: 140, left: -30, top: -20, backgroundColor: "#14532d", opacity: 0.55 },
  corte2: { position: "absolute", width: 160, height: 54, left: -10, bottom: -22, backgroundColor: "#f7fbf8", transform: [{ rotate: "-8deg" }] },
  faixaTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  marcaIcone: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  fechar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  marca: { fontFamily: fonte, color: "#ffffff", fontWeight: "800", fontSize: 18 },
  descricao: { fontFamily: fonte, color: "rgba(255,255,255,0.86)", marginTop: 4, fontSize: 13 },
  lista: { paddingHorizontal: 12, paddingBottom: 28, paddingTop: 8 },
  grupo: { marginTop: 10 },
  grupoTitulo: { fontFamily: fonte, color: "#8d9390", fontSize: 11, fontWeight: "800", letterSpacing: 0.4, marginBottom: 6, marginLeft: 4 },
  item: {
    backgroundColor: cores.branco,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  itemAberto: { borderWidth: 1, borderColor: "#b7e4c7" },
  itemIcone: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "700" },
  mais: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  maisTexto: { color: "#ffffff", fontWeight: "800", fontSize: 16, lineHeight: 18 },
  filho: { marginLeft: 18, marginBottom: 6, backgroundColor: "#ffffff", borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  filhoIcone: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  filhoTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontSize: 14, fontWeight: "600" },
});

export default MenuLateral;
