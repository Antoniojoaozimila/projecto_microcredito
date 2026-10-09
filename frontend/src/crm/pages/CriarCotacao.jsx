import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  User,
  Building,
  ChevronDown,
  Calendar,
  Phone,
  FileText,
  Globe,
  Mail,
  Car,
  Shield,
  Calculator,
  DollarSign,
  Type,
  Hash,
  Calendar as CalendarIcon,
  Cog,
  Barcode,
  Users,
  Percent,
  Download,
  Send,
  X,
  Printer,
  Eye,
  Upload,
  File,
  Loader2,
} from "lucide-react";
import { gerarPDFPersonalizado } from "../components/GeradorPDFPersonalizado";
import { cotacaoService, arquivoService } from "../services/api";
import {
  exigeCapitalSeguro,
  calcularPremioVeiculo,
  calcularPremioComTaxaCustom,
  deveMostrarSemestral,
  deveMostrarTrimestral,
  deveMostrarMensal,
} from "../utils/cotacaoCoberturas";
import { cotacaoPodePartilhar, getStatusAprovacaoLabel } from "../utils/statusAprovacao";
import "./CriarCotacao.css";

function CriarCliente() {
  const [tipoCliente, setTipoCliente] = useState("Particular");
  const [isSwitching, setIsSwitching] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [mostrarOpcoesPartilha, setMostrarOpcoesPartilha] = useState(false);
  const [cotacaoGerada, setCotacaoGerada] = useState(null);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [salvandoCotacao, setSalvandoCotacao] = useState(false);
  const [debitoDiretoAtivo, setDebitoDiretoAtivo] = useState(false);
  const [taxaManualAtiva, setTaxaManualAtiva] = useState(false);
  const [showMatriculaOptions, setShowMatriculaOptions] = useState(false);
  const [paisMatricula, setPaisMatricula] = useState("");
  const [formatoMatricula, setFormatoMatricula] = useState("");
  
  // Estados para upload de documentos
  const [docBI, setDocBI] = useState(null);
  const [docLivrete, setDocLivrete] = useState(null);
  const [previewBI, setPreviewBI] = useState(null);
  const [previewLivrete, setPreviewLivrete] = useState(null);

  // Estados para o formulário da viatura
  const [tipoCobertura, setTipoCobertura] = useState("");
  const [classificacao, setClassificacao] = useState("");
  const [veiculos, setVeiculos] = useState([]);
  const [veiculoAtual, setVeiculoAtual] = useState({
    marca: "",
    modelo: "",
    matricula: "",
    matriculaCompleta: "",
    ano: "",
    motor: "",
    chassis: "",
    lotacao: "",
    capitalSeguro: "",
    taxa: "",
    premioAnnual: "",
    premioSemestral: "",
    premioTrimestral: "",
    premioMensal: "",
    premioMinimo: "",
    taxaAplicada: "",
  });

  const [formData, setFormData] = useState({
    nacionalidade: "MZ",
    tituloContato: "",
    primeiroNome: "",
    sobrenome: "",
    telefone: "+258",
    email: "",
    numeroDocumento: "",
    dataNascimento: "",
    nomeEmpresa: "",
    numeroReferenciaFiscal: "",
  });

  // Configurações das coberturas baseadas na tabela fornecida
  const configCoberturas = {
    "Seguro Automóvel Responsabilidade Civil Apenas": {
      nome: "Seguro Automóvel Responsabilidade Civil Apenas",
      classificacoes: [
        {
          nome: "Ligeiro Peso Bruto Total Até 3.500 kg",
          taxa: 0,
          premioMinimo: 2999
        },
        {
          nome: "Pesado Médio - Peso Bruto Total Entre 3.501 kg a 12.000 kg",
          taxa: 0,
          premioMinimo: 5999
        },
        {
          nome: "Pesado Grande - Peso Bruto Total Entre 12.001 kg a 26.000 kg",
          taxa: 0,
          premioMinimo: 6999
        },
        {
          nome: "Muito Pesado (articulado) - Acima de 26.000 kg (com reboque ou semi-reboque)",
          taxa: 0,
          premioMinimo: 8500
        },
        {
          nome: "Viaturas Especias (Motorizadas)",
          taxa: 0,
          premioMinimo: 2500
        },
        {
          nome: "Viaturas Especias (Atrelados Domesticos)",
          taxa: 0,
          premioMinimo: 2500
        },
        {
          nome: "Viaturas Especias (Atrelados Comerciais)",
          taxa: 0,
          premioMinimo: 3000
        }
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
        {
          nome: "Ligeiro Peso Bruto Total Até 3.500 kg",
          taxa: 0,
          premioMinimo: 3500
        },
        {
          nome: "Pesado Médio - Peso Bruto Total Entre 3.501 kg a 12.000 kg",
          taxa: 0,
          premioMinimo: 6750
        },
        {
          nome: "Pesado Grande - Peso Bruto Total Entre 12.001 kg a 26.000 kg",
          taxa: 0,
          premioMinimo: 6999
        },
        {
          nome: "Muito Pesado (articulado) - Acima de 26.000 kg (com reboque ou semi-reboque)",
          taxa: 0,
          premioMinimo: 8500
        }
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
        {
          nome: "Lotação até 29 Passageiros (Incluindo Motorista e Cobrador)",
          taxa: 0,
          premioMinimo: 15750
        },
        {
          nome: "Lotação até 15 Passageiros (Incluindo Motorista e Cobrador)",
          taxa: 0,
          premioMinimo: 9250
        },
        {
          nome: "Taxis / Yango",
          taxa: 0,
          premioMinimo: 5000
        }
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
        {
          nome: "Ligeiro Peso Bruto Total Até 3.500 kg",
          taxa: 0.04,
          premioMinimo: 12000
        },
        {
          nome: "Pesado Médio - Peso Bruto Total Entre 3.501 kg a 12.000 kg",
          taxa: 0.05,
          premioMinimo: 12000
        },
        {
          nome: "Pesado Grande - Peso Bruto Total Entre 12.001 kg a 26.000 kg",
          taxa: 0.06,
          premioMinimo: 12000
        },
        {
          nome: "Muito Pesado (articulado) - Acima de 26.000 kg (com reboque ou semi-reboque)",
          taxa: 0.075,
          premioMinimo: 15000
        },
        {
          nome: "Ligeiro Matrícula Estrangeira (Ligeiro Peso Bruto Total Até 3.500 kg)",
          taxa: 0.045,
          premioMinimo: 12000
        },
        {
          nome: "Viaturas Especias (Motorizadas)",
          taxa: 0.03,
          premioMinimo: 8000
        },
        {
          nome: "Viaturas Especias (Atrelados Domesticos)",
          taxa: 0.025,
          premioMinimo: 8000
        },
        {
          nome: "Viaturas Especias (Atrelados Comerciais)",
          taxa: 0.03,
          premioMinimo: 8000
        },
        {
          nome: "Txopelas",
          taxa: 0.04,
          premioMinimo: 10000
        }
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

  // Configurações de matrículas por país
  const formatosMatricula = {
    "Moçambique": {
      formato: "XXX-000-XX",
      exemplo: "ABC-123-DE",
      regex: /^[A-Z]{3}-[0-9]{3}-[A-Z]{2}$/,
      placeholder: "ABC-123-DE",
      descricao: "3 letras, 3 números, 2 letras",
      mascara: (valor) => {
        let v = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (v.length > 8) v = v.substring(0, 8);
        let result = '';
        for (let i = 0; i < v.length; i++) {
          if (i === 3 || i === 6) result += '-';
          if (i < 3) {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          } else if (i < 6) {
            result += /[0-9]/.test(v[i]) ? v[i] : '';
          } else {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          }
        }
        return result;
      }
    },
    "África do Sul": {
      formato: "XXX-000-GP",
      exemplo: "ABC-123-GP",
      regex: /^[A-Z]{3}-[0-9]{3}-(GP|EC|FS|KZN|MP|NC|NW|WC)$/,
      placeholder: "ABC-123-GP",
      descricao: "3 letras, 3 números, código província",
      mascara: (valor) => {
        let v = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (v.length > 9) v = v.substring(0, 9);
        let result = '';
        for (let i = 0; i < v.length; i++) {
          if (i === 3 || i === 6) result += '-';
          if (i < 3) {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          } else if (i < 6) {
            result += /[0-9]/.test(v[i]) ? v[i] : '';
          } else {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          }
        }
        return result;
      }
    },
    "KZN (KwaZulu-Natal)": {
      formato: "XXX-000-ZN",
      exemplo: "ABC-123-ZN",
      regex: /^[A-Z]{3}-[0-9]{3}-ZN$/,
      placeholder: "ABC-123-ZN",
      descricao: "3 letras, 3 números, ZN",
      mascara: (valor) => {
        let v = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (v.length > 8) v = v.substring(0, 8);
        let result = '';
        for (let i = 0; i < v.length; i++) {
          if (i === 3 || i === 6) result += '-';
          if (i < 3) {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          } else if (i < 6) {
            result += /[0-9]/.test(v[i]) ? v[i] : '';
          } else {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          }
        }
        if (result.length === 8 && !result.endsWith('ZN')) {
          result = result.substring(0, 7) + 'Z';
        }
        return result;
      }
    },
    "Antiga (CA)": {
      formato: "CA-00000",
      exemplo: "CA-12345",
      regex: /^CA-[0-9]{5}$/,
      placeholder: "CA-12345",
      descricao: "CA seguido de 5 números",
      mascara: (valor) => {
        let v = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (v.length > 7) v = v.substring(0, 7);
        let result = '';
        if (v.startsWith('CA')) {
          result = 'CA-';
          v = v.substring(2);
        } else if (v.startsWith('C')) {
          result = 'C';
          v = v.substring(1);
        } else {
          result = '';
        }
        for (let i = 0; i < v.length && i < 5; i++) {
          result += /[0-9]/.test(v[i]) ? v[i] : '';
        }
        if (result.startsWith('C') && !result.startsWith('CA-')) {
          result = 'CA-' + result.substring(1);
        } else if (!result.startsWith('CA-')) {
          result = 'CA-' + result;
        }
        return result;
      }
    },
    "Eswatini (Suazilândia)": {
      formato: "XSD-000-YZ",
      exemplo: "XSD-123-YZ",
      regex: /^XSD-[0-9]{3}-[A-Z]{2}$/,
      placeholder: "XSD-123-YZ",
      descricao: "XSD, 3 números, 2 letras",
      mascara: (valor) => {
        let v = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (v.length > 8) v = v.substring(0, 8);
        let result = '';
        if (v.startsWith('XSD')) {
          result = 'XSD-';
          v = v.substring(3);
        } else if (v.startsWith('XS')) {
          result = 'XS';
          v = v.substring(2);
        } else if (v.startsWith('X')) {
          result = 'X';
          v = v.substring(1);
        } else {
          result = '';
        }
        for (let i = 0; i < v.length; i++) {
          if (i === 3) result += '-';
          if (i < 3) {
            result += /[0-9]/.test(v[i]) ? v[i] : '';
          } else {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          }
        }
        if (result.startsWith('X') && !result.startsWith('XSD-')) {
          result = 'XSD-' + result.substring(1);
        } else if (!result.startsWith('XSD-')) {
          result = 'XSD-' + result;
        }
        return result;
      }
    },
    "Zimbábue": {
      formato: "XXX-0000",
      exemplo: "ABC-1234",
      regex: /^[A-Z]{3}-[0-9]{4}$/,
      placeholder: "ABC-1234",
      descricao: "3 letras, 4 números",
      mascara: (valor) => {
        let v = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (v.length > 7) v = v.substring(0, 7);
        let result = '';
        for (let i = 0; i < v.length; i++) {
          if (i === 3) result += '-';
          if (i < 3) {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          } else {
            result += /[0-9]/.test(v[i]) ? v[i] : '';
          }
        }
        return result;
      }
    },
    "Malawi": {
      formato: "XX-0000",
      exemplo: "AB-1234",
      regex: /^[A-Z]{2}-[0-9]{4}$/,
      placeholder: "AB-1234",
      descricao: "2 letras, 4 números",
      mascara: (valor) => {
        let v = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (v.length > 6) v = v.substring(0, 6);
        let result = '';
        for (let i = 0; i < v.length; i++) {
          if (i === 2) result += '-';
          if (i < 2) {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          } else {
            result += /[0-9]/.test(v[i]) ? v[i] : '';
          }
        }
        return result;
      }
    },
    "Zâmbia": {
      formato: "XXX-000",
      exemplo: "ABC-123",
      regex: /^[A-Z]{3}-[0-9]{3}$/,
      placeholder: "ABC-123",
      descricao: "3 letras, 3 números",
      mascara: (valor) => {
        let v = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (v.length > 6) v = v.substring(0, 6);
        let result = '';
        for (let i = 0; i < v.length; i++) {
          if (i === 3) result += '-';
          if (i < 3) {
            result += /[A-Z]/.test(v[i]) ? v[i] : '';
          } else {
            result += /[0-9]/.test(v[i]) ? v[i] : '';
          }
        }
        return result;
      }
    },
    "Outros": {
      formato: "Livre",
      exemplo: "Qualquer formato",
      regex: /^.+$/,
      placeholder: "Digite a matrícula",
      descricao: "Formato livre",
      mascara: (valor) => valor.toUpperCase()
    }
  };

  const titulosContato = ["Sr.", "Sra.", "Dr.", "Dra.", "Eng.", "Arq."];

  const paises = [
    { code: "MZ", name: "Moçambique", flag: "🇲🇿" },
    { code: "AO", name: "Angola", flag: "🇦🇴" },
    { code: "PT", name: "Portugal", flag: "🇵🇹" },
    { code: "BR", name: "Brasil", flag: "🇧🇷" },
    { code: "CV", name: "Cabo Verde", flag: "🇨🇻" },
  ];

  // Função para selecionar o país da matrícula
  const selecionarPaisMatricula = (pais) => {
    setPaisMatricula(pais);
    setFormatoMatricula(formatosMatricula[pais]);
    setShowMatriculaOptions(false);
    
    // Resetar a matrícula quando mudar de país
    setVeiculoAtual(prev => ({
      ...prev,
      matricula: "",
      matriculaCompleta: ""
    }));
  };

  // Função para formatar a matrícula conforme o país selecionado
  const formatarMatricula = (valor) => {
    if (!paisMatricula || paisMatricula === "Outros") {
      return valor.toUpperCase();
    }
    
    const formato = formatosMatricula[paisMatricula];
    if (!formato || !formato.mascara) {
      return valor.toUpperCase();
    }
    
    return formato.mascara(valor);
  };

  // Handler para mudança na matrícula
  const handleMatriculaChange = (valor) => {
    const formatada = formatarMatricula(valor);
    
    setVeiculoAtual(prev => ({
      ...prev,
      matricula: formatada,
      matriculaCompleta: paisMatricula ? `${paisMatricula} — ${formatada}` : formatada
    }));
  };

  // Validar matrícula
  const validarMatricula = () => {
    if (!veiculoAtual.matricula || !paisMatricula) return true;
    
    if (paisMatricula === "Outros") return true;
    
    const formato = formatosMatricula[paisMatricula];
    if (!formato || !formato.regex) return true;
    
    return formato.regex.test(veiculoAtual.matricula);
  };

  // Obter classificações disponíveis para a cobertura selecionada
  const getClassificacoesDisponiveis = () => {
    if (!tipoCobertura || !configCoberturas[tipoCobertura]) return [];
    return configCoberturas[tipoCobertura].classificacoes;
  };

  // Obter configuração da classificação selecionada
  const getClassificacaoConfig = () => {
    if (!tipoCobertura || !classificacao || !configCoberturas[tipoCobertura]) 
      return null;
    
    return configCoberturas[tipoCobertura].classificacoes.find(
      c => c.nome === classificacao
    );
  };

  // Atualizar cálculo do prêmio quando houver mudanças (taxa padrão)
  useEffect(() => {
    if (!tipoCobertura || !classificacao || taxaManualAtiva) return;

    const precisaCapital = exigeCapitalSeguro(tipoCobertura);
    if (precisaCapital && !veiculoAtual.capitalSeguro) return;

    const resultado = calcularPremioVeiculo({
      capitalSeguro: veiculoAtual.capitalSeguro,
      tipoCobertura,
      classificacao,
      debitoDiretoAtivo,
    });

    setVeiculoAtual((prev) => ({
      ...prev,
      taxa: resultado.taxa,
      premioAnnual: resultado.premioAnnual,
      premioSemestral: resultado.premioSemestral,
      premioTrimestral: resultado.premioTrimestral,
      premioMensal: resultado.premioMensal,
      premioMinimo: resultado.premioMinimo,
      taxaAplicada: resultado.taxaAplicada,
    }));
  }, [veiculoAtual.capitalSeguro, tipoCobertura, classificacao, debitoDiretoAtivo, taxaManualAtiva]);

  const handleTaxaPercentualChange = (valorPercentual) => {
    if (!tipoCobertura || !classificacao) return;
    const taxaDecimal = parseFloat(valorPercentual);
    if (Number.isNaN(taxaDecimal) || taxaDecimal < 0) return;

    setTaxaManualAtiva(true);
    const resultado = calcularPremioComTaxaCustom({
      capitalSeguro: veiculoAtual.capitalSeguro,
      tipoCobertura,
      classificacao,
      taxaCustom: taxaDecimal / 100,
      debitoDiretoAtivo,
    });

    setVeiculoAtual((prev) => ({
      ...prev,
      ...resultado,
    }));
  };

  // Resetar classificação quando mudar o tipo de cobertura
  useEffect(() => {
    setClassificacao("");
    setTaxaManualAtiva(false);
    setVeiculoAtual(prev => ({
      ...prev,
      capitalSeguro: exigeCapitalSeguro(tipoCobertura) ? prev.capitalSeguro : "",
      taxa: "",
      premioAnnual: "",
      premioSemestral: "",
      premioTrimestral: "",
      premioMensal: "",
      premioMinimo: "",
      taxaAplicada: ""
    }));
  }, [tipoCobertura]);

  // Handlers para upload de documentos
  const handleFileUpload = (file, type) => {
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Por favor, envie apenas arquivos PDF ou imagem (JPG, PNG)');
      return;
    }
    
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      alert('O arquivo é muito grande. Tamanho máximo: 20MB');
      return;
    }
    
    if (type === 'bi') {
      setDocBI(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewBI(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (type === 'livrete') {
      setDocLivrete(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLivrete(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removerDocumento = (type) => {
    if (type === 'bi') {
      setDocBI(null);
      setPreviewBI(null);
    } else if (type === 'livrete') {
      setDocLivrete(null);
      setPreviewLivrete(null);
    }
  };

  // Função para calcular total do prêmio
  const calcularTotalPremio = () => {
    return veiculos.reduce(
      (total, veiculo) => total + (parseFloat(veiculo.premioAnnual) || 0),
      0
    );
  };

  const todosVeiculosTodosRiscos = () =>
    veiculos.length > 0 &&
    veiculos.every((v) => deveMostrarSemestral(v.tipoCobertura));

  const deveMostrarCamposEspeciaisNoTotal = () => {
    if (!todosVeiculosTodosRiscos()) return false;
    return veiculos.some((v) =>
      deveMostrarTrimestral(v.capitalSeguro, v.tipoCobertura, v.premioAnnual),
    );
  };

  // Formatar moeda
  const formatarMoeda = (valor) => {
    if (!valor || valor === "0.00") return "MT 0,00";
    return `MT ${parseFloat(valor).toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };


  // Função para gerar ID único da cotação
  const gerarIdCotacao = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `CT${timestamp}${random}`;
  };

  // Função para salvar cotação no backend
  const salvarCotacao = async () => {
    if (!formData.email || veiculos.length === 0) {
      alert(
        "Preencha todos os dados do cliente e adicione pelo menos um veículo!"
      );
      return;
    }

    // Validar documentos
    if (tipoCliente === "Particular") {
      if (!docBI || !docLivrete) {
        alert("Por favor, faça upload do BI e do livrete!");
        return;
      }
    } else {
      if (!docLivrete) {
        alert("Por favor, faça upload do livrete!");
        return;
      }
    }

    try {
      setSalvandoCotacao(true);

      // Preparar dados para o backend
      const cotacaoData = {
        cliente: {
          tipo: tipoCliente,
          nacionalidade: formData.nacionalidade,
          titulo_contato: formData.tituloContato || null,
          primeiro_nome: formData.primeiroNome,
          sobrenome: formData.sobrenome,
          telefone: formData.telefone,
          email: formData.email,
          numero_documento: formData.numeroDocumento,
          data_nascimento: formData.dataNascimento || null,
          nome_empresa: formData.nomeEmpresa || null,
          numero_referencia_fiscal: formData.numeroReferenciaFiscal || null
        },
        veiculos: veiculos.map((v) => ({
          marca: v.marca,
          modelo: v.modelo,
          matricula: v.matriculaCompleta || v.matricula || null,
          ano: v.ano || null,
          motor: v.motor || null,
          chassis: v.chassis || null,
          lotacao: v.lotacao || null,
          tipo_cobertura: tipoCobertura,
          classificacao: classificacao,
          capital_seguro: exigeCapitalSeguro(tipoCobertura)
            ? parseFloat(v.capitalSeguro) || 0
            : null,
          taxa: parseFloat(v.taxa) || 0,
          premio_anual: parseFloat(v.premioAnnual) || 0,
          premio_semestral: parseFloat(v.premioSemestral) || 0,
          premio_trimestral: parseFloat(v.premioTrimestral) || 0,
          premio_mensal: parseFloat(v.premioMensal) || 0
        })),
        total_premio: calcularTotalPremio(),
        status: "ativa",
        debito_direto: debitoDiretoAtivo
      };

      const result = await cotacaoService.criar(cotacaoData);

      if (result.success) {
        const cotacaoId = result.data.id;

        // Upload dos documentos do cliente
        const docsUpdate = {};
        if (tipoCliente === "Particular" && docBI) {
          const uploadBI = await arquivoService.upload(docBI, 'cotacoes');
          if (uploadBI.success) docsUpdate.doc_bi_path = uploadBI.data.path;
        }
        if (docLivrete) {
          const uploadLivrete = await arquivoService.upload(docLivrete, 'cotacoes');
          if (uploadLivrete.success) docsUpdate.doc_livrete_path = uploadLivrete.data.path;
        }
        if (Object.keys(docsUpdate).length > 0) {
          await cotacaoService.atualizarDocumentos(cotacaoId, docsUpdate);
        }

        // Formatar cotação para exibição
        const novaCotacao = {
          id: result.data.numero_cotacao || result.data.id,
          idBackend: cotacaoId,
          numero_cotacao: result.data.numero_cotacao || result.data.id,
          dataCriacao: result.data.data_criacao || new Date().toISOString(),
          cliente: {
            tipo: tipoCliente,
            ...formData,
          },
          documentos: {
            bi: docsUpdate.doc_bi_path || (tipoCliente === "Particular" ? docBI?.name : null),
            livrete: docsUpdate.doc_livrete_path || docLivrete?.name
          },
          veiculos: veiculos.map((v) => ({
            ...v,
            tipoCobertura: tipoCobertura,
            classificacao: classificacao,
            configCobertura: configCoberturas[tipoCobertura],
            classificacaoConfig: getClassificacaoConfig()
          })),
          totalPremio: calcularTotalPremio(),
          status: "ativa",
          status_aprovacao: result.data.status_aprovacao || 'nao_requer',
          dataInicio: new Date().toISOString(),
          dataFim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          debitoDireto: debitoDiretoAtivo,
          agente_nome: result.data.agente_nome || '',
          agente_balcao: result.data.agente_balcao || ''
        };

        setCotacaoGerada(novaCotacao);

        if (cotacaoPodePartilhar(novaCotacao.status_aprovacao)) {
          setMostrarOpcoesPartilha(true);
          alert("✅ Cotação criada com sucesso! ID: " + novaCotacao.id);
        } else {
          alert(
            `✅ Cotação criada (ID: ${novaCotacao.id}). ${getStatusAprovacaoLabel(novaCotacao.status_aprovacao)} — PDF e e-mail disponíveis após aprovação.`
          );
        }
      } else {
        alert("❌ Erro ao criar cotação: " + (result.message || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro ao salvar cotação:", error);
      alert("❌ Erro ao criar cotação. Por favor, tente novamente.");
    } finally {
      setSalvandoCotacao(false);
    }
  };

  // Função para enviar cotação por email (via backend, igual à Lista de Cotações)
  const enviarEmail = async () => {
    if (!cotacaoGerada) return;

    if (!cotacaoPodePartilhar(cotacaoGerada.status_aprovacao)) {
      alert(`Não é possível enviar email: ${getStatusAprovacaoLabel(cotacaoGerada.status_aprovacao)}`);
      return;
    }

    if (!cotacaoGerada.cliente.email) {
      alert("❌ É necessário ter um email do cliente para enviar a cotação.");
      return;
    }

    const cotacaoId = cotacaoGerada.idBackend;
    if (!cotacaoId) {
      alert("❌ ID da cotação não encontrado. Tente recarregar a página.");
      return;
    }

    const confirmarEnvio = window.confirm(
      `Deseja enviar a cotação ${cotacaoGerada.numero_cotacao || cotacaoGerada.id} para o email ${cotacaoGerada.cliente.email}?`
    );

    if (!confirmarEnvio) return;

    try {
      setEnviandoEmail(true);
      const result = await cotacaoService.enviarEmail(cotacaoId);

      if (result && result.success) {
        alert(`✅ Email enviado com sucesso para ${cotacaoGerada.cliente.email}!`);
        setMostrarOpcoesPartilha(false);
      } else {
        alert(`❌ Erro ao enviar email: ${result?.message || result?.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      alert(`❌ Erro ao enviar email: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
      setEnviandoEmail(false);
    }
  };

  // FUNÇÕES AUXILIARES
  const handleTipoClienteChange = (novoTipo) => {
    if (novoTipo !== tipoCliente) {
      setIsSwitching(true);
      setTimeout(() => {
        setTipoCliente(novoTipo);
        setIsSwitching(false);
      }, 300);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    salvarCotacao();
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVeiculoChange = (field, value) => {
    setVeiculoAtual((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const adicionarVeiculo = () => {
    if (
      !veiculoAtual.marca ||
      !veiculoAtual.modelo ||
      !tipoCobertura ||
      !classificacao ||
      !paisMatricula
    ) {
      alert("Preencha todos os campos obrigatórios do veículo!");
      return;
    }

    if (exigeCapitalSeguro(tipoCobertura) && !veiculoAtual.capitalSeguro) {
      alert("O Capital Seguro é obrigatório para Seguro Automóvel Todos os Riscos.");
      return;
    }

    // Validar matrícula se não for "Outros"
    if (paisMatricula !== "Outros" && !validarMatricula()) {
      alert(`Por favor, insira uma matrícula válida para ${paisMatricula}. Formato: ${formatoMatricula?.exemplo}`);
      return;
    }

    const classificacaoConfig = getClassificacaoConfig();
    const premioAnnualNum = parseFloat(veiculoAtual.premioAnnual) || 0;
    const mostrarTrimestral = deveMostrarTrimestral(
      veiculoAtual.capitalSeguro,
      tipoCobertura,
      premioAnnualNum,
    );
    const mostrarMensal = deveMostrarMensal(
      veiculoAtual.capitalSeguro,
      debitoDiretoAtivo,
      tipoCobertura,
      premioAnnualNum,
    );
    
    // Garantir que os prêmios estão calculados corretamente
    let premioTrimestral = veiculoAtual.premioTrimestral;
    let premioMensal = veiculoAtual.premioMensal;
    
    if (mostrarTrimestral && (!premioTrimestral || premioTrimestral === "0.00")) {
      const premioAnnualNum = parseFloat(veiculoAtual.premioAnnual) || 0;
      premioTrimestral = (premioAnnualNum / 4).toFixed(2);
    }
    
    if (mostrarMensal && (!premioMensal || premioMensal === "0.00")) {
      const premioAnnualNum = parseFloat(veiculoAtual.premioAnnual) || 0;
      premioMensal = (premioAnnualNum / 12).toFixed(2);
    }
    
    setVeiculos((prev) => [
      ...prev,
      {
        ...veiculoAtual,
        id: Date.now(),
        tipoCobertura: tipoCobertura,
        classificacao: classificacao,
        configCobertura: configCoberturas[tipoCobertura],
        classificacaoConfig: classificacaoConfig,
        paisMatricula: paisMatricula,
        formatoMatricula: formatoMatricula?.exemplo,
        premioTrimestral: mostrarTrimestral ? premioTrimestral : "",
        premioMensal: mostrarMensal ? premioMensal : ""
      },
    ]);
    
    // Resetar formulário do veículo
    setVeiculoAtual({
      marca: "",
      modelo: "",
      matricula: "",
      matriculaCompleta: "",
      ano: "",
      motor: "",
      chassis: "",
      lotacao: "",
      capitalSeguro: "",
      taxa: "",
      premioAnnual: "",
      premioSemestral: "",
      premioTrimestral: "",
      premioMensal: "",
      premioMinimo: "",
      taxaAplicada: "",
    });
    
    setClassificacao("");
    setPaisMatricula("");
    setFormatoMatricula(null);
  };

  const removerVeiculo = (id) => {
    setVeiculos((prev) => prev.filter((v) => v.id !== id));
  };

  const getPaisSelecionado = () => {
    return (
      paises.find((pais) => pais.code === formData.nacionalidade) || paises[0]
    );
  };

  // Funções de visualização/download – template único GeradorPDFPersonalizado
  const gerarPDF = () => {
    if (cotacaoGerada) gerarPDFPersonalizado(cotacaoGerada, "download");
  };

  const visualizarPDF = () => {
    if (cotacaoGerada) gerarPDFPersonalizado(cotacaoGerada, "visualizar");
  };

  const imprimirCotacao = () => {
    if (cotacaoGerada) gerarPDFPersonalizado(cotacaoGerada, "imprimir");
  };

  return (
    <div className="criar-cotacao-page page-container min-h-screen bg-white p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {tipoCliente === "Particular"
              ? "Criar Nova Cotação"
              : "Criar Cotação Empresarial"}
          </h1>
          <div className="flex items-center justify-center gap-2 text-emerald-700">
            <div className="w-8 h-px bg-emerald-600" />
            <p className="text-sm font-medium text-gray-700">
              Os campos assinalados com * são obrigatórios
            </p>
            <div className="w-8 h-px bg-emerald-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Container Principal - Dados do Cliente */}
          <div className="space-y-6">
            {/* Seletor de Tipo de Cliente */}
            <div className="p-6 border-b border-emerald-200">
              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => handleTipoClienteChange("Particular")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-500 transform hover:scale-105 ${
                    tipoCliente === "Particular"
                      ? "bg-emerald-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                  } ${isSwitching ? "animate-pulse" : ""}`}
                >
                  <User className="h-5 w-5" />
                  <span className="font-semibold">Particular</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTipoClienteChange("Empresarial")}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-500 transform hover:scale-105 ${
                    tipoCliente === "Empresarial"
                      ? "bg-emerald-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                  } ${isSwitching ? "animate-pulse" : ""}`}
                >
                  <Building className="h-5 w-5" />
                  <span className="font-semibold">Empresarial</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div
                className={`transition-all duration-500 ${
                  isSwitching ? "opacity-0 scale-95" : "opacity-100 scale-100"
                }`}
              >
                {tipoCliente === "Particular" ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                      <h3 className="text-xl font-bold text-gray-900">
                        Dados Pessoais
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Primeira linha - 3 campos */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Nacionalidade *
                        </label>
                        <div className="relative group">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4 z-10" />
                          <select
                            required
                            className="w-full pl-10 pr-10 py-3 rounded-lg text-gray-800 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer bg-white border border-gray-300"
                            value={formData.nacionalidade}
                            onChange={(e) =>
                              handleInputChange("nacionalidade", e.target.value)
                            }
                          >
                            {paises.map((pais, index) => (
                              <option key={index} value={pais.code}>
                                {pais.flag} {pais.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10">
                            <span className="text-lg">
                              {getPaisSelecionado().flag}
                            </span>
                            <ChevronDown className="text-emerald-600 h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Título de Contato
                        </label>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4 z-10" />
                          <select
                            className="w-full pl-10 pr-10 py-3 rounded-lg text-gray-800 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer bg-white border border-gray-300"
                            value={formData.tituloContato}
                            onChange={(e) =>
                              handleInputChange("tituloContato", e.target.value)
                            }
                          >
                            <option value="">- Selecionar -</option>
                            {titulosContato.map((titulo, index) => (
                              <option key={index} value={titulo}>
                                {titulo}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4 z-10" />
                        </div>
                      </div>

                      <div className="lg:col-span-1"></div>

                      {/* Segunda linha - 3 campos */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Primeiro Nome *
                        </label>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                          <input
                            type="text"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                            placeholder="Primeiro nome"
                            value={formData.primeiroNome}
                            onChange={(e) =>
                              handleInputChange("primeiroNome", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Sobrenome *
                        </label>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                          <input
                            type="text"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                            placeholder="Sobrenome"
                            value={formData.sobrenome}
                            onChange={(e) =>
                              handleInputChange("sobrenome", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Telefone Móvel *
                        </label>
                        <div className="relative group">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                          <input
                            type="tel"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                            placeholder="+258"
                            value={formData.telefone}
                            onChange={(e) =>
                              handleInputChange("telefone", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      {/* Terceira linha - 3 campos */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Email *
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                          <input
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Nº Documento *
                        </label>
                        <div className="relative group">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                          <input
                            type="text"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                            placeholder="BI/Passaporte"
                            value={formData.numeroDocumento}
                            onChange={(e) =>
                              handleInputChange(
                                "numeroDocumento",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Data de Nascimento *
                        </label>
                        <div className="relative group">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                          <input
                            type="date"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                            value={formData.dataNascimento}
                            onChange={(e) =>
                              handleInputChange(
                                "dataNascimento",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Upload de documentos para cliente particular */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        <h4 className="text-lg font-bold text-gray-900">
                          Documentos Obrigatórios
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Upload do BI */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-800">
                            Cópia do BI/Passaporte *
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors duration-300">
                            {!docBI ? (
                              <div className="text-center">
                                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files[0], 'bi')}
                                  />
                                  <span className="text-emerald-600 hover:text-emerald-700">
                                    Clique para fazer upload
                                  </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  PDF, JPG ou PNG (max 20MB)
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <File className="h-8 w-8 text-emerald-600" />
                                  <div>
                                    <p className="text-gray-800 text-sm">{docBI.name}</p>
                                    <p className="text-gray-500 text-xs">
                                      {(docBI.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removerDocumento('bi')}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Upload do Livrete */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-800">
                            Cópia do Livrete *
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors duration-300">
                            {!docLivrete ? (
                              <div className="text-center">
                                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files[0], 'livrete')}
                                  />
                                  <span className="text-emerald-600 hover:text-emerald-700">
                                    Clique para fazer upload
                                  </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  PDF, JPG ou PNG (max 20MB)
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <File className="h-8 w-8 text-emerald-600" />
                                  <div>
                                    <p className="text-gray-800 text-sm">{docLivrete.name}</p>
                                    <p className="text-gray-500 text-xs">
                                      {(docLivrete.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removerDocumento('livrete')}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                      <h3 className="text-xl font-bold text-gray-900">
                        Dados da Empresa
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Primeira linha - 2 campos */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Nacionalidade *
                        </label>
                        <div className="relative group">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4 z-10" />
                          <select
                            required
                            className="w-full pl-10 pr-10 py-3 rounded-lg text-gray-800 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer bg-white border border-gray-300"
                            value={formData.nacionalidade}
                            onChange={(e) =>
                              handleInputChange("nacionalidade", e.target.value)
                            }
                          >
                            {paises.map((pais, index) => (
                              <option key={index} value={pais.code}>
                                {pais.flag} {pais.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10">
                            <span className="text-lg">
                              {getPaisSelecionado().flag}
                            </span>
                            <ChevronDown className="text-emerald-600 h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Nome da Empresa *
                        </label>
                        <div className="relative group">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                          <input
                            type="text"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                            placeholder="Nome da empresa"
                            value={formData.nomeEmpresa}
                            onChange={(e) =>
                              handleInputChange("nomeEmpresa", e.target.value)
                            }
                          />
                        </div>
                      </div>

                      {/* Segunda linha - 2 campos */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          NUIT *
                        </label>
                        <div className="relative group">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                          <input
                            type="text"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                            placeholder="Número de referência fiscal"
                            value={formData.numeroReferenciaFiscal}
                            onChange={(e) =>
                              handleInputChange(
                                "numeroReferenciaFiscal",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Email / Email Institucional *
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                          <input
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                            placeholder="empresa@email.com"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Upload de documentos para cliente empresarial (apenas livrete) */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        <h4 className="text-lg font-bold text-gray-900">
                          Documentos Obrigatórios
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Upload do Livrete (empresarial) */}
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-800">
                            Cópia do Livrete *
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors duration-300">
                            {!docLivrete ? (
                              <div className="text-center">
                                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files[0], 'livrete')}
                                  />
                                  <span className="text-emerald-600 hover:text-emerald-700">
                                    Clique para fazer upload
                                  </span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                  PDF, JPG ou PNG (max 20MB)
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <File className="h-8 w-8 text-emerald-600" />
                                  <div>
                                    <p className="text-gray-800 text-sm">{docLivrete.name}</p>
                                    <p className="text-gray-500 text-xs">
                                      {(docLivrete.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removerDocumento('livrete')}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="p-6 border-t border-emerald-200">
              <div className="flex justify-between items-center cotacao-acoes">
                <button
                  type="button"
                  className="btn-cotacao-cancel px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 border-2 font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowVehicleForm(true)}
                    className="btn-cotacao-veiculo px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-3 group bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Car className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    <span>Adicionar Veículo</span>
                  </button>

                  <button
                    type="submit"
                    disabled={salvandoCotacao}
                    className="btn-cotacao-gerar px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-3 group bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {salvandoCotacao ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                        <span>Gerar Cotação</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO DE DADOS DA VIATURA */}
          {showVehicleForm && (
            <div className="space-y-6 cotacao-viatura">
              <div className="p-6 border-b border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-8 bg-blue-500 rounded-full" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Dados da Viatura
                  </h3>
                </div>

                {/* Seleção do Tipo de Cobertura */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Tipo de Cobertura *
                    </label>
                    <div className="relative group">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                      <select
                        required
                        className="w-full pl-10 pr-10 py-3 rounded-lg text-gray-800 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer bg-white border border-gray-300"
                        value={tipoCobertura}
                        onChange={(e) => setTipoCobertura(e.target.value)}
                      >
                        <option value="">- Selecionar Cobertura -</option>
                        <option value="Seguro Automóvel Responsabilidade Civil Apenas">
                          Seguro Automóvel Responsabilidade Civil Apenas
                        </option>
                        <option value="Seguro Automóvel Responsabilidade Civil & Ocupantes">
                          Seguro Automóvel Responsabilidade Civil & Ocupantes
                        </option>
                        <option value="Seguro de Transporte Público">
                          Seguro de Transporte Público
                        </option>
                        <option value="Seguro Automóvel Todos os Riscos">
                          Seguro Automóvel Todos os Riscos
                        </option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                    </div>
                  </div>

                  {/* Campo de Classificação (aparece apenas quando cobertura é selecionada) */}
                  {tipoCobertura && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-800">
                        Classificação *
                      </label>
                      <div className="relative group">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                        <select
                          required
                          className="w-full pl-10 pr-10 py-3 rounded-lg text-gray-800 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer bg-white border border-gray-300"
                          value={classificacao}
                          onChange={(e) => setClassificacao(e.target.value)}
                        >
                          <option value="">- Selecionar Classificação -</option>
                          {getClassificacoesDisponiveis().map((classe, index) => (
                            <option key={index} value={classe.nome}>
                              {classe.nome}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4 z-10" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Formulário de Dados do Veículo - 3 colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  {/* Primeira linha - 3 campos */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Marca *
                    </label>
                    <div className="relative group">
                      <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-blue-500 bg-white border border-gray-300"
                        placeholder="Ex: Toyota"
                        value={veiculoAtual.marca}
                        onChange={(e) =>
                          handleVeiculoChange("marca", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Modelo *
                    </label>
                    <div className="relative group">
                      <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-blue-500 bg-white border border-gray-300"
                        placeholder="Ex: Corolla"
                        value={veiculoAtual.modelo}
                        onChange={(e) =>
                          handleVeiculoChange("modelo", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Campo de Matrícula com seleção de país */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Matrícula *
                    </label>
                    <div className="relative">
                      {/* Botão para selecionar o país da matrícula */}
                      <button
                        type="button"
                        onClick={() => setShowMatriculaOptions(!showMatriculaOptions)}
                        className="cotacao-matricula-btn w-full flex items-center justify-between pl-10 pr-4 py-3 rounded-lg text-gray-800 transition-all duration-300 bg-white border border-gray-300 hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                          <span>
                            {paisMatricula 
                              ? `${paisMatricula} — ${formatoMatricula?.exemplo || ""}` 
                              : "Selecionar país da matrícula"}
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showMatriculaOptions ? "rotate-180" : ""}`} />
                      </button>
                      
                      {/* Dropdown de países de matrícula */}
                      {showMatriculaOptions && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {Object.keys(formatosMatricula).map((pais) => (
                            <button
                              key={pais}
                              type="button"
                              onClick={() => selecionarPaisMatricula(pais)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium text-gray-800">{pais}</div>
                              <div className="text-sm text-gray-600">{formatosMatricula[pais].descricao}</div>
                              <div className="text-xs text-blue-600 mt-1">Ex: {formatosMatricula[pais].exemplo}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Campo de entrada da matrícula (aparece após selecionar país) */}
                      {paisMatricula && (
                        <div className="mt-3">
                          <div className="relative group">
                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-600 h-4 w-4" />
                            <input
                              type="text"
                              required
                              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-emerald-500 bg-white border border-gray-300"
                              placeholder={formatoMatricula?.placeholder || "Digite a matrícula"}
                              value={veiculoAtual.matricula}
                              onChange={(e) => handleMatriculaChange(e.target.value)}
                              onBlur={(e) => {
                                const formatada = formatarMatricula(e.target.value);
                                handleMatriculaChange(formatada);
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="text-xs text-gray-600">
                              {paisMatricula === "Outros" 
                                ? "Formato livre" 
                                : `Formato: ${formatoMatricula?.formato}`}
                            </div>
                            {paisMatricula !== "Outros" && !validarMatricula() && veiculoAtual.matricula && (
                              <div className="text-xs text-red-600">
                                Formato inválido
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Segunda linha - 3 campos */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Ano
                    </label>
                    <div className="relative group">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-blue-500 bg-white border border-gray-300"
                        placeholder="Ex: 2023"
                        value={veiculoAtual.ano}
                        onChange={(e) =>
                          handleVeiculoChange("ano", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Motor
                    </label>
                    <div className="relative group">
                      <Cog className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-blue-500 bg-white border border-gray-300"
                        placeholder="Ex: 1.6L"
                        value={veiculoAtual.motor}
                        onChange={(e) =>
                          handleVeiculoChange("motor", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Chassis
                    </label>
                    <div className="relative group">
                      <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-blue-500 bg-white border border-gray-300"
                        placeholder="Número do chassis"
                        value={veiculoAtual.chassis}
                        onChange={(e) =>
                          handleVeiculoChange("chassis", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Terceira linha - 3 campos */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Lotação
                    </label>
                    <div className="relative group">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-blue-500 bg-white border border-gray-300"
                        placeholder="Nº de passageiros"
                        value={veiculoAtual.lotacao}
                        onChange={(e) =>
                          handleVeiculoChange("lotacao", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-800">
                      Capital Seguro (MT)
                      {exigeCapitalSeguro(tipoCobertura) ? " *" : " (opcional)"}
                    </label>
                    <div className="relative group">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                      <input
                        type="number"
                        required={exigeCapitalSeguro(tipoCobertura)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-[1.02] focus:ring-2 focus:ring-blue-500 bg-white border border-gray-300"
                        placeholder={
                          exigeCapitalSeguro(tipoCobertura)
                            ? "Valor em MT (obrigatório)"
                            : "Não aplicável a este tipo de cobertura"
                        }
                        value={veiculoAtual.capitalSeguro}
                        onChange={(e) =>
                          handleVeiculoChange("capitalSeguro", e.target.value)
                        }
                      />
                    </div>
                    {!exigeCapitalSeguro(tipoCobertura) && tipoCobertura && (
                      <p className="text-xs text-gray-500">
                        Para este tipo de cobertura o prémio é fixo por classificação e não depende do capital seguro.
                      </p>
                    )}
                  </div>

                  {classificacao && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-800">
                        Taxa Aplicada {exigeCapitalSeguro(tipoCobertura) ? "(%)" : ""}
                      </label>
                      <div className="relative group">
                        <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                        {exigeCapitalSeguro(tipoCobertura) ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 font-semibold bg-white border border-gray-300 focus:ring-2 focus:ring-emerald-500"
                            value={
                              veiculoAtual.taxa !== "" && veiculoAtual.taxa != null
                                ? (parseFloat(veiculoAtual.taxa) * 100).toFixed(2)
                                : ""
                            }
                            onChange={(e) => handleTaxaPercentualChange(e.target.value)}
                            placeholder="Ex: 4.00"
                          />
                        ) : (
                          <input
                            type="text"
                            readOnly
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 font-semibold bg-gray-100 border border-gray-300"
                            value={veiculoAtual.taxaAplicada || "Taxa Fixa"}
                          />
                        )}
                      </div>
                      {exigeCapitalSeguro(tipoCobertura) && taxaManualAtiva && (
                        <p className="text-xs text-amber-700">
                          Taxa alterada — a cotação poderá requerer aprovação antes de enviar o PDF.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quarta linha - Informações de cálculo */}
                  <div className="space-y-2 lg:col-span-3">
                    {(() => {
                      const mostrarSemestral = deveMostrarSemestral(tipoCobertura);
                      const mostrarTrim = deveMostrarTrimestral(
                        veiculoAtual.capitalSeguro,
                        tipoCobertura,
                        veiculoAtual.premioAnnual,
                      );
                      const mostrarMes = deveMostrarMensal(
                        veiculoAtual.capitalSeguro,
                        debitoDiretoAtivo,
                        tipoCobertura,
                        veiculoAtual.premioAnnual,
                      );
                      const colunasPremio =
                        2 +
                        (mostrarSemestral ? 1 : 0) +
                        (mostrarTrim ? 1 : 0) +
                        (mostrarMes ? 1 : 0);
                      const gridColsClass =
                        colunasPremio >= 5
                          ? "grid-cols-1 md:grid-cols-5"
                          : colunasPremio === 4
                            ? "grid-cols-1 md:grid-cols-4"
                            : colunasPremio === 3
                              ? "grid-cols-1 md:grid-cols-3"
                              : "grid-cols-1 md:grid-cols-2";

                      return (
                    <div className={`grid ${gridColsClass} gap-4`}>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Prémio Annual (MT)
                        </label>
                        <div className="relative group">
                          <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                          <input
                            type="text"
                            readOnly
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 font-semibold bg-gray-100 border border-gray-300"
                            value={
                              veiculoAtual.premioAnnual
                                ? formatarMoeda(veiculoAtual.premioAnnual)
                                : ""
                            }
                          />
                        </div>
                      </div>

                      {mostrarSemestral && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Prémio Semestral (MT)
                        </label>
                        <div className="relative group">
                          <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                          <input
                            type="text"
                            readOnly
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 font-semibold bg-gray-100 border border-gray-300"
                            value={
                              veiculoAtual.premioSemestral
                                ? formatarMoeda(veiculoAtual.premioSemestral)
                                : ""
                            }
                          />
                        </div>
                      </div>
                      )}

                      {mostrarTrim && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-800">
                            Prémio Trimestral (MT)
                          </label>
                          <div className="relative group">
                            <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                            <input
                              type="text"
                              readOnly
                              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 font-semibold bg-gray-100 border border-gray-300"
                              value={
                                veiculoAtual.premioTrimestral
                                  ? formatarMoeda(veiculoAtual.premioTrimestral)
                                  : ""
                              }
                            />
                          </div>
                        </div>
                      )}

                      {mostrarMes && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-800">
                            Prémio Mensal (MT)
                          </label>
                          <div className="relative group">
                            <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                            <input
                              type="text"
                              readOnly
                              className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 font-semibold bg-gray-100 border border-gray-300"
                              value={
                                veiculoAtual.premioMensal
                                  ? formatarMoeda(veiculoAtual.premioMensal)
                                  : ""
                              }
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-800">
                          Prémio Mínimo (MT)
                        </label>
                        <div className="relative group">
                          <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 h-4 w-4" />
                          <input
                            type="text"
                            readOnly
                            className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-800 font-semibold bg-gray-100 border border-gray-300"
                            value={
                              veiculoAtual.premioMinimo
                                ? formatarMoeda(veiculoAtual.premioMinimo)
                                : ""
                            }
                          />
                        </div>
                      </div>
                    </div>
                      );
                    })()}

                    {/* Mensagens informativas sobre os campos */}
                    <div className="mt-2 space-y-1">
                      {deveMostrarSemestral(tipoCobertura) && (
                        <>
                      {deveMostrarTrimestral(veiculoAtual.capitalSeguro, tipoCobertura, veiculoAtual.premioAnnual) ? (
                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                          ✓ Campo <strong>Prémio Trimestral</strong> visível porque o Capital Seguro é superior a 12.000 MT
                        </div>
                      ) : veiculoAtual.capitalSeguro ? (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          ℹ️ Campo <strong>Prémio Trimestral</strong> oculto porque o Capital Seguro é inferior ou igual a 12.000 MT
                        </div>
                      ) : null}
                      
                      {deveMostrarMensal(veiculoAtual.capitalSeguro, debitoDiretoAtivo, tipoCobertura, veiculoAtual.premioAnnual) ? (
                        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                          ✓ Campo <strong>Prémio Mensal</strong> visível porque Débito Direto está ativo E Capital Seguro é superior a 12.000 MT
                        </div>
                      ) : veiculoAtual.capitalSeguro && debitoDiretoAtivo ? (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          ℹ️ Campo <strong>Prémio Mensal</strong> oculto porque o Capital Seguro é inferior ou igual a 12.000 MT (Débito Direto ativo)
                        </div>
                      ) : null}
                        </>
                      )}
                    </div>

                    {/* Opção de Débito Direto */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 cotacao-debito">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-gray-800 font-medium">Pagamento via Débito Direto</h4>
                          <p className="text-gray-600 text-sm">
                            Ativar para aplicar taxa fixa de 15%
                          </p>
                        </div>
                        <label className="cotacao-switch">
                          <input
                            type="checkbox"
                            checked={debitoDiretoAtivo}
                            onChange={(e) => setDebitoDiretoAtivo(e.target.checked)}
                          />
                          <span className="cotacao-switch-track" />
                        </label>
                      </div>
                      {debitoDiretoAtivo && (
                        <div className="mt-3 p-3 bg-blue-100 rounded">
                          <p className="text-gray-800 text-sm">
                            <strong>Taxa de 15% aplicada via Débito Direto</strong>
                          </p>
                          <p className="text-gray-700 text-xs mt-1">
                            Os cálculos foram atualizados com a nova taxa
                            {deveMostrarSemestral(tipoCobertura) && deveMostrarTrimestral(veiculoAtual.capitalSeguro, tipoCobertura, veiculoAtual.premioAnnual) && " (incluindo Prémio Trimestral)"}
                            {deveMostrarSemestral(tipoCobertura) && deveMostrarMensal(veiculoAtual.capitalSeguro, debitoDiretoAtivo, tipoCobertura, veiculoAtual.premioAnnual) && " e Prémio Mensal"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão para Adicionar Veículo */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={adicionarVeiculo}
                    className="btn-cotacao-lista px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-3 group bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Car className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    <span>Adicionar Veículo à Lista</span>
                  </button>
                </div>
              </div>

              {/* Lista de Veículos Adicionados */}
              {veiculos.length > 0 && (
                <div className="p-6 border-t border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                    <h4 className="text-lg font-bold text-gray-900">
                      Veículos Adicionados
                    </h4>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full">
                      {veiculos.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {veiculos.map((veiculo) => {
                      const premioAnnualNum = parseFloat(veiculo.premioAnnual) || 0;
                      const mostrarSemestral = deveMostrarSemestral(veiculo.tipoCobertura);
                      const mostrarTrimestral = deveMostrarTrimestral(
                        veiculo.capitalSeguro,
                        veiculo.tipoCobertura,
                        premioAnnualNum,
                      );
                      const mostrarMensal = deveMostrarMensal(
                        veiculo.capitalSeguro,
                        debitoDiretoAtivo,
                        veiculo.tipoCobertura,
                        premioAnnualNum,
                      );
                      
                      return (
                        <div
                          key={veiculo.id}
                          className="p-4 rounded-lg flex justify-between items-center transition-all duration-300 hover:scale-[1.02] bg-emerald-50 border border-emerald-200"
                        >
                          <div>
                            <div className="font-semibold text-gray-800">
                              {veiculo.marca} {veiculo.modelo} • {veiculo.tipoCobertura}
                            </div>
                            <div className="text-sm text-gray-700">
                              Classificação: {veiculo.classificacao}
                            </div>
                            <div className="text-sm text-gray-700">
                              Matrícula: {veiculo.matriculaCompleta || veiculo.matricula}
                            </div>
                            <div className="text-sm text-gray-700">
                              {exigeCapitalSeguro(veiculo.tipoCobertura) && (
                                <>
                              Capital: MT{" "}
                              {parseFloat(veiculo.capitalSeguro).toLocaleString(
                                "pt-MZ"
                              )}{" "}
                              • Taxa: {veiculo.taxaAplicada} •
                                </>
                              )}
                              {!exigeCapitalSeguro(veiculo.tipoCobertura) && (
                                <>Taxa: {veiculo.taxaAplicada} • </>
                              )}
                              Prémio Anual: MT{" "}
                              {parseFloat(veiculo.premioAnnual).toLocaleString(
                                "pt-MZ",
                                { minimumFractionDigits: 2 }
                              )}
                              {mostrarSemestral && (
                                <>
                              {" "}• Prémio Semestral: MT{" "}
                              {parseFloat(veiculo.premioSemestral).toLocaleString(
                                "pt-MZ",
                                { minimumFractionDigits: 2 }
                              )}
                                </>
                              )}
                              {!mostrarSemestral && veiculo.premioMinimo && (
                                <>
                              {" "}• Prémio Mínimo: MT{" "}
                              {parseFloat(veiculo.premioMinimo).toLocaleString(
                                "pt-MZ",
                                { minimumFractionDigits: 2 }
                              )}
                                </>
                              )}
                              {mostrarTrimestral && (
                                <span> • Prémio Trimestral: MT{" "}
                                  {parseFloat(veiculo.premioTrimestral || (parseFloat(veiculo.premioAnnual) / 4)).toLocaleString(
                                    "pt-MZ",
                                    { minimumFractionDigits: 2 }
                                  )}</span>
                              )}
                              {mostrarMensal && (
                                <span> • Prémio Mensal: MT{" "}
                                  {parseFloat(veiculo.premioMensal || (parseFloat(veiculo.premioAnnual) / 12)).toLocaleString(
                                    "pt-MZ",
                                    { minimumFractionDigits: 2 }
                                  )}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerVeiculo(veiculo.id)}
                            className="px-3 py-1 rounded text-red-600 hover:text-red-700 transition-colors duration-300 bg-red-50 border border-red-200"
                          >
                            Remover
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total do Prémio */}
                  <div className="mt-6 p-4 rounded-lg text-center bg-blue-50 border border-blue-200">
                    <div className="text-lg font-bold text-gray-800">
                      Total do Prémio Anual:{" "}
                      {formatarMoeda(calcularTotalPremio())}
                    </div>
                    {todosVeiculosTodosRiscos() && (
                    <div className="text-sm text-gray-700 mt-1">
                      Semestral: {formatarMoeda(calcularTotalPremio() / 2)}
                      {deveMostrarCamposEspeciaisNoTotal() && (
                        <>
                          <span> • Trimestral: {formatarMoeda(calcularTotalPremio() / 4)}</span>
                          {debitoDiretoAtivo && (
                            <span> • Mensal: {formatarMoeda(calcularTotalPremio() / 12)}</span>
                          )}
                        </>
                      )}
                    </div>
                    )}
                    <div className="text-sm text-gray-600 mt-1">
                      {veiculos.length} veículo(s) adicionado(s)
                    </div>
                    {debitoDiretoAtivo && (
                      <div className="text-sm text-blue-700 mt-2">
                        * Cálculos com taxa de 15% via Débito Direto
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botões de Ação do Formulário da Viatura */}
              <div className="p-6 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setShowVehicleForm(false)}
                    className="px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 border-2 font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Fechar Formulário
                  </button>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setVeiculos([]);
                        setVeiculoAtual({
                          marca: "",
                          modelo: "",
                          matricula: "",
                          matriculaCompleta: "",
                          ano: "",
                          motor: "",
                          chassis: "",
                          lotacao: "",
                          capitalSeguro: "",
                          taxa: "",
                          premioAnnual: "",
                          premioSemestral: "",
                          premioTrimestral: "",
                          premioMensal: "",
                          premioMinimo: "",
                          taxaAplicada: "",
                        });
                        setTipoCobertura("");
                        setClassificacao("");
                        setPaisMatricula("");
                        setFormatoMatricula(null);
                        setDebitoDiretoAtivo(false);
                      }}
                      className="px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 border-2 font-semibold border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Limpar Tudo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* MODAL DE PARTILHA DA COTAÇÃO */}
        {mostrarOpcoesPartilha && cotacaoGerada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded-xl border w-full max-w-2xl bg-white border-emerald-200">
              <div className="p-6 border-b border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-emerald-500 rounded-full" />
                    <h3 className="text-xl font-bold text-gray-900">
                      Partilhar Cotação
                    </h3>
                  </div>
                  <button
                    onClick={() => setMostrarOpcoesPartilha(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="text-gray-800 font-semibold">
                      Cotação: {cotacaoGerada.id}
                    </div>
                    <div className="text-gray-600 text-sm">
                      Cliente: {cotacaoGerada.cliente.primeiroNome}{" "}
                      {cotacaoGerada.cliente.sobrenome}
                    </div>
                    <div className="text-gray-600 text-sm">
                      Email: {cotacaoGerada.cliente.email}
                    </div>
                    <div className="text-gray-600 text-sm">
                      Total: {formatarMoeda(cotacaoGerada.totalPremio)}
                    </div>
                    <div className="text-gray-600 text-sm">
                      Veículos: {cotacaoGerada.veiculos.length}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={visualizarPDF}
                      className="p-4 rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center gap-2"
                    >
                      <Eye className="h-8 w-8" />
                      <span className="font-semibold">Visualizar</span>
                      <span className="text-xs text-gray-600">Ver PDF</span>
                    </button>

                    <button
                      onClick={gerarPDF}
                      className="p-4 rounded-lg border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center gap-2"
                    >
                      <Download className="h-8 w-8" />
                      <span className="font-semibold">Download</span>
                      <span className="text-xs text-gray-600">Baixar PDF</span>
                    </button>

                    <button
                      onClick={imprimirCotacao}
                      className="p-4 rounded-lg border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center gap-2"
                    >
                      <Printer className="h-8 w-8" />
                      <span className="font-semibold">Imprimir</span>
                      <span className="text-xs text-gray-600">Imprimir</span>
                    </button>

                    <button
                      onClick={enviarEmail}
                      disabled={enviandoEmail}
                      className="p-4 rounded-lg border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {enviandoEmail ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      ) : (
                        <Send className="h-8 w-8" />
                      )}
                      <span className="font-semibold">
                        {enviandoEmail ? "Enviando..." : "Enviar Email"}
                      </span>
                      <span className="text-xs text-gray-600">
                        Para o cliente
                      </span>
                    </button>
                  </div>

                  <div className="text-center text-sm text-gray-500 mt-4">
                    A cotação foi salva com ID: {cotacaoGerada.id}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-emerald-200">
                <button
                  onClick={() => setMostrarOpcoesPartilha(false)}
                  className="w-full py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CriarCliente;