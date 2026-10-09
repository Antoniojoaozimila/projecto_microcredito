import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  User, Building2, Calendar, Users, Heart, IdCard, FileDigit, Phone, Mail,
  MapPin, Home, Landmark, Navigation, Wallet, Gauge, ShieldCheck, AlertTriangle,
  Paperclip, StickyNote, Save, X, Camera, UserPlus, LayoutDashboard, ChevronRight,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import {
  PERFIS, scoreDoPerfil, obterCliente, guardarCliente, documentoExiste,
} from "../../services/clientesMicrocredito";
import { LOCALIDADES, cidadeSeleccionada, corresponderCidade, corresponderProvincia } from "../../data/mocambiqueLocalidades";
import { REGRAS } from "../../services/emprestimosMicrocredito";
import MenuSuspenso from "./MenuSuspenso";
import FotoPerfil from "./FotoPerfil";
import { guardarMapa, prepararFoto } from "../../services/anexosLocais";
import "./ClienteModulo.css";

const vazio = {
  tipo_cliente: "",
  nome_completo: "",
  data_nascimento: "",
  genero: "",
  estado_civil: "",
  documento_tipo: "BI",
  documento_tipo_outro: "",
  documento_numero: "",
  documento_validade: "",
  nuit: "",
  telefone_principal: "",
  telefone_alternativo: "",
  email: "",
  endereco_completo: "",
  zona_id: "",
  zona_outra: "",
  bairro: "",
  bairro_outro: "",
  cidade: "",
  cidade_outra: "",
  provincia: "",
  coordenadas_gps: "",
  limite_credito: "0",
  perfil_risco: "B",
  cliente_ativo: true,
  contacto_emergencia_nome: "",
  contacto_emergencia_telefone: "",
  contacto_emergencia_parentesco: "",
  parentesco_outro: "",
  observacoes: "",
  foto_perfil: null,
  documentos_anexos: {},
};

const telefoneOk = (valor) => /^(\+258)?8[2-7]\d{7}$/.test(String(valor || "").replace(/\s/g, ""));
const soDigitos = (valor) => String(valor || "").replace(/\D/g, "");
const soTelefone = (valor) => {
  const limpo = String(valor || "").replace(/[^\d+]/g, "");
  return limpo.startsWith("+") ? `+${limpo.slice(1).replace(/\+/g, "")}` : limpo.replace(/\+/g, "");
};
const soMontante = (valor) => {
  const limpo = String(valor || "").replace(/[^\d.,]/g, "").replace(",", ".");
  const [inteiro, ...resto] = limpo.split(".");
  return resto.length ? `${inteiro}.${resto.join("").replace(/\./g, "")}` : inteiro;
};
const opcoesDe = (lista, vazioLabel = "Seleccione") => [{ id: "", label: vazioLabel }, ...lista.map((item) => ({ id: item, label: item })), { id: "__outro", label: "Outro" }];
const idade = (iso) => {
  if (!iso) return 0;
  const n = new Date(iso);
  const hoje = new Date();
  let anos = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) anos -= 1;
  return anos;
};

