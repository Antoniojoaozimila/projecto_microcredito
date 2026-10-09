const BASE = "microcredito-anexos";
const LOJA = "anexos";

let ligacao = null;

const abrir = () => {
  if (ligacao) return ligacao;
  ligacao = new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BASE, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(LOJA);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => {
      ligacao = null;
      reject(pedido.error);
    };
  });
  return ligacao;
};

const operar = async (modo, accao) => {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(LOJA, modo);
    const pedido = accao(tx.objectStore(LOJA));
    tx.oncomplete = () => resolve(pedido?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Operação cancelada."));
  });
};

const tamanhoDataUrl = (conteudo) => Math.round((String(conteudo).length * 3) / 4);

export const guardarAnexo = async (anexo) => {
  if (!anexo?.conteudo) return anexo;
  const anexo_id = anexo.anexo_id || crypto.randomUUID();
  await operar("readwrite", (loja) => loja.put(anexo.conteudo, anexo_id));
  return { anexo_id, nome: anexo.nome, tipo: anexo.tipo, tamanho: anexo.tamanho || tamanhoDataUrl(anexo.conteudo) };
};

export const obterAnexo = (anexoId) => operar("readonly", (loja) => loja.get(anexoId));

export const eliminarAnexo = (anexoId) => operar("readwrite", (loja) => loja.delete(anexoId));

export const guardarLista = (lista) => Promise.all((lista || []).map(guardarAnexo));

export const guardarMapa = async (mapa) => {
  const pares = await Promise.all(Object.entries(mapa || {}).map(async ([chave, anexo]) => [chave, anexo ? await guardarAnexo(anexo) : anexo]));
  return Object.fromEntries(pares);
};

export const abrirAnexo = async (anexo) => {
  const conteudo = anexo?.conteudo || (anexo?.anexo_id ? await obterAnexo(anexo.anexo_id) : null);
  if (!conteudo) throw new Error("O ficheiro já não está disponível neste navegador.");
  const ligacaoTemp = document.createElement("a");
  ligacaoTemp.href = conteudo;
  ligacaoTemp.download = anexo.nome || "anexo";
  ligacaoTemp.click();
};

const reduzirFoto = (conteudo, lado = 256) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const menor = Math.min(img.naturalWidth, img.naturalHeight);
      const tela = document.createElement("canvas");
      tela.width = lado;
      tela.height = lado;
      tela.getContext("2d").drawImage(img, (img.naturalWidth - menor) / 2, (img.naturalHeight - menor) / 2, menor, menor, 0, 0, lado, lado);
      resolve(tela.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(conteudo);
    img.src = conteudo;
  });

export const prepararFoto = async (foto) => {
  if (!foto?.conteudo || foto.conteudo.length < 60000) return foto;
  return { ...foto, conteudo: await reduzirFoto(foto.conteudo) };
};

const temConteudo = (valor) => Boolean(valor?.conteudo);

export const migrarAnexos = async () => {
  if (typeof indexedDB === "undefined") return;
  try {
    const bruto = localStorage.getItem("microcredito-clientes-v1");
    const clientes = bruto ? JSON.parse(bruto) : [];
    let mudou = false;
    const novosClientes = await Promise.all(
      (Array.isArray(clientes) ? clientes : []).map(async (c) => {
        const docs = c.documentos_anexos || {};
        const precisaDocs = Object.values(docs).some(temConteudo);
        const precisaFoto = c.foto_perfil?.conteudo && c.foto_perfil.conteudo.length >= 60000;
        if (!precisaDocs && !precisaFoto) return c;
        mudou = true;
        return {
          ...c,
          documentos_anexos: precisaDocs ? await guardarMapa(docs) : docs,
          foto_perfil: precisaFoto ? await prepararFoto(c.foto_perfil) : c.foto_perfil,
        };
      })
    );
    if (mudou) localStorage.setItem("microcredito-clientes-v1", JSON.stringify(novosClientes));

    const brutoE = localStorage.getItem("microcredito-emprestimos-v1");
    const emprestimos = brutoE ? JSON.parse(brutoE) : [];
    let mudouE = false;
    const novosE = await Promise.all(
      (Array.isArray(emprestimos) ? emprestimos : []).map(async (e) => {
        if (!(e.garantia_documentos || []).some(temConteudo)) return e;
        mudouE = true;
        return { ...e, garantia_documentos: await guardarLista(e.garantia_documentos) };
      })
    );
    if (mudouE) localStorage.setItem("microcredito-emprestimos-v1", JSON.stringify(novosE));
  } catch (erro) {
    console.warn("Não foi possível migrar os anexos:", erro);
  }
};
