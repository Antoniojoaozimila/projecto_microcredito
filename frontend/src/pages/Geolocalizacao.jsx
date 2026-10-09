import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  FaSync,
  FaFilter,
  FaDownload,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaHistory,
} from "react-icons/fa";
import api from "../services/api";
import ImperialSelect from "../components/ImperialSelect/ImperialSelect";
import "./Geolocalizacao.css";

// Corrige ícones default do Leaflet no Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const iconOnline = L.divIcon({
  className: "geo-marker",
  html: '<span class="geo-dot geo-dot-online"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const iconOffline = L.divIcon({
  className: "geo-marker",
  html: '<span class="geo-dot geo-dot-offline"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const CENTRO_MZ = [-18.665695, 35.529562];
const REFRESH_MS = 30000;

const formatarData = (valor) => {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-PT");
};

const Geolocalizacao = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  const mapPronto = useRef(false);

  const [carregando, setCarregando] = useState(true);
  const [mapaOk, setMapaOk] = useState(false);
  const [erro, setErro] = useState("");
  const [resumo, setResumo] = useState({ total: 0, online: 0, offline: 0 });
  const [dispositivos, setDispositivos] = useState([]);
  const [bombas, setBombas] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const [filtros, setFiltros] = useState({
    bomba_id: "",
    agente_id: "",
    apenas_online: false,
  });

  const invalidarTamanho = useCallback(() => {
    if (!mapInstance.current) return;
    // Leaflet precisa recalcular tamanho após o contentor ficar visível
    setTimeout(() => {
      try {
        mapInstance.current?.invalidateSize(true);
      } catch (_) {
        /* ignore */
      }
    }, 80);
    setTimeout(() => {
      try {
        mapInstance.current?.invalidateSize(true);
      } catch (_) {
        /* ignore */
      }
    }, 300);
  }, []);

  const inicializarMapa = useCallback(() => {
    if (!mapRef.current) return false;
    if (mapInstance.current) {
      invalidarTamanho();
      return true;
    }

    try {
      // Evitar "Map container is already initialized"
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
      }

      const map = L.map(mapRef.current, {
        center: CENTRO_MZ,
        zoom: 6,
        zoomControl: true,
        preferCanvas: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        crossOrigin: true,
      }).addTo(map);

      markersLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
      mapPronto.current = true;
      setMapaOk(true);
      invalidarTamanho();
      return true;
    } catch (e) {
      console.error("Erro ao inicializar mapa:", e);
      setErro("Não foi possível inicializar o mapa. Recarregue a página.");
      return false;
    }
  }, [invalidarTamanho]);

  const carregarFiltros = useCallback(async () => {
    try {
      const [resBombas, resAgentes] = await Promise.all([
        api.get("/api/bombas"),
        api.get("/api/agentes"),
      ]);
      setBombas(Array.isArray(resBombas.data) ? resBombas.data : []);
      setAgentes(Array.isArray(resAgentes.data) ? resAgentes.data : []);
    } catch (e) {
      console.warn("Falha ao carregar filtros geo:", e?.message);
    }
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      setErro("");
      const params = {};
      if (filtros.bomba_id) params.bomba_id = filtros.bomba_id;
      if (filtros.agente_id) params.agente_id = filtros.agente_id;
      if (filtros.apenas_online) params.apenas_online = "true";

      const { data } = await api.get("/api/localizacoes/atual", { params });
      const lista = data?.dispositivos || [];
      setDispositivos(lista);
      setResumo({
        total: data?.total ?? lista.length,
        online: data?.online ?? lista.filter((d) => d.status === "online").length,
        offline: data?.offline ?? lista.filter((d) => d.status === "offline").length,
      });
    } catch (e) {
      console.error(e);
      setErro(
        e.response?.data?.mensagem ||
          "Não foi possível carregar as localizações. Verifique se está autenticado como admin."
      );
      setDispositivos([]);
    } finally {
      setCarregando(false);
      invalidarTamanho();
    }
  }, [filtros, invalidarTamanho]);

  const carregarHistorico = useCallback(async () => {
    try {
      const params = { limit: 200 };
      if (filtros.bomba_id) params.bomba_id = filtros.bomba_id;
      if (filtros.agente_id) params.agente_id = filtros.agente_id;
      const { data } = await api.get("/api/localizacoes/historico", { params });
      setHistorico(Array.isArray(data) ? data : []);
      setMostrarHistorico(true);
    } catch (e) {
      setErro(e.response?.data?.mensagem || "Erro ao carregar histórico");
    }
  }, [filtros]);

  const exportarCsv = async () => {
    try {
      const params = {};
      if (filtros.bomba_id) params.bomba_id = filtros.bomba_id;
      if (filtros.agente_id) params.agente_id = filtros.agente_id;
      const res = await api.get("/api/localizacoes/exportar", {
        params,
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `historico-localizacoes-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setErro(e.response?.data?.mensagem || "Erro ao exportar CSV");
    }
  };

  // Inicializar mapa assim que o contentor existir (não bloquear com PageLoader)
  useEffect(() => {
    let tentativas = 0;
    let cancelled = false;

    const tentar = () => {
      if (cancelled) return;
      if (inicializarMapa()) return;
      tentativas += 1;
      if (tentativas < 20) {
        setTimeout(tentar, 100);
      }
    };

    tentar();

    const onResize = () => invalidarTamanho();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markersLayer.current = null;
        mapPronto.current = false;
      }
    };
  }, [inicializarMapa, invalidarTamanho]);

  // Marcadores
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();
    const bounds = [];

    dispositivos.forEach((d) => {
      const lat = Number(d.latitude);
      const lng = Number(d.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: d.status === "online" ? iconOnline : iconOffline,
      });

      const gmaps = `https://www.google.com/maps?q=${lat},${lng}`;
      const endereco =
        d.endereco_formatado || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      // Tooltip ao passar o cursor: nome do agente + descrição da localização
      marker.bindTooltip(
        `
        <div class="geo-tooltip">
          <strong>${d.agente_nome || "Agente"}</strong>
          <span>${endereco}</span>
        </div>
        `,
        { direction: "top", offset: [0, -10], opacity: 0.95, sticky: false }
      );

      marker.bindPopup(`
        <div class="geo-popup">
          <strong>${d.agente_nome || "Agente"}</strong><br/>
          <span class="geo-status geo-status-${d.status}">${d.status}</span><br/>
          Localização: ${endereco}<br/>
          Bomba: ${d.bomba_nome || "—"}<br/>
          ${d.email ? `Email: ${d.email}<br/>` : ""}
          Atualizado: ${formatarData(d.data_hora_registo)}<br/>
          <a href="${gmaps}" target="_blank" rel="noreferrer">Abrir no Google Maps</a>
        </div>
      `);
      marker.addTo(markersLayer.current);
      bounds.push([lat, lng]);
    });

    invalidarTamanho();

    if (bounds.length > 0) {
      try {
        mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (_) {
        /* ignore */
      }
    } else {
      mapInstance.current.setView(CENTRO_MZ, 6);
    }
  }, [dispositivos, mapaOk, invalidarTamanho]);

  useEffect(() => {
    carregarFiltros();
  }, [carregarFiltros]);

  useEffect(() => {
    setCarregando(true);
    carregarDados();
    const timer = setInterval(carregarDados, REFRESH_MS);
    return () => clearInterval(timer);
  }, [carregarDados]);

  const agentesFiltrados = useMemo(() => {
    if (!filtros.bomba_id) return agentes;
    return agentes.filter((a) => String(a.bomba_id) === String(filtros.bomba_id));
  }, [agentes, filtros.bomba_id]);

  return (
    <div className="geo-page">
      <div className="geo-header">
        <div>
          <h1>
            <FaMapMarkerAlt /> Geolocalização
          </h1>
          <p>Dispositivos dos agentes em tempo quase real (atualiza a cada 30s)</p>
        </div>
        <div className="geo-header-actions">
          <button type="button" className="geo-btn" onClick={() => carregarDados()}>
            <FaSync /> Atualizar
          </button>
          <button type="button" className="geo-btn geo-btn-secondary" onClick={carregarHistorico}>
            <FaHistory /> Histórico
          </button>
          <button type="button" className="geo-btn geo-btn-secondary" onClick={exportarCsv}>
            <FaDownload /> Exportar CSV
          </button>
        </div>
      </div>

      {erro && <div className="geo-alert">{erro}</div>}

      <div className="geo-stats">
        <div className="geo-stat">
          <span className="geo-stat-label">Total</span>
          <strong>{resumo.total}</strong>
        </div>
        <div className="geo-stat geo-stat-online">
          <span className="geo-stat-label">Online</span>
          <strong>{resumo.online}</strong>
        </div>
        <div className="geo-stat geo-stat-offline">
          <span className="geo-stat-label">Offline</span>
          <strong>{resumo.offline}</strong>
        </div>
      </div>

      <div className="geo-filters">
        <div className="geo-filter-title">
          <FaFilter /> Filtros
        </div>
        <ImperialSelect
          aria-label="Filtrar por bomba"
          value={filtros.bomba_id}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, bomba_id: e.target.value, agente_id: "" }))
          }
          options={[
            { value: "", label: "Todas as bombas" },
            ...bombas.map((b) => ({ value: String(b.id), label: b.nome_bomba })),
          ]}
        />
        <ImperialSelect
          aria-label="Filtrar por agente"
          value={filtros.agente_id}
          onChange={(e) => setFiltros((f) => ({ ...f, agente_id: e.target.value }))}
          options={[
            { value: "", label: "Todos os agentes" },
            ...agentesFiltrados.map((a) => ({ value: String(a.id), label: a.nome })),
          ]}
        />
        <label className="geo-check">
          <input
            type="checkbox"
            checked={filtros.apenas_online}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, apenas_online: e.target.checked }))
            }
          />
          Apenas online
        </label>
      </div>

      <div className="geo-layout">
        <div className="geo-map-wrap">
          {carregando && (
            <div className="geo-map-loading">A carregar localizações…</div>
          )}
          {!mapaOk && !erro && (
            <div className="geo-map-loading">A preparar mapa…</div>
          )}
          <div ref={mapRef} className="geo-map" id="geo-map-leaflet" />
        </div>

        <div className="geo-list">
          <h3>Dispositivos ({dispositivos.length})</h3>
          {dispositivos.length === 0 ? (
            <p className="geo-empty">
              {carregando
                ? "A carregar…"
                : "Nenhuma localização registada ainda. O mapa de Moçambique deve aparecer à esquerda."}
            </p>
          ) : (
            <ul>
              {dispositivos.map((d) => (
                <li key={`${d.user_id}-${d.id}`}>
                  <div className="geo-list-top">
                    <strong>{d.agente_nome}</strong>
                    <span className={`geo-badge geo-badge-${d.status}`}>{d.status}</span>
                  </div>
                  <div className="geo-list-meta">
                    {d.bomba_nome || "Sem bomba"} · {formatarData(d.data_hora_registo)}
                  </div>
                  <a
                    className="geo-gmaps"
                    href={`https://www.google.com/maps?q=${d.latitude},${d.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaExternalLinkAlt /> Google Maps
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {mostrarHistorico && (
        <div className="geo-historico">
          <div className="geo-historico-header">
            <h3>Histórico recente</h3>
            <button
              type="button"
              className="geo-btn geo-btn-secondary"
              onClick={() => setMostrarHistorico(false)}
            >
              Fechar
            </button>
          </div>
          <div className="geo-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agente</th>
                  <th>Bomba</th>
                  <th>Status</th>
                  <th>Coords</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h) => (
                  <tr key={h.id}>
                    <td>{h.agente_nome || "—"}</td>
                    <td>{h.bomba_nome || "—"}</td>
                    <td>
                      <span className={`geo-badge geo-badge-${h.status}`}>{h.status}</span>
                    </td>
                    <td>
                      {Number(h.latitude).toFixed(5)}, {Number(h.longitude).toFixed(5)}
                    </td>
                    <td>{formatarData(h.data_hora_registo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Geolocalizacao;
