import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  History,
  Percent,
  FileText,
} from "lucide-react";
import CotacoesLayout from "../components/CotacoesLayout";
import { cotacaoService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getStatusAprovacaoLabel,
  STATUS_APROVACAO_CORES,
  formatarTaxaPercentual,
} from "../utils/statusAprovacao";
import { getTaxaPadrao } from "../utils/cotacaoCoberturas";

const FILTROS = [
  { id: "aguardando", label: "Aguardando Aprovação" },
  { id: "aprovada", label: "Aprovadas" },
  { id: "rejeitada", label: "Rejeitadas" },
];

function AprovacaoTaxas() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("aguardando");
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(null);
  const [cotacaoDetalhe, setCotacaoDetalhe] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [modalRejeicao, setModalRejeicao] = useState(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [comentarioAprovacao, setComentarioAprovacao] = useState("");

  const isAprovador = usuario?.role === "admin" || usuario?.role === "subscritor";

  const carregar = useCallback(async () => {
    if (!isAprovador) return;
    try {
      setLoading(true);
      const result = await cotacaoService.listarPendentesAprovacao({
        status_aprovacao: filtro,
        limit: 100,
      });
      if (result.success) {
        setCotacoes(result.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar aprovações:", error);
    } finally {
      setLoading(false);
    }
  }, [filtro, isAprovador]);

  useEffect(() => {
    if (!isAprovador) {
      navigate("/microcredito/dashboard/home");
      return;
    }
    carregar();
  }, [carregar, isAprovador, navigate]);

  const abrirDetalhe = async (cotacao) => {
    setCotacaoDetalhe(cotacao);
    setComentarioAprovacao("");
    const hist = await cotacaoService.historicoAprovacao(cotacao.id);
    if (hist.success) setHistorico(hist.data || []);
  };

  const aprovar = async (cotacao) => {
    if (!window.confirm(`Aprovar a taxa da cotação ${cotacao.numero_cotacao}?`)) return;
    setProcessando(cotacao.id);
    const result = await cotacaoService.aprovarTaxa(cotacao.id, comentarioAprovacao);
    setProcessando(null);
    if (result.success) {
      alert("✅ Taxa aprovada. O agente foi notificado.");
      setCotacaoDetalhe(null);
      carregar();
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  const confirmarRejeicao = async () => {
    if (!modalRejeicao) return;
    if (!motivoRejeicao.trim()) {
      alert("Informe o motivo da rejeição.");
      return;
    }
    setProcessando(modalRejeicao.id);
    const result = await cotacaoService.rejeitarTaxa(modalRejeicao.id, motivoRejeicao.trim());
    setProcessando(null);
    if (result.success) {
      alert("Cotação rejeitada. O agente foi notificado.");
      setModalRejeicao(null);
      setMotivoRejeicao("");
      setCotacaoDetalhe(null);
      carregar();
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  if (!isAprovador) return null;

  return (
    <CotacoesLayout title="Aprovação de Taxas">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Percent className="h-7 w-7 text-emerald-600" />
            Aprovação de Taxas
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Cotações com taxa alterada em relação ao produto padrão. O status operacional da cotação não é alterado aqui.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtro === f.id
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          </div>
        ) : cotacoes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Nenhuma cotação em «{getStatusAprovacaoLabel(filtro)}».</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Cotação</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Agente</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Prémio</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Status operacional</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Aprovação</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cotacoes.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{c.numero_cotacao}</td>
                    <td className="px-4 py-3 text-sm">
                      {c.primeiro_nome} {c.sobrenome}
                    </td>
                    <td className="px-4 py-3 text-sm">{c.agente_nome || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      MT {parseFloat(c.total_premio || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{c.status}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_APROVACAO_CORES[c.status_aprovacao] || ""}`}>
                        {getStatusAprovacaoLabel(c.status_aprovacao)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => abrirDetalhe(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                        Analisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cotacaoDetalhe && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {cotacaoDetalhe.numero_cotacao} — Análise de taxas
              </h3>

              <div className="space-y-3 mb-4">
                {(cotacaoDetalhe.veiculos || []).map((v, idx) => {
                  const taxaPadrao = getTaxaPadrao(v.tipo_cobertura, v.classificacao);
                  const taxaAplicada = parseFloat(v.taxa) || 0;
                  const alterada = Math.abs(taxaAplicada - taxaPadrao) > 0.00001;
                  return (
                    <div key={v.id || idx} className="p-3 bg-gray-50 rounded-lg border text-sm">
                      <div className="font-medium">{v.marca_modelo || `${v.marca} ${v.modelo}`}</div>
                      <div className="text-gray-600">{v.tipo_cobertura}</div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>Taxa padrão: <strong>{formatarTaxaPercentual(taxaPadrao)}</strong></div>
                        <div className={alterada ? "text-amber-700" : ""}>
                          Taxa aplicada: <strong>{formatarTaxaPercentual(taxaAplicada)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtro === "aguardando" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentário (opcional, na aprovação)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    rows={2}
                    value={comentarioAprovacao}
                    onChange={(e) => setComentarioAprovacao(e.target.value)}
                    placeholder="Comentário para o agente..."
                  />
                </div>
              )}

              {historico.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold flex items-center gap-1 mb-2">
                    <History className="h-4 w-4" /> Histórico
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {historico.map((h) => (
                      <div key={h.id} className="text-xs p-2 bg-gray-50 rounded border">
                        <div className="font-medium capitalize">{h.tipo_acao?.replace("_", " ")}</div>
                        {h.taxa_padrao != null && (
                          <div>
                            Taxa: {formatarTaxaPercentual(h.taxa_padrao)} → {formatarTaxaPercentual(h.taxa_aplicada)}
                          </div>
                        )}
                        {h.usuario_alteracao_nome && <div>Alterado por: {h.usuario_alteracao_nome}</div>}
                        {h.usuario_aprovacao_nome && <div>Por: {h.usuario_aprovacao_nome}</div>}
                        {h.comentario && <div className="text-gray-600 italic">{h.comentario}</div>}
                        <div className="text-gray-400">
                          {new Date(h.data_aprovacao || h.data_alteracao || h.created_at).toLocaleString("pt-MZ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => setCotacaoDetalhe(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Fechar
                </button>
                {cotacaoDetalhe.status_aprovacao === "aguardando" && (
                  <>
                    <button
                      onClick={() => {
                        setModalRejeicao(cotacaoDetalhe);
                        setMotivoRejeicao("");
                      }}
                      disabled={processando === cotacaoDetalhe.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" /> Rejeitar
                    </button>
                    <button
                      onClick={() => aprovar(cotacaoDetalhe)}
                      disabled={processando === cotacaoDetalhe.id}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1 disabled:opacity-50"
                    >
                      {processando === cotacaoDetalhe.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Aprovar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {modalRejeicao && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="font-bold text-gray-900 mb-2">Motivo da rejeição</h3>
              <p className="text-sm text-gray-600 mb-3">
                Cotação {modalRejeicao.numero_cotacao} — o motivo será registado no histórico e enviado ao agente.
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
                rows={4}
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setModalRejeicao(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRejeicao}
                  disabled={processando === modalRejeicao.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmar rejeição
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CotacoesLayout>
  );
}

export default AprovacaoTaxas;
