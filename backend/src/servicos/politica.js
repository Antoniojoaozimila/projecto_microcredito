import { Configuracao } from "../modelos/colecoes.js";

export const lerPolitica = async () => {
  const linha = await Configuracao.findByPk("microcredito-config-v1");
  return linha?.valor || {};
};

export const validarSenhaPolitica = (senha, politica = {}) => {
  const texto = String(senha || "");
  const minimo = Number(politica.min_caracteres_senha) || 8;
  if (texto.length < minimo) return `A senha precisa de pelo menos ${minimo} caracteres.`;
  if (politica.requer_maiuscula && !/[A-Z]/.test(texto)) return "A senha precisa de uma letra maiúscula.";
  if (politica.requer_minuscula && !/[a-z]/.test(texto)) return "A senha precisa de uma letra minúscula.";
  if (politica.requer_numero && !/\d/.test(texto)) return "A senha precisa de um número.";
  if (politica.requer_simbolo && !/[^A-Za-z0-9]/.test(texto)) return "A senha precisa de um símbolo.";
  return "";
};

export const minutosSessao = (politica = {}) => {
  const minutos = Number(politica.sessao_expiracao_min);
  return Number.isFinite(minutos) && minutos > 0 ? minutos : 60;
};
