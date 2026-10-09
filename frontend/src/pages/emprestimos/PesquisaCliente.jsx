import { useEffect, useMemo, useRef, useState } from "react";
import {
  AtSign, BadgeCheck, Building2, Fingerprint, Gauge, Hash, IdCard, Layers, Loader2, MapPin, Phone, RefreshCw, Search, User, Wallet, X,
} from "lucide-react";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import AvatarCliente from "../clientes/AvatarCliente";

const MODOS = [
  { id: "todos", label: "Todos", icon: Layers, campos: ["nome_completo", "documento_numero", "nuit", "telefone_principal", "telefone_alternativo", "email"] },
  { id: "nome", label: "Nome", icon: User, campos: ["nome_completo"] },
  { id: "documento", label: "Documento", icon: IdCard, campos: ["documento_numero"] },
  { id: "nuit", label: "NUIT", icon: Fingerprint, campos: ["nuit"] },
  { id: "telefone", label: "Telefone", icon: Phone, campos: ["telefone_principal", "telefone_alternativo"] },
  { id: "email", label: "Email", icon: AtSign, campos: ["email"] },
];

const normalizar = (texto) =>
  String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const classeScore = (score) => (score >= 700 ? "is-alto" : score >= 400 ? "is-medio" : "is-baixo");

const Realce = ({ texto, termo }) => {
  const valor = String(texto || "");
  const alvo = normalizar(termo);
  const pos = alvo ? normalizar(valor).indexOf(alvo) : -1;
  if (pos < 0) return valor || "—";
  return (
    <>
      {valor.slice(0, pos)}
      <mark>{valor.slice(pos, pos + alvo.length)}</mark>
      {valor.slice(pos + alvo.length)}
    </>
  );
};

const Avatar = ({ cliente }) => <AvatarCliente cliente={cliente} tamanho={44} className="emp-busca-avatar" />;

