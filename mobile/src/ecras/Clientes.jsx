import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  IconeAlerta, IconeDocumento, IconeEdificio, IconeEquipa, IconeEscudo, IconeGrafico,
  IconeLupa, IconeMapa, IconeOlho, IconePessoa, IconePin, IconeTelefone, IconeVoltar,
} from "../componentes/Icones";
import { CAMINHOS } from "../dados/mapaProvincias";
import { LOCALIDADES } from "../dados/localidades";
import { usarDados } from "../dados/operacao";
import { cores, fonte } from "../tema";

const FUNDO = "#f4f8f5";
const POR_PAGINA = 5;
const NOMES = CAMINHOS.map((item) => item.nome).sort((a, b) => b.length - a.length);
const SCORE = { A: 900, B: 700, C: 500, D: 200 };

const scoreDe = (cliente) => Number(cliente.score) || SCORE[cliente.perfil_risco] || 0;
const corPerfil = (perfil) => ({ A: "#14924a", B: "#1d4ed8", C: "#b45309", D: "#9b2c2c" })[perfil] || "#5f6662";
const corScore = (score) => {
  if (score >= 800) return "#14924a";
  if (score >= 600) return "#1d4ed8";
  if (score >= 400) return "#b45309";
  return "#9b2c2c";
};
const mt = (valor) => `${Number(valor || 0).toLocaleString("pt-PT")} MT`;
const provinciaDo = (cliente) => NOMES.find((nome) => String(cliente.provincia || "").toLowerCase().includes(nome.toLowerCase()));

const Entrada = ({ atraso = 0, children, style }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: 480,
      delay: atraso,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [atraso, v]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const Cabeca = ({ titulo, sub, Icone, cor, cor2, onVoltar, voltar }) => {
  const sobe = useRef(new Animated.Value(0)).current;
  const deriva = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sobe, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(deriva, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(deriva, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [deriva, sobe]);
  const dx = deriva.interpolate({ inputRange: [0, 1], outputRange: [-18, 22] });
  return (
    <Animated.View
      style={[
        estilos.cabeca,
        {
          backgroundColor: cor,
          opacity: sobe,
          transform: [{ translateY: sobe.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }) }],
        },
      ]}
    >
      <Animated.View style={[estilos.corteLargo, { backgroundColor: cor2, transform: [{ rotate: "22deg" }, { translateX: dx }] }]} />
      <View style={estilos.corteClaro} />
      <View style={estilos.corteFino} />
      <View style={estilos.bico} />
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
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [pulso]);
  return (
    <View style={estilos.stat}>
      <Animated.View style={[estilos.statIcone, { backgroundColor: `${cor}18`, transform: [{ scale: pulso }] }]}>
        <Icone size={16} color={cor} />
      </Animated.View>
      <Text style={estilos.statValor}>{valor}</Text>
      <Text style={estilos.statRotulo} numberOfLines={1}>{rotulo}</Text>
    </View>
  );
};

const Etiqueta = ({ Icone, texto, cor }) => (
  <View style={[estilos.etiqueta, { backgroundColor: `${cor}16` }]}>
    <Icone size={12} color={cor} />
    <Text style={[estilos.etiquetaTexto, { color: cor }]}>{texto}</Text>
  </View>
);

