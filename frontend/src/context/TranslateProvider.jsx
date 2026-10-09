import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGES, PAGE_LANG, STORAGE_KEY } from "../config/languages";
import "./Translate.css";

const TranslateContext = createContext(null);

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function cookieHosts() {
  const hostname = window.location.hostname;
  const hosts = [""];
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    hosts.push(hostname, `.${hostname}`);
  }
  return hosts;
}

function writeCookie(name, value, extra = "") {
  cookieHosts().forEach((host) => {
    const domain = host ? `;domain=${host}` : "";
    document.cookie = `${name}=${value};path=/${domain}${extra}`;
  });
}

function setGoogTransCookie(value) {
  const expires = ";expires=Thu, 31 Dec 2099 23:59:59 GMT";
  writeCookie("googtrans", value, expires);
}

function clearGoogTransCookies() {
  const expire = ";expires=Thu, 01 Jan 1970 00:00:00 GMT";
  writeCookie("googtrans", "", expire);
  writeCookie("googtrans", "/pt/pt", expire);
}

function detectCurrentLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
    /* ignore */
  }

  const cookie = getCookie("googtrans");
  if (cookie) {
    const lang = cookie.split("/")[2];
    if (lang && LANGUAGES.some((l) => l.code === lang)) return lang;
  }
  return PAGE_LANG;
}

function injectGoogleTranslate() {
  if (document.getElementById("google-translate-script")) return;

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate?.TranslateElement) return;
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      {
        pageLanguage: PAGE_LANG,
        includedLanguages: LANGUAGES.map((l) => l.code).join(","),
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

export function TranslateProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(PAGE_LANG);

  useEffect(() => {
    const lang = detectCurrentLang();
    setCurrentLang(lang);
    document.documentElement.lang = lang === PAGE_LANG ? PAGE_LANG : lang;
    injectGoogleTranslate();
  }, []);

  const changeLanguage = useCallback((lang) => {
    if (!LANGUAGES.some((item) => item.code === lang)) return;

    clearGoogTransCookies();
    if (lang !== PAGE_LANG) {
      setGoogTransCookie(`/${PAGE_LANG}/${lang}`);
    }
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({
      currentLang,
      changeLanguage,
      languages: LANGUAGES,
      pageLang: PAGE_LANG,
    }),
    [currentLang, changeLanguage]
  );

  return (
    <TranslateContext.Provider value={value}>
      <div id="google_translate_element" className="notranslate" aria-hidden="true" />
      {children}
    </TranslateContext.Provider>
  );
}

export function useTranslate() {
  const ctx = useContext(TranslateContext);
  if (!ctx) {
    throw new Error("useTranslate deve ser usado dentro de TranslateProvider");
  }
  return ctx;
}