const PesquisaCliente = ({ clientes, valor, onChange }) => {
  const [modo, setModo] = useState("todos");
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const [aProcurar, setAProcurar] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const caixa = useRef(null);
  const campo = useRef(null);
  const seleccionado = clientes.find((c) => String(c.id) === String(valor));

  useEffect(() => {
    if (!termo) return undefined;
    const pausa = setTimeout(() => setAProcurar(false), 280);
    return () => clearTimeout(pausa);
  }, [termo, modo]);

  useEffect(() => {
    const fora = (evento) => {
      if (caixa.current && !caixa.current.contains(evento.target)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const resultados = useMemo(() => {
    const alvo = normalizar(termo);
    const campos = MODOS.find((m) => m.id === modo)?.campos || [];
    const soNumeros = alvo.replace(/\D/g, "");
    const lista = alvo
      ? clientes.filter((c) =>
          campos.some((chave) => {
            const texto = normalizar(c[chave]);
            if (texto.includes(alvo)) return true;
            return chave.startsWith("telefone") && soNumeros.length >= 3 && texto.replace(/\D/g, "").includes(soNumeros);
          })
        )
      : clientes;
    return lista.slice(0, alvo ? 8 : 12);
  }, [clientes, termo, modo]);

  const escolher = (cliente) => {
    onChange(String(cliente.id));
    setTermo("");
    setAberto(false);
  };

  const teclas = (evento) => {
    if (!resultados.length) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setDestaque((d) => (d + 1) % resultados.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setDestaque((d) => (d - 1 + resultados.length) % resultados.length);
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      escolher(resultados[destaque] || resultados[0]);
    } else if (evento.key === "Escape") {
      setAberto(false);
    }
  };

  if (seleccionado) {
    return (
      <div className="emp-busca-escolhido">
        <Avatar cliente={seleccionado} />
        <span className="emp-busca-dados">
          <strong>{seleccionado.nome_completo}</strong>
          <span className="emp-busca-linha">
            <span><IdCard size={13} /> {seleccionado.documento_tipo || "Doc."} {seleccionado.documento_numero || "—"}</span>
            <span><Phone size={13} /> {seleccionado.telefone_principal || "—"}</span>
            {seleccionado.cidade ? <span><MapPin size={13} /> {seleccionado.cidade}</span> : null}
          </span>
        </span>
        <span className="emp-busca-ok"><BadgeCheck size={15} /> Seleccionado</span>
        <button type="button" className="emp-busca-trocar" onClick={() => { onChange(""); setTimeout(() => campo.current?.focus(), 0); }}>
          <RefreshCw size={14} /> Alterar
        </button>
      </div>
    );
  }

  const modoActual = MODOS.find((m) => m.id === modo);
  const mostrarPainel = clientes.length > 0;
  const totalVisivel = termo.trim() ? resultados.length : Math.min(clientes.length, 12);

  return (
    <div ref={caixa} className={`emp-busca is-lista${mostrarPainel ? " is-open" : ""}`}>
      <div className="emp-busca-modos" role="tablist">
        {MODOS.map(({ id, label, icon: IconeModo }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={modo === id}
            className={`emp-busca-modo${modo === id ? " is-active" : ""}`}
            onClick={() => { setModo(id); setAProcurar(Boolean(termo)); setDestaque(0); campo.current?.focus(); }}
          >
            <IconeModo size={14} /> {label}
          </button>
        ))}
      </div>

      <div className={`emp-busca-campo${termo ? " tem-texto" : ""}${aProcurar ? " is-procurando" : ""}`}>
        <span className="emp-busca-lupa">{aProcurar ? <Loader2 size={18} /> : <Search size={18} />}</span>
        <input
          ref={campo}
          value={termo}
          onChange={(e) => { setTermo(e.target.value); setAProcurar(Boolean(e.target.value)); setAberto(true); setDestaque(0); }}
          onFocus={() => setAberto(true)}
          onKeyDown={teclas}
          placeholder={modo === "todos" ? "Pesquise por nome, documento, NUIT, telefone ou email" : `Pesquisar por ${modoActual.label.toLowerCase()}`}
          autoComplete="off"
        />
        {termo ? (
          <button type="button" className="emp-busca-limpar" aria-label="Limpar pesquisa" onClick={() => { setTermo(""); setAProcurar(false); campo.current?.focus(); }}>
            <X size={14} />
          </button>
        ) : null}
      </div>

      {mostrarPainel ? (
        <div className="emp-busca-painel">
          <div className="emp-busca-cabeca">
            <span>
              <Search size={13} />
              {aProcurar
                ? "A procurar..."
                : termo.trim()
                  ? `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}`
                  : `${totalVisivel} cliente${totalVisivel === 1 ? "" : "s"} para seleccionar`}
            </span>
            <span className="emp-busca-dica">
              {clientes.length > 12 && !termo.trim() ? `Mostrando 12 de ${clientes.length}. Pesquise para filtrar` : "↑ ↓ para navegar · Enter para escolher"}
            </span>
          </div>
          {!aProcurar && !resultados.length ? (
            <p className="emp-busca-vazio"><User size={18} /> Nenhum cliente encontrado para «{termo}».</p>
          ) : null}
          {!aProcurar
            ? resultados.map((c, indice) => (
                <button
                  key={c.id}
                  type="button"
                  className={`emp-busca-item${indice === destaque ? " is-destaque" : ""}`}
                  style={{ animationDelay: `${indice * 35}ms` }}
                  onMouseEnter={() => setDestaque(indice)}
                  onClick={() => escolher(c)}
                >
                  <Avatar cliente={c} />
                  <span className="emp-busca-dados">
                    <strong><Realce texto={c.nome_completo} termo={modo === "todos" || modo === "nome" ? termo : ""} /></strong>
                    <span className="emp-busca-linha">
                      <span>{c.tipo_cliente === "Pessoa Jurídica" ? <Building2 size={13} /> : <User size={13} />} {c.tipo_cliente || "Cliente"}</span>
                      <span><Hash size={13} /> <Realce texto={c.documento_numero} termo={modo === "todos" || modo === "documento" ? termo : ""} /></span>
                      <span><Phone size={13} /> <Realce texto={c.telefone_principal} termo={modo === "todos" || modo === "telefone" ? termo : ""} /></span>
                      {modo === "nuit" ? <span><Fingerprint size={13} /> <Realce texto={c.nuit} termo={termo} /></span> : null}
                      {modo === "email" ? <span><AtSign size={13} /> <Realce texto={c.email} termo={termo} /></span> : null}
                    </span>
                  </span>
                  <span className="emp-busca-metricas">
                    <span className={`emp-busca-score ${classeScore(Number(c.score))}`}><Gauge size={13} /> {c.score}</span>
                    <small><Wallet size={12} /> {formatarMT(c.limite_disponivel)}</small>
                  </span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
};

export default PesquisaCliente;
