import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  IconeAlerta, IconeCarteira, IconeCasa, IconeDocumento, IconeEdificio, IconeEquipa, IconeEscudo, IconeEstrela, IconeFechar,
  IconeLupa, IconeMapa, IconeMoeda, IconeNascer, IconeOlho, IconePercentagem, IconePin, IconePessoa, IconeTelefone, IconeTelemovel, IconeVoltar,
} from "../componentes/Icones";
import Mapa from "./modulos/Mapa";
import { gerarRotaDoDia, mudarAgenda, registarVisita, usarDados } from "../dados/operacao";
import { cores, fonte } from "../tema";

const FUNDO = "#f4f8f5";
const COR = "#0369a1";
const POR = 5;
const ESTADOS_AGENDA = ["Pendente", "Em Curso", "Concluída", "Cancelada"];
const ESTADOS_ITEM = ["Cobrado", "Parcial", "Promessa", "Não cobrado"];
const ESTADOS_ZONA = ["Ativa", "Inativa"];
const ESTADOS_COB = ["Activo", "Inactivo"];
const mt = (valor) => `${Number(valor || 0).toLocaleString("pt-PT")} MT`;
const corEstado = (estado) => ({
  Pendente: "#b45309", "Em Curso": "#0369a1", "Concluída": "#0f766e", Cancelada: "#5f6662",
  Cobrado: "#0f766e", Parcial: "#1d4ed8", Promessa: "#b45309", "Não cobrado": "#9b2c2c",
  Ativa: "#0f766e", Inativa: "#5f6662", Activo: "#0f766e", Inactivo: "#5f6662",
})[estado] || "#5f6662";
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

