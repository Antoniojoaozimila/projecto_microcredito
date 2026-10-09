export const lerItem = async (chave) => {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
};

export const gravarItem = async (chave, valor) => {
  localStorage.setItem(chave, valor);
};

export const apagarItem = async (chave) => {
  localStorage.removeItem(chave);
};

export const gravarVarios = async (pares) => {
  pares.forEach(([chave, valor]) => localStorage.setItem(chave, valor));
};
