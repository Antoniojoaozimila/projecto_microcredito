import AsyncStorage from "@react-native-async-storage/async-storage";

export const lerItem = (chave) => AsyncStorage.getItem(chave);

export const gravarItem = (chave, valor) => AsyncStorage.setItem(chave, valor);

export const apagarItem = (chave) => AsyncStorage.removeItem(chave);

export const gravarVarios = (pares) => AsyncStorage.multiSet(pares);