const Barra = ({ pct, cor }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 720, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct, v]);
  return (
    <View style={estilos.barra}>
      <Animated.View
        style={[
          estilos.barraCheia,
          {
            backgroundColor: cor,
            width: v.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${Math.max(pct, 6)}%`] }),
          },
        ]}
      />
    </View>
  );
};

const Titulo = ({ Icone, cor, texto, nota }) => (
  <View style={estilos.tituloLinha}>
    <View style={[estilos.tituloIcone, { backgroundColor: `${cor}18` }]}><Icone size={15} color={cor} /></View>
    <Text style={estilos.titulo}>{texto}</Text>
    {nota ? <Text style={estilos.tituloNota}>{nota}</Text> : null}
  </View>
);

const Ficha = ({ cliente, onVoltar }) => {
  const fisica = cliente.tipo_cliente === "Pessoa Física";
  const score = scoreDe(cliente);
  const grupos = [
    {
      titulo: "Identificação",
      Icone: IconeDocumento,
      cor: "#1d4ed8",
      itens: [
        ["Documento", `${cliente.documento_tipo || ""} ${cliente.documento_numero || ""}`.trim()],
        ["NUIT", cliente.nuit],
        ["Tipo", cliente.tipo_cliente],
      ],
    },
    {
      titulo: "Contacto",
      Icone: IconeTelefone,
      cor: "#0f766e",
      itens: [
        ["Telefone", cliente.telefone_principal],
        ["Email", cliente.email],
      ],
    },
    {
      titulo: "Local",
      Icone: IconePin,
      cor: "#0369a1",
      itens: [
        ["Província", cliente.provincia],
        ["Cidade", cliente.cidade],
        ["Bairro", cliente.bairro],
        ["Zona", cliente.zona_id],
        ["Endereço", cliente.endereco_completo],
        ["GPS", cliente.coordenadas_gps],
      ],
    },
    {
      titulo: "Crédito",
      Icone: IconeGrafico,
      cor: "#9a3412",
      itens: [
        ["Limite", mt(cliente.limite_credito)],
        ["Perfil", cliente.perfil_risco],
        ["Score", String(score)],
        ["Estado", cliente.cliente_ativo ? "Activo" : "Inactivo"],
      ],
    },
  ];
  return (
    <View style={estilos.ecra}>
      <Cabeca
        titulo={cliente.nome_completo}
        sub={cliente.tipo_cliente}
        Icone={fisica ? IconePessoa : IconeEdificio}
        cor={fisica ? "#1d4ed8" : "#0f766e"}
        cor2={fisica ? "#60a5fa" : "#5eead4"}
        onVoltar={onVoltar}
        voltar="Lista"
      />
      <ScrollView contentContainerStyle={estilos.corpo} showsVerticalScrollIndicator={false}>
        <View style={estilos.linhaEtiquetas}>
          <Etiqueta Icone={fisica ? IconePessoa : IconeEdificio} texto={cliente.tipo_cliente} cor={fisica ? "#1d4ed8" : "#0f766e"} />
          <Etiqueta Icone={cliente.cliente_ativo ? IconeEscudo : IconeAlerta} texto={cliente.cliente_ativo ? "Activo" : "Inactivo"} cor={cliente.cliente_ativo ? "#14924a" : "#b45309"} />
          <Etiqueta Icone={IconeEscudo} texto={`Perfil ${cliente.perfil_risco || "—"}`} cor={corPerfil(cliente.perfil_risco)} />
          <Etiqueta Icone={IconeGrafico} texto={`Score ${score}`} cor={corScore(score)} />
        </View>
        {grupos.map((grupo, indice) => (
          <Entrada key={grupo.titulo} atraso={indice * 70}>
            <View style={estilos.painel}>
              <Titulo Icone={grupo.Icone} cor={grupo.cor} texto={grupo.titulo} />
              {grupo.itens.map(([rotulo, valor]) => (
                <View key={rotulo} style={estilos.info}>
                  <Text style={estilos.infoRotulo}>{rotulo}</Text>
                  <Text style={estilos.infoValor}>{valor || "—"}</Text>
                </View>
              ))}
            </View>
          </Entrada>
        ))}
      </ScrollView>
    </View>
  );
};

const Opcoes = ({ actual, opcoes, rotulos, onEscolher }) => (
  <View style={estilos.opcoes}>
    {opcoes.map((opcao, indice) => (
      <Pressable key={`${opcao}-${indice}`} style={[estilos.opcao, actual === opcao && estilos.opcaoActiva]} onPress={() => onEscolher(opcao)}>
        <Text style={[estilos.opcaoTexto, actual === opcao && estilos.opcaoTextoActiva]}>{rotulos[indice]}</Text>
      </Pressable>
    ))}
  </View>
);

const ListaClientes = ({ onVoltar }) => {
  const { clientes } = usarDados();
  const [ficha, setFicha] = useState(null);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [provincia, setProvincia] = useState("");
  const [cidade, setCidade] = useState("");
  const [menu, setMenu] = useState(null);
  const [pagina, setPagina] = useState(1);

  const visiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return clientes.filter((cliente) => {
      if (tipo && cliente.tipo_cliente !== tipo) return false;
      if (estado === "activo" && !cliente.cliente_ativo) return false;
      if (estado === "inactivo" && cliente.cliente_ativo) return false;
      if (provincia && cliente.provincia !== provincia) return false;
      if (cidade && cliente.cidade !== cidade) return false;
      if (!texto) return true;
      return [cliente.nome_completo, cliente.documento_numero, cliente.telefone_principal, cliente.cidade, cliente.nuit, cliente.provincia]
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [busca, cidade, clientes, estado, provincia, tipo]);

  const activos = clientes.filter((cliente) => cliente.cliente_ativo).length;
  const fisicos = clientes.filter((cliente) => cliente.tipo_cliente === "Pessoa Física").length;
  const scoreMedio = clientes.length ? Math.round(clientes.reduce((soma, cliente) => soma + scoreDe(cliente), 0) / clientes.length) : 0;
  const paginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const paginaItens = visiveis.slice(inicio, inicio + POR_PAGINA);
  const cidades = provincia
    ? (LOCALIDADES.find((item) => item.provincia === provincia)?.cidades || []).map((item) => item.nome)
    : [];
  const filtrosActivos = Boolean(busca || tipo || estado || provincia || cidade);
  const numeros = [
    [IconeEquipa, "#1d4ed8", "Total", String(clientes.length)],
    [IconeEscudo, "#14924a", "Activos", String(activos)],
    [IconeAlerta, "#b45309", "Inactivos", String(clientes.length - activos)],
    [IconePessoa, "#0f766e", "Físicos", String(fisicos)],
    [IconeEdificio, "#7c3aed", "Empresas", String(clientes.length - fisicos)],
    [IconeGrafico, "#9a3412", "Score médio", String(scoreMedio)],
  ];

  const escolher = (setter, valor) => {
    setter(valor);
    setPagina(1);
    setMenu(null);
  };

  const partilhar = () => {
    const linhas = visiveis.map((cliente) => `${cliente.nome_completo} | ${cliente.documento_tipo} ${cliente.documento_numero} | ${cliente.telefone_principal} | ${cliente.cidade} | perfil ${cliente.perfil_risco} | score ${scoreDe(cliente)}`);
    Share.share({ message: `Clientes do microcrédito (${visiveis.length})\n${linhas.join("\n")}` });
  };

  if (ficha) return <Ficha cliente={ficha} onVoltar={() => setFicha(null)} />;

  return (
    <View style={estilos.ecra}>
      <Cabeca
        titulo="Listar clientes"
        sub={`${clientes.length} clientes no microcrédito`}
        Icone={IconeEquipa}
        cor="#1d4ed8"
        cor2="#60a5fa"
        onVoltar={onVoltar}
        voltar="Módulos"
      />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={estilos.grelha}>
          {numeros.map(([Icone, cor, rotulo, valor], indice) => (
            <Entrada key={rotulo} atraso={40 + indice * 55} style={estilos.statMeio}>
              <Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} />
            </Entrada>
          ))}
        </View>

        <Entrada atraso={180}>
          <View style={estilos.painel}>
            <Titulo Icone={IconeLupa} cor={cores.verde} texto="Encontrar" nota={filtrosActivos ? "filtros activos" : "todos"} />
            <View style={estilos.busca}>
              <IconeLupa size={16} color={cores.verde} />
              <TextInput
                value={busca}
                onChangeText={(valor) => { setBusca(valor); setPagina(1); }}
                placeholder="Nome, documento, telefone ou cidade"
                placeholderTextColor={cores.placeholder}
                style={estilos.buscaInput}
              />
            </View>
            <View style={estilos.filtros}>
              {[
                ["tipo", IconeEdificio, "Tipo", tipo || "Todos"],
                ["estado", IconeEscudo, "Estado", estado === "activo" ? "Activo" : estado === "inactivo" ? "Inactivo" : "Todos"],
                ["provincia", IconeMapa, "Província", provincia || "Todas"],
                ["cidade", IconePin, "Cidade", cidade || "Todas"],
              ].map(([id, Icone, rotulo, texto]) => (
                <Pressable key={id} style={[estilos.filtro, menu === id && estilos.filtroAberto]} onPress={() => setMenu(menu === id ? null : id)}>
                  <Icone size={14} color={menu === id ? "#ffffff" : cores.verdeEscuro} />
                  <Text style={[estilos.filtroRotulo, menu === id && estilos.filtroClaro]}>{rotulo}</Text>
                  <Text style={[estilos.filtroValor, menu === id && estilos.filtroClaro]} numberOfLines={1}>{texto}</Text>
                </Pressable>
              ))}
            </View>
            {menu === "tipo" ? <Opcoes actual={tipo} opcoes={["", "Pessoa Física", "Pessoa Jurídica"]} rotulos={["Todos", "Pessoa Física", "Pessoa Jurídica"]} onEscolher={(valor) => escolher(setTipo, valor)} /> : null}
            {menu === "estado" ? <Opcoes actual={estado} opcoes={["", "activo", "inactivo"]} rotulos={["Todos", "Activo", "Inactivo"]} onEscolher={(valor) => escolher(setEstado, valor)} /> : null}
            {menu === "provincia" ? (
              <Opcoes
                actual={provincia}
                opcoes={["", ...LOCALIDADES.map((item) => item.provincia)]}
                rotulos={["Todas", ...LOCALIDADES.map((item) => item.provincia)]}
                onEscolher={(valor) => { setProvincia(valor); setCidade(""); setPagina(1); setMenu(null); }}
              />
            ) : null}
            {menu === "cidade" ? (
              provincia ? (
                <Opcoes actual={cidade} opcoes={["", ...cidades]} rotulos={["Todas", ...cidades]} onEscolher={(valor) => escolher(setCidade, valor)} />
              ) : <Text style={estilos.nota}>Escolha primeiro a província para ver as cidades.</Text>
            ) : null}
            <View style={estilos.accoes}>
              {filtrosActivos ? (
                <Pressable onPress={() => { setBusca(""); setTipo(""); setEstado(""); setProvincia(""); setCidade(""); setPagina(1); setMenu(null); }}>
                  <Text style={estilos.limpar}>Limpar filtros</Text>
                </Pressable>
              ) : <View />}
              <Pressable style={estilos.partilhar} onPress={partilhar}>
                <IconeDocumento size={15} color={cores.verdeEscuro} />
                <Text style={estilos.partilharTexto}>Partilhar</Text>
              </Pressable>
            </View>
          </View>
        </Entrada>

        <Titulo Icone={IconeEquipa} cor="#1d4ed8" texto="Carteira" nota={`${visiveis.length} visíveis`} />
        {paginaItens.length === 0 ? (
          <View style={estilos.vazio}>
            <IconeEquipa size={28} color={cores.verde} />
            <Text style={estilos.vazioTitulo}>{clientes.length === 0 ? "Ainda não há clientes." : "Nenhum cliente encontrado."}</Text>
            <Text style={estilos.nota}>{clientes.length === 0 ? "A carteira está vazia." : "Ajuste os filtros ou a pesquisa."}</Text>
          </View>
        ) : paginaItens.map((cliente, indice) => {
          const score = scoreDe(cliente);
          const fisica = cliente.tipo_cliente === "Pessoa Física";
          return (
            <Entrada key={`${paginaActual}-${cliente.id}`} atraso={indice * 55}>
              <Pressable style={estilos.cartao} onPress={() => setFicha(cliente)}>
                <View style={estilos.cartaoTopo}>
                  <View style={[estilos.avatar, { backgroundColor: fisica ? "#dbeafe" : "#ccfbf1" }]}>
                    {fisica ? <IconePessoa size={18} color="#1d4ed8" /> : <IconeEdificio size={18} color="#0f766e" />}
                  </View>
                  <View style={estilos.flex}>
                    <Text style={estilos.nome}>{cliente.nome_completo}</Text>
                    <Text style={estilos.nota}>{cliente.tipo_cliente}</Text>
                  </View>
                  <View style={estilos.ver}><IconeOlho size={16} color={cores.verdeEscuro} /></View>
                </View>
                <View style={estilos.duas}>
                  <View style={estilos.meta}><IconeDocumento size={14} color="#1d4ed8" /><Text style={estilos.metaTexto} numberOfLines={1}>{cliente.documento_numero}</Text></View>
                  <View style={estilos.meta}><IconeTelefone size={14} color="#0f766e" /><Text style={estilos.metaTexto}>{cliente.telefone_principal}</Text></View>
                  <View style={estilos.meta}><IconePin size={14} color="#0369a1" /><Text style={estilos.metaTexto} numberOfLines={1}>{cliente.cidade}</Text></View>
                  <View style={estilos.meta}><IconeGrafico size={14} color={corScore(score)} /><Text style={estilos.metaTexto}>Score {score}</Text></View>
                </View>
                <View style={estilos.linhaEtiquetas}>
                  <Etiqueta Icone={IconeEscudo} texto={`Perfil ${cliente.perfil_risco || "—"}`} cor={corPerfil(cliente.perfil_risco)} />
                  <Etiqueta Icone={cliente.cliente_ativo ? IconeEscudo : IconeAlerta} texto={cliente.cliente_ativo ? "Activo" : "Inactivo"} cor={cliente.cliente_ativo ? "#14924a" : "#b45309"} />
                </View>
              </Pressable>
            </Entrada>
          );
        })}
        {visiveis.length > 0 ? (
          <View style={estilos.paginacao}>
            <Text style={estilos.nota}>{inicio + 1}–{Math.min(inicio + POR_PAGINA, visiveis.length)} de {visiveis.length}</Text>
            <View style={estilos.paginas}>
              <Pressable disabled={paginaActual <= 1} onPress={() => setPagina(paginaActual - 1)}><Text style={[estilos.paginaTexto, paginaActual <= 1 && estilos.paginaOff]}>Anterior</Text></Pressable>
              <Text style={estilos.paginaTexto}>{paginaActual} / {paginas}</Text>
              <Pressable disabled={paginaActual >= paginas} onPress={() => setPagina(paginaActual + 1)}><Text style={[estilos.paginaTexto, paginaActual >= paginas && estilos.paginaOff]}>Seguinte</Text></Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const MapaClientes = ({ onVoltar }) => {
  const { clientes } = usarDados();
  const [activa, setActiva] = useState(null);
  const totais = useMemo(() => {
    const mapa = {};
    clientes.forEach((cliente) => {
      const nome = provinciaDo(cliente);
      if (nome) mapa[nome] = (mapa[nome] || 0) + 1;
    });
    return mapa;
  }, [clientes]);
  const max = Math.max(1, ...Object.values(totais), 1);
  const ranking = Object.entries(totais).sort((a, b) => b[1] - a[1]);
  const daProvincia = activa ? clientes.filter((cliente) => provinciaDo(cliente) === activa) : [];
  const comProvincia = Object.keys(totais).length;

  return (
    <View style={estilos.ecra}>
      <Cabeca
        titulo="Mapa de clientes"
        sub="Moçambique por província"
        Icone={IconeMapa}
        cor="#0369a1"
        cor2="#38bdf8"
        onVoltar={onVoltar}
        voltar="Módulos"
      />
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.corpo} showsVerticalScrollIndicator={false}>
        <View style={estilos.tres}>
          {[
            [IconeEquipa, "#1d4ed8", "Clientes", String(clientes.length)],
            [IconeMapa, "#0369a1", "Províncias", String(comProvincia)],
            [IconePin, "#14924a", ranking[0]?.[0] || "Maior", String(ranking[0]?.[1] || 0)],
          ].map(([Icone, cor, rotulo, valor], indice) => (
            <Entrada key={rotulo} atraso={indice * 70} style={estilos.flex}>
              <Estatistica Icone={Icone} cor={cor} rotulo={rotulo} valor={valor} />
            </Entrada>
          ))}
        </View>

        <Entrada atraso={160}>
          <View style={estilos.painel}>
            <Titulo Icone={IconeMapa} cor="#0369a1" texto="Províncias" nota="toque para ver" />
            <Svg viewBox="-8 -8 296 436" width="100%" height={390}>
              {CAMINHOS.map(({ nome, d }) => {
                const total = totais[nome] || 0;
                return (
                  <Path
                    key={nome}
                    d={d}
                    fill={total ? "#14924a" : "#d7e8dc"}
                    fillOpacity={total ? 0.28 + (total / max) * 0.72 : 1}
                    stroke={activa === nome ? "#0b3d22" : "#ffffff"}
                    strokeWidth={activa === nome ? 1.8 : 0.7}
                    onPress={() => setActiva(activa === nome ? null : nome)}
                  />
                );
              })}
            </Svg>
            {activa ? (
              <View style={estilos.dica}>
                <IconePin size={14} color="#0369a1" />
                <Text style={estilos.dicaNome}>{activa}</Text>
                <Text style={estilos.dicaTotal}>{totais[activa] || 0}</Text>
                <Text style={estilos.nota}>{(totais[activa] || 0) === 1 ? "cliente" : "clientes"}</Text>
              </View>
            ) : <Text style={estilos.nota}>Toque numa província. O verde mais forte tem mais clientes.</Text>}
          </View>
        </Entrada>

        <Titulo Icone={IconeGrafico} cor="#14924a" texto="Ranking" />
        {ranking.length === 0 ? <Text style={estilos.nota}>Ainda não há clientes com província registada.</Text> : null}
        {ranking.map(([nome, total], indice) => (
          <Entrada key={nome} atraso={indice * 45}>
            <Pressable style={[estilos.rank, activa === nome && estilos.rankActivo]} onPress={() => setActiva(activa === nome ? null : nome)}>
              <View style={estilos.rankTopo}>
                <View style={estilos.rankOrdem}><Text style={estilos.rankOrdemTexto}>{indice + 1}</Text></View>
                <IconePin size={14} color="#0369a1" />
                <Text style={estilos.rankNome}>{nome}</Text>
                <Text style={estilos.rankTotal}>{total}</Text>
              </View>
              <Barra pct={(total / max) * 100} cor={activa === nome ? "#0369a1" : "#14924a"} />
            </Pressable>
          </Entrada>
        ))}

        {activa ? (
          <Entrada key={activa} atraso={0}>
            <View style={estilos.painel}>
              <Titulo Icone={IconePessoa} cor="#1d4ed8" texto={activa} nota={`${daProvincia.length}`} />
              {daProvincia.length === 0 ? <Text style={estilos.nota}>Sem clientes nesta província.</Text> : daProvincia.map((cliente) => (
                <View key={cliente.id} style={estilos.mini}>
                  <View style={estilos.avatarPequeno}><IconePessoa size={15} color="#1d4ed8" /></View>
                  <View style={estilos.flex}>
                    <Text style={estilos.nome}>{cliente.nome_completo}</Text>
                    <Text style={estilos.nota}>{cliente.cidade} · {cliente.cliente_ativo ? "Activo" : "Inactivo"} · score {scoreDe(cliente)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Entrada>
        ) : null}
      </ScrollView>
    </View>
  );
};

const Clientes = ({ modo, onVoltar }) => (modo === "mapa" ? <MapaClientes onVoltar={onVoltar} /> : <ListaClientes onVoltar={onVoltar} />);

const estilos = StyleSheet.create({
  ecra: { flex: 1, backgroundColor: FUNDO },
  scroll: { flex: 1 },
  corpo: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28, gap: 10 },
  flex: { flex: 1 },
  cabeca: { overflow: "hidden", paddingHorizontal: 18, paddingTop: 8, paddingBottom: 46, minHeight: 148 },
  corteLargo: { position: "absolute", width: 280, height: 340, right: -70, top: -150 },
  corteClaro: { position: "absolute", width: 220, height: 90, left: -50, bottom: 18, backgroundColor: "rgba(255,255,255,0.16)", transform: [{ rotate: "-16deg" }] },
  corteFino: { position: "absolute", width: 160, height: 46, right: 30, top: 18, backgroundColor: "rgba(255,255,255,0.12)", transform: [{ rotate: "18deg" }] },
  bico: { position: "absolute", left: -30, right: -30, bottom: -22, height: 52, backgroundColor: FUNDO, transform: [{ rotate: "-5deg" }] },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  voltarTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "700" },
  cabecaLinha: { flexDirection: "row", alignItems: "center", gap: 12 },
  cabecaIcone: { width: 46, height: 46, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  cabecaTitulo: { color: "#ffffff", fontFamily: fonte, fontSize: 24, fontWeight: "800" },
  cabecaSub: { color: "rgba(255,255,255,0.9)", fontFamily: fonte, marginTop: 2 },
  grelha: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statMeio: { width: "48%" },
  tres: { flexDirection: "row", gap: 8 },
  stat: { backgroundColor: cores.branco, borderRadius: 18, padding: 12, gap: 4, minHeight: 96 },
  statIcone: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statValor: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, fontSize: 20 },
  statRotulo: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  painel: { backgroundColor: cores.branco, borderRadius: 20, padding: 14, gap: 10 },
  tituloLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
  tituloIcone: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  titulo: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "800", fontSize: 16 },
  tituloNota: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  busca: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: FUNDO, borderRadius: 14, paddingHorizontal: 12 },
  buscaInput: { flex: 1, fontFamily: fonte, color: cores.titulo, paddingVertical: 12 },
  filtros: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filtro: { width: "48%", backgroundColor: FUNDO, borderRadius: 14, padding: 10, gap: 2 },
  filtroAberto: { backgroundColor: cores.verdeEscuro },
  filtroRotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 11, fontWeight: "700" },
  filtroValor: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  filtroClaro: { color: "#ffffff" },
  opcoes: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  opcao: { backgroundColor: FUNDO, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  opcaoActiva: { backgroundColor: cores.verde },
  opcaoTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 12, fontWeight: "700" },
  opcaoTextoActiva: { color: "#ffffff" },
  accoes: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  limpar: { fontFamily: fonte, color: "#9b2c2c", fontWeight: "800" },
  partilhar: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#e7f6ee", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  partilharTexto: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "800" },
  cartao: { backgroundColor: cores.branco, borderRadius: 20, padding: 14, gap: 8 },
  cartaoTopo: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarPequeno: { width: 32, height: 32, borderRadius: 11, backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center" },
  nome: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  nota: { fontFamily: fonte, color: cores.texto, fontSize: 12 },
  ver: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#e7f6ee", alignItems: "center", justifyContent: "center" },
  duas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  meta: { width: "47%", flexDirection: "row", alignItems: "center", gap: 6 },
  metaTexto: { flex: 1, fontFamily: fonte, color: cores.titulo, fontSize: 13 },
  linhaEtiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  etiqueta: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  etiquetaTexto: { fontFamily: fonte, fontSize: 12, fontWeight: "800" },
  vazio: { backgroundColor: cores.branco, borderRadius: 18, padding: 22, alignItems: "center", gap: 6 },
  vazioTitulo: { fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  paginacao: { backgroundColor: cores.branco, borderRadius: 16, padding: 12, gap: 8 },
  paginas: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paginaTexto: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "800" },
  paginaOff: { color: "#c5ccc8" },
  dica: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#e0f2fe", borderRadius: 12, padding: 10 },
  dicaNome: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "800" },
  dicaTotal: { fontFamily: fonte, color: "#0369a1", fontWeight: "800", fontSize: 18 },
  rank: { backgroundColor: cores.branco, borderRadius: 16, padding: 12, gap: 8 },
  rankActivo: { borderWidth: 1.5, borderColor: "#0369a1" },
  rankTopo: { flexDirection: "row", alignItems: "center", gap: 6 },
  rankOrdem: { width: 22, height: 22, borderRadius: 7, backgroundColor: "#e0f2fe", alignItems: "center", justifyContent: "center" },
  rankOrdemTexto: { fontFamily: fonte, color: "#0369a1", fontWeight: "800", fontSize: 11 },
  rankNome: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "700" },
  rankTotal: { fontFamily: fonte, color: "#0369a1", fontWeight: "800" },
  barra: { height: 7, borderRadius: 99, backgroundColor: "#e7f0ea", overflow: "hidden" },
  barraCheia: { height: 7, borderRadius: 99 },
  mini: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  info: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#eef3f0" },
  infoRotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 13 },
  infoValor: { flex: 1, fontFamily: fonte, color: cores.titulo, fontWeight: "700", textAlign: "right" },
});

export default Clientes;
