import { unstable_createElement as criar } from "react-native-web";
import { htmlMapa } from "./mapaHtml";

const Mapa = ({ pontos, altura = 280, aoVivo = false }) =>
  criar("iframe", {
    title: "Mapa de Moçambique",
    srcDoc: htmlMapa(pontos, aoVivo),
    style: { height: altura, width: "100%", border: 0, borderRadius: 18, backgroundColor: "#e7f2f8" },
  });

export default Mapa;
