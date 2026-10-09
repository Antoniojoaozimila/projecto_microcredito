import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { IconeVoltar } from "../../componentes/Icones";
import { cores, fonte } from "../../tema";

export const Faixa = ({ titulo, sub, Icone, cor = "#0f7a3c", onVoltar, voltar = "Módulos" }) => (
  <View style={[estilos.faixa, { backgroundColor: cor }]}>
    <View style={estilos.corte} />
    <Pressable style={estilos.voltar} onPress={onVoltar}>
      <IconeVoltar size={16} color="#ffffff" />
      <Text style={estilos.voltarTexto}>{voltar}</Text>
    </Pressable>
    <View style={estilos.linha}>
      <View style={estilos.icone}><Icone size={20} color="#ffffff" /></View>
      <View style={estilos.flex}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.sub}>{sub}</Text>
      </View>
    </View>
  </View>
);

export const Seccao = ({ Icone, titulo, cor, children }) => (
  <View style={estilos.seccao}>
    <View style={estilos.linha}>
      <View style={[estilos.mini, { backgroundColor: `${cor}18` }]}><Icone size={16} color={cor} /></View>
      <Text style={estilos.seccaoTitulo}>{titulo}</Text>
    </View>
    {children}
  </View>
);

export const Campo = ({ rotulo, erro, children }) => (
  <View style={estilos.campo}>
    <Text style={estilos.rotulo}>{rotulo}</Text>
    {children}
    {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
  </View>
);

export const Caixa = (props) => (
  <TextInput placeholderTextColor={cores.placeholder} style={estilos.input} {...props} />
);

export const Chips = ({ valor, opcoes, onChange }) => (
  <View style={estilos.chips}>
    {opcoes.map((opcao) => (
      <Pressable key={opcao} onPress={() => onChange(opcao)} style={[estilos.chip, valor === opcao && estilos.chipOn]}>
        <Text style={[estilos.chipTexto, valor === opcao && estilos.chipTextoOn]}>{opcao}</Text>
      </Pressable>
    ))}
  </View>
);

export const Botao = ({ texto, onPress }) => (
  <Pressable style={estilos.botao} onPress={onPress}><Text style={estilos.botaoTexto}>{texto}</Text></Pressable>
);

export const Linha = ({ Icone, cor, titulo, nota, onPress }) => (
  <Pressable style={estilos.linhaCard} onPress={onPress}>
    <View style={[estilos.mini, { backgroundColor: `${cor}18` }]}><Icone size={16} color={cor} /></View>
    <View style={estilos.flex}>
      <Text style={estilos.itemTitulo}>{titulo}</Text>
      <Text style={estilos.nota}>{nota}</Text>
    </View>
  </Pressable>
);

const estilos = StyleSheet.create({
  faixa: { borderRadius: 22, overflow: "hidden", padding: 16, minHeight: 112 },
  corte: { position: "absolute", width: 150, height: 150, right: -36, top: -64, backgroundColor: "rgba(255,255,255,0.18)", transform: [{ rotate: "28deg" }] },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  voltarTexto: { color: "#fff", fontFamily: fonte, fontWeight: "700" },
  linha: { flexDirection: "row", alignItems: "center", gap: 10 },
  icone: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  mini: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  titulo: { color: "#fff", fontFamily: fonte, fontSize: 22, fontWeight: "800" },
  sub: { color: "rgba(255,255,255,0.88)", fontFamily: fonte, marginTop: 2 },
  seccao: { backgroundColor: cores.branco, borderRadius: 16, padding: 12, gap: 8 },
  seccaoTitulo: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, fontSize: 16 },
  campo: { gap: 4 },
  rotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700" },
  input: { backgroundColor: "#f4f8f5", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonte, color: cores.titulo },
  erro: { fontFamily: fonte, color: "#9b2c2c", fontSize: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { backgroundColor: "#f4f8f5", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  chipOn: { backgroundColor: cores.verde },
  chipTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 12, fontWeight: "700" },
  chipTextoOn: { color: "#fff" },
  botao: { backgroundColor: cores.verde, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  botaoTexto: { color: "#fff", fontFamily: fonte, fontWeight: "800" },
  linhaCard: { backgroundColor: cores.branco, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  itemTitulo: { fontFamily: fonte, color: cores.titulo, fontWeight: "700" },
  nota: { fontFamily: fonte, color: cores.texto, fontSize: 12, marginTop: 2 },
});
