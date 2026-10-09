import React, { useState, useEffect } from 'react';
import {
  User, Building, Phone, Mail, MapPin, FileText, Download,
  Eye, X, File, FileCheck, Calendar, Hash, Globe, Loader2
} from 'lucide-react';
import { cotacaoService, arquivoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

function VisualizacaoClienteDocumentos({ cotacaoId, clienteId, onClose }) {
  const { usuario } = useAuth();
  const userRole = usuario?.role || 'agente';
  const [cliente, setCliente] = useState(null);
  const [cotacao, setCotacao] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baixandoDoc, setBaixandoDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [carregandoPreview, setCarregandoPreview] = useState(false);

  const temPermissao = userRole === 'admin' || userRole === 'subscritor';

  useEffect(() => {
    if (temPermissao && (cotacaoId || clienteId)) {
      carregarDados();
    }
  }, [cotacaoId, clienteId, temPermissao]);

  useEffect(() => {
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const montarDocumentos = (cotacaoData) => {
    const docs = [];
    let docId = 1;

    if (cotacaoData.documentos?.bi) {
      docs.push({
        id: docId++,
        tipo: 'BI',
        nome: 'Bilhete de Identidade',
        path: cotacaoData.documentos.bi,
        arquivo: cotacaoData.documentos.bi.split('/').pop()
      });
    }

    if (cotacaoData.documentos?.livrete) {
      docs.push({
        id: docId++,
        tipo: 'Livrete',
        nome: 'Livrete do Veículo',
        path: cotacaoData.documentos.livrete,
        arquivo: cotacaoData.documentos.livrete.split('/').pop()
      });
    }

    if (cotacaoData.documentos?.encerramento) {
      docs.push({
        id: docId++,
        tipo: 'Encerramento',
        nome: 'Comprovativo de Encerramento',
        path: cotacaoData.documentos.encerramento,
        arquivo: cotacaoData.documentos.encerramento.split('/').pop()
      });
    }

    (cotacaoData.documentos?.acompanhamento || []).forEach((doc) => {
      docs.push({
        id: docId++,
        tipo: 'Acompanhamento',
        nome: `Comprovativo - Semana ${doc.semana}`,
        path: doc.path,
        arquivo: doc.nome || doc.path.split('/').pop(),
        dataUpload: doc.data
      });
    });

    return docs;
  };

  const carregarDados = async () => {
    try {
      setLoading(true);

      if (cotacaoId) {
        const result = await cotacaoService.buscarPorId(cotacaoId);
        if (result.success && result.data) {
          const cotacaoData = result.data;
          setCotacao(cotacaoData);
          setCliente(cotacaoData.cliente || {});
          setDocumentos(montarDocumentos(cotacaoData));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      alert('❌ Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const baixarDocumento = async (documento) => {
    try {
      setBaixandoDoc(documento.id);
      const result = await arquivoService.baixar(documento.path, documento.arquivo);
      if (!result.success) {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      alert('❌ Erro ao baixar documento');
    } finally {
      setBaixandoDoc(null);
    }
  };

  const visualizarDocumento = async (documento) => {
    setPreviewDoc(documento);
    setCarregandoPreview(true);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    const result = await arquivoService.obterUrlPreview(documento.path);
    setCarregandoPreview(false);
    if (result.success) {
      setPreviewUrl(result.url);
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  const fecharPreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  const isImagem = (nome) => /\.(jpg|jpeg|png|gif|webp)$/i.test(nome || '');
  const isPdf = (nome) => /\.pdf$/i.test(nome || '');

  if (!temPermissao) {
    return null;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl border border-emerald-200 flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
          <div className="text-gray-900">Carregando dados do cliente...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold mb-1">Dados do Cliente e Documentos</h2>
            <p className="text-emerald-100 text-sm">
              {cotacao?.numero_cotacao ? `Cotação: ${cotacao.numero_cotacao}` : ''}
              {cliente?.tipo === 'Empresarial' ? ' · Cliente Empresarial' : ' · Cliente Particular'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-800 rounded-lg transition-colors duration-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-emerald-600" />
              Informações do Cliente
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cliente?.tipo === 'Empresarial' ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                      <Building className="h-4 w-4 mr-1" />
                      Nome da Empresa
                    </label>
                    <p className="text-gray-900 font-medium">{cliente.nome_empresa || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                      <Hash className="h-4 w-4 mr-1" />
                      Número de Referência Fiscal
                    </label>
                    <p className="text-gray-900 font-medium">{cliente.numero_referencia_fiscal || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                      <User className="h-4 w-4 mr-1" />
                      Contacto
                    </label>
                    <p className="text-gray-900 font-medium">
                      {cliente.titulo_contato || ''} {cliente.primeiro_nome || ''} {cliente.sobrenome || ''}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                      <User className="h-4 w-4 mr-1" />
                      Nome Completo
                    </label>
                    <p className="text-gray-900 font-medium">
                      {cliente?.titulo_contato || ''} {cliente?.primeiro_nome || ''} {cliente?.sobrenome || ''}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                      <Hash className="h-4 w-4 mr-1" />
                      Número de Documento
                    </label>
                    <p className="text-gray-900 font-medium">{cliente?.numero_documento || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      Data de Nascimento
                    </label>
                    <p className="text-gray-900 font-medium">
                      {cliente?.data_nascimento
                        ? new Date(cliente.data_nascimento).toLocaleDateString('pt-MZ')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                      <Globe className="h-4 w-4 mr-1" />
                      Nacionalidade
                    </label>
                    <p className="text-gray-900 font-medium">{cliente?.nacionalidade || 'MZ'}</p>
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </label>
                <p className="text-gray-900 font-medium">{cliente?.email || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                  <Phone className="h-4 w-4 mr-1" />
                  Telefone
                </label>
                <p className="text-gray-900 font-medium">{cliente?.telefone || 'N/A'}</p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-600 flex items-center mb-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  Morada
                </label>
                <p className="text-gray-900 font-medium">{cliente?.morada || 'N/A'}</p>
              </div>
            </div>
          </div>

          {cotacao?.veiculos?.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                Veículos ({cotacao.veiculos.length})
              </h3>
              <div className="space-y-2">
                {cotacao.veiculos.map((v, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-gray-200 text-sm text-gray-700">
                    {v.marca} {v.modelo}
                    {v.matricula ? ` · ${v.matricula}` : ''}
                    {v.premio_anual ? ` · ${parseFloat(v.premio_anual).toLocaleString('pt-MZ')} MZN/ano` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-emerald-600" />
              Documentos Anexados
            </h3>

            {documentos.length > 0 ? (
              <div className="space-y-3">
                {documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-emerald-300 transition-all duration-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <FileCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{doc.nome}</p>
                        <p className="text-sm text-gray-600">{doc.arquivo}</p>
                        {doc.dataUpload && (
                          <p className="text-xs text-gray-500 mt-1">
                            Data: {new Date(doc.dataUpload).toLocaleDateString('pt-MZ')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => visualizarDocumento(doc)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Visualizar"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => baixarDocumento(doc)}
                        disabled={baixandoDoc === doc.id}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                        title="Baixar"
                      >
                        {baixandoDoc === doc.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Nenhum documento disponível</p>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{previewDoc.nome}</h3>
              <button onClick={fecharPreview} className="p-2 hover:bg-emerald-700 rounded-lg transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 min-h-[400px] flex items-center justify-center overflow-auto p-4">
              {carregandoPreview ? (
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              ) : previewUrl ? (
                isImagem(previewDoc.arquivo) ? (
                  <img src={previewUrl} alt={previewDoc.nome} className="max-w-full max-h-[70vh] object-contain" />
                ) : isPdf(previewDoc.arquivo) ? (
                  <iframe src={previewUrl} title={previewDoc.nome} className="w-full h-[70vh] border-0" />
                ) : (
                  <div className="text-center text-gray-500">
                    <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>Pré-visualização não disponível para este tipo de ficheiro.</p>
                    <p className="text-sm mt-2">Utilize o botão Baixar.</p>
                  </div>
                )
              ) : (
                <p className="text-gray-500">Não foi possível carregar a pré-visualização.</p>
              )}
            </div>
            <div className="bg-gray-50 p-4 flex justify-end space-x-2">
              <button
                onClick={() => baixarDocumento(previewDoc)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Baixar
              </button>
              <button
                onClick={fecharPreview}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualizacaoClienteDocumentos;
