import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import {
  IconeAlerta, IconeCarteira, IconeDocumento, IconeEdificio, IconeEscudo, IconeFicha, IconeGrafico, IconeLupa,
  IconeFechar, IconeMoeda, IconeNascer, IconeOlho, IconePercentagem, IconePessoa, IconeSeta, IconeTelefone, IconeVoltar,
} from "../componentes/Icones";
import { guardarPagamento, usarDados } from "../dados/operacao";
import { cores, fonte } from "../tema";

const FUNDO = "#f4f8f5";
const POR_PAGINA = 5;
const FORMAS = ["Dinheiro", "E-Mola", "Mpesa", "M-Kesh", "Transferência Bancária", "Cheque"];
const TIPOS = ["Pagamento de Parcela", "Pagamento Antecipado", "Pagamento Parcial", "Quitação Total", "Multa"];
const ESTADOS = ["Confirmado", "Pendente", "Cancelado", "Estornado"];
const hoje = () => new Date().toISOString().slice(0, 10);
const hora = () => new Date().toTimeString().slice(0, 5);
const mt = (valor) => `${Number(valor || 0).toLocaleString("pt-PT")} MT`;
const corEstado = (estado) => ({ Confirmado: "#0f766e", Pendente: "#b45309", Cancelado: "#9b2c2c", Estornado: "#7c3aed" })[estado] || "#5f6662";
const carteiraDaForma = (forma) => {
  if (forma === "Dinheiro") return "Caixa";
  if (forma === "E-Mola") return "E-Mola";
  if (forma === "M-Kesh") return "Mkesh";
  if (forma === "Transferência Bancária" || forma === "Cheque") return "Millennium bim";
  return "M-Pesa";
};
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
const FORMAS_VISUAIS = [
  { nome: "Dinheiro", Icone: IconeMoeda, cor: "#0f766e" },
  { nome: "E-Mola", logo: LOGOS.emola },
  { nome: "Mpesa", logo: LOGOS.mpesa },
  { nome: "M-Kesh", logo: LOGOS.mkesh },
  { nome: "Transferência Bancária", Icone: IconeEdificio, cor: "#1e3a8a" },
  { nome: "Cheque", Icone: IconeDocumento, cor: "#b45309" },
];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const MESES_C = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const partesData = (iso) => {
  const data = iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date();
  return { ano: data.getFullYear(), mes: data.getMonth(), dia: data.getDate() };
};
const isoDe = (ano, mes, dia) => `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
const formatarData = (iso) => {
  if (!iso) return "Escolher data";
  const { ano, mes, dia } = partesData(iso);
  return `${String(dia).padStart(2, "0")} ${MESES_C[mes]} ${ano}`;
};
const logoDaCarteira = (carteira) => LOGOS[carteira?.logo] || null;

const Entrada = ({ atraso = 0, children, style }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 460, delay: atraso, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [atraso, v]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
};

const CabecaArco = ({ titulo, sub, Icone, onVoltar, voltar }) => {
  const sobe = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sobe, { toValue: 1, duration: 540, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(pulso, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso, sobe]);
  return (
    <Animated.View style={[estilos.cabeca, { opacity: sobe, transform: [{ translateY: sobe.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
      <Animated.View style={[estilos.faixa, { transform: [{ rotate: "16deg" }, { translateX: pulso.interpolate({ inputRange: [0, 1], outputRange: [-10, 14] }) }] }]} />
      <View style={estilos.arco} />
      <View style={estilos.circulo} />
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
      Animated.timing(pulso, { toValue: 1.1, duration: 900, useNativeDriver: true }),
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
      <Text style={estilos.statRotulo} numberOfLines={2}>{rotulo}</Text>
    </View>
  );
};

const Titulo = ({ Icone, cor, texto }) => (
  <View style={estilos.tituloLinha}>
    <View style={[estilos.tituloIcone, { backgroundColor: `${cor}18` }]}><Icone size={15} color={cor} /></View>
    <Text style={estilos.titulo}>{texto}</Text>
  </View>
);

const Dado = ({ Icone, cor, rotulo, valor }) => (
  <View style={estilos.dado}>
    <View style={[estilos.dadoIcone, { backgroundColor: `${cor}16` }]}><Icone size={15} color={cor} /></View>
    <View style={estilos.flex}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <Text style={estilos.dadoValor}>{valor || "—"}</Text>
    </View>
  </View>
);

const Campo = ({ Icone, cor, rotulo, children }) => (
  <View style={estilos.campo}>
    <View style={estilos.rotuloLinha}>
      <Icone size={14} color={cor} />
      <Text style={estilos.rotulo}>{rotulo}</Text>
    </View>
    {children}
  </View>
);

const Caixa = ({ style, ...props }) => <TextInput placeholderTextColor={cores.placeholder} style={[estilos.input, style]} {...props} />;

const Chips = ({ valor, opcoes, onChange }) => (
  <View style={estilos.chips}>
    {opcoes.map((opcao) => (
      <Pressable key={opcao} onPress={() => onChange(opcao)} style={[estilos.chip, valor === opcao && estilos.chipOn]}>
        <Text style={[estilos.chipTexto, valor === opcao && estilos.chipTextoOn]}>{opcao}</Text>
      </Pressable>
    ))}
  </View>
);

const Calendario = ({ visivel, valor, titulo = "Data do pagamento", onFechar, onEscolher }) => {
  const base = partesData(valor);
  const [cursor, setCursor] = useState({ ano: base.ano, mes: base.mes });
  useEffect(() => {
    if (!visivel) return;
    const partes = partesData(valor);
    setCursor({ ano: partes.ano, mes: partes.mes });
  }, [valor, visivel]);
  const offset = (new Date(cursor.ano, cursor.mes, 1).getDay() + 6) % 7;
  const total = new Date(cursor.ano, cursor.mes + 1, 0).getDate();
  const celulas = [...Array(offset).fill(null), ...Array.from({ length: total }, (_, indice) => indice + 1)];
  const hojeIso = hoje();
  const mudar = (passo) => {
    const data = new Date(cursor.ano, cursor.mes + passo, 1);
    setCursor({ ano: data.getFullYear(), mes: data.getMonth() });
  };
  return (
    <Modal transparent visible={visivel} animationType="slide" onRequestClose={onFechar}>
      <Pressable style={estilos.vela} onPress={onFechar}>
        <Pressable style={estilos.folha} onPress={() => {}}>
          <View style={estilos.puxador} />
          <Text style={estilos.folhaTitulo}>{titulo}</Text>
          <View style={estilos.mesNav}>
            <Pressable style={estilos.navBtn} onPress={() => mudar(-1)}><View style={{ transform: [{ rotate: "180deg" }] }}><IconeSeta size={16} color="#0f766e" /></View></Pressable>
            <Text style={estilos.mesTitulo}>{MESES[cursor.mes]} {cursor.ano}</Text>
            <Pressable style={estilos.navBtn} onPress={() => mudar(1)}><IconeSeta size={16} color="#0f766e" /></Pressable>
          </View>
          <View style={estilos.semana}>{SEMANA.map((dia) => <Text key={dia} style={estilos.semanaTexto}>{dia}</Text>)}</View>
          <View style={estilos.dias}>
            {celulas.map((dia, indice) => {
              if (!dia) return <View key={`vazio-${indice}`} style={estilos.dia} />;
              const iso = isoDe(cursor.ano, cursor.mes, dia);
              const activo = iso === valor;
              return (
                <Pressable key={iso} style={[estilos.dia, activo && estilos.diaOn, iso === hojeIso && !activo && estilos.diaHoje]} onPress={() => { onEscolher(iso); onFechar(); }}>
                  <Text style={[estilos.diaTexto, activo && estilos.diaTextoOn]}>{dia}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const Relogio = ({ visivel, valor, onFechar, onEscolher }) => {
  const [horaSel, setHoraSel] = useState("09");
  const [minSel, setMinSel] = useState("00");
  useEffect(() => {
    if (!visivel) return;
    const [horaTexto = "09", minutoTexto = "00"] = String(valor || "09:00").split(":");
    const minuto = Number(minutoTexto) || 0;
    setHoraSel(String(horaTexto).padStart(2, "0"));
    setMinSel(String(Math.round(minuto / 5) * 5 % 60).padStart(2, "0"));
  }, [valor, visivel]);
  const horas = Array.from({ length: 24 }, (_, indice) => String(indice).padStart(2, "0"));
  const minutos = Array.from({ length: 12 }, (_, indice) => String(indice * 5).padStart(2, "0"));
  return (
    <Modal transparent visible={visivel} animationType="slide" onRequestClose={onFechar}>
      <Pressable style={estilos.vela} onPress={onFechar}>
        <Pressable style={estilos.folha} onPress={() => {}}>
          <View style={estilos.puxador} />
          <Text style={estilos.folhaTitulo}>Hora do pagamento</Text>
          <Text style={estilos.relogioGrande}>{horaSel}:{minSel}</Text>
          <ScrollView style={estilos.relogioLista} showsVerticalScrollIndicator={false}>
            <Text style={estilos.rotulo}>Hora</Text>
            <View style={estilos.grelhaHoras}>
              {horas.map((item) => (
                <Pressable key={item} style={[estilos.horaBtn, horaSel === item && estilos.horaBtnOn]} onPress={() => setHoraSel(item)}>
                  <Text style={[estilos.horaTexto, horaSel === item && estilos.horaTextoOn]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[estilos.rotulo, estilos.rotuloEspaco]}>Minutos</Text>
            <View style={estilos.grelhaHoras}>
              {minutos.map((item) => (
                <Pressable key={item} style={[estilos.horaBtn, minSel === item && estilos.horaBtnOn]} onPress={() => setMinSel(item)}>
                  <Text style={[estilos.horaTexto, minSel === item && estilos.horaTextoOn]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable style={estilos.botao} onPress={() => { onEscolher(`${horaSel}:${minSel}`); onFechar(); }}>
            <Text style={estilos.botaoTexto}>Usar {horaSel}:{minSel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const Etiqueta = ({ texto, cor }) => (
  <View style={[estilos.etiqueta, { backgroundColor: `${cor}16` }]}>
    <Text style={[estilos.etiquetaTexto, { color: cor }]}>{texto}</Text>
  </View>
);

const Recibo = ({ pagamento, onVoltar }) => {
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
    [IconeDocumento, "#0f766e", "Número", pagamento.recibo],
    [IconePessoa, "#1d4ed8", "Cliente", pagamento.cliente],
    [IconeFicha, "#14532d", "Contrato", pagamento.contrato],
    [IconeNascer, "#b45309", "Data e hora", `${pagamento.data || ""} ${pagamento.hora || ""}`.trim()],
    [IconeCarteira, "#1d4ed8", "Forma", pagamento.forma],
    [IconeGrafico, "#7c3aed", "Tipo", pagamento.tipo],
    [IconeEdificio, "#0f766e", "Carteira", pagamento.carteira],
    [IconeTelefone, "#166534", "Referência", pagamento.referencia || "—"],
    [IconeFicha, "#1d4ed8", "Parcela", pagamento.parcela],
  ];
  return (
    <View style={estilos.ecra}>
      <CabecaArco titulo="Recibo" sub={pagamento.recibo || "Pagamento"} Icone={IconeDocumento} onVoltar={onVoltar} voltar="Histórico" />
      <ScrollView contentContainerStyle={estilos.corpo} showsVerticalScrollIndicator={false}>
        <Entrada>
          <View style={estilos.talao}>
            <View style={estilos.furoEsq} />
            <View style={estilos.furoDir} />
            <Animated.View style={[estilos.talaoHero, { transform: [{ scale: pulso }] }]}>
              <View style={estilos.talaoSelo}><IconeMoeda size={22} color="#0f766e" /></View>
              <Text style={estilos.talaoLegenda}>Valor pago</Text>
              <Text style={estilos.talaoValor}>{mt(pagamento.valor)}</Text>
              <View style={[estilos.talaoEstado, { backgroundColor: `${corEstado(pagamento.estado)}16` }]}>
                <IconeEscudo size={14} color={corEstado(pagamento.estado)} />
                <Text style={[estilos.talaoEstadoTexto, { color: corEstado(pagamento.estado) }]}>{pagamento.estado}</Text>
              </View>
            </Animated.View>
            <View style={estilos.picotes} />
            <View style={estilos.talaoPar}>
              <View style={estilos.talaoBloco}>
                <View style={[estilos.talaoBlocoIcone, { backgroundColor: "#fef3c7" }]}><IconePercentagem size={18} color="#b45309" /></View>
                <Text style={estilos.talaoBlocoRotulo}>Juros</Text>
                <Text style={estilos.talaoBlocoValor}>{mt(pagamento.juros)}</Text>
              </View>
              <View style={estilos.talaoBloco}>
                <View style={[estilos.talaoBlocoIcone, { backgroundColor: "#ccfbf1" }]}><IconeMoeda size={18} color="#0f766e" /></View>
                <Text style={estilos.talaoBlocoRotulo}>Capital</Text>
                <Text style={estilos.talaoBlocoValor}>{mt(pagamento.capital)}</Text>
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

const normalizar = (texto) => String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const PesquisaEmprestimo = ({ emprestimos, clientes, valor, onChange }) => {
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1.08, duration: 900, useNativeDriver: true }),
      Animated.timing(pulso, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso]);
  const seleccionado = emprestimos.find((item) => item.id === valor);
  const clienteDe = (item) => clientes.find((cliente) => cliente.id === item.clienteId);
  const resultados = useMemo(() => {
    const alvo = normalizar(termo.trim());
    const digitos = alvo.replace(/\D/g, "");
    const lista = alvo
      ? emprestimos.filter((item) => {
        const cliente = clienteDe(item);
        const texto = normalizar(`${item.contrato} ${item.cliente} ${cliente?.documento_numero || ""} ${cliente?.nuit || ""}`);
        const telefone = String(cliente?.telefone_principal || "").replace(/\D/g, "");
        return texto.includes(alvo) || (digitos.length >= 3 && telefone.includes(digitos));
      })
      : emprestimos;
    return [...lista].sort((a, b) => Number(b.estado === "Em atraso") - Number(a.estado === "Em atraso")).slice(0, 6);
  }, [clientes, emprestimos, termo]);
  if (seleccionado) {
    const cliente = clienteDe(seleccionado);
    return (
      <View style={estilos.escolhido}>
        <View style={estilos.escolhidoIcone}><IconePessoa size={18} color="#ffffff" /></View>
        <View style={estilos.flex}>
          <Text style={estilos.escolhidoNome}>{seleccionado.cliente}</Text>
          <View style={estilos.meta}><IconeDocumento size={13} color="#ccfbf1" /><Text style={estilos.escolhidoMeta}>{seleccionado.contrato}</Text></View>
          <View style={estilos.meta}><IconeAlerta size={13} color="#fde68a" /><Text style={estilos.escolhidoMeta}>Pendente {mt(seleccionado.saldo)}</Text></View>
          <View style={estilos.meta}><IconeTelefone size={13} color="#ccfbf1" /><Text style={estilos.escolhidoMeta}>{cliente?.telefone_principal || "—"}</Text></View>
        </View>
        <Pressable style={estilos.trocar} onPress={() => onChange("")}><Text style={estilos.trocarTexto}>Alterar</Text></Pressable>
      </View>
    );
  }
  return (
    <View>
      <View style={estilos.busca}>
        <Animated.View style={{ transform: [{ scale: pulso }] }}><IconeLupa size={18} color="#0f766e" /></Animated.View>
        <Caixa style={estilos.buscaInput} value={termo} onChangeText={(texto) => { setTermo(texto); setAberto(true); }} onFocus={() => setAberto(true)} placeholder="Contrato, nome, documento ou telefone" />
        {termo ? <Pressable onPress={() => { setTermo(""); setAberto(true); }}><IconeFechar size={14} color="#5f6662" /></Pressable> : null}
      </View>
      {aberto ? (
        <View style={estilos.resultados}>
          {resultados.length === 0 ? <Text style={estilos.nota}>Nenhum empréstimo encontrado.</Text> : resultados.map((item) => {
            const cliente = clienteDe(item);
            return (
              <Pressable key={item.id} style={estilos.resultado} onPress={() => { onChange(item.id); setTermo(""); setAberto(false); }}>
                <View style={estilos.resultadoIcone}><IconeDocumento size={15} color="#0f766e" /></View>
                <View style={estilos.flex}>
                  <Text style={estilos.contratoTitulo}>{item.cliente}</Text>
                  <Text style={estilos.nota}>{item.contrato} · {cliente?.documento_numero || "—"}</Text>
                </View>
                <View>
                  <Text style={estilos.contratoSaldo}>{mt(item.saldo)}</Text>
                  <Text style={estilos.nota}>{item.estado}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const Registar = ({ onVoltar }) => {
  const { emprestimos, carteiras, clientes } = usarDados();
  const abertos = emprestimos.filter((item) => item.estado !== "Quitado");
  const [emprestimoId, setEmprestimoId] = useState("");
  const emprestimo = abertos.find((item) => item.id === emprestimoId) || null;
  const abertas = (emprestimo?.plano || []).filter((parcela) => parcela.status !== "Pago");
  const [parcelaId, setParcelaId] = useState(abertas[0]?.id || "");
  const parcela = abertas.find((item) => item.id === parcelaId) || abertas[0];
  const [form, setForm] = useState({
    valor: parcela ? String(parcela.valor_parcela) : "",
    data: hoje(),
    hora: hora(),
    forma: "Dinheiro",
    tipo: "Pagamento de Parcela",
    referencia: "",
    carteira: "Caixa",
    notas: "",
  });
  const [aviso, setAviso] = useState("");
  const [tipoAberto, setTipoAberto] = useState(false);
  const [picker, setPicker] = useState(null);
  const set = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));
  const valor = Number(form.valor) || 0;
  const juros = Math.round(valor * (Number(emprestimo?.taxa) || 0)) / 100;
  const capital = Math.max(0, valor - juros);

  const escolherEmprestimo = (id) => {
    const novo = abertos.find((item) => item.id === id);
    const proxima = (novo?.plano || []).find((item) => item.status !== "Pago");
    setEmprestimoId(id);
    setParcelaId(proxima?.id || "");
    set("valor", proxima ? String(proxima.valor_parcela) : "");
    setAviso("");
  };

  const confirmar = () => {
    if (!emprestimo || !(valor > 0)) {
      setAviso("Escolha o empréstimo e indique o valor.");
      return;
    }
    const recibo = guardarPagamento({
      emprestimoId: emprestimo.id,
      contrato: emprestimo.contrato,
      cliente: emprestimo.cliente,
      parcelaId: parcela?.id,
      parcela: parcela ? `${parcela.numero}/${emprestimo.parcelas}` : "",
      valor,
      juros,
      capital,
      data: form.data,
      hora: form.hora,
      forma: form.forma,
      tipo: form.tipo,
      referencia: form.referencia,
      carteira: form.carteira,
      notas: form.notas,
      estado: "Confirmado",
    });
    setAviso(`Pagamento ${recibo} registado.`);
  };

  return (
    <View style={estilos.ecra}>
      <CabecaArco titulo="Registar pagamento" sub="Parcela, forma e alocação" Icone={IconeCarteira} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
        <Entrada>
          <View style={estilos.painel}>
            <Titulo Icone={IconeLupa} cor="#0f766e" texto="Empréstimo" />
            <PesquisaEmprestimo emprestimos={abertos} clientes={clientes} valor={emprestimoId} onChange={escolherEmprestimo} />
            {emprestimo ? null : <Text style={estilos.nota}>Pesquise o contrato, o nome, o documento ou o telefone.</Text>}
          </View>
        </Entrada>
        {abertas.length ? (
          <Entrada atraso={70}>
            <View style={estilos.painel}>
              <Titulo Icone={IconeNascer} cor="#b45309" texto="Parcela" />
              {abertas.map((item) => (
                <Pressable key={item.id} style={[estilos.opcaoParcela, parcela?.id === item.id && estilos.opcaoParcelaOn]} onPress={() => { setParcelaId(item.id); set("valor", String(item.valor_parcela)); }}>
                  <IconeNascer size={15} color={parcela?.id === item.id ? "#ffffff" : "#0f766e"} />
                  <Text style={[estilos.opcaoParcelaTexto, parcela?.id === item.id && estilos.chipTextoOn]}>{item.numero}/{emprestimo.parcelas} · {item.data_vencimento}</Text>
                  <Text style={[estilos.opcaoParcelaTexto, parcela?.id === item.id && estilos.chipTextoOn]}>{mt(item.valor_parcela)}</Text>
                </Pressable>
              ))}
            </View>
          </Entrada>
        ) : null}
        <Entrada atraso={120}>
          <View style={estilos.painel}>
            <Titulo Icone={IconeMoeda} cor="#0f766e" texto="Dados do pagamento" />
            <Campo Icone={IconeMoeda} cor="#0f766e" rotulo="Valor">
              <View style={estilos.valorCaixa}>
                <Caixa style={estilos.valorInput} value={form.valor} keyboardType="decimal-pad" onChangeText={(valorTexto) => set("valor", valorTexto)} placeholder="0" />
                <Text style={estilos.moeda}>MT</Text>
              </View>
            </Campo>
            <View style={estilos.datas}>
              <Pressable style={[estilos.selector, estilos.flex]} onPress={() => setPicker("data")}>
                <View style={estilos.selectorIcone}><IconeNascer size={16} color="#0f766e" /></View>
                <View style={estilos.flex}>
                  <Text style={estilos.rotulo}>Data</Text>
                  <Text style={estilos.selectorValor}>{formatarData(form.data)}</Text>
                </View>
              </Pressable>
              <Pressable style={[estilos.selector, estilos.flex]} onPress={() => setPicker("hora")}>
                <View style={[estilos.selectorIcone, estilos.selectorIconeAzul]}><IconeGrafico size={16} color="#1d4ed8" /></View>
                <View style={estilos.flex}>
                  <Text style={estilos.rotulo}>Hora</Text>
                  <Text style={estilos.selectorValor}>{form.hora || "Escolher"}</Text>
                </View>
              </Pressable>
            </View>
            <View style={estilos.rotuloLinha}><IconeCarteira size={14} color="#0f766e" /><Text style={estilos.rotulo}>Forma de pagamento</Text></View>
            <View style={estilos.formas}>
              {FORMAS_VISUAIS.map((forma) => {
                const activa = form.forma === forma.nome;
                const Marca = forma.Icone;
                return (
                  <Pressable key={forma.nome} style={[estilos.forma, activa && estilos.formaOn]} onPress={() => { set("forma", forma.nome); set("carteira", carteiraDaForma(forma.nome)); }}>
                    <View style={estilos.formaTopo}>
                      <View style={[estilos.formaLogo, activa && estilos.formaLogoOn]}>
                        {forma.logo ? <Image source={forma.logo} style={estilos.logoImg} resizeMode="contain" /> : <Marca size={20} color={forma.cor} />}
                      </View>
                      {activa ? <View style={[estilos.checkBolha, estilos.checkBolhaClara]}><Text style={estilos.checkEscuro}>✓</Text></View> : null}
                    </View>
                    <Text style={[estilos.formaTexto, activa && estilos.chipTextoOn]} numberOfLines={2}>{forma.nome}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Campo Icone={IconeGrafico} cor="#7c3aed" rotulo="Tipo de pagamento">
              <Pressable style={estilos.menuBotao} onPress={() => setTipoAberto((aberto) => !aberto)}>
                <Text style={estilos.selectorValor}>{form.tipo}</Text>
                <View style={{ transform: [{ rotate: tipoAberto ? "-90deg" : "90deg" }] }}><IconeSeta size={16} color="#0f766e" /></View>
              </Pressable>
              {tipoAberto ? (
                <View style={estilos.menu}>
                  {TIPOS.map((opcao) => {
                    const activo = form.tipo === opcao;
                    return (
                      <Pressable key={opcao} style={[estilos.menuItem, activo && estilos.menuItemOn]} onPress={() => { set("tipo", opcao); setTipoAberto(false); }}>
                        <Text style={[estilos.menuTexto, activo && estilos.chipTextoOn]}>{opcao}</Text>
                        {activo ? <Text style={estilos.check}>✓</Text> : <View style={estilos.checkVazio} />}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </Campo>
            <Campo Icone={IconeTelefone} cor="#166534" rotulo="Referência"><Caixa value={form.referencia} onChangeText={(valorTexto) => set("referencia", valorTexto)} placeholder={form.forma === "Dinheiro" ? "Opcional" : "ID da transacção"} /></Campo>
            <View style={estilos.rotuloLinha}><IconeEdificio size={14} color="#0f766e" /><Text style={estilos.rotulo}>Carteira que recebe</Text></View>
            {carteiras.map((item) => {
              const activa = form.carteira === item.nome;
              const logo = logoDaCarteira(item);
              const IconeTipo = item.tipo === "Banco" ? IconeEdificio : item.tipo === "Caixa" ? IconeMoeda : IconeTelefone;
              return (
                <Pressable key={item.id} style={[estilos.carteira, activa && estilos.carteiraOn]} onPress={() => set("carteira", item.nome)}>
                  <View style={estilos.carteiraLogo}>
                    {logo ? <Image source={logo} style={estilos.logoImg} resizeMode="contain" /> : <IconeTipo size={22} color="#0f766e" />}
                  </View>
                  <View style={estilos.flex}>
                    <Text style={estilos.contratoTitulo}>{item.nome}</Text>
                    <Text style={estilos.nota}>{item.tipo}{item.nome === carteiraDaForma(form.forma) ? " · Sugerida" : ""}</Text>
                  </View>
                  <View>
                    <Text style={estilos.rotulo}>Saldo</Text>
                    <Text style={estilos.contratoSaldo}>{mt(item.saldo)}</Text>
                  </View>
                  {activa ? <View style={estilos.checkBolha}><Text style={estilos.check}>✓</Text></View> : null}
                </Pressable>
              );
            })}
            <Campo Icone={IconeDocumento} cor="#5f6662" rotulo="Observações"><Caixa value={form.notas} multiline onChangeText={(valorTexto) => set("notas", valorTexto)} placeholder="Informações adicionais" /></Campo>
          </View>
        </Entrada>
        <Entrada atraso={180}>
          <View style={estilos.painel}>
            <Titulo Icone={IconePercentagem} cor="#b45309" texto="Alocação automática" />
            <Dado Icone={IconePercentagem} cor="#b45309" rotulo="Juros estimados" valor={mt(juros)} />
            <Dado Icone={IconeMoeda} cor="#0f766e" rotulo="Capital" valor={mt(capital)} />
            <Dado Icone={IconeCarteira} cor="#1d4ed8" rotulo="Entra na carteira" valor={form.carteira} />
          </View>
        </Entrada>
        <Pressable style={estilos.botao} onPress={confirmar}><Text style={estilos.botaoTexto}>Confirmar pagamento</Text></Pressable>
      </ScrollView>
      <Calendario visivel={picker === "data"} valor={form.data} onFechar={() => setPicker(null)} onEscolher={(iso) => set("data", iso)} />
      <Relogio visivel={picker === "hora"} valor={form.hora} onFechar={() => setPicker(null)} onEscolher={(horaTexto) => set("hora", horaTexto)} />
    </View>
  );
};

const Historico = ({ onVoltar }) => {
  const { pagamentos } = usarDados();
  const [recibo, setRecibo] = useState(null);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [forma, setForma] = useState("");
  const [tipo, setTipo] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [menu, setMenu] = useState(null);
  const [picker, setPicker] = useState(null);
  const [pagina, setPagina] = useState(1);
  const visiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return pagamentos.filter((item) => {
      if (estado && item.estado !== estado) return false;
      if (forma && item.forma !== forma) return false;
      if (tipo && item.tipo !== tipo) return false;
      if (de && item.data < de) return false;
      if (ate && item.data > ate) return false;
      if (!texto) return true;
      return `${item.recibo} ${item.contrato} ${item.cliente} ${item.referencia}`.toLowerCase().includes(texto);
    });
  }, [ate, busca, de, estado, forma, pagamentos, tipo]);
  const confirmados = pagamentos.filter((item) => item.estado === "Confirmado");
  const hojeIso = hoje();
  const deHoje = confirmados.filter((item) => item.data === hojeIso);
  const paginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const inicio = (actual - 1) * POR_PAGINA;
  const itens = visiveis.slice(inicio, inicio + POR_PAGINA);

  if (recibo) return <Recibo pagamento={recibo} onVoltar={() => setRecibo(null)} />;

  return (
    <View style={estilos.ecra}>
      <CabecaArco titulo="Histórico" sub={`${pagamentos.length} pagamentos registados`} Icone={IconeDocumento} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={estilos.grelha}>
          {[
            [IconeCarteira, "#0f766e", "Recebido", mt(confirmados.reduce((s, item) => s + Number(item.valor), 0))],
            [IconeNascer, "#1d4ed8", "Hoje", mt(deHoje.reduce((s, item) => s + Number(item.valor), 0))],
            [IconePercentagem, "#b45309", "Juros", mt(confirmados.reduce((s, item) => s + Number(item.juros || 0), 0))],
            [IconeAlerta, "#7c3aed", "Estornados", String(pagamentos.filter((item) => item.estado === "Estornado").length)],
          ].map(([Icone, cor, rotulo, valor], indice) => (
            <Entrada key={rotulo} atraso={indice * 50} style={estilos.meio}>
              <Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} />
            </Entrada>
          ))}
        </View>
        <Entrada atraso={140}>
          <View style={estilos.painel}>
            <Titulo Icone={IconeLupa} cor="#0f766e" texto="Encontrar" />
            <View style={estilos.busca}>
              <IconeLupa size={16} color="#0f766e" />
              <Caixa style={estilos.buscaInput} value={busca} onChangeText={(valor) => { setBusca(valor); setPagina(1); }} placeholder="Recibo, contrato, cliente ou referência" />
            </View>
            <View style={estilos.filtroGrelha}>
              {[
                ["estado", IconeEscudo, "#0f766e", "Estado", estado || "Todos"],
                ["forma", IconeCarteira, "#1d4ed8", "Forma", forma || "Todas"],
                ["tipo", IconeGrafico, "#7c3aed", "Tipo", tipo || "Todos"],
              ].map(([id, Icone, cor, rotulo, texto]) => (
                <Pressable key={id} style={[estilos.filtroCartao, menu === id && { borderColor: cor }]} onPress={() => setMenu(id)}>
                  <View style={[estilos.filtroIcone, { backgroundColor: `${cor}16` }]}><Icone size={18} color={cor} /></View>
                  <Text style={estilos.filtroRotulo}>{rotulo}</Text>
                  <Text style={estilos.filtroValorNovo} numberOfLines={1}>{texto}</Text>
                </Pressable>
              ))}
            </View>
            <View style={estilos.datas}>
              <Pressable style={[estilos.selector, estilos.flex]} onPress={() => setPicker("de")}>
                <View style={estilos.selectorIcone}><IconeNascer size={16} color="#0f766e" /></View>
                <View style={estilos.flex}>
                  <Text style={estilos.rotulo}>De</Text>
                  <Text style={estilos.selectorValor}>{de ? formatarData(de) : "Início"}</Text>
                </View>
              </Pressable>
              <Pressable style={[estilos.selector, estilos.flex]} onPress={() => setPicker("ate")}>
                <View style={estilos.selectorIcone}><IconeNascer size={16} color="#0f766e" /></View>
                <View style={estilos.flex}>
                  <Text style={estilos.rotulo}>Até</Text>
                  <Text style={estilos.selectorValor}>{ate ? formatarData(ate) : "Fim"}</Text>
                </View>
              </Pressable>
            </View>
            <Pressable style={estilos.partilhar} onPress={() => Share.share({ message: visiveis.map((item) => `${item.recibo} | ${item.cliente} | ${mt(item.valor)} | ${item.forma} | ${item.estado}`).join("\n") })}>
              <IconeDocumento size={15} color="#0f766e" />
              <Text style={estilos.partilharTexto}>Partilhar</Text>
            </Pressable>
          </View>
        </Entrada>
        <Titulo Icone={IconeDocumento} cor="#0f766e" texto="Recibos" />
        {itens.length === 0 ? (
          <View style={estilos.vazio}>
            <IconeCarteira size={26} color="#0f766e" />
            <Text style={estilos.vazioTitulo}>Nenhum pagamento encontrado.</Text>
          </View>
        ) : itens.map((item, indice) => (
          <Entrada key={`${actual}-${item.id}`} atraso={indice * 50}>
            <Pressable style={estilos.cartao} onPress={() => setRecibo(item)}>
              <View style={estilos.cartaoTopo}>
                <View style={estilos.avatar}><IconeDocumento size={16} color="#0f766e" /></View>
                <View style={estilos.flex}>
                  <Text style={estilos.nome}>{item.recibo}</Text>
                  <Text style={estilos.nota}>{item.cliente} · {item.contrato}</Text>
                </View>
                <View style={estilos.ver}><IconeOlho size={16} color="#0f766e" /></View>
              </View>
              <View style={estilos.meta}><IconeMoeda size={14} color="#0f766e" /><Text style={estilos.metaTexto}>{mt(item.valor)}</Text></View>
              <View style={estilos.meta}><IconeNascer size={14} color="#1d4ed8" /><Text style={estilos.metaTexto}>{item.data} {item.hora}</Text></View>
              <View style={estilos.meta}><IconeCarteira size={14} color="#b45309" /><Text style={estilos.metaTexto}>{item.forma}</Text></View>
              <View style={estilos.etiquetas}>
                <Etiqueta texto={item.tipo} cor="#1d4ed8" />
                <Etiqueta texto={item.estado} cor={corEstado(item.estado)} />
              </View>
            </Pressable>
          </Entrada>
        ))}
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
      <Calendario visivel={picker === "de"} valor={de} titulo="Desde" onFechar={() => setPicker(null)} onEscolher={(iso) => { setDe(iso); setPagina(1); }} />
      <Calendario visivel={picker === "ate"} valor={ate} titulo="Até" onFechar={() => setPicker(null)} onEscolher={(iso) => { setAte(iso); setPagina(1); }} />
      <Modal transparent visible={Boolean(menu)} animationType="slide" onRequestClose={() => setMenu(null)}>
        <Pressable style={estilos.vela} onPress={() => setMenu(null)}>
          <Pressable style={estilos.folhaFiltro} onPress={() => {}}>
            <View style={estilos.puxador} />
            <Text style={estilos.folhaTitulo}>{menu === "forma" ? "Forma de pagamento" : menu === "tipo" ? "Tipo de pagamento" : "Estado do pagamento"}</Text>
            <ScrollView style={estilos.folhaLista} showsVerticalScrollIndicator={false}>
              {(menu === "forma" ? ["Todas", ...FORMAS] : menu === "tipo" ? ["Todos", ...TIPOS] : ["Todos", ...ESTADOS]).map((opcao, indice) => {
                const actualFiltro = menu === "forma" ? (forma || "Todas") : menu === "tipo" ? (tipo || "Todos") : (estado || "Todos");
                const activo = actualFiltro === opcao;
                const cor = menu === "forma" ? "#1d4ed8" : menu === "tipo" ? "#7c3aed" : corEstado(opcao === "Todos" ? "" : opcao);
                const Icone = menu === "forma" ? IconeCarteira : menu === "tipo" ? IconeGrafico : IconeEscudo;
                return (
                  <Entrada key={opcao} atraso={indice * 30}>
                    <Pressable
                      style={[estilos.opcaoFolha, activo && estilos.opcaoFolhaOn]}
                      onPress={() => {
                        if (menu === "forma") setForma(opcao === "Todas" ? "" : opcao);
                        else if (menu === "tipo") setTipo(opcao === "Todos" ? "" : opcao);
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

const Pagamentos = ({ modo, onVoltar }) => (modo === "historico" ? <Historico onVoltar={onVoltar} /> : <Registar onVoltar={onVoltar} />);

const estilos = StyleSheet.create({
  ecra: { flex: 1, backgroundColor: FUNDO },
  scroll: { flex: 1 },
  corpo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, gap: 10 },
  flex: { flex: 1 },
  cabeca: { overflow: "hidden", backgroundColor: "#0f766e", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 52, minHeight: 150 },
  faixa: { position: "absolute", width: 220, height: 280, right: -30, top: -80, backgroundColor: "#14b8a6" },
  arco: { position: "absolute", width: 210, height: 210, borderRadius: 105, backgroundColor: FUNDO, right: -70, bottom: -150 },
  circulo: { position: "absolute", width: 64, height: 64, borderRadius: 32, left: -18, bottom: 28, backgroundColor: "rgba(255,255,255,0.16)" },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  voltarTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "700" },
  cabecaLinha: { flexDirection: "row", alignItems: "center", gap: 12 },
  cabecaIcone: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
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
  dado: { flexDirection: "row", alignItems: "center", gap: 10 },
  dadoIcone: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dadoValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  rotuloLinha: { flexDirection: "row", alignItems: "center", gap: 6 },
  rotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700" },
  campo: { gap: 6 },
  input: { backgroundColor: FUNDO, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonte, color: cores.titulo },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { backgroundColor: FUNDO, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  chipOn: { backgroundColor: "#0f766e" },
  chipTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 12, fontWeight: "700" },
  chipTextoOn: { color: "#ffffff" },
  opcaoParcela: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: FUNDO, borderRadius: 14, padding: 10 },
  opcaoParcelaOn: { backgroundColor: "#0f766e" },
  opcaoParcelaTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "700", fontSize: 13 },
  aviso: { fontFamily: fonte, color: "#0f766e", fontWeight: "800" },
  nota: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  botao: { backgroundColor: "#0f766e", borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  botaoTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "800" },
  busca: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: FUNDO, borderRadius: 14, paddingHorizontal: 12 },
  buscaInput: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 0 },
  filtros: { flexDirection: "row", gap: 8 },
  filtro: { flex: 1, backgroundColor: FUNDO, borderRadius: 14, padding: 8, gap: 2 },
  filtroOn: { backgroundColor: "#0f766e" },
  filtroValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 12 },
  claro: { color: "#ffffff" },
  datas: { flexDirection: "row", gap: 8 },
  partilhar: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "#ccfbf1", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  partilharTexto: { fontFamily: fonte, color: "#0f766e", fontWeight: "800" },
  cartao: { backgroundColor: cores.branco, borderRadius: 18, padding: 12, gap: 6 },
  cartaoTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center" },
  nome: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  ver: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 13 },
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  etiqueta: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  etiquetaTexto: { fontFamily: fonte, fontSize: 11, fontWeight: "800" },
  vazio: { backgroundColor: cores.branco, borderRadius: 16, padding: 18, alignItems: "center", gap: 6 },
  vazioTitulo: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  paginacao: { backgroundColor: cores.branco, borderRadius: 16, padding: 12, gap: 8 },
  paginas: { flexDirection: "row", justifyContent: "space-between" },
  paginaTexto: { fontFamily: fonte, color: "#0f766e", fontWeight: "800" },
  off: { color: "#c5ccc8" },
  par: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  celula: { width: "47%" },
  escolhido: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#0f766e", borderRadius: 18, padding: 12 },
  escolhidoIcone: { width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  escolhidoNome: { fontFamily: fonte, color: "#ffffff", fontWeight: "800" },
  escolhidoMeta: { fontFamily: fonte, color: "#ffffff", fontSize: 12 },
  trocar: { backgroundColor: "#ffffff", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  trocarTexto: { fontFamily: fonte, color: "#0f766e", fontWeight: "800", fontSize: 12 },
  resultados: { marginTop: 8, gap: 6 },
  resultado: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: FUNDO, borderRadius: 14, padding: 10 },
  resultadoIcone: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center" },
  filtrosCol: { gap: 8 },
  menuItemLinha: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  claroSuave: { color: "rgba(255,255,255,0.86)" },
  contrato: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: FUNDO, borderRadius: 16, padding: 10 },
  contratoOn: { backgroundColor: "#0f766e" },
  contratoIcone: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center" },
  contratoIconeOn: { backgroundColor: "rgba(255,255,255,0.18)" },
  contratoTitulo: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  contratoSaldo: { fontFamily: fonte, color: "#0f766e", fontWeight: "800", fontSize: 12 },
  valorCaixa: { flexDirection: "row", alignItems: "center", backgroundColor: FUNDO, borderRadius: 14, paddingRight: 12 },
  valorInput: { flex: 1, backgroundColor: "transparent", fontSize: 22, fontWeight: "800" },
  moeda: { fontFamily: fonte, color: "#0f766e", fontWeight: "800" },
  selector: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: FUNDO, borderRadius: 16, padding: 10 },
  selectorIcone: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center" },
  selectorIconeAzul: { backgroundColor: "#dbeafe" },
  selectorValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", marginTop: 1 },
  formas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  forma: { width: "48%", backgroundColor: FUNDO, borderRadius: 16, padding: 10, gap: 8, minHeight: 96, borderWidth: 1.5, borderColor: "transparent" },
  formaOn: { backgroundColor: "#0f766e", borderColor: "#0f766e" },
  formaTopo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  formaLogo: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.branco, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  formaLogoOn: { backgroundColor: "#ffffff" },
  formaTexto: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 13 },
  logoImg: { width: 34, height: 34 },
  check: { color: "#ffffff", fontWeight: "800", fontSize: 12 },
  checkBolha: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#0f766e", alignItems: "center", justifyContent: "center" },
  checkBolhaClara: { backgroundColor: "#ffffff" },
  checkEscuro: { color: "#0f766e", fontWeight: "800", fontSize: 12 },
  checkVazio: { width: 16, height: 16 },
  menuBotao: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: FUNDO, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 13 },
  menu: { backgroundColor: cores.branco, borderRadius: 14, borderWidth: 1, borderColor: "#d7ebe6", overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12 },
  menuItemOn: { backgroundColor: "#0f766e" },
  menuTexto: { fontFamily: fonte, color: cores.titulo, fontWeight: "700" },
  carteira: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: FUNDO, borderRadius: 16, padding: 10, borderWidth: 1.5, borderColor: "transparent" },
  carteiraOn: { borderColor: "#0f766e", backgroundColor: "#f0fdfa" },
  carteiraLogo: { width: 52, height: 52, borderRadius: 16, backgroundColor: cores.branco, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  vela: { flex: 1, backgroundColor: "rgba(15, 23, 20, 0.48)", justifyContent: "flex-end" },
  folha: { backgroundColor: cores.branco, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28, gap: 10, maxHeight: "88%" },
  puxador: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#d5ddd8", alignSelf: "center", marginBottom: 4 },
  folhaTitulo: { fontFamily: fonte, color: cores.titulo, fontSize: 18, fontWeight: "800" },
  mesNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center" },
  mesTitulo: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 16 },
  semana: { flexDirection: "row" },
  semanaTexto: { width: "14.28%", textAlign: "center", fontFamily: fonte, color: "#8d9390", fontSize: 12, fontWeight: "700" },
  dias: { flexDirection: "row", flexWrap: "wrap" },
  dia: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  diaOn: { backgroundColor: "#0f766e" },
  diaHoje: { borderWidth: 1.5, borderColor: "#0f766e" },
  diaTexto: { fontFamily: fonte, color: cores.titulo, fontWeight: "700" },
  diaTextoOn: { color: "#ffffff" },
  relogioGrande: { fontFamily: fonte, fontSize: 42, fontWeight: "800", color: "#0f766e", textAlign: "center", letterSpacing: 2 },
  relogioLista: { maxHeight: 280 },
  rotuloEspaco: { marginTop: 8 },
  grelhaHoras: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  horaBtn: { width: "14.6%", marginHorizontal: "1%", marginVertical: 4, paddingVertical: 8, alignItems: "center", borderRadius: 12, backgroundColor: FUNDO },
  horaBtnOn: { backgroundColor: "#0f766e" },
  horaTexto: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  horaTextoOn: { color: "#ffffff" },
  talao: { backgroundColor: cores.branco, borderRadius: 28, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 12, overflow: "hidden" },
  furoEsq: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: FUNDO, left: -14, top: 168 },
  furoDir: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: FUNDO, right: -14, top: 168 },
  talaoHero: { alignItems: "center", gap: 6, paddingBottom: 18 },
  talaoSelo: { width: 56, height: 56, borderRadius: 20, backgroundColor: "#ccfbf1", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  talaoLegenda: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  talaoValor: { fontFamily: fonte, color: "#0f766e", fontSize: 34, fontWeight: "800" },
  talaoEstado: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: 6 },
  talaoEstadoTexto: { fontFamily: fonte, fontWeight: "800", fontSize: 13 },
  picotes: { height: 1, borderStyle: "dashed", borderTopWidth: 1, borderColor: "#d5ebe6", marginBottom: 16 },
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
  filtroIcone: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  filtroRotulo: { fontFamily: fonte, color: "#8d9390", fontSize: 11, fontWeight: "700" },
  filtroValorNovo: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 12, textAlign: "center" },
  folhaFiltro: { backgroundColor: cores.branco, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, maxHeight: "78%" },
  folhaLista: { marginTop: 8 },
  opcaoFolha: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: FUNDO, borderRadius: 18, padding: 12, marginBottom: 8 },
  opcaoFolhaOn: { backgroundColor: "#0f766e" },
  opcaoFolhaIcone: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  opcaoFolhaTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 15 },
  opcaoMarca: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: "#d5ebe6", alignItems: "center", justifyContent: "center" },
  opcaoMarcaOn: { backgroundColor: "#ffffff", borderColor: "#ffffff" },
});

export default Pagamentos;
