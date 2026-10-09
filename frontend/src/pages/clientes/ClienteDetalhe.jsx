import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, BadgeCheck, Ban, Building2, CalendarClock, FileDigit, Gauge, Heart, Home, IdCard,
  Landmark, Mail, MapPin, Navigation, Pencil, Phone, ShieldCheck, StickyNote, User, UserCheck, Wallet,
} from "lucide-react";
import { obterCliente } from "../../services/clientesMicrocredito";
import "./ClienteModulo.css";

const Item = ({ icon: Icone, rotulo, valor, largo, indice }) => (
  <div className={`cli-info${largo ? " is-largo" : ""}`} style={{ animationDelay: `${indice * 40}ms` }}>
    <span className="cli-info-icone"><Icone size={17} /></span>
    <span>
      <small>{rotulo}</small>
      <strong>{valor || "—"}</strong>
    </span>
  </div>
);

const ClienteDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const cliente = obterCliente(id);
  if (!cliente) {
    return (
      <div className="cli-page">
        <span className="cli-pill"><User size={16} /> Cliente não encontrado</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate("/microcredito/dashboard/clientes")}><ArrowLeft size={16} /> Voltar à lista</button>
      </div>
    );
  }
  const zona = cliente.zona_id && cliente.zona_id !== "__outro" ? cliente.zona_id : "";
  const fisica = cliente.tipo_cliente === "Pessoa Física";
  const itens = [
    { icon: IdCard, rotulo: "Documento", valor: `${cliente.documento_tipo} ${cliente.documento_numero}` },
    { icon: FileDigit, rotulo: "NUIT", valor: cliente.nuit },
    { icon: Phone, rotulo: "Telefone", valor: cliente.telefone_principal },
    { icon: Mail, rotulo: "Email", valor: cliente.email },
    { icon: Landmark, rotulo: "Cidade", valor: cliente.cidade },
    { icon: MapPin, rotulo: "Província", valor: cliente.provincia },
    { icon: Home, rotulo: "Bairro", valor: cliente.bairro },
    { icon: MapPin, rotulo: "Zona", valor: zona },
    { icon: Navigation, rotulo: "Endereço", valor: cliente.endereco_completo, largo: true },
    { icon: Wallet, rotulo: "Limite de crédito", valor: `${Number(cliente.limite_credito || 0).toLocaleString("pt-PT")} MT` },
    { icon: ShieldCheck, rotulo: "Perfil de risco", valor: cliente.perfil_risco },
    { icon: Gauge, rotulo: "Score", valor: cliente.score },
    { icon: Heart, rotulo: "Contacto de emergência", valor: [cliente.contacto_emergencia_nome, cliente.contacto_emergencia_telefone, cliente.contacto_emergencia_parentesco].filter(Boolean).join(" · ") },
    { icon: Navigation, rotulo: "GPS", valor: cliente.coordenadas_gps },
    { icon: UserCheck, rotulo: "Registado por", valor: cliente.criado_por },
    { icon: CalendarClock, rotulo: "Data de registo", valor: cliente.data_registo ? new Date(cliente.data_registo).toLocaleString("pt-PT") : "" },
    { icon: StickyNote, rotulo: "Observações", valor: cliente.observacoes, largo: true },
  ];

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill">{fisica ? <User size={16} /> : <Building2 size={16} />} {cliente.nome_completo}</span>
          <span className="cli-pill">{fisica ? <User size={16} /> : <Building2 size={16} />} {cliente.tipo_cliente}</span>
          <span className={`cli-pill ${cliente.cliente_ativo ? "" : "cli-pill-off"}`}>
            {cliente.cliente_ativo ? <BadgeCheck size={16} /> : <Ban size={16} />}
            {cliente.cliente_ativo ? "Activo" : "Inactivo"}
          </span>
        </div>
        <div className="cli-top-actions">
          <button type="button" className="cli-btn-voltar" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Voltar</button>
          <Link className="cli-btn-novo" to={`/microcredito/dashboard/clientes/editar/${cliente.id}`}><Pencil size={16} /> Editar</Link>
        </div>
      </header>
      <section className="cli-section">
        <div className="cli-infos">
          {itens.map((item, indice) => <Item key={item.rotulo} indice={indice} {...item} />)}
        </div>
      </section>
    </div>
  );
};

export default ClienteDetalhe;
