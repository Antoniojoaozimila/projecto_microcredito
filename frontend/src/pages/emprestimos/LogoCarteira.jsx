import { Wallet } from "lucide-react";
import { ICONES_TIPO, LOGOS_CARTEIRAS, LOGOS_CHEIOS } from "./logosCarteiras";

const LogoCarteira = ({ carteira }) => {
  const ficheiro = String(carteira.logo_ficheiro || "").startsWith("data:") ? carteira.logo_ficheiro : "";
  const logo = ficheiro || LOGOS_CARTEIRAS[carteira.logo];
  const IconeTipo = ICONES_TIPO[carteira.tipo] || Wallet;
  return (
    <span className={`emp-carteira-logo${LOGOS_CHEIOS.includes(carteira.logo) ? " is-cheio" : ""}${logo ? "" : " is-icone"}`}>
      {logo ? <img src={logo} alt={carteira.nome} /> : <IconeTipo size={28} />}
    </span>
  );
};

export default LogoCarteira;
