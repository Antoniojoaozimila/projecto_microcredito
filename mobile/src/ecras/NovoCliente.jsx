import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import {
  IconeAlerta,
  IconeDocumento,
  IconeEdificio,
  IconeEquipa,
  IconeEscudo,
  IconeMapa,
  IconeMoeda,
  IconePessoa,
  IconePin,
  IconeTelefone,
  IconeVoltar,
} from "../componentes/Icones";
import { escolherFoto } from "../servicos/foto";
import { obterCoordenadas } from "../servicos/localizacao";
import { LOCALIDADES, cidadeSeleccionada, corresponderCidade, corresponderProvincia } from "../dados/localidades";
import { cores, fonte } from "../tema";

const PERFIS = [
  { id: "A", rotulo: "A - Excelente", score: 900 },
  { id: "B", rotulo: "B - Bom", score: 700 },
  { id: "C", rotulo: "C - Regular", score: 500 },
  { id: "D", rotulo: "D - Mau", score: 200 },
];

const vazio = () => ({
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
  foto: null,
  anexos: {},
});

const clientesGuardados = [];
const telefoneOk = (valor) => /^(\+258)?8[2-7]\d{7}$/.test(String(valor || "").replace(/\s/g, ""));
const soDigitos = (valor) => String(valor || "").replace(/\D/g, "");
const soTelefone = (valor) => {
  const limpo = String(valor || "").replace(/[^\d+]/g, "");
  return limpo.startsWith("+") ? `+${limpo.slice(1).replace(/\+/g, "")}` : limpo.replace(/\+/g, "");
};
const idade = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 0;
  const n = new Date(iso);
  const hoje = new Date();
  let anos = hoje.getFullYear() - n.getFullYear();
  const mes = hoje.getMonth() - n.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < n.getDate())) anos -= 1;
  return anos;
};

const Seccao = ({ Icone, titulo, cor, children }) => (
  <View style={estilos.seccao}>
    <View style={estilos.seccaoTopo}>
      <View style={[estilos.seccaoIcone, { backgroundColor: `${cor}18` }]}><Icone size={16} color={cor} /></View>
      <Text style={estilos.seccaoTitulo}>{titulo}</Text>
    </View>
    {children}
  </View>
);

