/**
 * Configurações partilhadas de coberturas, matrículas e cálculo de prémios
 * (utilizadas em CriarCotacao e EditarCotacao).
 */

export const configCoberturas = {
  "Seguro Automóvel Responsabilidade Civil Apenas": {
    nome: "Seguro Automóvel Responsabilidade Civil Apenas",
    classificacoes: [
      { nome: "Ligeiro Peso Bruto Total Até 3.500 kg", taxa: 0, premioMinimo: 2999 },
      { nome: "Pesado Médio - Peso Bruto Total Entre 3.501 kg a 12.000 kg", taxa: 0, premioMinimo: 5999 },
      { nome: "Pesado Grande - Peso Bruto Total Entre 12.001 kg a 26.000 kg", taxa: 0, premioMinimo: 6999 },
      { nome: "Muito Pesado (articulado) - Acima de 26.000 kg (com reboque ou semi-reboque)", taxa: 0, premioMinimo: 8500 },
      { nome: "Viaturas Especias (Motorizadas)", taxa: 0, premioMinimo: 2500 },
      { nome: "Viaturas Especias (Atrelados Domesticos)", taxa: 0, premioMinimo: 2500 },
      { nome: "Viaturas Especias (Atrelados Comerciais)", taxa: 0, premioMinimo: 3000 },
    ],
    coberturas: {
      responsabilidadeCivil: 5000000,
      morteInvalidez: 0,
      despesasMedicas: 0,
      despesasFuneral: 0,
    },
  },
  "Seguro Automóvel Responsabilidade Civil & Ocupantes": {
    nome: "Seguro Automóvel Responsabilidade Civil & Ocupantes",
    classificacoes: [
      { nome: "Ligeiro Peso Bruto Total Até 3.500 kg", taxa: 0, premioMinimo: 3500 },
      { nome: "Pesado Médio - Peso Bruto Total Entre 3.501 kg a 12.000 kg", taxa: 0, premioMinimo: 6750 },
      { nome: "Pesado Grande - Peso Bruto Total Entre 12.001 kg a 26.000 kg", taxa: 0, premioMinimo: 6999 },
      { nome: "Muito Pesado (articulado) - Acima de 26.000 kg (com reboque ou semi-reboque)", taxa: 0, premioMinimo: 8500 },
    ],
    coberturas: {
      responsabilidadeCivil: 5000000,
      morteInvalidez: 100000,
      despesasMedicas: 20000,
      despesasFuneral: 5000,
    },
  },
  "Seguro de Transporte Público": {
    nome: "Seguro de Transporte Público",
    classificacoes: [
      { nome: "Lotação até 29 Passageiros (Incluindo Motorista e Cobrador)", taxa: 0, premioMinimo: 15750 },
      { nome: "Lotação até 15 Passageiros (Incluindo Motorista e Cobrador)", taxa: 0, premioMinimo: 9250 },
      { nome: "Taxis / Yango", taxa: 0, premioMinimo: 5000 },
    ],
    coberturas: {
      responsabilidadeCivil: 10000000,
      morteInvalidez: 150000,
      despesasMedicas: 50000,
      despesasFuneral: 10000,
    },
  },
  "Seguro Automóvel Todos os Riscos": {
    nome: "Seguro Automóvel Todos os Riscos",
    classificacoes: [
      { nome: "Ligeiro Peso Bruto Total Até 3.500 kg", taxa: 0.04, premioMinimo: 12000 },
      { nome: "Pesado Médio - Peso Bruto Total Entre 3.501 kg a 12.000 kg", taxa: 0.05, premioMinimo: 12000 },
      { nome: "Pesado Grande - Peso Bruto Total Entre 12.001 kg a 26.000 kg", taxa: 0.06, premioMinimo: 12000 },
      { nome: "Muito Pesado (articulado) - Acima de 26.000 kg (com reboque ou semi-reboque)", taxa: 0.075, premioMinimo: 15000 },
      { nome: "Ligeiro Matrícula Estrangeira (Ligeiro Peso Bruto Total Até 3.500 kg)", taxa: 0.045, premioMinimo: 12000 },
      { nome: "Viaturas Especias (Motorizadas)", taxa: 0.03, premioMinimo: 8000 },
      { nome: "Viaturas Especias (Atrelados Domesticos)", taxa: 0.025, premioMinimo: 8000 },
      { nome: "Viaturas Especias (Atrelados Comerciais)", taxa: 0.03, premioMinimo: 8000 },
      { nome: "Txopelas", taxa: 0.04, premioMinimo: 10000 },
    ],
    coberturas: {
      responsabilidadeCivil: 10000000,
      morteInvalidez: 250000,
      despesasMedicas: 100000,
      despesasFuneral: 25000,
      perdaChaves: 55000,
      remocaoSalvados: 75000,
      danosProprios: "Cobertura Completa",
    },
  },
};

