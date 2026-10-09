import React, { useState, useEffect, useCallback } from "react";
import {
  Save,
  Search,
  Edit3,
  Download,
  Send,
  Printer,
  Eye,
  X,
  Plus,
  Trash2,
  Loader2,
  FileText,
  ChevronRight,
  User,
  Building,
  Globe,
  Phone,
  Mail,
  Car,
  Shield,
  Calendar,
  Hash,
  DollarSign,
  Filter,
} from "lucide-react";
import CotacoesLayout from "../components/CotacoesLayout";
import CotacaoStatusBadge from "../components/ui/CotacaoStatusBadge";
import AnimatedPagination from "../components/ui/AnimatedPagination";
import DataTableWrapper from "../components/ui/DataTableWrapper";
import { STATUS_FILTER_OPTIONS } from "../utils/cotacaoStatus";
import { gerarPDFPersonalizado } from "../components/GeradorPDFPersonalizado";
import { cotacaoService } from "../services/api";
import {
  configCoberturas,
  TIPOS_COBERTURA_OPCOES,
  titulosContato,
  paises,
  formatosMatricula,
  getClassificacoesDisponiveis,
  getClassificacaoConfig,
  calcularPremioVeiculo,
  calcularPremioComTaxaCustom,
  formatarMatriculaValor,
  exigeCapitalSeguro,
  normalizarClassificacao,
  normalizarTipoCobertura,
  criarVeiculoVazio,
  mapearVeiculoDoBackend,
  deveMostrarSemestral,
  deveMostrarTrimestral,
  deveMostrarMensal,
} from "../utils/cotacaoCoberturas";
import { cotacaoPodePartilhar, getStatusAprovacaoLabel } from "../utils/statusAprovacao";
import "./CriarCotacao.css";

