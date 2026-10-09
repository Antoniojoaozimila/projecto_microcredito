import { LinearGradient } from "expo-linear-gradient";

const Degrade = ({ colors, locations, style, children }) => (
  <LinearGradient colors={colors} locations={locations} style={style}>
    {children}
  </LinearGradient>
);

export default Degrade;
