import nodemailer from "nodemailer";
import { Configuracao } from "../modelos/colecoes.js";

const CHAVE_CONFIG = "microcredito-config-v1";

const PROVEDORES = {
  gmail: { host: "smtp.gmail.com", port: 587 },
  workspace: { host: "smtp.gmail.com", port: 587 },
  outlook: { host: "smtp.office365.com", port: 587 },
};

export const lerConfigCorreio = async () => {
  const linha = await Configuracao.findByPk(CHAVE_CONFIG);
  return linha?.valor || {};
};

export const resolverServidor = (config) => {
  const pedido = String(config.email_smtp_host || config.provedor || "").trim().toLowerCase();
  const conhecido = PROVEDORES[pedido];
  return {
    host: conhecido?.host || config.email_smtp_host || config.host || "",
    port: Number(config.email_smtp_port || config.port || conhecido?.port || 587),
    user: config.email_smtp_user || config.utilizador || "",
    pass: config.email_smtp_pass || config.senha || "",
  };
};

const transporteDe = (config) => {
  const servidor = resolverServidor(config);
  if (!servidor.host || !servidor.user || !servidor.pass) {
    throw new Error("Preencha o servidor SMTP, o utilizador e a senha. Use smtp.gmail.com para Gmail ou Workspace, ou smtp.office365.com para Outlook.");
  }
  return nodemailer.createTransport({
    host: servidor.host,
    port: servidor.port,
    secure: servidor.port === 465,
    auth: { user: servidor.user, pass: servidor.pass },
  });
};

export const verificarCorreio = async (parcial = {}) => {
  const guardado = await lerConfigCorreio();
  const config = { ...guardado, ...parcial };
  if (!parcial.email_smtp_pass && !parcial.senha) config.email_smtp_pass = guardado.email_smtp_pass;
  const transporte = transporteDe(config);
  await transporte.verify();
  return resolverServidor(config);
};

export const enviarCorreio = async ({ para, assunto, mensagem, config }) => {
  const guardado = await lerConfigCorreio();
  if (guardado.notificacoes_email_ativo === false) {
    throw new Error("O canal de email está desactivado nas notificações.");
  }
  const actual = { ...guardado, ...(config || {}) };
  if (!config?.email_smtp_pass && !config?.senha) actual.email_smtp_pass = guardado.email_smtp_pass;
  const transporte = transporteDe(actual);
  const servidor = resolverServidor(actual);
  const info = await transporte.sendMail({
    from: servidor.user,
    to: para,
    subject: assunto || "Sistema de Microcrédito",
    text: mensagem || "",
  });
  return { id: info.messageId, para };
};
