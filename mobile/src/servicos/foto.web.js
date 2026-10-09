export function escolherFoto() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const ficheiro = input.files && input.files[0];
      resolve(ficheiro ? URL.createObjectURL(ficheiro) : null);
    };
    input.click();
  });
}
