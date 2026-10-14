const paraDia = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const hojeDia = () => paraDia(new Date());

/** Dia local (AAAA-MM-DD) de um registo gravado em ISO. */
export const diaDoRegisto = (iso) => {
  if (!iso) return hojeDia();
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso);
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? hojeDia() : paraDia(d);
};

/** Converte o dia escolhido no formulário em data de registo; hoje mantém a hora exacta. */
export const dataRegistoIso = (dia) => {
  if (!dia || dia === hojeDia()) return new Date().toISOString();
  return new Date(`${dia}T${new Date().toTimeString().slice(0, 8)}`).toISOString();
};

/** Mantém o registo original se o dia não mudou, para não perder a hora gravada. */
export const manterOuMudarRegisto = (isoOriginal, dia) =>
  isoOriginal && diaDoRegisto(isoOriginal) === dia ? isoOriginal : dataRegistoIso(dia);

export const erroDataRegisto = (dia) => {
  if (!dia || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return "Indique a data de registo.";
  if (dia > hojeDia()) return "A data de registo não pode ser futura.";
  if (dia < "2000-01-01") return "Data de registo inválida.";
  return "";
};
