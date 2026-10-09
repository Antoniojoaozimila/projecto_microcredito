// src/pages/ListarCotacoes.jsx
import React, { useState, useEffect } from "react";
import { gerarPDFPersonalizado } from '../components/GeradorPDFPersonalizado';
import {
  Search,
  Filter,
  Download,
  Eye,
  Send,
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  User,
} from "lucide-react";
import CotacoesLayout from "../components/CotacoesLayout";
import CotacaoStatusBadge from "../components/ui/CotacaoStatusBadge";
import AnimatedPagination from "../components/ui/AnimatedPagination";
import DataTableWrapper from "../components/ui/DataTableWrapper";
import { STATUS_FILTER_OPTIONS } from "../utils/cotacaoStatus";
import { cotacaoService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import VisualizacaoClienteDocumentos from "../components/VisualizacaoClienteDocumentos";
import { cotacaoPodePartilhar, getStatusAprovacaoLabel, STATUS_APROVACAO_CORES } from "../utils/statusAprovacao";

function ListarCotacoes() {
  const { usuario } = useAuth();
  const userRole = usuario?.role || 'agente';
  const isAdminOuSubscritor = userRole === 'admin' || userRole === 'subscritor';
  
  const brand = {
    primary: [22, 101, 52],
    primaryHex: "#166534",
    accent: [12, 183, 84],
    accentHex: "#0cb754",
  };
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [cotacoes, setCotacoes] = useState([]);
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState(null);
  const [mostrarOpcoesPartilha, setMostrarOpcoesPartilha] = useState(false);
  const [mostrarDadosCliente, setMostrarDadosCliente] = useState(false);
  const [processandoEmail, setProcessandoEmail] = useState(false);
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Carregar cotações do backend
  useEffect(() => {
    carregarCotacoes();
  }, [currentPage, filterStatus, searchTerm]);

  // Escutar evento de cotação criada para atualizar lista
  useEffect(() => {
    const handleCotacaoCriada = () => {
      carregarCotacoes();
    };

    window.addEventListener('cotacaoCriada', handleCotacaoCriada);
    return () => window.removeEventListener('cotacaoCriada', handleCotacaoCriada);
  }, []);

  const carregarCotacoes = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        status: filterStatus !== "all" ? filterStatus : undefined,
        search: searchTerm || undefined
      };

      console.log('🔍 [ListarCotacoes] Buscando cotações com filtros:', filters);
      const result = await cotacaoService.listar(filters);
      console.log('📊 [ListarCotacoes] Resultado:', {
        success: result.success,
        total: result.data?.length || 0,
        pagination: result.pagination
      });
      
      if (result.success) {
        // Transformar dados do backend para o formato esperado pelo frontend
        const cotacoesFormatadas = result.data.map(cotacao => ({
          id: cotacao.id, // ID numérico do backend (importante para buscar/editar)
          numero_cotacao: cotacao.numero_cotacao,
          cliente: {
            primeiroNome: cotacao.primeiro_nome || '',
            sobrenome: cotacao.sobrenome || '',
            email: cotacao.cliente_email || '',
            telefone: cotacao.cliente_telefone || '',
            tipo: cotacao.cliente?.tipo || 'Particular',
            numeroDocumento: cotacao.cliente?.numero_documento || ''
          },
          veiculos: cotacao.veiculos || [],
          totalPremio: parseFloat(cotacao.total_premio) || 0,
          status: cotacao.status,
          status_aprovacao: cotacao.status_aprovacao || 'nao_requer',
          dataCriacao: cotacao.data_criacao,
          dataValidade: cotacao.data_validade,
          agente_nome: cotacao.agente_nome || '',
          agente_balcao: cotacao.agente_balcao || ''
        }));
        
        setCotacoes(cotacoesFormatadas);
        setPagination(result.pagination || { page: currentPage, limit: itemsPerPage, total: 0, totalPages: 0 });
      } else {
        setCotacoes([]);
        console.error("Erro ao carregar cotações:", result.message);
      }
    } catch (error) {
      console.error("Erro ao carregar cotações:", error);
      setCotacoes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar localmente (já vem filtrado do backend, mas manter para compatibilidade)
  const filteredCotações = cotacoes.filter((cotacao) => {
    if (searchTerm) {
      const matchesSearch =
        (cotacao.cliente?.primeiroNome || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (cotacao.cliente?.sobrenome || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (cotacao.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cotacao.numero_cotacao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cotacao.veiculos || []).some(v => 
          (v.matricula || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.marca_modelo || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      if (!matchesSearch) return false;
    }
    return filterStatus === "all" || cotacao.status === filterStatus;
  });

  // Paginação
  const currentItems = filteredCotações;
  const totalPages = pagination.totalPages || 1;

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Recarregar quando mudar filtro ou busca (debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        carregarCotacoes();
      } else {
        setCurrentPage(1);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getStatusText = (status) => {
    switch (status) {
      case "ativa": return "Ativa";
      case "pendente": return "Pendente";
      case "finalizada": return "Finalizada";
      case "expirada": return "Expirada";
      case "cancelada": return "Cancelada";
      default: return status;
    }
  };

  // Função antiga removida - agora usamos GeradorPDFPersonalizado
  const gerarHTMLCotacao_OLD = (cotacao) => {
    const dataInicio = new Date(cotacao.dataCriacao);
    const dataFim = new Date(dataInicio);
    dataFim.setFullYear(dataFim.getFullYear() + 1);
    
    const veiculo = cotacao.veiculos[0] || {};
    const premioBase = cotacao.totalPremio * 0.84;
    const custosAdmin = cotacao.totalPremio * 0.12;
    const sobreTaxa = cotacao.totalPremio * 0.02;
    const impostoSelo = cotacao.totalPremio * 0.02;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotação ${cotacao.id} - Imperial Seguros</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
        }
        
        .page {
            page-break-after: always;
            position: relative;
            padding: 20mm;
            min-height: 277mm;
            box-sizing: border-box;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .titulo-principal {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .titulo-cotacao {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .validade {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #d00;
        }
        
        .tabela-segurado {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10px;
        }
        
        .tabela-segurado th {
            background-color: #166534;
            color: white;
            padding: 6px;
            text-align: left;
            font-weight: bold;
        }
        
        .tabela-segurado td {
            padding: 6px;
            border: 1px solid #ddd;
        }
        
        .tabela-segurado tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .tabela-premios {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10px;
        }
        
        .tabela-premios th,
        .tabela-premios td {
            border: 1px solid #000;
            padding: 5px;
        }
        
        .tabela-premios th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        
        .tabela-bancos {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 8px;
        }
        
        .tabela-bancos th,
        .tabela-bancos td {
            border: 1px solid #ddd;
            padding: 3px;
        }
        
        .bold {
            font-weight: bold;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        .mt-10 {
            margin-top: 10px;
        }
        
        .mt-20 {
            margin-top: 20px;
        }
        
        .mb-10 {
            margin-bottom: 10px;
        }
        
        .mb-20 {
            margin-bottom: 20px;
        }
        
        .linha-divisoria {
            border-top: 1px solid #000;
            margin: 10px 0;
        }
        
        .assinatura {
            margin-top: 40px;
            border-top: 1px solid #000;
            padding-top: 10px;
            width: 200px;
        }
        
        .pagina-numero {
            position: absolute;
            bottom: 10px;
            right: 20px;
            font-size: 10px;
            color: #666;
        }
        
        .logo {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .logo-text {
            font-size: 24px;
            font-weight: bold;
            color: #166534;
            margin-bottom: 5px;
        }
        
        .logo-subtitle {
            font-size: 14px;
            color: #666;
        }
        
        .condicoes {
            font-size: 10px;
            line-height: 1.3;
        }
        
        .condicoes ul {
            padding-left: 20px;
            margin: 5px 0;
        }
        
        .condicoes li {
            margin-bottom: 3px;
        }
        
        .exclusoes {
            column-count: 2;
            column-gap: 20px;
            font-size: 9px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <!-- PÁGINA 1 -->
    <div class="page">
        <div class="logo">
            <div class="logo-text">IMPERIAL SEGUROS</div>
            <div class="logo-subtitle">Moçambique, S.A.</div>
        </div>
        
        <div class="header">
            <div class="titulo-principal">Seguros Gerais</div>
            <div class="titulo-cotacao">Cotação</div>
            <div class="validade">Esta cotação será válida apenas por 30 dias</div>
        </div>
        
        <table class="tabela-segurado">
            <thead>
                <tr>
                    <th colspan="2">Informações do Segurado</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td width="50%"><strong>Segurado:</strong> ${cotacao.cliente.primeiroNome} ${cotacao.cliente.sobrenome}</td>
                    <td width="50%"><strong>Número da cotação:</strong> ${cotacao.id}</td>
                </tr>
                <tr>
                    <td><strong>NUIT:</strong> ${cotacao.cliente.numeroDocumento || '128704132'}</td>
                    <td><strong>Número da Apólice:</strong> ${cotacao.id.substring(0, 6)}</td>
                </tr>
                <tr>
                    <td><strong>Morada Postal:</strong> ${cotacao.cliente.morada || 'Q.01 Vila de Sede, Marracuene'}</td>
                    <td><strong>Versão da Apólice:</strong> 1</td>
                </tr>
                <tr>
                    <td><strong>Data Efectiva:</strong> ${dataInicio.toLocaleDateString('pt-MZ')}</td>
                    <td><strong>Data de Vencimento:</strong> ${dataFim.toLocaleDateString('pt-MZ')} (data inclusas)</td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Província:</strong> Maputo, Moçambique</td>
                </tr>
            </tbody>
        </table>
        
        <div class="mb-20">
            <div class="bold">Período de Seguro:</div>
            <div>(a) Desde ${dataInicio.toLocaleDateString('pt-MZ')} até ${dataFim.toLocaleDateString('pt-MZ')} (ambas as datas inclusas)</div>
            <div>(b) Qualquer período posterior para o qual o segurador aceite ou concorde aceitar pagamento para renovação da apólice.</div>
        </div>
        
        <div class="mb-20">
            <div><strong>Âmbito Territorial:</strong> Moçambique</div>
            <div><strong>Actividade Empresarial:</strong> ${cotacao.cliente.tipo === 'Empresarial' ? 'Empresa' : 'Particular'}</div>
            <div><strong>Agência:</strong> MAPUTO</div>
            <div><strong>Agente / Agente:</strong> DIRECT - MAPUTO</div>
        </div>
        
        <div class="mt-20">
            <div><strong>Data:</strong> ${new Date().toLocaleDateString('pt-MZ')}</div>
            <div class="assinatura">Assinado: ...... em nome da Companhia</div>
        </div>
        
        <div class="text-center mt-20 bold">
            Esta cotação é renovada Anualmente. O prémio é pago numa base Anual.
        </div>
        
        <div class="pagina-numero">Página 1 de 5</div>
    </div>
    
    <!-- PÁGINA 2 -->
    <div class="page">
        <div class="logo">
            <div class="logo-text">IMPERIAL SEGUROS</div>
        </div>
        
        <div class="header">
            <div class="titulo-cotacao">Cotação</div>
        </div>
        
        <div class="mb-20">
            <table width="100%" style="font-size: 10px;">
                <tr>
                    <td><strong>Número da cotação:</strong> ${cotacao.id}</td>
                    <td class="text-right"><strong>Secção:</strong> Tabela de Prémios</td>
                </tr>
                <tr>
                    <td><strong>Número da Versão:</strong> 1</td>
                    <td class="text-right"><strong>Data de Impressão:</strong> ${new Date().toLocaleDateString('pt-MZ')}</td>
                </tr>
                <tr>
                    <td><strong>Válida a Partir de:</strong> ${dataInicio.toLocaleDateString('pt-MZ')}</td>
                    <td class="text-right"><strong>Válida Até:</strong> ${dataFim.toLocaleDateString('pt-MZ')} (data inclusas)</td>
                </tr>
            </table>
        </div>
        
        <table class="tabela-premios">
            <thead>
                <tr>
                    <th width="40%">Secções da Apólice</th>
                    <th width="20%">Subscritas</th>
                    <th width="20%">Prémio Anual</th>
                    <th width="20%">Prémio Adicional / de Reembolso</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Automóvel</td>
                    <td class="text-center">Sim</td>
                    <td class="text-right">MT ${premioBase.toFixed(2)}</td>
                    <td class="text-right">MT 0.00</td>
                </tr>
                <tr>
                    <td colspan="2" class="bold">Total</td>
                    <td class="text-right bold">MT ${premioBase.toFixed(2)}</td>
                    <td class="text-right bold">MT 0.00</td>
                </tr>
                <tr>
                    <td>Custos Administrativos</td>
                    <td></td>
                    <td class="text-right">MT ${custosAdmin.toFixed(2)}</td>
                    <td class="text-right">MT 0.00</td>
                </tr>
                <tr>
                    <td>Sobre Taxa</td>
                    <td></td>
                    <td class="text-right">MT ${sobreTaxa.toFixed(2)}</td>
                    <td class="text-right">MT 0.00</td>
                </tr>
                <tr>
                    <td>Imposto de Selo</td>
                    <td></td>
                    <td class="text-right">MT ${impostoSelo.toFixed(2)}</td>
                    <td class="text-right">MT 0.00</td>
                </tr>
                <tr class="bold">
                    <td colspan="2">Prémio Total</td>
                    <td class="text-right">MT ${cotacao.totalPremio.toFixed(2)}</td>
                    <td class="text-right">MT 0.00</td>
                </tr>
            </tbody>
        </table>
        
        <div class="mt-20">
            <div class="bold" style="font-size: 11px;">PAGAMENTO DO PRÉMIO</div>
            <div class="bold" style="font-size: 10px;">EFICÁCIA DO CONTRATO E CONSEQUÊNCIA DA FALTA DO PAGAMENTO DO PRÉMIO</div>
            <div class="mt-10" style="font-size: 9px;">
                A cobertura efectiva dos riscos apenas se verifica a partir do momento em que é feito o pagamento do prémio do
                seguro ou fracção;
            </div>
            <div class="mt-10" style="font-size: 9px;">
                A falta de pagamento do prémio da anuidade subsequente ou da primeira fracção deste, impede a renovação do
                contrato e o não pagamento de qualquer fracção do prémio do decurso de uma anuidade determina a resolução
                automática e imediata do contrato, na data em que o pagamento dessa fracção é devido.
            </div>
        </div>
        
        <div class="mt-20">
            <div class="bold">Bank Details Imperial Insurance Moçambique, S.A.</div>
            <table class="tabela-bancos">
                <thead>
                    <tr>
                        <th>Nome Banco</th>
                        <th>Número de Conta MZN</th>
                        <th>NIB MZN</th>
                        <th>Número de Conta USD</th>
                        <th>NIB USD</th>
                        <th>Número de Conta ZAR</th>
                        <th>NIB ZAR</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>ACCESS BANK</td>
                        <td>3805960110</td>
                        <td>0066000603805 96011071</td>
                        <td>3805960211</td>
                        <td>0013000603805 96021136</td>
                        <td>3805960313</td>
                        <td>0013000603805 96031321</td>
                    </tr>
                    <tr>
                        <td>BCI</td>
                        <td>1430858651000 1</td>
                        <td>0008000043085 86510195</td>
                        <td>1430858651000 2</td>
                        <td>0008000043085 86510292</td>
                        <td>1430858651000 3</td>
                        <td>0008000043085 86510389</td>
                    </tr>
                    <tr>
                        <td>Ecobank</td>
                        <td>5575000017081</td>
                        <td>0023001557500 01708191</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="pagina-numero">Página 2 de 5</div>
    </div>
    
    <!-- PÁGINA 3 -->
    <div class="page">
        <div class="logo">
            <div class="logo-text">IMPERIAL SEGUROS</div>
        </div>
        
        <div class="header">
            <div class="titulo-cotacao">Cotação</div>
        </div>
        
        <div class="mb-20">
            <table width="100%" style="font-size: 10px;">
                <tr>
                    <td><strong>Número da Apólice:</strong> ${cotacao.id.substring(0, 6)}</td>
                    <td class="text-right"><strong>Secção:</strong> ${cotacao.id.substring(0, 6)}</td>
                </tr>
                <tr>
                    <td><strong>Número da Versão:</strong> 1</td>
                    <td class="text-right"><strong>Data de Impressão:</strong> ${new Date().toLocaleDateString('pt-MZ')}</td>
                </tr>
                <tr>
                    <td><strong>Válida a Partir de:</strong> ${dataInicio.toLocaleDateString('pt-MZ')}</td>
                    <td class="text-right"><strong>Válida Até:</strong> ${dataFim.toLocaleDateString('pt-MZ')} (data inclusas)</td>
                </tr>
            </table>
        </div>
        
        <div class="mb-20">
            <div class="bold">Descrição</div>
            <div>${veiculo.matricula || "Por atribuir"}</div>
        </div>
        
        <div class="mb-20">
            <div class="bold">Instalações</div>
            <div>MATOLA</div>
            <div>MAPUTO</div>
            <div>Moçambique</div>
        </div>
        
        <div class="mb-20">
            <div class="bold">Características:</div>
            <div><strong>Ano:</strong> ${veiculo.ano || "2000"}</div>
            <div><strong>N°. do Chassi:</strong> ${veiculo.numeroChassi || "12345678"}</div>
            <div><strong>N°. do Motor:</strong> ${veiculo.numeroMotor || "98765"}</div>
            <div><strong>Marca:</strong> ${veiculo.marcaModelo?.split(' ')[0] || "TOYOTA"}</div>
            <div><strong>Modelo:</strong> ${veiculo.marcaModelo?.split(' ').slice(1).join(' ') || "ALLION"}</div>
            <div><strong>Matrícula:</strong> ${veiculo.matricula || "AFU;1234"}</div>
            <div><strong>Classe do Veículo:</strong> ${veiculo.tipoViatura === 'Particular' ? 'Private motor' : veiculo.tipoViatura}</div>
        </div>
        
        <div class="mb-20">
            <table width="100%" style="font-size: 10px;">
                <tr>
                    <td class="bold">Elementos da Cobertura</td>
                    <td class="bold text-right">Valor Seguro / Limite da Indemnização</td>
                </tr>
                <tr>
                    <td>Responsabilidade Civil a Terceiros</td>
                    <td class="text-right">MT 4,000,000.00</td>
                </tr>
            </table>
        </div>
        
        <div class="mb-20">
            <table width="100%" style="font-size: 10px;">
                <tr>
                    <td class="bold">Extensões</td>
                    <td class="bold text-right">Valor Seguro / Limite da Indemnização</td>
                </tr>
                <tr>
                    <td>Responsabilidade Contra Passageiros</td>
                    <td class="text-right">MT 125,000.00</td>
                </tr>
                <tr>
                    <td>Morte ou invalidez Permanente:</td>
                    <td class="text-right">MZN 100,000.00 / USD 1,600.00 / ZAR 2,000.00</td>
                </tr>
                <tr>
                    <td>Despesas Médicas:</td>
                    <td class="text-right">MZN 20,000.00 / USD 320.00 / ZAR 4,000.00</td>
                </tr>
                <tr>
                    <td>Despesas de Funeral:</td>
                    <td class="text-right">MZN 5,000.00 / USD 80.00 / ZAR 1,000.00</td>
                </tr>
                <tr>
                    <td>Limite de Ocupantes:</td>
                    <td class="text-right">05</td>
                </tr>
            </table>
        </div>
        
        <div class="mt-20">
            <div class="bold">Franquias</div>
            <div>Nao aplicavel</div>
        </div>
        
        <div class="pagina-numero">Página 3 de 5</div>
    </div>
    
    <!-- PÁGINA 4 -->
    <div class="page">
        <div class="logo">
            <div class="logo-text">IMPERIAL SEGUROS</div>
        </div>
        
        <div class="condicoes">
            <div class="bold" style="font-size: 11px;">Condições especiais / Garantias / Extensões / Exclusões / Termos e condições / Observações:</div>
            
            <div class="mt-10">
                <div class="bold">CONDICIONANTES OBRIGATÓRIAS DA COBERTURA AUTOMÓVEL</div>
                <div>Os veículos abrangidos pela presente apólice deverão cumprir integralmente os requisitos legais de circulação e segurança em vigor.</div>
                <div>O condutor do veículo, no momento do sinistro, deve:</div>
                <ul>
                    <li>Ser titular de carta de condução válida;</li>
                </ul>
                <div>O veículo deve apresentar:</div>
                <ul>
                    <li>Inspeção legal periódica válida;</li>
                    <li>Inspeção técnica interna prévia à emissão da apólice, com verificação do estado geral (pneus, motor, travões, entre outros);</li>
                    <li>O veículo deverá ser mantido em boas condições de funcionamento e conservação;</li>
                    <li>O veículo não poderá ser utilizado para finalidades diversas daquelas declaradas na proposta de Seguro;</li>
                    <li>O tomador do seguro deverá comunicar à seguradora, de forma imediata e por escrito, qualquer alteração relevante que possa impactar o risco segurado;</li>
                    <li>O veículo não poderá ser utilizado para finalidades de competições ou atividades de risco elevado: Corridas, competições ou provas desportivas, testes de velocidade, treinamentos, exibições públicas ou eventos similares, salvo mediante contratação de cobertura específica.</li>
                </ul>
            </div>
            
            <div class="mt-10">
                <div class="bold">CONDICIONANTES FACULTATIVAS – APLICÁVEIS À COBERTURA DE DANOS PRÓPRIOS</div>
                <div>Para efeitos de reforço da proteção contra riscos de furto, roubo ou desaparecimento, especialmente no âmbito da cobertura de danos próprios, recomenda-se que o tomador do seguro adopte os seguintes dispositivos adicionais:</div>
                <ul>
                    <li>Instalação de dispositivo de rastreamento e contratação de serviço de localização e recuperação do veículo em caso de roubo e/ou furto;</li>
                    <li>Instalação de imobilizadores eletrônicos, travas antifurto ou outros mecanismos que dificultem o acesso, movimentação ou remoção não autorizada do veículo;</li>
                    <li>O veículo deverá estar equipado com sistema de alarme antifurto funcional, instalado e activo durante todo o período de vigência da apólice;</li>
                    <li>Durante o período nocturno, o veículo deverá ser estacionado em local seguro e adequado, de forma a minimizar riscos de furto, roubo ou danos;</li>
                    <li>Salvo autorização expressa em cláusula adicional, o veículo não poderá ser utilizado para o transporte de materiais perigosos ou inflamáveis.</li>
                </ul>
                <div class="bold mt-5">A inobservância das obrigações acima referidas poderá acarretar a perda do direito à indenização, total ou parcial, consoante a gravidade da infração e sua relação com o sinistro.</div>
            </div>
            
            <div class="mt-10">
                <div class="bold">VISTÓRIA OBRIGATÓRIA DA VIATURA</div>
                <div>A viatura segurada deverá ser submetida a inspeção obrigatória no prazo de até 5 (Cínco) dias úteis, contados a partir da data de emissão da apólice (${new Date().toLocaleDateString('pt-MZ')}). Nos casos em que a viatura se encontre fora de Maputo, é da inteira responsabilidade do segurado apresentar o veículo à instalação da seguradora mais próxima antes do início da cobertura ou, no máximo, dentro do prazo de 5 (Cínco) dias úteis a contar da data de início da apólice. O não cumprimento desta obrigação resultará na perda do direito à indenização.</div>
            </div>
        </div>
        
        <div class="pagina-numero">Página 4 de 5</div>
    </div>
    
    <!-- PÁGINA 5 -->
    <div class="page">
        <div class="logo">
            <div class="logo-text">IMPERIAL SEGUROS</div>
        </div>
        
        <div class="condicoes">
            <div class="bold" style="font-size: 11px;">EXCLUSÕES GERAIS</div>
            <div class="exclusoes">
                <div>Bens sob os cuidados, custódia e controle do segurado</div>
                <div>Abuso e molestamento</div>
                <div>Amianto</div>
                <div>Actos de Terrorismo</div>
                <div>Violência Política e Terrorismo e riscos associados</div>
                <div>Riscos nucleares</div>
                <div>Guerra e guerra civil ou motim, greve e riscos semelhantes</div>
                <div>Danos em obras, propriedade em construção</div>
                <div>Perda Financeira Pura</div>
                <div>Explosão, Combustão Spontânea</div>
                <div>Danos Maliciosos</div>
                <div>Comoção Civil</div>
                <div>Sabotagem</div>
                <div>Vandalização</div>
                <div>Insurreição</div>
                <div>Saques</div>
                <div>Poluição Ambiental</div>
                <div>Avarias mecânicas</div>
                <div>Negligência do condutor</div>
                <div>Condução sem habilitação legal válida</div>
                <div>Condução sob efeito de álcool, drogas ou substâncias entorpecentes</div>
                <div>Exclui-se o uso do veículo em corridas, testes, exibições ou eventos similares, salvo se contratada cobertura adicional específica e expressamente prevista na apólice</div>
                <div>Perda ou dano resultante do abandono, entrega voluntária ou da falta de diligência razoável na proteção do veículo segurado</div>
            </div>
            
            <div class="mt-10">
                <div class="bold">CLÁUSULA ADICIONAL DE EXCLUSÃO – VIATURAS COM MATRÍCULA ESTRANGEIRA</div>
                <div>Para além das exclusões gerais previstas na apólice, ficam expressamente excluídas da cobertura as seguintes situações, quando se trate de viaturas com matrícula estrangeira:</div>
                <ul>
                    <li>Roubo ou furto total da viatura ocorrido fora do território da República de Moçambique;</li>
                    <li>Roubo ou furto de acessórios da viatura ocorrido fora do território da República de Moçambique.</li>
                </ul>
            </div>
            
            <div class="mt-10">
                <div class="bold">EFICÁCIA DO CONTRATO E CONSEQUÊNCIA NA FALTA DO PAGAMENTO DO PRÉMIO</div>
                <div>O prémio total para o período de cobertura é devido e pagável antes ou na data do seu início ou data de renovação, conforme o caso, e continua a ser da exclusiva responsabilidade do segurado garantir que o prémio seja atempadamente pago. A Seguradora não é obrigada a aceitar o prémio que lhe foi endereçado após a data de emissão ou data de renovação.</div>
                <div>Esta apólice é um contrato anual para o qual a Seguradora pode aceitar o pagamento de prémio em prestações, mediante acordo prévio. A Seguradora se reserva o direito de deduzir o prémio total anual relativamente ao objecto sobre o qual um sinistro foi ou está a ser pago.</div>
            </div>
            
            <div class="mt-10">
                <div class="bold">DIVULGAÇÃO DE FACTOS RELEVANTES</div>
                <div>É dever do cliente divulgar todos os factores materiais antes do início da apólice ou renovação e durante o curso da apólice. Isso envolve o seguinte:</div>
                <ol>
                    <li>Divulgando todo o histórico de perdas pagas ou não pagas, seguradas ou não;</li>
                    <li>Factores ou ameaças que podem causar perda ou dar lugar ao sinistro do bem segurado. Isso pode representar ameaças passadas;</li>
                    <li>Quaisquer mudanças nos factores durante o curso da apólice.</li>
                </ol>
                <div>A não divulgação dos fatores materiais ou a má interpretação dos fatores materiais tornará a apólice automaticamente nula, ou seja, a apólice não será válida desde o início. A seguradora reembolsará todos os prémios e se isso for descoberto no momento do sinistro, o sinistro não será pago e o prémio será devolvido ao cliente.</div>
            </div>
        </div>
        
        <div class="text-center mt-20" style="font-size: 9px; color: #666;">
            www.imperialseguros.co.mz
        </div>
        
        <div class="pagina-numero">Página 5 de 5</div>
    </div>
</body>
</html>
    `;
  };

  // Função para buscar cotação completa e gerar PDF
  const buscarCotacaoCompletaEgerarPDF = async (cotacao, acao = 'download') => {
    if (!cotacaoPodePartilhar(cotacao.status_aprovacao)) {
      alert(`Não é possível gerar PDF: ${getStatusAprovacaoLabel(cotacao.status_aprovacao)}`);
      return;
    }
    try {
      setGerandoPDF(true);
      
      // Buscar cotação completa do backend usando o ID numérico
      const result = await cotacaoService.buscarPorId(cotacao.id);
      
      if (!result.success || !result.data) {
        alert('❌ Erro ao buscar cotação completa. Por favor, tente novamente.');
        setGerandoPDF(false);
        return;
      }

      const cotacaoCompleta = result.data;
      
      // Transformar dados do backend para o formato esperado pelo gerador de PDF
      const cotacaoFormatada = {
        id: cotacaoCompleta.numero_cotacao || cotacaoCompleta.id,
        numero_cotacao: cotacaoCompleta.numero_cotacao,
        cliente: {
          primeiroNome: cotacaoCompleta.cliente?.primeiro_nome || cotacaoCompleta.primeiro_nome || cotacao.cliente.primeiroNome || '',
          sobrenome: cotacaoCompleta.cliente?.sobrenome || cotacaoCompleta.sobrenome || cotacao.cliente.sobrenome || '',
          email: cotacaoCompleta.cliente?.email || cotacaoCompleta.cliente_email || cotacao.cliente.email || '',
          telefone: cotacaoCompleta.cliente?.telefone || cotacaoCompleta.cliente_telefone || cotacao.cliente.telefone || '',
          tipo: cotacaoCompleta.cliente?.tipo || cotacao.cliente.tipo || 'Particular',
          numeroDocumento: cotacaoCompleta.cliente?.numero_documento || cotacao.cliente.numeroDocumento || '',
          morada: cotacaoCompleta.cliente?.morada || ''
        },
        veiculos: cotacaoCompleta.veiculos || cotacao.veiculos || [],
        totalPremio: parseFloat(cotacaoCompleta.total_premio || cotacao.totalPremio || 0),
        dataCriacao: cotacaoCompleta.data_criacao || cotacaoCompleta.created_at || cotacao.dataCriacao || new Date().toISOString(),
        dataValidade: cotacaoCompleta.data_validade || cotacao.dataValidade,
        status: cotacaoCompleta.status || cotacao.status,
        agente_nome: cotacaoCompleta.agente_nome || cotacao.agente_nome || '',
        agente_balcao: cotacaoCompleta.agente_balcao || cotacao.agente_balcao || ''
      };
      
      // Usar o novo gerador de PDF personalizado (com logo e timbrado em base64)
      const sucesso = await gerarPDFPersonalizado(cotacaoFormatada, acao);
      
      if (sucesso) {
        setTimeout(() => {
          setGerandoPDF(false);
        }, 2000);
      } else {
        setGerandoPDF(false);
      }
      
    } catch (error) {
      console.error('Erro ao gerar documento:', error);
      alert('❌ Erro ao gerar documento. Por favor, tente novamente.');
      setGerandoPDF(false);
    }
  };

  // Funções de ação para os botões
  const visualizarCotacao = (cotacao) => {
    setCotacaoSelecionada(cotacao);
    buscarCotacaoCompletaEgerarPDF(cotacao, 'visualizar');
  };

  const baixarCotacao = (cotacao) => {
    setCotacaoSelecionada(cotacao);
    buscarCotacaoCompletaEgerarPDF(cotacao, 'download');
  };

  const imprimirCotacao = (cotacao) => {
    setCotacaoSelecionada(cotacao);
    buscarCotacaoCompletaEgerarPDF(cotacao, 'imprimir');
  };

  const enviarEmail = async (cotacao) => {
    if (!cotacaoPodePartilhar(cotacao.status_aprovacao)) {
      alert(`Não é possível enviar email: ${getStatusAprovacaoLabel(cotacao.status_aprovacao)}`);
      return;
    }
    if (!cotacao.cliente?.email) {
      alert("❌ O cliente não tem email cadastrado.");
      return;
    }
    
    const confirmarEnvio = window.confirm(
      `Deseja enviar a cotação ${cotacao.numero_cotacao || cotacao.id} por email para ${cotacao.cliente.email}?`
    );
    
    if (!confirmarEnvio) {
      return;
    }

    try {
      setProcessandoEmail(true);
      
      const result = await cotacaoService.enviarEmail(cotacao.id);
      
      console.log('📧 Resultado do envio:', result);
      
      if (result && result.success) {
        alert(`✅ Email enviado com sucesso para ${cotacao.cliente.email}!`);
        setMostrarOpcoesPartilha(false);
      } else {
        const errorMsg = result?.message || result?.error || 'Erro desconhecido';
        alert(`❌ Erro ao enviar email: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro desconhecido';
      alert(`❌ Erro ao enviar email: ${errorMsg}`);
    } finally {
      setProcessandoEmail(false);
    }
  };

  const abrirOpcoesPartilha = (cotacao) => {
    setCotacaoSelecionada(cotacao);
    setMostrarOpcoesPartilha(true);
  };

  return (
    <CotacoesLayout
      title="Listar Cotações"
      subtitle="Visualize e gerencie todas as cotações do sistema"
    >
      <div className="p-4 md:p-6 min-h-screen w-full">
        {/* Loading overlay para geração de PDF */}
        {gerandoPDF && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl border border-emerald-200 flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <div className="text-gray-900 text-lg">Gerando Documento...</div>
              <div className="text-gray-600 text-sm mt-2">Por favor, aguarde</div>
            </div>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="mb-6 pb-4 border-b border-gray-200/60">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-600" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, ID ou matrícula..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 hover:border-emerald-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-emerald-600" />
                <select
                  className="px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors duration-200 min-w-[180px]"
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                >
                  {STATUS_FILTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Estatísticas */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-300 cursor-default">
              <div className="text-sm text-emerald-700">Total de Cotações</div>
              <div className="text-xl font-bold text-gray-900">{pagination.total || 0}</div>
            </div>
            <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-300 cursor-default">
              <div className="text-sm text-green-700">Ativas</div>
              <div className="text-xl font-bold text-gray-900">{cotacoes.filter(c => c.status === 'ativa').length}</div>
            </div>
            <div className="px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-sm text-amber-700">Pendentes</div>
              <div className="text-xl font-bold text-gray-900">{cotacoes.filter(c => c.status === 'pendente').length}</div>
            </div>
            <div className="px-4 py-2 bg-teal-50 rounded-lg border border-teal-200">
              <div className="text-sm text-teal-700">Finalizadas</div>
              <div className="text-xl font-bold text-gray-900">{cotacoes.filter(c => c.status === 'finalizada').length}</div>
            </div>
            <div className="px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200 transition-colors duration-200">
              <div className="text-sm text-yellow-700">Expiradas</div>
              <div className="text-xl font-bold text-gray-900">{cotacoes.filter(c => c.status === 'expirada').length}</div>
            </div>
            <div className="px-4 py-2 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-300 cursor-default">
              <div className="text-sm text-red-700">Canceladas</div>
              <div className="text-xl font-bold text-gray-900">{cotacoes.filter(c => c.status === 'cancelada').length}</div>
            </div>
          </div>
        </div>

        {/* Tabela de Cotações */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-3 text-gray-600">Carregando cotações...</span>
          </div>
        ) : (
          <>
            <DataTableWrapper>
              <table className="w-full min-w-[1280px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-emerald-50/40">
                    <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4 text-emerald-600" />ID</span>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4 text-emerald-600" />Cliente</span>
                    </th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Email / Telefone</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Veículos</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Valor Total</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Data</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-gray-600 whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.length > 0 ? (
                  currentItems.map((cotacao) => (
                    <tr
                      key={cotacao.id}
                      className="hover:bg-emerald-50/60 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-mono text-emerald-700 font-semibold text-sm">
                            {cotacao.numero_cotacao || cotacao.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap max-w-[180px]">
                        <div className="text-gray-900 font-medium truncate">
                          {cotacao.cliente.primeiroNome} {cotacao.cliente.sobrenome}
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          {cotacao.cliente.tipo} • {cotacao.cliente.numeroDocumento || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap max-w-[200px]">
                        <div className="text-gray-700 text-sm truncate" title={cotacao.cliente.email}>{cotacao.cliente.email || 'N/A'}</div>
                        <div className="text-gray-500 text-xs truncate">{cotacao.cliente.telefone || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-700">{cotacao.veiculos?.length || 0} veículo(s)</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-900 font-semibold">
                          MT {parseFloat(cotacao.totalPremio || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-sm">
                        {new Date(cotacao.dataCriacao).toLocaleDateString("pt-MZ")}{' '}
                        {new Date(cotacao.dataCriacao).toLocaleTimeString("pt-MZ", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CotacaoStatusBadge status={cotacao.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {/* Botão VISUALIZAR — apenas se aprovado ou sem necessidade */}
                          <button
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              cotacaoPodePartilhar(cotacao.status_aprovacao)
                                ? 'text-teal-600 hover:bg-teal-50'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={
                              cotacaoPodePartilhar(cotacao.status_aprovacao)
                                ? 'Visualizar Documento'
                                : getStatusAprovacaoLabel(cotacao.status_aprovacao)
                            }
                            onClick={() => cotacaoPodePartilhar(cotacao.status_aprovacao) && visualizarCotacao(cotacao)}
                            disabled={gerandoPDF || !cotacaoPodePartilhar(cotacao.status_aprovacao)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                              Visualizar
                            </span>
                          </button>
                          
                          {/* Botão BAIXAR */}
                          <button
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              cotacaoPodePartilhar(cotacao.status_aprovacao)
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={
                              cotacaoPodePartilhar(cotacao.status_aprovacao)
                                ? 'Baixar Documento'
                                : getStatusAprovacaoLabel(cotacao.status_aprovacao)
                            }
                            onClick={() => cotacaoPodePartilhar(cotacao.status_aprovacao) && baixarCotacao(cotacao)}
                            disabled={gerandoPDF || !cotacaoPodePartilhar(cotacao.status_aprovacao)}
                          >
                            <Download className="h-4 w-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                              Baixar
                            </span>
                          </button>
                          
                          {/* Botão IMPRIMIR */}
                          <button
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              cotacaoPodePartilhar(cotacao.status_aprovacao)
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={
                              cotacaoPodePartilhar(cotacao.status_aprovacao)
                                ? 'Imprimir'
                                : getStatusAprovacaoLabel(cotacao.status_aprovacao)
                            }
                            onClick={() => cotacaoPodePartilhar(cotacao.status_aprovacao) && imprimirCotacao(cotacao)}
                            disabled={gerandoPDF || !cotacaoPodePartilhar(cotacao.status_aprovacao)}
                          >
                            <Printer className="h-4 w-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                              Imprimir
                            </span>
                          </button>
                          
                          {/* Botão MAIS OPÇÕES */}
                          <button
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                            title="Mais opções"
                            onClick={() => abrirOpcoesPartilha(cotacao)}
                            disabled={gerandoPDF}
                          >
                            <Share2 className="h-4 w-4" />
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                              Partilhar
                            </span>
                          </button>
                          
                          {/* Botão DADOS DO CLIENTE (apenas admin/subscritor) */}
                          {isAdminOuSubscritor && (
                            <button
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                              title="Ver Dados do Cliente e Documentos"
                              onClick={() => {
                                setCotacaoSelecionada(cotacao);
                                setMostrarDadosCliente(true);
                              }}
                            >
                              <User className="h-4 w-4" />
                              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap">
                                Dados Cliente
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="text-gray-600">
                        <div className="text-xl mb-2">Nenhuma cotação encontrada</div>
                        <div className="text-sm">Tente ajustar os filtros ou criar uma nova cotação</div>
                      </div>
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </DataTableWrapper>

          {/* Rodapé da Tabela com Paginação */}
          {totalPages > 0 && (
            <AnimatedPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={pagination.total || filteredCotações.length}
              itemsPerPage={itemsPerPage}
              onPageChange={paginate}
            />
          )}
          </>
        )}

        {/* Modal de Dados do Cliente e Documentos */}
        {mostrarDadosCliente && cotacaoSelecionada && (
          <VisualizacaoClienteDocumentos
            cotacaoId={cotacaoSelecionada.id}
            clienteId={cotacaoSelecionada.cliente?.id}
            onClose={() => {
              setMostrarDadosCliente(false);
              setCotacaoSelecionada(null);
            }}
          />
        )}

        {/* Modal de Partilha */}
        {mostrarOpcoesPartilha && cotacaoSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Partilhar Cotação
                </h3>
                <button
                  onClick={() => setMostrarOpcoesPartilha(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-all duration-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all duration-300">
                  <div className="text-gray-800 font-semibold">
                    Cotação: {cotacaoSelecionada.id}
                  </div>
                  <div className="text-gray-600 text-sm">
                    Cliente: {cotacaoSelecionada.cliente.primeiroNome}{" "}
                    {cotacaoSelecionada.cliente.sobrenome}
                  </div>
                  <div className="text-gray-600 text-sm">
                    Total: MT{" "}
                    {parseFloat(cotacaoSelecionada.totalPremio).toLocaleString(
                      "pt-MZ",
                      { minimumFractionDigits: 2 }
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!cotacaoPodePartilhar(cotacaoSelecionada.status_aprovacao) && (
                    <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      {getStatusAprovacaoLabel(cotacaoSelecionada.status_aprovacao)} — PDF e e-mail indisponíveis até aprovação.
                    </div>
                  )}
                  <button
                    onClick={() => baixarCotacao(cotacaoSelecionada)}
                    disabled={gerandoPDF || !cotacaoPodePartilhar(cotacaoSelecionada.status_aprovacao)}
                    className="p-4 rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 flex flex-col items-center justify-center gap-2 disabled:opacity-50 hover:scale-105"
                  >
                    {gerandoPDF ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    ) : (
                      <Download className="h-6 w-6" />
                    )}
                    <span className="font-semibold">
                      {gerandoPDF ? "Gerando..." : "Download"}
                    </span>
                    <span className="text-xs text-gray-600 group-hover:text-white/90">Baixar Documento</span>
                  </button>

                  <button
                    onClick={() => {
                      setMostrarOpcoesPartilha(false);
                      visualizarCotacao(cotacaoSelecionada);
                    }}
                    disabled={gerandoPDF || !cotacaoPodePartilhar(cotacaoSelecionada.status_aprovacao)}
                    className="p-4 rounded-lg border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 flex flex-col items-center justify-center gap-2 disabled:opacity-50 hover:scale-105"
                  >
                    {gerandoPDF ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                    <span className="font-semibold">
                      {gerandoPDF ? "Gerando..." : "Visualizar"}
                    </span>
                    <span className="text-xs text-gray-600 group-hover:text-white/90">Ver Documento</span>
                  </button>

                  <button
                    onClick={() => enviarEmail(cotacaoSelecionada)}
                    disabled={processandoEmail || !cotacaoPodePartilhar(cotacaoSelecionada.status_aprovacao)}
                    className="p-4 rounded-lg border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300 flex flex-col items-center justify-center gap-2 disabled:opacity-50 hover:scale-105"
                  >
                    {processandoEmail ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    ) : (
                      <Send className="h-6 w-6" />
                    )}
                    <span className="font-semibold">
                      {processandoEmail ? "Abrindo..." : "Enviar Email"}
                    </span>
                    <span className="text-xs text-gray-600 group-hover:text-white/90">
                      Enviar para cliente
                    </span>
                  </button>

                  <button
                    onClick={() => imprimirCotacao(cotacaoSelecionada)}
                    disabled={gerandoPDF}
                    className="p-4 rounded-lg border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white transition-all duration-300 flex flex-col items-center justify-center gap-2 disabled:opacity-50 hover:scale-105"
                  >
                    {gerandoPDF ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    ) : (
                      <Printer className="h-6 w-6" />
                    )}
                    <span className="font-semibold">
                      {gerandoPDF ? "Gerando..." : "Imprimir"}
                    </span>
                    <span className="text-xs text-gray-600 group-hover:text-white/90">Imprimir Documento</span>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setMostrarOpcoesPartilha(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CotacoesLayout>
  );
}

export default ListarCotacoes;