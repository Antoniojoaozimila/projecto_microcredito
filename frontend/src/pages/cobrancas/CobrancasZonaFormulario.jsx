import { useContext, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Save } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import { Campo, MensagemModal } from "../comum/ElementosModulo";
import MapaLeaflet from "../comum/MapaLeaflet";
import { opcoesDe } from "../comum/utilModulo";
import { LOCALIDADES, cidadesDaProvincia } from "../../data/mocambiqueLocalidades";
import { CAMINHO_COB } from "./iconesCobranca";
import { ESTADOS_ZONA, guardarZona, lerCoordenadas, obterZona, sugerirCodigoZona, utilizadoresConhecidos, validarZona } from "../../services/cobrancasMicrocredito";
import "../clientes/ClienteModulo.css";
import "../pagamentos/Pagamentos.css";
import "./Cobrancas.css";

const vazio = { nome: "", codigo: "", provincia: "", distrito: "", bairro: "", coordenadas_centro: "", raio_km: "", responsavel: "", status: "Ativa", observacoes: "" };

const CobrancasZonaFormulario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const actual = id ? obterZona(id) : null;
  const [form, setForm] = useState(() => (actual ? { ...vazio, ...actual, raio_km: actual.raio_km ?? "" } : vazio));
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);
  const set = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }));
  const distritos = cidadesDaProvincia(form.provincia).map((c) => c.nome);
  const pessoas = useMemo(() => utilizadoresConhecidos(usuario), [usuario]);

  const salvar = (e) => {
    e.preventDefault();
    const falhas = validarZona({ ...form, id: actual?.id });
    setErros(falhas);
    if (Object.keys(falhas).length) return setAviso({ erro: true, texto: "Reveja os campos assinalados." });
    try {
      const zona = guardarZona({ ...form, id: actual?.id }, usuario);
      navigate(CAMINHO_COB + "/zonas", { replace: true, state: { aviso: `Zona ${zona.codigo} ${actual ? "actualizada" : "criada"} com sucesso.` } });
    } catch (erro) {
      setAviso({ erro: true, texto: erro.message });
    }
  };

  if (id && !actual) {
    return (
      <div className="cli-page">
        <span className="cli-pill"><MapPin size={16} /> Zona não encontrada</span>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_COB}/zonas`)}><ArrowLeft size={16} /> Voltar</button>
      </div>
    );
  }

  return (
    <form className="cli-page cli-form-entrada" onSubmit={salvar}>
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><MapPin size={16} /> {actual ? "Editar zona" : "Nova zona"}</span>
          {actual ? <span className="cli-pill">{actual.codigo}</span> : null}
        </div>
        <button type="button" className="cli-btn-voltar" onClick={() => navigate(`${CAMINHO_COB}/zonas`)}><ArrowLeft size={16} /> Voltar</button>
      </header>

      <section className="cli-section">
        <h2><MapPin size={18} /> Dados da zona</h2>
        <div className="cli-grid">
          <Campo icon={MapPin} label="Nome da zona *" erro={erros.nome}>
            <input value={form.nome} onChange={(e) => {
              const nome = e.target.value;
              setForm((a) => ({ ...a, nome, codigo: actual || a.codigo ? a.codigo : sugerirCodigoZona(nome) }));
            }} placeholder="Ex: Zona Central" />
          </Campo>
          <Campo label="Código *" erro={erros.codigo}>
            <input value={form.codigo} onChange={(e) => set("codigo", e.target.value.toUpperCase())} placeholder="ZC-001" />
          </Campo>
          <Campo label="Província *" erro={erros.provincia}>
            <MenuSuspenso valor={form.provincia} pesquisavel opcoes={opcoesDe(LOCALIDADES.map((p) => p.provincia), "Seleccione")} onChange={(v) => setForm((a) => ({ ...a, provincia: v, distrito: "", bairro: "" }))} />
          </Campo>
          <Campo label="Distrito">
            <MenuSuspenso valor={form.distrito} pesquisavel opcoes={opcoesDe(distritos, "Seleccione")} onChange={(v) => set("distrito", v)} />
          </Campo>
          <Campo label="Bairro">
            <input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} placeholder="Bairro" />
          </Campo>
          <Campo label="Coordenadas do centro" erro={erros.coordenadas_centro}>
            <input value={form.coordenadas_centro} onChange={(e) => set("coordenadas_centro", e.target.value)} placeholder="-25.969200, 32.573200" />
          </Campo>
          <Campo label="Raio de cobertura (km)" erro={erros.raio_km}>
            <input value={form.raio_km} onChange={(e) => set("raio_km", e.target.value.replace(",", "."))} placeholder="5" />
          </Campo>
          <Campo label="Responsável">
            <MenuSuspenso valor={form.responsavel} pesquisavel opcoes={opcoesDe(pessoas, "Seleccione")} onChange={(v) => set("responsavel", v)} />
          </Campo>
          <Campo label="Estado *" erro={erros.status}>
            <MenuSuspenso valor={form.status} opcoes={ESTADOS_ZONA.map((s) => ({ id: s, label: s }))} onChange={(v) => set("status", v)} />
          </Campo>
          <Campo label="Observações" full erro={erros.observacoes}>
            <textarea rows={3} maxLength={5000} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Informações adicionais" />
          </Campo>
        </div>
        <p className="cli-suave" style={{ margin: "12px 0 8px" }}>Clique no mapa para definir o centro da zona.</p>
        <div className="mod-mapa-caixa">
          <MapaLeaflet
            altura={280}
            aoVivo
            aoClicar={({ lat, lon }) => set("coordenadas_centro", `${lat.toFixed(6)}, ${lon.toFixed(6)}`)}
            pontos={(() => {
              const c = lerCoordenadas(form.coordenadas_centro);
              return c ? [{ ...c, titulo: form.nome || "Centro da zona", raio: form.raio_km, cor: "#4AAC05" }] : [];
            })()}
          />
        </div>
      </section>
      <div className="mod-form-acoes">
        <button type="submit" className="cli-btn-novo"><Save size={16} /> {actual ? "Guardar alterações" : "Criar zona"}</button>
        <button type="button" className="cli-btn ghost" onClick={() => navigate(`${CAMINHO_COB}/zonas`)}>Cancelar</button>
      </div>
      <MensagemModal aviso={aviso} onFechar={() => setAviso(null)} />
    </form>
  );
};

export default CobrancasZonaFormulario;