const Cabeca = ({ titulo, sub, Icone, onVoltar, voltar }) => {
  const sobe = useRef(new Animated.Value(0)).current;
  const onda = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sobe, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(onda, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(onda, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [onda, sobe]);
  return (
    <Animated.View style={[estilos.cabeca, { opacity: sobe, transform: [{ translateY: sobe.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }]}>
      <Animated.View style={[estilos.onda, { transform: [{ translateX: onda.interpolate({ inputRange: [0, 1], outputRange: [-18, 22] }) }] }]} />
      <View style={estilos.onda2} />
      <Pressable style={estilos.voltar} onPress={onVoltar}><IconeVoltar size={16} color="#ffffff" /><Text style={estilos.voltarTexto}>{voltar}</Text></Pressable>
      <View style={estilos.cabecaLinha}>
        <View style={estilos.cabecaIcone}><Icone size={22} color="#ffffff" /></View>
        <View style={estilos.flex}><Text style={estilos.cabecaTitulo}>{titulo}</Text><Text style={estilos.cabecaSub}>{sub}</Text></View>
      </View>
    </Animated.View>
  );
};

const Estatistica = ({ Icone, cor, rotulo, valor }) => (
  <View style={estilos.stat}>
    <View style={[estilos.statIcone, { backgroundColor: `${cor}18` }]}><Icone size={16} color={cor} /></View>
    <Text style={estilos.statValor} numberOfLines={1}>{valor}</Text>
    <Text style={estilos.statRotulo}>{rotulo}</Text>
  </View>
);
const Etiqueta = ({ texto, cor }) => <View style={[estilos.etiqueta, { backgroundColor: `${cor}16` }]}><Text style={[estilos.etiquetaTexto, { color: cor }]}>{texto}</Text></View>;

const AoVivo = () => {
  const pulso = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulso, { toValue: 0.35, duration: 700, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso]);
  return (
    <View style={estilos.vivo}>
      <Animated.View style={[estilos.vivoPonto, { opacity: pulso }]} />
      <Text style={estilos.vivoTexto}>Mapa em tempo real</Text>
    </View>
  );
};

const Talao = ({ titulo, valor, estado, blocos, linhas, onVoltar }) => {
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(pulso, { toValue: 1.04, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulso, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso]);
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo={titulo} sub="Detalhe" Icone={IconeMapa} onVoltar={onVoltar} voltar="Voltar" />
      <ScrollView contentContainerStyle={estilos.corpo} showsVerticalScrollIndicator={false}>
        <Entrada>
          <View style={estilos.talao}>
            <View style={estilos.furoEsq} /><View style={estilos.furoDir} />
            <Animated.View style={[estilos.talaoHero, { transform: [{ scale: pulso }] }]}>
              <View style={estilos.talaoSelo}><IconeMoeda size={22} color={COR} /></View>
              <Text style={estilos.talaoLegenda}>Valor</Text>
              <Text style={estilos.talaoValor}>{valor}</Text>
              {estado ? <View style={[estilos.talaoEstado, { backgroundColor: `${corEstado(estado)}16` }]}><IconeEscudo size={14} color={corEstado(estado)} /><Text style={[estilos.talaoEstadoTexto, { color: corEstado(estado) }]}>{estado}</Text></View> : null}
            </Animated.View>
            <View style={estilos.picotes} />
            {blocos ? <View style={estilos.talaoPar}>{blocos}</View> : null}
            {linhas.map(([Icone, cor, rotulo, texto], indice) => (
              <Entrada key={rotulo} atraso={40 + indice * 30}>
                <View style={estilos.reciboLinha}>
                  <View style={[estilos.reciboIcone, { backgroundColor: `${cor}14` }]}><Icone size={18} color={cor} /></View>
                  <View style={estilos.reciboTexto}><Text style={estilos.reciboRotulo}>{rotulo}</Text><Text style={estilos.reciboValor}>{texto || "—"}</Text></View>
                </View>
              </Entrada>
            ))}
          </View>
        </Entrada>
      </ScrollView>
    </View>
  );
};

const Bloco = ({ Icone, fundo, cor, rotulo, valor }) => (
  <View style={estilos.talaoBloco}>
    <View style={[estilos.talaoBlocoIcone, { backgroundColor: fundo }]}><Icone size={18} color={cor} /></View>
    <Text style={estilos.talaoBlocoRotulo}>{rotulo}</Text>
    <Text style={estilos.talaoBlocoValor}>{valor}</Text>
  </View>
);

const PainelFiltro = ({ visivel, titulo, opcoes, actual, Icone, onFechar, onEscolher }) => (
  <Modal transparent visible={visivel} animationType="slide" onRequestClose={onFechar}>
    <Pressable style={estilos.vela} onPress={onFechar}>
      <Pressable style={estilos.folha} onPress={() => {}}>
        <View style={estilos.puxador} /><Text style={estilos.folhaTitulo}>{titulo}</Text>
        <ScrollView style={estilos.folhaLista} showsVerticalScrollIndicator={false}>
          {opcoes.map((entrada, indice) => {
            const opcao = Array.isArray(entrada) ? entrada[0] : entrada;
            const Marca = Array.isArray(entrada) ? entrada[1] : Icone;
            const activo = actual === opcao;
            return (
              <Entrada key={opcao} atraso={indice * 28}>
                <Pressable style={[estilos.opcaoFolha, activo && estilos.opcaoFolhaOn]} onPress={() => onEscolher(opcao)}>
                  <View style={[estilos.opcaoFolhaIcone, { backgroundColor: activo ? "rgba(255,255,255,0.2)" : "#e0f2fe" }]}><Marca size={18} color={activo ? "#ffffff" : COR} /></View>
                  <Text style={[estilos.opcaoFolhaTexto, activo && estilos.claro]}>{opcao}</Text>
                  <View style={[estilos.opcaoMarca, activo && estilos.opcaoMarcaOn]}>{activo ? <Text style={estilos.check}>✓</Text> : null}</View>
                </Pressable>
              </Entrada>
            );
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

const Botao = ({ Icone, texto, claro, onPress }) => {
  const escala = useRef(new Animated.Value(1)).current;
  const mover = (para) => Animated.spring(escala, { toValue: para, useNativeDriver: true, speed: 28, bounciness: 5 }).start();
  return (
    <Animated.View style={{ transform: [{ scale: escala }], alignSelf: "stretch" }}>
      <Pressable style={[estilos.botaoLargo, claro && estilos.botaoLargoClaro]} onPressIn={() => mover(0.97)} onPressOut={() => mover(1)} onPress={onPress}>
        <View style={[estilos.botaoLargoIcone, claro && estilos.botaoLargoIconeClaro]}><Icone size={18} color={claro ? COR : "#ffffff"} /></View>
        <Text style={[estilos.botaoLargoTexto, claro && estilos.botaoLargoTextoClaro]}>{texto}</Text>
      </Pressable>
    </Animated.View>
  );
};
const ALTURA_MAPA = 400;
const FORMAS = [
  ["Dinheiro", IconeMoeda],
  ["E-Mola", IconeTelemovel],
  ["Mpesa", IconeTelefone],
  ["M-Kesh", IconeCarteira],
  ["Transferência Bancária", IconeEdificio],
  ["Cheque", IconeDocumento],
];
const MOTIVOS = [
  ["Cliente ausente", IconePessoa],
  ["Sem dinheiro no momento", IconeMoeda],
  ["Recusou pagar", IconeFechar],
  ["Endereço não encontrado", IconePin],
  ["Telefone desligado", IconeTelefone],
  ["Cliente doente", IconeCasa],
  ["Outro", IconeDocumento],
];
const iconeCarteira = (nome) => ({ Caixa: IconeMoeda, "M-Pesa": IconeTelefone, "E-Mola": IconeTelemovel, Mkesh: IconeCarteira }[nome] || IconeEdificio);
const pontosZona = (zonas) => zonas.filter((z) => z.lat && z.lon).map((z) => ({ lat: z.lat, lon: z.lon, titulo: z.nome, texto: `${z.codigo} · ${z.provincia}`, raio: Number(z.raio) || 0, cor: z.estado === "Ativa" ? "#0369a1" : "#64748b" }));

const DetalheAgenda = ({ agendaId, onVoltar }) => {
  const { agendas, carteiras } = usarDados();
  const agenda = agendas.find((item) => item.id === agendaId);
  const [accao, setAccao] = useState(null);
  const [valor, setValor] = useState("");
  const [forma, setForma] = useState("Dinheiro");
  const [carteira, setCarteira] = useState(carteiras[0]?.nome || "Caixa");
  const [motivo, setMotivo] = useState(MOTIVOS[0][0]);
  const [promessa, setPromessa] = useState("");
  const [aviso, setAviso] = useState("");
  if (!agenda) return null;
  const aberta = agenda.estado === "Pendente" || agenda.estado === "Em Curso";
  const pontos = (agenda.paragens || []).filter((p) => p.lat && p.lon).map((p) => ({
    lat: p.lat, lon: p.lon, titulo: `${p.ordem}. ${p.cliente}`, texto: `${p.estado} · ${mt(p.esperado)}`, cor: p.estado === "Cobrado" ? "#0f766e" : COR,
  }));
  const abrir = (tipo, paragem) => {
    setAccao({ tipo, paragem });
    setValor(String(Math.max(0, Number(paragem?.esperado || 0) - Number(paragem?.cobrado || 0)) || paragem?.esperado || ""));
    setPromessa("");
    setAviso("");
  };
  const confirmar = () => {
    if (accao?.tipo === "cancelar") {
      mudarAgenda(agenda.id, "Cancelada");
      setAccao(null);
      setAviso("Agenda cancelada.");
      return;
    }
    const paragem = accao?.paragem;
    if (!paragem) return;
    if (accao.tipo === "pagar") {
      const montante = Number(String(valor).replace(/\s/g, "").replace(",", ".")) || 0;
      const total = (Number(paragem.cobrado) || 0) + montante;
      const estado = total + 0.5 >= Number(paragem.esperado) ? "Cobrado" : "Parcial";
      registarVisita(agenda.id, paragem.id, { estado, cobrado: total, forma, carteira });
      setAviso("Pagamento registado na rota, na carteira e no histórico.");
    } else if (accao.tipo === "promessa") {
      registarVisita(agenda.id, paragem.id, { estado: "Promessa", cobrado: Number(paragem.cobrado) || 0, promessa: promessa || "Promessa de pagamento" });
      setAviso("Promessa registada.");
    } else {
      registarVisita(agenda.id, paragem.id, { estado: "Não cobrado", cobrado: Number(paragem.cobrado) || 0, motivo });
      setAviso("Visita registada como não cobrada.");
    }
    setAccao(null);
  };
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo={agenda.codigo} sub={`${agenda.zona} · ${agenda.cobrador}`} Icone={IconeMapa} onVoltar={onVoltar} voltar="Agenda" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        <Entrada>
          <View style={estilos.talao}>
            <View style={estilos.furoEsq} /><View style={estilos.furoDir} />
            <View style={estilos.talaoHero}>
              <View style={estilos.talaoSelo}><IconeMoeda size={22} color={COR} /></View>
              <Text style={estilos.talaoLegenda}>Esperado</Text>
              <Text style={estilos.talaoValor}>{mt(agenda.esperado)}</Text>
              <View style={[estilos.talaoEstado, { backgroundColor: `${corEstado(agenda.estado)}16` }]}><IconeEscudo size={14} color={corEstado(agenda.estado)} /><Text style={[estilos.talaoEstadoTexto, { color: corEstado(agenda.estado) }]}>{agenda.estado}</Text></View>
            </View>
            <View style={estilos.picotes} />
            <View style={estilos.talaoPar}>
              <Bloco Icone={IconeMoeda} fundo="#e0f2fe" cor={COR} rotulo="Cobrado" valor={mt(agenda.cobrado)} />
              <Bloco Icone={IconeEquipa} fundo="#fef3c7" cor="#b45309" rotulo="Paragens" valor={String(agenda.paragens?.length || 0)} />
            </View>
            <View style={estilos.reciboLinha}><View style={[estilos.reciboIcone, { backgroundColor: "#e0f2fe" }]}><IconeNascer size={18} color={COR} /></View><View style={estilos.reciboTexto}><Text style={estilos.reciboRotulo}>Horário</Text><Text style={estilos.reciboValor}>{agenda.data} · {agenda.inicio}–{agenda.fim}</Text></View></View>
          </View>
        </Entrada>
        <View style={estilos.painel}><AoVivo /><View style={estilos.mapaCaixa}><Mapa pontos={pontos} altura={ALTURA_MAPA} aoVivo /></View></View>
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
        {aberta ? (
          <View style={estilos.accoes}>
            {agenda.estado === "Pendente" ? <Botao Icone={IconeMapa} texto="Iniciar rota" onPress={() => { mudarAgenda(agenda.id, "Em Curso"); setAviso("Rota iniciada."); }} /> : null}
            <Botao Icone={IconeEscudo} texto="Finalizar rota" onPress={() => { mudarAgenda(agenda.id, "Concluída"); setAviso("Rota concluída."); }} />
            {agenda.estado === "Pendente" ? <Botao Icone={IconeFechar} texto="Cancelar agenda" claro onPress={() => abrir("cancelar")} /> : null}
          </View>
        ) : null}
        {(agenda.paragens || []).map((p, i) => (
          <Entrada key={p.id} atraso={i * 40}>
            <View style={estilos.cartao}>
              <View style={estilos.cartaoTopo}>
                <View style={estilos.ordem}><Text style={estilos.ordemTexto}>{p.ordem}</Text></View>
                <View style={estilos.flex}><Text style={estilos.nome}>{p.cliente}</Text><Text style={estilos.nota}>{p.endereco}</Text></View>
                <Etiqueta texto={p.estado} cor={corEstado(p.estado)} />
              </View>
              <View style={estilos.linha}><IconeDocumento size={14} color={COR} /><Text style={estilos.metaTexto}>{p.contrato} · {p.parcela}</Text></View>
              <View style={estilos.linha}><IconeMoeda size={14} color="#0f766e" /><Text style={estilos.metaTexto}>{mt(p.cobrado)} de {mt(p.esperado)}</Text></View>
              {p.motivo ? <Text style={estilos.nota}>{p.motivo}</Text> : null}
              {p.promessa ? <Text style={estilos.nota}>{p.promessa}</Text> : null}
              {aberta && p.estado !== "Cobrado" ? (
                <View style={estilos.accoes}>
                  {p.telefone ? <Botao Icone={IconeTelefone} texto="Ligar" claro onPress={() => Linking.openURL(`tel:${p.telefone}`)} /> : null}
                  <Botao Icone={IconeCarteira} texto="Registar pagamento" onPress={() => abrir("pagar", p)} />
                  <Botao Icone={IconeNascer} texto="Promessa" claro onPress={() => abrir("promessa", p)} />
                  <Botao Icone={IconeAlerta} texto="Não cobrado" claro onPress={() => abrir("nao", p)} />
                </View>
              ) : null}
            </View>
          </Entrada>
        ))}
      </ScrollView>
      <Modal visible={Boolean(accao)} transparent animationType="slide" onRequestClose={() => setAccao(null)}>
        <Pressable style={estilos.vela} onPress={() => setAccao(null)}>
          <Pressable style={estilos.folha} onPress={() => {}}>
            <View style={estilos.puxador} />
            <View style={estilos.folhaTopo}>
              <View style={estilos.folhaSelo}>{accao?.tipo === "pagar" ? <IconeCarteira size={20} color={COR} /> : accao?.tipo === "promessa" ? <IconeNascer size={20} color="#b45309" /> : accao?.tipo === "nao" ? <IconeAlerta size={20} color="#9b2c2c" /> : <IconeFechar size={20} color="#5f6662" />}</View>
              <Text style={estilos.folhaTitulo}>{accao?.tipo === "pagar" ? "Registar pagamento" : accao?.tipo === "promessa" ? "Promessa" : accao?.tipo === "nao" ? "Não cobrado" : "Cancelar agenda"}</Text>
            </View>
            <ScrollView style={estilos.folhaLista}>
              {accao?.tipo === "pagar" ? (
                <>
                  <Text style={estilos.filtroRotulo}>Valor desta visita (MT)</Text>
                  <TextInput value={valor} onChangeText={setValor} keyboardType="decimal-pad" style={estilos.campo} />
                  <Text style={estilos.filtroRotulo}>Forma</Text>
                  {FORMAS.map(([nome, Icone]) => (
                    <Pressable key={nome} style={[estilos.opcaoFolha, forma === nome && estilos.opcaoFolhaOn]} onPress={() => setForma(nome)}>
                      <View style={[estilos.opcaoFolhaIcone, { backgroundColor: forma === nome ? "rgba(255,255,255,0.2)" : "#e0f2fe" }]}><Icone size={18} color={forma === nome ? "#ffffff" : COR} /></View>
                      <Text style={[estilos.opcaoFolhaTexto, forma === nome && estilos.claro]}>{nome}</Text>
                    </Pressable>
                  ))}
                  <Text style={estilos.filtroRotulo}>Carteira</Text>
                  {carteiras.map((item) => {
                    const Marca = iconeCarteira(item.nome);
                    const activo = carteira === item.nome;
                    return (
                      <Pressable key={item.id} style={[estilos.opcaoFolha, activo && estilos.opcaoFolhaOn]} onPress={() => setCarteira(item.nome)}>
                        <View style={[estilos.opcaoFolhaIcone, { backgroundColor: activo ? "rgba(255,255,255,0.2)" : "#e0f2fe" }]}><Marca size={18} color={activo ? "#ffffff" : COR} /></View>
                        <Text style={[estilos.opcaoFolhaTexto, activo && estilos.claro]}>{item.nome}</Text>
                      </Pressable>
                    );
                  })}
                </>
              ) : null}
              {accao?.tipo === "promessa" ? <TextInput value={promessa} onChangeText={setPromessa} placeholder="Data ou nota da promessa" placeholderTextColor={cores.placeholder} style={estilos.campo} /> : null}
              {accao?.tipo === "nao" ? MOTIVOS.map(([nome, Icone]) => (
                <Pressable key={nome} style={[estilos.opcaoFolha, motivo === nome && estilos.opcaoFolhaOn]} onPress={() => setMotivo(nome)}>
                  <View style={[estilos.opcaoFolhaIcone, { backgroundColor: motivo === nome ? "rgba(255,255,255,0.2)" : "#e0f2fe" }]}><Icone size={18} color={motivo === nome ? "#ffffff" : COR} /></View>
                  <Text style={[estilos.opcaoFolhaTexto, motivo === nome && estilos.claro]}>{nome}</Text>
                </Pressable>
              )) : null}
              {accao?.tipo === "cancelar" ? <Text style={estilos.nota}>A rota fica cancelada e sai do mapa do dia.</Text> : null}
            </ScrollView>
            <Botao Icone={IconeEscudo} texto="Confirmar" onPress={confirmar} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const Agenda = ({ onVoltar }) => {
  const { agendas } = usarDados();
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [menu, setMenu] = useState(false);
  const [ficha, setFicha] = useState(null);
  const [aviso, setAviso] = useState("");
  const [pagina, setPagina] = useState(1);
  const visiveis = useMemo(() => agendas.filter((a) => (!estado || a.estado === estado) && `${a.codigo} ${a.cobrador} ${a.zona}`.toLowerCase().includes(busca.trim().toLowerCase())), [agendas, busca, estado]);
  const paginas = Math.max(1, Math.ceil(visiveis.length / POR));
  const actual = Math.min(pagina, paginas);
  const itens = visiveis.slice((actual - 1) * POR, actual * POR);
  const hojeLista = agendas.filter((a) => a.data === hoje());
  if (ficha) return <DetalheAgenda agendaId={ficha} onVoltar={() => setFicha(null)} />;
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Agenda" sub={`${agendas.length} rotas de cobrança`} Icone={IconeNascer} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo} keyboardShouldPersistTaps="handled">
        <View style={estilos.grelha}>
          {[
            [IconeNascer, COR, "Hoje", String(hojeLista.length)],
            [IconeMapa, "#1d4ed8", "Em curso", String(agendas.filter((a) => a.estado === "Em Curso").length)],
            [IconeMoeda, "#b45309", "Esperado hoje", mt(hojeLista.reduce((s, a) => s + Number(a.esperado || 0), 0))],
            [IconeEscudo, "#0f766e", "Cobrado hoje", mt(hojeLista.reduce((s, a) => s + Number(a.cobrado || 0), 0))],
          ].map(([Icone, cor, rotulo, valor], i) => <Entrada key={rotulo} atraso={i * 40} style={estilos.meio}><Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} /></Entrada>)}
        </View>
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
        <Botao Icone={IconeEstrela} texto="Gerar rotas de hoje" onPress={() => setAviso(gerarRotaDoDia() ? "Rota do dia gerada a partir dos empréstimos em atraso." : "Já existe uma rota para hoje.")} />
        <View style={estilos.painel}>
          <View style={estilos.busca}><IconeLupa size={16} color={COR} /><TextInput value={busca} onChangeText={(v) => { setBusca(v); setPagina(1); }} placeholder="Código, cobrador ou zona" placeholderTextColor={cores.placeholder} style={estilos.buscaInput} /></View>
          <Pressable style={estilos.filtroCartao} onPress={() => setMenu(true)}>
            <View style={estilos.filtroIcone}><IconeEscudo size={18} color={COR} /></View>
            <Text style={estilos.filtroRotulo}>Estado</Text>
            <Text style={estilos.filtroValor}>{estado || "Todos"}</Text>
          </Pressable>
        </View>
        {itens.map((a, i) => (
          <Entrada key={a.id} atraso={i * 40}>
            <View style={estilos.cartao}>
              <Pressable onPress={() => setFicha(a.id)}>
                <View style={estilos.cartaoTopo}>
                  <View style={estilos.avatar}><IconeMapa size={16} color={COR} /></View>
                  <View style={estilos.flex}><Text style={estilos.nome}>{a.codigo}</Text><Text style={estilos.nota}>{a.cobrador} · {a.zona}</Text></View>
                  <View style={estilos.ver}><IconeOlho size={16} color={COR} /></View>
                </View>
                <View style={estilos.linha}><IconeNascer size={14} color={COR} /><Text style={estilos.metaTexto}>{a.data} · {a.inicio}</Text></View>
                <View style={estilos.linha}><IconeMoeda size={14} color="#0f766e" /><Text style={estilos.metaTexto}>{mt(a.esperado)} esperado · {mt(a.cobrado)} cobrado</Text></View>
                <Etiqueta texto={a.estado} cor={corEstado(a.estado)} />
              </Pressable>
              {a.estado === "Pendente" ? <Botao Icone={IconeMapa} texto="Iniciar rota" onPress={() => mudarAgenda(a.id, "Em Curso")} /> : null}
              {a.estado === "Em Curso" ? <Botao Icone={IconeEscudo} texto="Concluir rota" onPress={() => mudarAgenda(a.id, "Concluída")} /> : null}
            </View>
          </Entrada>
        ))}
        <View style={estilos.paginas}>
          <Pressable disabled={actual <= 1} onPress={() => setPagina(actual - 1)}><Text style={estilos.link}>Anterior</Text></Pressable>
          <Text style={estilos.link}>{actual} / {paginas}</Text>
          <Pressable disabled={actual >= paginas} onPress={() => setPagina(actual + 1)}><Text style={estilos.link}>Seguinte</Text></Pressable>
        </View>
      </ScrollView>
      <PainelFiltro visivel={menu} titulo="Estado da agenda" opcoes={[["Todos", IconeEscudo], ["Pendente", IconeNascer], ["Em Curso", IconeMapa], ["Concluída", IconeEscudo], ["Cancelada", IconeFechar]]} actual={estado || "Todos"} Icone={IconeEscudo} onFechar={() => setMenu(false)} onEscolher={(op) => { setEstado(op === "Todos" ? "" : op); setPagina(1); setMenu(false); }} />
    </View>
  );
};

const Historico = ({ onVoltar }) => {
  const { cobrancas } = usarDados();
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [menu, setMenu] = useState(false);
  const [ficha, setFicha] = useState(null);
  const lista = cobrancas || [];
  const visiveis = lista.filter((i) => (!estado || i.estado === estado) && `${i.cliente} ${i.contrato} ${i.cobrador} ${i.zona}`.toLowerCase().includes(busca.trim().toLowerCase()));
  if (ficha) {
    return (
      <Talao titulo={ficha.cliente} valor={mt(ficha.cobrado)} estado={ficha.estado} onVoltar={() => setFicha(null)}
        blocos={<><Bloco Icone={IconeMoeda} fundo="#e0f2fe" cor={COR} rotulo="Esperado" valor={mt(ficha.esperado)} /><Bloco Icone={IconeEscudo} fundo="#d1fae5" cor="#0f766e" rotulo="Cobrado" valor={mt(ficha.cobrado)} /></>}
        linhas={[
          [IconeNascer, COR, "Data", ficha.data],
          [IconeDocumento, "#14532d", "Contrato", `${ficha.contrato} · ${ficha.parcela}`],
          [IconePessoa, "#1d4ed8", "Cobrador", ficha.cobrador],
          [IconePin, "#0f766e", "Zona", ficha.zona],
        ]}
      />
    );
  }
  const cobrado = visiveis.reduce((s, i) => s + Number(i.cobrado || 0), 0);
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Histórico" sub={`${lista.length} cobranças registadas`} Icone={IconeDocumento} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        <View style={estilos.grelha}>
          {[
            [IconeDocumento, COR, "Registos", String(visiveis.length)],
            [IconeMoeda, "#1d4ed8", "Esperado", mt(visiveis.reduce((s, i) => s + Number(i.esperado || 0), 0))],
            [IconeEscudo, "#0f766e", "Cobrado", mt(cobrado)],
            [IconePercentagem, "#b45309", "Comissão", mt(Math.round(cobrado * 0.08))],
          ].map(([Icone, cor, rotulo, valor], i) => <Entrada key={rotulo} atraso={i * 40} style={estilos.meio}><Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} /></Entrada>)}
        </View>
        <View style={estilos.painel}>
          <View style={estilos.busca}><IconeLupa size={16} color={COR} /><TextInput value={busca} onChangeText={setBusca} placeholder="Cliente, contrato, cobrador ou zona" placeholderTextColor={cores.placeholder} style={estilos.buscaInput} /></View>
          <Pressable style={estilos.filtroCartao} onPress={() => setMenu(true)}>
            <View style={estilos.filtroIcone}><IconeEscudo size={18} color={COR} /></View>
            <Text style={estilos.filtroRotulo}>Estado</Text>
            <Text style={estilos.filtroValor}>{estado || "Todos"}</Text>
          </Pressable>
        </View>
        {visiveis.map((i, n) => (
          <Entrada key={i.id} atraso={n * 35}>
            <Pressable style={estilos.cartao} onPress={() => setFicha(i)}>
              <View style={estilos.cartaoTopo}>
                <View style={estilos.avatar}><IconePessoa size={16} color={COR} /></View>
                <View style={estilos.flex}><Text style={estilos.nome}>{i.cliente}</Text><Text style={estilos.nota}>{i.contrato} · {i.cobrador}</Text></View>
                <IconeOlho size={16} color={COR} />
              </View>
              <View style={estilos.linha}><IconeNascer size={14} color={COR} /><Text style={estilos.metaTexto}>{i.data} · {i.zona}</Text></View>
              <View style={estilos.linha}><IconeMoeda size={14} color="#0f766e" /><Text style={estilos.metaTexto}>{mt(i.cobrado)} de {mt(i.esperado)}</Text></View>
              <Etiqueta texto={i.estado} cor={corEstado(i.estado)} />
            </Pressable>
          </Entrada>
        ))}
      </ScrollView>
      <PainelFiltro visivel={menu} titulo="Estado da cobrança" opcoes={[["Todos", IconeEscudo], ["Cobrado", IconeMoeda], ["Parcial", IconePercentagem], ["Promessa", IconeNascer], ["Não cobrado", IconeAlerta]]} actual={estado || "Todos"} Icone={IconeEscudo} onFechar={() => setMenu(false)} onEscolher={(op) => { setEstado(op === "Todos" ? "" : op); setMenu(false); }} />
    </View>
  );
};

const Rota = ({ onVoltar }) => {
  const { agendas, zonas } = usarDados();
  const dia = hoje();
  const rotas = agendas.filter((a) => a.data === dia && a.estado !== "Cancelada");
  const [aviso, setAviso] = useState("");
  const [ficha, setFicha] = useState(null);
  if (ficha) return <DetalheAgenda agendaId={ficha} onVoltar={() => setFicha(null)} />;
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Rota" sub={dia} Icone={IconeMapa} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        <View style={estilos.grelha}>
          {[
            [IconeMapa, COR, "Rotas de hoje", String(rotas.length)],
            [IconeMoeda, "#1d4ed8", "Esperado", mt(rotas.reduce((s, a) => s + Number(a.esperado || 0), 0))],
            [IconeEscudo, "#0f766e", "Cobrado", mt(rotas.reduce((s, a) => s + Number(a.cobrado || 0), 0))],
          ].map(([Icone, cor, rotulo, valor], i) => <Entrada key={rotulo} atraso={i * 40} style={estilos.terco}><Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} /></Entrada>)}
        </View>
        <View style={estilos.painel}>
          <AoVivo />
          <View style={estilos.mapaCaixa}><Mapa pontos={pontosZona(zonas)} altura={ALTURA_MAPA} aoVivo /></View>
        </View>
        {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
        <Botao Icone={IconeEstrela} texto="Gerar rotas do dia" onPress={() => setAviso(gerarRotaDoDia() ? "Rota gerada." : "A rota de hoje já está na agenda.")} />
        {rotas.map((a, i) => (
          <Entrada key={a.id} atraso={i * 40}>
            <Pressable style={estilos.cartao} onPress={() => setFicha(a.id)}>
              <View style={estilos.cartaoTopo}>
                <View style={estilos.avatar}><IconeMapa size={16} color={COR} /></View>
                <View style={estilos.flex}><Text style={estilos.nome}>{a.codigo}</Text><Text style={estilos.nota}>{a.zona} · {a.cobrador}</Text></View>
                <IconeOlho size={16} color={COR} />
              </View>
              <View style={estilos.linha}><IconeEquipa size={14} color={COR} /><Text style={estilos.metaTexto}>{(a.clientes || []).join(", ") || "Sem clientes"}</Text></View>
              <Etiqueta texto={a.estado} cor={corEstado(a.estado)} />
            </Pressable>
          </Entrada>
        ))}
      </ScrollView>
    </View>
  );
};

const Zonas = ({ onVoltar }) => {
  const { zonas } = usarDados();
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [menu, setMenu] = useState(false);
  const [ficha, setFicha] = useState(null);
  const visiveis = zonas.filter((z) => (!estado || z.estado === estado) && `${z.nome} ${z.codigo} ${z.bairro} ${z.responsavel}`.toLowerCase().includes(busca.trim().toLowerCase()));
  if (ficha) {
    return (
      <Talao titulo={ficha.nome} valor={mt(ficha.atraso)} estado={ficha.estado} onVoltar={() => setFicha(null)}
        blocos={<><Bloco Icone={IconeEquipa} fundo="#e0f2fe" cor={COR} rotulo="Clientes" valor={String(ficha.clientes || 0)} /><Bloco Icone={IconePin} fundo="#fef3c7" cor="#b45309" rotulo="Raio" valor={`${ficha.raio} km`} /></>}
        linhas={[
          [IconeDocumento, COR, "Código", ficha.codigo],
          [IconePin, "#0f766e", "Província", `${ficha.provincia} · ${ficha.distrito}`],
          [IconeMapa, "#1d4ed8", "Bairro", ficha.bairro],
          [IconePessoa, "#7c3aed", "Responsável", ficha.responsavel],
        ]}
      />
    );
  }
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Zonas" sub={`${zonas.length} territórios`} Icone={IconePin} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        <View style={estilos.grelha}>
          {[
            [IconePin, COR, "Zonas", String(zonas.length)],
            [IconeEscudo, "#0f766e", "Activas", String(zonas.filter((z) => z.estado === "Ativa").length)],
            [IconeEquipa, "#1d4ed8", "Clientes", String(zonas.reduce((s, z) => s + Number(z.clientes || 0), 0))],
            [IconeAlerta, "#9b2c2c", "Em atraso", mt(zonas.reduce((s, z) => s + Number(z.atraso || 0), 0))],
          ].map(([Icone, cor, rotulo, valor], i) => <Entrada key={rotulo} atraso={i * 40} style={estilos.meio}><Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} /></Entrada>)}
        </View>
        <View style={estilos.painel}><AoVivo /><View style={estilos.mapaCaixa}><Mapa pontos={pontosZona(visiveis)} altura={ALTURA_MAPA} aoVivo /></View></View>
        <View style={estilos.painel}>
          <View style={estilos.busca}><IconeLupa size={16} color={COR} /><TextInput value={busca} onChangeText={setBusca} placeholder="Zona, código, bairro ou responsável" placeholderTextColor={cores.placeholder} style={estilos.buscaInput} /></View>
          <Pressable style={estilos.filtroCartao} onPress={() => setMenu(true)}><View style={estilos.filtroIcone}><IconeEscudo size={18} color={COR} /></View><Text style={estilos.filtroRotulo}>Estado</Text><Text style={estilos.filtroValor}>{estado || "Todos"}</Text></Pressable>
        </View>
        {visiveis.map((z, i) => (
          <Entrada key={z.id} atraso={i * 40}>
            <Pressable style={estilos.cartao} onPress={() => setFicha(z)}>
              <View style={estilos.cartaoTopo}><View style={estilos.avatar}><IconePin size={16} color={COR} /></View><View style={estilos.flex}><Text style={estilos.nome}>{z.nome}</Text><Text style={estilos.nota}>{z.codigo} · {z.provincia}</Text></View><IconeOlho size={16} color={COR} /></View>
              <View style={estilos.linha}><IconePessoa size={14} color="#1d4ed8" /><Text style={estilos.metaTexto}>{z.responsavel}</Text></View>
              <Etiqueta texto={z.estado} cor={corEstado(z.estado)} />
            </Pressable>
          </Entrada>
        ))}
      </ScrollView>
      <PainelFiltro visivel={menu} titulo="Estado da zona" opcoes={[["Todos", IconePin], ["Ativa", IconeEscudo], ["Inativa", IconeFechar]]} actual={estado || "Todos"} Icone={IconePin} onFechar={() => setMenu(false)} onEscolher={(op) => { setEstado(op === "Todos" ? "" : op); setMenu(false); }} />
    </View>
  );
};

