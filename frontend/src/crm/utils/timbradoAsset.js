import papelTimbradoSrc from '../assets/papel-timbrado.png';
import logoSrc from '../assets/logo.png';
import { origemLogo } from '../../services/logoDocumento';

function resolveImportUrl(src) {
  if (!src) return '';
  const path = typeof src === 'string' ? src : src?.default || '';
  if (!path) return '';
  if (String(path).startsWith('http') || String(path).startsWith('data:')) return path;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${path}`;
}

/** Carrega imagem como data URL (base64) para o PDF ser autocontido */
export async function loadImageAsDataUrl(src) {
  const url = resolveImportUrl(src);
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export async function getTimbradoDataUrl() {
  return loadImageAsDataUrl(papelTimbradoSrc);
}

export async function getLogoDataUrl() {
  return loadImageAsDataUrl(origemLogo() || logoSrc);
}

/** Espera todas as imagens do documento carregarem */
export function waitForDocumentImages(doc) {
  const images = Array.from(doc.querySelectorAll('img'));
  if (!images.length) return Promise.resolve();
  return Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 3000);
        })
    )
  );
}

/** Abre HTML numa janela e activa impressão (Guardar como PDF) */
export function abrirRelatorioParaImpressao(html, titulo = 'Relatório') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  win.onload = () => {
    win.document.title = titulo;
    setTimeout(() => {
      win.focus();
      win.print();
    }, 800);
  };
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}
