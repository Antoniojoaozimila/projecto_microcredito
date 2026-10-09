import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa";
import "./ImperialSelect.css";

/**
 * Select personalizado Imperial — sem hover azul nativo do browser.
 * API compatível com <select>: onChange({ target: { value } })
 */
export default function ImperialSelect({
  value = "",
  onChange,
  options = [],
  placeholder = "Seleccionar…",
  className = "",
  disabled = false,
  required = false,
  "aria-label": ariaLabel,
  name,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  const normalized = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === "object" && opt !== null
          ? { value: String(opt.value ?? ""), label: opt.label ?? String(opt.value ?? "") }
          : { value: String(opt), label: String(opt) }
      ),
    [options]
  );

  const selected = normalized.find((o) => o.value === String(value ?? ""));
  const displayLabel = selected?.label || placeholder;

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const emitChange = (nextValue) => {
    if (typeof onChange === "function") {
      onChange({ target: { value: nextValue, name } });
    }
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`imperial-select ${open ? "is-open" : ""} ${
        disabled ? "is-disabled" : ""
      } ${className}`.trim()}
    >
      <button
        type="button"
        className="imperial-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span
          className={`imperial-select-value ${
            selected ? "" : "is-placeholder"
          }`}
        >
          {displayLabel}
        </span>
        <FaChevronDown className="imperial-select-chevron" />
      </button>

      {open && (
        <ul
          id={listId}
          className="imperial-select-menu"
          role="listbox"
          aria-label={ariaLabel || placeholder}
        >
          {normalized.map((opt) => {
            const isActive = String(value ?? "") === opt.value;
            return (
              <li key={`${opt.value}::${opt.label}`} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={`imperial-select-option ${isActive ? "is-active" : ""}`}
                  onClick={() => emitChange(opt.value)}
                >
                  <span>{opt.label}</span>
                  {isActive && <FaCheck className="imperial-select-check" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
