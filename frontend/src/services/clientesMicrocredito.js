const CHAVE = "microcredito-clientes-v1";

export const ZONAS = [
  { id: 1, nome: "Zona 01 · Matola" },
  { id: 2, nome: "Zona 02 · Maputo" },
  { id: 3, nome: "Zona 03 · Marracuene" },
  { id: 4, nome: "Zona 04 · Boane" },
];

export const PROVINCIAS = [
  "Cabo Delgado",
  "Niassa",
  "Nampula",
  "Zambézia",
  "Tete",
  "Manica",
  "Sofala",
  "Inhambane",
  "Gaza",
  "Maputo",
  "Cidade de Maputo",
];

export const PERFIS = [
  { id: "A", rotulo: "A - Excelente (Score 800-1000)", score: 900 },
  { id: "B", rotulo: "B - Bom (Score 600-799)", score: 700 },
  { id: "C", rotulo: "C - Regular (Score 400-599)", score: 500 },
  { id: "D", rotulo: "D - Mau (Score 0-399)", score: 200 },
];

export const scoreDoPerfil = (perfil) => PERFIS.find((p) => p.id === perfil)?.score ?? 0;

const ler = () => {
  try {
    const bruto = localStorage.getItem(CHAVE);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
};

const gravar = (lista) => {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch (erro) {
    if (erro?.name === "QuotaExceededError") throw new Error("O armazenamento do navegador está cheio. Não foi possível gravar o cliente.");
    throw erro;
  }
};

export const listarClientes = () => ler().sort((a, b) => String(b.data_registo).localeCompare(String(a.data_registo)));

export const obterCliente = (id) => ler().find((c) => String(c.id) === String(id)) || null;

export const eliminarCliente = (id) => gravar(ler().filter((c) => String(c.id) !== String(id)));

export const documentoExiste = (numero, ignorarId) =>
  ler().some(
    (c) =>
      String(c.id) !== String(ignorarId || "") &&
      String(c.documento_numero || "").trim().toLowerCase() === String(numero || "").trim().toLowerCase()
  );

export const guardarCliente = (dados, utilizador) => {
  const lista = ler();
  const agora = new Date().toISOString();
  if (dados.id) {
    const idx = lista.findIndex((c) => String(c.id) === String(dados.id));
    if (idx < 0) throw new Error("Cliente não encontrado.");
    lista[idx] = { ...lista[idx], ...dados, data_atualizacao: agora };
    gravar(lista);
    return lista[idx];
  }
  const novo = {
    ...dados,
    id: crypto.randomUUID(),
    data_registo: agora,
    data_atualizacao: agora,
    criado_por: utilizador?.nome || "Sistema",
  };
  lista.push(novo);
  gravar(lista);
  return novo;
};

export const importarClientes = (itens, utilizador) => {
  const lista = ler();
  let adicionados = 0;
  itens.forEach((item) => {
    if (!item?.nome_completo || !item?.documento_numero) return;
    if (documentoExiste(item.documento_numero)) return;
    lista.push({
      ...item,
      id: crypto.randomUUID(),
      score: scoreDoPerfil(item.perfil_risco || "C"),
      cliente_ativo: item.cliente_ativo !== false,
      data_registo: new Date().toISOString(),
      data_atualizacao: new Date().toISOString(),
      criado_por: utilizador?.nome || "Importação",
    });
    adicionados += 1;
  });
  gravar(lista);
  return adicionados;
};