/** Tipos de cobertura legados (cotações antigas) */
const LEGACY_TIPO_COBERTURA = {
  DP_NORMAL: "Seguro Automóvel Todos os Riscos",
  DP_SEM_FRANQUIA: "Seguro Automóvel Todos os Riscos",
  RC_NORMAL: "Seguro Automóvel Responsabilidade Civil Apenas",
  RC_OCUPANTES: "Seguro Automóvel Responsabilidade Civil & Ocupantes",
};

export const TIPOS_COBERTURA_OPCOES = Object.keys(configCoberturas);

export const titulosContato = ["Sr.", "Sra.", "Dr.", "Dra.", "Eng.", "Arq."];

export const paises = [
  { code: "MZ", name: "Moçambique", flag: "🇲🇿" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "CV", name: "Cabo Verde", flag: "🇨🇻" },
];

export const formatosMatricula = {
  Moçambique: {
    formato: "XXX-000-XX",
    exemplo: "ABC-123-DE",
    regex: /^[A-Z]{3}-[0-9]{3}-[A-Z]{2}$/,
    placeholder: "ABC-123-DE",
    descricao: "3 letras, 3 números, 2 letras",
    mascara: (valor) => {
      let v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (v.length > 8) v = v.substring(0, 8);
      let result = "";
      for (let i = 0; i < v.length; i++) {
        if (i === 3 || i === 6) result += "-";
        if (i < 3) result += /[A-Z]/.test(v[i]) ? v[i] : "";
        else if (i < 6) result += /[0-9]/.test(v[i]) ? v[i] : "";
        else result += /[A-Z]/.test(v[i]) ? v[i] : "";
      }
      return result;
    },
  },
  "África do Sul": {
    formato: "XXX-000-GP",
    exemplo: "ABC-123-GP",
    regex: /^[A-Z]{3}-[0-9]{3}-(GP|EC|FS|KZN|MP|NC|NW|WC)$/,
    placeholder: "ABC-123-GP",
    descricao: "3 letras, 3 números, código província",
    mascara: (valor) => {
      let v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (v.length > 9) v = v.substring(0, 9);
      let result = "";
      for (let i = 0; i < v.length; i++) {
        if (i === 3 || i === 6) result += "-";
        if (i < 3) result += /[A-Z]/.test(v[i]) ? v[i] : "";
        else if (i < 6) result += /[0-9]/.test(v[i]) ? v[i] : "";
        else result += /[A-Z]/.test(v[i]) ? v[i] : "";
      }
      return result;
    },
  },
  "KZN (KwaZulu-Natal)": {
    formato: "XXX-000-ZN",
    exemplo: "ABC-123-ZN",
    regex: /^[A-Z]{3}-[0-9]{3}-ZN$/,
    placeholder: "ABC-123-ZN",
    descricao: "3 letras, 3 números, ZN",
    mascara: (valor) => {
      let v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (v.length > 8) v = v.substring(0, 8);
      let result = "";
      for (let i = 0; i < v.length; i++) {
        if (i === 3 || i === 6) result += "-";
        if (i < 3) result += /[A-Z]/.test(v[i]) ? v[i] : "";
        else if (i < 6) result += /[0-9]/.test(v[i]) ? v[i] : "";
        else result += /[A-Z]/.test(v[i]) ? v[i] : "";
      }
      if (result.length === 8 && !result.endsWith("ZN")) {
        result = result.substring(0, 7) + "Z";
      }
      return result;
    },
  },
  "Antiga (CA)": {
    formato: "CA-00000",
    exemplo: "CA-12345",
    regex: /^CA-[0-9]{5}$/,
    placeholder: "CA-12345",
    descricao: "CA seguido de 5 números",
    mascara: (valor) => {
      let v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (v.length > 7) v = v.substring(0, 7);
      let result = "";
      if (v.startsWith("CA")) {
        result = "CA-";
        v = v.substring(2);
      } else if (v.startsWith("C")) {
        result = "C";
        v = v.substring(1);
      }
      for (let i = 0; i < v.length && i < 5; i++) {
        result += /[0-9]/.test(v[i]) ? v[i] : "";
      }
      if (result.startsWith("C") && !result.startsWith("CA-")) {
        result = "CA-" + result.substring(1);
      } else if (!result.startsWith("CA-")) {
        result = "CA-" + result;
      }
      return result;
    },
  },
  "Eswatini (Suazilândia)": {
    formato: "XSD-000-YZ",
    exemplo: "XSD-123-YZ",
    regex: /^XSD-[0-9]{3}-[A-Z]{2}$/,
    placeholder: "XSD-123-YZ",
    descricao: "XSD, 3 números, 2 letras",
    mascara: (valor) => {
      let v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (v.length > 8) v = v.substring(0, 8);
      let result = "";
      if (v.startsWith("XSD")) {
        result = "XSD-";
        v = v.substring(3);
      }
      for (let i = 0; i < v.length; i++) {
        if (i === 3) result += "-";
        if (i < 3) result += /[0-9]/.test(v[i]) ? v[i] : "";
        else result += /[A-Z]/.test(v[i]) ? v[i] : "";
      }
      if (!result.startsWith("XSD-")) result = "XSD-" + result;
      return result;
    },
  },
  Zimbábue: {
    formato: "XXX-0000",
    exemplo: "ABC-1234",
    regex: /^[A-Z]{3}-[0-9]{4}$/,
    placeholder: "ABC-1234",
    descricao: "3 letras, 4 números",
    mascara: (valor) => {
      let v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (v.length > 7) v = v.substring(0, 7);
      let result = "";
      for (let i = 0; i < v.length; i++) {
        if (i === 3) result += "-";
        if (i < 3) result += /[A-Z]/.test(v[i]) ? v[i] : "";
        else result += /[0-9]/.test(v[i]) ? v[i] : "";
      }
      return result;
    },
  },
  Malawi: {
    formato: "XX-0000",
    exemplo: "AB-1234",
    regex: /^[A-Z]{2}-[0-9]{4}$/,
    placeholder: "AB-1234",
    descricao: "2 letras, 4 números",
    mascara: (valor) => {
      let v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (v.length > 6) v = v.substring(0, 6);
      let result = "";
      for (let i = 0; i < v.length; i++) {
        if (i === 2) result += "-";
        if (i < 2) result += /[A-Z]/.test(v[i]) ? v[i] : "";
        else result += /[0-9]/.test(v[i]) ? v[i] : "";
      }
      return result;
    },
  },
  Zâmbia: {
    formato: "XXX-000",
    exemplo: "ABC-123",
    regex: /^[A-Z]{3}-[0-9]{3}$/,
    placeholder: "ABC-123",
    descricao: "3 letras, 3 números",
    mascara: (valor) => {
      let v = valor.replace(/[^A-Z0-9]/gi, "").toUpperCase();
      if (v.length > 6) v = v.substring(0, 6);
      let result = "";
      for (let i = 0; i < v.length; i++) {
        if (i === 3) result += "-";
        if (i < 3) result += /[A-Z]/.test(v[i]) ? v[i] : "";
        else result += /[0-9]/.test(v[i]) ? v[i] : "";
      }
      return result;
    },
  },
  Outros: {
    formato: "Livre",
    exemplo: "Qualquer formato",
    regex: /^.+$/,
    placeholder: "Digite a matrícula",
    descricao: "Formato livre",
    mascara: (valor) => valor.toUpperCase(),
  },
};

function normalizarTexto(valor) {
  return String(valor ?? "").trim();
}

export function normalizarTipoCobertura(tipo) {
  const t = normalizarTexto(tipo);
  if (!t) return "";
  if (configCoberturas[t]) return t;
  if (LEGACY_TIPO_COBERTURA[t]) return LEGACY_TIPO_COBERTURA[t];

  const porChave = Object.keys(configCoberturas).find(
    (k) => k.toLowerCase() === t.toLowerCase(),
  );
  if (porChave) return porChave;

  return t;
}

/**
 * Corresponde a classificação guardada à opção exacta do formulário.
 */
export function normalizarClassificacao(tipoCobertura, classificacao, tipoViatura = "") {
  const tipo = normalizarTipoCobertura(tipoCobertura);
  const classes = getClassificacoesDisponiveis(tipo);
  const valor = normalizarTexto(classificacao);

  if (valor && classes.length) {
    const exacta = classes.find((c) => c.nome === valor);
    if (exacta) return exacta.nome;

    const insensitive = classes.find(
      (c) => c.nome.toLowerCase() === valor.toLowerCase(),
    );
    if (insensitive) return insensitive.nome;

    const parcial = classes.find(
      (c) =>
        c.nome.toLowerCase().includes(valor.toLowerCase()) ||
        valor.toLowerCase().includes(c.nome.toLowerCase()),
    );
    if (parcial) return parcial.nome;
  }

  return inferirClassificacaoLegada(tipo, tipoViatura) || valor;
}

/**
 * Inferência para cotações antigas sem classificação guardada (ex.: só tipo_viatura Ligeiro/Pesado).
 */
export function inferirClassificacaoLegada(tipoCobertura, tipoViatura) {
  const tipo = normalizarTipoCobertura(tipoCobertura);
  const classes = getClassificacoesDisponiveis(tipo);
  if (!classes.length) return "";

  const tv = normalizarTexto(tipoViatura);
  if (!tv) return "";

  if (tv === "Ligeiro") {
    return (
      classes.find((c) => /ligeiro/i.test(c.nome) && !/estrangeira/i.test(c.nome))?.nome ||
      classes[0]?.nome ||
      ""
    );
  }

  if (tv === "Pesado") {
    return (
      classes.find((c) => /pesado médio/i.test(c.nome))?.nome ||
      classes.find((c) => /pesado/i.test(c.nome))?.nome ||
      classes[0]?.nome ||
      ""
    );
  }

  return "";
}

export function getClassificacoesDisponiveis(tipoCobertura) {
  const tipo = normalizarTipoCobertura(tipoCobertura);
  if (!tipo || !configCoberturas[tipo]) return [];
  return configCoberturas[tipo].classificacoes;
}

export function getClassificacaoConfig(tipoCobertura, classificacao) {
  const tipo = normalizarTipoCobertura(tipoCobertura);
  const classificacaoNorm = normalizarClassificacao(tipo, classificacao);
  if (!tipo || !classificacaoNorm || !configCoberturas[tipo]) return null;
  return (
    configCoberturas[tipo].classificacoes.find((c) => c.nome === classificacaoNorm) ||
    null
  );
}

export function getTaxaPadrao(tipoCobertura, classificacao) {
  const cfg = getClassificacaoConfig(tipoCobertura, classificacao);
  return cfg ? Number(cfg.taxa) : 0;
}

export const TIPO_COBERTURA_TODOS_RISCOS = "Seguro Automóvel Todos os Riscos";

export function exigeCapitalSeguro(tipoCobertura) {
  return normalizarTipoCobertura(tipoCobertura) === TIPO_COBERTURA_TODOS_RISCOS;
}

/** Semestral, trimestral e mensal só se aplicam a Seguro Automóvel Todos os Riscos */
export function deveMostrarSemestral(tipoCobertura) {
  return exigeCapitalSeguro(tipoCobertura);
}

export function deveMostrarTrimestral(capitalSeguro, tipoCobertura, premioAnnual) {
  if (!exigeCapitalSeguro(tipoCobertura)) return false;
  return (parseFloat(capitalSeguro) || 0) > 12000;
}

export function deveMostrarMensal(capitalSeguro, debitoDireto, tipoCobertura, premioAnnual) {
  if (!debitoDireto) return false;
  return deveMostrarTrimestral(capitalSeguro, tipoCobertura, premioAnnual);
}

