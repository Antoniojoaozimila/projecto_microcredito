const zonaBase = ["Zona Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste"];

const bairros = {
  KaMpfumo: ["Polana Cimento", "Sommerschield", "Coop", "Alto Maé", "Malhangalene", "Central", "Baixa", "Jardim"],
  Nlhamankulu: ["Chamanculo A", "Chamanculo B", "Chamanculo C", "Chamanculo D", "Xipamanine", "Minkadjuine", "Aeroporto A", "Aeroporto B", "Malanga", "Unidade 7"],
  KaMaxakeni: ["Mafalala", "Maxaquene A", "Maxaquene B", "Maxaquene C", "Maxaquene D", "Polana Caniço A", "Polana Caniço B", "Urbanização"],
  KaMavota: ["Costa do Sol", "Triunfo", "Hulene A", "Hulene B", "Ferroviário", "3 de Fevereiro", "Mavalane", "FPLM"],
  KaMubukwana: ["Laulane", "Mahotas", "Zimpeto", "Magoanine A", "Magoanine B", "Magoanine C", "Albazine", "Benfica", "Kongolote", "25 de Junho"],
  KaTembe: ["Incassane", "Guachene", "Chali", "Inguide"],
  KaNyaka: ["Ribjene", "Nhaquene", "Inguane"],
  Matola: ["Liberdade", "Machava", "Tsalala", "Fomento", "Mussumbuluco", "Matola A", "Matola B", "Matola C", "Matola D", "Matola Gare", "Sikwama", "Ndlavela", "São Damaso", "Patrice Lumumba", "Malhampsene"],
  Boane: ["Boane Sede", "Campoane", "Mahubo", "Guegue"],
  Marracuene: ["Marracuene Sede", "Machubo", "Matalane", "Mihangalene"],
  Manhiça: ["Manhiça Sede", "Maluana", "Xinavane", "Calanga", "3 de Fevereiro"],
  Beira: ["Ponta Gêa", "Macuti", "Esturro", "Munhava", "Manga", "Chaimite", "Chipangara", "Pioneiros", "Macurungo", "Inhamízua", "Matacuane", "Vaz", "Maquinino"],
  Dondo: ["Dondo Sede", "Mafambisse", "Savane"],
  Nampula: ["Central", "Muatala", "Natikiri", "Namutequeliua", "Muhala", "Muhala Expansão", "Carrupeia", "Napipine", "Mutauanha", "Marere"],
  Nacala: ["Nacala Porto", "Maiaia", "Muzuane", "Ontupa", "Triângulo", "Mathapue"],
  "Ilha de Moçambique": ["Cidade de Pedra", "Macua", "Esteu", "Lumbo"],
  Quelimane: ["Cimento", "Icidua", "Manhaua", "Coalane", "Sangariveira", "Torrone", "Brandão", "Migano"],
  Mocuba: ["Mocuba Sede", "Mugeba", "Namanjavira"],
  Chimoio: ["Centro", "7 de Abril", "Josina Machel", "Vila Nova", "Sossundenga", "Textáfrica", "Bairro 1", "Bairro 4", "Bairro 5"],
  Tete: ["Central", "Matundo", "Degue", "Mpadue", "Filipe Samuel Magaia", "Mateus Sansão Muthemba", "M'padue"],
  Moatize: ["Moatize Sede", "25 de Setembro", "Chipanga", "Kambulatsitsi"],
  Pemba: ["Cimento", "Paquitequete", "Natite", "Ingonane", "Alto Gingone", "Chuiba", "Eduardo Mondlane", "Mahate"],
  Montepuez: ["Montepuez Sede", "Nairoto", "Mapupulo"],
  XaiXai: ["Praia", "Inhamissa", "Patrice Lumumba", "Chongoene", "Marien Ngouabi", "Bairro 11", "Bairro 12"],
  "Xai-Xai": ["Praia", "Inhamissa", "Patrice Lumumba", "Chongoene", "Marien Ngouabi", "Bairro 11", "Bairro 12"],
  Inhambane: ["Balane", "Marrambone", "Conguiana", "Liberdade", "Muelé", "Sumburane"],
  Maxixe: ["Chambone", "Malanga", "Rumbana", "Bem-vindo", "Macuamene"],
  Lichinga: ["Central", "Sanjala", "Ceremónio", "Nomba", "Massenger", "Chiulugo"],
  Cuamba: ["Cuamba Sede", "Lúrio", "Etatare", "Mepessene"],
};

