import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "../safeArea";
import {
  IconeAlerta,
  IconeCadeado,
  IconeCarteira,
  IconeCasa,
  IconeCorreio,
  IconeDocumento,
  IconeEngrenagem,
  IconeEquipa,
  IconeEscudo,
  IconeGrafico,
  IconeLua,
  IconeLupa,
  IconeMoeda,
  IconeNascer,
  IconeOlho,
  IconePercentagem,
  IconePessoa,
  IconePin,
  IconeSair,
  IconeSeta,
  IconeSino,
  IconeSol,
  IconeVoltar,
} from "../componentes/Icones";
import Definicoes from "./Definicoes";
import MenuLateral from "./MenuLateral";
import { usarDados } from "../dados/operacao";
import { carregarConsulta } from "../servicos/consulta";
import Clientes from "./Clientes";
import Emprestimos from "./Emprestimos";
import Pagamentos from "./Pagamentos";
import Garantias from "./Garantias";
import Cobrancas from "./Cobrancas";
import Carteiras from "./Carteiras";
import { itensDoMenu, tabelaDe } from "../dados/menu";
import { escolherFoto } from "../servicos/foto";
import { obterLocal } from "../servicos/localizacao";
import fotoPadrao from "../../assets/user.png";
import { cores, fonte } from "../tema";


const saudacaoDe = (hora) => {
  if (hora >= 5 && hora < 12) return { texto: "Bom dia", periodo: "manha" };
  if (hora >= 12 && hora < 18) return { texto: "Boa tarde", periodo: "tarde" };
  return { texto: "Boa noite", periodo: "noite" };
};

const IconePeriodo = ({ periodo, size = 18, color = cores.verde }) => {
  if (periodo === "manha") return <IconeNascer size={size} color={color} />;
  if (periodo === "tarde") return <IconeSol size={size} color={color} />;
  return <IconeLua size={size} color={color} />;
};

const iconeDoAviso = (tipo) => {
  if (tipo === "pagamento") return IconeMoeda;
  if (tipo === "cobranca") return IconePessoa;
  if (tipo === "alerta") return IconeCadeado;
  return IconeGrafico;
};

const entrar = (atraso = 0) => {
  const valor = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(valor, {
      toValue: 1,
      duration: 520,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [atraso, valor]);
  return {
    opacity: valor,
    transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };
};

const iconeResumo = {
  carteira: IconeCarteira,
  clientes: IconeEquipa,
  emprestimos: IconeMoeda,
  atraso: IconeAlerta,
};

const Cartao = ({ item, atraso }) => {
  const estilo = entrar(atraso);
  const pulso = useRef(new Animated.Value(1)).current;
  const Icone = iconeResumo[item.id] || IconeGrafico;
  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.12, duration: 700, delay: atraso, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [atraso, pulso]);
  return (
    <Animated.View style={[styles.cartao, estilo]}>
      <Animated.View style={[styles.cartaoIcone, { backgroundColor: `${item.cor}18`, transform: [{ scale: pulso }] }]}>
        <Icone size={18} color={item.cor} />
      </Animated.View>
      <Text style={styles.cartaoRotulo}>{item.rotulo}</Text>
      <Text style={styles.cartaoValor}>{item.valor}</Text>
      <Text style={styles.cartaoDetalhe}>{item.detalhe}</Text>
    </Animated.View>
  );
};

const TituloBloco = ({ Icone, texto }) => (
  <View style={styles.tituloPainel}>
    <View style={styles.tituloIcone}><Icone size={16} color={cores.verde} /></View>
    <Text style={styles.tituloPainelTexto}>{texto}</Text>
  </View>
);

const Barras = ({ meses }) => {
  const crescer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(crescer, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [crescer, meses]);
  const maior = Math.max(1, ...meses.map((mes) => mes.valor));
  return (
    <View style={styles.barras}>
      {meses.map((mes) => {
        const altura = crescer.interpolate({
          inputRange: [0, 1],
          outputRange: [6, Math.max(10, (mes.valor / maior) * 108)],
        });
        return (
          <View key={mes.nome} style={styles.barraColuna}>
            <View style={styles.barraTrilho}>
              <Animated.View style={[styles.barra, { height: altura }]} />
            </View>
            <Text style={styles.barraNome}>{mes.nome}</Text>
          </View>
        );
      })}
    </View>
  );
};