/** Linhas HTML de prémios para PDF/email, conforme tipo de cobertura */
export function gerarLinhasPremioVeiculoHtml(v, debitoDiretoAtivo, fmtMoeda) {
  const tipo = v.tipoCobertura;
  const capital = v.capitalSeguro;
  const premioAnnual = v.premioAnnual;
  let html = `
    <tr><td><strong>Prémio Anual (MT)</strong></td><td class="text-right">MT ${fmtMoeda(v.premioAnnual)}</td></tr>`;

  if (deveMostrarSemestral(tipo)) {
    html += `
    <tr><td><strong>Prémio Semestral (MT)</strong></td><td class="text-right">MT ${fmtMoeda(v.premioSemestral)}</td></tr>`;
    if (deveMostrarTrimestral(capital, tipo, premioAnnual)) {
      html += `
    <tr><td><strong>Prémio Trimestral (MT)</strong></td><td class="text-right">MT ${fmtMoeda(v.premioTrimestral)}</td></tr>`;
    }
    if (deveMostrarMensal(capital, debitoDiretoAtivo, tipo, premioAnnual)) {
      html += `
    <tr><td><strong>Prémio Mensal (MT)</strong></td><td class="text-right">MT ${fmtMoeda(v.premioMensal)}</td></tr>`;
    }
  }

  html += `
    <tr><td><strong>Prémio Mínimo (MT)</strong></td><td class="text-right">MT ${fmtMoeda(v.premioMinimo)}</td></tr>`;

  return html;
}

export function calcularPremioVeiculo({
  capitalSeguro,
  tipoCobertura,
  classificacao,
  debitoDiretoAtivo = false,
}) {
  const tipo = normalizarTipoCobertura(tipoCobertura);
  const classificacaoConfig = getClassificacaoConfig(tipo, classificacao);
  const capitalObrigatorio = exigeCapitalSeguro(tipo);
  const capital = parseFloat(capitalSeguro) || 0;

  if (!classificacaoConfig) {
    return {
      taxa: 0,
      premioAnnual: "0.00",
      premioSemestral: "0.00",
      premioTrimestral: "0.00",
      premioMensal: "0.00",
      premioMinimo: 0,
      taxaAplicada: "0%",
    };
  }

  if (capitalObrigatorio && capital === 0) {
    return {
      taxa: classificacaoConfig.taxa,
      premioAnnual: "0.00",
      premioSemestral: "0.00",
      premioTrimestral: "0.00",
      premioMensal: "0.00",
      premioMinimo: classificacaoConfig.premioMinimo || 0,
      taxaAplicada: "0%",
    };
  }

  const taxa = classificacaoConfig.taxa;
  let taxaAplicada =
    capitalObrigatorio && taxa > 0
      ? `${(taxa * 100).toFixed(2)}%`
      : "Taxa Fixa";

  const premioMinimo = classificacaoConfig.premioMinimo || 0;
  let premioCalculado = capitalObrigatorio
    ? capital * taxa
    : premioMinimo;
  let premioFinal = capitalObrigatorio
    ? Math.max(premioCalculado, premioMinimo)
    : premioCalculado;
  let premioSemestral = (premioFinal / 2).toFixed(2);

  const mostrarTrimestral = deveMostrarTrimestral(capital, tipo, premioFinal);
  let premioTrimestral = mostrarTrimestral ? (premioFinal / 4).toFixed(2) : "0.00";

  const mostrarMensal = deveMostrarMensal(capital, debitoDiretoAtivo, tipo, premioFinal);
  let premioMensal = mostrarMensal ? (premioFinal / 12).toFixed(2) : "0.00";

  if (debitoDiretoAtivo) {
    premioFinal *= 1.15;
    premioSemestral = (premioFinal / 2).toFixed(2);
    if (mostrarTrimestral) premioTrimestral = (premioFinal / 4).toFixed(2);
    if (mostrarMensal) premioMensal = (premioFinal / 12).toFixed(2);
    taxaAplicada = capitalObrigatorio && taxa > 0
      ? `${(taxa * 100).toFixed(2)}% + 15% (Débito Direto)`
      : "Taxa Fixa + 15% (Débito Direto)";
  }

  return {
    taxa: capitalObrigatorio ? taxa : 0,
    premioAnnual: premioFinal.toFixed(2),
    premioSemestral,
    premioTrimestral,
    premioMensal,
    premioMinimo,
    taxaAplicada,
  };
}

