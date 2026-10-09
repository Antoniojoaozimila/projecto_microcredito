import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiUser, FiCreditCard } from "react-icons/fi";
import { listarClientes } from "../../services/clientesMicrocredito";
import { listarPagamentos } from "../../services/pagamentosMicrocredito";
import "./HeaderSearch.css";

const MIN_CHARS = 2;
const MAX_PER_GROUP = 6;

const textOf = (...values) =>
  values
    .flat()
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).toLowerCase())
    .join(" ");

const matches = (haystack, query) => haystack.includes(query);

export default function HeaderSearch() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ clientes: [], pagamentos: [] });

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults({ clientes: [], pagamentos: [] });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const isK = e.key === "k" || e.key === "K";
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 30);
      }
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) close();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [close]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < MIN_CHARS) {
      setResults({ clientes: [], pagamentos: [] });
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const clientesPorId = Object.fromEntries(listarClientes().map((c) => [String(c.id), c]));
        const clientesRaw = listarClientes();
        const pagamentosRaw = listarPagamentos();
        if (cancelled) return;

        const clientes = clientesRaw
          .filter((c) =>
            matches(
              textOf(c.nome_completo, c.documento_numero, c.nuit, c.telefone_principal, c.telefone_alternativo, c.email, c.endereco_completo, c.cidade),
              q
            )
          )
          .slice(0, MAX_PER_GROUP)
          .map((c) => ({
            id: c.id,
            title: c.nome_completo || "Cliente",
            subtitle: c.documento_numero || c.telefone_principal || c.email || "",
            path: `/imperial/dashboard/clientes/perfil/${c.id}`,
          }));

        const pagamentos = pagamentosRaw
          .filter((p) => {
            const cliente = clientesPorId[String(p.client_id)];
            return matches(
              textOf(cliente?.nome_completo, p.numero_recibo, p.referencia_transacao, p.valor_pago, p.forma_pagamento),
              q
            );
          })
          .slice(0, MAX_PER_GROUP)
          .map((p) => {
            const cliente = clientesPorId[String(p.client_id)];
            return {
              id: p.id,
              title: cliente?.nome_completo || p.numero_recibo || "Pagamento",
              subtitle: [p.numero_recibo, p.valor_pago].filter((v) => v != null && v !== "").join(" · "),
              path: `/imperial/dashboard/pagamentos/detalhe/${p.id}`,
            };
          });

        setResults({ clientes, pagamentos });
      } catch {
        if (!cancelled) setResults({ clientes: [], pagamentos: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const go = (path) => {
    if (!path) return;
    navigate(path);
    close();
  };

  const total = results.clientes.length + results.pagamentos.length;
  const showPanel = open && query.trim().length >= MIN_CHARS;

  return (
    <div className="header-search" ref={wrapRef}>
      <div className={`header-search-box ${open ? "is-open" : ""}`}>
        <FiSearch className="header-search-icon" />
        <input
          ref={inputRef}
          type="search"
          className="header-search-input"
          placeholder="Pesquisar clientes e pagamentos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          spellCheck={false}
          aria-label="Pesquisar no sistema"
        />
        {query ? (
          <button type="button" className="header-search-clear" onClick={() => setQuery("")} aria-label="Limpar pesquisa">
            <FiX />
          </button>
        ) : (
          <kbd className="header-search-kbd">Ctrl K</kbd>
        )}
      </div>

      {showPanel && (
        <div className="header-search-panel" role="listbox">
          {loading && <p className="header-search-status">A procurar…</p>}
          {!loading && total === 0 && (
            <p className="header-search-status">Sem resultados para “{query.trim()}”.</p>
          )}
          <ResultGroup title="Clientes" icon={<FiUser />} items={results.clientes} onSelect={go} />
          <ResultGroup title="Pagamentos" icon={<FiCreditCard />} items={results.pagamentos} onSelect={go} />
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, icon, items, onSelect }) {
  if (!items.length) return null;
  return (
    <div className="header-search-group">
      <p className="header-search-group-title">
        {icon}
        {title}
      </p>
      {items.map((item) => (
        <button
          key={`${title}-${item.id}`}
          type="button"
          className="header-search-item"
          onClick={() => onSelect(item.path)}
        >
          <strong>{item.title}</strong>
          {item.subtitle ? <small>{item.subtitle}</small> : null}
        </button>
      ))}
    </div>
  );
}
