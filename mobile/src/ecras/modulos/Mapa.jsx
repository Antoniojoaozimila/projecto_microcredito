import { WebView } from "react-native-webview";
import { htmlMapa } from "./mapaHtml";

const Mapa = ({ pontos, altura = 380, aoVivo = false }) => (
  <WebView
    originWhitelist={["*"]}
    source={{ html: htmlMapa(pontos, aoVivo) }}
    geolocationEnabled
    androidLayerType="hardware"
    nestedScrollEnabled
    style={{ height: altura, width: "100%", backgroundColor: "#e7f2f8" }}
  />
);

export default Mapa;
