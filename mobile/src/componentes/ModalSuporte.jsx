import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import fotoAntonio from "../../assets/dev-antonio.png";
import fotoElton from "../../assets/dev-elton.png";
import { IconeFechar, IconeSms, IconeTelefone, IconeWhatsapp } from "./Icones";
import { cores, fonte } from "../tema";

const MENSAGEM = "Olá, preciso de suporte no sistema de microcrédito.";

const EQUIPA = [
  {
    id: "antonio",
    nome: "António João Zimila",
    cargo: "Fullstack Developer",
    telefone: "845625067",
    intl: "258845625067",
    foto: fotoAntonio,
  },
  {
    id: "elton",
    nome: "Elton Reginaldo Matsinhe",
    cargo: "Fullstack Developer",
    telefone: "833075973",
    intl: "258833075973",
    foto: fotoElton,
  },
];

const abrir = (url) => {
  Linking.openURL(url).catch(() => {});
};

const ModalSuporte = ({ visivel, onFechar }) => (
  <Modal visible={visivel} transparent animationType="fade" onRequestClose={onFechar}>
    <Pressable style={styles.fundo} onPress={onFechar}>
      <Pressable style={styles.folha} onPress={() => {}}>
        <View style={styles.cabeca}>
          <Pressable style={styles.fechar} onPress={onFechar} accessibilityLabel="Fechar">
            <IconeFechar size={16} color={cores.branco} />
          </Pressable>
          <Text style={styles.titulo}>Suporte Técnico</Text>
          <Text style={styles.subtitulo}>Equipa de desenvolvimento pronta para ajudar.</Text>
        </View>
        <ScrollView style={styles.corpo} contentContainerStyle={styles.corpoConteudo} bounces={false}>
          {EQUIPA.map((pessoa) => {
            const texto = encodeURIComponent(MENSAGEM);
            return (
              <View key={pessoa.id} style={styles.cartao}>
                <View style={styles.topo}>
                  <Image source={pessoa.foto} style={styles.foto} />
                  <View style={styles.info}>
                    <Text style={styles.nome} numberOfLines={1}>{pessoa.nome}</Text>
                    <Text style={styles.cargo} numberOfLines={1}>{pessoa.cargo}</Text>
                    <Text style={styles.telefone} numberOfLines={1}>{pessoa.telefone}</Text>
                  </View>
                </View>
                <View style={styles.acoes}>
                  <Pressable style={[styles.acao, styles.whatsapp]} onPress={() => abrir(`https://wa.me/${pessoa.intl}?text=${texto}`)}>
                    <IconeWhatsapp size={12} color={cores.branco} />
                    <Text style={styles.acaoTexto} numberOfLines={1}>WhatsApp</Text>
                  </Pressable>
                  <Pressable style={[styles.acao, styles.sms]} onPress={() => abrir(`sms:+${pessoa.intl}?body=${texto}`)}>
                    <IconeSms size={12} color={cores.branco} />
                    <Text style={styles.acaoTexto} numberOfLines={1}>SMS</Text>
                  </Pressable>
                  <Pressable style={[styles.acao, styles.tel]} onPress={() => abrir(`tel:+${pessoa.intl}`)}>
                    <IconeTelefone size={12} color={cores.branco} />
                    <Text style={styles.acaoTexto} numberOfLines={1}>Chamada</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
        <Text style={styles.rodape}>NBMM Microcrédito · Suporte técnico da plataforma</Text>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: "rgba(8, 24, 14, 0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  folha: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "88%",
    backgroundColor: cores.branco,
    borderRadius: 22,
    overflow: "hidden",
  },
  cabeca: {
    backgroundColor: "#106a37",
    paddingTop: 28,
    paddingBottom: 18,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  fechar: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    fontFamily: fonte,
    color: cores.branco,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitulo: {
    fontFamily: fonte,
    marginTop: 6,
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    textAlign: "center",
  },
  corpo: {
    backgroundColor: "#f7fbf8",
  },
  corpoConteudo: {
    padding: 14,
    gap: 12,
  },
  cartao: {
    backgroundColor: "#f3faf6",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16,106,55,0.14)",
    padding: 12,
    gap: 10,
  },
  topo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  foto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cores.branco,
    borderWidth: 3,
    borderColor: "rgba(16,106,55,0.28)",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nome: {
    fontFamily: fonte,
    color: "#106a37",
    fontWeight: "700",
    fontSize: 14,
  },
  cargo: {
    fontFamily: fonte,
    color: "#5a8a6a",
    fontSize: 12,
    marginTop: 1,
  },
  telefone: {
    fontFamily: fonte,
    color: "#444",
    fontSize: 12,
    marginTop: 2,
  },
  acoes: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 6,
  },
  acao: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  whatsapp: { backgroundColor: "#25d366" },
  sms: { backgroundColor: "#106a37" },
  tel: { backgroundColor: "#0d5a2e" },
  acaoTexto: {
    fontFamily: fonte,
    color: cores.branco,
    fontSize: 11,
    fontWeight: "700",
  },
  rodape: {
    fontFamily: fonte,
    textAlign: "center",
    color: "#999",
    fontSize: 11,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(16,106,55,0.08)",
  },
});

export default ModalSuporte;
