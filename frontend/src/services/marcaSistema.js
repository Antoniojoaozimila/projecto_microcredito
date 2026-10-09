import { useEffect, useState } from "react";

export const CHAVE_MARCA = "microcredito-marca-v1";
export const EVENTO_MARCA = "marca-sistema";
const CHAVE = CHAVE_MARCA;
const EVENTO = EVENTO_MARCA;

export const MARCA_PADRAO = {
  nome: "Sistema de Microcrédito",
  logo: "",
  favicon: "",
};

export const lerMarca = () => {
  try {
    const guardada = JSON.parse(localStorage.getItem(CHAVE) || "null");
    return { ...MARCA_PADRAO, ...(guardada || {}) };
  } catch {
    return { ...MARCA_PADRAO };
  }
};

export const aplicarMarca = (marca = lerMarca()) => {
  document.title = marca.nome || MARCA_PADRAO.nome;
  const icone = marca.favicon || marca.logo;
  if (!icone || String(icone).length > 150000) return;
  ["icon", "apple-touch-icon"].forEach((rel) => {
    let link = document.querySelector(`link[rel='${rel}']`);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = icone;
  });
};

export const guardarMarca = (parcial) => {
  const marca = { ...lerMarca(), ...parcial };
  localStorage.setItem(CHAVE, JSON.stringify(marca));
  aplicarMarca(marca);
  window.dispatchEvent(new CustomEvent(EVENTO));
  return marca;
};

export const useMarca = () => {
  const [marca, setMarca] = useState(lerMarca);
  useEffect(() => {
    const actualizar = () => setMarca(lerMarca());
    window.addEventListener(EVENTO, actualizar);
    return () => window.removeEventListener(EVENTO, actualizar);
  }, []);
  return marca;
};
