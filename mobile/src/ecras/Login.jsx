import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "../safeArea";
import Capa from "../componentes/Capa";
import {
  IconeCadeado,
  IconeEntrar,
  IconeEquipa,
  IconeGrafico,
  IconeMoeda,
  IconeOlho,
  IconePessoa,
  IconeTelemovel,
  IconeSms,
  IconeTelefone,
  IconeVoltar,
  IconeWhatsapp,
} from "../componentes/Icones";
import ModalSuporte from "../componentes/ModalSuporte";
import EsqueceuSenha from "./EsqueceuSenha";
import { entrar } from "../servicos/api";
import { guardarNomeLembrado, guardarSessao, lerNomeLembrado } from "../servicos/sessao";
import { cores, fonte } from "../tema";

const nativo = Platform.OS !== "web";
const SITE_SAVIL = "https://saviltech.com/";
const FRASES = [
  { texto: "Aplicativo de Microcrédito", Icone: IconeTelemovel },
  { texto: "Crédito para o seu negócio", Icone: IconeMoeda },
  { texto: "Apoio ao empreendedor", Icone: IconePessoa },
  { texto: "Impulsione o seu crescimento", Icone: IconeGrafico },
  { texto: "Juntos pelo desenvolvimento", Icone: IconeEquipa },
];

const TituloVivo = () => {
  const [indice, setIndice] = useState(0);
  const [texto, setTexto] = useState("");
  const [apagando, setApagando] = useState(false);
  const cursor = useRef(new Animated.Value(1)).current;
  const troca = useRef(new Animated.Value(1)).current;
  const IconeFrase = FRASES[indice].Icone;

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 0, duration: 420, useNativeDriver: nativo }),
        Animated.timing(cursor, { toValue: 1, duration: 420, useNativeDriver: nativo }),
      ])
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [cursor]);

  useEffect(() => {
    troca.setValue(0.35);
    Animated.spring(troca, { toValue: 1, friction: 6, useNativeDriver: nativo }).start();
  }, [indice, troca]);

  useEffect(() => {
    const frase = FRASES[indice].texto;
    let espera = apagando ? 36 : 58;
    if (!apagando && texto === frase) espera = 1300;
    if (apagando && texto === "") espera = 240;

    const temporizador = setTimeout(() => {
      if (!apagando && texto === frase) {
        setApagando(true);
        return;
      }
      if (apagando && texto === "") {
        setApagando(false);
        setIndice((atual) => (atual + 1) % FRASES.length);
        return;
      }
      const tamanho = texto.length + (apagando ? -1 : 1);
      setTexto(frase.slice(0, tamanho));
    }, espera);

    return () => clearTimeout(temporizador);
  }, [apagando, indice, texto]);

  return (
    <View style={styles.tituloVivo}>
      <Animated.View style={[styles.iconeFrase, { opacity: troca, transform: [{ scale: troca }] }]}>
        <IconeFrase size={16} color={cores.verde} />
      </Animated.View>
      <Text numberOfLines={1} ellipsizeMode="clip" style={styles.tituloVivoTexto}>
        {texto}
      </Text>
      <Animated.Text style={[styles.cursor, { opacity: cursor }]}>|</Animated.Text>
    </View>
  );
};

const BotaoSuporte = ({ children, onPress, atraso }) => {
  const balanco = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.delay(atraso),
        Animated.timing(balanco, { toValue: 1, duration: 700, useNativeDriver: nativo }),
        Animated.timing(balanco, { toValue: 0, duration: 700, useNativeDriver: nativo }),
        Animated.delay(1400),
      ])
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [atraso, balanco]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            translateY: balanco.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
          },
        ],
      }}
    >
      <Pressable style={styles.pill} onPress={onPress}>
        {children}
      </Pressable>
    </Animated.View>
  );
};