const lerFicheiro = (ficheiro, maxMb) =>
  new Promise((resolve, reject) => {
    if (!ficheiro) return resolve(null);
    if (ficheiro.size > maxMb * 1024 * 1024) {
      reject(new Error(`O ficheiro excede ${maxMb}MB.`));
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => resolve({ nome: ficheiro.name, tipo: ficheiro.type, conteudo: leitor.result });
    leitor.onerror = () => reject(new Error("Não foi possível ler o ficheiro."));
    leitor.readAsDataURL(ficheiro);
  });

const Campo = ({ icon: Icon, label, erro, children, full }) => (
  <div className={`cli-field${full ? " full" : ""}`}>
    <label>{Icon ? <Icon size={15} /> : null}{label}</label>
    {children}
    {erro ? <small>{erro}</small> : null}
  </div>
);

const ClienteFormulario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useContext(AuthContext);
  const existente = useMemo(() => (id ? obterCliente(id) : null), [id]);
  const [form, setForm] = useState(() => (
    existente
      ? { ...vazio, ...existente, zona_id: String(existente.zona_id || "") }
      : { ...vazio, tipo_cliente: "" }
  ));
  const [tipoEscolhido, setTipoEscolhido] = useState(() => Boolean(id && existente?.tipo_cliente));
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState("");
  const [gpsActivo, setGpsActivo] = useState(false);
  const gpsManual = useRef(false);
  const relogioGps = useRef(null);

  const set = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));
  const fisica = form.tipo_cliente === "Pessoa Física";

  const validar = () => {
    const e = {};
    if (form.nome_completo.trim().length < 3 || form.nome_completo.trim().length > 200) e.nome_completo = "Use entre 3 e 200 caracteres.";
    if (fisica && !form.data_nascimento) e.data_nascimento = "Obrigatório para pessoa física.";
    if (fisica && form.data_nascimento && idade(form.data_nascimento) < REGRAS.idadeMinima) e.data_nascimento = `A idade mínima é ${REGRAS.idadeMinima} anos.`;
    if (fisica && form.data_nascimento && idade(form.data_nascimento) > REGRAS.idadeMaxima) e.data_nascimento = `A idade máxima é ${REGRAS.idadeMaxima} anos.`;
    if (!form.documento_numero.trim()) e.documento_numero = "Indique o número do documento.";
    if (form.documento_tipo === "Outros" && !form.documento_tipo_outro.trim()) e.documento_tipo_outro = "Indique o tipo de documento.";
    if (form.documento_tipo === "BI" && !/^\d{9}[A-Za-z]$|^\d{12}[A-Za-z]$/.test(form.documento_numero.trim())) e.documento_numero = "O BI deve ter 9 ou 12 dígitos e uma letra. Ex.: 000000000A ou 000000000000E.";
    if (documentoExiste(form.documento_numero, form.id)) e.documento_numero = "Este documento já está registado.";
    if (form.documento_validade && form.documento_validade <= new Date().toISOString().slice(0, 10)) e.documento_validade = "A validade deve ser uma data futura.";
    if (!fisica && !/^\d{9}$/.test(form.nuit.trim())) e.nuit = "O NUIT da empresa deve ter 9 dígitos.";
    if (form.nuit && !/^\d{9}$/.test(form.nuit.trim())) e.nuit = "O NUIT deve ter 9 dígitos.";
    if (!telefoneOk(form.telefone_principal)) e.telefone_principal = "Use 84xxxxxxx ou +25884xxxxxxx.";
    if (form.telefone_alternativo && !telefoneOk(form.telefone_alternativo)) e.telefone_alternativo = "Telefone alternativo inválido.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email inválido.";
    if (!form.endereco_completo.trim()) e.endereco_completo = "Indique o endereço.";
    if (!form.zona_id || (form.zona_id === "__outro" && !form.zona_outra?.trim())) e.zona_id = "Seleccione a zona.";
    if (!form.cidade.trim() || (form.cidade === "__outro" && !form.cidade_outra?.trim())) e.cidade = "Indique a cidade.";
    if (!form.provincia) e.provincia = "Seleccione a província.";
    const limite = Number(form.limite_credito);
    if (!Number.isFinite(limite) || limite < 0 || limite > 1000000) e.limite_credito = "Entre 0 e 1.000.000 MT.";
    if (!form.perfil_risco) e.perfil_risco = "Seleccione o perfil.";
    if (form.contacto_emergencia_telefone && !telefoneOk(form.contacto_emergencia_telefone)) e.contacto_emergencia_telefone = "Telefone inválido.";
    if (form.contacto_emergencia_parentesco === "__outro" && !form.parentesco_outro.trim()) e.parentesco_outro = "Indique o parentesco.";
    if ((form.observacoes || "").length > 5000) e.observacoes = "Máximo de 5000 caracteres.";
    if (!id && !form.documentos_anexos?.bi) e.bi = "A cópia do BI ou passaporte é obrigatória.";
    return e;
  };

  const anexar = async (chave, ficheiro, maxMb) => {
    setAviso("");
    try {
      const arquivo = await lerFicheiro(ficheiro, maxMb);
      set("documentos_anexos", { ...form.documentos_anexos, [chave]: arquivo });
    } catch (erro) {
      setAviso(erro.message);
    }
  };

  const aplicarGps = async (coords, forcar) => {
    const lat = coords.latitude.toFixed(6);
    const lon = coords.longitude.toFixed(6);
    if (gpsManual.current && !forcar) {
      set("coordenadas_gps", `${lat}, ${lon}`);
      return;
    }
    try {
      const resposta = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=pt`);
      const dados = await resposta.json();
      const endereco = dados.address || {};
      const provinciaGps = corresponderProvincia(endereco.state || endereco.city || "");
      const cidadeGps = corresponderCidade(provinciaGps, endereco.city || endereco.town || endereco.municipality || endereco.village || "");
      const bairroGps = endereco.suburb || endereco.neighbourhood || endereco.quarter || "";
      setForm((atual) => ({
        ...atual,
        coordenadas_gps: `${lat}, ${lon}`,
        endereco_completo: forcar || !atual.endereco_completo ? (dados.display_name || atual.endereco_completo) : atual.endereco_completo,
        provincia: provinciaGps || atual.provincia,
        cidade: cidadeGps || atual.cidade,
        bairro: bairroGps || atual.bairro,
      }));
    } catch {
      set("coordenadas_gps", `${lat}, ${lon}`);
    }
  };

  const pedirPosicao = (altaPrecisao) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: altaPrecisao,
        timeout: 20000,
        maximumAge: 0,
      });
    });

  const alternarGps = async () => {
    if (!window.isSecureContext || !navigator.geolocation) {
      setAviso("O GPS só funciona em localhost ou numa ligação segura (https).");
      return;
    }
    if (gpsActivo) {
      if (relogioGps.current) navigator.geolocation.clearWatch(relogioGps.current);
      relogioGps.current = null;
      setGpsActivo(false);
      return;
    }
    gpsManual.current = false;
    setAviso("A obter a localização… permita o acesso se o navegador pedir.");
    setGpsActivo(true);
    try {
      let posicao;
      try {
        posicao = await pedirPosicao(true);
      } catch {
        posicao = await pedirPosicao(false);
      }
      await aplicarGps(posicao.coords, true);
      setAviso("");
      relogioGps.current = navigator.geolocation.watchPosition(
        (pos) => aplicarGps(pos.coords, false),
        () => {},
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 5000 }
      );
    } catch (erro) {
      setGpsActivo(false);
      if (erro?.code === 1) setAviso("Permita a localização neste site para usar o GPS.");
      else setAviso("Não foi possível capturar a localização. Active a localização do Windows e tente de novo.");
    }
  };

  useEffect(() => () => {
    if (relogioGps.current) navigator.geolocation.clearWatch(relogioGps.current);
  }, []);

  const local = cidadeSeleccionada(form.provincia, form.cidade);
  const cidades = LOCALIDADES.find((p) => p.provincia === form.provincia)?.cidades || [];

  const escolherTipo = (tipo) => {
    setTipoEscolhido(true);
    setErros({});
    setAviso("");
    set("tipo_cliente", tipo);
  };

  const salvar = async (evento) => {
    evento.preventDefault();
    if (!tipoEscolhido) return;
    const falhas = validar();
    setErros(falhas);
    if (Object.keys(falhas).length) return;
    let gravado;
    try {
      const [documentos_anexos, foto_perfil] = await Promise.all([guardarMapa(form.documentos_anexos), prepararFoto(form.foto_perfil)]);
      gravado = guardarCliente(
        {
          ...form,
          documentos_anexos,
          foto_perfil,
          zona_id: form.zona_id === "__outro" ? form.zona_outra.trim() : form.zona_id,
          bairro: form.bairro === "__outro" ? form.bairro_outro.trim() : form.bairro,
          cidade: form.cidade === "__outro" ? form.cidade_outra.trim() : form.cidade,
          documento_tipo: form.documento_tipo === "Outros" ? form.documento_tipo_outro.trim() : form.documento_tipo,
          contacto_emergencia_parentesco: form.contacto_emergencia_parentesco === "__outro" ? form.parentesco_outro.trim() : form.contacto_emergencia_parentesco,
          limite_credito: Number(form.limite_credito),
          score: scoreDoPerfil(form.perfil_risco),
          cliente_ativo: Boolean(form.cliente_ativo),
        },
        usuario
      );
    } catch (erro) {
      setAviso(erro.message || "Não foi possível gravar o cliente.");
      return;
    }
    navigate("/microcredito/dashboard/clientes", { state: { sucesso: id ? "Cliente actualizado com sucesso." : "Cliente criado com sucesso.", id: gravado.id } });
  };

  return (
    <form className="cli-page" onSubmit={salvar}>
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><UserPlus size={16} /> {id ? "Editar cliente" : "Novo cliente"}</span>
          <span className="cli-pill cli-pill-caminho">
            <LayoutDashboard size={16} /> Dashboard
            <ChevronRight size={14} />
            <Users size={16} /> Clientes
            <ChevronRight size={14} />
            <UserPlus size={16} /> {id ? "Editar" : "Novo cliente"}
          </span>
        </div>
      </header>
      {aviso ? <p className="cli-erro">{aviso}</p> : null}

      <section className="cli-section">
        <h2><User size={18} /> Tipo de cliente</h2>
        <div className="cli-tipos">
          {[
            { id: "Pessoa Física", titulo: "Pessoa Física (Individual)", texto: "Cliente singular, com documento e data de nascimento.", icon: User },
            { id: "Pessoa Jurídica", titulo: "Pessoa Jurídica (Empresa)", texto: "Empresa, com NUIT obrigatório.", icon: Building2 },
          ].map((opcao) => {
            const Icone = opcao.icon;
            const activo = form.tipo_cliente === opcao.id;
            return (
              <button
                key={opcao.id}
                type="button"
                className={`cli-tipo${activo ? " is-active" : ""}`}
                onClick={() => escolherTipo(opcao.id)}
              >
                <span className="cli-tipo-icone"><Icone size={22} /></span>
                <span>
                  <strong>{opcao.titulo}</strong>
                  <small>{opcao.texto}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {tipoEscolhido && form.tipo_cliente ? (
      <div className="cli-form-entrada" key={form.tipo_cliente}>
      <section className="cli-section">
        <h2><User size={18} /> Informações básicas</h2>
        <div className="cli-grid">
          <Campo icon={Camera} label={fisica ? "Foto de perfil (opcional)" : "Logótipo / foto (opcional)"} full>
            <FotoPerfil cliente={form} valor={form.foto_perfil} onChange={(foto) => set("foto_perfil", foto)} onErro={setAviso} />
          </Campo>
          <Campo icon={User} label="Nome completo *" erro={erros.nome_completo} full>
            <input value={form.nome_completo} maxLength={200} onChange={(e) => set("nome_completo", e.target.value)} placeholder="Digite o nome completo" />
          </Campo>
          {fisica && (
            <Campo icon={Calendar} label="Data de nascimento *" erro={erros.data_nascimento}>
              <input type="date" value={form.data_nascimento || ""} onChange={(e) => set("data_nascimento", e.target.value)} />
            </Campo>
          )}
          <Campo icon={Users} label="Género">
            <MenuSuspenso valor={form.genero} onChange={(valor) => set("genero", valor)} opcoes={opcoesDe(["Masculino", "Feminino", "Outro"]).slice(0, -1)} />
          </Campo>
          <Campo icon={Heart} label="Estado civil">
            <MenuSuspenso valor={form.estado_civil} onChange={(valor) => set("estado_civil", valor)} opcoes={opcoesDe(["Solteiro", "Casado", "Divorciado", "Viúvo", "Viúva"]).slice(0, -1)} />
          </Campo>
          <Campo icon={IdCard} label="Tipo de documento *">
            <MenuSuspenso valor={form.documento_tipo} onChange={(valor) => set("documento_tipo", valor)} opcoes={["BI", "Passaporte", "NUIT", "DIRE", "Outros"].map((item) => ({ id: item, label: item }))} />
          </Campo>
          {form.documento_tipo === "Outros" ? (
            <Campo icon={IdCard} label="Outro documento *" erro={erros.documento_tipo_outro}>
              <input value={form.documento_tipo_outro} maxLength={50} onChange={(e) => set("documento_tipo_outro", e.target.value)} placeholder="Escreva o tipo de documento" />
            </Campo>
          ) : null}
          <Campo icon={FileDigit} label="Número do documento *" erro={erros.documento_numero}>
            <input value={form.documento_numero} maxLength={50} onChange={(e) => set("documento_numero", e.target.value)} placeholder="000000000000E" />
          </Campo>
          <Campo icon={Calendar} label="Validade do documento" erro={erros.documento_validade}>
            <input type="date" value={form.documento_validade || ""} onChange={(e) => set("documento_validade", e.target.value)} />
          </Campo>
          <Campo icon={FileDigit} label={fisica ? "NUIT" : "NUIT *"} erro={erros.nuit}>
            <input inputMode="numeric" value={form.nuit} maxLength={9} onChange={(e) => set("nuit", soDigitos(e.target.value).slice(0, 9))} placeholder="000000000" />
          </Campo>
        </div>
      </section>

      <section className="cli-section">
        <h2><Phone size={18} /> Contactos</h2>
        <div className="cli-grid">
          <Campo icon={Phone} label="Telefone principal *" erro={erros.telefone_principal}>
            <input inputMode="tel" value={form.telefone_principal} onChange={(e) => set("telefone_principal", soTelefone(e.target.value))} placeholder="84xxxxxxx" />
          </Campo>
          <Campo icon={Phone} label="Telefone alternativo" erro={erros.telefone_alternativo}>
            <input inputMode="tel" value={form.telefone_alternativo} onChange={(e) => set("telefone_alternativo", soTelefone(e.target.value))} placeholder="82xxxxxxx" />
          </Campo>
          <Campo icon={Mail} label="Email" erro={erros.email} full>
            <input type="email" value={form.email} maxLength={100} onChange={(e) => set("email", e.target.value)} placeholder="cliente@email.com" />
          </Campo>
        </div>
      </section>

      <section className="cli-section">
        <h2><MapPin size={18} /> Localização</h2>
        <div className="cli-grid">
          <Campo icon={Home} label="Endereço completo *" erro={erros.endereco_completo} full>
            <input value={form.endereco_completo} onChange={(e) => { gpsManual.current = true; set("endereco_completo", e.target.value); }} placeholder="Av. Julius Nyerere, nº 123" />
          </Campo>
          <Campo icon={MapPin} label="Província *" erro={erros.provincia}>
            <MenuSuspenso
              pesquisavel
              valor={form.provincia}
              opcoes={[{ id: "", label: "Seleccione" }, ...LOCALIDADES.map((p) => ({ id: p.provincia, label: p.provincia }))]}
              onChange={(valor) => setForm((atual) => ({ ...atual, provincia: valor, cidade: "", cidade_outra: "", bairro: "", bairro_outro: "", zona_id: "", zona_outra: "" }))}
            />
          </Campo>
          <Campo icon={Landmark} label="Cidade *" erro={erros.cidade}>
            <MenuSuspenso
              pesquisavel
              valor={form.cidade}
              opcoes={opcoesDe(cidades.map((c) => c.nome), form.provincia ? "Seleccione a cidade" : "Escolha a província")}
              onChange={(valor) => setForm((atual) => ({ ...atual, cidade: valor, bairro: "", bairro_outro: "", zona_id: "", zona_outra: "" }))}
            />
          </Campo>
          {form.cidade === "__outro" ? (
            <Campo icon={Landmark} label="Outra cidade *">
              <input value={form.cidade_outra} maxLength={100} onChange={(e) => set("cidade_outra", e.target.value)} placeholder="Escreva a cidade" />
            </Campo>
          ) : null}
          <Campo icon={Home} label="Bairro">
            <MenuSuspenso
              pesquisavel
              valor={form.bairro}
              opcoes={opcoesDe(local?.bairros || [], form.cidade && form.cidade !== "__outro" ? "Seleccione o bairro" : "Escolha a cidade")}
              onChange={(valor) => set("bairro", valor)}
            />
          </Campo>
          {form.bairro === "__outro" ? (
            <Campo icon={Home} label="Outro bairro">
              <input value={form.bairro_outro} maxLength={100} onChange={(e) => set("bairro_outro", e.target.value)} placeholder="Escreva o bairro" />
            </Campo>
          ) : null}
          <Campo icon={MapPin} label="Zona / território *" erro={erros.zona_id}>
            <MenuSuspenso
              pesquisavel
              valor={form.zona_id}
              opcoes={opcoesDe(local?.zonas || [], form.cidade && form.cidade !== "__outro" ? "Seleccione a zona" : "Escolha a cidade")}
              onChange={(valor) => set("zona_id", valor)}
            />
          </Campo>
          {form.zona_id === "__outro" ? (
            <Campo icon={MapPin} label="Outra zona *" erro={erros.zona_id}>
              <input value={form.zona_outra} maxLength={100} onChange={(e) => set("zona_outra", e.target.value)} placeholder="Escreva a zona" />
            </Campo>
          ) : null}
          <Campo icon={Navigation} label="GPS em tempo real" full>
            <div className="cli-gps">
              <input value={form.coordenadas_gps} onChange={(e) => { gpsManual.current = true; set("coordenadas_gps", e.target.value); }} placeholder="Latitude, Longitude" />
              <button type="button" className={`cli-btn ghost${gpsActivo ? " is-on" : ""}`} onClick={alternarGps}>{gpsActivo ? "Parar GPS" : "Seguir GPS"}</button>
            </div>
          </Campo>
        </div>
      </section>

      <section className="cli-section">
        <h2><Wallet size={18} /> Perfil de crédito</h2>
        <div className="cli-grid">
          <Campo icon={Wallet} label="Limite de crédito (MT) *" erro={erros.limite_credito}>
            <input inputMode="decimal" value={form.limite_credito} onChange={(e) => set("limite_credito", soMontante(e.target.value))} />
          </Campo>
          <Campo icon={ShieldCheck} label="Perfil de risco *" erro={erros.perfil_risco}>
            <MenuSuspenso valor={form.perfil_risco} onChange={(valor) => set("perfil_risco", valor)} opcoes={PERFIS.map((p) => ({ id: p.id, label: p.rotulo }))} />
          </Campo>
          <Campo icon={Gauge} label="Score inicial">
            <input readOnly value={scoreDoPerfil(form.perfil_risco)} />
          </Campo>
          <div className="cli-field">
            <label><ShieldCheck size={15} /> Cliente activo</label>
            <label className="cli-switch">
              <input type="checkbox" checked={form.cliente_ativo} onChange={(e) => set("cliente_ativo", e.target.checked)} />
              {form.cliente_ativo ? "Activo" : "Inactivo"}
            </label>
          </div>
        </div>
      </section>

      <section className="cli-section">
        <h2><AlertTriangle size={18} /> Contacto de emergência</h2>
        <div className="cli-grid">
          <Campo icon={User} label="Nome do contacto">
            <input value={form.contacto_emergencia_nome} maxLength={100} onChange={(e) => set("contacto_emergencia_nome", e.target.value)} />
          </Campo>
          <Campo icon={Phone} label="Telefone" erro={erros.contacto_emergencia_telefone}>
            <input inputMode="tel" value={form.contacto_emergencia_telefone} onChange={(e) => set("contacto_emergencia_telefone", soTelefone(e.target.value))} placeholder="84xxxxxxx" />
          </Campo>
          <Campo icon={Heart} label="Parentesco">
            <MenuSuspenso valor={form.contacto_emergencia_parentesco} onChange={(valor) => set("contacto_emergencia_parentesco", valor)} opcoes={opcoesDe(["Cônjuge", "Irmão", "Irmã", "Pai", "Mãe", "Filho", "Filha", "Tio", "Tia"])} />
          </Campo>
          {form.contacto_emergencia_parentesco === "__outro" ? (
            <Campo icon={Heart} label="Outro parentesco" erro={erros.parentesco_outro}>
              <input value={form.parentesco_outro} maxLength={80} onChange={(e) => set("parentesco_outro", e.target.value)} placeholder="Escreva o parentesco" />
            </Campo>
          ) : null}
        </div>
      </section>

      <section className="cli-section">
        <h2><Paperclip size={18} /> Documentos anexos</h2>
        <div className="cli-grid">
          <Campo icon={IdCard} label="Cópia do BI / passaporte *" erro={erros.bi}>
            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => anexar("bi", e.target.files?.[0], 10)} />
          </Campo>
          <Campo icon={Home} label="Comprovativo de residência">
            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => anexar("residencia", e.target.files?.[0], 10)} />
          </Campo>
          <Campo icon={Wallet} label="Comprovativo de rendimento">
            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => anexar("rendimento", e.target.files?.[0], 10)} />
          </Campo>
        </div>
      </section>

      <section className="cli-section">
        <h2><StickyNote size={18} /> Observações</h2>
        <Campo icon={StickyNote} label="Observações" erro={erros.observacoes} full>
          <textarea rows={4} maxLength={5000} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
        </Campo>
      </section>

      <div className="cli-actions">
        <button type="button" className="cli-btn ghost" onClick={() => navigate("/microcredito/dashboard/clientes")}><X size={16} /> Cancelar</button>
        <button type="submit" className="cli-btn"><Save size={16} /> Salvar cliente</button>
      </div>
      </div>
      ) : null}
    </form>
  );
};

export default ClienteFormulario;
