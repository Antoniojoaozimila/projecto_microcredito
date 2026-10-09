import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

if (!L.Icon.Default.prototype._microFix) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });
  L.Icon.Default.prototype._microFix = true;
}

const CENTRO = [-25.9692, 32.5732];

const pin = (cor, ordem) => L.divIcon({
  className: "mod-mapa-pin",
  html: `<span class="mod-mapa-dot" style="--pin:${cor || "#4AAC05"}">${ordem || ""}</span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const MapaLeaflet = ({ pontos = [], altura = 280, aoClicar, aoVivo = false, selecionado, className = "" }) => {
  const caixa = useRef(null);
  const mapa = useRef(null);
  const camada = useRef(null);
  const vivo = useRef(null);
  const clique = useRef(aoClicar);
  clique.current = aoClicar;
  const chave = pontos.map((p) => `${p.lat},${p.lon},${p.raio || 0},${p.titulo || ""},${p.ordem || ""}`).join("|");

  useEffect(() => {
    if (!caixa.current || mapa.current) return undefined;
    if (caixa.current._leaflet_id) caixa.current._leaflet_id = null;
    const map = L.map(caixa.current, { center: CENTRO, zoom: 12, scrollWheelZoom: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    camada.current = L.layerGroup().addTo(map);
    map.on("click", (e) => clique.current?.({ lat: e.latlng.lat, lon: e.latlng.lng }));
    mapa.current = map;
    const ajustar = () => { try { map.invalidateSize(true); } catch { /* ignore */ } };
    const t1 = setTimeout(ajustar, 80);
    const t2 = setTimeout(ajustar, 320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapa.current;
    const layer = camada.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const bounds = [];
    pontos.forEach((p) => {
      const lat = Number(p.lat);
      const lon = Number(p.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      bounds.push([lat, lon]);
      const marca = L.marker([lat, lon], { icon: pin(p.cor, p.ordem) }).addTo(layer);
      if (p.titulo) marca.bindPopup(`<strong>${p.titulo}</strong>${p.texto ? `<br>${p.texto}` : ""}`);
      if (Number(p.raio) > 0) {
        L.circle([lat, lon], { radius: Number(p.raio) * 1000, color: p.cor || "#4AAC05", weight: 2, fillColor: p.cor || "#4AAC05", fillOpacity: 0.12 }).addTo(layer);
      }
    });
    if (bounds.length === 1) map.setView(bounds[0], 13);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    setTimeout(() => { try { map.invalidateSize(true); } catch { /* ignore */ } }, 80);
  }, [chave]);

  useEffect(() => {
    const map = mapa.current;
    if (!map || !selecionado) return;
    const lat = Number(selecionado.lat);
    const lon = Number(selecionado.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) map.flyTo([lat, lon], 14, { duration: 0.6 });
  }, [selecionado]);

  useEffect(() => {
    if (!aoVivo || !navigator.geolocation) return undefined;
    const id = navigator.geolocation.watchPosition((pos) => {
      const map = mapa.current;
      if (!map) return;
      const latlng = [pos.coords.latitude, pos.coords.longitude];
      if (vivo.current) vivo.current.setLatLng(latlng);
      else {
        vivo.current = L.circleMarker(latlng, { radius: 9, color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }).addTo(map).bindPopup("A sua posição em tempo real");
      }
    }, () => {}, { enableHighAccuracy: true, maximumAge: 4000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [aoVivo]);

  return <div ref={caixa} className={`mod-leaflet ${className}`} style={{ height: altura }} />;
};

export default MapaLeaflet;
