import { useEffect } from "react";

export const opcoesDe = (lista, primeiro) => [
  ...(primeiro ? [{ id: "", label: primeiro }] : []),
  ...lista.map((v) => (typeof v === "object" ? v : { id: v, label: v })),
];

export const soMontante = (valor) => {
  const limpo = String(valor || "").replace(/[^\d.,]/g, "").replace(",", ".");
  const [inteiro, ...resto] = limpo.split(".");
  return resto.length ? `${inteiro}.${resto.join("").slice(0, 2)}` : inteiro;
};

export const soTelefone = (valor) => String(valor || "").replace(/[^\d+]/g, "").slice(0, 13);

export const iniciaisDe = (nome) =>
  String(nome || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

const CORES = ["#4AAC05", "#2563eb", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#059669", "#dc2626"];

export const corDoNome = (nome) => {
  const soma = String(nome || "").split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return CORES[soma % CORES.length];
};

export const percentagem = (valor) => `${Number(valor || 0).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}%`;

export const compacto = (valor) => {
  const n = Number(valor || 0);
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}M MT`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toLocaleString("pt-PT", { maximumFractionDigits: 1 })}K MT`;
  return `${n.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} MT`;
};

export const dataHoraCurta = (iso) => (iso ? new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export const paginar = (lista, pagina, porPagina) => {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const actual = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (actual - 1) * porPagina;
  return { itens: lista.slice(inicio, inicio + porPagina), totalPaginas, actual, inicio };
};

export const useFecharAoClicarFora = (seletor, fechar) => {
  useEffect(() => {
    const aoClicar = (e) => {
      if (!e.target.closest(seletor)) fechar();
    };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [seletor, fechar]);
};

export const lerFicheiro = (ficheiro) =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve({ nome: ficheiro.name, tipo: ficheiro.type, tamanho: ficheiro.size, conteudo: leitor.result });
    leitor.onerror = () => reject(new Error(`Não foi possível ler ${ficheiro.name}.`));
    leitor.readAsDataURL(ficheiro);
  });

export const ligacaoGoogleMaps = (pontos) => {
  const validos = pontos.filter(Boolean);
  if (!validos.length) return null;
  const txt = (p) => `${p.lat},${p.lon}`;
  const destino = validos[validos.length - 1];
  const intermedios = validos.slice(0, -1).slice(0, 9);
  return `https://www.google.com/maps/dir/?api=1&destination=${txt(destino)}${intermedios.length ? `&waypoints=${encodeURIComponent(intermedios.map(txt).join("|"))}` : ""}&travelmode=driving`;
};
