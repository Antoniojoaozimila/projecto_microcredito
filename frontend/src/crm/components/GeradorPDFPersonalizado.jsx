// src/components/GeradorPDFPersonalizado.jsx
import React from "react";
import logoSrc from "../assets/logo.png";
import { lerMarca } from "../../services/marcaSistema";
import timbradoSrc from "../assets/papel-timbrado.png";
import { gerarLinhasPremioVeiculoHtml } from "../utils/cotacaoCoberturas";

/**
 * Carrega uma imagem por URL e devolve como Data URL (base64) para o HTML ser autocontido (visualização/download).
 * @param {string} url - URL da imagem (ex: origin + /assets/logo.png)
 * @returns {Promise<string>} data:image/...;base64,... ou ''
 */
async function fetchImageAsDataUrl(url) {
  if (!url || typeof url !== "string") return "";
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return "";
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Erro ao carregar imagem para PDF:", url, e?.message);
    return "";
  }
}

/**
 * Obtém as URLs do logo e do timbrado a partir dos imports (Vite).
 */
function getLogoAndTimbradoPaths(origin) {
  const logoPath =
    typeof logoSrc === "string"
      ? logoSrc
      : logoSrc && typeof logoSrc === "object" && logoSrc.default
        ? logoSrc.default
        : "";
  const timbradoPath =
    typeof timbradoSrc === "string"
      ? timbradoSrc
      : timbradoSrc && typeof timbradoSrc === "object" && timbradoSrc.default
        ? timbradoSrc.default
        : "";
  const fullLogoUrl = logoPath
    ? String(logoPath).startsWith("http")
      ? logoPath
      : (origin || "") + logoPath
    : "";
  const fullTimbradoUrl = timbradoPath
    ? String(timbradoPath).startsWith("http")
      ? timbradoPath
      : (origin || "") + timbradoPath
    : "";
  return { fullLogoUrl, fullTimbradoUrl };
}

/**
 * Formata o campo "Agência / Agente" com base no agente que criou a cotação.
 */
function formatarAgenciaAgente(cotacao) {
  if (!cotacao || typeof cotacao !== "object") return "MAPUTO / N/A";
  const agencia = String(
    cotacao.agenteBalcao || cotacao.agente_balcao || cotacao.balcao || "",
  ).trim();
  const agente = String(
    cotacao.agenteNome || cotacao.agente_nome || cotacao.agente || "",
  ).trim();
  if (agencia && agente) return `${agencia} / ${agente}`;
  if (agencia) return agencia;
  if (agente) return agente;
  return "MAPUTO / N/A";
}

/**
 * Gera HTML da cotação para PDF com template A4, logo Imperial, papel timbrado como marca de água.
 * @param {Object} cotacao - Dados da cotação (cliente, veiculos, totalPremio, etc.)
 * @param {string} origin - Origem da aplicação (ex: window.location.origin) para carregar logo e timbrado
 * @param {string} logoUrl - URL do logo (opcional)
 * @param {string} timbradoUrl - URL do papel timbrado (opcional)
 */
