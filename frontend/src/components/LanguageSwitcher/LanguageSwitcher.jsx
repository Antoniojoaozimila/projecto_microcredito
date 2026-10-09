import { useEffect, useRef, useState } from "react";
import { FiGlobe, FiCheck } from "react-icons/fi";
import { useTranslate } from "../../context/TranslateProvider";
import "flag-icons/css/flag-icons.min.css";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const { currentLang, changeLanguage, languages } = useTranslate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  const active = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <div className="lang-switcher notranslate" ref={ref}>
      <button
        type="button"
        className={`lang-switcher-btn ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Alterar idioma"
        aria-expanded={open}
      >
        <span className={`fi fi-${active.flag} lang-flag`} />
        <span className="lang-switcher-label">{active.label}</span>
        <FiGlobe className="lang-switcher-globe" />
      </button>

      {open && (
        <div className="lang-switcher-panel">
          <div className="lang-switcher-panel-head">
            <FiGlobe />
            <span>Escolher idioma</span>
          </div>
          <ul className="lang-switcher-list">
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  type="button"
                  className={`lang-switcher-item ${
                    currentLang === lang.code ? "active" : ""
                  }`}
                  onClick={() => {
                    setOpen(false);
                    if (lang.code !== currentLang) changeLanguage(lang.code);
                  }}
                >
                  <span className={`fi fi-${lang.flag} lang-flag`} />
                  <span className="lang-switcher-item-text">
                    <strong>{lang.label}</strong>
                    <small>{lang.country}</small>
                  </span>
                  {currentLang === lang.code && (
                    <FiCheck className="lang-switcher-check" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
