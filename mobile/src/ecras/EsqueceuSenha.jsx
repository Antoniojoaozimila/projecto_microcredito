import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "../safeArea";
import Capa from "../componentes/Capa";
import { IconeCorreio, IconeEnviar, IconeVoltar } from "../componentes/Icones";
import { cores, fonte } from "../tema";

const nativo = Platform.OS !== "web";
const emailValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

const EsqueceuSenha = ({ activo, onVoltar }) => {
  const insets = useSafeAreaInsets();
  const entrada = useRef(new Animated.Value(0)).current;
  const [email, setEmail] = useState("");
  const [foco, setFoco] = useState(false);
  const [aviso, setAviso] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!activo) {
      entrada.setValue(0);
      return undefined;
    }
    const animacao = Animated.timing(entrada, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativo,
    });
    animacao.start();
    return () => animacao.stop();
  }, [activo, entrada]);

  const pedir = () => {
    const limpo = email.trim().toLowerCase();
    if (!emailValido(limpo)) {
      setAviso("Indique um email válido.");
      setEnviado(false);
      return;
    }
    setAviso("");
    setEnviado(true);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.ecra, { paddingBottom: Math.max(insets.bottom, 12) }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.coluna}>
        <Capa variante="essa" />
        <Animated.View
          style={[
            styles.corpo,
            {
              opacity: entrada,
              transform: [
                {
                  translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }),
                },
              ],
            },
          ]}
        >
          <Pressable style={styles.voltar} onPress={onVoltar} accessibilityRole="button">
            <IconeVoltar size={18} color={cores.verdeEscuro} />
            <Text style={styles.voltarTexto}>Voltar</Text>
          </Pressable>
          <View style={styles.tituloLinha}>
            <View style={styles.medalha}>
              <IconeCorreio size={18} color={cores.verde} />
            </View>
            <Text style={styles.titulo}>Recuperar senha</Text>
          </View>
          <Text style={styles.texto}>Indique o email da conta para receber as instruções de recuperação.</Text>

          <View style={[styles.campo, foco && styles.campoFoco]}>
            <IconeCorreio size={20} color={foco ? cores.verde : cores.icone} />
            <TextInput
              value={email}
              onChangeText={(valor) => {
                setEmail(valor);
                setEnviado(false);
                setAviso("");
              }}
              placeholder="Email"
              placeholderTextColor={cores.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              onFocus={() => setFoco(true)}
              onBlur={() => setFoco(false)}
              onSubmitEditing={pedir}
            />
          </View>

          {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
          {enviado ? (
            <Text style={styles.confirmacao}>
              O servidor ainda não envia emails de recuperação. Use o suporte no ecrã de entrada para redefinir a senha de {email.trim().toLowerCase()}.
            </Text>
          ) : null}

          <Pressable style={styles.botao} onPress={pedir}>
            <IconeEnviar size={18} color={cores.branco} />
            <Text style={styles.botaoTexto}>Enviar instruções</Text>
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  ecra: {
    flex: 1,
    backgroundColor: cores.branco,
  },
  coluna: {
    flex: 1,
  },
  corpo: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  voltar: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: cores.verdeSuave,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 36,
    marginBottom: 14,
  },
  voltarTexto: {
    fontFamily: fonte,
    color: cores.verdeEscuro,
    fontWeight: "700",
    fontSize: 13,
  },
  tituloLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  medalha: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: cores.verdeSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    fontFamily: fonte,
    fontSize: 28,
    fontWeight: "700",
    color: cores.titulo,
  },
  texto: {
    fontFamily: fonte,
    marginTop: 8,
    marginBottom: 16,
    color: cores.texto,
    fontSize: 14,
    lineHeight: 20,
  },
  campo: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: cores.verdeBorda,
    backgroundColor: "#fbfefc",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  campoFoco: {
    borderColor: cores.verde,
    backgroundColor: "#f3fbf6",
  },
  input: {
    flex: 1,
    fontFamily: fonte,
    fontSize: 15,
    color: cores.titulo,
    paddingVertical: 0,
  },
  aviso: {
    fontFamily: fonte,
    marginTop: 10,
    color: cores.perigo,
    backgroundColor: cores.fundoPerigo,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
  },
  confirmacao: {
    fontFamily: fonte,
    marginTop: 10,
    color: cores.verdeEscuro,
    backgroundColor: cores.verdeSuave,
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  botao: {
    marginTop: 16,
    height: 54,
    borderRadius: 18,
    backgroundColor: cores.verde,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  botaoTexto: {
    fontFamily: fonte,
    color: cores.branco,
    fontSize: 16,
    fontWeight: "700",
  },
});

export default EsqueceuSenha;
