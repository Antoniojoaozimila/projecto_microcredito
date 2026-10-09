import { useContext, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle, BadgeCheck, Briefcase, Camera, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardCheck, FileBadge, FileText, Hash,
  IdCard, LayoutDashboard, Loader2, Mail, MapPin, Paperclip, Phone, Receipt, Save, Scale, Shield, ShieldPlus, Sparkles, StickyNote,
  Trash2, User, UserPlus, Users, Wallet, X, CalendarDays, Circle, Heart,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import MenuSuspenso from "../clientes/MenuSuspenso";
import PesquisaEmprestimo from "../pagamentos/PesquisaEmprestimo";
import UploadFicheiros from "./UploadFicheiros";
import { CORES_TIPO_GARANTIA, ETIQUETAS_TIPO_GARANTIA, ICONES_SUBTIPO, ICONES_TIPO_GARANTIA } from "./iconesGarantia";
import { guardarLista } from "../../services/anexosLocais";
import { formatarMT } from "../../services/emprestimosMicrocredito";
import { idSeguro } from "../../services/idLocal";
import {
  AVAL, BEM_IMOVEL, BEM_MOVEL, DOCUMENTOS_AVALISTA, ESTADOS_CONSERVACAO, REGRAS_GARANTIA, SEM_GARANTIA_G, SUBTIPOS, TIPOS_GARANTIA,
  criarGarantia, documentosEmFalta, eBem, emprestimosParaGarantia, garantiasDoEmprestimo, hojeIso, validarGarantia,
} from "../../services/garantiasMicrocredito";
import "../clientes/ClienteModulo.css";
import "../emprestimos/Emprestimos.css";
import "../pagamentos/Pagamentos.css";
import "./Garantias.css";

const avalistaVazio = () => ({
  chave: idSeguro(),
  nome_completo: "",
  documento_tipo: "BI",
  documento_numero: "",
  telefone_principal: "",
  telefone_alternativo: "",
  email: "",
  endereco_completo: "",
  profissao: "",
  rendimento_mensal: "",
  relacao_com_cliente: "",
  documentos_anexos: [],
});

const inicial = (loanId = "") => ({
  loan_id: loanId,
  tipo_garantia: "",
  subtipo_garantia: "",
  descricao: "",
  estado_conservacao: "",
  localizacao_garantia: "",
  valor_estimado: "",
  valor_avaliado: "",
  data_avaliacao: "",
  avaliador: "",
  avalistas: [avalistaVazio()],
  documentos_anexos: { titulo: [], factura: [], outros: [] },
  fotos_garantia: [],
  observacoes: "",
});

const soMontante = (valor) => {
  const limpo = String(valor || "").replace(/[^\d.,]/g, "").replace(",", ".");
  const [inteiro, ...resto] = limpo.split(".");
  return resto.length ? `${inteiro}.${resto.join("").slice(0, 2)}` : inteiro;
};

const PLACEHOLDERS = {
  [SEM_GARANTIA_G]: "Ex: Crédito pessoal baseado no rendimento e historial do cliente",
  [AVAL]: "Ex: Aval prestado pelo irmão do cliente, funcionário público",
  [BEM_MOVEL]: "Ex: Toyota Corolla 2018, matrícula AAA-123-MC, cor branca, 85 000 km",
  [BEM_IMOVEL]: "Ex: Casa tipo 3 com quintal, talhão nº 45, bairro Malhangalene",
  "Cheque Caução": "Ex: Cheque nº 000123 do BCI no valor de 50 000 MT",
  "Depósito Caução": "Ex: Depósito de 20 000 MT na conta da instituição",
  Outro: "Descreva a garantia em detalhe",
};

const Campo = ({ icon: Icon, label, erro, children, full, extra }) => (
  <div className={`cli-field${full ? " full" : ""}`}>
    <label>{Icon ? <Icon size={15} /> : null}{label}{extra}</label>
    {children}
    {erro ? <small>{erro}</small> : null}
  </div>
);

const Dado = ({ icon: Icon, rotulo, valor, tom }) => (
  <div className={`pag-dado${tom ? ` is-${tom}` : ""}`}>
    <span className="pag-dado-icone"><Icon size={16} /></span>
    <span>
      <small>{rotulo}</small>
      <strong>{valor}</strong>
    </span>
  </div>
);

const GarantiaFormulario = () => {
  const navigate = useNavigate();
  const [parametros] = useSearchParams();
  const { usuario } = useContext(AuthContext);
  const emprestimos = useMemo(() => emprestimosParaGarantia(), []);
  const [form, setForm] = useState(() => {
    const pedido = parametros.get("emprestimo") || "";
    return inicial(emprestimos.some((e) => String(e.id) === pedido) ? pedido : "");
  });
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState("");
  const [aGravar, setAGravar] = useState(false);

  const set = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));
  const setDoc = (campo, valor) => setForm((atual) => ({ ...atual, documentos_anexos: { ...atual.documentos_anexos, [campo]: valor } }));
  const setAvalista = (indice, campo, valor) =>
    setForm((atual) => ({ ...atual, avalistas: atual.avalistas.map((a, i) => (i === indice ? { ...a, [campo]: valor } : a)) }));

  const emprestimo = emprestimos.find((e) => String(e.id) === String(form.loan_id));
  const existentes = useMemo(() => (emprestimo ? garantiasDoEmprestimo(emprestimo.id).filter((g) => !["Cancelada", "Libertada", "Executada"].includes(g.status)) : []), [emprestimo]);
  const tipo = form.tipo_garantia;
  const bem = eBem(tipo);
  const valorGarantia = Number(form.valor_avaliado) || Number(form.valor_estimado) || 0;
  const cobertura = emprestimo?.valor_emprestado ? (valorGarantia / emprestimo.valor_emprestado) * 100 : 0;
  const falta = tipo ? documentosEmFalta(form) : [];
  const erroAval = (i, campo) => erros[`avalistas.${i}.${campo}`];

  const escolherTipo = (id) => {
    setForm((atual) => ({ ...atual, tipo_garantia: id, subtipo_garantia: eBem(id) && SUBTIPOS[id].includes(atual.subtipo_garantia) ? atual.subtipo_garantia : "" }));
    setErros((e) => ({ ...e, tipo_garantia: undefined }));
  };

  const salvar = async (evento) => {
    evento.preventDefault();
    if (aGravar) return;
    const falhas = validarGarantia(form);
    setErros(falhas);
    if (Object.keys(falhas).length) {
      setAviso("Reveja os campos assinalados.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setAviso("");
    setAGravar(true);
    try {
      const [titulo, factura, outros, fotos] = await Promise.all([
        guardarLista(tipo === BEM_IMOVEL ? form.documentos_anexos.titulo : []),
        guardarLista(tipo === BEM_MOVEL ? form.documentos_anexos.factura : []),
        guardarLista(form.documentos_anexos.outros),
        guardarLista(bem ? form.fotos_garantia : []),
      ]);
      const avalistas = tipo === AVAL
        ? await Promise.all(form.avalistas.map(async (a) => ({ ...a, documentos_anexos: await guardarLista(a.documentos_anexos) })))
        : [];
      const garantia = criarGarantia({ ...form, documentos_anexos: { titulo, factura, outros }, fotos_garantia: fotos, avalistas }, usuario);
      navigate(`/microcredito/dashboard/garantias/criada/${garantia.id}`);
    } catch (erro) {
      setAviso(erro.message || "Não foi possível guardar a garantia.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setAGravar(false);
    }
  };

  const tomCobertura = cobertura >= REGRAS_GARANTIA.coberturaRecomendada ? "is-optima" : cobertura >= REGRAS_GARANTIA.coberturaMinima ? "is-boa" : "is-fraca";
  const escala = Math.max(150, cobertura);

  return (
    <form className="cli-page" onSubmit={salvar}>
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><ShieldPlus size={16} /> Nova garantia</span>
          <span className="cli-pill cli-pill-caminho">
            <LayoutDashboard size={16} /> Dashboard
            <ChevronRight size={14} />
            <Shield size={16} /> Garantias
            <ChevronRight size={14} />
            <ShieldPlus size={16} /> Nova
          </span>
        </div>
      </header>
      {aviso ? <p className="cli-erro emp-aviso"><AlertTriangle size={15} /> {aviso}</p> : null}

      <div className="cli-form-entrada">
        <section className="cli-section">
          <h2><FileText size={18} /> Empréstimo associado</h2>
          <div className="cli-grid">
            <Campo icon={FileText} label="Seleccionar empréstimo *" erro={erros.loan_id} full>
              <PesquisaEmprestimo
                emprestimos={emprestimos}
                valor={form.loan_id}
                onChange={(id) => set("loan_id", id)}
                rotuloValor="Valor"
                valorDe={(e) => e.valor_emprestado}
                vazio="Não há empréstimos pendentes ou activos."
              />
            </Campo>
          </div>
          {emprestimo ? (
            <>
              <div className="pag-dados">
                <Dado icon={Hash} rotulo="Nº Contrato" valor={emprestimo.numero_contrato} />
                <Dado icon={User} rotulo="Nome do Cliente" valor={emprestimo.cliente?.nome_completo || "—"} />
                <Dado icon={CircleDollarSign} rotulo="Valor do Empréstimo" valor={formatarMT(emprestimo.valor_emprestado)} />
                <Dado icon={Wallet} rotulo="Saldo Devedor" valor={formatarMT(emprestimo.resumo.saldo)} tom="verde" />
              </div>
              {Number(emprestimo.valor_emprestado) > REGRAS_GARANTIA.obrigatoriaAcima ? (
                <p className="emp-nota gar-nota-alerta"><AlertTriangle size={15} /> Acima de {formatarMT(REGRAS_GARANTIA.obrigatoriaAcima)}: a garantia é obrigatória e deve valer pelo menos {formatarMT(emprestimo.valor_emprestado)}.</p>
              ) : null}
              {existentes.length ? (
                <p className="emp-nota"><Shield size={15} /> Já associadas: {existentes.map((g) => `${g.codigo_garantia} (${g.tipo_garantia}, ${g.status})`).join(" · ")}</p>
              ) : null}
            </>
          ) : null}
        </section>

        <section className="cli-section">
          <h2><Shield size={18} /> Tipo de garantia</h2>
          <div className="gar-tipos">
            {TIPOS_GARANTIA.map((t, i) => {
              const Icone = ICONES_TIPO_GARANTIA[t.id];
              const activo = tipo === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={activo}
                  className={`gar-tipo${activo ? " is-active" : ""}${tipo && !activo ? " is-inactivo" : ""}`}
                  style={{ animationDelay: `${i * 50}ms`, "--tipo-cor": CORES_TIPO_GARANTIA[t.id] }}
                  onClick={() => escolherTipo(t.id)}
                >
                  <span className="gar-tipo-brilho" aria-hidden="true" />
                  <span className="gar-tipo-topo">
                    <span className="gar-tipo-icone"><Icone size={24} /></span>
                    <span className="gar-tipo-check"><CheckCircle2 size={18} /></span>
                  </span>
                  <strong>{t.label}</strong>
                  <small>{t.detalhe}</small>
                  <span className="gar-tipo-etiqueta">{ETIQUETAS_TIPO_GARANTIA[t.id]}</span>
                </button>
              );
            })}
          </div>
          {erros.tipo_garantia ? <small className="cli-erro">{erros.tipo_garantia}</small> : null}

          {tipo ? (
            <div className="gar-bloco">
              {bem ? (
                <div className="cli-field full">
                  <label><Sparkles size={15} /> Subtipo de garantia *</label>
                  <div className="gar-subtipos">
                    {SUBTIPOS[tipo].map((s) => {
                      const Icone = ICONES_SUBTIPO[s];
                      return (
                        <button key={s} type="button" className={`gar-subtipo${form.subtipo_garantia === s ? " is-active" : ""}`} onClick={() => set("subtipo_garantia", s)}>
                          <Icone size={17} /> {s}
                        </button>
                      );
                    })}
                  </div>
                  {erros.subtipo_garantia ? <small>{erros.subtipo_garantia}</small> : null}
                </div>
              ) : null}
              <div className="cli-grid">
                <Campo icon={FileText} label="Descrição da garantia *" erro={erros.descricao} full>
                  <textarea rows={3} maxLength={2000} value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder={PLACEHOLDERS[tipo]} />
                </Campo>
                {bem ? (
                  <>
                    <Campo icon={Heart} label="Estado de conservação *" erro={erros.estado_conservacao}>
                      <MenuSuspenso valor={form.estado_conservacao} opcoes={[{ id: "", label: "Seleccione" }, ...ESTADOS_CONSERVACAO.map((e) => ({ id: e, label: e }))]} onChange={(v) => set("estado_conservacao", v)} />
                    </Campo>
                    <Campo icon={MapPin} label="Localização da garantia *" erro={erros.localizacao_garantia}>
                      <input value={form.localizacao_garantia} maxLength={255} onChange={(e) => set("localizacao_garantia", e.target.value)} placeholder="Onde o bem está localizado" />
                    </Campo>
                  </>
                ) : null}
              </div>
              {tipo === SEM_GARANTIA_G ? (
                <p className="emp-nota"><Circle size={15} /> Crédito pessoal sem bem ou avalista. Não serve para empréstimos acima de {formatarMT(REGRAS_GARANTIA.obrigatoriaAcima)}.</p>
              ) : null}
            </div>
          ) : null}
        </section>

        {tipo && tipo !== SEM_GARANTIA_G ? (
          <section className="cli-section">
            <h2><Scale size={18} /> Avaliação da garantia</h2>
            <div className="cli-grid">
              <Campo icon={CircleDollarSign} label="Valor estimado (MT) *" erro={erros.valor_estimado}>
                <input inputMode="decimal" value={form.valor_estimado} onChange={(e) => set("valor_estimado", soMontante(e.target.value))} placeholder="0.00" />
              </Campo>
              <Campo icon={BadgeCheck} label="Valor avaliado (MT)" erro={erros.valor_avaliado}>
                <input inputMode="decimal" value={form.valor_avaliado} onChange={(e) => set("valor_avaliado", soMontante(e.target.value))} placeholder="Após avaliação formal" />
              </Campo>
              <Campo icon={CalendarDays} label="Data da avaliação" erro={erros.data_avaliacao}>
                <input type="date" className="emp-data" max={hojeIso()} value={form.data_avaliacao} onChange={(e) => set("data_avaliacao", e.target.value)} />
              </Campo>
              <Campo icon={ClipboardCheck} label="Avaliador" erro={erros.avaliador}>
                <input value={form.avaliador} maxLength={100} onChange={(e) => set("avaliador", e.target.value)} placeholder="Nome do avaliador responsável" />
              </Campo>
            </div>
            {emprestimo && valorGarantia > 0 ? (
              <div className={`gar-cobertura ${tomCobertura}`}>
                <div className="gar-cobertura-topo">
                  <span><Scale size={15} /> Cobertura do empréstimo</span>
                  <strong>{cobertura.toFixed(0)}%</strong>
                </div>
                <div className="gar-cobertura-barra">
                  <i style={{ width: `${Math.min(100, (cobertura / escala) * 100)}%` }} />
                  <b style={{ left: `${(REGRAS_GARANTIA.coberturaMinima / escala) * 100}%` }} data-rotulo="100%" />
                  <b style={{ left: `${(REGRAS_GARANTIA.coberturaRecomendada / escala) * 100}%` }} data-rotulo="120%" />
                </div>
                <small>
                  {formatarMT(valorGarantia)} para {formatarMT(emprestimo.valor_emprestado)}.{" "}
                  {cobertura >= REGRAS_GARANTIA.coberturaRecomendada ? "Cobertura recomendada atingida." : cobertura >= REGRAS_GARANTIA.coberturaMinima ? `Mínimo atingido; recomendado ${REGRAS_GARANTIA.coberturaRecomendada}%.` : `Abaixo do mínimo de ${REGRAS_GARANTIA.coberturaMinima}%.`}
                </small>
              </div>
            ) : null}
            {bem ? <p className="emp-nota"><ClipboardCheck size={15} /> Bens móveis e imóveis só são aprovados com avaliação formal (valor avaliado, data e avaliador).</p> : null}
          </section>
        ) : null}

        {tipo === AVAL ? (
          <section className="cli-section">
            <h2><Users size={18} /> Avalistas / Fiadores</h2>
            {erros.avalistas ? <small className="cli-erro">{erros.avalistas}</small> : null}
            <div className="gar-avalistas">
              {form.avalistas.map((a, i) => (
                <div key={a.chave} className="gar-avalista">
                  <div className="gar-avalista-topo">
                    <span className="gar-avalista-num">{i + 1}</span>
                    <strong>{a.nome_completo || `Avalista ${i + 1}`}</strong>
                    {form.avalistas.length > 1 ? (
                      <button type="button" className="gar-remover" onClick={() => set("avalistas", form.avalistas.filter((_, k) => k !== i))}><Trash2 size={14} /> Remover</button>
                    ) : null}
                  </div>
                  <div className="cli-grid">
                    <Campo icon={User} label="Nome completo *" erro={erroAval(i, "nome_completo")}>
                      <input value={a.nome_completo} maxLength={200} onChange={(e) => setAvalista(i, "nome_completo", e.target.value)} placeholder="Nome do avalista" />
                    </Campo>
                    <Campo icon={IdCard} label="Documento *" erro={erroAval(i, "documento_numero") || erroAval(i, "documento_tipo")}>
                      <div className="gar-documento">
                        <MenuSuspenso valor={a.documento_tipo} opcoes={DOCUMENTOS_AVALISTA.map((d) => ({ id: d, label: d }))} onChange={(v) => setAvalista(i, "documento_tipo", v)} />
                        <input value={a.documento_numero} maxLength={20} onChange={(e) => setAvalista(i, "documento_numero", e.target.value.toUpperCase())} placeholder={a.documento_tipo === "BI" ? "000000000A" : a.documento_tipo === "NUIT" ? "000000000" : "Nº do passaporte"} />
                      </div>
                    </Campo>
                    <Campo icon={Phone} label="Telefone principal *" erro={erroAval(i, "telefone_principal")}>
                      <input inputMode="tel" value={a.telefone_principal} maxLength={13} onChange={(e) => setAvalista(i, "telefone_principal", e.target.value.replace(/[^\d+]/g, ""))} placeholder="84xxxxxxx" />
                    </Campo>
                    <Campo icon={Phone} label="Telefone alternativo" erro={erroAval(i, "telefone_alternativo")}>
                      <input inputMode="tel" value={a.telefone_alternativo} maxLength={13} onChange={(e) => setAvalista(i, "telefone_alternativo", e.target.value.replace(/[^\d+]/g, ""))} placeholder="82xxxxxxx" />
                    </Campo>
                    <Campo icon={Mail} label="Email" erro={erroAval(i, "email")}>
                      <input type="email" value={a.email} maxLength={100} onChange={(e) => setAvalista(i, "email", e.target.value)} placeholder="email@exemplo.com" />
                    </Campo>
                    <Campo icon={MapPin} label="Endereço completo *" erro={erroAval(i, "endereco_completo")}>
                      <input value={a.endereco_completo} maxLength={255} onChange={(e) => setAvalista(i, "endereco_completo", e.target.value)} placeholder="Endereço do avalista" />
                    </Campo>
                    <Campo icon={Briefcase} label="Profissão">
                      <input value={a.profissao} maxLength={100} onChange={(e) => setAvalista(i, "profissao", e.target.value)} placeholder="Profissão" />
                    </Campo>
                    <Campo icon={CircleDollarSign} label="Rendimento mensal (MT)" erro={erroAval(i, "rendimento_mensal")}>
                      <input inputMode="decimal" value={a.rendimento_mensal} onChange={(e) => setAvalista(i, "rendimento_mensal", soMontante(e.target.value))} placeholder="0.00" />
                    </Campo>
                    <Campo icon={Heart} label="Relação com o cliente">
                      <input value={a.relacao_com_cliente} maxLength={100} onChange={(e) => setAvalista(i, "relacao_com_cliente", e.target.value)} placeholder="Ex: Pai, Irmão, Amigo" />
                    </Campo>
                  </div>
                  <UploadFicheiros
                    rotulo="Documentos do avalista (BI, comprovativo de rendimento)"
                    icone={IdCard}
                    obrigatorio
                    max={5}
                    valor={a.documentos_anexos}
                    onChange={(v) => setAvalista(i, "documentos_anexos", v)}
                    onErro={setAviso}
                  />
                </div>
              ))}
            </div>
            <button type="button" className="gar-adicionar" onClick={() => set("avalistas", [...form.avalistas, avalistaVazio()])}>
              <UserPlus size={16} /> Adicionar outro avalista
            </button>
          </section>
        ) : null}

        {tipo ? (
          <section className="cli-section">
            <h2><Paperclip size={18} /> Documentos anexos</h2>
            <div className="gar-uploads">
              {tipo === BEM_IMOVEL ? (
                <UploadFicheiros rotulo="Título de propriedade" icone={FileBadge} obrigatorio max={3} valor={form.documentos_anexos.titulo} onChange={(v) => setDoc("titulo", v)} onErro={setAviso} />
              ) : null}
              {tipo === BEM_MOVEL ? (
                <UploadFicheiros rotulo="Factura/Recibo" icone={Receipt} obrigatorio max={3} valor={form.documentos_anexos.factura} onChange={(v) => setDoc("factura", v)} onErro={setAviso} />
              ) : null}
              {bem ? (
                <UploadFicheiros rotulo="Fotos da garantia" icone={Camera} fotos obrigatorio max={REGRAS_GARANTIA.maxFotos} valor={form.fotos_garantia} onChange={(v) => set("fotos_garantia", v)} onErro={setAviso} />
              ) : null}
              <UploadFicheiros rotulo="Outros documentos" icone={Paperclip} max={5} valor={form.documentos_anexos.outros} onChange={(v) => setDoc("outros", v)} onErro={setAviso} />
            </div>
            {tipo === AVAL ? <p className="emp-nota"><IdCard size={15} /> Os documentos de cada avalista são carregados no cartão do respectivo avalista.</p> : null}
            <ul className="gar-checklist">
              {falta.length ? falta.map((f) => <li key={f} className="is-falta"><X size={13} /> {f}</li>) : <li className="is-ok"><CheckCircle2 size={13} /> Documentação obrigatória completa</li>}
            </ul>
            {erros.documentos ? <small className="cli-erro">{erros.documentos}</small> : null}
          </section>
        ) : null}

        <section className="cli-section">
          <h2><StickyNote size={18} /> Observações</h2>
          <Campo icon={StickyNote} label="Observações" erro={erros.observacoes} full extra={<span className="pag-contador">{form.observacoes.length}/5000</span>}>
            <textarea rows={3} maxLength={5000} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Informações adicionais sobre a garantia" />
          </Campo>
        </section>

        <div className="cli-actions">
          <button type="button" className="cli-btn-voltar" onClick={() => navigate("/microcredito/dashboard/garantias")}><X size={16} /> Cancelar</button>
          <button type="submit" className="cli-btn-novo" disabled={aGravar}>
            {aGravar ? <Loader2 size={16} className="emp-girar" /> : <Save size={16} />} {aGravar ? "A guardar..." : "Guardar garantia"}
          </button>
        </div>
      </div>

    </form>
  );
};

export default GarantiaFormulario;