export const gerarHTMLCotacaoPersonalizado = (
  cotacao,
  origin = "",
  logoUrl = "",
  timbradoUrl = "",
) => {
  if (!cotacao || typeof cotacao !== "object") {
    throw new Error("Dados da cotação inválidos");
  }
  const totalPremio = Number(cotacao.totalPremio) || 0;
  const dataInicio = new Date(
    cotacao.dataCriacao || cotacao.dataInicio || Date.now(),
  );
  const dataFim = new Date(dataInicio);
  dataFim.setFullYear(dataFim.getFullYear() + 1);
  const dataValidadeFim = new Date(dataInicio);
  dataValidadeFim.setDate(dataValidadeFim.getDate() + 30);

  const premioBase = totalPremio * 0.84;
  const custosAdmin = totalPremio * 0.12;
  const sobreTaxa = totalPremio * 0.02;
  const impostoSelo = totalPremio * 0.02;

  const c = cotacao.cliente || {};
  const tipoCliente = c.tipo || "Particular";
  const isEmpresarial = tipoCliente === "Empresarial";

  const logoPath =
    typeof logoSrc === "string"
      ? logoSrc
      : logoSrc && typeof logoSrc === "object" && logoSrc.default
        ? logoSrc.default
        : "";
  const timbradoPath =
    typeof timbradoSrc === "string"
      ? timbradoSrc
      : timbradoSrc && typeof timbradoSrc === "object" && timbradoSrc.default
        ? timbradoSrc.default
        : "";
  const resolvedLogoUrl =
    logoUrl ||
    (logoPath
      ? String(logoPath).startsWith("http")
        ? logoPath
        : (origin || "") + logoPath
      : "");
  const resolvedTimbradoUrl =
    timbradoUrl ||
    (timbradoPath
      ? String(timbradoPath).startsWith("http")
        ? timbradoPath
        : (origin || "") + timbradoPath
      : "");

  const bancos = [
    {
      nome: "ACCESS BANK",
      contaMZN: "3805960110",
      nibMZN: "0066000603805 96011071",
      contaUSD: "3805960211",
      nibUSD: "0013000603805 96021136",
      contaZAR: "3805960313",
      nibZAR: "0013000603805 96031321",
    },
    {
      nome: "BCI",
      contaMZN: "1430858651000 1",
      nibMZN: "0008000043085 86510195",
      contaUSD: "1430858651000 2",
      nibUSD: "0008000043085 86510292",
      contaZAR: "1430858651000 3",
      nibZAR: "0008000043085 86510389",
    },
    {
      nome: "Ecobank",
      contaMZN: "5575000017081",
      nibMZN: "0023001557500 01708191",
      contaUSD: "",
      nibUSD: "",
      contaZAR: "",
      nibZAR: "",
    },
    {
      nome: "MILLENNIUM BIM",
      contaMZN: "330446409",
      nibMZN: "0001000000330 44640957",
      contaUSD: "330503930",
      nibUSD: "0001000000330 50393057",
      contaZAR: "330449610",
      nibZAR: "0001000000330 44961057",
    },
    {
      nome: "MOZABANCO",
      contaMZN: "820478810001",
      nibMZN: "0034000008204 78810165",
      contaUSD: "820478815001",
      nibUSD: "0034000008204 78815112",
      contaZAR: "820478815209",
      nibZAR: "0034000008204 78815209",
    },
    {
      nome: "MPESA",
      contaMZN: "905000",
      nibMZN: "905000",
      contaUSD: "905000",
      nibUSD: "905000",
      contaZAR: "905000",
      nibZAR: "905000",
    },
    {
      nome: "STANDARD BANK",
      contaMZN: "1256457681001",
      nibMZN: "0003012506457 68100167",
      contaUSD: "1256457681017",
      nibUSD: "0003012506457 68101719",
      contaZAR: "1256457681028",
      nibZAR: "0003012506457 68102883",
    },
  ];

  const veiculosList = Array.isArray(cotacao.veiculos) ? cotacao.veiculos : [];
  const primeiroVeiculo = veiculosList[0] || {};

  const fmt = (val, def = "–") => {
    if (val == null) return def;
    const s = typeof val === "string" ? val : String(val);
    return s.trim() !== "" ? s.trim() : def;
  };
  const fmtMoeda = (n) => {
    const num = Number(n);
    if (Number.isNaN(num)) return "0,00";
    return num.toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const fmtData = (d) => {
    if (d == null) return "–";
    try {
      const date = new Date(d);
      return Number.isNaN(date.getTime())
        ? "–"
        : date.toLocaleDateString("pt-MZ");
    } catch (_) {
      return "–";
    }
  };

  const debitoDiretoAtivo = Boolean(cotacao.debitoDireto);
  const agenciaAgenteTexto = formatarAgenciaAgente(cotacao);

  const headerComLogo = (tituloSecao) => `
    <div class="header-pdf">
      ${resolvedLogoUrl ? `<img src="${resolvedLogoUrl}" alt="" class="logo-img" />` : ""}
      ${tituloSecao ? `<div class="titulo-cotacao">${tituloSecao}</div>` : ""}
    </div>`;

  const headerPagina1 = `
    <div class="header-pdf header-pagina1">
      ${resolvedLogoUrl ? `<img src="${resolvedLogoUrl}" alt="" class="logo-img" />` : ""}
      <div class="empresa"></div>
      <div class="titulo-doc">Cotação de Seguro</div>
      <div class="titulo-cotacao">Documento Oficial Nº ${cotacao.id}</div>
      <div class="validade-box">Válida por 30 dias a partir de ${fmtData(dataInicio)} (até ${fmtData(dataValidadeFim)})</div>
    </div>`;

  const rodapeHtml = `
    <div class="rodape">
      <div class="rodape-sede">Av. Kenneth Kaunda, N°806 (Sede) | Maputo - Moçambique</div>
      <div class="rodape-contacto">+258 21 610 110 | Nuit: 400626091 | info@imperialinsurance-mz.com</div>
      <div class="rodape-provincias">Matola: 86 988 4352 | Xai-Xai: 86 526 8473 | Maxixe: 876564719 | Manica: 879236595 | Tete: 87 735 1111 | Angónia: 870903788 | Zambézia: 868353277 | Nacala: 867452328 | Nampula: 866270729 | Niassa: 862251571 | Cabo Delgado: 871648028 / 878251111</div>
    </div>`;

  const htmlClientesParticular = `
    <table class="tabela-box">
      <thead><tr><th colspan="2">Dados do Cliente (Pessoa Singular)</th></tr></thead>
      <tbody>
        <tr><td width="35%"><strong>Nome completo</strong></td><td>${fmt(c.tituloContato)} ${fmt(c.primeiroNome)} ${fmt(c.sobrenome)}</td></tr>
        <tr><td><strong>B.I.</strong></td><td>Bilhete de Identidade</td></tr>
        <tr><td><strong>Número de B.I.</strong></td><td>${fmt(c.numeroDocumento)}</td></tr>
        <tr><td><strong>NUIT</strong></td><td>${fmt(c.numeroDocumento)}</td></tr>
        <tr><td><strong>Morada</strong></td><td>${fmt(c.morada)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${fmt(c.email)}</td></tr>
        <tr><td><strong>Telefone</strong></td><td>${fmt(c.telefone)}</td></tr>
        <tr><td><strong>Data de nascimento</strong></td><td>${fmtData(c.dataNascimento)}</td></tr>
        <tr><td><strong>Nacionalidade</strong></td><td>${fmt(c.nacionalidade)}</td></tr>
      </tbody>
    </table>`;

  const htmlClientesEmpresarial = `
    <table class="tabela-box">
      <thead><tr><th colspan="2">Dados do Cliente (Empresa)</th></tr></thead>
      <tbody>
        <tr><td width="35%"><strong>Nome da empresa</strong></td><td>${fmt(c.nomeEmpresa)}</td></tr>
        <tr><td><strong>Número de referência fiscal (NUIT)</strong></td><td>${fmt(c.numeroReferenciaFiscal)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${fmt(c.email)}</td></tr>
        <tr><td><strong>Telefone</strong></td><td>${fmt(c.telefone)}</td></tr>
        <tr><td><strong>Morada</strong></td><td>${fmt(c.morada)}</td></tr>
      </tbody>
    </table>`;

  const tabelaUmVeiculo = (v, idx) => `
    <table class="tabela-box tabela-veiculo">
      <thead><tr><th colspan="2">Dados do Veículo ${veiculosList.length > 1 ? idx + 1 : ""}</th></tr></thead>
      <tbody>
        <tr><td width="35%"><strong>Matrícula</strong></td><td>${fmt(v.matriculaCompleta || v.matricula, "Por atribuir")}</td></tr>
        <tr><td><strong>Marca</strong></td><td>${fmt(v.marca)}</td></tr>
        <tr><td><strong>Modelo</strong></td><td>${fmt(v.modelo)}</td></tr>
        <tr><td><strong>Ano</strong></td><td>${fmt(v.ano)}</td></tr>
        <tr><td><strong>N.º Chassi</strong></td><td>${fmt(v.chassis || v.numeroChassi)}</td></tr>
        <tr><td><strong>N.º Motor</strong></td><td>${fmt(v.motor || v.numeroMotor)}</td></tr>
        <tr><td><strong>Lotação</strong></td><td>${fmt(v.lotacao)}</td></tr>
        <tr><td><strong>Tipo de cobertura</strong></td><td>${fmt(v.tipoCobertura)}</td></tr>
        <tr><td><strong>Classificação</strong></td><td>${fmt(v.classificacao)}</td></tr>
        <tr><td><strong>Capital seguro (MT)</strong></td><td>MT ${fmtMoeda(v.capitalSeguro)}</td></tr>
      </tbody>
    </table>`;

  const tabelaVeiculosHtml =
    veiculosList.length > 0
      ? veiculosList.map((v, idx) => tabelaUmVeiculo(v, idx)).join("")
      : tabelaUmVeiculo(primeiroVeiculo, 0);

  const linhaPremioUmVeiculo = (v, idx) => {
    const dd = debitoDiretoAtivo ? " + 15% (Débito Direto)" : "";
    const taxa =
      fmt(v.taxaAplicada) !== "–" ? fmt(v.taxaAplicada) + "%" + dd : "–";
    return `
    <tr><td colspan="2" class="subheader-row">Veículo ${idx + 1} ${fmt(v.marca)} ${fmt(v.modelo)}</td></tr>
    <tr><td width="40%"><strong>Capital Seguro (MT)</strong></td><td class="text-right">MT ${fmtMoeda(v.capitalSeguro)}</td></tr>
    <tr><td><strong>Taxa Aplicada</strong></td><td class="text-right">${taxa}</td></tr>
    ${gerarLinhasPremioVeiculoHtml(v, debitoDiretoAtivo, fmtMoeda)}
    <tr><td><strong>Débito Direto</strong></td><td class="text-right">${debitoDiretoAtivo ? "Sim" : "Não"}</td></tr>`;
  };

  const linhasTabelaPremioVeiculo =
    veiculosList.length > 0
      ? veiculosList.map((v, idx) => linhaPremioUmVeiculo(v, idx)).join("")
      : linhaPremioUmVeiculo(primeiroVeiculo, 0);

  const tabelaPremiosDetalhadaHtml = `
    <table class="tabela-box tabela-premios-detalhe">
      <thead><tr><th colspan="2">Dados do formulário – Capital Seguro, Taxa, Prémios e Débito Direto</th></tr></thead>
      <tbody>${linhasTabelaPremioVeiculo}
    <tr class="total-row"><td><strong>Prémio total (MT)</strong></td><td class="text-right bold">MT ${fmtMoeda(totalPremio)}</td></tr>
      </tbody>
    </table>`;

  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotação ${cotacao.id} </title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
    }
    .page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 20mm;
      page-break-after: always;
      background: #fff;
      display: flex;
      flex-direction: column;
    }
    .page::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('${resolvedTimbradoUrl}');
      background-size: cover;
      background-position: center top;
      background-repeat: no-repeat;
      opacity: 0.55;
      z-index: 0;
      pointer-events: none;
    }
    .page-content { position: relative; z-index: 1; flex: 1 1 auto; min-height: 0; }
    .header-pdf {
      text-align: center;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(22,101,52,0.3);
    }
    .header-pdf .logo-img { max-height: 52px; max-width: 200px; }
    .header-pdf .empresa { font-size: 18pt; font-weight: bold; color: #166534; margin-top: 6px; }
    .titulo-doc { font-size: 14pt; font-weight: bold; margin-top: 6px; text-transform: uppercase; }
    .titulo-cotacao { font-size: 13pt; font-weight: bold; color: #166534; margin-top: 4px; }
    .validade-box {
      display: inline-block;
      font-size: 10pt;
      font-weight: bold;
      color: #166534;
      background: #ecfdf5;
      border: 1px solid #166534;
      padding: 6px 12px;
      border-radius: 4px;
      margin-top: 10px;
    }
    .section-title {
      background: #166534;
      color: #fff;
      padding: 8px 12px;
      font-weight: bold;
      font-size: 11pt;
      margin: 18px 0 10px 0;
      border-radius: 4px;
    }
    .tabela-box {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 10pt;
      border: 1px solid #d1d5db;
      background: #fff;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .tabela-box th {
      background: #166534;
      color: #fff;
      padding: 10px 12px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #14532d;
    }
    .tabela-box td {
      padding: 8px 12px;
      border: 1px solid #e5e7eb;
    }
    .tabela-box tbody tr:nth-child(even) { background: #f9fafb; }
    .tabela-veiculos {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 9pt;
      border: 1px solid #d1d5db;
      background: #fff;
    }
    .tabela-veiculos th {
      background: #166534;
      color: #fff;
      padding: 8px 6px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #14532d;
    }
    .tabela-veiculos td { padding: 6px; border: 1px solid #e5e7eb; }
    .tabela-veiculos tbody tr:nth-child(even) { background: #f9fafb; }
    .tabela-premios {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 10pt;
      border: 1px solid #374151;
      background: #fff;
    }
    .tabela-premios th, .tabela-premios td { border: 1px solid #374151; padding: 8px; }
    .tabela-premios th { background: #f3f4f6; font-weight: bold; text-align: center; }
    .tabela-premios .total-row { background: #dcfce7; font-weight: bold; }
    .tabela-bancos {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 8pt;
      border: 1px solid #d1d5db;
      background: #fff;
    }
    .tabela-bancos th {
      background: #166534;
      color: #fff;
      padding: 6px 4px;
      text-align: left;
      font-weight: bold;
    }
    .tabela-bancos td { padding: 4px; border: 1px solid #e5e7eb; }
    .tabela-bancos tbody tr:nth-child(even) { background: #f9fafb; }
    .box-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 12px 14px;
      margin: 12px 0;
      line-height: 1.5;
    }
    .box-alerta {
      background: #ecfdf5;
      border: 1px solid #166534;
      border-radius: 4px;
      padding: 12px 14px;
      margin: 12px 0;
      font-size: 10pt;
      line-height: 1.5;
    }
    .condicoes { font-size: 10pt; line-height: 1.5; margin: 10px 0; }
    .condicoes ul { padding-left: 22px; margin: 8px 0; }
    .condicoes li { margin-bottom: 4px; }
    .exclusoes {
      column-count: 2;
      column-gap: 24px;
      font-size: 9pt;
      margin: 12px 0;
      line-height: 1.5;
    }
    .exclusoes div { margin-bottom: 4px; padding-left: 8px; }
    .rodape {
      flex: 0 0 auto;
      width: 100%;
      padding: 10px 0 6px 0;
      border-top: 1px solid #166534;
      font-size: 7.5pt;
      color: #374151;
      text-align: center;
      z-index: 2;
      line-height: 1.4;
      margin-top: auto;
    }
    .rodape-sede { font-weight: bold; color: #166534; }
    .rodape-contacto { margin-top: 2px; }
    .rodape-provincias { margin-top: 4px; font-size: 7pt; }
    .tabela-veiculo { margin-bottom: 20px; }
    .tabela-premios-detalhe .subheader-row { background: #d1fae5; font-weight: bold; padding: 8px 12px; }
    .pagina-numero {
      position: absolute;
      bottom: 14px;
      right: 20mm;
      font-size: 9pt;
      color: #6b7280;
      z-index: 2;
    }
    .bold { font-weight: bold; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .mt-10 { margin-top: 10px; }
    .mt-15 { margin-top: 15px; }
    .mt-20 { margin-top: 20px; }
    .mb-15 { margin-bottom: 15px; }
    @media print {
      .page { page-break-after: always; }
      .page:last-child { page-break-after: auto; }
    }
  </style>
</head>
<body>
  <!-- PÁGINA 1 -->
  <div class="page">
    <div class="page-content">
      ${headerPagina1}

      ${isEmpresarial ? htmlClientesEmpresarial : htmlClientesParticular}

      <div class="section-title">Resumo da Cotação</div>
      <table class="tabela-box">
        <tbody>
          <tr><td width="35%"><strong>Número da cotação</strong></td><td>${cotacao.id}</td></tr>
          <tr><td><strong>Número da apólice anterior</strong></td><td>Novo Negócio</td></tr>
          <tr><td><strong>Data efectiva</strong></td><td>${fmtData(dataInicio)}</td></tr>
          <tr><td><strong>Data de vencimento</strong></td><td>${fmtData(dataFim)} (inclusas)</td></tr>
          <tr><td><strong>Âmbito territorial</strong></td><td>Moçambique</td></tr>
          <tr><td><strong>Actividade</strong></td><td>${isEmpresarial ? "Empresarial" : "Particular"}</td></tr>
          <tr><td><strong>Agência / Agente</strong></td><td>${agenciaAgenteTexto}</td></tr>
        </tbody>
      </table>

      <div class="box-info">
        <div class="bold">Período de seguro</div>
        <div>(a) Desde ${fmtData(dataInicio)} até ${fmtData(dataFim)} (ambas as datas inclusas).</div>
        <div>(b) Qualquer período posterior para o qual o segurador aceite ou concorde aceitar pagamento para renovação da apólice.</div>
      </div>

      <div class="box-alerta">
        <strong>Importante:</strong> Esta cotação é renovada anualmente. O prémio é pago numa base anual.
      </div>

      <div class="mt-20 text-right">
        <div><strong>Data:</strong> ${fmtData(new Date())}</div>
        <div style="margin-top: 30px; border-top: 1px solid #000; padding-top: 8px; width: 240px; margin-left: auto; text-align: center;">
          Assinado: ......................................................................<br>
          <em>em nome da Companhia Imperial Seguros Moçambique, S.A.</em>
        </div>
      </div>
    </div>
    ${rodapeHtml}
    <div class="pagina-numero">Página 1 de 5</div>
  </div>

  <!-- PÁGINA 2 - Prémios e Pagamento -->
  <div class="page">
    <div class="page-content">
      ${headerComLogo("Tabela de Prémios")}

      <table class="tabela-box mb-15">
        <tbody>
          <tr><td width="50%"><strong>Número da cotação:</strong> ${cotacao.id}</td><td class="text-right"><strong>Secção:</strong> Tabela de Prémios</td></tr>
          <tr><td><strong>Número da versão:</strong> 1</td><td class="text-right"><strong>Data de impressão:</strong> ${fmtData(new Date())}</td></tr>
          <tr><td><strong>Válida a partir de:</strong> ${fmtData(dataInicio)}</td><td class="text-right"><strong>Válida até:</strong> ${fmtData(dataFim)} (inclusas)</td></tr>
        </tbody>
      </table>

      <div class="section-title">Pagamento do Prémio – Dados do formulário (Criar Cotação)</div>
      ${tabelaPremiosDetalhadaHtml}

      <div class="section-title mt-15">Pagamento do Prémio – Condições</div>
      <div class="box-alerta">
        <div class="bold">Eficácia do contrato e consequência da falta do pagamento do prémio</div>
        <div class="mt-10">1. A cobertura efectiva dos riscos apenas se verifica a partir do momento em que é feito o pagamento do prémio do seguro ou fracção.</div>
        <div class="mt-10">2. A falta de pagamento do prémio da anuidade subsequente ou da primeira fracção deste impede a renovação do contrato; o não pagamento de qualquer fracção do prémio no decurso de uma anuidade determina a resolução automática e imediata do contrato, na data em que o pagamento dessa fracção é devido.</div>
      </div>

      <div class="section-title">Dados Bancários – Imperial Insurance Moçambique, S.A.</div>
      <table class="tabela-bancos">
        <thead>
          <tr>
            <th>Nome banco</th>
            <th>Conta MZN</th>
            <th>NIB MZN</th>
            <th>Conta USD</th>
            <th>NIB USD</th>
            <th>Conta ZAR</th>
            <th>NIB ZAR</th>
          </tr>
        </thead>
        <tbody>
          ${bancos
            .map(
              (b) => `
          <tr>
            <td>${b.nome}</td>
            <td>${b.contaMZN || ""}</td>
            <td>${b.nibMZN || ""}</td>
            <td>${b.contaUSD || ""}</td>
            <td>${b.nibUSD || ""}</td>
            <td>${b.contaZAR || ""}</td>
            <td>${b.nibZAR || ""}</td>
          </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    ${rodapeHtml}
    <div class="pagina-numero">Página 2 de 5</div>
  </div>

  <!-- PÁGINA 3 - Veículo(s) -->
  <div class="page">
    <div class="page-content">
      ${headerComLogo("Seção de Automóveis – Dados do Veículo")}

      ${tabelaVeiculosHtml}

      <div class="section-title">Elementos da cobertura</div>
      <table class="tabela-box">
        <tbody>
          <tr><td><strong>Responsabilidade civil a terceiros</strong></td><td class="text-right">MT 4 000 000,00</td></tr>
        </tbody>
      </table>

      <div class="section-title">Extensões</div>
      <table class="tabela-box">
        <tbody>
          <tr><td>Responsabilidade contra passageiros</td><td class="text-right">MT 125 000,00</td></tr>
          <tr><td>Morte ou invalidez permanente</td><td class="text-right">MZN 100 000,00 / USD 1 600,00 / ZAR 2 000,00</td></tr>
          <tr><td>Despesas médicas</td><td class="text-right">MZN 20 000,00 / USD 320,00 / ZAR 4 000,00</td></tr>
          <tr><td>Despesas de funeral</td><td class="text-right">MZN 5 000,00 / USD 80,00 / ZAR 1 000,00</td></tr>
          <tr><td>Limite de ocupantes</td><td class="text-right">05</td></tr>
        </tbody>
      </table>

      <div class="mt-15"><strong>Franquias:</strong> Não aplicável.</div>
    </div>
    ${rodapeHtml}
    <div class="pagina-numero">Página 3 de 5</div>
  </div>

  <!-- PÁGINA 4 - Condições especiais / Garantias -->
  <div class="page">
    <div class="page-content">
      ${headerComLogo("Condições Especiais / Garantias")}

      <div class="section-title">Condições especiais / Garantias / Extensões / Exclusões / Termos e condições</div>

      <div class="condicoes">
        <div class="bold">Condicionantes obrigatórias da cobertura automóvel</div>
        <p>Os veículos abrangidos pela presente apólice deverão cumprir integralmente os requisitos legais de circulação e segurança em vigor. O condutor do veículo, no momento do sinistro, deve ser titular de carta de condução válida. O veículo deve apresentar:</p>
        <ul>
          <li>Inspeção legal periódica válida;</li>
          <li>Inspeção técnica interna prévia à emissão da apólice (pneus, motor, travões, entre outros);</li>
          <li>O veículo deverá ser mantido em boas condições de funcionamento e conservação;</li>
          <li>O veículo não poderá ser utilizado para finalidades diversas das declaradas na proposta;</li>
          <li>O tomador do seguro deverá comunicar à seguradora, de forma imediata e por escrito, qualquer alteração relevante;</li>
          <li>O veículo não poderá ser utilizado para competições ou atividades de risco elevado, salvo cobertura específica.</li>
        </ul>

        <div class="bold mt-15">Condicionantes facultativas – cobertura de danos próprios</div>
        <p>Recomenda-se dispositivo de rastreamento, imobilizadores, alarme antifurto, estacionamento seguro. Salvo autorização expressa, o veículo não poderá ser utilizado para transporte de materiais perigosos ou inflamáveis. A inobservância poderá acarretar perda do direito à indenização, total ou parcial.</p>

        <div class="bold mt-15">Vistoria obrigatória da viatura</div>
        <p>A viatura segurada deverá ser submetida a inspeção obrigatória no prazo de até 5 (cinco) dias úteis, contados a partir da data de emissão da apólice (${fmtData(new Date())}). Fora de Maputo, é da responsabilidade do segurado apresentar o veículo à instalação da seguradora mais próxima dentro desse prazo. O não cumprimento resultará na perda do direito à indenização.</p>
      </div>
    </div>
    <div class="pagina-numero">Página 4 de 5</div>
  </div>

  <!-- PÁGINA 5 - Exclusões gerais -->
  <div class="page">
    <div class="page-content">
      ${headerComLogo("Exclusões Gerais e Cláusulas Finais")}

      <div class="section-title">Exclusões gerais</div>
      <div class="exclusoes">
        <div>Bens sob os cuidados, custódia e controle do segurado</div>
        <div>Abuso e molestamento</div>
        <div>Amianto</div>
        <div>Actos de terrorismo</div>
        <div>Violência política e terrorismo e riscos associados</div>
        <div>Riscos nucleares</div>
        <div>Guerra e guerra civil ou motim, greve e riscos semelhantes</div>
        <div>Danos em obras, propriedade em construção</div>
        <div>Perda financeira pura</div>
        <div>Explosão, combustão espontânea</div>
        <div>Danos maliciosos</div>
        <div>Comoção civil</div>
        <div>Sabotagem</div>
        <div>Vandalização</div>
        <div>Insurreição</div>
        <div>Saques</div>
        <div>Poluição ambiental</div>
        <div>Avarias mecânicas</div>
        <div>Negligência do condutor</div>
        <div>Condução sem habilitação legal válida</div>
        <div>Condução sob efeito de álcool, drogas ou substâncias entorpecentes</div>
        <div>Uso do veículo em corridas, testes, exibições ou eventos similares (salvo cobertura expressa)</div>
        <div>Perda ou dano por abandono, entrega voluntária ou falta de diligência na proteção do veículo</div>
      </div>

      <div class="section-title mt-15">Cláusula adicional – viaturas com matrícula estrangeira</div>
      <div class="condicoes">
        <p>Ficam excluídas da cobertura: roubo ou furto total da viatura ocorrido fora do território da República de Moçambique; roubo ou furto de acessórios da viatura ocorrido fora do território da República de Moçambique.</p>
      </div>

      <div class="section-title mt-15">Eficácia do contrato e divulgação de factos relevantes</div>
      <div class="condicoes">
        <p>O prémio total é devido e pagável antes ou na data do início ou renovação. A Seguradora não é obrigada a aceitar prémio endereçado após essa data. É dever do cliente divulgar todos os factores materiais antes do início e durante a apólice. A não divulgação ou má interpretação pode tornar a apólice nula desde o início.</p>
      </div>

      <div class="text-center mt-20" style="font-size: 9pt; color: #6b7280;">www.imperialinsurance-mz.com</div>
    </div>
    ${rodapeHtml}
    <div class="pagina-numero">Página 5 de 5</div>
  </div>
</body>
</html>`;
};

/**
 * Gera e abre/descarrega o PDF (HTML) da cotação.
 * Carrega logo e papel timbrado em base64 para o template ficar igual ao enviado por email.
 * @param {Object} cotacao - Dados da cotação
 * @param {string} acao - 'download' | 'visualizar' | 'imprimir'
 * @returns {Promise<boolean>}
 */
export const gerarPDFPersonalizado = async (cotacao, acao = "download") => {
  if (!cotacao || typeof cotacao !== "object") {
    alert("Nenhuma cotação seleccionada.");
    return false;
  }
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { fullLogoUrl, fullTimbradoUrl } = getLogoAndTimbradoPaths(origin);

    // Carregar logo e timbrado como base64 para o HTML ser autocontido (igual ao PDF por email)
    const [logoDataUrl, timbradoDataUrl] = await Promise.all([
      fetchImageAsDataUrl(fullLogoUrl),
      fetchImageAsDataUrl(fullTimbradoUrl),
    ]);
    const logoConfigurado = lerMarca().logo;
    const resolvedLogo = logoConfigurado || logoDataUrl || fullLogoUrl;
    const resolvedTimbrado = timbradoDataUrl || fullTimbradoUrl;

    const htmlContent = gerarHTMLCotacaoPersonalizado(
      cotacao,
      origin,
      resolvedLogo,
      resolvedTimbrado,
    );

    if (!htmlContent || typeof htmlContent !== "string") {
      throw new Error("Conteúdo do documento vazio");
    }

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const id = cotacao.id || "cotacao";

    if (acao === "download") {
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotacao-${id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        const win = window.open(url, "_blank");
        if (win) {
          win.onload = () => setTimeout(() => win.print(), 500);
        }
      }, 500);
    } else if (acao === "visualizar") {
      window.open(url, "_blank");
    } else if (acao === "imprimir") {
      const win = window.open(url, "_blank");
      if (!win) {
        alert("❌ Por favor, permita pop-ups para imprimir o documento.");
        return false;
      }
      if (win) {
        win.onload = () => setTimeout(() => win.print(), 500);
      }
    }

    setTimeout(() => URL.revokeObjectURL(url), 15000);
    return true;
  } catch (error) {
    console.error("Erro ao gerar documento:", error);
    const msg = error?.message || String(error);
    alert(
      "Erro ao gerar documento. Por favor, tente novamente.\n" +
        (msg ? "\nDetalhe: " + msg : ""),
    );
    return false;
  }
};

export default gerarPDFPersonalizado;
