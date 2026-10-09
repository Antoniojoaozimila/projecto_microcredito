import { View } from "react-native";

const Degrade = ({ colors = [], locations, style, children }) => {
  const paragens = colors
    .map((cor, indice) => {
      const ponto = locations?.[indice];
      const percentagem = ponto == null ? (indice / Math.max(colors.length - 1, 1)) * 100 : ponto * 100;
      return `${cor} ${percentagem}%`;
    })
    .join(", ");

  return <View style={[style, { backgroundImage: `linear-gradient(to bottom, ${paragens})` }]}>{children}</View>;
};

export default Degrade;
