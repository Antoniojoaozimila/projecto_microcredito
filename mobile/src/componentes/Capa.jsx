import { Image, StyleSheet, View } from "react-native";
import essa from "../../assets/essa.png";
import esse from "../../assets/esse.png";

const IMAGENS = {
  essa: { origem: essa, largura: 1341, altura: 1173 },
  esse: { origem: esse, largura: 1024, altura: 1536 },
};

const Capa = ({ variante = "essa", altura, expandir = false, comoPrimeira = false, style }) => {
  const imagem = IMAGENS[variante] || IMAGENS.essa;
  const medida = comoPrimeira ? IMAGENS.essa : imagem;

  return (
    <View
      style={[
        styles.caixa,
        expandir ? styles.expandir : altura ? { height: altura } : { aspectRatio: medida.largura / medida.altura },
        style,
      ]}
    >
      <Image source={imagem.origem} fadeDuration={0} resizeMode="contain" style={styles.imagem} />
    </View>
  );
};

const styles = StyleSheet.create({
  caixa: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  expandir: {
    flex: 1,
    height: "100%",
  },
  imagem: {
    width: "100%",
    height: "100%",
  },
});

export default Capa;
