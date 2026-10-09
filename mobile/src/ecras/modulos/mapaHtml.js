export const htmlMapa = (pontos, aoVivo = false) => `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
html,body,#mapa{height:100%;width:100%;margin:0;background:#e7f2f8;}
.leaflet-container{background:#e7f2f8;font-family:system-ui,sans-serif;}
.leaflet-control-attribution{font-size:10px;}
.vivo{width:18px;height:18px;border-radius:50%;background:#0284c7;border:3px solid #fff;box-shadow:0 0 0 10px rgba(2,132,199,.25);}
</style>
</head><body><div id="mapa"></div>
<script>
const pontos = ${JSON.stringify(pontos || [])};
const mapa = L.map('mapa', { zoomControl: true, zoomSnap: 0.25 }).setView([-18.1, 35.5], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, detectRetina: true, attribution: '&copy; OpenStreetMap' }).addTo(mapa);
const camada = L.featureGroup().addTo(mapa);
pontos.forEach((ponto) => {
  const cor = ponto.cor || '#0369a1';
  if (ponto.raio) L.circle([ponto.lat, ponto.lon], { radius: Number(ponto.raio) * 1000, color: cor, weight: 1, fillColor: cor, fillOpacity: 0.12 }).addTo(camada);
  L.circleMarker([ponto.lat, ponto.lon], { radius: 11, color: '#ffffff', weight: 3, fillColor: cor, fillOpacity: 1 })
    .bindPopup('<strong>' + (ponto.titulo || '') + '</strong><br>' + (ponto.texto || ''))
    .addTo(camada);
});
if (pontos.length) mapa.fitBounds(camada.getBounds().pad(0.35), { maxZoom: 12 });
${aoVivo ? `if (navigator.geolocation) {
  let marca;
  navigator.geolocation.watchPosition((pos) => {
    const ll = [pos.coords.latitude, pos.coords.longitude];
    if (!marca) {
      marca = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="vivo"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) }).bindPopup('A sua posição').addTo(mapa);
      mapa.setView(ll, Math.max(mapa.getZoom(), 13));
    } else marca.setLatLng(ll);
  }, function () {}, { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 });
}` : ""}
setTimeout(() => mapa.invalidateSize(), 180);
setTimeout(() => mapa.invalidateSize(), 700);
</script></body></html>`;
