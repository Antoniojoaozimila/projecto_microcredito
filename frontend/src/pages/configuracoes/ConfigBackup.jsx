import { useContext, useMemo, useState } from "react";
import { DatabaseBackup, Lock, Save, ShieldCheck } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Campo, MensagemModal, Paginacao, Vazio } from "../comum/ElementosModulo";
import { dataHoraCurta, paginar } from "../comum/utilModulo";
import { exportarBackup, guardarConfig, importarBackup, lerConfig, listarAuditoria } from "../../services/configuracoesMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "../comum/Modulo.css";
import "../relatorios/Relatorios.css";

const POR = 8;
const INTERRUPTORES = [
  ["requer_maiuscula", "Exige maiúscula"],
  ["requer_minuscula", "Exige minúscula"],
  ["requer_numero", "Exige número"],
  ["requer_simbolo", "Exige símbolo"],
  ["two_factor_obrigatorio", "2FA obrigatório"],
  ["log_auditoria_ativo", "Registo de auditoria"],
  ["backup_automatico", "Backup automático"],
];

const ConfigBackup = () => {
  const { usuario } = useContext(AuthContext);
  const [form, setForm] = useState(lerConfig);
  const [versao, setVersao] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [aviso, setAviso] = useState(null);
  const logs = useMemo(() => (versao >= 0 ? listarAuditoria() : []), [versao]);
  const page = paginar(logs, pagina, POR);

  const guardar = () => {
    guardarConfig({
      min_caracteres_senha: Number(form.min_caracteres_senha),
      requer_maiuscula: form.requer_maiuscula,
      requer_minuscula: form.requer_minuscula,
      requer_numero: form.requer_numero,
      requer_simbolo: form.requer_simbolo,
      expiracao_senha_dias: Number(form.expiracao_senha_dias),
      max_tentativas_login: Number(form.max_tentativas_login),
      bloqueio_minutos: Number(form.bloqueio_minutos),
      sessao_expiracao_min: Number(form.sessao_expiracao_min),
      two_factor_obrigatorio: form.two_factor_obrigatorio,
      log_auditoria_ativo: form.log_auditoria_ativo,
      backup_automatico: form.backup_automatico,
      backup_frequencia: form.backup_frequencia,
      backup_hora: form.backup_hora,
    }, usuario);
    setVersao((v) => v + 1);
    setAviso({ texto: "A segurança e o backup foram actualizados." });
  };

  const descarregar = () => {
    const blob = new Blob([JSON.stringify(exportarBackup(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-microcredito.json";
    a.click();
    URL.revokeObjectURL(url);
    setAviso({ texto: "A cópia de segurança foi descarregada." });
  };

  const restaurar = async (ficheiro) => {
    try {
      const texto = await ficheiro.text();
      importarBackup(JSON.parse(texto), usuario);
      setForm(lerConfig());
      setVersao((v) => v + 1);
      setAviso({ texto: "A cópia foi restaurada neste navegador." });
    } catch {
      setAviso({ erro: true, texto: "O ficheiro de backup não é válido." });
    }
  };

  return (
    <div className="cli-page cfg-page">
      <header className="cli-top">
        <div className="cli-pills"><span className="cli-pill"><DatabaseBackup size={16} /> Backup e segurança</span></div>
        <button type="button" className="cli-btn-novo" onClick={guardar}><Save size={16} /> Guardar</button>
      </header>
      <section className="cli-section">
        <h2><Lock size={16} /> Senha e sessão</h2>
        <div className="cfg-perm">
          {INTERRUPTORES.map(([chave, rotulo]) => (
            <button type="button" key={chave} className={`cfg-switch${form[chave] ? " is-on" : ""}`} onClick={() => setForm({ ...form, [chave]: !form[chave] })}><i /><span>{rotulo}</span></button>
          ))}
        </div>
        <div className="cli-grid" style={{ marginTop: 14 }}>
          <Campo icon={Lock} label="Mínimo de caracteres"><input type="number" value={form.min_caracteres_senha} onChange={(e) => setForm({ ...form, min_caracteres_senha: e.target.value })} /></Campo>
          <Campo icon={Lock} label="Expiração da senha (dias)"><input type="number" value={form.expiracao_senha_dias} onChange={(e) => setForm({ ...form, expiracao_senha_dias: e.target.value })} /></Campo>
          <Campo icon={Lock} label="Tentativas de login"><input type="number" value={form.max_tentativas_login} onChange={(e) => setForm({ ...form, max_tentativas_login: e.target.value })} /></Campo>
          <Campo icon={Lock} label="Bloqueio (minutos)"><input type="number" value={form.bloqueio_minutos} onChange={(e) => setForm({ ...form, bloqueio_minutos: e.target.value })} /></Campo>
          <Campo icon={Lock} label="Sessão (minutos)"><input type="number" value={form.sessao_expiracao_min} onChange={(e) => setForm({ ...form, sessao_expiracao_min: e.target.value })} /></Campo>
          <Campo icon={DatabaseBackup} label="Frequência do backup"><MenuSuspenso valor={form.backup_frequencia} onChange={(v) => setForm({ ...form, backup_frequencia: v })} opcoes={["Diário", "Semanal", "Mensal"].map((id) => ({ id, label: id }))} /></Campo>
          <Campo icon={DatabaseBackup} label="Hora do backup"><input type="time" value={form.backup_hora} onChange={(e) => setForm({ ...form, backup_hora: e.target.value })} /></Campo>
        </div>
        <div className="cli-top-actions" style={{ marginTop: 16 }}>
          <button type="button" className="cli-btn-io" onClick={descarregar}><DatabaseBackup size={16} /> Descarregar backup</button>
          <label className="cli-btn-voltar">
            Restaurar backup
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && restaurar(e.target.files[0])} />
          </label>
        </div>
      </section>
      <section className="cli-section">
        <h2><ShieldCheck size={16} /> Auditoria</h2>
        <div className="cli-card cli-table-wrap">
          <table className="cli-table pag-tabela">
            <thead>
              <tr>
                <th><span className="cli-th"><ShieldCheck size={14} /> Acção</span></th>
                <th><span className="cli-th"><DatabaseBackup size={14} /> Módulo</span></th>
                <th><span className="cli-th"><Lock size={14} /> Por</span></th>
                <th><span className="cli-th"><DatabaseBackup size={14} /> Quando</span></th>
              </tr>
            </thead>
            <tbody>
              {page.itens.length ? page.itens.map((l) => (
                <tr key={l.id}><td>{l.accao}</td><td>{l.modulo}</td><td>{l.por}</td><td>{dataHoraCurta(l.data_acao)}</td></tr>
              )) : <tr><td colSpan={4}><Vazio icone={ShieldCheck} titulo="Sem registos" texto="As alterações de configuração passam a aparecer aqui." /></td></tr>}
            </tbody>
          </table>
        </div>
        <Paginacao inicio={page.inicio} porPagina={POR} total={logs.length} actual={page.actual} totalPaginas={page.totalPaginas} onMudar={setPagina} />
      </section>
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </div>
  );
};

export default ConfigBackup;