const PecaOrcamento = ({ Icone, cor, rotulo, valor, atraso = 0 }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 560, delay: atraso, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [atraso, v]);
  return (
    <Animated.View style={[styles.orcamentoPeca, { borderTopColor: cor, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      <View style={[styles.orcamentoIcone, { backgroundColor: cor }]}><Icone size={15} color="#ffffff" /></View>
      <Text style={styles.orcamentoRotulo} numberOfLines={1}>{rotulo}</Text>
      <Text style={styles.orcamentoValor} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{valor}</Text>
    </Animated.View>
  );
};

const FluxoSemanal = ({ valores }) => {
  const crescer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(crescer, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [crescer]);
  const nomes = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const maior = Math.max(1, ...valores);
  return (
    <View style={styles.barras}>
      {valores.map((valor, indice) => {
        const altura = crescer.interpolate({ inputRange: [0, 1], outputRange: [6, Math.max(8, (valor / maior) * 96)] });
        return (
          <View key={nomes[indice]} style={styles.barraColuna}>
            <View style={styles.barraTrilho}><Animated.View style={[styles.barraSemana, { height: altura }]} /></View>
            <Text style={styles.barraNome} numberOfLines={1}>{nomes[indice]}</Text>
          </View>
        );
      })}
    </View>
  );
};

const Espiral = ({ percentagem }) => {
  const desenho = useRef(new Animated.Value(0)).current;
  const [traco, setTraco] = useState(280);
  useEffect(() => {
    Animated.timing(desenho, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const id = desenho.addListener(({ value }) => setTraco(280 * (1 - value * Math.min(1, percentagem))));
    return () => desenho.removeListener(id);
  }, [desenho, percentagem]);
  const pontos = [];
  for (let i = 0; i <= 90; i += 1) {
    const t = i / 90;
    const angulo = t * Math.PI * 5.2;
    const raio = 6 + t * 44;
    pontos.push(`${60 + Math.cos(angulo) * raio} ${60 + Math.sin(angulo) * raio}`);
  }
  return (
    <View style={styles.espiralCaixa}>
      <Svg width={140} height={140} viewBox="0 0 120 120">
        <Path d={`M ${pontos.join(" L ")}`} stroke="#e7eee9" strokeWidth="7" fill="none" strokeLinecap="round" />
        <Path d={`M ${pontos.join(" L ")}`} stroke="#0f7a3c" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="280" strokeDashoffset={traco} />
      </Svg>
      <Text style={styles.espiralValor} numberOfLines={1}>{Math.round(percentagem * 100)}%</Text>
      <Text style={styles.espiralNota} numberOfLines={1}>Cobrança</Text>
    </View>
  );
};

const Pizza = ({ fatias }) => {
  const estilo = entrar(180);
  const raio = 42;
  const volta = 2 * Math.PI * raio;
  const soma = fatias.reduce((total, fatia) => total + fatia.valor, 0) || 1;
  let percorrido = 0;
  return (
    <Animated.View style={[styles.pizzaLinha, estilo]}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r={raio} stroke="#eef3ef" strokeWidth="16" fill="none" />
        {fatias.map((fatia) => {
          if (!fatia.valor) return null;
          const arco = (fatia.valor / soma) * volta;
          const deslocamento = percorrido;
          percorrido += arco;
          return (
            <Circle
              key={fatia.nome}
              cx="60"
              cy="60"
              r={raio}
              stroke={fatia.cor}
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${arco - 1.5} ${volta}`}
              strokeDashoffset={-deslocamento}
              rotation={-90}
              originX={60}
              originY={60}
            />
          );
        })}
      </Svg>
      <View style={styles.legendaPizza}>
        {fatias.map((fatia) => (
          <View key={fatia.nome} style={styles.legendaItem}>
            <View style={[styles.ponto, { backgroundColor: fatia.cor }]} />
            <Text style={styles.legendaTexto}>{fatia.nome}</Text>
            <Text style={styles.legendaValor}>{fatia.valor}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const LinhaTabela = ({ linha, indice }) => {
  const estilo = entrar(80 + indice * 70);
  return (
    <Animated.View style={[styles.linha, estilo]}>
      {linha.map((celula) => (
        <Text key={celula} style={styles.celula}>{celula}</Text>
      ))}
    </Animated.View>
  );
};

const Campo = ({ valor, onChange, placeholder, teclado }) => (
  <TextInput
    value={valor}
    onChangeText={onChange}
    placeholder={placeholder}
    placeholderTextColor={cores.placeholder}
    keyboardType={teclado}
    style={styles.campo}
  />
);

const Interruptor = ({ titulo, texto, valor, onChange }) => (
  <View style={styles.interruptor}>
    <View style={styles.interruptorTexto}>
      <Text style={styles.itemTexto}>{titulo}</Text>
      <Text style={styles.listaNota}>{texto}</Text>
    </View>
    <Switch
      value={valor}
      onValueChange={onChange}
      trackColor={{ false: "#d7ddd9", true: "#8ed09a" }}
      thumbColor={valor ? cores.verde : "#f4f4f4"}
    />
  </View>
);

const Sistema = ({ usuario, onSair, vista, item, onVista, onItem }) => {
  const insets = useSafeAreaInsets();
  const [saudacao, setSaudacao] = useState(() => saudacaoDe(new Date().getHours()));
  const [local, setLocal] = useState("A obter localização…");
  const [avisos, setAvisos] = useState([]);
  const [avisosAbertos, setAvisosAbertos] = useState(false);
  const [gaveta, setGaveta] = useState(false);
  const [gavetaMontada, setGavetaMontada] = useState(false);
  const [grupoAberto, setGrupoAberto] = useState("clientes");
  const [busca, setBusca] = useState("");
  const [lupa, setLupa] = useState(false);
  const [foto, setFoto] = useState(null);
  const [nome, setNome] = useState(usuario?.nome || "");
  const [nomeEdicao, setNomeEdicao] = useState(usuario?.nome || "");
  const [emailEdicao, setEmailEdicao] = useState(usuario?.email || "");
  const [senhaEdicao, setSenhaEdicao] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [avisoPerfil, setAvisoPerfil] = useState("");
  const [definicao, setDefinicao] = useState(null);
  const [paginaContratos, setPaginaContratos] = useState(1);
  const pisca = useRef(new Animated.Value(1)).current;
  const gavetaX = useRef(new Animated.Value(-360)).current;
  const painelY = useRef(new Animated.Value(0)).current;
  const brilhoHome = useRef(new Animated.Value(0)).current;
  const dadosVivos = usarDados();

  const porLer = avisos.filter((aviso) => !aviso.lida).length;
  const noInicio = !item && (vista === "inicio" || vista === "home");
  const fotoPequena = foto ? { uri: foto } : fotoPadrao;

  useEffect(() => {
    let vivo = true;
    carregarConsulta().then((resultado) => {
      if (!vivo) return;
      setAvisos(resultado?.avisos || []);
    });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    obterLocal()
      .then((texto) => {
        if (vivo) setLocal(texto);
      })
      .catch(() => {
        if (vivo) setLocal("Localização indisponível");
      });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (porLer === 0) {
      pisca.setValue(1);
      return undefined;
    }
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(pisca, { toValue: 0.25, duration: 480, useNativeDriver: true }),
        Animated.timing(pisca, { toValue: 1, duration: 480, useNativeDriver: true }),
      ])
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [pisca, porLer]);

  const gavetaAberta = useRef(false);
  useEffect(() => {
    if (gaveta) {
      gavetaAberta.current = true;
      setGavetaMontada(true);
      Animated.timing(gavetaX, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return undefined;
    }
    if (!gavetaAberta.current) return undefined;
    const animacao = Animated.timing(gavetaX, {
      toValue: -360,
      duration: 420,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animacao.start(({ finished }) => {
      if (finished) {
        gavetaAberta.current = false;
        setGavetaMontada(false);
      }
    });
    return () => animacao.stop();
  }, [gaveta, gavetaX]);

  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(brilhoHome, { toValue: 1, duration: 2600, useNativeDriver: true }),
      Animated.timing(brilhoHome, { toValue: 0, duration: 2600, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [brilhoHome]);

  useEffect(() => {
    Animated.timing(painelY, {
      toValue: avisosAbertos ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [avisosAbertos, painelY]);

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (avisosAbertos) {
        setAvisosAbertos(false);
        return true;
      }
      if (gaveta) {
        setGaveta(false);
        return true;
      }
      if (definicao) {
        setDefinicao(null);
        return true;
      }
      if (item && (vista === "clientes" || vista === "emprestimos" || vista === "pagamentos" || vista === "garantias" || vista === "cobrancas" || vista === "carteiras")) {
        onItem(null);
        onVista("inicio");
        setGrupoAberto(vista);
        setGaveta(true);
        return true;
      }
      if (item) {
        onItem(null);
        onVista("inicio");
        return true;
      }
      if (vista !== "inicio") {
        onVista("inicio");
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [avisosAbertos, definicao, gaveta, item, onItem, onVista, vista]);

  const resultados = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    if (!texto) return [];
    return itensDoMenu().filter((entrada) => entrada.titulo.toLowerCase().includes(texto));
  }, [busca]);

  const movimentos = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    const linhas = dadosVivos.emprestimos.map((emprestimo) => ({
      id: emprestimo.id,
      contrato: emprestimo.contrato,
      valor: `${Number(emprestimo.valor || 0).toLocaleString("pt-PT")} MT`,
      estado: emprestimo.estado,
    }));
    if (!texto) return linhas;
    return linhas.filter((linha) => `${linha.contrato} ${linha.valor} ${linha.estado}`.toLowerCase().includes(texto));
  }, [busca, dadosVivos.emprestimos]);
  const totalPaginas = Math.max(1, Math.ceil(movimentos.length / 5) || 1);
  const paginaActual = Math.min(paginaContratos, totalPaginas);
  const contratosPagina = movimentos.slice((paginaActual - 1) * 5, paginaActual * 5);

  const irInicio = () => {
    setGaveta(false);
    setAvisosAbertos(false);
    setDefinicao(null);
    setLupa(false);
    onItem(null);
    onVista("inicio");
  };

  const voltarModulos = (grupo = "clientes") => {
    setAvisosAbertos(false);
    setLupa(false);
    setGrupoAberto(grupo);
    onItem(null);
    onVista("inicio");
    setGaveta(true);
  };

  const abrirItem = (escolhido) => {
    setGaveta(false);
    setAvisosAbertos(false);
    if (escolhido.id === "dashboard") {
      irInicio();
      return;
    }
    if (escolhido.id === "cli-lista" || escolhido.id === "cli-mapa") {
      onItem(escolhido);
      onVista("clientes");
      return;
    }
    if (escolhido.id === "emp-lista" || escolhido.id === "emp-calendario") {
      onItem(escolhido);
      onVista("emprestimos");
      return;
    }
    if (escolhido.id === "pag-registar" || escolhido.id === "pag-historico") {
      onItem(escolhido);
      onVista("pagamentos");
      return;
    }
    if (["gar-lista", "gar-penhoradas", "gar-execucao", "gar-alertas"].includes(escolhido.id)) {
      onItem(escolhido);
      onVista("garantias");
      return;
    }
    if (String(escolhido.id).startsWith("cob-")) {
      onItem(escolhido);
      onVista("cobrancas");
      return;
    }
    if (String(escolhido.id).startsWith("car-")) {
      onItem(escolhido);
      onVista("carteiras");
      return;
    }
    if (String(escolhido.id).startsWith("cfg-")) {
      setDefinicao(escolhido.id);
      onItem(null);
      onVista("definicoes");
      return;
    }
    onItem(escolhido);
    onVista("lista");
  };

  const marcar = (id) => {
    setAvisos((lista) => lista.map((aviso) => (aviso.id === id ? { ...aviso, lida: true } : aviso)));
  };

  const guardarPerfil = () => {
    const limpo = nomeEdicao.trim();
    if (!limpo) {
      setAvisoPerfil("Indique o nome.");
      return;
    }
    if (!emailEdicao.includes("@")) {
      setAvisoPerfil("Indique um email válido.");
      return;
    }
    if (senhaEdicao || confirmarSenha) {
      if (senhaEdicao.length < 8) {
        setAvisoPerfil("A senha precisa de pelo menos 8 caracteres.");
        return;
      }
      if (senhaEdicao !== confirmarSenha) {
        setAvisoPerfil("A confirmação da senha não coincide.");
        return;
      }
    }
    setNome(limpo);
    setSenhaEdicao("");
    setConfirmarSenha("");
    setAvisoPerfil("Perfil actualizado neste telemóvel.");
  };

  const forcaSenha = (() => {
    let pontos = 0;
    if (senhaEdicao.length >= 8) pontos += 1;
    if (/[A-Z]/.test(senhaEdicao) && /[a-z]/.test(senhaEdicao)) pontos += 1;
    if (/\d/.test(senhaEdicao)) pontos += 1;
    if (/[^A-Za-z0-9]/.test(senhaEdicao)) pontos += 1;
    if (!senhaEdicao) return { rotulo: "Sem senha nova", cor: "#8d9390", nivel: 0 };
    if (pontos <= 1) return { rotulo: "Fraca", cor: "#9b2c2c", nivel: 1 };
    if (pontos <= 3) return { rotulo: "Média", cor: "#b45309", nivel: 2 };
    return { rotulo: "Forte", cor: "#0f766e", nivel: 3 };
  })();

  const gerarSenha = () => {
    const base = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let senha = "Aa1!";
    for (let i = 0; i < 10; i += 1) senha += base[Math.floor(Math.random() * base.length)];
    setSenhaEdicao(senha);
    setConfirmarSenha(senha);
    setVerSenha(true);
  };

  const mtVivo = (valor) => `${Number(valor || 0).toLocaleString("pt-PT")} MT`;
  const saldoCarteiras = dadosVivos.carteiras.reduce((s, c) => s + Number(c.saldo || 0), 0);
  const saldoEmprestimos = dadosVivos.emprestimos.reduce((s, e) => s + Number(e.saldo || 0), 0);
  const recebido = dadosVivos.pagamentos.filter((p) => p.estado === "Confirmado").reduce((s, p) => s + Number(p.valor || 0), 0);
  const despesasTotal = dadosVivos.despesas.reduce((s, d) => s + Number(d.valor || 0), 0);
  const emAtraso = dadosVivos.emprestimos.filter((e) => e.estado === "Em atraso").length;
  const clientesActivos = dadosVivos.clientes.filter((c) => c.cliente_ativo).length;
  const fluxoSemana = [0, 0, 0, 0, 0, 0, 0];
  dadosVivos.pagamentos.forEach((pagamento) => {
    const data = new Date(`${pagamento.data}T12:00:00`);
    if (Number.isNaN(data.getTime())) return;
    fluxoSemana[(data.getDay() + 6) % 7] += Number(pagamento.valor) || 0;
  });
  const taxaCobranca = recebido / Math.max(1, recebido + saldoEmprestimos);
  const nomesMes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const agora = new Date();
  const mesesBarras = Array.from({ length: 6 }, (_, indice) => {
    const data = new Date(agora.getFullYear(), agora.getMonth() - (5 - indice), 1);
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    const valor = dadosVivos.emprestimos
      .filter((emprestimo) => String(emprestimo.inicio || "").startsWith(chave))
      .reduce((soma, emprestimo) => soma + Number(emprestimo.valor || 0), 0);
    return { nome: nomesMes[data.getMonth()], valor: Math.round(valor / 1000) };
  });
  const contarEstado = (estado) => dadosVivos.emprestimos.filter((emprestimo) => emprestimo.estado === estado).length;
  const fatias = [
    { nome: "Activos", valor: contarEstado("Activo"), cor: "#14924a" },
    { nome: "Em atraso", valor: contarEstado("Em atraso"), cor: "#b45309" },
    { nome: "Pendentes", valor: contarEstado("Pendente"), cor: "#1d4ed8" },
    { nome: "Quitados", valor: contarEstado("Quitado"), cor: "#86efac" },
  ];
  const resumos = [
    { id: "carteira", rotulo: "Carteira activa", valor: mtVivo(saldoCarteiras), detalhe: `${dadosVivos.carteiras.length} carteiras`, cor: "#14924a" },
    { id: "clientes", rotulo: "Clientes", valor: String(clientesActivos), detalhe: `${dadosVivos.clientes.length} no total`, cor: "#1d4ed8" },
    { id: "emprestimos", rotulo: "Empréstimos", valor: String(dadosVivos.emprestimos.length), detalhe: mtVivo(saldoEmprestimos), cor: "#0f766e" },
    { id: "atraso", rotulo: "Em atraso", valor: String(emAtraso), detalhe: `${dadosVivos.pagamentos.length} pagamentos`, cor: "#b45309" },
  ];

  const mudarFoto = async () => {
    const uri = await escolherFoto();
    if (!uri) return;
    setFoto(uri);
    setAvisoPerfil("Foto actualizada no início.");
  };

  return (
    <View style={[styles.ecra, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.corpo}>
        {noInicio ? (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.inicio} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.faixaTopoRelativa}>
            <View style={styles.cabecaVerde}>
              <Animated.View style={[styles.saudacaoCorte, { transform: [{ rotate: "28deg" }, { translateX: brilhoHome.interpolate({ inputRange: [0, 1], outputRange: [-16, 22] }) }] }]} />
              <Animated.View style={[styles.saudacaoCorte2, { transform: [{ rotate: "-18deg" }, { translateY: brilhoHome.interpolate({ inputRange: [0, 1], outputRange: [6, -8] }) }] }]} />
              <View style={styles.faixaTopo}>
                <View style={styles.local}>
                  <IconePin size={15} color="#ffffff" />
                  <Text style={styles.localTexto} numberOfLines={1}>{local}</Text>
                </View>
                <View style={styles.acoes}>
                  <Pressable style={styles.sino} onPress={() => setAvisosAbertos((aberto) => !aberto)}>
                    <Animated.View style={{ opacity: porLer > 0 ? pisca : 1 }}>
                      <IconeSino size={18} color="#ffffff" />
                    </Animated.View>
                    {porLer > 0 ? (
                      <View style={styles.selo}>
                        <Text style={styles.seloTexto}>{porLer}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                  <View style={styles.avatarAro}>
                    <Image source={fotoPequena} style={styles.avatar} />
                  </View>
                </View>
              </View>
              <View style={styles.saudacaoCartao}>
                <View style={styles.saudacaoTexto}>
                  <View style={styles.saudacaoTitulo}>
                    <View style={styles.saudacaoIcone}><IconePeriodo periodo={saudacao.periodo} size={16} color="#ffffff" /></View>
                    <Text style={styles.saudacao}>{saudacao.texto}</Text>
                  </View>
                  <Text style={styles.nomePessoa} numberOfLines={2}>{nome}</Text>
                  <View style={styles.saudacaoCargo}>
                    <IconePessoa size={14} color="#d1fae5" />
                    <Text style={styles.saudacaoCargoTexto}>{usuario?.tipo === "admin" ? "Administrador" : usuario?.tipo || "Administrador"}</Text>
                  </View>
                  <View style={styles.saudacaoCargo}>
                    <IconeCorreio size={14} color="#d1fae5" />
                    <Text style={styles.saudacaoCargoTexto}>{emailEdicao}</Text>
                  </View>
                </View>
                <View style={styles.retratoMoldura}>
                  <Image source={fotoPadrao} style={styles.retrato} />
                </View>
              </View>
            </View>
            {avisosAbertos ? (
              <Animated.View
                style={[
                  styles.painel,
                  {
                    opacity: painelY,
                    transform: [{ translateY: painelY.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
                  },
                ]}
              >
                <View style={styles.painelTopo}>
                  <Text style={styles.painelTitulo}>Notificações</Text>
                  <Pressable onPress={() => setAvisos((lista) => lista.map((aviso) => ({ ...aviso, lida: true })))}>
                    <Text style={styles.link}>Marcar lidas</Text>
                  </Pressable>
                </View>
                {avisos.map((aviso) => {
                  const Icone = iconeDoAviso(aviso.tipo);
                  return (
                    <Pressable key={aviso.id} style={styles.aviso} onPress={() => marcar(aviso.id)}>
                      <View style={[styles.avisoIcone, aviso.lida && styles.avisoLido]}>
                        <Icone size={16} color={aviso.lida ? "#8d9390" : cores.verde} />
                      </View>
                      <View style={styles.avisoCorpo}>
                        <Text style={[styles.avisoTitulo, aviso.lida && styles.avisoTituloLido]}>{aviso.titulo}</Text>
                        <Text style={styles.avisoTexto}>{aviso.texto}</Text>
                      </View>
                      {!aviso.lida ? <View style={styles.bolinha} /> : null}
                    </Pressable>
                  );
                })}
              </Animated.View>
            ) : null}
            </View>

            {dadosVivos.avisoApi ? (
              <View style={styles.avisoApi}>
                <IconeAlerta size={16} color="#9a3412" />
                <Text style={styles.avisoApiTexto}>{dadosVivos.avisoApi}</Text>
              </View>
            ) : null}

            <View style={styles.pesquisa}>
              <Pressable style={styles.lupa} onPress={() => setLupa(true)}>
                <IconeLupa size={18} color={cores.verde} />
              </Pressable>
              {lupa || busca ? (
                <TextInput
                  autoFocus={lupa}
                  value={busca}
                  onChangeText={setBusca}
                  placeholder="Pesquisar contratos ou módulos"
                  placeholderTextColor={cores.placeholder}
                  style={styles.pesquisaCampo}
                  onBlur={() => {
                    if (!busca) setLupa(false);
                  }}
                />
              ) : (
                <Pressable style={styles.pesquisaCampo} onPress={() => setLupa(true)}>
                  <Text style={styles.pesquisaFalso}>Pesquisar contratos ou módulos</Text>
                </Pressable>
              )}
            </View>

            {resultados.length > 0 ? (
              <View style={styles.resultados}>
                {resultados.slice(0, 6).map((entrada) => (
                  <Pressable key={entrada.id} style={styles.resultado} onPress={() => abrirItem(entrada)}>
                    <Text style={styles.resultadoTexto}>{entrada.titulo}</Text>
                    <IconeSeta size={14} color={cores.verde} />
                  </Pressable>
                ))}
              </View>
            ) : null}

            <TituloBloco Icone={IconeCasa} texto="Painel Administrativo" />

            <View style={styles.grelha}>
              {resumos.map((resumo, indice) => (
                <Cartao key={resumo.rotulo} item={resumo} atraso={indice * 80} />
              ))}
            </View>

            <View style={styles.bloco}>
              <TituloBloco Icone={IconeMoeda} texto="Orçamento da empresa" />
              <View style={styles.grelha}>
                {[
                  [IconeCarteira, "#1e3a8a", "Carteiras", mtVivo(saldoCarteiras)],
                  [IconeMoeda, "#166534", "Em aberto", mtVivo(saldoEmprestimos)],
                  [IconeEscudo, "#0f766e", "Recebido", mtVivo(recebido)],
                  [IconeAlerta, "#9b2c2c", "Despesas", mtVivo(despesasTotal)],
                  [IconeEquipa, "#1d4ed8", "Clientes", String(clientesActivos)],
                  [IconePercentagem, "#b45309", "Em atraso", String(emAtraso)],
                ].map(([Icone, cor, rotulo, valor], indice) => (
                  <PecaOrcamento key={rotulo} Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} atraso={indice * 50} />
                ))}
              </View>
            </View>

            <View style={styles.bloco}>
              <TituloBloco Icone={IconeGrafico} texto="Fluxo semanal" />
              <FluxoSemanal valores={fluxoSemana} />
            </View>

            <View style={styles.bloco}>
              <TituloBloco Icone={IconeEscudo} texto="Espiral de cobrança" />
              <Espiral percentagem={taxaCobranca} />
            </View>

            <View style={styles.bloco}>
              <TituloBloco Icone={IconeGrafico} texto="Desembolso mensal" />
              <Barras meses={mesesBarras} />
            </View>

            <View style={styles.bloco}>
              <TituloBloco Icone={IconeCarteira} texto="Distribuição da carteira" />
              <Pizza fatias={fatias} />
            </View>

            <View style={styles.bloco}>
              <TituloBloco Icone={IconeDocumento} texto="Contratos recentes" />
              <View style={styles.linhaCabeca}>
                <View style={styles.celulaIcone}><IconeDocumento size={13} color={cores.verdeEscuro} /><Text style={styles.celulaCabeca}>Contrato</Text></View>
                <View style={styles.celulaIcone}><IconeMoeda size={13} color={cores.verdeEscuro} /><Text style={styles.celulaCabeca}>Valor</Text></View>
                <View style={styles.celulaIcone}><IconeAlerta size={13} color={cores.verdeEscuro} /><Text style={styles.celulaCabeca}>Estado</Text></View>
              </View>
              {contratosPagina.length === 0 ? (
                <Text style={styles.listaNota}>Nenhum contrato corresponde à pesquisa.</Text>
              ) : (
                contratosPagina.map((linha, indice) => (
                  <View key={linha.id || linha.contrato} style={styles.linha}>
                    <View style={styles.celulaIcone}><IconeDocumento size={13} color={cores.verde} /><Text style={styles.celula}>{linha.contrato}</Text></View>
                    <View style={styles.celulaIcone}><IconeMoeda size={13} color={cores.verde} /><Text style={styles.celula}>{linha.valor}</Text></View>
                    <View style={styles.celulaIcone}><IconeAlerta size={13} color={linha.estado === "Em atraso" ? "#b45309" : cores.verde} /><Text style={styles.celula}>{linha.estado}</Text></View>
                  </View>
                ))
              )}
              <View style={styles.paginas}>
                <Pressable disabled={paginaActual <= 1} onPress={() => setPaginaContratos(paginaActual - 1)} style={styles.paginaSeta}>
                  <Text style={[styles.paginaTexto, paginaActual <= 1 && styles.paginaOff]}>Anterior</Text>
                </Pressable>
                {Array.from({ length: totalPaginas }, (_, indice) => (
                  <Pressable key={indice} onPress={() => setPaginaContratos(indice + 1)} style={[styles.paginaNumero, paginaActual === indice + 1 && styles.paginaActiva]}>
                    <Text style={[styles.paginaTexto, paginaActual === indice + 1 && styles.paginaTextoActiva]}>{indice + 1}</Text>
                  </Pressable>
                ))}
                <Pressable disabled={paginaActual >= totalPaginas} onPress={() => setPaginaContratos(paginaActual + 1)} style={styles.paginaSeta}>
                  <Text style={[styles.paginaTexto, paginaActual >= totalPaginas && styles.paginaOff]}>Seguinte</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        ) : null}

        {vista === "definicoes" && !item ? (
          <Definicoes definicao={definicao} onVoltar={() => (definicao ? setDefinicao(null) : irInicio())} onAbrir={setDefinicao} />
        ) : null}

        {vista === "perfil" && !item ? (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.perfilPagina} keyboardShouldPersistTaps="handled">
            <View style={styles.perfilFaixa}>
              <View style={styles.perfilCorte} />
              <View style={styles.perfilCorte2} />
              <Pressable style={styles.perfilVoltar} onPress={irInicio}>
                <IconeVoltar size={16} color="#ffffff" />
                <Text style={styles.perfilVoltarTexto}>Home</Text>
              </Pressable>
              <View style={styles.perfilFaixaLinha}>
                <View style={styles.perfilSelo}><IconePessoa size={22} color="#ffffff" /></View>
                <View style={styles.flexo}><Text style={styles.perfilTitulo}>Perfil</Text><Text style={styles.perfilSub}>Nome, email e senha</Text></View>
              </View>
            </View>
            <View style={styles.perfilCorpo}>
              <View style={styles.perfilCentro}>
                <Image source={fotoPequena} style={styles.retratoGrande} />
                <Pressable style={styles.botaoClaro} onPress={mudarFoto}>
                  <Text style={styles.botaoClaroTexto}>Alterar foto</Text>
                </Pressable>
              </View>
              <View style={styles.campoIcone}><IconePessoa size={16} color="#7c3aed" /><TextInput value={nomeEdicao} onChangeText={setNomeEdicao} placeholder="Nome" placeholderTextColor={cores.placeholder} style={styles.campoFlex} /></View>
              <View style={styles.campoIcone}><IconeCorreio size={16} color="#7c3aed" /><TextInput value={emailEdicao} onChangeText={setEmailEdicao} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor={cores.placeholder} style={styles.campoFlex} /></View>
              <View style={styles.campoIcone}>
                <IconeCadeado size={16} color="#7c3aed" />
                <TextInput value={senhaEdicao} onChangeText={setSenhaEdicao} secureTextEntry={!verSenha} placeholder="Nova senha" placeholderTextColor={cores.placeholder} style={styles.campoFlex} />
                <Pressable onPress={() => setVerSenha((v) => !v)}><IconeOlho size={16} color="#7c3aed" /></Pressable>
              </View>
              <View style={styles.forca}><View style={[styles.forcaBarra, { width: `${Math.max(forcaSenha.nivel, senhaEdicao ? 1 : 0) * 25}%`, backgroundColor: forcaSenha.cor }]} /><Text style={[styles.forcaTexto, { color: forcaSenha.cor }]}>{forcaSenha.rotulo}</Text></View>
              <View style={styles.campoIcone}><IconeEscudo size={16} color="#7c3aed" /><TextInput value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry={!verSenha} placeholder="Confirmar senha" placeholderTextColor={cores.placeholder} style={styles.campoFlex} /></View>
              <Pressable style={styles.botaoClaro} onPress={gerarSenha}><Text style={styles.botaoClaroTexto}>Gerar senha forte</Text></Pressable>
              <Pressable style={styles.botao} onPress={guardarPerfil}><Text style={styles.botaoTexto}>Guardar perfil</Text></Pressable>
              {avisoPerfil ? <Text style={styles.sucesso}>{avisoPerfil}</Text> : null}
            </View>
          </ScrollView>
        ) : null}

        {vista === "lista" && item ? (
          <Lista item={item} onVoltar={irInicio} />
        ) : null}
        {vista === "clientes" && item ? <Clientes modo={item.id === "cli-mapa" ? "mapa" : "lista"} onVoltar={() => voltarModulos("clientes")} /> : null}
        {vista === "emprestimos" && item ? <Emprestimos modo={item.id === "emp-calendario" ? "calendario" : "lista"} onVoltar={() => voltarModulos("emprestimos")} /> : null}
        {vista === "pagamentos" && item ? <Pagamentos modo={item.id === "pag-historico" ? "historico" : "registar"} onVoltar={() => voltarModulos("pagamentos")} /> : null}
        {vista === "garantias" && item ? <Garantias modo={{ "gar-penhoradas": "penhoradas", "gar-execucao": "execucao", "gar-alertas": "alertas" }[item.id] || "lista"} onVoltar={() => voltarModulos("garantias")} /> : null}
        {vista === "cobrancas" && item ? <Cobrancas modo={{ "cob-historico": "historico", "cob-rota": "rota", "cob-zonas": "zonas", "cob-cobradores": "cobradores" }[item.id] || "agenda"} onVoltar={() => voltarModulos("cobrancas")} /> : null}
        {vista === "carteiras" && item ? <Carteiras modo={{ "car-movimentos": "movimentos", "car-despesas": "despesas" }[item.id] || "gestao"} onVoltar={() => voltarModulos("carteiras")} /> : null}
        {gavetaMontada ? (
          <MenuLateral
            aberto={gaveta}
            deslocamento={gavetaX}
            grupoAberto={grupoAberto}
            onAlternar={(id) => setGrupoAberto(grupoAberto === id ? null : id)}
            onFechar={() => setGaveta(false)}
            onAbrir={abrirItem}
          />
        ) : null}
      </View>

      <View style={[styles.tabs, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Aba icon={IconeCasa} texto="Home" activo={noInicio} onPress={irInicio} />
        <Aba
          icon={IconeEngrenagem}
          texto="Definições"
          activo={vista === "definicoes" && !item}
          onPress={() => {
            setGaveta(false);
            setAvisosAbertos(false);
            setDefinicao(null);
            onItem(null);
            onVista("definicoes");
          }}
        />
        <Aba
          icon={IconePessoa}
          texto="Perfil"
          activo={vista === "perfil" && !item}
          onPress={() => {
            setGaveta(false);
            setAvisosAbertos(false);
            setNomeEdicao(nome);
            setAvisoPerfil("");
            onItem(null);
            onVista("perfil");
          }}
        />
        <Aba
          icon={IconeGrafico}
          texto="Módulos"
          activo={gaveta}
          onPress={() => {
            setAvisosAbertos(false);
            setGaveta((aberto) => !aberto);
          }}
        />
        <Aba icon={IconeSair} texto="Sair" activo={false} cor={cores.perigo} onPress={onSair} />
      </View>
    </View>
  );
};

const Aba = ({ icon: Icone, texto, activo, onPress, cor }) => (
  <Pressable style={styles.tab} onPress={onPress}>
    <Icone size={18} color={cor || (activo ? cores.verde : "#9aa19d")} />
    <Text style={[styles.tabTexto, activo && styles.tabActivo, cor && { color: cor }]} numberOfLines={1}>{texto}</Text>
  </Pressable>
);

const Lista = ({ item, onVoltar }) => {
  const tabela = tabelaDe(item.grupo);
  const estilo = entrar(0);
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.pagina}>
      <Pressable style={styles.voltarLista} onPress={onVoltar}>
        <IconeVoltar size={16} color={cores.verdeEscuro} />
        <Text style={styles.voltarTexto}>Home</Text>
      </Pressable>
      <Text style={styles.listaTitulo}>{item.titulo}</Text>
      <Animated.View style={estilo}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.linhaCabeca}>
              {tabela.colunas.map((coluna) => (
                <Text key={coluna} style={styles.celulaCabeca}>{coluna}</Text>
              ))}
            </View>
            {tabela.linhas.map((linha, indice) => (
              <LinhaTabela key={linha.join("-")} linha={linha} indice={indice} />
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  ecra: { flex: 1, backgroundColor: "#f4f8f5" },
  corpo: { flex: 1 },
  scroll: { flex: 1 },
  inicio: { paddingHorizontal: 16, paddingBottom: 24 },
  faixaTopoRelativa: { zIndex: 6, marginHorizontal: -16 },
  cabecaVerde: { backgroundColor: "#0f7a3c", overflow: "hidden", paddingTop: 8, paddingBottom: 8 },
  faixaTopo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingHorizontal: 16, marginBottom: 6 },
  local: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  localTexto: { flex: 1, fontFamily: fonte, color: "#ffffff", fontWeight: "700", fontSize: 13 },
  acoes: { flexDirection: "row", alignItems: "center", gap: 8 },
  sino: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)" },
  selo: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  seloTexto: { color: "#fff", fontSize: 10, fontWeight: "800", fontFamily: fonte },
  avatarAro: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: "#ffffff", padding: 2, backgroundColor: "rgba(255,255,255,0.2)" },
  avatar: { width: "100%", height: "100%", borderRadius: 18, backgroundColor: "#d1fae5" },
  painel: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: cores.branco,
    borderRadius: 18,
    padding: 12,
    shadowColor: "#0f3d24",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  painelTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  painelTitulo: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, fontSize: 15 },
  link: { fontFamily: fonte, color: cores.verde, fontWeight: "700", fontSize: 12 },
  aviso: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  avisoIcone: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: cores.verdeSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  avisoLido: { backgroundColor: "#f3f4f3" },
  avisoCorpo: { flex: 1 },
  avisoTitulo: { fontFamily: fonte, fontWeight: "700", color: cores.titulo, fontSize: 13 },
  avisoTituloLido: { color: "#8d9390" },
  avisoTexto: { fontFamily: fonte, color: "#6b726e", fontSize: 12, marginTop: 1 },
  bolinha: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.verde },
  saudacaoCartao: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  saudacaoCorte: {
    position: "absolute",
    width: 170,
    height: 170,
    right: -40,
    top: -80,
    backgroundColor: "#34d399",
    transform: [{ rotate: "26deg" }],
  },
  saudacaoCorte2: {
    position: "absolute",
    width: 140,
    height: 64,
    left: -24,
    bottom: -28,
    backgroundColor: "rgba(255,255,255,0.14)",
    transform: [{ rotate: "-16deg" }],
  },
  saudacaoTexto: { flex: 1 },
  saudacaoTitulo: { flexDirection: "row", alignItems: "center", gap: 8 },
  saudacaoIcone: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  saudacao: { fontFamily: fonte, fontSize: 15, color: "#d1fae5", fontWeight: "700" },
  nomePessoa: { fontFamily: fonte, fontSize: 24, fontWeight: "800", color: "#ffffff", marginTop: 6 },
  saudacaoCargo: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  saudacaoCargoTexto: { fontFamily: fonte, color: "#d1fae5", fontSize: 12, fontWeight: "700" },
  retratoMoldura: {
    width: 96,
    height: 96,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#ffffff",
    transform: [{ rotate: "-8deg" }],
    backgroundColor: "#e7f6ec",
  },
  retrato: { width: "100%", height: "100%" },
  avisoApi: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: "#fff7ed", borderRadius: 14, padding: 12 },
  avisoApiTexto: { flex: 1, color: "#9a3412", fontFamily: fonte, fontSize: 13, lineHeight: 18 },
  pesquisa: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: cores.branco,
    borderRadius: 16,
    paddingHorizontal: 8,
    minHeight: 48,
    gap: 4,
  },
  lupa: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  pesquisaCampo: { flex: 1, fontFamily: fonte, color: cores.titulo, fontSize: 14, paddingVertical: 10 },
  pesquisaFalso: { fontFamily: fonte, color: cores.placeholder, fontSize: 14 },
  resultados: { marginTop: 8, backgroundColor: cores.branco, borderRadius: 14, overflow: "hidden" },
  resultado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eef3ef",
  },
  resultadoTexto: { fontFamily: fonte, color: cores.titulo, fontWeight: "600" },
  tituloPainel: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 10 },
  tituloIcone: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: cores.verdeSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  tituloPainelTexto: { fontFamily: fonte, fontSize: 18, fontWeight: "800", color: cores.titulo },
  grelha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cartao: {
    width: "48%",
    backgroundColor: cores.branco,
    borderRadius: 16,
    padding: 12,
    flexGrow: 1,
  },
  cartaoIcone: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  cartaoRotulo: { fontFamily: fonte, color: "#8d9390", fontSize: 12 },
  cartaoValor: { fontFamily: fonte, color: cores.titulo, fontSize: 22, fontWeight: "800", marginTop: 4 },
  cartaoDetalhe: { fontFamily: fonte, color: cores.verdeTexto, fontSize: 11, marginTop: 2 },
  bloco: { backgroundColor: cores.branco, borderRadius: 16, padding: 14, marginTop: 12 },
  blocoTitulo: { fontFamily: fonte, fontWeight: "700", color: cores.titulo, marginBottom: 10 },
  barras: { flexDirection: "row", alignItems: "flex-end", height: 132, gap: 8 },
  barraColuna: { flex: 1, alignItems: "center", height: "100%" },
  barraTrilho: { flex: 1, width: "100%", justifyContent: "flex-end" },
  barra: { width: "68%", alignSelf: "center", backgroundColor: cores.verde, borderRadius: 8 },
  barraNome: { fontFamily: fonte, fontSize: 10, color: "#8d9390", marginTop: 6 },
  pizzaLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendaPizza: { flex: 1, gap: 6 },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  legendaTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontSize: 12 },
  legendaValor: { fontFamily: fonte, color: "#6b726e", fontSize: 12, fontWeight: "700" },
  linhaCabeca: { flexDirection: "row", backgroundColor: "#e7f6ec", borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  linha: { flexDirection: "row", backgroundColor: cores.branco, borderTopWidth: 1, borderTopColor: "#eef3ef" },
  celulaIcone: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 10, paddingHorizontal: 6 },
  celulaCabeca: { flex: 1, minWidth: 88, fontFamily: fonte, fontWeight: "700", color: cores.verdeEscuro, fontSize: 11 },
  celula: { flex: 1, minWidth: 88, fontFamily: fonte, color: cores.titulo, fontSize: 12 },
  paginas: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 },
  paginaSeta: { paddingHorizontal: 8, paddingVertical: 6 },
  paginaNumero: { minWidth: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f6f4" },
  paginaActiva: { backgroundColor: cores.verde },
  paginaTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 12, fontWeight: "700" },
  paginaTextoActiva: { color: "#ffffff" },
  paginaOff: { color: "#c5cbc7" },
  pagina: { paddingHorizontal: 16, paddingBottom: 28 },
  voltarLista: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  voltarTexto: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "700" },
  listaTitulo: { fontFamily: fonte, fontSize: 24, fontWeight: "800", color: cores.titulo, marginBottom: 12 },
  listaNota: { fontFamily: fonte, color: cores.texto, fontSize: 12, marginTop: 2, marginBottom: 8 },
  item: {
    backgroundColor: cores.branco,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  itemIcone: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: cores.verdeSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "600" },
  formulario: { gap: 8, marginTop: 4 },
  campo: {
    backgroundColor: cores.branco,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonte,
    color: cores.titulo,
    fontSize: 15,
  },
  botao: { backgroundColor: cores.verde, borderRadius: 14, paddingVertical: 13, alignItems: "center", marginTop: 4 },
  botaoTexto: { fontFamily: fonte, color: "#fff", fontWeight: "800" },
  botaoClaro: { borderWidth: 1, borderColor: cores.verdeBorda, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  botaoClaroTexto: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "700" },
  linhaSimples: {
    backgroundColor: cores.branco,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  remover: { fontFamily: fonte, color: cores.perigo, fontWeight: "700", fontSize: 12 },
  interruptor: {
    backgroundColor: cores.branco,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  interruptorTexto: { flex: 1 },
  sucesso: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "700", marginTop: 10 },
  orcamentoPeca: { width: "48%", backgroundColor: "#ffffff", borderRadius: 18, padding: 12, gap: 6, borderTopWidth: 3, minHeight: 108 },
  orcamentoIcone: { width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  orcamentoRotulo: { fontFamily: fonte, color: "#8d9390", fontSize: 12, fontWeight: "700" },
  orcamentoValor: { fontFamily: fonte, color: cores.titulo, fontSize: 16, fontWeight: "800" },
  barraSemana: { width: "70%", alignSelf: "center", backgroundColor: "#1d4ed8", borderRadius: 8 },
  espiralCaixa: { alignItems: "center", justifyContent: "center", position: "relative", minHeight: 150 },
  espiralValor: { position: "absolute", top: 58, fontFamily: fonte, color: "#0f7a3c", fontWeight: "800", fontSize: 18 },
  espiralNota: { marginTop: -8, fontFamily: fonte, color: "#8d9390", fontSize: 12, fontWeight: "700" },
  perfilPagina: { paddingBottom: 28 },
  perfilFaixa: { backgroundColor: "#5b21b6", overflow: "hidden", minHeight: 150, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28 },
  perfilCorte: { position: "absolute", width: 180, height: 90, right: -30, top: -20, backgroundColor: "#c4b5fd", transform: [{ rotate: "24deg" }] },
  perfilCorte2: { position: "absolute", width: 140, height: 70, left: -40, bottom: -24, backgroundColor: "#f4f8f5", transform: [{ rotate: "-12deg" }] },
  perfilVoltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  perfilVoltarTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "700" },
  perfilFaixaLinha: { flexDirection: "row", alignItems: "center", gap: 12 },
  perfilSelo: { width: 46, height: 46, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  perfilTitulo: { color: "#ffffff", fontFamily: fonte, fontSize: 26, fontWeight: "800" },
  perfilSub: { color: "rgba(255,255,255,0.88)", fontFamily: fonte, marginTop: 2 },
  perfilCorpo: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  perfilCentro: { alignItems: "center", gap: 10, marginBottom: 4 },
  flexo: { flex: 1 },
  campoIcone: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: cores.branco, borderRadius: 16, paddingHorizontal: 12, minHeight: 52 },
  campoFlex: { flex: 1, fontFamily: fonte, color: cores.titulo, paddingVertical: 12 },
  forca: { gap: 6 },
  forcaBarra: { height: 6, borderRadius: 4 },
  forcaTexto: { fontFamily: fonte, fontWeight: "800", fontSize: 12 },
  retratoGrande: { width: 96, height: 96, borderRadius: 48, backgroundColor: cores.verdeSuave },
  tabs: {
    flexDirection: "row",
    backgroundColor: cores.branco,
    borderTopWidth: 1,
    borderTopColor: "#e7eee9",
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", gap: 2, paddingHorizontal: 2 },
  tabTexto: { fontFamily: fonte, fontSize: 10, color: "#9aa19d" },
  tabActivo: { color: cores.verde, fontWeight: "700" },
  gavetaCamada: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  cortina: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(12, 24, 18, 0.35)" },
  gaveta: {
    width: "82%",
    maxWidth: 340,
    height: "100%",
    backgroundColor: "#f7fbf8",
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  gavetaMarca: { fontFamily: fonte, fontWeight: "800", color: cores.verdeEscuro, fontSize: 16 },
  gavetaLista: { paddingBottom: 24 },
  grupo: { marginTop: 12 },
  grupoTitulo: { fontFamily: fonte, color: "#8d9390", fontSize: 12, fontWeight: "700", marginBottom: 6 },
  setaGrupo: { fontFamily: fonte, color: cores.verde, fontWeight: "800", fontSize: 18, width: 16, textAlign: "center" },
  filho: { marginLeft: 42, paddingVertical: 8 },
  filhoTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 14 },
});

export default Sistema;