/** Recalcular prémios com taxa personalizada (edição pelo agente) */
export function calcularPremioComTaxaCustom({
  capitalSeguro,
  tipoCobertura,
  classificacao,
  taxaCustom,
  debitoDiretoAtivo = false,
}) {
  const tipo = normalizarTipoCobertura(tipoCobertura);
  const classificacaoConfig = getClassificacaoConfig(tipo, classificacao);
  const capitalObrigatorio = exigeCapitalSeguro(tipo);
  const capital = parseFloat(capitalSeguro) || 0;
  const taxa = parseFloat(taxaCustom);

  if (!classificacaoConfig || Number.isNaN(taxa)) {
    return calcularPremioVeiculo({
      capitalSeguro,
      tipoCobertura,
      classificacao,
      debitoDiretoAtivo,
    });
  }

  if (capitalObrigatorio && capital === 0) {
    return {
      taxa,
      premioAnnual: "0.00",
      premioSemestral: "0.00",
      premioTrimestral: "0.00",
      premioMensal: "0.00",
      premioMinimo: classificacaoConfig.premioMinimo || 0,
      taxaAplicada: `${(taxa * 100).toFixed(2)}%`,
    };
  }

  const premioMinimo = classificacaoConfig.premioMinimo || 0;
  let premioCalculado = capitalObrigatorio ? capital * taxa : premioMinimo;
  let premioFinal = capitalObrigatorio
    ? Math.max(premioCalculado, premioMinimo)
    : premioCalculado;
  let premioSemestral = (premioFinal / 2).toFixed(2);

  const mostrarTrimestral = deveMostrarTrimestral(capital, tipo, premioFinal);
  let premioTrimestral = mostrarTrimestral ? (premioFinal / 4).toFixed(2) : "0.00";

  const mostrarMensal = deveMostrarMensal(capital, debitoDiretoAtivo, tipo, premioFinal);
  let premioMensal = mostrarMensal ? (premioFinal / 12).toFixed(2) : "0.00";

  let taxaAplicada =
    capitalObrigatorio && taxa > 0
      ? `${(taxa * 100).toFixed(2)}%`
      : "Taxa Fixa";

  if (debitoDiretoAtivo) {
    premioFinal *= 1.15;
    premioSemestral = (premioFinal / 2).toFixed(2);
    if (mostrarTrimestral) premioTrimestral = (premioFinal / 4).toFixed(2);
    if (mostrarMensal) premioMensal = (premioFinal / 12).toFixed(2);
    taxaAplicada = capitalObrigatorio && taxa > 0
      ? `${(taxa * 100).toFixed(2)}% + 15% (Débito Direto)`
      : "Taxa Fixa + 15% (Débito Direto)";
  }

  return {
    taxa: capitalObrigatorio ? taxa : 0,
    premioAnnual: premioFinal.toFixed(2),
    premioSemestral,
    premioTrimestral,
    premioMensal,
    premioMinimo,
    taxaAplicada,
  };
}

export function extrairPaisMatricula(matriculaCompleta, matricula, paisSalvo) {
  if (paisSalvo) {
    return { paisMatricula: paisSalvo, matricula: matricula || "" };
  }
  if (matriculaCompleta && matriculaCompleta.includes(" — ")) {
    const [pais, placa] = matriculaCompleta.split(" — ");
    return { paisMatricula: pais.trim(), matricula: (placa || matricula || "").trim() };
  }
  if (matricula) {
    return { paisMatricula: "Moçambique", matricula };
  }
  return { paisMatricula: "", matricula: matricula || "" };
}

export function formatarMatriculaValor(valor, paisMatricula) {
  if (!paisMatricula || paisMatricula === "Outros") return (valor || "").toUpperCase();
  const formato = formatosMatricula[paisMatricula];
  if (!formato?.mascara) return (valor || "").toUpperCase();
  return formato.mascara(valor);
}

export function validarMatriculaValor(matricula, paisMatricula) {
  if (!matricula || !paisMatricula || paisMatricula === "Outros") return true;
  const formato = formatosMatricula[paisMatricula];
  if (!formato?.regex) return true;
  return formato.regex.test(matricula);
}