const zonas = {
  KaMpfumo: ["Zona Polana", "Zona Sommerschield", "Zona Centro", "Zona Baixa"],
  Nlhamankulu: ["Zona Chamanculo", "Zona Xipamanine", "Zona Aeroporto"],
  KaMaxakeni: ["Zona Mafalala", "Zona Maxaquene", "Zona Polana Caniço"],
  KaMavota: ["Zona Costa do Sol", "Zona Hulene", "Zona Mavalane"],
  KaMubukwana: ["Zona Zimpeto", "Zona Magoanine", "Zona Albazine"],
  Matola: ["Zona 01 · Matola", "Zona Machava", "Zona Liberdade", "Zona Tsalala"],
  Beira: ["Zona Ponta Gêa", "Zona Macuti", "Zona Munhava", "Zona Manga"],
  Nampula: ["Zona Central", "Zona Muatala", "Zona Muhala"],
  Quelimane: ["Zona Cimento", "Zona Icidua", "Zona Coalane"],
  Chimoio: ["Zona Centro", "Zona Textáfrica", "Zona Josina Machel"],
  Tete: ["Zona Central", "Zona Matundo", "Zona Degue"],
  Pemba: ["Zona Cimento", "Zona Paquitequete", "Zona Natite"],
  "Xai-Xai": ["Zona Praia", "Zona Inhamissa", "Zona Centro"],
};

const provincia = (nome, cidades) => ({
  provincia: nome,
  cidades: cidades.map((cidade) => ({
    nome: cidade,
    bairros: bairros[cidade] || ["Sede", "Centro", "Expansão", "Unidade"],
    zonas: zonas[cidade] || zonaBase,
  })),
});

export const LOCALIDADES = [
  provincia("Cidade de Maputo", ["KaMpfumo", "Nlhamankulu", "KaMaxakeni", "KaMavota", "KaMubukwana", "KaTembe", "KaNyaka"]),
  provincia("Maputo", ["Matola", "Boane", "Marracuene", "Manhiça", "Magude", "Moamba", "Namaacha", "Matutuíne"]),
  provincia("Gaza", ["Xai-Xai", "Chókwè", "Chibuto", "Manjacaze", "Bilene", "Chongoene", "Limpopo", "Guijá", "Massingir", "Mabalane", "Chicualacuala", "Chigubo", "Mapai", "Massangena"]),
  provincia("Inhambane", ["Inhambane", "Maxixe", "Vilankulo", "Massinga", "Morrumbene", "Homoíne", "Jangamo", "Inharrime", "Inhassoro", "Zavala", "Funhalouro", "Panda", "Govuro", "Mabote"]),
  provincia("Sofala", ["Beira", "Dondo", "Nhamatanda", "Gorongosa", "Búzi", "Caia", "Chemba", "Cheringoma", "Chibabava", "Machanga", "Marromeu", "Marínguè", "Muanza"]),
  provincia("Manica", ["Chimoio", "Gondola", "Manica", "Sussundenga", "Bárue", "Mossurize", "Vanduzi", "Macossa", "Machaze", "Guro", "Tambara"]),
  provincia("Tete", ["Tete", "Moatize", "Angónia", "Changara", "Cahora-Bassa", "Mutarara", "Chiuta", "Marávia", "Zumbo", "Macanga", "Tsangano", "Chifunde", "Dôa", "Marara", "Magoé"]),
  provincia("Zambézia", ["Quelimane", "Mocuba", "Gurué", "Alto Molócuè", "Milange", "Morrumbala", "Maganja da Costa", "Pebane", "Namacurra", "Nicoadala", "Ile", "Gilé", "Lugela", "Namarroi", "Mopeia", "Inhassunge", "Chinde", "Derre", "Luabo", "Molumbo", "Mulevala"]),
  provincia("Nampula", ["Nampula", "Nacala", "Angoche", "Ilha de Moçambique", "Monapo", "Mossuril", "Mogincual", "Moma", "Malema", "Ribaué", "Lalaua", "Mecubúri", "Murrupula", "Meconta", "Mogovolas", "Nacala-a-Velha", "Liúpo", "Larde", "Eráti", "Nacarôa", "Rapale", "Memba", "Muecate"]),
  provincia("Cabo Delgado", ["Pemba", "Montepuez", "Mocímboa da Praia", "Mueda", "Macomia", "Chiúre", "Ancuabe", "Balama", "Namuno", "Meluco", "Quissanga", "Palma", "Nangade", "Muidumbe", "Metuge", "Mecúfi", "Ibo"]),
  provincia("Niassa", ["Lichinga", "Cuamba", "Mandimba", "Mecanhelas", "Metarica", "Marrupa", "Majune", "Maúa", "N'gauma", "Lago", "Sanga", "Muembe", "Mavago", "Mecula", "Nipepe", "Chimbonila"]),
];

export const cidadesDaProvincia = (nome) => LOCALIDADES.find((p) => p.provincia === nome)?.cidades || [];

export const cidadeSeleccionada = (provinciaNome, cidadeNome) =>
  cidadesDaProvincia(provinciaNome).find((c) => c.nome === cidadeNome) || null;

const normalizar = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const corresponderProvincia = (texto) => {
  const alvo = normalizar(texto);
  if (!alvo) return "";
  if (alvo.includes("cidade") && alvo.includes("maputo")) return "Cidade de Maputo";
  return LOCALIDADES.find((p) => alvo.includes(normalizar(p.provincia)))?.provincia || "";
};

export const corresponderCidade = (provinciaNome, texto) => {
  const alvo = normalizar(texto);
  return cidadesDaProvincia(provinciaNome).find((c) => alvo.includes(normalizar(c.nome)) || normalizar(c.nome).includes(alvo))?.nome || "";
};
