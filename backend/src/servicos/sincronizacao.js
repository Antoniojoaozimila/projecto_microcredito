import { DEFINICOES, Extra, Configuracao, CHAVES_OBJECTO, porChave } from "../modelos/colecoes.js";
import { enviarCorreio } from "./correio.js";

const idDe = (item, indice) => String(item?.id || item?.codigo || `item-${indice}`);

const lerLista = async (definicao) => {
  const linhas = await definicao.modelo.findAll({ order: [["atualizado_em", "ASC"]] });
  return linhas.map((linha) => linha.dados);
};

export const lerTudo = async () => {
  const colecoes = {};
  for (const definicao of DEFINICOES) {
    colecoes[definicao.chave] = await lerLista(definicao);
  }
  const configs = await Configuracao.findAll();
  configs.forEach((linha) => {
    colecoes[linha.chave] = linha.valor;
  });
  const extras = await Extra.findAll();
  const grupos = {};
  extras.forEach((linha) => {
    if (!grupos[linha.colecao]) grupos[linha.colecao] = [];
    grupos[linha.colecao].push(linha.dados);
  });
  Object.assign(colecoes, grupos);
  return colecoes;
};

const enviarEmailsNovos = async (anteriores, itens) => {
  const clientes = await porChave["microcredito-clientes-v1"].modelo.findAll();
  const emails = new Map(clientes.map((c) => [String(c.id), c.dados?.email || ""]));
  const actualizados = [];
  for (const item of itens) {
    const jaEnviado = anteriores.get(String(item.id)) === true;
    const deveEnviar = item.canal === "Email" && item.status === "Enviada" && !jaEnviado;
    if (!deveEnviar) {
      actualizados.push(item);
      continue;
    }
    const para = emails.get(String(item.client_id)) || "";
    if (!para) {
      actualizados.push({ ...item, status: "Falhou", observacoes: "O cliente não tem email." });
      continue;
    }
    try {
      await enviarCorreio({
        para,
        assunto: item.tipo_notificacao || "Notificação",
        mensagem: item.mensagem || "",
      });
      actualizados.push({ ...item, email_servidor: true });
    } catch (erro) {
      actualizados.push({ ...item, status: "Falhou", observacoes: erro.message });
    }
  }
  return actualizados;
};

export const guardarColecao = async (chave, valor) => {
  if (CHAVES_OBJECTO.includes(chave) || (valor && !Array.isArray(valor) && typeof valor === "object")) {
    await Configuracao.upsert({ chave, valor: valor ?? {} });
    return valor ?? {};
  }

  const lista = Array.isArray(valor) ? valor : [];
  const definicao = porChave[chave];
  if (!definicao) {
    await Extra.destroy({ where: { colecao: chave } });
    if (lista.length) {
      await Extra.bulkCreate(lista.map((item, indice) => ({
        id: `${chave}:${idDe(item, indice)}`,
        colecao: chave,
        dados: { ...item, id: idDe(item, indice) },
      })));
    }
    return lista;
  }

  let itens = lista.map((item, indice) => ({ ...item, id: idDe(item, indice) }));
  const flags = new Map();
  if (definicao.notificacao) {
    const anteriores = await definicao.modelo.findAll({ attributes: ["id", "email_enviado"] });
    anteriores.forEach((linha) => flags.set(String(linha.id), Boolean(linha.email_enviado)));
    itens = await enviarEmailsNovos(flags, itens);
  }

  await definicao.modelo.destroy({ where: {} });
  if (itens.length) {
    await definicao.modelo.bulkCreate(itens.map((item) => {
      const extra = {};
      Object.entries(definicao.campos).forEach(([coluna, ler]) => {
        extra[coluna] = ler(item);
      });
      if (definicao.notificacao) {
        extra.email_enviado = flags.get(String(item.id)) === true || item.email_servidor === true || item.status === "Falhou";
      }
      return { id: String(item.id), dados: item, ...extra };
    }));
  }
  return itens;
};