const Cobradores = ({ onVoltar }) => {
  const { cobradores, zonas } = usarDados();
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [menu, setMenu] = useState(false);
  const [ficha, setFicha] = useState(null);
  const visiveis = cobradores.filter((c) => (!estado || c.estado === estado) && `${c.nome} ${c.telefone} ${c.zona}`.toLowerCase().includes(busca.trim().toLowerCase()));
  const pontos = visiveis.map((c) => {
    const zona = zonas.find((z) => z.nome === c.zona);
    return zona ? { lat: zona.lat, lon: zona.lon, titulo: c.nome, texto: zona.nome, raio: Number(zona.raio) || 0, cor: c.estado === "Activo" ? "#0369a1" : "#64748b" } : null;
  }).filter(Boolean);
  if (ficha) {
    return (
      <Talao titulo={ficha.nome} valor={mt(ficha.cobradoMes)} estado={ficha.estado} onVoltar={() => setFicha(null)}
        blocos={<><Bloco Icone={IconePercentagem} fundo="#e0f2fe" cor={COR} rotulo="Comissão" valor={`${ficha.comissao}%`} /><Bloco Icone={IconeMoeda} fundo="#d1fae5" cor="#0f766e" rotulo="Do mês" valor={mt(Math.round(Number(ficha.cobradoMes || 0) * Number(ficha.comissao || 0) / 100))} /></>}
        linhas={[
          [IconeDocumento, COR, "Documento", ficha.documento],
          [IconeTelefone, "#0f766e", "Telefone", ficha.telefone],
          [IconePin, "#1d4ed8", "Zona", ficha.zona],
        ]}
      />
    );
  }
  return (
    <View style={estilos.ecra}>
      <Cabeca titulo="Cobradores" sub={`${cobradores.length} na equipa`} Icone={IconeEquipa} onVoltar={onVoltar} voltar="Módulos" />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo}>
        <View style={estilos.grelha}>
          {[
            [IconeEquipa, COR, "Equipa", String(cobradores.length)],
            [IconeEscudo, "#0f766e", "Activos", String(cobradores.filter((c) => c.estado === "Activo").length)],
            [IconeMoeda, "#1d4ed8", "Cobrado no mês", mt(cobradores.reduce((s, c) => s + Number(c.cobradoMes || 0), 0))],
            [IconePercentagem, "#b45309", "Comissões", mt(cobradores.reduce((s, c) => s + Math.round(Number(c.cobradoMes || 0) * Number(c.comissao || 0) / 100), 0))],
          ].map(([Icone, cor, rotulo, valor], i) => <Entrada key={rotulo} atraso={i * 40} style={estilos.meio}><Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} /></Entrada>)}
        </View>
        <View style={estilos.painel}><AoVivo /><View style={estilos.mapaCaixa}><Mapa pontos={pontos} altura={ALTURA_MAPA} aoVivo /></View></View>
        <View style={estilos.painel}>
          <View style={estilos.busca}><IconeLupa size={16} color={COR} /><TextInput value={busca} onChangeText={setBusca} placeholder="Nome, telefone ou zona" placeholderTextColor={cores.placeholder} style={estilos.buscaInput} /></View>
          <Pressable style={estilos.filtroCartao} onPress={() => setMenu(true)}><View style={estilos.filtroIcone}><IconeEscudo size={18} color={COR} /></View><Text style={estilos.filtroRotulo}>Estado</Text><Text style={estilos.filtroValor}>{estado || "Todos"}</Text></Pressable>
        </View>
        {visiveis.map((c, i) => (
          <Entrada key={c.id} atraso={i * 40}>
            <Pressable style={estilos.cartao} onPress={() => setFicha(c)}>
              <View style={estilos.cartaoTopo}><View style={estilos.avatar}><IconeEquipa size={16} color={COR} /></View><View style={estilos.flex}><Text style={estilos.nome}>{c.nome}</Text><Text style={estilos.nota}>{c.zona} · {c.telefone}</Text></View><IconeOlho size={16} color={COR} /></View>
              <View style={estilos.linha}><IconeMoeda size={14} color="#0f766e" /><Text style={estilos.metaTexto}>{mt(c.cobradoMes)} · {c.comissao}% comissão</Text></View>
              <Etiqueta texto={c.estado} cor={corEstado(c.estado)} />
            </Pressable>
          </Entrada>
        ))}
      </ScrollView>
      <PainelFiltro visivel={menu} titulo="Estado do cobrador" opcoes={[["Todos", IconeEquipa], ["Activo", IconeEscudo], ["Inactivo", IconePessoa]]} actual={estado || "Todos"} Icone={IconeEquipa} onFechar={() => setMenu(false)} onEscolher={(op) => { setEstado(op === "Todos" ? "" : op); setMenu(false); }} />
    </View>
  );
};

