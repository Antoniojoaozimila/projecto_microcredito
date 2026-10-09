import * as Location from "expo-location";

export async function obterCoordenadas() {
  const pedido = await Location.requestForegroundPermissionsAsync();
  if (pedido.status !== "granted") throw new Error("Permita a localização para usar o GPS.");
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return pos.coords;
}

export async function obterLocal() {
  const pedido = await Location.requestForegroundPermissionsAsync();
  if (pedido.status !== "granted") return "Permissão de localização recusada";

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const lugares = await Location.reverseGeocodeAsync({
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  });
  const sitio = lugares[0];
  if (!sitio) return "Localização obtida";

  const partes = [sitio.district || sitio.subregion || sitio.name, sitio.city || sitio.region].filter(Boolean);
  return [...new Set(partes)].join(", ") || "Localização obtida";
}
