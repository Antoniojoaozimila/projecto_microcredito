import * as ImagePicker from "expo-image-picker";

export async function escolherFoto() {
  const pedido = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!pedido.granted) return null;

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (resultado.canceled || !resultado.assets?.length) return null;
  return resultado.assets[0].uri;
}