const Cobrancas = ({ modo, onVoltar }) => {
  if (modo === "historico") return <Historico onVoltar={onVoltar} />;
  if (modo === "rota") return <Rota onVoltar={onVoltar} />;
  if (modo === "zonas") return <Zonas onVoltar={onVoltar} />;
  if (modo === "cobradores") return <Cobradores onVoltar={onVoltar} />;
  return <Agenda onVoltar={onVoltar} />;
};

const estilos = StyleSheet.create({
  ecra: { flex: 1, backgroundColor: FUNDO },
  scroll: { flex: 1 },
  corpo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, gap: 10 },
  flex: { flex: 1 },
  cabeca: { overflow: "hidden", backgroundColor: COR, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 58, minHeight: 150 },
  onda: { position: "absolute", width: 220, height: 90, borderRadius: 80, backgroundColor: "#38bdf8", left: -30, bottom: -36, opacity: 0.55 },
  onda2: { position: "absolute", width: 180, height: 70, borderRadius: 70, backgroundColor: FUNDO, right: -20, bottom: -40 },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  voltarTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "700" },
  cabecaLinha: { flexDirection: "row", alignItems: "center", gap: 12 },
  cabecaIcone: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  cabecaTitulo: { color: "#ffffff", fontFamily: fonte, fontSize: 24, fontWeight: "800" },
  cabecaSub: { color: "rgba(255,255,255,0.9)", fontFamily: fonte, marginTop: 2 },
  grelha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  meio: { width: "48%" },
  terco: { width: "31%" },
  stat: { backgroundColor: cores.branco, borderRadius: 18, padding: 12, gap: 4, minHeight: 92 },
  statIcone: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  statValor: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, fontSize: 15 },
  statRotulo: { fontFamily: fonte, color: cores.texto, fontSize: 11 },
  painel: { backgroundColor: cores.branco, borderRadius: 20, padding: 14, gap: 10 },
  busca: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: FUNDO, borderRadius: 16, paddingHorizontal: 12 },
  buscaInput: { flex: 1, fontFamily: fonte, color: cores.titulo, paddingVertical: 12 },
  filtroCartao: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: FUNDO, borderRadius: 18, padding: 12 },
  filtroIcone: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center" },
  filtroRotulo: { fontFamily: fonte, color: "#8d9390", fontSize: 12, fontWeight: "700" },
  filtroValor: { flex: 1, textAlign: "right", fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  cartao: { backgroundColor: cores.branco, borderRadius: 18, padding: 14, gap: 8 },
  cartaoTopo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 16, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center" },
  nome: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  nota: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  ver: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center" },
  linha: { flexDirection: "row", alignItems: "center", gap: 10 },
  metaTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 13 },
  etiqueta: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  etiquetaTexto: { fontFamily: fonte, fontSize: 11, fontWeight: "800" },
  acao: { alignSelf: "flex-start", backgroundColor: COR, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  acaoTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "800", fontSize: 12 },
  accoes: { gap: 10 },
  botaoLargo: { flexDirection: "row", alignItems: "center", gap: 14, alignSelf: "stretch", backgroundColor: COR, borderRadius: 18, minHeight: 58, paddingVertical: 12, paddingHorizontal: 16 },
  botaoLargoClaro: { backgroundColor: "#e0f2fe" },
  botaoLargoIcone: { width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  botaoLargoIconeClaro: { backgroundColor: "#ffffff" },
  botaoLargoTexto: { flex: 1, color: "#ffffff", fontFamily: fonte, fontWeight: "800", fontSize: 15 },
  botaoLargoTextoClaro: { color: COR },
  folhaTopo: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  folhaSelo: { width: 44, height: 44, borderRadius: 16, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center" },
  botaoClaro: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#e0f2fe", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  botaoClaroTexto: { color: COR, fontFamily: fonte, fontWeight: "800", fontSize: 12 },
  ordem: { width: 36, height: 36, borderRadius: 18, backgroundColor: COR, alignItems: "center", justifyContent: "center" },
  ordemTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "800" },
  campo: { backgroundColor: FUNDO, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonte, color: cores.titulo, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: FUNDO, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: COR },
  chipTexto: { fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 12 },
  botao: { backgroundColor: COR, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  botaoTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "800" },
  aviso: { fontFamily: fonte, color: COR, fontWeight: "800" },
  paginas: { flexDirection: "row", justifyContent: "space-between", backgroundColor: cores.branco, borderRadius: 14, padding: 12 },
  link: { fontFamily: fonte, color: COR, fontWeight: "800" },
  mapaCaixa: { borderRadius: 18, overflow: "hidden" },
  vivo: { flexDirection: "row", alignItems: "center", gap: 8 },
  vivoPonto: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#0284c7" },
  vivoTexto: { fontFamily: fonte, color: COR, fontWeight: "800" },
  talao: { backgroundColor: cores.branco, borderRadius: 28, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 12, overflow: "hidden" },
  furoEsq: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: FUNDO, left: -14, top: 168 },
  furoDir: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: FUNDO, right: -14, top: 168 },
  talaoHero: { alignItems: "center", gap: 6, paddingBottom: 18 },
  talaoSelo: { width: 56, height: 56, borderRadius: 20, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  talaoLegenda: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  talaoValor: { fontFamily: fonte, color: COR, fontSize: 32, fontWeight: "800" },
  talaoEstado: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: 6 },
  talaoEstadoTexto: { fontFamily: fonte, fontWeight: "800", fontSize: 13 },
  picotes: { height: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: "#bae6fd", marginBottom: 16 },
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
  vela: { flex: 1, backgroundColor: "rgba(15, 23, 20, 0.48)", justifyContent: "flex-end" },
  folha: { backgroundColor: cores.branco, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, maxHeight: "78%" },
  puxador: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#dbeafe", alignSelf: "center", marginBottom: 8 },
  folhaTitulo: { fontFamily: fonte, color: cores.titulo, fontSize: 18, fontWeight: "800", marginBottom: 8 },
  folhaLista: { marginTop: 4 },
  opcaoFolha: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: FUNDO, borderRadius: 18, padding: 12, marginBottom: 8 },
  opcaoFolhaOn: { backgroundColor: COR },
  opcaoFolhaIcone: { width: 44, height: 44, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  opcaoFolhaTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 15 },
  opcaoMarca: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: "#bae6fd", alignItems: "center", justifyContent: "center" },
  opcaoMarcaOn: { backgroundColor: "#ffffff", borderColor: "#ffffff" },
  claro: { color: "#ffffff" },
  check: { color: COR, fontWeight: "800" },
});

export default Cobrancas;
