export function obterCoordenadas() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("O GPS não está disponível neste ecrã."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      () => reject(new Error("Permita a localização para usar o GPS.")),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}

export function obterLocal() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve("Localização indisponível");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const resposta = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const dados = await resposta.json();
          const endereco = dados.address || {};
          const texto = [
            endereco.suburb || endereco.neighbourhood || endereco.quarter,
            endereco.city || endereco.town || endereco.municipality,
          ]
            .filter(Boolean)
            .join(", ");
          resolve(texto || "Localização obtida");
        } catch {
          resolve("Localização obtida");
        }
      },
      () => resolve("Permissão de localização recusada"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
