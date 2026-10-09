import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, CalendarClock, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, Download, Eye, HandCoins, Hash, IdCard, List,
  Loader2, Percent, Phone, Printer, Receipt, TrendingUp, Wallet, WalletCards,
} from "lucide-react";
import AvatarCliente from "../clientes/AvatarCliente";
import LogoCarteira from "./LogoCarteira";
import { descarregarRecibo, imprimirRecibo } from "./reciboEmprestimo";
import { obterCliente } from "../../services/clientesMicrocredito";
import { formatarData, formatarMT, listarCarteiras, obterEmprestimo } from "../../services/emprestimosMicrocredito";
import "../clientes/ClienteModulo.css";
import "./Emprestimos.css";

const EmprestimoCriado = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [erro, setErro] = useState("");
  const emprestimo = obterEmprestimo(id);

  if (!emprestimo) {
    return (
      <div className="cli-page">
        <span className="cli-pill"><HandCoins size={16} /> Empréstimo não encontrado</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate("/imperial/dashboard/emprestimos")}><ArrowLeft size={16} /> Voltar à lista</button>
      </div>
    );
  }

  const cliente = obterCliente(emprestimo.client_id);
  const carteira = listarCarteiras().find((c) => String(c.id) === String(emprestimo.carteira_id));

  const recibo = async (accao) => {
    try {
      setErro("");
      await accao(emprestimo, cliente, carteira);
    } catch {
      setErro("Não foi possível gerar o recibo.");
    }
  };

  const linhas = [
    { icon: CircleDollarSign, rotulo: "Valor emprestado", valor: formatarMT(emprestimo.valor_emprestado) },
    { icon: CalendarClock, rotulo: "Modalidade", valor: `${emprestimo.modalidade} · ${emprestimo.num_parcelas} parcela${emprestimo.num_parcelas === 1 ? "" : "s"}` },
    { icon: Percent, rotulo: "Taxa de juros", valor: `${emprestimo.taxa_juros}%` },
    { icon: Hash, rotulo: "Valor da parcela", valor: formatarMT(emprestimo.valor_parcela) },
    { icon: CalendarDays, rotulo: "1.º vencimento", valor: formatarData(emprestimo.parcelas?.[0]?.data_vencimento) },
    { icon: CalendarDays, rotulo: "Último vencimento", valor: formatarData(emprestimo.data_vencimento) },
    { icon: TrendingUp, rotulo: "Total de juros", valor: formatarMT(emprestimo.valor_total_juros) },
    {
      icon: WalletCards,
      rotulo: "Carteira",
      valor: <span className="emp-recibo-carteira">{carteira ? <LogoCarteira carteira={carteira} /> : null}{carteira?.nome || "—"}</span>,
    },
  ];

  const accoes = [
    { icon: Download, titulo: "Descarregar recibo", texto: "Guardar em PDF", accao: () => recibo(descarregarRecibo), principal: true },
    { icon: Printer, titulo: "Imprimir", texto: "Enviar para a impressora", accao: () => recibo(imprimirRecibo) },
    { icon: Eye, titulo: "Ver empréstimo", texto: "Abrir a ficha completa", accao: () => navigate(`/imperial/dashboard/emprestimos/${emprestimo.id}`) },
    { icon: List, titulo: "Listar empréstimos", texto: "Voltar à lista", accao: () => navigate("/imperial/dashboard/emprestimos") },
  ];

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Receipt size={16} /> Recibo do pedido</span>
          <span className="cli-pill"><HandCoins size={16} /> {emprestimo.numero_contrato}</span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-voltar" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Voltar</button>
          <button type="button" className="cli-btn-novo" onClick={() => navigate("/imperial/dashboard/emprestimos/novo")}><HandCoins size={16} /> Criar outro empréstimo</button>
        </div>
      </header>

      <section className="emp-criado-sucesso">
        <span className="emp-criado-icone"><CheckCircle2 size={30} /></span>
        <div>
          <small>Operação concluída</small>
          <h2>Empréstimo {emprestimo.numero_contrato} criado com sucesso.</h2>
          <p>O pedido ficou pendente de aprovação. Guarde ou imprima o recibo abaixo.</p>
        </div>
      </section>

      {erro ? <p className="cli-erro emp-aviso"><AlertTriangle size={15} /> {erro}</p> : null}

      <div className="emp-criado-grelha">
        <div className="emp-recibo-cartao">
          <div className="emp-recibo-topo">
            <span><Receipt size={16} /> Recibo do pedido</span>
            <strong>{emprestimo.numero_contrato}</strong>
          </div>
          <div className="emp-recibo-cliente">
            <AvatarCliente cliente={cliente} tamanho={46} />
            <span>
              <strong>{cliente?.nome_completo || "Cliente removido"}</strong>
              <span className="emp-recibo-cliente-linha">
                <span><IdCard size={12} /> {cliente?.documento_tipo} {cliente?.documento_numero}</span>
                <span><Phone size={12} /> {cliente?.telefone_principal}</span>
              </span>
            </span>
          </div>
          <table className="emp-recibo-tabela">
            <tbody>
              {linhas.map(({ icon: IconeLinha, rotulo, valor }, indice) => (
                <tr key={rotulo} style={{ animationDelay: `${150 + indice * 45}ms` }}>
                  <th><span><IconeLinha size={14} /></span>{rotulo}</th>
                  <td>{valor}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th><span><Wallet size={15} /></span>Total a pagar</th>
                <td>{formatarMT(emprestimo.valor_total_receber)}</td>
              </tr>
            </tfoot>
          </table>
          <span className={`emp-estado emp-recibo-estado ${emprestimo.status === "Pendente" ? "is-pendente" : "is-activo"}`}>
            {emprestimo.status === "Pendente" ? <Loader2 size={12} className="emp-girar-lento" /> : <CheckCircle2 size={12} />} {emprestimo.status} · {emprestimo.fase_atual}
          </span>
        </div>

        <aside className="emp-criado-lado">
          <h3>O que deseja fazer?</h3>
          <div className="emp-recibo-accoes">
            {accoes.map(({ icon: IconeAccao, titulo, texto, accao, principal }, indice) => (
              <button
                key={titulo}
                type="button"
                className={`emp-recibo-accao${principal ? " is-principal" : ""}`}
                style={{ animationDelay: `${350 + indice * 60}ms` }}
                onClick={accao}
              >
                <span className="emp-recibo-accao-icone"><IconeAccao size={18} /></span>
                <span className="emp-recibo-accao-texto"><strong>{titulo}</strong><small>{texto}</small></span>
                <ChevronRight size={16} className="emp-recibo-accao-seta" />
              </button>
            ))}
          </div>
          <button type="button" className="emp-recibo-novo" onClick={() => navigate("/imperial/dashboard/emprestimos/novo")}>
            <span className="emp-recibo-novo-icone"><HandCoins size={16} /></span>
            Criar outro empréstimo
          </button>
        </aside>
      </div>
    </div>
  );
};

export default EmprestimoCriado;
