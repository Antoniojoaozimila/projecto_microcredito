import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx-js-style";
import {
  ArrowDownUp,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  Gauge,
  IdCard,
  Landmark,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  Lock,
  ListOrdered,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { LOCALIDADES } from "../../data/mocambiqueLocalidades";
import { eliminarCliente, importarClientes, listarClientes } from "../../services/clientesMicrocredito";
import { pngDoLogo } from "../../services/logoDocumento";
import AvatarCliente from "./AvatarCliente";
import { tomPerfil, tomScore } from "./tonsChip";

const SENHA_ELIMINAR = "0000";
import "./ClienteModulo.css";

const POR_PAGINA = 10;
const MARCA_PDF = "MICROCREDITO_CLIENTES:";

const COLUNAS = [
  ["nome_completo", "Nome"],
  ["tipo_cliente", "Tipo"],
  ["documento_tipo", "Tipo de documento"],
  ["documento_numero", "Documento"],
  ["nuit", "NUIT"],
  ["telefone_principal", "Telefone"],
  ["email", "Email"],
  ["cidade", "Cidade"],
  ["provincia", "Província"],
  ["endereco_completo", "Endereço"],
  ["perfil_risco", "Perfil"],
  ["score", "Score"],
  ["limite_credito", "Limite"],
  ["cliente_ativo", "Activo"],
];

const semAnexos = (cliente) => {
  const copia = { ...cliente };
  delete copia.foto_perfil;
  delete copia.documentos_anexos;
  return copia;
};

const descarregar = (blob, nome) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
};