const Login = ({ onSessao, activo = true, onVoltar, registarVoltar }) => {
  const insets = useSafeAreaInsets();
  const imagem = useRef(new Animated.Value(0)).current;
  const formulario = useRef(new Animated.Value(0)).current;
  const brilho = useRef(new Animated.Value(0)).current;
  const deslize = useRef(new Animated.Value(0)).current;
  const [largura, setLargura] = useState(0);
  const [altura, setAltura] = useState(0);
  const [painel, setPainel] = useState("entrar");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [foco, setFoco] = useState("");
  const [erro, setErro] = useState("");
  const [aEntrar, setAEntrar] = useState(false);
  const [suporte, setSuporte] = useState(false);

  useEffect(() => {
    lerNomeLembrado().then((guardado) => {
      if (guardado) setNome(guardado);
    });
  }, []);

  useEffect(() => {
    if (!activo) {
      imagem.setValue(0);
      formulario.setValue(0);
      return undefined;
    }
    const animacao = Animated.stagger(120, [
      Animated.timing(imagem, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: nativo,
      }),
      Animated.timing(formulario, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: nativo,
      }),
    ]);
    animacao.start();
    return () => animacao.stop();
  }, [activo, formulario, imagem]);

  useEffect(() => {
    if (!activo) return undefined;
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: nativo,
        }),
        Animated.timing(brilho, { toValue: 0, duration: 0, useNativeDriver: nativo }),
        Animated.delay(800),
      ])
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [activo, brilho]);

  const fecharEsqueceu = () => {
    Animated.timing(deslize, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativo,
    }).start(({ finished }) => {
      if (finished) setPainel("entrar");
    });
  };

  const abrirEsqueceu = () => {
    setPainel("esqueceu");
    Animated.timing(deslize, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativo,
    }).start();
  };

  useEffect(() => {
    registarVoltar?.(() => {
      if (painel !== "esqueceu") return false;
      fecharEsqueceu();
      return true;
    });
  }, [painel, registarVoltar]);

  const submeter = async () => {
    if (aEntrar) return;
    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    const senhaLimpa = senha.trim();
    if (!nomeLimpo || !senhaLimpa) {
      setErro("Não foi possível iniciar sessão. Verifique os dados e tente novamente.");
      return;
    }

    setErro("");
    setAEntrar(true);
    try {
      const dados = await entrar(nomeLimpo, senhaLimpa);
      await guardarSessao({
        token: dados.token,
        nome: dados.nome || nomeLimpo,
        email: dados.email,
        tipo: dados.tipo,
      });
      await guardarNomeLembrado(lembrar ? nomeLimpo : "");
      onSessao?.({ nome: dados.nome || nomeLimpo, tipo: dados.tipo });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setAEntrar(false);
    }
  };

  const deslocamento = deslize.interpolate({
    inputRange: [0, 1],
    outputRange: [0, largura > 0 ? -largura : 0],
  });

  return (
    <View
      style={styles.ecra}
      onLayout={(evento) => {
        const { width, height } = evento.nativeEvent.layout;
        setLargura((atual) => (Math.abs(atual - width) < 0.5 ? atual : width));
        setAltura((atual) => (Math.abs(atual - height) < 0.5 ? atual : height));
      }}
    >
      {largura > 0 ? (
        <Animated.View style={[styles.faixa, { width: largura * 2, height: altura || "100%", transform: [{ translateX: deslocamento }] }]}>
          <View style={{ width: largura, height: altura || "100%" }}>
            <KeyboardAvoidingView style={styles.ecra} behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <View style={[styles.conteudo, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                <Animated.View
                  style={[
                    styles.capa,
                    {
                      opacity: imagem,
                      transform: [
                        { translateY: imagem.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                        { scale: imagem.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                      ],
                    },
                  ]}
                >
                  <Capa variante="essa" expandir />
                </Animated.View>
                <TituloVivo />
                <Animated.View
                  style={[
                    styles.corpo,
                    {
                      opacity: formulario,
                      transform: [{ translateY: formulario.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
                    },
                  ]}
                >
                  <View style={styles.subtituloLinha}>
                    <IconePessoa size={16} color={cores.verdeTexto} />
                    <Text style={styles.subtitulo}>Acesse a sua conta para continuar.</Text>
                  </View>

                  {erro ? <Text style={styles.erro}>{erro}</Text> : null}

                  <View style={[styles.campo, foco === "nome" && styles.campoFoco]}>
                    <IconePessoa size={20} color={foco === "nome" ? cores.verde : cores.icone} />
                    <TextInput
                      value={nome}
                      onChangeText={setNome}
                      placeholder="Nome completo"
                      placeholderTextColor={cores.placeholder}
                      autoCapitalize="words"
                      autoCorrect={false}
                      style={styles.input}
                      onFocus={() => setFoco("nome")}
                      onBlur={() => setFoco("")}
                    />
                  </View>

                  <View style={[styles.campo, foco === "senha" && styles.campoFoco]}>
                    <IconeCadeado size={20} color={foco === "senha" ? cores.verde : cores.icone} />
                    <TextInput
                      value={senha}
                      onChangeText={setSenha}
                      placeholder="Senha de acesso"
                      placeholderTextColor={cores.placeholder}
                      secureTextEntry={!mostrarSenha}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.input}
                      onFocus={() => setFoco("senha")}
                      onBlur={() => setFoco("")}
                      onSubmitEditing={submeter}
                    />
                    <Pressable onPress={() => setMostrarSenha((atual) => !atual)} hitSlop={8}>
                      <IconeOlho size={20} color={cores.icone} fechado={mostrarSenha} />
                    </Pressable>
                  </View>

                  <View style={styles.opcoes}>
                    <Pressable style={styles.lembrar} onPress={() => setLembrar((atual) => !atual)}>
                      <View style={[styles.caixa, lembrar && styles.caixaActiva]}>
                        {lembrar ? <Text style={styles.visto}>✓</Text> : null}
                      </View>
                      <Text style={styles.lembrarTexto}>Lembrar-me</Text>
                    </Pressable>
                    <Pressable onPress={abrirEsqueceu}>
                      <Text style={styles.esqueceu}>Esqueceu a senha?</Text>
                    </Pressable>
                  </View>

                  <Pressable style={[styles.botao, aEntrar && styles.botaoOcupado]} onPress={submeter} disabled={aEntrar}>
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.brilho,
                        {
                          transform: [
                            {
                              translateX: brilho.interpolate({ inputRange: [0, 1], outputRange: [-140, 280] }),
                            },
                          ],
                        },
                      ]}
                    />
                    {aEntrar ? (
                      <ActivityIndicator color={cores.branco} />
                    ) : (
                      <>
                        <IconeEntrar size={18} color={cores.branco} />
                        <Text style={styles.botaoTexto}>Aceder ao Sistema</Text>
                      </>
                    )}
                  </Pressable>

                  <View style={styles.divisor}>
                    <View style={styles.linha} />
                    <Text style={styles.divisorTexto}>Contacte o suporte através de</Text>
                    <View style={styles.linha} />
                  </View>

                  <View style={styles.suporte}>
                    <BotaoSuporte atraso={0} onPress={() => setSuporte(true)}>
                      <IconeWhatsapp size={15} color="#128c7e" />
                      <Text style={styles.pillTexto}>WhatsApp</Text>
                    </BotaoSuporte>
                    <BotaoSuporte atraso={180} onPress={() => setSuporte(true)}>
                      <IconeSms size={15} color={cores.verdeEscuro} />
                      <Text style={styles.pillTexto}>SMS</Text>
                    </BotaoSuporte>
                    <BotaoSuporte atraso={360} onPress={() => setSuporte(true)}>
                      <IconeTelefone size={15} color="#0d5a2e" />
                      <Text style={styles.pillTexto}>Chamadas</Text>
                    </BotaoSuporte>
                  </View>

                  <Text style={styles.copyright}>
                    © {new Date().getFullYear()} Sistema de Microcrédito · SavilTech & Serviços LDA
                  </Text>
                  <Pressable onPress={() => Linking.openURL(SITE_SAVIL).catch(() => {})}>
                    <Text style={styles.rodape}>Criado pela SavilTech & Serviços LDA</Text>
                  </Pressable>
                </Animated.View>
              </View>
              <Pressable
                style={[styles.voltar, { top: Math.max(insets.top, 10) }]}
                onPress={onVoltar}
                accessibilityRole="button"
                accessibilityLabel="Voltar"
              >
                <IconeVoltar size={18} color={cores.titulo} />
              </Pressable>
            </KeyboardAvoidingView>
          </View>
          <View style={{ width: largura, height: altura || "100%" }}>
            <EsqueceuSenha activo={painel === "esqueceu"} onVoltar={fecharEsqueceu} />
          </View>
        </Animated.View>
      ) : null}
      <ModalSuporte visivel={suporte} onFechar={() => setSuporte(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  ecra: {
    flex: 1,
    backgroundColor: cores.branco,
  },
  faixa: {
    flexDirection: "row",
  },
  conteudo: {
    flex: 1,
    backgroundColor: "transparent",
  },
  capa: {
    flex: 1,
    minHeight: 96,
  },
  tituloVivo: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    maxWidth: "100%",
    height: 34,
    marginHorizontal: 20,
    marginBottom: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#f3faf6",
    overflow: "hidden",
  },
  iconeFrase: {
    marginRight: 8,
  },
  tituloVivoTexto: {
    flexShrink: 1,
    fontFamily: fonte,
    color: cores.verdeEscuro,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cursor: {
    fontFamily: fonte,
    color: cores.verde,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 1,
  },
  corpo: {
    paddingHorizontal: 24,
    paddingTop: 2,
  },
  subtituloLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  subtitulo: {
    fontFamily: fonte,
    color: cores.texto,
    fontSize: 14,
  },
  erro: {
    fontFamily: fonte,
    backgroundColor: cores.fundoPerigo,
    color: cores.perigo,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  campo: {
    height: 48,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: cores.verdeBorda,
    backgroundColor: "rgba(255,255,255,0.94)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  campoFoco: {
    borderColor: cores.verde,
    backgroundColor: "#f4fbf7",
  },
  input: {
    flex: 1,
    fontFamily: fonte,
    fontSize: 15,
    color: cores.titulo,
    paddingVertical: 0,
  },
  opcoes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 10,
  },
  lembrar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  caixa: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: cores.verdeBorda,
    alignItems: "center",
    justifyContent: "center",
  },
  caixaActiva: {
    backgroundColor: cores.verde,
    borderColor: cores.verde,
  },
  visto: {
    color: cores.branco,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
  lembrarTexto: {
    fontFamily: fonte,
    color: "#5f6663",
    fontSize: 13,
  },
  esqueceu: {
    fontFamily: fonte,
    color: cores.verdeTexto,
    fontSize: 13,
    fontWeight: "700",
  },
  botao: {
    height: 48,
    borderRadius: 18,
    backgroundColor: cores.verde,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  botaoOcupado: {
    opacity: 0.8,
  },
  brilho: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  botaoTexto: {
    fontFamily: fonte,
    color: cores.branco,
    fontSize: 16,
    fontWeight: "700",
  },
  divisor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  linha: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(20,146,74,0.16)",
  },
  divisorTexto: {
    fontFamily: fonte,
    color: "#8b938f",
    fontSize: 12,
  },
  suporte: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(20,146,74,0.28)",
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  pillTexto: {
    fontFamily: fonte,
    fontSize: 12,
    color: "#24312a",
    fontWeight: "600",
  },
  copyright: {
    fontFamily: fonte,
    textAlign: "center",
    color: "#b0b6b3",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 12,
  },
  rodape: {
    fontFamily: fonte,
    textAlign: "center",
    color: cores.verdeTexto,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  voltar: {
    position: "absolute",
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(20,146,74,0.18)",
  },
});

export default Login;
