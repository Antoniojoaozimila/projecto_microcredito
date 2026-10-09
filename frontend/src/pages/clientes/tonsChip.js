export const tomPerfil = (perfil) => ({ A: "", B: "is-azul", C: "is-amarelo", D: "is-vermelho" })[perfil] ?? "is-cinza";

export const tomScore = (score) => {
  const n = Number(score) || 0;
  if (n >= 800) return "";
  if (n >= 600) return "is-azul";
  if (n >= 400) return "is-amarelo";
  return "is-vermelho";
};