export function criarVeiculoVazio() {
  return {
    id: Date.now() + Math.random(),
    marca: "",
    modelo: "",
    marcaModelo: "",
    matricula: "",
    matriculaCompleta: "",
    paisMatricula: "",
    ano: "",
    motor: "",
    chassis: "",
    lotacao: "",
    tipoCobertura: "",
    classificacao: "",
    capitalSeguro: "",
    taxa: "",
    taxaAplicada: "",
    premioAnnual: "",
    premioSemestral: "",
    premioTrimestral: "",
    premioMensal: "",
    premioMinimo: "",
  };
}

export function mapearVeiculoDoBackend(veiculo, opcoes = {}) {
  const { debitoDiretoAtivo = false } = opcoes;

  const tipoCoberturaRaw =
    veiculo.tipo_cobertura ?? veiculo.tipoCobertura ?? "";
  const classificacaoRaw =
    veiculo.classificacao ?? veiculo.classificacaoNome ?? "";
  const tipoViatura =
    veiculo.tipo_viatura ?? veiculo.tipoViatura ?? "";

  const tipoCobertura = normalizarTipoCobertura(tipoCoberturaRaw);
  const classificacao = normalizarClassificacao(
    tipoCobertura,
    classificacaoRaw,
    tipoViatura,
  );

  const { paisMatricula, matricula } = extrairPaisMatricula(
    veiculo.matricula_completa ?? veiculo.matriculaCompleta,
    veiculo.matricula,
    veiculo.pais_matricula ?? veiculo.paisMatricula,
  );

  const capitalSeguro =
    veiculo.capital_seguro ?? veiculo.capitalSeguro ?? "";

  const base = {
    id: veiculo.id || Date.now() + Math.random(),
    marca: veiculo.marca || "",
    modelo: veiculo.modelo || "",
    marcaModelo:
      veiculo.marca_modelo ||
      veiculo.marcaModelo ||
      `${veiculo.marca || ""} ${veiculo.modelo || ""}`.trim(),
    matricula,
    matriculaCompleta: veiculo.matricula_completa || veiculo.matriculaCompleta || matricula,
    paisMatricula,
    ano: veiculo.ano || "",
    motor: veiculo.numero_motor || veiculo.motor || "",
    chassis: veiculo.numero_chassi || veiculo.chassis || "",
    lotacao: veiculo.lotacao || "",
    tipoViatura,
    tipoCobertura,
    classificacao,
    capitalSeguro,
    taxa: veiculo.taxa ?? "",
    taxaAplicada: veiculo.taxaAplicada || (veiculo.taxa
      ? `${(parseFloat(veiculo.taxa) * 100).toFixed(2)}%`
      : ""),
    premioAnnual: veiculo.premio_anual ?? veiculo.premioAnnual ?? "",
    premioSemestral: veiculo.premio_semestral ?? veiculo.premioSemestral ?? "",
    premioTrimestral: veiculo.premio_trimestral ?? veiculo.premioTrimestral ?? "",
    premioMensal: veiculo.premio_mensal ?? veiculo.premioMensal ?? "",
    premioMinimo: veiculo.premio_minimo ?? veiculo.premioMinimo ?? "",
  };

  if (tipoCobertura && classificacao) {
    const precisaCapital = exigeCapitalSeguro(tipoCobertura);
    const taxaArmazenada = veiculo.taxa != null && veiculo.taxa !== "";
    const temPremioArmazenado = veiculo.premio_anual != null || veiculo.premioAnnual != null;

    if (taxaArmazenada && temPremioArmazenado) {
      const taxaNum = parseFloat(veiculo.taxa) || 0;
      base.taxa = taxaNum;
      base.taxaAplicada = taxaNum > 0
        ? `${(taxaNum * 100).toFixed(2)}%`
        : (base.taxaAplicada || "Taxa Fixa");
    } else if (!precisaCapital || (capitalSeguro !== "" && capitalSeguro != null)) {
      const calc = calcularPremioVeiculo({
        capitalSeguro: precisaCapital ? capitalSeguro : "",
        tipoCobertura,
        classificacao,
        debitoDiretoAtivo,
      });
      Object.assign(base, calc);
    }
  }

  return base;
}
