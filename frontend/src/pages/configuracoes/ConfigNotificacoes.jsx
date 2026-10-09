import { useContext, useState } from "react";
import { Bell, Save } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { Campo, MensagemModal } from "../comum/ElementosModulo";
import api from "../../services/api";
import { guardarConfig, lerConfig } from "../../services/configuracoesMicrocredito";
import "../clientes/ClienteModulo.css";
import "../comum/Modulo.css";
import "../relatorios/Relatorios.css";

const INTERRUPTORES = [
  ["notificacoes_email_ativo", "Email"],
  ["notificacoes_sms_ativo", "SMS"],
  ["notificacoes_push_ativo", "Push"],
  ["notificacoes_whatsapp_ativo", "WhatsApp"],
];

const ConfigNotificacoes = () => {
  const { usuario } = useContext(AuthContext);
  const [form, setForm] = useState(() => ({ ...lerConfig(), email_smtp_pass: "", sms_api_secret: "" }));
  const [aviso, setAviso] = useState(null);

  const guardar = async () => {
    if (form.notificacoes_email_ativo && !form.email_smtp_host) {
      setAviso({ erro: true, texto: "Indique o servidor SMTP para activar o email. Use smtp.gmail.com para Gmail ou Workspace, ou smtp.office365.com para Outlook." });
      return;
    }
    if (form.notificacoes_sms_ativo && !form.sms_sender_id) {
      setAviso({ erro: true, texto: "Indique o remetente de SMS." });
      return;
    }
    const parcial = {
      notificacoes_email_ativo: form.notificacoes_email_ativo,
      notificacoes_sms_ativo: form.notificacoes_sms_ativo,
      notificacoes_push_ativo: form.notificacoes_push_ativo,
      notificacoes_whatsapp_ativo: form.notificacoes_whatsapp_ativo,
      email_smtp_host: form.email_smtp_host,
      email_smtp_port: Number(form.email_smtp_port) || 587,
      email_smtp_user: form.email_smtp_user,
      sms_api_key: form.sms_api_key,
      sms_sender_id: form.sms_sender_id,
    };
    if (form.email_smtp_pass) parcial.email_smtp_pass = form.email_smtp_pass;
    if (form.sms_api_secret) parcial.sms_api_secret = form.sms_api_secret;
    guardarConfig(parcial, usuario);
    if (form.notificacoes_email_ativo) {
      try {
        await api.post("/api/correio/verificar", {
          email_smtp_host: form.email_smtp_host,
          email_smtp_port: Number(form.email_smtp_port) || 587,
          email_smtp_user: form.email_smtp_user,
          email_smtp_pass: form.email_smtp_pass || undefined,
          notificacoes_email_ativo: true,
        });
        setAviso({ texto: "As notificações foram actualizadas e o correio respondeu." });
      } catch (erro) {
        setAviso({ erro: true, texto: erro.response?.data?.mensagem || "O correio não respondeu. Confira o servidor, o utilizador e a senha de aplicação." });
      }
      return;
    }
    setAviso({ texto: "As notificações foram actualizadas." });
  };

  return (
    <div className="cli-page cfg-page">
      <header className="cli-top">
        <div className="cli-pills"><span className="cli-pill"><Bell size={16} /> Notificações</span></div>
        <button type="button" className="cli-btn-novo" onClick={guardar}><Save size={16} /> Guardar</button>
      </header>
      <section className="cli-section">
        <h2><Bell size={16} /> Canais</h2>
        <div className="cfg-perm">
          {INTERRUPTORES.map(([chave, rotulo]) => (
            <button type="button" key={chave} className={`cfg-switch${form[chave] ? " is-on" : ""}`} onClick={() => setForm({ ...form, [chave]: !form[chave] })}>
              <i /><span>{rotulo}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="cli-section">
        <h2><Bell size={16} /> Email e SMS</h2>
        <div className="cli-grid">
          <Campo icon={Bell} label="Servidor SMTP"><input value={form.email_smtp_host} placeholder="smtp.gmail.com ou smtp.office365.com" onChange={(e) => setForm({ ...form, email_smtp_host: e.target.value })} /></Campo>
          <Campo icon={Bell} label="Porta"><input type="number" value={form.email_smtp_port} onChange={(e) => setForm({ ...form, email_smtp_port: e.target.value })} /></Campo>
          <Campo icon={Bell} label="Utilizador SMTP"><input value={form.email_smtp_user} onChange={(e) => setForm({ ...form, email_smtp_user: e.target.value })} /></Campo>
          <Campo icon={Bell} label="Senha SMTP"><input type="password" value={form.email_smtp_pass} placeholder="Deixe em branco para manter" onChange={(e) => setForm({ ...form, email_smtp_pass: e.target.value })} /></Campo>
          <Campo icon={Bell} label="Chave da API de SMS"><input value={form.sms_api_key} onChange={(e) => setForm({ ...form, sms_api_key: e.target.value })} /></Campo>
          <Campo icon={Bell} label="Segredo da API de SMS"><input type="password" value={form.sms_api_secret} placeholder="Deixe em branco para manter" onChange={(e) => setForm({ ...form, sms_api_secret: e.target.value })} /></Campo>
          <Campo icon={Bell} label="Remetente SMS"><input value={form.sms_sender_id} onChange={(e) => setForm({ ...form, sms_sender_id: e.target.value })} /></Campo>
        </div>
      </section>
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default ConfigNotificacoes;