const Campo = ({ Icone, rotulo, erro, children }) => (
  <View style={estilos.campo}>
    <View style={estilos.rotuloLinha}>
      {Icone ? <Icone size={14} color={cores.verdeEscuro} /> : null}
      <Text style={estilos.rotulo}>{rotulo}</Text>
    </View>
    {children}
    {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
  </View>
);

const Caixa = (props) => (
  <TextInput placeholderTextColor={cores.placeholder} style={estilos.input} {...props} />
);

const Chips = ({ valor, opcoes, onChange }) => (
  <View style={estilos.chips}>
    {opcoes.map((opcao) => (
      <Pressable key={opcao.id} onPress={() => onChange(opcao.id)} style={[estilos.chip, valor === opcao.id && estilos.chipOn]}>
        <Text style={[estilos.chipTexto, valor === opcao.id && estilos.chipTextoOn]}>{opcao.label}</Text>
      </Pressable>
    ))}
  </View>
);

const ListaEscolha = ({ Icone, rotulo, valor, opcoes, onChange, erro }) => {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const etiqueta = opcoes.find((opcao) => opcao.id === valor)?.label || "Seleccione";
  const visiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    const base = texto ? opcoes.filter((opcao) => opcao.label.toLowerCase().includes(texto)) : opcoes;
    return base.slice(0, 8);
  }, [busca, opcoes]);
  return (
    <Campo Icone={Icone} rotulo={rotulo} erro={erro}>
      <Pressable style={estilos.input} onPress={() => setAberto((atual) => !atual)}>
        <Text style={valor ? estilos.valor : estilos.falso}>{etiqueta}</Text>
      </Pressable>
      {aberto ? (
        <View style={estilos.lista}>
          <Caixa value={busca} onChangeText={setBusca} placeholder="Pesquisar" />
          {visiveis.map((opcao) => (
            <Pressable key={opcao.id || "vazio"} style={estilos.opcao} onPress={() => { onChange(opcao.id); setAberto(false); setBusca(""); }}>
              <Text style={estilos.opcaoTexto}>{opcao.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Campo>
  );
};

const NovoCliente = ({ onVoltar }) => {
  const [form, setForm] = useState(vazio);
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState("");
  const [gps, setGps] = useState(false);
  const set = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));
  const fisica = form.tipo_cliente === "Pessoa Física";
  const local = cidadeSeleccionada(form.provincia, form.cidade);
  const cidades = LOCALIDADES.find((item) => item.provincia === form.provincia)?.cidades || [];

  const validar = () => {
    const falhas = {};
    if (form.nome_completo.trim().length < 3) falhas.nome_completo = "Use entre 3 e 200 caracteres.";
    if (fisica && !form.data_nascimento) falhas.data_nascimento = "Obrigatório para pessoa física.";
    if (fisica && form.data_nascimento && idade(form.data_nascimento) < 18) falhas.data_nascimento = "A idade mínima é 18 anos.";
    if (fisica && form.data_nascimento && idade(form.data_nascimento) > 70) falhas.data_nascimento = "A idade máxima é 70 anos.";
    if (!form.documento_numero.trim()) falhas.documento_numero = "Indique o número do documento.";
    if (form.documento_tipo === "Outros" && !form.documento_tipo_outro.trim()) falhas.documento_tipo_outro = "Indique o tipo de documento.";
    if (form.documento_tipo === "BI" && !/^\d{9}[A-Za-z]$|^\d{12}[A-Za-z]$/.test(form.documento_numero.trim())) falhas.documento_numero = "O BI deve ter 9 ou 12 dígitos e uma letra.";
    if (clientesGuardados.some((cliente) => cliente.documento_numero === form.documento_numero.trim())) falhas.documento_numero = "Este documento já está registado.";
    if (form.documento_validade && form.documento_validade <= new Date().toISOString().slice(0, 10)) falhas.documento_validade = "A validade deve ser uma data futura.";
    if (!fisica && !/^\d{9}$/.test(form.nuit.trim())) falhas.nuit = "O NUIT da empresa deve ter 9 dígitos.";
    if (form.nuit && !/^\d{9}$/.test(form.nuit.trim())) falhas.nuit = "O NUIT deve ter 9 dígitos.";
    if (!telefoneOk(form.telefone_principal)) falhas.telefone_principal = "Use 84xxxxxxx ou +25884xxxxxxx.";
    if (form.telefone_alternativo && !telefoneOk(form.telefone_alternativo)) falhas.telefone_alternativo = "Telefone alternativo inválido.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) falhas.email = "Email inválido.";
    if (!form.endereco_completo.trim()) falhas.endereco_completo = "Indique o endereço.";
    if (!form.zona_id || (form.zona_id === "__outro" && !form.zona_outra.trim())) falhas.zona_id = "Seleccione a zona.";
    if (!form.cidade || (form.cidade === "__outro" && !form.cidade_outra.trim())) falhas.cidade = "Indique a cidade.";
    if (!form.provincia) falhas.provincia = "Seleccione a província.";
    const limite = Number(form.limite_credito);
    if (!Number.isFinite(limite) || limite < 0 || limite > 1000000) falhas.limite_credito = "Entre 0 e 1.000.000 MT.";
    if (form.contacto_emergencia_telefone && !telefoneOk(form.contacto_emergencia_telefone)) falhas.contacto_emergencia_telefone = "Telefone inválido.";
    if (form.contacto_emergencia_parentesco === "__outro" && !form.parentesco_outro.trim()) falhas.parentesco_outro = "Indique o parentesco.";
    if (!form.anexos.bi) falhas.bi = "A cópia do BI ou passaporte é obrigatória.";
    return falhas;
  };

  const seguirGps = async () => {
    if (gps) {
      setGps(false);
      return;
    }
    setAviso("A obter a localização…");
    setGps(true);
    try {
      const coords = await obterCoordenadas();
      const lat = coords.latitude.toFixed(6);
      const lon = coords.longitude.toFixed(6);
      let endereco = "";
      let provincia = "";
      let cidade = "";
      let bairro = "";
      try {
        const resposta = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
        const dados = await resposta.json();
        const sitio = dados.address || {};
        endereco = dados.display_name || "";
        provincia = corresponderProvincia(sitio.state || sitio.city || "");
        cidade = corresponderCidade(provincia, sitio.city || sitio.town || sitio.municipality || "");
        bairro = sitio.suburb || sitio.neighbourhood || "";
      } catch {
        endereco = "";
      }
      setForm((atual) => ({
        ...atual,
        coordenadas_gps: `${lat}, ${lon}`,
        endereco_completo: endereco || atual.endereco_completo,
        provincia: provincia || atual.provincia,
        cidade: cidade || atual.cidade,
        bairro: bairro || atual.bairro,
      }));
      setAviso("");
    } catch (erro) {
      setGps(false);
      setAviso(erro.message || "Não foi possível capturar a localização.");
    }
  };

  const anexar = async (chave) => {
    const uri = await escolherFoto();
    if (!uri) return;
    set("anexos", { ...form.anexos, [chave]: uri });
  };

  const guardar = () => {
    if (!form.tipo_cliente) {
      setAviso("Escolha o tipo de cliente.");
      return;
    }
    const falhas = validar();
    setErros(falhas);
    if (Object.keys(falhas).length) {
      setAviso("Reveja os campos assinalados.");
      return;
    }
    clientesGuardados.push({
      ...form,
      documento_numero: form.documento_numero.trim(),
      id: String(Date.now()),
    });
    setAviso("Cliente criado neste telemóvel.");
    setForm(vazio());
    setErros({});
    setGps(false);
  };

  const opcoes = (lista, vazioLabel) => [
    { id: "", label: vazioLabel },
    ...lista.map((item) => ({ id: item, label: item })),
    { id: "__outro", label: "Outro" },
  ];

  return (
    <ScrollView style={estilos.scroll} contentContainerStyle={estilos.pagina} keyboardShouldPersistTaps="handled">
      <View style={estilos.faixa}>
        <View style={estilos.corte} />
        <Pressable style={estilos.voltar} onPress={onVoltar}>
          <IconeVoltar size={16} color="#ffffff" />
          <Text style={estilos.voltarTexto}>Módulos</Text>
        </Pressable>
        <View style={estilos.faixaLinha}>
          <View style={estilos.faixaIcone}><IconePessoa size={20} color="#ffffff" /></View>
          <View>
            <Text style={estilos.faixaTitulo}>Novo cliente</Text>
            <Text style={estilos.faixaSub}>O mesmo registo da versão web</Text>
          </View>
        </View>
      </View>
      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}

      <Seccao Icone={IconePessoa} titulo="Tipo de cliente" cor="#1d4ed8">
        <Pressable style={[estilos.tipo, fisica && estilos.tipoOn]} onPress={() => set("tipo_cliente", "Pessoa Física")}>
          <IconePessoa size={18} color="#1d4ed8" />
          <View style={estilos.flex}>
            <Text style={estilos.itemTitulo}>Pessoa Física (Individual)</Text>
            <Text style={estilos.itemNota}>Cliente singular, com documento e data de nascimento.</Text>
          </View>
        </Pressable>
        <Pressable style={[estilos.tipo, form.tipo_cliente === "Pessoa Jurídica" && estilos.tipoOn]} onPress={() => set("tipo_cliente", "Pessoa Jurídica")}>
          <IconeEdificio size={18} color="#0f766e" />
          <View style={estilos.flex}>
            <Text style={estilos.itemTitulo}>Pessoa Jurídica (Empresa)</Text>
            <Text style={estilos.itemNota}>Empresa, com NUIT obrigatório.</Text>
          </View>
        </Pressable>
      </Seccao>

      {form.tipo_cliente ? (
        <>
          <Seccao Icone={IconePessoa} titulo="Informações básicas" cor="#0f7a3c">
            <Campo Icone={IconePessoa} rotulo={fisica ? "Foto de perfil (opcional)" : "Logótipo / foto (opcional)"}>
              <Pressable style={estilos.anexo} onPress={async () => { const uri = await escolherFoto(); if (uri) set("foto", uri); }}>
                <Text style={estilos.valor}>{form.foto ? "Foto escolhida" : "Escolher imagem"}</Text>
              </Pressable>
            </Campo>
            <Campo Icone={IconePessoa} rotulo="Nome completo *" erro={erros.nome_completo}>
              <Caixa value={form.nome_completo} maxLength={200} onChangeText={(valor) => set("nome_completo", valor)} placeholder="Digite o nome completo" />
            </Campo>
            {fisica ? (
              <Campo Icone={IconeDocumento} rotulo="Data de nascimento *" erro={erros.data_nascimento}>
                <Caixa value={form.data_nascimento} onChangeText={(valor) => set("data_nascimento", valor)} placeholder="AAAA-MM-DD" />
              </Campo>
            ) : null}
            <Campo Icone={IconeEquipa} rotulo="Género">
              <Chips valor={form.genero} onChange={(valor) => set("genero", valor)} opcoes={["Masculino", "Feminino", "Outro"].map((id) => ({ id, label: id }))} />
            </Campo>
            <Campo Icone={IconeAlerta} rotulo="Estado civil">
              <Chips valor={form.estado_civil} onChange={(valor) => set("estado_civil", valor)} opcoes={["Solteiro", "Casado", "Divorciado", "Viúvo", "Viúva"].map((id) => ({ id, label: id }))} />
            </Campo>
            <Campo Icone={IconeDocumento} rotulo="Tipo de documento *">
              <Chips valor={form.documento_tipo} onChange={(valor) => set("documento_tipo", valor)} opcoes={["BI", "Passaporte", "NUIT", "DIRE", "Outros"].map((id) => ({ id, label: id }))} />
            </Campo>
            {form.documento_tipo === "Outros" ? (
              <Campo Icone={IconeDocumento} rotulo="Outro documento *" erro={erros.documento_tipo_outro}>
                <Caixa value={form.documento_tipo_outro} onChangeText={(valor) => set("documento_tipo_outro", valor)} placeholder="Escreva o tipo" />
              </Campo>
            ) : null}
            <Campo Icone={IconeDocumento} rotulo="Número do documento *" erro={erros.documento_numero}>
              <Caixa value={form.documento_numero} onChangeText={(valor) => set("documento_numero", valor)} placeholder="000000000000E" />
            </Campo>
            <Campo Icone={IconeDocumento} rotulo="Validade do documento" erro={erros.documento_validade}>
              <Caixa value={form.documento_validade} onChangeText={(valor) => set("documento_validade", valor)} placeholder="AAAA-MM-DD" />
            </Campo>
            <Campo Icone={IconeDocumento} rotulo={fisica ? "NUIT" : "NUIT *"} erro={erros.nuit}>
              <Caixa value={form.nuit} keyboardType="number-pad" maxLength={9} onChangeText={(valor) => set("nuit", soDigitos(valor).slice(0, 9))} placeholder="000000000" />
            </Campo>
          </Seccao>

          <Seccao Icone={IconeTelefone} titulo="Contactos" cor="#0f766e">
            <Campo Icone={IconeTelefone} rotulo="Telefone principal *" erro={erros.telefone_principal}>
              <Caixa value={form.telefone_principal} keyboardType="phone-pad" onChangeText={(valor) => set("telefone_principal", soTelefone(valor))} placeholder="84xxxxxxx" />
            </Campo>
            <Campo Icone={IconeTelefone} rotulo="Telefone alternativo" erro={erros.telefone_alternativo}>
              <Caixa value={form.telefone_alternativo} keyboardType="phone-pad" onChangeText={(valor) => set("telefone_alternativo", soTelefone(valor))} placeholder="82xxxxxxx" />
            </Campo>
            <Campo Icone={IconeDocumento} rotulo="Email" erro={erros.email}>
              <Caixa value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(valor) => set("email", valor)} placeholder="cliente@email.com" />
            </Campo>
          </Seccao>

          <Seccao Icone={IconeMapa} titulo="Localização" cor="#0369a1">
            <Campo Icone={IconePin} rotulo="Endereço completo *" erro={erros.endereco_completo}>
              <Caixa value={form.endereco_completo} onChangeText={(valor) => set("endereco_completo", valor)} placeholder="Av. Julius Nyerere, nº 123" />
            </Campo>
            <ListaEscolha Icone={IconeMapa} rotulo="Província *" erro={erros.provincia} valor={form.provincia} opcoes={[{ id: "", label: "Seleccione" }, ...LOCALIDADES.map((item) => ({ id: item.provincia, label: item.provincia }))]} onChange={(valor) => setForm((atual) => ({ ...atual, provincia: valor, cidade: "", bairro: "", zona_id: "" }))} />
            <ListaEscolha Icone={IconeEdificio} rotulo="Cidade *" erro={erros.cidade} valor={form.cidade} opcoes={opcoes(cidades.map((item) => item.nome), form.provincia ? "Seleccione a cidade" : "Escolha a província")} onChange={(valor) => setForm((atual) => ({ ...atual, cidade: valor, bairro: "", zona_id: "" }))} />
            {form.cidade === "__outro" ? (
              <Campo Icone={IconeEdificio} rotulo="Outra cidade *">
                <Caixa value={form.cidade_outra} onChangeText={(valor) => set("cidade_outra", valor)} />
              </Campo>
            ) : null}
            <ListaEscolha Icone={IconePin} rotulo="Bairro" valor={form.bairro} opcoes={opcoes(local?.bairros || [], "Seleccione o bairro")} onChange={(valor) => set("bairro", valor)} />
            {form.bairro === "__outro" ? (
              <Campo Icone={IconePin} rotulo="Outro bairro">
                <Caixa value={form.bairro_outro} onChangeText={(valor) => set("bairro_outro", valor)} />
              </Campo>
            ) : null}
            <ListaEscolha Icone={IconeMapa} rotulo="Zona / território *" erro={erros.zona_id} valor={form.zona_id} opcoes={opcoes(local?.zonas || [], "Seleccione a zona")} onChange={(valor) => set("zona_id", valor)} />
            {form.zona_id === "__outro" ? (
              <Campo Icone={IconeMapa} rotulo="Outra zona *" erro={erros.zona_id}>
                <Caixa value={form.zona_outra} onChangeText={(valor) => set("zona_outra", valor)} />
              </Campo>
            ) : null}
            <Campo Icone={IconePin} rotulo="GPS em tempo real">
              <Caixa value={form.coordenadas_gps} onChangeText={(valor) => set("coordenadas_gps", valor)} placeholder="Latitude, Longitude" />
              <Pressable style={estilos.botaoClaro} onPress={seguirGps}>
                <Text style={estilos.botaoClaroTexto}>{gps ? "GPS capturado" : "Seguir GPS"}</Text>
              </Pressable>
            </Campo>
          </Seccao>

          <Seccao Icone={IconeMoeda} titulo="Perfil de crédito" cor="#166534">
            <Campo Icone={IconeMoeda} rotulo="Limite de crédito (MT) *" erro={erros.limite_credito}>
              <Caixa value={form.limite_credito} keyboardType="decimal-pad" onChangeText={(valor) => set("limite_credito", valor.replace(",", "."))} />
            </Campo>
            <Campo Icone={IconeEscudo} rotulo="Perfil de risco *">
              <Chips valor={form.perfil_risco} onChange={(valor) => set("perfil_risco", valor)} opcoes={PERFIS.map((item) => ({ id: item.id, label: item.rotulo }))} />
            </Campo>
            <Campo Icone={IconeEscudo} rotulo="Score inicial">
              <Text style={estilos.score}>{PERFIS.find((item) => item.id === form.perfil_risco)?.score ?? 0}</Text>
            </Campo>
            <View style={estilos.interruptor}>
              <Text style={estilos.itemTitulo}>Cliente activo</Text>
              <Switch value={form.cliente_ativo} onValueChange={(valor) => set("cliente_ativo", valor)} trackColor={{ false: "#d7ddd9", true: "#8ed09a" }} thumbColor={form.cliente_ativo ? cores.verde : "#f4f4f4"} />
            </View>
          </Seccao>

          <Seccao Icone={IconeAlerta} titulo="Contacto de emergência" cor="#9f1239">
            <Campo Icone={IconePessoa} rotulo="Nome do contacto">
              <Caixa value={form.contacto_emergencia_nome} onChangeText={(valor) => set("contacto_emergencia_nome", valor)} />
            </Campo>
            <Campo Icone={IconeTelefone} rotulo="Telefone" erro={erros.contacto_emergencia_telefone}>
              <Caixa value={form.contacto_emergencia_telefone} keyboardType="phone-pad" onChangeText={(valor) => set("contacto_emergencia_telefone", soTelefone(valor))} placeholder="84xxxxxxx" />
            </Campo>
            <Campo Icone={IconeEquipa} rotulo="Parentesco">
              <Chips valor={form.contacto_emergencia_parentesco} onChange={(valor) => set("contacto_emergencia_parentesco", valor)} opcoes={[...["Cônjuge", "Irmão", "Irmã", "Pai", "Mãe", "Filho", "Filha", "Tio", "Tia"].map((id) => ({ id, label: id })), { id: "__outro", label: "Outro" }]} />
            </Campo>
            {form.contacto_emergencia_parentesco === "__outro" ? (
              <Campo Icone={IconeEquipa} rotulo="Outro parentesco" erro={erros.parentesco_outro}>
                <Caixa value={form.parentesco_outro} onChangeText={(valor) => set("parentesco_outro", valor)} />
              </Campo>
            ) : null}
          </Seccao>

          <Seccao Icone={IconeDocumento} titulo="Documentos anexos" cor="#9a3412">
            {[
              ["bi", "Cópia do BI / passaporte *", erros.bi],
              ["residencia", "Comprovativo de residência", ""],
              ["rendimento", "Comprovativo de rendimento", ""],
            ].map(([chave, rotulo, erro]) => (
              <Campo key={chave} Icone={IconeDocumento} rotulo={rotulo} erro={erro}>
                <Pressable style={estilos.anexo} onPress={() => anexar(chave)}>
                  <Text style={estilos.valor}>{form.anexos[chave] ? "Ficheiro escolhido" : "Escolher imagem"}</Text>
                </Pressable>
              </Campo>
            ))}
          </Seccao>

          <Seccao Icone={IconeDocumento} titulo="Observações" cor="#1e3a8a">
            <Campo Icone={IconeDocumento} rotulo="Observações">
              <Caixa value={form.observacoes} onChangeText={(valor) => set("observacoes", valor)} multiline placeholder="Notas sobre o cliente" />
            </Campo>
          </Seccao>

          <Pressable style={estilos.botao} onPress={guardar}>
            <Text style={estilos.botaoTexto}>Salvar cliente</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
};

const estilos = StyleSheet.create({
  scroll: { flex: 1 },
  pagina: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  faixa: { borderRadius: 22, backgroundColor: "#1d4ed8", overflow: "hidden", padding: 16, minHeight: 118 },
  corte: { position: "absolute", width: 160, height: 160, right: -36, top: -70, backgroundColor: "#60a5fa", transform: [{ rotate: "26deg" }] },
  voltar: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  voltarTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "700" },
  faixaLinha: { flexDirection: "row", alignItems: "center", gap: 10 },
  faixaIcone: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  faixaTitulo: { color: "#ffffff", fontFamily: fonte, fontSize: 22, fontWeight: "800" },
  faixaSub: { color: "rgba(255,255,255,0.86)", fontFamily: fonte, marginTop: 2 },
  aviso: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "700" },
  seccao: { backgroundColor: cores.branco, borderRadius: 16, padding: 12, gap: 8 },
  seccaoTopo: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  seccaoIcone: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  seccaoTitulo: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, fontSize: 16 },
  campo: { gap: 4 },
  rotuloLinha: { flexDirection: "row", alignItems: "center", gap: 6 },
  rotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700" },
  input: { backgroundColor: "#f4f8f5", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontFamily: fonte, color: cores.titulo },
  valor: { fontFamily: fonte, color: cores.titulo },
  falso: { fontFamily: fonte, color: cores.placeholder },
  erro: { fontFamily: fonte, color: "#9b2c2c", fontSize: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { backgroundColor: "#f4f8f5", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  chipOn: { backgroundColor: cores.verde },
  chipTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 12, fontWeight: "700" },
  chipTextoOn: { color: "#ffffff" },
  lista: { backgroundColor: "#f7fbf8", borderRadius: 12, padding: 8, gap: 4 },
  opcao: { paddingVertical: 8, paddingHorizontal: 6 },
  opcaoTexto: { fontFamily: fonte, color: cores.titulo },
  tipo: { flexDirection: "row", gap: 10, alignItems: "center", borderRadius: 14, padding: 10, backgroundColor: "#f4f8f5" },
  tipoOn: { backgroundColor: "#e7f6ec", borderWidth: 1, borderColor: "#8ed09a" },
  flex: { flex: 1 },
  itemTitulo: { fontFamily: fonte, color: cores.titulo, fontWeight: "700" },
  itemNota: { fontFamily: fonte, color: cores.texto, fontSize: 12, marginTop: 2 },
  anexo: { backgroundColor: "#f4f8f5", borderRadius: 12, padding: 12 },
  score: { fontFamily: fonte, fontSize: 22, fontWeight: "800", color: cores.titulo },
  interruptor: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  botao: { backgroundColor: cores.verde, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  botaoTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "800" },
  botaoClaro: { marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: cores.verdeBorda, paddingVertical: 10, alignItems: "center" },
  botaoClaroTexto: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "800" },
});

export default NovoCliente;