function EditarCotacao() {
  const [cotacaoId, setCotacaoId] = useState("");
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mostrarOpcoesPartilha, setMostrarOpcoesPartilha] = useState(false);
  const [processandoEmail, setProcessandoEmail] = useState(false);
  const [listaCotacoes, setListaCotacoes] = useState([]);
  const [loadingLista, setLoadingLista] = useState(true);
  const [filtroLista, setFiltroLista] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [paginaLista, setPaginaLista] = useState(1);
  const ITENS_POR_PAGINA = 10;
  const [matriculaDropdownId, setMatriculaDropdownId] = useState(null);

  const formatDateInput = (val) => {
    if (!val) return '';
    const str = String(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  };

  const mapearCotacaoParaForm = (cotacao) => {
    const debitoDireto = Boolean(cotacao.debito_direto);

    let veiculos = (cotacao.veiculos || []).map((v) =>
      mapearVeiculoDoBackend(v, { debitoDiretoAtivo: debitoDireto }),
    );

    // Na criação, tipo/classificação são globais — propagar do 1.º veículo se algum estiver vazio
    const referencia = veiculos.find((v) => v.tipoCobertura && v.classificacao);
    if (referencia) {
      veiculos = veiculos.map((v) => ({
        ...v,
        tipoCobertura: v.tipoCobertura || referencia.tipoCobertura,
        classificacao:
          v.classificacao ||
          normalizarClassificacao(
            v.tipoCobertura || referencia.tipoCobertura,
            referencia.classificacao,
            v.tipoViatura,
          ),
      }));
    }

    return {
    id: cotacao.id,
    numero_cotacao: cotacao.numero_cotacao,
    cliente_id: cotacao.cliente_id,
    cliente: {
      tipo: cotacao.cliente?.tipo || 'Particular',
      primeiroNome: cotacao.primeiro_nome || cotacao.cliente?.primeiro_nome || '',
      sobrenome: cotacao.sobrenome || cotacao.cliente?.sobrenome || '',
      email: cotacao.cliente_email || cotacao.cliente?.email || '',
      telefone: cotacao.cliente_telefone || cotacao.cliente?.telefone || '',
      numeroDocumento: cotacao.cliente?.numero_documento || '',
      dataNascimento: formatDateInput(cotacao.cliente?.data_nascimento),
      nomeEmpresa: cotacao.cliente?.nome_empresa || '',
      numeroReferenciaFiscal: cotacao.cliente?.numero_referencia_fiscal || '',
      nacionalidade: cotacao.cliente?.nacionalidade || 'MZ',
      tituloContato: cotacao.cliente?.titulo_contato || ''
    },
    veiculos,
    totalPremio: parseFloat(cotacao.total_premio) || 0,
    status: cotacao.status || 'pendente',
    status_aprovacao: cotacao.status_aprovacao || 'nao_requer',
    historico_aprovacao: cotacao.historico_aprovacao || [],
    dataCriacao: cotacao.data_criacao || cotacao.created_at,
    dataValidade: cotacao.data_validade,
    observacoes: cotacao.proxima_acao || '',
    debitoDireto,
    agente_nome: cotacao.agente_nome || '',
    agente_balcao: cotacao.agente_balcao || ''
  };
  };

  const veiculoTemTaxaManual = (veiculo) => {
    if (veiculo.taxaManual) return true;
    if (!veiculo.tipoCobertura || !veiculo.classificacao) return false;
    const cfg = getClassificacaoConfig(veiculo.tipoCobertura, veiculo.classificacao);
    if (!cfg) return false;
    const taxaAplicada = parseFloat(veiculo.taxa) || 0;
    return Math.abs(taxaAplicada - cfg.taxa) > 0.00001;
  };

  const recalcularVeiculos = (veiculos, debitoDireto = false) => {
    const atualizados = veiculos.map((veiculo) => {
      if (!veiculo.tipoCobertura || !veiculo.classificacao) return veiculo;

      const precisaCapital = exigeCapitalSeguro(veiculo.tipoCobertura);
      if (precisaCapital && !veiculo.capitalSeguro) return veiculo;

      const manual = veiculoTemTaxaManual(veiculo);
      const calc = manual
        ? calcularPremioComTaxaCustom({
            capitalSeguro: precisaCapital ? veiculo.capitalSeguro : "",
            tipoCobertura: veiculo.tipoCobertura,
            classificacao: veiculo.classificacao,
            taxaCustom: parseFloat(veiculo.taxa) || 0,
            debitoDiretoAtivo: debitoDireto,
          })
        : calcularPremioVeiculo({
            capitalSeguro: precisaCapital ? veiculo.capitalSeguro : "",
            tipoCobertura: veiculo.tipoCobertura,
            classificacao: veiculo.classificacao,
            debitoDiretoAtivo: debitoDireto,
          });
      return { ...veiculo, ...calc, taxaManual: manual };
    });
    const totalPremio = atualizados.reduce(
      (total, v) => total + (parseFloat(v.premioAnnual) || 0),
      0,
    );
    return { veiculos: atualizados, totalPremio };
  };

  const atualizarCliente = (campo, valor) => {
    setFormData((prev) => ({
      ...prev,
      cliente: { ...prev.cliente, [campo]: valor },
    }));
  };

  const carregarListaCotacoes = useCallback(async () => {
    try {
      setLoadingLista(true);
      const result = await cotacaoService.listar({ limit: 500 });
      if (result.success) {
        setListaCotacoes(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar lista de cotações:', error);
    } finally {
      setLoadingLista(false);
    }
  }, []);

  useEffect(() => {
    carregarListaCotacoes();
  }, [carregarListaCotacoes]);

  const carregarCotacaoPorId = async (id) => {
    setIsLoading(true);
    try {
      const result = await cotacaoService.buscarPorId(id);
      if (result.success && result.data) {
        const mapped = mapearCotacaoParaForm(result.data);
        const { veiculos, totalPremio } = recalcularVeiculos(mapped.veiculos, mapped.debitoDireto);
        setFormData({ ...mapped, veiculos, totalPremio });
        setCotacaoId(result.data.numero_cotacao || String(result.data.id));
      } else {
        alert(`❌ ${result.message || 'Cotação não encontrada!'}`);
        setFormData(null);
      }
    } catch (error) {
      console.error('Erro ao carregar cotação:', error);
      alert(`❌ Erro ao carregar cotação: ${error.response?.data?.message || error.message}`);
      setFormData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const selecionarCotacao = (cotacao) => {
    carregarCotacaoPorId(cotacao.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Buscar cotação por ID ou número
  const buscarCotacao = async () => {
    if (!cotacaoId) {
      alert("Por favor, digite o ID ou número da cotação.");
      return;
    }

    setIsLoading(true);

    try {
      // Tentar buscar por ID numérico primeiro
      let cotacaoIdNumero = parseInt(cotacaoId);
      let result;

      if (!isNaN(cotacaoIdNumero)) {
        // Se for um número, buscar por ID
        result = await cotacaoService.buscarPorId(cotacaoIdNumero);
      } else {
        // Se não for número, buscar por número de cotação
        // Primeiro listar todas e filtrar
        const listResult = await cotacaoService.listar({ limit: 1000, search: cotacaoId });
        if (listResult.success && listResult.data.length > 0) {
          const cotacaoEncontrada = listResult.data.find(
            c => c.numero_cotacao === cotacaoId || c.numero_cotacao?.toUpperCase() === cotacaoId.toUpperCase()
          );
          if (cotacaoEncontrada) {
            result = await cotacaoService.buscarPorId(cotacaoEncontrada.id);
          } else {
            result = { success: false, message: "Cotação não encontrada" };
          }
        } else {
          result = { success: false, message: "Cotação não encontrada" };
        }
      }

      if (result.success && result.data) {
        const mapped = mapearCotacaoParaForm(result.data);
        const { veiculos, totalPremio } = recalcularVeiculos(mapped.veiculos, mapped.debitoDireto);
        setFormData({ ...mapped, veiculos, totalPremio });
      } else {
        alert(`❌ ${result.message || "Cotação não encontrada!"}`);
        setFormData(null);
      }
    } catch (error) {
      console.error("Erro ao buscar cotação:", error);
      alert(`❌ Erro ao buscar cotação: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
      setFormData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para calcular prémio (reutiliza lógica do formulário de criação)
  const recalcularComDebitoDireto = (debitoDireto) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const { veiculos, totalPremio } = recalcularVeiculos(prev.veiculos, debitoDireto);
      return { ...prev, debitoDireto, veiculos, totalPremio };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData?.id) return;

    try {
      setSalvando(true);

      const payload = {
        total_premio: formData.totalPremio,
        status: formData.status,
        observacoes: formData.observacoes || '',
        cliente: {
          tipo: formData.cliente.tipo,
          primeiro_nome: formData.cliente.primeiroNome,
          sobrenome: formData.cliente.sobrenome,
          email: formData.cliente.email,
          telefone: formData.cliente.telefone,
          numero_documento: formData.cliente.numeroDocumento,
          data_nascimento: formatDateInput(formData.cliente.dataNascimento) || null,
          nacionalidade: formData.cliente.nacionalidade,
          titulo_contato: formData.cliente.tituloContato || null,
          nome_empresa: formData.cliente.nomeEmpresa || null,
          numero_referencia_fiscal: formData.cliente.numeroReferenciaFiscal || null,
        },
        veiculos: formData.veiculos.map((v) => ({
          marca: v.marca || (v.marcaModelo && v.marcaModelo.split(' ')[0]),
          modelo: v.modelo || (v.marcaModelo && v.marcaModelo.split(' ').slice(1).join(' ')),
          marca_modelo: v.marcaModelo || `${v.marca || ''} ${v.modelo || ''}`.trim(),
          matricula: v.matricula,
          matricula_completa: v.matriculaCompleta || v.matricula,
          pais_matricula: v.paisMatricula || null,
          ano: v.ano || null,
          motor: v.motor,
          chassis: v.chassis,
          lotacao: v.lotacao || null,
          tipo_cobertura: v.tipoCobertura || null,
          classificacao: v.classificacao || null,
          capital_seguro: exigeCapitalSeguro(v.tipoCobertura)
            ? parseFloat(v.capitalSeguro) || 0
            : null,
          taxa: parseFloat(v.taxa) || 0,
          premio_anual: parseFloat(v.premioAnnual) || 0,
          premio_semestral: parseFloat(v.premioSemestral) || null,
          premio_trimestral: parseFloat(v.premioTrimestral) || null,
          premio_mensal: parseFloat(v.premioMensal) || null,
          premio_minimo: parseFloat(v.premioMinimo) || null,
        })),
      };

      const result = await cotacaoService.editar(formData.id, payload);

      if (result.success) {
        const statusAprovacao = result.data?.status_aprovacao || formData.status_aprovacao;
        setFormData((prev) => ({
          ...prev,
          status_aprovacao: statusAprovacao,
        }));

        if (cotacaoPodePartilhar(statusAprovacao)) {
          alert('✅ Cotação atualizada com sucesso!');
          setMostrarOpcoesPartilha(true);
        } else {
          alert(
            `✅ Cotação atualizada. ${getStatusAprovacaoLabel(statusAprovacao)} — PDF e e-mail disponíveis após aprovação.`
          );
        }
        carregarListaCotacoes();
        window.dispatchEvent(new CustomEvent('cotacaoCriada'));
      } else {
        alert(`❌ ${result.message || 'Erro ao atualizar cotação'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar cotação:', error);
      alert(`❌ Erro ao atualizar: ${error.response?.data?.message || error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  // Funções para manipular veículos
  const adicionarVeiculo = () => {
    setFormData((prev) => ({
      ...prev,
      veiculos: [...prev.veiculos, criarVeiculoVazio()],
    }));
  };

  const removerVeiculo = (id) => {
    setFormData((prev) => {
      const veiculos = prev.veiculos.filter((v) => v.id !== id);
      const { veiculos: v, totalPremio } = recalcularVeiculos(veiculos, prev.debitoDireto);
      return { ...prev, veiculos: v, totalPremio };
    });
  };

  const atualizarVeiculo = (id, campo, valor) => {
    setFormData((prev) => {
      let veiculos = prev.veiculos.map((veiculo) => {
        if (veiculo.id !== id) return veiculo;

        let updated = { ...veiculo, [campo]: valor };

        if (campo === "tipoCobertura") {
          updated = {
            ...updated,
            classificacao: "",
            capitalSeguro: exigeCapitalSeguro(valor) ? updated.capitalSeguro : "",
            taxa: "",
            taxaAplicada: "",
            taxaManual: false,
            premioAnnual: "",
            premioSemestral: "",
            premioTrimestral: "",
            premioMensal: "",
            premioMinimo: "",
          };
        }

        if (campo === "taxaPercentual") {
          const taxaDecimal = parseFloat(valor) / 100;
          if (!Number.isNaN(taxaDecimal) && taxaDecimal >= 0) {
            updated.taxaManual = true;
            const calc = calcularPremioComTaxaCustom({
              capitalSeguro: exigeCapitalSeguro(updated.tipoCobertura)
                ? updated.capitalSeguro
                : "",
              tipoCobertura: updated.tipoCobertura,
              classificacao: updated.classificacao,
              taxaCustom: taxaDecimal,
              debitoDiretoAtivo: prev.debitoDireto,
            });
            updated = { ...updated, ...calc };
          }
        }

        if (campo === "marca" || campo === "modelo") {
          updated.marcaModelo = `${updated.marca || ""} ${updated.modelo || ""}`.trim();
        }

        if (campo === "paisMatricula") {
          updated.matricula = "";
          updated.matriculaCompleta = "";
        }

        if (campo === "matricula") {
          const fmt = formatarMatriculaValor(valor, updated.paisMatricula);
          updated.matricula = fmt;
          updated.matriculaCompleta = updated.paisMatricula
            ? `${updated.paisMatricula} — ${fmt}`
            : fmt;
        }

        return updated;
      });

      const { veiculos: v, totalPremio } = recalcularVeiculos(veiculos, prev.debitoDireto);
      return { ...prev, veiculos: v, totalPremio };
    });
  };

  const selecionarPaisMatricula = (veiculoId, pais) => {
    atualizarVeiculo(veiculoId, "paisMatricula", pais);
    setMatriculaDropdownId(null);
  };

  // Template único: GeradorPDFPersonalizado
  const cotacaoParaPDF = () => {
    if (!formData) return null;
    return {
      id: formData.id || formData.numero_cotacao,
      dataCriacao: formData.data_criacao || formData.updated_at || new Date().toISOString(),
      cliente: formData.cliente || {},
      veiculos: (formData.veiculos || []).map((v) => ({
        ...v,
        marca: v.marca || (v.marcaModelo && v.marcaModelo.split(" ")[0]),
        modelo: v.modelo || (v.marcaModelo && v.marcaModelo.split(" ").slice(1).join(" ")),
      })),
      totalPremio: formData.totalPremio,
      debitoDireto: formData.debitoDireto,
      agente_nome: formData.agente_nome,
      agente_balcao: formData.agente_balcao,
    };
  };

  const podePartilhar = formData ? cotacaoPodePartilhar(formData.status_aprovacao) : true;

  const gerarPDF = () => {
    if (!podePartilhar) {
      alert(`Não é possível gerar PDF: ${getStatusAprovacaoLabel(formData.status_aprovacao)}`);
      return;
    }
    const cotacao = cotacaoParaPDF();
    if (cotacao) gerarPDFPersonalizado(cotacao, "download");
  };

  const visualizarPDF = () => {
    if (!podePartilhar) {
      alert(`Não é possível visualizar PDF: ${getStatusAprovacaoLabel(formData.status_aprovacao)}`);
      return;
    }
    const cotacao = cotacaoParaPDF();
    if (cotacao) gerarPDFPersonalizado(cotacao, "visualizar");
  };

  const imprimirCotacao = () => {
    if (!podePartilhar) {
      alert(`Não é possível imprimir: ${getStatusAprovacaoLabel(formData.status_aprovacao)}`);
      return;
    }
    const cotacao = cotacaoParaPDF();
    if (cotacao) gerarPDFPersonalizado(cotacao, "imprimir");
  };

  // Função para enviar email
  const enviarEmail = async () => {
    if (!formData) return;

    if (!podePartilhar) {
      alert(`Não é possível enviar email: ${getStatusAprovacaoLabel(formData.status_aprovacao)}`);
      return;
    }

    if (!formData.cliente?.email) {
      alert("❌ O cliente não tem email cadastrado.");
      return;
    }

    const confirmarEnvio = window.confirm(
      `Deseja enviar a cotação ${formData.numero_cotacao || formData.id} por email para ${formData.cliente.email}?`
    );
    
    if (!confirmarEnvio) {
      return;
    }

    try {
      setProcessandoEmail(true);

      const result = await cotacaoService.enviarEmail(formData.id);
      
      if (result.success) {
        alert(`✅ Email enviado com sucesso para ${formData.cliente.email}!`);
        setMostrarOpcoesPartilha(false);
      } else {
        alert(`❌ Erro ao enviar email: ${result.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      alert(`❌ Erro ao enviar email: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
      setProcessandoEmail(false);
    }
  };

  const cotacoesFiltradas = listaCotacoes.filter((c) => {
    if (filtroStatus !== 'all' && c.status !== filtroStatus) return false;
    if (!filtroLista.trim()) return true;
    const termo = filtroLista.toLowerCase();
    const cliente = `${c.primeiro_nome || ''} ${c.sobrenome || ''}`.toLowerCase();
    return (
      c.numero_cotacao?.toLowerCase().includes(termo) ||
      cliente.includes(termo) ||
      String(c.id).includes(termo) ||
      (c.cliente_email || '').toLowerCase().includes(termo)
    );
  });

  const totalPaginasLista = Math.max(1, Math.ceil(cotacoesFiltradas.length / ITENS_POR_PAGINA));
  const cotacoesPagina = cotacoesFiltradas.slice(
    (paginaLista - 1) * ITENS_POR_PAGINA,
    paginaLista * ITENS_POR_PAGINA
  );

  useEffect(() => {
    setPaginaLista(1);
  }, [filtroLista, filtroStatus]);

  return (
    <CotacoesLayout
      title="Editar Cotação"
      subtitle="Selecione uma cotação da lista ou busque pelo número para editar"
    >
      <div className="p-3 sm:p-6 min-h-screen page-container w-full criar-cotacao-page">
        {/* Lista de cotações disponíveis */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100">
                <FileText className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cotações Disponíveis</h3>
                <p className="text-sm text-gray-500">
                  {loadingLista ? 'A carregar...' : `${cotacoesFiltradas.length} cotação(ões)`}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                <input
                  type="text"
                  placeholder="Filtrar por número, cliente ou email..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  value={filtroLista}
                  onChange={(e) => setFiltroLista(e.target.value)}
                />
              </div>
              <div className="relative sm:min-w-[180px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
                <select
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none bg-white"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  {STATUS_FILTER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingLista ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mr-3" />
              Carregando cotações...
            </div>
          ) : cotacoesFiltradas.length === 0 ? (
            <div className="text-center py-16 text-gray-500">Nenhuma cotação encontrada.</div>
          ) : (
            <>
              <DataTableWrapper>
                <table className="w-full min-w-[900px] text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-600">
                      <th className="py-3.5 px-4 font-semibold whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><Hash className="h-4 w-4 text-emerald-600" />Número</span></th>
                      <th className="py-3.5 px-4 font-semibold whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><User className="h-4 w-4 text-emerald-600" />Cliente</span></th>
                      <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Status</th>
                      <th className="py-3.5 px-4 font-semibold whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4 text-emerald-600" />Total</span></th>
                      <th className="py-3.5 px-4 font-semibold whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-emerald-600" />Data</span></th>
                      <th className="py-3.5 px-4 font-semibold text-right whitespace-nowrap">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cotacoesPagina.map((c) => (
                      <tr
                        key={c.id}
                        className={`transition-colors duration-200 hover:bg-emerald-50/70 ${
                          formData?.id === c.id ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2 font-mono text-emerald-700 font-semibold">
                            <FileText className="h-4 w-4 text-emerald-500" />
                            {c.numero_cotacao}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-800 whitespace-nowrap max-w-[200px] truncate" title={`${c.primeiro_nome || ''} ${c.sobrenome || ''}`.trim()}>
                          {`${c.primeiro_nome || ''} ${c.sobrenome || ''}`.trim() || '—'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <CotacaoStatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                          MT {parseFloat(c.total_premio || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                          {c.data_criacao ? new Date(c.data_criacao).toLocaleDateString('pt-MZ') : '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => selecionarCotacao(c)}
                            disabled={isLoading && formData?.id === c.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            {isLoading && formData?.id === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Edit3 className="h-3.5 w-3.5" />
                            )}
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTableWrapper>
              {cotacoesFiltradas.length > ITENS_POR_PAGINA && (
                <AnimatedPagination
                  currentPage={paginaLista}
                  totalPages={totalPaginasLista}
                  totalItems={cotacoesFiltradas.length}
                  itemsPerPage={ITENS_POR_PAGINA}
                  onPageChange={setPaginaLista}
                />
              )}
            </>
          )}
        </div>

        {/* Busca rápida por número */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-center mb-3">
            <Search className="h-5 w-5 text-emerald-600 mr-2" />
            <h3 className="text-base font-semibold text-gray-900">Busca rápida</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Número da cotação (ex: CT-2026-000001)"
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              value={cotacaoId}
              onChange={(e) => setCotacaoId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && buscarCotacao()}
            />
            <button
              type="button"
              onClick={buscarCotacao}
              disabled={isLoading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              <span>{isLoading ? 'Buscando...' : 'Buscar'}</span>
            </button>
          </div>
        </div>

        {/* Formulário de Edição */}
        {formData && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Edit3 className="h-6 w-6 text-emerald-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Editando: {formData.numero_cotacao || formData.id}
                  </h3>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium border border-emerald-200">
                  {formData.status}
                </span>
              </div>

              {/* Dados do Cliente */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Dados do Cliente
                </h4>

                <div className="flex gap-4 justify-center mb-6">
                  <button
                    type="button"
                    onClick={() => atualizarCliente("tipo", "Particular")}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all ${
                      formData.cliente.tipo === "Particular"
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-semibold">Particular</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => atualizarCliente("tipo", "Empresarial")}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all ${
                      formData.cliente.tipo === "Empresarial"
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    <Building className="h-5 w-5" />
                    <span className="font-semibold">Empresarial</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Nacionalidade</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 h-4 w-4" />
                      <select
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg"
                        value={formData.cliente.nacionalidade || "MZ"}
                        onChange={(e) => atualizarCliente("nacionalidade", e.target.value)}
                      >
                        {paises.map((p) => (
                          <option key={p.code} value={p.code}>{p.flag} {p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.cliente.tipo === "Particular" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">Título de Contato</label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                        value={formData.cliente.tituloContato || ""}
                        onChange={(e) => atualizarCliente("tituloContato", e.target.value)}
                      >
                        <option value="">— Selecionar —</option>
                        {titulosContato.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Primeiro Nome *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                      value={formData.cliente.primeiroNome}
                      onChange={(e) => atualizarCliente("primeiroNome", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Sobrenome *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                      value={formData.cliente.sobrenome}
                      onChange={(e) => atualizarCliente("sobrenome", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Telefone *</label>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                      value={formData.cliente.telefone}
                      onChange={(e) => atualizarCliente("telefone", e.target.value)}
                      placeholder="+258"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                      value={formData.cliente.email}
                      onChange={(e) => atualizarCliente("email", e.target.value)}
                    />
                  </div>

                  {formData.cliente.tipo === "Particular" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">Nº Documento *</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                          value={formData.cliente.numeroDocumento}
                          onChange={(e) => atualizarCliente("numeroDocumento", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">Data de Nascimento</label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                          value={formData.cliente.dataNascimento || ""}
                          onChange={(e) => atualizarCliente("dataNascimento", e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">Nome da Empresa</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                          value={formData.cliente.nomeEmpresa || ""}
                          onChange={(e) => atualizarCliente("nomeEmpresa", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">Nº Referência Fiscal (NUIT)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg"
                          value={formData.cliente.numeroReferenciaFiscal || ""}
                          onChange={(e) => atualizarCliente("numeroReferenciaFiscal", e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Dados dos Veículos */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Veículos Segurados
                  </h4>
                  <button
                    type="button"
                    onClick={adicionarVeiculo}
                    className="btn-cotacao-veiculo px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Veículo</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {formData.veiculos.map((veiculo, index) => (
                    <div
                      key={veiculo.id}
                      className="p-6 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold text-gray-800">
                          Viatura {index + 1}
                        </h5>
                        <button
                          type="button"
                          onClick={() => removerVeiculo(veiculo.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Remover veículo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Tipo de Cobertura e Classificação */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Tipo de Cobertura *</label>
                          <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 h-4 w-4" />
                            <select
                              required
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg"
                              value={normalizarTipoCobertura(veiculo.tipoCobertura) || ""}
                              onChange={(e) => atualizarVeiculo(veiculo.id, "tipoCobertura", e.target.value)}
                            >
                              <option value="">— Selecionar Cobertura —</option>
                              {TIPOS_COBERTURA_OPCOES.map((tipo) => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                              ))}
                              {veiculo.tipoCobertura &&
                                !TIPOS_COBERTURA_OPCOES.includes(veiculo.tipoCobertura) && (
                                  <option value={veiculo.tipoCobertura}>{veiculo.tipoCobertura}</option>
                                )}
                            </select>
                          </div>
                        </div>

                        {veiculo.tipoCobertura && (
                          <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">Classificação *</label>
                            <div className="relative">
                              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 h-4 w-4" />
                              <select
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg"
                                value={
                                  normalizarClassificacao(
                                    veiculo.tipoCobertura,
                                    veiculo.classificacao,
                                    veiculo.tipoViatura,
                                  ) || ""
                                }
                                onChange={(e) => atualizarVeiculo(veiculo.id, "classificacao", e.target.value)}
                              >
                                <option value="">— Selecionar Classificação —</option>
                                {getClassificacoesDisponiveis(veiculo.tipoCobertura).map((classe) => (
                                  <option key={classe.nome} value={classe.nome}>{classe.nome}</option>
                                ))}
                                {veiculo.classificacao &&
                                  !getClassificacoesDisponiveis(veiculo.tipoCobertura).some(
                                    (c) => c.nome === veiculo.classificacao,
                                  ) && (
                                    <option value={veiculo.classificacao}>{veiculo.classificacao}</option>
                                  )}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Marca *</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                            value={veiculo.marca || ""}
                            onChange={(e) => atualizarVeiculo(veiculo.id, "marca", e.target.value)}
                            placeholder="Ex: Toyota"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Modelo *</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                            value={veiculo.modelo || ""}
                            onChange={(e) => atualizarVeiculo(veiculo.id, "modelo", e.target.value)}
                            placeholder="Ex: Corolla"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Matrícula</label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setMatriculaDropdownId(
                                  matriculaDropdownId === veiculo.id ? null : veiculo.id,
                                )
                              }
                              className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                            >
                              <span className="truncate">
                                {veiculo.paisMatricula
                                  ? `${veiculo.paisMatricula} — ${formatosMatricula[veiculo.paisMatricula]?.exemplo || ""}`
                                  : "Selecionar país da matrícula"}
                              </span>
                              <ChevronDown className="h-4 w-4 shrink-0" />
                            </button>
                            {matriculaDropdownId === veiculo.id && (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {Object.keys(formatosMatricula).map((pais) => (
                                  <button
                                    key={pais}
                                    type="button"
                                    onClick={() => selecionarPaisMatricula(veiculo.id, pais)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0"
                                  >
                                    {pais}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {veiculo.paisMatricula && (
                            <input
                              type="text"
                              className="w-full mt-2 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                              value={veiculo.matricula || ""}
                              onChange={(e) => atualizarVeiculo(veiculo.id, "matricula", e.target.value)}
                              onBlur={(e) =>
                                atualizarVeiculo(
                                  veiculo.id,
                                  "matricula",
                                  formatarMatriculaValor(e.target.value, veiculo.paisMatricula),
                                )
                              }
                              placeholder={formatosMatricula[veiculo.paisMatricula]?.placeholder || ""}
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Ano</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                            value={veiculo.ano || ""}
                            onChange={(e) => atualizarVeiculo(veiculo.id, "ano", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Motor</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                            value={veiculo.motor || ""}
                            onChange={(e) => atualizarVeiculo(veiculo.id, "motor", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Chassis</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                            value={veiculo.chassis || ""}
                            onChange={(e) => atualizarVeiculo(veiculo.id, "chassis", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Lotação</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                            value={veiculo.lotacao || ""}
                            onChange={(e) => atualizarVeiculo(veiculo.id, "lotacao", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Capital Seguro (MT)
                            {exigeCapitalSeguro(veiculo.tipoCobertura) ? " *" : " (opcional)"}
                          </label>
                          <input
                            type="number"
                            required={exigeCapitalSeguro(veiculo.tipoCobertura)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg"
                            value={veiculo.capitalSeguro || ""}
                            onChange={(e) => atualizarVeiculo(veiculo.id, "capitalSeguro", e.target.value)}
                            placeholder={
                              exigeCapitalSeguro(veiculo.tipoCobertura)
                                ? "Valor em MT (obrigatório)"
                                : "Não aplicável a este tipo de cobertura"
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">
                            Taxa Aplicada {exigeCapitalSeguro(veiculo.tipoCobertura) ? "(%)" : ""}
                          </label>
                          {exigeCapitalSeguro(veiculo.tipoCobertura) ? (
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-semibold"
                              value={
                                veiculo.taxa !== "" && veiculo.taxa != null
                                  ? (parseFloat(veiculo.taxa) * 100).toFixed(2)
                                  : ""
                              }
                              onChange={(e) =>
                                atualizarVeiculo(veiculo.id, "taxaPercentual", e.target.value)
                              }
                            />
                          ) : (
                            <input
                              type="text"
                              readOnly
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold"
                              value={veiculo.taxaAplicada || "Taxa Fixa"}
                            />
                          )}
                          {veiculo.taxaManual && (
                            <p className="text-xs text-amber-700 mt-1">Taxa alterada — pode requerer aprovação.</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Prémio Anual (MT)</label>
                          <input
                            type="text"
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold"
                            value={
                              veiculo.premioAnnual
                                ? `MT ${parseFloat(veiculo.premioAnnual).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}`
                                : "MT 0,00"
                            }
                          />
                        </div>

                        {deveMostrarSemestral(veiculo.tipoCobertura) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Prémio Semestral (MT)</label>
                          <input
                            type="text"
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                            value={
                              veiculo.premioSemestral
                                ? `MT ${parseFloat(veiculo.premioSemestral).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}`
                                : "MT 0,00"
                            }
                          />
                        </div>
                        )}

                        {deveMostrarTrimestral(veiculo.capitalSeguro, veiculo.tipoCobertura, veiculo.premioAnnual) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">Prémio Trimestral (MT)</label>
                            <input
                              type="text"
                              readOnly
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                              value={
                                veiculo.premioTrimestral
                                  ? `MT ${parseFloat(veiculo.premioTrimestral).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}`
                                  : "MT 0,00"
                              }
                            />
                          </div>
                        )}

                        {deveMostrarMensal(veiculo.capitalSeguro, formData.debitoDireto, veiculo.tipoCobertura, veiculo.premioAnnual) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-800 mb-2">Prémio Mensal (MT)</label>
                            <input
                              type="text"
                              readOnly
                              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                              value={
                                veiculo.premioMensal
                                  ? `MT ${parseFloat(veiculo.premioMensal).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}`
                                  : "MT 0,00"
                              }
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2">Prémio Mínimo (MT)</label>
                          <input
                            type="text"
                            readOnly
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                            value={
                              veiculo.premioMinimo
                                ? `MT ${parseFloat(veiculo.premioMinimo).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}`
                                : "MT 0,00"
                            }
                          />
                        </div>
                      </div>

                      {veiculo.tipoCobertura && veiculo.classificacao && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm text-blue-800 font-semibold mb-1">
                            {configCoberturas[veiculo.tipoCobertura]?.nome || veiculo.tipoCobertura}
                          </div>
                          <div className="text-xs text-gray-600">
                            Classificação: {veiculo.classificacao}
                          </div>
                          {veiculo.taxaAplicada && (
                            <div className="text-xs text-gray-600 mt-1">
                              Taxa: {veiculo.taxaAplicada}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Débito Direto */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.debitoDireto)}
                    onChange={(e) => recalcularComDebitoDireto(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-800">Débito Direto (+15% no prémio)</span>
                    <p className="text-sm text-gray-600">
                      Ativa o cálculo do prémio mensal para capitais superiores a MT 12.000
                    </p>
                  </div>
                </label>
              </div>

              {/* Total */}
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800 mb-2">
                    Total: MT{" "}
                    {parseFloat(formData.totalPremio).toLocaleString("pt-MZ", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formData.veiculos.length} veículo(s) | Atualizado em{" "}
                    {new Date().toLocaleDateString("pt-MZ")}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Observações
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                  value={formData.observacoes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  placeholder="Adicione observações sobre a cotação..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setFormData(null)}
                className="btn-cotacao-cancel px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 hover:scale-105"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="btn-cotacao-gerar px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span>{salvando ? 'A guardar...' : 'Atualizar Cotação'}</span>
              </button>
            </div>
          </form>
        )}

        {/* MODAL DE PARTILHA APÓS EDIÇÃO */}
        {mostrarOpcoesPartilha && formData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Partilhar Cotação Atualizada
                </h3>
                <button
                  onClick={() => setMostrarOpcoesPartilha(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-800 font-semibold">
                    Cotação: {formData.numero_cotacao || formData.id}
                  </div>
                  <div className="text-gray-600 text-sm">
                    Cliente: {formData.cliente.primeiroNome}{" "}
                    {formData.cliente.sobrenome}
                  </div>
                  <div className="text-gray-600 text-sm">
                    Total: MT{" "}
                    {parseFloat(formData.totalPremio).toLocaleString("pt-MZ", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-emerald-600 text-sm font-semibold">
                    ✓ Atualizada em {new Date().toLocaleDateString("pt-MZ")}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={visualizarPDF}
                    className="p-4 rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 flex flex-col items-center justify-center gap-2"
                  >
                    <Eye className="h-6 w-6" />
                    <span className="font-semibold">Visualizar PDF</span>
                    <span className="text-xs text-gray-600">Ver cotação</span>
                  </button>

                  <button
                    onClick={gerarPDF}
                    className="p-4 rounded-lg border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 flex flex-col items-center justify-center gap-2"
                  >
                    <Download className="h-6 w-6" />
                    <span className="font-semibold">Download PDF</span>
                    <span className="text-xs text-gray-600">
                      Baixar cotação
                    </span>
                  </button>

                  <button
                    onClick={imprimirCotacao}
                    className="p-4 rounded-lg border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white transition-all duration-300 flex flex-col items-center justify-center gap-2"
                  >
                    <Printer className="h-6 w-6" />
                    <span className="font-semibold">Imprimir</span>
                    <span className="text-xs text-gray-600">
                      Imprimir cotação
                    </span>
                  </button>

                  <button
                    onClick={enviarEmail}
                    disabled={processandoEmail}
                    className="p-4 rounded-lg border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300 flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {processandoEmail ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    ) : (
                      <Send className="h-6 w-6" />
                    )}
                    <span className="font-semibold">
                      {processandoEmail ? "Enviando..." : "Enviar Email"}
                    </span>
                    <span className="text-xs text-gray-600">
                      Para administradores
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setMostrarOpcoesPartilha(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300"
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

export default EditarCotacao;