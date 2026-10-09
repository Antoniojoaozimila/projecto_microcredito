import { useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Easing, Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { StatusBar } from "./statusBar";
import { SafeAreaProvider } from "./safeArea";
import BoasVindas from "./ecras/BoasVindas";
import Login from "./ecras/Login";
import Sistema from "./ecras/Sistema";
import { cores } from "./tema";

const Moldura = ({ children }) => {
  const { width, height } = useWindowDimensions();
  const larga = Platform.OS === "web" && width >= 720;
  if (!larga) return <View style={styles.cheio}>{children}</View>;

  const altura = Math.min(height - 64, 844);
  return (
    <View style={styles.palco}>
      <View style={[styles.telefone, { height: altura }]}>{children}</View>
    </View>
  );
};

const nativo = Platform.OS !== "web";
const comecaNoLogin = Platform.OS === "web" && window.location.search.includes("ecra=login");

const deslizar = (valor, destino) =>
  Animated.timing(valor, {
    toValue: destino,
    duration: destino === 1 ? 520 : 420,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: nativo,
  });

export default function App() {
  const [ecra, setEcra] = useState(comecaNoLogin ? "login" : "inicio");
  const [sessao, setSessao] = useState(null);
  const [vista, setVista] = useState("inicio");
  const [item, setItem] = useState(null);
  const [medida, setMedida] = useState({ largura: 0, altura: 0 });
  const progresso = useRef(new Animated.Value(comecaNoLogin ? 1 : 0)).current;
  const ecraRef = useRef(ecra);
  const voltarRef = useRef(() => false);
  const voltarLoginRef = useRef(() => false);
  ecraRef.current = ecra;

  const abrirLogin = () => {
    if (ecraRef.current === "login") return;
    if (Platform.OS === "web") window.history.pushState({ ecra: "login" }, "");
    setEcra("login");
    deslizar(progresso, 1).start();
  };

  voltarRef.current = () => {
    if (voltarLoginRef.current()) return true;
    if (ecraRef.current !== "login") return false;
    deslizar(progresso, 0).start(({ finished }) => {
      if (finished) setEcra("inicio");
    });
    return true;
  };

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => voltarRef.current());
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return undefined;
    const aoVoltar = () => voltarRef.current();
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, []);

  const aoMedir = (evento) => {
    const { width, height } = evento.nativeEvent.layout;
    setMedida((atual) =>
      atual.largura === width && atual.altura === height ? atual : { largura: width, altura: height }
    );
  };

  const deslocamento = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -medida.largura],
  });

  if (sessao) {
    return (
      <SafeAreaProvider>
        <Moldura>
          <StatusBar style="dark" />
          <Sistema
            usuario={sessao}
            vista={vista}
            item={item}
            onVista={setVista}
            onItem={setItem}
            onSair={() => {
              setSessao(null);
              setVista("inicio");
              setItem(null);
            }}
          />
        </Moldura>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Moldura>
        <StatusBar style="dark" />
        <View style={styles.slider} onLayout={aoMedir}>
          {medida.largura > 0 ? (
            <Animated.View
              style={[
                styles.faixa,
                {
                  width: medida.largura * 2,
                  height: medida.altura,
                  transform: [{ translateX: deslocamento }],
                },
              ]}
            >
              <View style={{ width: medida.largura, height: medida.altura }}>
                <BoasVindas onContinuar={abrirLogin} />
              </View>
              <View style={{ width: medida.largura, height: medida.altura }}>
                <Login
                  activo={ecra === "login"}
                  onVoltar={() => voltarRef.current()}
                  registarVoltar={(fn) => {
                    voltarLoginRef.current = fn;
                  }}
                  onSessao={(usuario) => {
                    setVista("inicio");
                    setItem(null);
                    setSessao(usuario);
                  }}
                />
              </View>
            </Animated.View>
          ) : null}
        </View>
      </Moldura>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cheio: {
    flex: 1,
    backgroundColor: cores.branco,
  },
  palco: {
    flex: 1,
    backgroundColor: cores.moldura,
    alignItems: "center",
    justifyContent: "center",
  },
  telefone: {
    width: 390,
    backgroundColor: cores.branco,
    borderRadius: 36,
    overflow: "hidden",
    borderWidth: 8,
    borderColor: cores.telefone,
  },
  slider: {
    flex: 1,
    overflow: "hidden",
  },
  faixa: {
    flexDirection: "row",
  },
});
