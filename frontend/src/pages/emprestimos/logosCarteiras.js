import mpesa from "../../assets/M-pesa-logo.png";
import emola from "../../assets/e-mola.png";
import mkesh from "../../assets/mkesh.png";
import bci from "../../assets/BCI.png";
import bim from "../../assets/millennium_01.png";
import standard from "../../assets/standard bank.png";
import letshego from "../../assets/letshego.jpg";
import moza from "../../assets/mozapng.png";
import { Banknote, Landmark, Smartphone, Wallet } from "lucide-react";

export const LOGOS_CARTEIRAS = { mpesa, emola, mkesh, bci, bim, standard, letshego, moza };

export const LOGOS_CHEIOS = ["bim", "letshego"];

export const ICONES_TIPO = {
  "Numerário": Banknote,
  "Carteira móvel": Smartphone,
  Caixa: Banknote,
  Mpesa: Smartphone,
  "E-Mola": Smartphone,
  Banco: Landmark,
  Outro: Wallet,
};

export const LOGO_POR_TIPO = { Caixa: "caixa", Mpesa: "mpesa", "E-Mola": "emola" };

const LOGOS_POR_NOME = [
  [/bci/i, "bci"], [/millennium|bim/i, "bim"], [/standard/i, "standard"], [/letshego/i, "letshego"], [/moza/i, "moza"],
  [/mkesh|m-kesh/i, "mkesh"], [/m-?pesa/i, "mpesa"], [/e-?mola/i, "emola"],
];

export const logoSugerido = (nome, tipo) => LOGOS_POR_NOME.find(([re]) => re.test(String(nome || "")))?.[1] || LOGO_POR_TIPO[tipo] || "";
