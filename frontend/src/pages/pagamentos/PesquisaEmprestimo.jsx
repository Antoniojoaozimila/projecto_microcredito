import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BadgeCheck, CalendarClock, FileText, Hash, Loader2, Phone, RefreshCw, Search, Wallet, X } from "lucide-react";
import { classeEstado, formatarData, formatarMT } from "../../services/emprestimosMicrocredito";
import AvatarCliente from "../clientes/AvatarCliente";

const normalizar = (texto) =>
  String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

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

const PesquisaEmprestimo = ({ emprestimos, valor, onChange, rotuloValor = "Pendente", valorDe = (e) => e.resumo.saldo, vazio = "Não há empréstimos activos por pagar." }) => {
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const [aProcurar, setAProcurar] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const caixa = useRef(null);
  const campo = useRef(null);
  const seleccionado = emprestimos.find((e) => String(e.id) === String(valor));

  useEffect(() => {
    if (!termo) return undefined;
    const pausa = setTimeout(() => setAProcurar(false), 250);
    return () => clearTimeout(pausa);
  }, [termo]);

  useEffect(() => {
    const fora = (evento) => {
      if (caixa.current && !caixa.current.contains(evento.target)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const resultados = useMemo(() => {
    const alvo = normalizar(termo);
    const digitos = alvo.replace(/\D/g, "");
    const lista = alvo
      ? emprestimos.filter((e) =>
          [e.numero_contrato, e.cliente?.nome_completo, e.cliente?.documento_numero, e.cliente?.nuit].some((t) => normalizar(t).includes(alvo)) ||
          (digitos.length >= 3 && String(e.cliente?.telefone_principal || "").replace(/\D/g, "").includes(digitos))
        )
      : emprestimos;
    return [...lista].sort((a, b) => (b.status === "Em Atraso") - (a.status === "Em Atraso")).slice(0, 8);
  }, [emprestimos, termo]);

  const escolher = (emprestimo) => {
    onChange(String(emprestimo.id));
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
        <AvatarCliente cliente={seleccionado.cliente} tamanho={44} className="emp-busca-avatar" />
        <span className="emp-busca-dados">
          <strong>{seleccionado.cliente?.nome_completo || "Cliente"}</strong>
          <span className="emp-busca-linha">
            <span><FileText size={13} /> {seleccionado.numero_contrato}</span>
            <span><Wallet size={13} /> {rotuloValor} {formatarMT(valorDe(seleccionado))}</span>
            <span><Phone size={13} /> {seleccionado.cliente?.telefone_principal || "—"}</span>
          </span>
        </span>
        <span className="emp-busca-ok"><BadgeCheck size={15} /> Seleccionado</span>
        <button type="button" className="emp-busca-trocar" onClick={() => { onChange(""); setTimeout(() => campo.current?.focus(), 0); }}>
          <RefreshCw size={14} /> Alterar
        </button>
      </div>
    );
  }

  return (
    <div ref={caixa} className={`emp-busca${aberto ? " is-open" : ""}`}>
      <div className={`emp-busca-campo${termo ? " tem-texto" : ""}${aProcurar ? " is-procurando" : ""}`}>
        <span className="emp-busca-lupa">{aProcurar ? <Loader2 size={18} /> : <Search size={18} />}</span>
        <input
          ref={campo}
          value={termo}
          onChange={(e) => { setTermo(e.target.value); setAProcurar(Boolean(e.target.value)); setAberto(true); setDestaque(0); }}
          onFocus={() => setAberto(true)}
          onKeyDown={teclas}
          placeholder="Pesquise por nº de contrato, nome, documento ou telefone do cliente"
          autoComplete="off"
        />
        {termo ? (
          <button type="button" className="emp-busca-limpar" aria-label="Limpar pesquisa" onClick={() => { setTermo(""); setAProcurar(false); campo.current?.focus(); }}>
            <X size={14} />
          </button>
        ) : null}
      </div>

      {aberto ? (
        <div className="emp-busca-painel">
          <div className="emp-busca-cabeca">
            <span><Search size={13} /> {aProcurar ? "A procurar..." : `${resultados.length} empréstimo${resultados.length === 1 ? "" : "s"}`}</span>
            <span className="emp-busca-dica">↑ ↓ para navegar · Enter para escolher</span>
          </div>
          {!aProcurar && !resultados.length ? (
            <p className="emp-busca-vazio"><FileText size={18} /> {termo ? `Nenhum empréstimo encontrado para «${termo}».` : vazio}</p>
          ) : null}
          {!aProcurar
            ? resultados.map((e, indice) => (
                <button
                  key={e.id}
                  type="button"
                  className={`emp-busca-item${indice === destaque ? " is-destaque" : ""}`}
                  style={{ animationDelay: `${indice * 35}ms` }}
                  onMouseEnter={() => setDestaque(indice)}
                  onClick={() => escolher(e)}
                >
                  <AvatarCliente cliente={e.cliente} tamanho={44} className="emp-busca-avatar" />
                  <span className="emp-busca-dados">
                    <strong><Realce texto={e.cliente?.nome_completo || "Cliente"} termo={termo} /></strong>
                    <span className="emp-busca-linha">
                      <span><Hash size={13} /> <Realce texto={e.numero_contrato} termo={termo} /></span>
                      <span><CalendarClock size={13} /> Próx. {formatarData(e.resumo.proximo?.data_vencimento)}</span>
                      <span className={`emp-estado ${classeEstado(e.status)}`}>
                        {e.status === "Em Atraso" ? <AlertTriangle size={11} /> : null} {e.status}
                      </span>
                    </span>
                  </span>
                  <span className="emp-busca-metricas">
                    <small>{rotuloValor}</small>
                    <strong className="pag-busca-valor">{formatarMT(valorDe(e))}</strong>
                  </span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
};

export default PesquisaEmprestimo;
