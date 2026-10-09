import logoPadrao from "../assets/logo.png";
import { lerMarca } from "./marcaSistema";

export const origemLogo = () => lerMarca().logo || logoPadrao;

export const urlLogo = () => {
  const src = origemLogo();
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http")) return src;
  if (typeof window === "undefined") return src;
  return `${window.location.origin}${src.startsWith("/") ? src : `/${src}`}`;
};

export const pngDoLogo = () =>
  new Promise((resolve) => {
    const src = origemLogo();
    if (!src) {
      resolve("");
      return;
    }
    const img = new Image();
    img.onload = () => {
      const tela = document.createElement("canvas");
      tela.width = img.naturalWidth || 1;
      tela.height = img.naturalHeight || 1;
      tela.getContext("2d").drawImage(img, 0, 0);
      resolve(tela.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