const FiltroMenu = ({ icone: Icone, rotulo, texto, aberto, onToggle, opcoes, valor, onEscolher }) => (
  <div className={`cli-drop ${aberto ? "is-open" : ""}`}>
    <button type="button" className="cli-drop-btn" onClick={onToggle} aria-expanded={aberto}>
      <Icone size={15} />
      <span>{rotulo}</span>
      <strong>{texto}</strong>
      <ChevronDown size={14} className="cli-chevron" />
    </button>
    {aberto ? (
      <ul className="cli-drop-menu">
        {opcoes.map((op) => (
          <li key={op.id}>
            <button
              type="button"
              className={op.id === valor ? "is-active" : ""}
              onClick={() => onEscolher(op.id)}
            >
              {op.label}
            </button>
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

const ClientesLista = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { usuario } = useContext(AuthContext);
  const ficheiroRef = useRef(null);
  const [versao, setVersao] = useState(0);
  const [filtro, setFiltro] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [provincia, setProvincia] = useState("");
  const [cidade, setCidade] = useState("");
  const [pagina, setPagina] = useState(1);
  const [menu, setMenu] = useState(null);
  const [aviso, setAviso] = useState(state?.sucesso || "");
  const [aEliminar, setAEliminar] = useState(null);
  const [senha, setSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  const confirmarEliminacao = () => {
    if (senha !== SENHA_ELIMINAR) {
      setErroSenha("Senha incorrecta.");
      return;
    }
    eliminarCliente(aEliminar.id);
    setAEliminar(null);
    setSenha("");
    setErroSenha("");
    setVersao((v) => v + 1);
    setAviso("Cliente eliminado com sucesso.");
  };

  const clientes = useMemo(() => listarClientes(), [versao]);

  useEffect(() => {
    const fechar = (evento) => {
      if (!evento.target.closest(".cli-drop")) setMenu(null);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  const visiveis = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    return clientes.filter((c) => {
      if (tipo && c.tipo_cliente !== tipo) return false;
      if (estado === "activo" && !c.cliente_ativo) return false;
      if (estado === "inactivo" && c.cliente_ativo) return false;
      if (provincia && c.provincia !== provincia) return false;
      if (cidade && c.cidade !== cidade) return false;
      if (!q) return true;
      return [c.nome_completo, c.documento_numero, c.telefone_principal, c.cidade, c.nuit, c.provincia]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [clientes, filtro, tipo, estado, provincia, cidade]);

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const paginaItens = visiveis.slice(inicio, inicio + POR_PAGINA);
  const filtrosActivos = Boolean(filtro || tipo || estado || provincia || cidade);

  const escolher = (setter) => (valor) => {
    setter(valor);
    setPagina(1);
    setMenu(null);
  };

  const gravarImportados = (lista, origem) => {
    const n = importarClientes(lista, usuario);
    setVersao((v) => v + 1);
    setPagina(1);
    setAviso(`${n} cliente${n === 1 ? "" : "s"} importado${n === 1 ? "" : "s"} de ${origem}. Documentos repetidos foram ignorados.`);
    setMenu(null);
  };

  const exportarJson = () => {
    descarregar(new Blob([JSON.stringify(listarClientes().map(semAnexos), null, 2)], { type: "application/json" }), "clientes-microcredito.json");
    setMenu(null);
    setAviso("Carteira exportada em JSON.");
  };

  const exportarExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const livro = new ExcelJS.Workbook();
    const folha = livro.addWorksheet("Clientes");
    const logo = await pngDoLogo();
    const base64 = String(logo).split(",")[1];
    folha.getRow(1).height = 48;
    if (base64) {
      const imagem = livro.addImage({ base64, extension: "png" });
      folha.addImage(imagem, { tl: { col: 0.15, row: 0.15 }, ext: { width: 140, height: 42 } });
    }
    const cabeca = folha.getRow(3);
    cabeca.values = COLUNAS.map(([, titulo]) => titulo);
    cabeca.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cabeca.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4AAC05" } };
    listarClientes().forEach((c) => {
      folha.addRow(COLUNAS.map(([campo]) => (campo === "cliente_ativo" ? (c.cliente_ativo ? "Sim" : "Não") : c[campo] ?? "")));
    });
    folha.columns.forEach((coluna) => { coluna.width = 22; });
    const buffer = await livro.xlsx.writeBuffer();
    descarregar(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "clientes-microcredito.xlsx");
    setMenu(null);
    setAviso("Carteira exportada em Excel.");
  };

  const exportarPdf = async () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const lista = listarClientes().map(semAnexos);
    const logo = await pngDoLogo();
    if (logo) doc.addImage(logo, "PNG", 14, 8, 32, 12);
    doc.setFontSize(14);
    doc.text("Clientes — Sistema de Microcrédito", logo ? 52 : 14, 16);
    doc.setFontSize(9);
    lista.forEach((c, i) => {
      const y = 28 + (i % 18) * 9;
      if (i > 0 && i % 18 === 0) doc.addPage();
      doc.text(`${c.nome_completo || ""}  |  ${c.documento_numero || ""}  |  ${c.telefone_principal || ""}  |  ${c.cidade || ""}  |  ${c.perfil_risco || ""}`, 14, i > 0 && i % 18 === 0 ? 20 : y);
    });
    doc.setFontSize(6);
    doc.text(`${MARCA_PDF}${btoa(unescape(encodeURIComponent(JSON.stringify(lista))))}`, 14, doc.internal.pageSize.getHeight() - 6);
    doc.save("clientes-microcredito.pdf");
    setMenu(null);
    setAviso("Carteira exportada em PDF.");
  };

  const importar = async (ficheiro) => {
    if (!ficheiro) return;
    const nome = ficheiro.name.toLowerCase();
    try {
      if (nome.endsWith(".json")) {
        const dados = JSON.parse(await ficheiro.text());
        gravarImportados(Array.isArray(dados) ? dados : [], "JSON");
        return;
      }
      if (nome.endsWith(".xlsx") || nome.endsWith(".xls") || nome.endsWith(".csv")) {
        const livro = XLSX.read(await ficheiro.arrayBuffer(), { type: "array" });
        const folhaDados = livro.SheetNames
          .map((nomeFolha) => livro.Sheets[nomeFolha])
          .find((folha) => {
            const matriz = XLSX.utils.sheet_to_json(folha, { header: 1, defval: "" });
            return matriz.some((linha) => linha.some((celula) => String(celula).trim() === "Nome"));
          }) || livro.Sheets[livro.SheetNames[0]];
        const matriz = XLSX.utils.sheet_to_json(folhaDados, { header: 1, defval: "" });
        const indiceCabeca = Math.max(0, matriz.findIndex((linha) => linha.some((celula) => String(celula).trim() === "Nome")));
        const cabeca = matriz[indiceCabeca] || [];
        const linhas = matriz.slice(indiceCabeca + 1).filter((linha) => linha.some((celula) => String(celula).trim())).map((linha) => {
          const objecto = {};
          cabeca.forEach((titulo, i) => { if (String(titulo).trim()) objecto[String(titulo).trim()] = linha[i] ?? ""; });
          return objecto;
        });
        const lista = linhas.map((linha) => {
          const cliente = {};
          COLUNAS.forEach(([campo, titulo]) => {
            const valor = linha[titulo] ?? linha[campo];
            if (valor !== undefined && valor !== "") cliente[campo] = valor;
          });
          if (cliente.cliente_ativo === "Sim" || cliente.cliente_ativo === true || cliente.cliente_ativo === 1) cliente.cliente_ativo = true;
          if (cliente.cliente_ativo === "Não" || cliente.cliente_ativo === "Nao") cliente.cliente_ativo = false;
          return cliente;
        });
        gravarImportados(lista, "Excel");
        return;
      }
      if (nome.endsWith(".pdf")) {
        const texto = new TextDecoder("latin1").decode(await ficheiro.arrayBuffer());
        const inicio = texto.indexOf(MARCA_PDF);
        if (inicio < 0) throw new Error("pdf");
        const bruto = texto.slice(inicio + MARCA_PDF.length).split(/[\s)]/)[0];
        const lista = JSON.parse(decodeURIComponent(escape(atob(bruto))));
        gravarImportados(Array.isArray(lista) ? lista : [], "PDF");
        return;
      }
      setAviso("Use um ficheiro Excel, PDF ou JSON.");
    } catch {
      setAviso("Não foi possível ler este ficheiro. Exporte a partir desta lista ou use o modelo Excel.");
    }
    setMenu(null);
  };

  const limpar = () => {
    setFiltro("");
    setTipo("");
    setEstado("");
    setProvincia("");
    setCidade("");
    setPagina(1);
    setMenu(null);
  };

  const rotulo = (opcoes, valor, vazio) => opcoes.find((o) => o.id === valor)?.label || vazio;

  const tipos = [
    { id: "", label: "Todos" },
    { id: "Pessoa Física", label: "Pessoa Física" },
    { id: "Pessoa Jurídica", label: "Pessoa Jurídica" },
  ];
  const estados = [
    { id: "", label: "Todos" },
    { id: "activo", label: "Activo" },
    { id: "inactivo", label: "Inactivo" },
  ];
  const provincias = [{ id: "", label: "Todas" }, ...LOCALIDADES.map((p) => ({ id: p.provincia, label: p.provincia }))];
  const cidadesLista = provincia
    ? (LOCALIDADES.find((p) => p.provincia === provincia)?.cidades || [])
    : LOCALIDADES.flatMap((p) => p.cidades);
  const cidades = [{ id: "", label: "Todas" }, ...cidadesLista.map((c) => ({ id: c.nome, label: c.nome }))];

  return (
    <div className="cli-page">
      <header className="cli-top">
        <div className="cli-pills">
          <span className="cli-pill"><Users size={16} /> Lista de clientes</span>
          <span className="cli-pill">
            <UserRound size={16} />
            {clientes.length} cliente{clientes.length === 1 ? "" : "s"} no microcrédito
          </span>
        </div>
        <div className="cli-top-actions">
          <div className={`cli-drop ${menu === "io" ? "is-open" : ""}`}>
            <button type="button" className="cli-btn-io" onClick={() => setMenu(menu === "io" ? null : "io")}>
              <ArrowDownUp size={16} /> Importar / Exportar <ChevronDown size={14} />
            </button>
            {menu === "io" ? (
              <ul className="cli-drop-menu cli-drop-menu-end">
                <li className="cli-drop-legenda"><Download size={13} /> Exportar</li>
                <li><button type="button" onClick={exportarExcel}><FileSpreadsheet size={15} /> Excel</button></li>
                <li><button type="button" onClick={exportarPdf}><FileText size={15} /> PDF</button></li>
                <li><button type="button" onClick={exportarJson}><FileJson size={15} /> JSON</button></li>
                <li className="cli-drop-legenda"><Upload size={13} /> Importar</li>
                <li><button type="button" onClick={() => ficheiroRef.current?.click()}><Upload size={15} /> Excel, PDF ou JSON</button></li>
              </ul>
            ) : null}
          </div>
          <input
            ref={ficheiroRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf,.json,application/json,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            hidden
            onChange={(e) => {
              importar(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button type="button" className="cli-btn-novo" onClick={() => navigate("/imperial/dashboard/clientes/novo")}>
            <Plus size={16} /> Novo cliente
          </button>
        </div>
      </header>

      {aviso ? (
        <div className="cli-modal-fundo" role="presentation">
          <div className="cli-modal" role="dialog" aria-modal="true">
            <span className="cli-modal-icone"><CheckCircle2 size={32} /></span>
            <p>Operação concluída</p>
            <h2>{aviso}</h2>
            <button type="button" className="cli-btn" onClick={() => setAviso("")}>Continuar</button>
          </div>
        </div>
      ) : null}

      {aEliminar ? (
        <div className="cli-modal-fundo" role="presentation">
          <form
            className="cli-modal cli-modal-perigo"
            role="dialog"
            aria-modal="true"
            onSubmit={(e) => {
              e.preventDefault();
              confirmarEliminacao();
            }}
          >
            <span className="cli-modal-icone"><Trash2 size={30} /></span>
            <p>Eliminar cliente</p>
            <h2>{aEliminar.nome_completo}</h2>
            <label className="cli-senha">
              <Lock size={16} />
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setErroSenha("");
                }}
                placeholder="Senha de confirmação"
              />
            </label>
            {erroSenha ? <small className="cli-senha-erro">{erroSenha}</small> : null}
            <div className="cli-modal-accoes">
              <button type="button" className="cli-btn ghost" onClick={() => { setAEliminar(null); setSenha(""); setErroSenha(""); }}>Cancelar</button>
              <button type="submit" className="cli-btn cli-btn-perigo"><Trash2 size={16} /> Eliminar</button>
            </div>
          </form>
        </div>
      ) : null}

      <section className="cli-filtros">
        <label className="cli-busca">
          <Search size={16} />
          <input
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPagina(1);
            }}
            placeholder="Pesquisar nome, documento, telefone ou cidade"
          />
        </label>
        <FiltroMenu icone={Building2} rotulo="Tipo" texto={rotulo(tipos, tipo, "Todos")} aberto={menu === "tipo"} onToggle={() => setMenu(menu === "tipo" ? null : "tipo")} opcoes={tipos} valor={tipo} onEscolher={escolher(setTipo)} />
        <FiltroMenu icone={BadgeCheck} rotulo="Estado" texto={rotulo(estados, estado, "Todos")} aberto={menu === "estado"} onToggle={() => setMenu(menu === "estado" ? null : "estado")} opcoes={estados} valor={estado} onEscolher={escolher(setEstado)} />
        <FiltroMenu icone={MapPin} rotulo="Província" texto={rotulo(provincias, provincia, "Todas")} aberto={menu === "provincia"} onToggle={() => setMenu(menu === "provincia" ? null : "provincia")} opcoes={provincias} valor={provincia} onEscolher={(valor) => { setProvincia(valor); setCidade(""); setPagina(1); setMenu(null); }} />
        <FiltroMenu icone={Landmark} rotulo="Cidade" texto={rotulo(cidades, cidade, "Todas")} aberto={menu === "cidade"} onToggle={() => setMenu(menu === "cidade" ? null : "cidade")} opcoes={cidades} valor={cidade} onEscolher={escolher(setCidade)} />
        {filtrosActivos ? (
          <button type="button" className="cli-limpar" onClick={limpar}>Limpar filtros</button>
        ) : null}
      </section>

      <div className="cli-card cli-table-wrap">
        <table className="cli-table">
          <thead>
            <tr>
              <th><span className="cli-th"><UserRound size={14} /> Cliente</span></th>
              <th><span className="cli-th"><IdCard size={14} /> Documento</span></th>
              <th><span className="cli-th"><Phone size={14} /> Telefone</span></th>
              <th><span className="cli-th"><MapPin size={14} /> Cidade</span></th>
              <th><span className="cli-th"><Shield size={14} /> Perfil</span></th>
              <th><span className="cli-th"><Gauge size={14} /> Score</span></th>
              <th><span className="cli-th"><BadgeCheck size={14} /> Estado</span></th>
              <th><span className="cli-th"><Eye size={14} /> Acções</span></th>
            </tr>
          </thead>
          <tbody key={paginaActual}>
            {paginaItens.length === 0 ? (
              <tr className="cli-empty">
                <td colSpan={8}>
                  <div className="cli-empty-box">
                    <Users size={28} />
                    {clientes.length === 0 ? (
                      <>
                        <strong>Ainda não há clientes.</strong>
                        <span>Crie o primeiro registo.</span>
                      </>
                    ) : (
                      <>
                        <strong>Nenhum cliente encontrado.</strong>
                        <span>Ajuste os filtros ou a pesquisa.</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : paginaItens.map((c, indice) => (
              <tr key={c.id} style={{ animationDelay: `${indice * 35}ms` }}>
                <td>
                  <span className="cli-pessoa"><AvatarCliente cliente={c} tamanho={32} /><span><span className="cli-pessoa-nome">{c.nome_completo}</span><span className="cli-pessoa-tipo">{c.tipo_cliente}</span></span></span>
                </td>
                <td><span className="cli-cell"><IdCard size={14} /> {c.documento_tipo} {c.documento_numero}</span></td>
                <td><span className="cli-cell"><Phone size={14} /> {c.telefone_principal}</span></td>
                <td>
                  <span className="cli-cell"><MapPin size={14} /> {c.cidade}{c.bairro ? <span className="cli-suave"> · {c.bairro}</span> : null}</span>
                </td>
                <td><span className={`cli-chip is-forte ${tomPerfil(c.perfil_risco)}`} title="Perfil de risco"><Shield size={13} /> {c.perfil_risco || "—"}</span></td>
                <td><span className={`cli-chip ${tomScore(c.score)}`} title="Score"><Gauge size={13} /> {c.score}</span></td>
                <td>
                  <span className={`cli-chip ${c.cliente_ativo ? "" : "is-laranja"}`}>
                    {c.cliente_ativo ? <BadgeCheck size={13} /> : <Ban size={13} />}
                    {c.cliente_ativo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <button type="button" className="cli-icon-btn" title="Detalhes" onClick={() => navigate(`/imperial/dashboard/clientes/perfil/${c.id}`)}><Eye size={15} /></button>
                  <button type="button" className="cli-icon-btn" title="Editar" onClick={() => navigate(`/imperial/dashboard/clientes/editar/${c.id}`)}><Pencil size={15} /></button>
                  <button type="button" className="cli-icon-btn cli-icon-perigo" title="Eliminar" onClick={() => setAEliminar(c)}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visiveis.length > 0 ? (
        <footer className="cli-pager">
          <span className="cli-pill cli-pill-pequena">
            <ListOrdered size={15} />
            {inicio + 1}–{Math.min(inicio + POR_PAGINA, visiveis.length)} de {visiveis.length}
          </span>
          <div>
            <button type="button" disabled={paginaActual <= 1} onClick={() => setPagina(paginaActual - 1)} aria-label="Página anterior">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" className={n === paginaActual ? "is-active" : ""} onClick={() => setPagina(n)}>
                {n}
              </button>
            ))}
            <button type="button" disabled={paginaActual >= totalPaginas} onClick={() => setPagina(paginaActual + 1)} aria-label="Página seguinte">
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  );
};

export default ClientesLista;
