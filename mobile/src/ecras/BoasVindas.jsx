import { useEffect, useRef } from "react";
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "../safeArea";
import Capa from "../componentes/Capa";
import { IconeMoeda, IconePessoa, IconeSeta } from "../componentes/Icones";
import { cores, fonte } from "../tema";

const nativo = Platform.OS !== "web";

const BOLHAS = [
  { esquerda: "8%", tamanho: 22, cor: "#14924a", duracao: 5200, inicio: 0.15 },
  { esquerda: "20%", tamanho: 14, cor: "#2563eb", duracao: 4600, inicio: 0.42 },
  { esquerda: "33%", tamanho: 30, cor: "#111111", duracao: 6400, inicio: 0.7 },
  { esquerda: "46%", tamanho: 16, cor: "#0ea5e9", duracao: 5000, inicio: 0.28 },
  { esquerda: "58%", tamanho: 26, cor: "#16a34a", duracao: 5800, inicio: 0.55 },
  { esquerda: "70%", tamanho: 13, cor: "#1d4ed8", duracao: 4300, inicio: 0.08 },
  { esquerda: "82%", tamanho: 28, cor: "#0f172a", duracao: 6700, inicio: 0.82 },
  { esquerda: "14%", tamanho: 18, cor: "#22c55e", duracao: 5400, inicio: 0.36 },
  { esquerda: "52%", tamanho: 20, cor: "#3b82f6", duracao: 6100, inicio: 0.63 },
  { esquerda: "90%", tamanho: 15, cor: "#15803d", duracao: 4900, inicio: 0.2 },
];

function Bolha({ esquerda, tamanho, cor, duracao, inicio }) {
  const subida = useRef(new Animated.Value(inicio)).current;

  useEffect(() => {
    let activo = true;
    const subir = () => {
      subida.setValue(inicio);
      Animated.timing(subida, {
        toValue: inicio + 1,
        duration: duracao,
        useNativeDriver: false,
      }).start((resultado) => {
        if (activo && resultado?.finished) subir();
      });
    };
    subir();
    return () => {
      activo = false;
    };
  }, [duracao, inicio, subida]);

  const largo = tamanho * 2.8;
  const meio = tamanho * 1.7;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: esquerda,
        bottom: 8,
        width: largo,
        height: largo,
        marginLeft: -(largo - tamanho) / 2,
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.55,
        transform: [
          {
            translateY: subida.interpolate({
              inputRange: [inicio, inicio + 1],
              outputRange: [0, -760],
            }),
          },
        ],
      }}
    >
      <View style={{ position: "absolute", width: largo, height: largo, borderRadius: largo, backgroundColor: cor, opacity: 0.1 }} />
      <View style={{ position: "absolute", width: meio, height: meio, borderRadius: meio, backgroundColor: cor, opacity: 0.16 }} />
      <View style={{ width: tamanho * 0.45, height: tamanho * 0.45, borderRadius: tamanho, backgroundColor: cor, opacity: 0.22 }} />
    </Animated.View>
  );
}

const estilosParticulas = StyleSheet.create({
  camada: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
  },
});

function CamadaParticulas() {
  return (
    <View pointerEvents="none" style={estilosParticulas.camada}>
      {BOLHAS.map((bolha) => (
        <Bolha key={`${bolha.esquerda}-${bolha.inicio}`} {...bolha} />
      ))}
    </View>
  );
}

const surgir = (valor, distancia) => ({
  opacity: valor,
  transform: [
    {
      translateY: valor.interpolate({
        inputRange: [0, 1],
        outputRange: [distancia, 0],
      }),
    },
  ],
});

const BoasVindas = ({ onContinuar }) => {
  const insets = useSafeAreaInsets();
  const imagem = useRef(new Animated.Value(0)).current;
  const texto = useRef(new Animated.Value(0)).current;
  const botao = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: nativo,
        }),
        Animated.timing(pulso, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: nativo,
        }),
      ])
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso]);

  useEffect(() => {
    Animated.stagger(140, [
      Animated.timing(imagem, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: nativo,
      }),
      Animated.timing(texto, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: nativo,
      }),
      Animated.timing(botao, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: nativo,
      }),
    ]).start();
  }, [botao, imagem, texto]);

  return (
    <View style={styles.ecra}>
      <Animated.View
        style={{
          opacity: imagem,
          transform: [
            {
              translateY: imagem.interpolate({
                inputRange: [0, 1],
                outputRange: [28, 0],
              }),
            },
            {
              scale: imagem.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
          ],
        }}
      >
        <Capa variante="essa" />
      </Animated.View>
      <View style={[styles.corpo, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <View style={styles.meio}>
          <Animated.View style={[styles.textos, surgir(texto, 22)]}>
            <View style={styles.marcaLinha}>
              <Image source={require("../../assets/icon2.png")} style={styles.marcaIcone} resizeMode="contain" />
              <View>
                <Text style={styles.marca}>NBMM</Text>
                <Text style={styles.marcaSub}>Microcrédito</Text>
              </View>
            </View>
            <View style={styles.linha}>
              <IconePessoa size={22} color={cores.titulo} />
              <Text style={styles.titulo}>Bem-vindo(a)</Text>
            </View>
            <View style={styles.linhaTexto}>
              <IconeMoeda size={16} color={cores.verdeTexto} />
              <Text style={styles.texto}>
                Mais oportunidades, um futuro melhor. Aceda à sua conta e faça o seu negócio crescer.
              </Text>
            </View>
          </Animated.View>
        </View>
        <Animated.View style={[styles.continuarCaixa, surgir(botao, 16)]}>
          <Pressable style={styles.continuar} onPress={onContinuar} accessibilityRole="button">
            <Text style={styles.continuarTexto}>Continuar</Text>
            <Animated.View
              style={[
                styles.anel,
                {
                  opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                  transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.circulo,
                { transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] },
              ]}
            >
              <IconeSeta size={18} color={cores.branco} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
      <CamadaParticulas />
    </View>
  );
};

const styles = StyleSheet.create({
  ecra: {
    flex: 1,
    backgroundColor: cores.branco,
  },
  corpo: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 6,
  },
  meio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 28,
  },
  textos: {
    alignItems: "center",
    gap: 10,
    maxWidth: 320,
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  linhaTexto: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  marcaLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  marcaIcone: {
    width: 28,
    height: 28,
  },
  marca: {
    fontFamily: fonte,
    color: cores.marca,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
  },
  marcaSub: {
    fontFamily: fonte,
    color: cores.marca,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15,
  },
  titulo: {
    fontFamily: fonte,
    color: cores.titulo,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    textAlign: "center",
  },
  texto: {
    flex: 1,
    fontFamily: fonte,
    color: cores.texto,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  continuarCaixa: {
    alignSelf: "flex-end",
  },
  continuar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  anel: {
    position: "absolute",
    right: 0,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: cores.verde,
  },
  continuarTexto: {
    fontFamily: fonte,
    color: "#9aa19d",
    fontSize: 15,
    fontWeight: "500",
  },
  circulo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: cores.verde,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BoasVindas;
