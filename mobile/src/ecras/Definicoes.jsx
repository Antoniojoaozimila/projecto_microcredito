import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import {
  IconeAlerta,
  IconeBase,
  IconeCadeado,
  IconeCarteira,
  IconeDocumento,
  IconeEdificio,
  IconeEngrenagem,
  IconeEquipa,
  IconeEscudo,
  IconeEstrela,
  IconeFicha,
  IconeGrafico,
  IconeMapa,
  IconeMoeda,
  IconePercentagem,
  IconePessoa,
  IconePin,
  IconeSeta,
  IconeSino,
  IconeVoltar,
} from "../componentes/Icones";
import { escolherFoto } from "../servicos/foto";
import { usarDados } from "../dados/operacao";
import { cores, fonte } from "../tema";

const SECCAO = {
  "cfg-utilizadores": { titulo: "Utilizadores", sub: "Consulta das contas da empresa", Icone: IconeEquipa, cor: "#0f7a3c", cor2: "#34d399" },
  "cfg-identidade": { titulo: "Identidade da empresa", sub: "Marca, contactos, moeda e data", Icone: IconeEdificio, cor: "#1d4ed8", cor2: "#93c5fd" },
  "cfg-perfis": { titulo: "Perfis e permissões", sub: "O que cada perfil pode fazer", Icone: IconeEscudo, cor: "#0f766e", cor2: "#5eead4" },
  "cfg-zonas": { titulo: "Zonas e territórios", sub: "Território, raio e responsável", Icone: IconeMapa, cor: "#0369a1", cor2: "#7dd3fc" },
  "cfg-tipos": { titulo: "Tipos de garantia", sub: "Ligar ou desligar cada tipo", Icone: IconeCadeado, cor: "#9a3412", cor2: "#fdba74" },
  "cfg-taxas": { titulo: "Taxas e juros", sub: "Crédito, cobrança e limites", Icone: IconePercentagem, cor: "#166534", cor2: "#86efac" },
  "cfg-notificacoes": { titulo: "Notificações", sub: "Canais, correio e SMS", Icone: IconeSino, cor: "#9f1239", cor2: "#fda4af" },
  "cfg-backup": { titulo: "Backup e segurança", sub: "Senha, sessão e cópia", Icone: IconeBase, cor: "#1e3a8a", cor2: "#93c5fd" },
  "cfg-integracoes": { titulo: "Integrações", sub: "M-Pesa, E-Mola, banco e mapas", Icone: IconeFicha, cor: "#6d28d9", cor2: "#c4b5fd" },
};

const LISTA = [
  ["cfg-utilizadores", "Consulta das contas"],
  ["cfg-identidade", "Marca, NUIT, moeda e contactos"],
  ["cfg-backup", "Senha, sessão, auditoria e cópia"],
];

const ICONES_PESSOA = [IconeEscudo, IconeEquipa, IconeEstrela, IconePessoa];
const CORES_PESSOA = ["#0f7a3c", "#1d4ed8", "#b45309", "#9f1239"];
const MODULOS = [
  ["clientes", "Clientes", IconeEquipa],
  ["emprestimos", "Empréstimos", IconeMoeda],
  ["pagamentos", "Pagamentos", IconeCarteira],
  ["garantias", "Garantias", IconeCadeado],
  ["cobrancas", "Cobranças", IconePin],
  ["carteiras", "Carteiras", IconeDocumento],
  ["relatorios", "Relatórios", IconeGrafico],
  ["configuracoes", "Configurações", IconeEngrenagem],
];
const ACCOES = ["criar", "ler", "atualizar", "excluir", "aprovar", "exportar"];
const ROTULOS_ACCAO = { criar: "Criar", ler: "Consultar", atualizar: "Actualizar", excluir: "Excluir", aprovar: "Aprovar", exportar: "Exportar" };
const TIPOS = [
  ["sem", "Sem garantia", "Crédito pessoal"],
  ["aval", "Aval / fiador", "Um ou mais avalistas"],
  ["movel", "Bem móvel", "Carro, moto, joias"],
  ["imovel", "Bem imóvel", "Casa ou terreno"],
  ["cheque", "Cheque caução", "Cheque em garantia"],
  ["deposito", "Depósito caução", "Valor depositado"],
  ["outro", "Outro", "Outra garantia"],
];
const TAXAS_CREDITO = [
  ["taxa_juros_padrao", "Taxa de juros (%)"],
  ["valor_minimo_emprestimo", "Valor mínimo (MT)"],
  ["valor_maximo_emprestimo", "Valor máximo (MT)"],
  ["prazo_minimo_parcelas", "Prazo mínimo"],
  ["prazo_maximo_parcelas", "Prazo máximo"],
  ["idade_minima_cliente", "Idade mínima"],
  ["idade_maxima_cliente", "Idade máxima"],
  ["score_minimo_aprovacao", "Score mínimo"],
  ["max_emprestimos_ativos", "Máx. empréstimos activos"],
  ["garantia_obrigatoria_acima", "Garantia acima de"],
  ["aprovacao_gestor_acima", "Gestor aprova acima de"],
  ["dias_carencia", "Dias de carência"],
];
const TAXAS_COBRANCA = [
  ["taxa_multa_atraso", "Multa por dia (%)"],
  ["dias_para_penhor", "Dias para penhor"],
  ["dias_para_execucao", "Dias para execução"],
  ["max_clientes_rota", "Máx. clientes por rota"],
  ["raio_max_cobranca_km", "Raio máximo (km)"],
  ["meta_mensal_cobrador", "Meta mensal do cobrador"],
  ["comissao_cobrador", "Comissão do cobrador (%)"],
  ["dias_lembrete_antes", "Lembrete antes (dias)"],
  ["dias_lembrete_apos", "Lembrete após (dias)"],
];
const INTEGRACOES = [
  { id: "mpesa", nome: "M-Pesa", detalhe: "Vodacom · pagamento", chaves: [["mpesa_api_url", "URL"], ["mpesa_api_key", "Chave"], ["mpesa_api_secret", "Segredo"]] },
  { id: "emola", nome: "E-Mola", detalhe: "Movitel · pagamento", chaves: [["emola_api_url", "URL"], ["emola_api_key", "Chave"], ["emola_api_secret", "Segredo"]] },
  { id: "banco", nome: "Banco", detalhe: "API bancária", chaves: [["banco_api_url", "URL"], ["banco_api_key", "Chave"]] },
  { id: "maps", nome: "Google Maps", detalhe: "Mapas e rotas", chaves: [["google_maps_api_key", "Chave"]] },
];

const vazioUser = () => ({
  nome: "", email: "", telefone: "", perfil: "Analista", estado: "Ativo", zona: "", senha: "", confirmar: "",
});

const Faixa = ({ titulo, sub, Icone, cor, cor2, forma, onVoltar, voltar }) => {
  const sobe = useRef(new Animated.Value(0)).current;
  const move = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(sobe, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const ciclo = Animated.loop(Animated.sequence([
      Animated.timing(move, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(move, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    ciclo.start();
    return () => ciclo.stop();
  }, [move, sobe]);
  const dx = move.interpolate({ inputRange: [0, 1], outputRange: [-14, 16] });
  return (
    <Animated.View style={[estilos.faixa, { backgroundColor: cor, opacity: sobe, transform: [{ translateY: sobe.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }]}>
      {forma === "onda" ? <Animated.View style={[estilos.corteOnda, { backgroundColor: cor2, transform: [{ translateX: dx }] }]} /> : null}
      {forma === "losango" ? <Animated.View style={[estilos.corteLosango, { backgroundColor: cor2, transform: [{ rotate: "45deg" }, { translateY: dx }] }]} /> : null}
      {forma !== "onda" && forma !== "losango" ? <Animated.View style={[estilos.corte, { backgroundColor: cor2, transform: [{ rotate: "-26deg" }, { translateX: dx }] }]} /> : null}
      <View style={estilos.corteBase} />
      <Pressable style={estilos.voltarFaixa} onPress={onVoltar}>
        <IconeVoltar size={16} color="#ffffff" />
        <Text style={estilos.voltarFaixaTexto}>{voltar}</Text>
      </Pressable>
      <View style={estilos.faixaLinha}>
        <View style={estilos.faixaIcone}><Icone size={22} color="#ffffff" /></View>
        <View style={estilos.faixaTexto}>
          <Text style={estilos.faixaTitulo}>{titulo}</Text>
          <Text style={estilos.faixaSub}>{sub}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const Campo = ({ rotulo, valor, onChange, seguro, teclado }) => (
  <View style={estilos.campoCaixa}>
    <Text style={estilos.rotulo}>{rotulo}</Text>
    <TextInput
      value={String(valor ?? "")}
      onChangeText={onChange}
      secureTextEntry={seguro}
      keyboardType={teclado || "default"}
      placeholderTextColor={cores.placeholder}
      style={estilos.campo}
    />
  </View>
);

const Escolha = ({ rotulo, valor, opcoes, onChange }) => (
  <View style={estilos.campoCaixa}>
    <Text style={estilos.rotulo}>{rotulo}</Text>
    <View style={estilos.chips}>
      {opcoes.map((opcao) => (
        <Pressable key={opcao} onPress={() => onChange(opcao)} style={[estilos.chip, valor === opcao && estilos.chipOn]}>
          <Text style={[estilos.chipTexto, valor === opcao && estilos.chipTextoOn]}>{opcao}</Text>
        </Pressable>
      ))}
    </View>
  </View>
);

const Interruptor = ({ titulo, texto, valor, onChange }) => (
  <View style={estilos.interruptor}>
    <View style={estilos.flex}>
      <Text style={estilos.itemTitulo}>{titulo}</Text>
      {texto ? <Text style={estilos.itemNota}>{texto}</Text> : null}
    </View>
    <Switch value={valor} onValueChange={onChange} trackColor={{ false: "#d7ddd9", true: "#8ed09a" }} thumbColor={valor ? cores.verde : "#f4f4f4"} />
  </View>
);

const Definicoes = ({ definicao, onVoltar, onAbrir }) => {
  const meta = SECCAO[definicao] || { titulo: "Definições", sub: "Tudo o que a versão web configura", Icone: IconeEngrenagem, cor: "#0f7a3c", cor2: "#86efac" };
  const vivos = usarDados();
  const [aviso, setAviso] = useState("");
  const [utilizadores, setUtilizadores] = useState([]);
  const [formUser, setFormUser] = useState(null);
  const [empresa, setEmpresa] = useState({
    nome_sistema: "",
    nome_empresa: "",
    endereco_empresa: "",
    telefone_empresa: "",
    email_empresa: "",
    nuit_empresa: "",
    moeda_padrao: "",
    idioma_padrao: "",
    fuso_horario: "",
    formato_data: "",
    logo: null,
  });
  const [perfis, setPerfis] = useState([
    { id: 1, nome: "Administrador", codigo: "ADMIN", descricao: "Acesso total ao sistema", permissoes: ["*"] },
    { id: 2, nome: "Gestor", codigo: "GESTOR", descricao: "Aprova crédito, despesas e relatórios", permissoes: ["clientes.ler", "clientes.criar", "emprestimos.ler", "emprestimos.aprovar", "pagamentos.ler", "relatorios.exportar", "configuracoes.ler"] },
    { id: 3, nome: "Analista", codigo: "ANALISTA", descricao: "Consulta e registo operacional", permissoes: ["clientes.ler", "clientes.criar", "emprestimos.ler", "emprestimos.criar", "pagamentos.ler", "pagamentos.criar"] },
    { id: 4, nome: "Cobrador", codigo: "COBRADOR", descricao: "Rotas e cobranças da sua zona", permissoes: ["cobrancas.ler", "cobrancas.criar", "pagamentos.criar", "clientes.ler"] },
  ]);
  const [perfilId, setPerfilId] = useState(1);
  const [zonas, setZonas] = useState([]);
  const [zonaForm, setZonaForm] = useState(null);
  const [tiposOff, setTiposOff] = useState([]);
  const [taxas, setTaxas] = useState({
    tipo_juros_padrao: "Simples",
    sistema_amortizacao_padrao: "Tabela Price",
    taxa_juros_padrao: "20",
    valor_minimo_emprestimo: "100",
    valor_maximo_emprestimo: "1000000",
    prazo_minimo_parcelas: "1",
    prazo_maximo_parcelas: "52",
    idade_minima_cliente: "18",
    idade_maxima_cliente: "70",
    score_minimo_aprovacao: "400",
    max_emprestimos_ativos: "2",
    garantia_obrigatoria_acima: "50000",
    aprovacao_gestor_acima: "100000",
    dias_carencia: "0",
    taxa_multa_atraso: "2",
    dias_para_penhor: "90",
    dias_para_execucao: "180",
    max_clientes_rota: "15",
    raio_max_cobranca_km: "20",
    meta_mensal_cobrador: "500000",
    comissao_cobrador: "5",
    dias_lembrete_antes: "3",
    dias_lembrete_apos: "1",
  });
  const [canais, setCanais] = useState({
    notificacoes_email_ativo: true,
    notificacoes_sms_ativo: true,
    notificacoes_push_ativo: true,
    notificacoes_whatsapp_ativo: false,
    email_smtp_host: "",
    email_smtp_port: "587",
    email_smtp_user: "",
    email_smtp_pass: "",
    sms_api_key: "",
    sms_api_secret: "",
    sms_sender_id: "NBMM",
  });
  const [seguranca, setSeguranca] = useState({
    min_caracteres_senha: "8",
    expiracao_senha_dias: "90",
    max_tentativas_login: "5",
    bloqueio_minutos: "30",
    sessao_expiracao_min: "60",
    backup_frequencia: "Diário",
    backup_hora: "02:00",
    requer_maiuscula: true,
    requer_minuscula: true,
    requer_numero: true,
    requer_simbolo: false,
    two_factor_obrigatorio: false,
    log_auditoria_ativo: true,
    backup_automatico: true,
  });
  const [auditoria, setAuditoria] = useState([]);
  useEffect(() => {
    if (vivos.origem !== "servidor") return;
    setUtilizadores(vivos.utilizadores || []);
    if (vivos.empresa) setEmpresa((atual) => ({ ...atual, ...vivos.empresa }));
    setAuditoria(vivos.auditoria || []);
  }, [vivos.origem, vivos.utilizadores, vivos.empresa, vivos.auditoria]);
  const [chaves, setChaves] = useState({
    mpesa_api_url: "", mpesa_api_key: "", mpesa_api_secret: "",
    emola_api_url: "", emola_api_key: "", emola_api_secret: "",
    banco_api_url: "", banco_api_key: "", google_maps_api_key: "",
  });
  const [ligacao, setLigacao] = useState({ mpesa: "Inativa", emola: "Inativa", banco: "Inativa", maps: "Inativa" });

  const registar = (accao, modulo) => {
    setAuditoria((lista) => [{ id: String(Date.now()), accao, modulo, por: "Sessão" }, ...lista].slice(0, 12));
  };

  const guardarUser = () => {
    const nome = formUser.nome.trim();
    if (!nome || !formUser.email.includes("@")) {
      setAviso("Indique o nome e um email válido.");
      return;
    }
    if (!formUser.id && formUser.senha !== formUser.confirmar) {
      setAviso("A confirmação da senha não coincide.");
      return;
    }
    if (formUser.perfil === "Cobrador" && !formUser.zona.trim()) {
      setAviso("O cobrador precisa de uma zona.");
      return;
    }
    setUtilizadores((lista) => (
      formUser.id
        ? lista.map((pessoa) => (pessoa.id === formUser.id ? { ...pessoa, ...formUser, nome } : pessoa))
        : [...lista, { ...formUser, id: String(Date.now()), nome }]
    ));
    registar(formUser.id ? "Actualizar utilizador" : "Criar utilizador", "Utilizadores");
    setFormUser(null);
    setAviso(formUser.id ? "Utilizador actualizado neste telemóvel." : "Utilizador criado neste telemóvel.");
  };

  const perfil = perfis.find((item) => item.id === perfilId) || perfis[0];
  const alternarPermissao = (codigo) => {
    if (perfil.permissoes.includes("*")) return;
    setPerfis((lista) => lista.map((item) => {
      if (item.id !== perfil.id) return item;
      const permissoes = item.permissoes.includes(codigo)
        ? item.permissoes.filter((atual) => atual !== codigo)
        : [...item.permissoes, codigo];
      return { ...item, permissoes };
    }));
  };

  const guardarZona = () => {
    if (!zonaForm.nome.trim() || !zonaForm.codigo.trim()) {
      setAviso("Indique o nome e o código da zona.");
      return;
    }
    setZonas((lista) => (
      zonaForm.id
        ? lista.map((zona) => (zona.id === zonaForm.id ? zonaForm : zona))
        : [...lista, { ...zonaForm, id: String(Date.now()) }]
    ));
    registar(zonaForm.id ? "Actualizar zona" : "Criar zona", "Zonas");
    setZonaForm(null);
    setAviso("Zona guardada neste telemóvel.");
  };

  const partilharCopia = async () => {
    const copia = { empresa, taxas, canais, seguranca, zonas, tiposOff, chaves };
    await Share.share({ message: JSON.stringify(copia, null, 2) });
    registar("Descarregar backup", "Backup");
    setAviso("A cópia foi preparada para partilha.");
  };

  return (
    <ScrollView style={estilos.scroll} contentContainerStyle={estilos.pagina} keyboardShouldPersistTaps="handled">
      <Faixa {...meta} forma={definicao === "cfg-identidade" ? "losango" : definicao === "cfg-backup" ? "onda" : "barra"} onVoltar={onVoltar} voltar={definicao ? "Definições" : "Home"} />
      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}

      {!definicao ? LISTA.map(([id, texto]) => {
        const item = SECCAO[id];
        const Icone = item.Icone;
        return (
          <Pressable key={id} style={estilos.cartao} onPress={() => { setAviso(""); onAbrir(id); }}>
            <View style={[estilos.icone, { backgroundColor: `${item.cor}18` }]}>
              <Icone size={18} color={item.cor} />
            </View>
            <View style={estilos.flex}>
              <Text style={estilos.itemTitulo}>{item.titulo}</Text>
              <Text style={estilos.itemNota}>{texto}</Text>
            </View>
            <IconeSeta size={16} color="#b0b6b3" />
          </Pressable>
        );
      }) : null}

      {definicao === "cfg-utilizadores" ? (
        <View style={estilos.bloco}>
          {utilizadores.map((pessoa, indice) => {
            const Icone = ICONES_PESSOA[indice % ICONES_PESSOA.length];
            const cor = CORES_PESSOA[indice % CORES_PESSOA.length];
            return (
              <View key={pessoa.id} style={estilos.pessoa}>
                <View style={[estilos.icone, { backgroundColor: `${cor}18` }]}><Icone size={18} color={cor} /></View>
                <View style={estilos.flex}>
                  <Text style={estilos.itemTitulo} numberOfLines={1}>{pessoa.nome}</Text>
                  <Text style={estilos.itemNota} numberOfLines={1}>{pessoa.perfil} · {pessoa.estado}</Text>
                  <Text style={estilos.itemNota} numberOfLines={1}>{pessoa.email}</Text>
                  {pessoa.telefone ? <Text style={estilos.itemNota} numberOfLines={1}>{pessoa.telefone}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {definicao === "cfg-identidade" ? (
        <View style={estilos.bloco}>
          {[
            [IconeEdificio, "Nome no ecrã", empresa.nome_sistema],
            [IconeDocumento, "Empresa", empresa.nome_empresa],
            [IconePin, "Endereço", empresa.endereco_empresa],
            [IconePessoa, "Telefone", empresa.telefone_empresa],
            [IconeEstrela, "Email", empresa.email_empresa],
            [IconeEscudo, "NUIT", empresa.nuit_empresa],
            [IconeMoeda, "Moeda", empresa.moeda_padrao],
            [IconeDocumento, "Idioma", empresa.idioma_padrao],
            [IconeBase, "Data", empresa.formato_data],
            [IconeMapa, "Fuso", empresa.fuso_horario],
          ].map(([Icone, rotulo, valor]) => (
            <View key={rotulo} style={estilos.pessoa}>
              <View style={[estilos.icone, { backgroundColor: "#dbeafe" }]}><Icone size={18} color="#1d4ed8" /></View>
              <View style={estilos.flex}>
                <Text style={estilos.itemNota}>{rotulo}</Text>
                <Text style={estilos.itemTitulo}>{valor}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {definicao === "cfg-perfis" ? (
        <View style={estilos.bloco}>
          <View style={estilos.chips}>
            {perfis.map((item) => (
              <Pressable key={item.id} onPress={() => setPerfilId(item.id)} style={[estilos.chip, perfilId === item.id && estilos.chipOn]}>
                <Text style={[estilos.chipTexto, perfilId === item.id && estilos.chipTextoOn]}>{item.nome}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={estilos.itemNota}>{perfil.descricao}</Text>
          {perfil.permissoes.includes("*") ? (
            <View style={estilos.pessoa}>
              <IconeEscudo size={18} color="#0f766e" />
              <Text style={estilos.itemTitulo}>Acesso total ao sistema</Text>
            </View>
          ) : MODULOS.map(([id, rotulo, Icone]) => (
            <View key={id} style={estilos.modulo}>
              <View style={estilos.faixaLinha}>
                <Icone size={16} color="#0f766e" />
                <Text style={estilos.itemTitulo}>{rotulo}</Text>
              </View>
              <View style={estilos.chips}>
                {ACCOES.map((accao) => {
                  const codigo = `${id}.${accao}`;
                  const ligado = perfil.permissoes.includes(codigo);
                  return (
                    <Pressable key={codigo} onPress={() => alternarPermissao(codigo)} style={[estilos.chip, ligado && estilos.chipOn]}>
                      <Text style={[estilos.chipTexto, ligado && estilos.chipTextoOn]}>{ROTULOS_ACCAO[accao]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {definicao === "cfg-zonas" ? (
        <View style={estilos.bloco}>
          {zonaForm ? (
            <View style={estilos.espaco}>
              <Campo rotulo="Nome" valor={zonaForm.nome} onChange={(valor) => setZonaForm({ ...zonaForm, nome: valor })} />
              <Campo rotulo="Código" valor={zonaForm.codigo} onChange={(valor) => setZonaForm({ ...zonaForm, codigo: valor.toUpperCase() })} />
              <Campo rotulo="Província" valor={zonaForm.provincia} onChange={(valor) => setZonaForm({ ...zonaForm, provincia: valor })} />
              <Campo rotulo="Distrito" valor={zonaForm.distrito} onChange={(valor) => setZonaForm({ ...zonaForm, distrito: valor })} />
              <Campo rotulo="Bairro" valor={zonaForm.bairro} onChange={(valor) => setZonaForm({ ...zonaForm, bairro: valor })} />
              <Campo rotulo="Responsável" valor={zonaForm.responsavel} onChange={(valor) => setZonaForm({ ...zonaForm, responsavel: valor })} />
              <Campo rotulo="Raio (km)" valor={zonaForm.raio} onChange={(valor) => setZonaForm({ ...zonaForm, raio: valor })} teclado="numeric" />
              <Escolha rotulo="Estado" valor={zonaForm.estado} opcoes={["Ativa", "Inativa"]} onChange={(valor) => setZonaForm({ ...zonaForm, estado: valor })} />
              <Pressable style={estilos.botao} onPress={guardarZona}><Text style={estilos.botaoTexto}>Guardar zona</Text></Pressable>
              <Pressable onPress={() => setZonaForm(null)}><Text style={estilos.link}>Cancelar</Text></Pressable>
            </View>
          ) : (
            <>
              {zonas.map((zona) => (
                <Pressable key={zona.id} style={estilos.pessoa} onPress={() => setZonaForm(zona)}>
                  <View style={[estilos.icone, { backgroundColor: "#e0f2fe" }]}><IconeMapa size={18} color="#0369a1" /></View>
                  <View style={estilos.flex}>
                    <Text style={estilos.itemTitulo}>{zona.nome}</Text>
                    <Text style={estilos.itemNota}>{zona.codigo} · {zona.distrito} · {zona.estado}</Text>
                  </View>
                </Pressable>
              ))}
              <Pressable style={estilos.botao} onPress={() => setZonaForm({ nome: "", codigo: "", provincia: "", distrito: "", bairro: "", responsavel: "", raio: "5", estado: "Ativa" })}>
                <Text style={estilos.botaoTexto}>Nova zona</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}

      {definicao === "cfg-tipos" ? (
        <View style={estilos.bloco}>
          {TIPOS.map(([id, titulo, detalhe], indice) => {
            const activo = !tiposOff.includes(id);
            const Icone = [IconeDocumento, IconePessoa, IconeCarteira, IconeEdificio, IconeMoeda, IconeBase, IconeAlerta][indice];
            return (
              <View key={id} style={estilos.pessoa}>
                <View style={[estilos.icone, { backgroundColor: "#ffedd5" }]}><Icone size={18} color="#9a3412" /></View>
                <View style={estilos.flex}>
                  <Text style={estilos.itemTitulo}>{titulo}</Text>
                  <Text style={estilos.itemNota}>{detalhe}</Text>
                </View>
                <Switch value={activo} onValueChange={() => setTiposOff((lista) => (activo ? [...lista, id] : lista.filter((item) => item !== id)))} trackColor={{ false: "#d7ddd9", true: "#fdba74" }} thumbColor={activo ? "#9a3412" : "#f4f4f4"} />
              </View>
            );
          })}
        </View>
      ) : null}

      {definicao === "cfg-taxas" ? (
        <View style={estilos.bloco}>
          <Text style={estilos.grupo}>Crédito</Text>
          <Escolha rotulo="Tipo de juros" valor={taxas.tipo_juros_padrao} opcoes={["Simples", "Composto"]} onChange={(valor) => setTaxas({ ...taxas, tipo_juros_padrao: valor })} />
          <Escolha rotulo="Amortização" valor={taxas.sistema_amortizacao_padrao} opcoes={["Tabela Price", "SAC", "Americano"]} onChange={(valor) => setTaxas({ ...taxas, sistema_amortizacao_padrao: valor })} />
          {TAXAS_CREDITO.map(([chave, rotulo]) => (
            <Campo key={chave} rotulo={rotulo} valor={taxas[chave]} teclado="numeric" onChange={(valor) => setTaxas({ ...taxas, [chave]: valor })} />
          ))}
          <Text style={estilos.grupo}>Cobrança</Text>
          {TAXAS_COBRANCA.map(([chave, rotulo]) => (
            <Campo key={chave} rotulo={rotulo} valor={taxas[chave]} teclado="numeric" onChange={(valor) => setTaxas({ ...taxas, [chave]: valor })} />
          ))}
          <Pressable style={estilos.botao} onPress={() => { registar("Guardar taxas", "Taxas"); setAviso("Taxas e regras guardadas neste telemóvel."); }}><Text style={estilos.botaoTexto}>Guardar taxas</Text></Pressable>
        </View>
      ) : null}

      {definicao === "cfg-notificacoes" ? (
        <View style={estilos.bloco}>
          <Interruptor titulo="Email" texto="Avisos pelo correio" valor={canais.notificacoes_email_ativo} onChange={(valor) => setCanais({ ...canais, notificacoes_email_ativo: valor })} />
          <Interruptor titulo="SMS" texto="Mensagens de texto" valor={canais.notificacoes_sms_ativo} onChange={(valor) => setCanais({ ...canais, notificacoes_sms_ativo: valor })} />
          <Interruptor titulo="Push" texto="Alertas no telemóvel" valor={canais.notificacoes_push_ativo} onChange={(valor) => setCanais({ ...canais, notificacoes_push_ativo: valor })} />
          <Interruptor titulo="WhatsApp" texto="Mensagens pelo WhatsApp" valor={canais.notificacoes_whatsapp_ativo} onChange={(valor) => setCanais({ ...canais, notificacoes_whatsapp_ativo: valor })} />
          <Campo rotulo="Servidor SMTP" valor={canais.email_smtp_host} onChange={(valor) => setCanais({ ...canais, email_smtp_host: valor })} />
          <Campo rotulo="Porta" valor={canais.email_smtp_port} teclado="numeric" onChange={(valor) => setCanais({ ...canais, email_smtp_port: valor })} />
          <Campo rotulo="Utilizador SMTP" valor={canais.email_smtp_user} onChange={(valor) => setCanais({ ...canais, email_smtp_user: valor })} />
          <Campo rotulo="Senha SMTP" valor={canais.email_smtp_pass} seguro onChange={(valor) => setCanais({ ...canais, email_smtp_pass: valor })} />
          <Campo rotulo="Chave da API de SMS" valor={canais.sms_api_key} onChange={(valor) => setCanais({ ...canais, sms_api_key: valor })} />
          <Campo rotulo="Segredo da API de SMS" valor={canais.sms_api_secret} seguro onChange={(valor) => setCanais({ ...canais, sms_api_secret: valor })} />
          <Campo rotulo="Remetente SMS" valor={canais.sms_sender_id} onChange={(valor) => setCanais({ ...canais, sms_sender_id: valor })} />
          <Pressable style={estilos.botao} onPress={() => {
            if (canais.notificacoes_email_ativo && !canais.email_smtp_host.trim()) {
              setAviso("Indique o servidor SMTP para activar o email.");
              return;
            }
            registar("Guardar notificações", "Notificações");
            setAviso("Notificações guardadas neste telemóvel.");
          }}><Text style={estilos.botaoTexto}>Guardar notificações</Text></Pressable>
        </View>
      ) : null}

      {definicao === "cfg-backup" ? (
        <View style={estilos.bloco}>
          {[
            ["requer_maiuscula", "Exige maiúscula"],
            ["requer_minuscula", "Exige minúscula"],
            ["requer_numero", "Exige número"],
            ["requer_simbolo", "Exige símbolo"],
            ["two_factor_obrigatorio", "2FA obrigatório"],
            ["log_auditoria_ativo", "Registo de auditoria"],
            ["backup_automatico", "Backup automático"],
          ].map(([chave, titulo]) => (
            <Interruptor key={chave} titulo={titulo} valor={seguranca[chave]} onChange={(valor) => setSeguranca({ ...seguranca, [chave]: valor })} />
          ))}
          <Campo rotulo="Mínimo de caracteres" valor={seguranca.min_caracteres_senha} teclado="numeric" onChange={(valor) => setSeguranca({ ...seguranca, min_caracteres_senha: valor })} />
          <Campo rotulo="Expiração da senha (dias)" valor={seguranca.expiracao_senha_dias} teclado="numeric" onChange={(valor) => setSeguranca({ ...seguranca, expiracao_senha_dias: valor })} />
          <Campo rotulo="Tentativas de login" valor={seguranca.max_tentativas_login} teclado="numeric" onChange={(valor) => setSeguranca({ ...seguranca, max_tentativas_login: valor })} />
          <Campo rotulo="Bloqueio (minutos)" valor={seguranca.bloqueio_minutos} teclado="numeric" onChange={(valor) => setSeguranca({ ...seguranca, bloqueio_minutos: valor })} />
          <Campo rotulo="Sessão (minutos)" valor={seguranca.sessao_expiracao_min} teclado="numeric" onChange={(valor) => setSeguranca({ ...seguranca, sessao_expiracao_min: valor })} />
          <Escolha rotulo="Frequência do backup" valor={seguranca.backup_frequencia} opcoes={["Diário", "Semanal", "Mensal"]} onChange={(valor) => setSeguranca({ ...seguranca, backup_frequencia: valor })} />
          <Campo rotulo="Hora do backup" valor={seguranca.backup_hora} onChange={(valor) => setSeguranca({ ...seguranca, backup_hora: valor })} />
          <Pressable style={estilos.botao} onPress={() => { registar("Guardar segurança", "Backup"); setAviso("Segurança actualizada neste telemóvel."); }}><Text style={estilos.botaoTexto}>Guardar segurança</Text></Pressable>
          <Pressable style={estilos.botaoClaro} onPress={partilharCopia}><Text style={estilos.botaoClaroTexto}>Descarregar cópia</Text></Pressable>
          <Text style={estilos.grupo}>Auditoria</Text>
          {auditoria.map((linha) => (
            <View key={linha.id} style={estilos.pessoa}>
              <IconeBase size={16} color="#1e3a8a" />
              <View style={estilos.flex}>
                <Text style={estilos.itemTitulo}>{linha.accao}</Text>
                <Text style={estilos.itemNota}>{linha.modulo} · {linha.por}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {definicao === "cfg-integracoes" ? (
        <View style={estilos.bloco}>
          {INTEGRACOES.map((item) => (
            <View key={item.id} style={estilos.modulo}>
              <View style={estilos.faixaLinha}>
                <IconeFicha size={16} color="#6d28d9" />
                <View style={estilos.flex}>
                  <Text style={estilos.itemTitulo}>{item.nome}</Text>
                  <Text style={estilos.itemNota}>{item.detalhe} · {ligacao[item.id]}</Text>
                </View>
              </View>
              {item.chaves.map(([chave, rotulo]) => (
                <Campo key={chave} rotulo={rotulo} valor={chaves[chave]} seguro={chave.endsWith("secret")} onChange={(valor) => setChaves({ ...chaves, [chave]: valor })} />
              ))}
              <Pressable style={estilos.botaoClaro} onPress={() => {
                const falta = item.chaves.some(([chave]) => !String(chaves[chave] || "").trim() && !chave.endsWith("secret"));
                setLigacao((atual) => ({ ...atual, [item.id]: falta ? "Erro" : "Ativa" }));
                setAviso(falta ? `${item.nome} precisa dos campos preenchidos.` : `${item.nome} ficou activa neste telemóvel.`);
              }}>
                <Text style={estilos.botaoClaroTexto}>Testar ligação</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
};

const estilos = StyleSheet.create({
  scroll: { flex: 1 },
  pagina: { paddingBottom: 28, gap: 10 },
  faixa: { minHeight: 156, overflow: "hidden", paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 },
  corte: { position: "absolute", width: 220, height: 120, left: -40, top: -30 },
  corteLosango: { position: "absolute", width: 120, height: 120, right: -20, top: 10 },
  corteOnda: { position: "absolute", width: 240, height: 90, borderRadius: 80, right: -30, bottom: -20, opacity: 0.7 },
  corteBase: { position: "absolute", left: 0, right: 0, bottom: -28, height: 56, backgroundColor: "#f4f8f5", transform: [{ rotate: "-4deg" }] },
  voltarFaixa: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  voltarFaixaTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "700" },
  faixaLinha: { flexDirection: "row", alignItems: "center", gap: 12 },
  faixaIcone: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
  faixaTexto: { flex: 1 },
  faixaTitulo: { color: "#ffffff", fontFamily: fonte, fontSize: 22, fontWeight: "800" },
  faixaSub: { color: "rgba(255,255,255,0.86)", fontFamily: fonte, marginTop: 2 },
  aviso: { fontFamily: fonte, color: cores.verdeEscuro, fontWeight: "700", marginHorizontal: 16 },
  cartao: { backgroundColor: cores.branco, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16 },
  icone: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  itemTitulo: { fontFamily: fonte, color: cores.titulo, fontWeight: "700" },
  itemNota: { fontFamily: fonte, color: cores.texto, fontSize: 12, marginTop: 2 },
  bloco: { gap: 8, marginHorizontal: 16 },
  espaco: { gap: 8 },
  campoCaixa: { gap: 4 },
  rotulo: { fontFamily: fonte, color: "#5f6662", fontSize: 12, fontWeight: "700" },
  campo: { backgroundColor: cores.branco, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonte, color: cores.titulo },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { backgroundColor: cores.branco, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  chipOn: { backgroundColor: cores.verde },
  chipTexto: { fontFamily: fonte, color: cores.titulo, fontSize: 12, fontWeight: "700" },
  chipTextoOn: { color: "#ffffff" },
  interruptor: { backgroundColor: cores.branco, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  pessoa: { backgroundColor: cores.branco, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  botao: { backgroundColor: cores.verde, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  botaoTexto: { color: "#ffffff", fontFamily: fonte, fontWeight: "800" },
  botaoClaro: { borderWidth: 1, borderColor: cores.verdeBorda, borderRadius: 14, paddingVertical: 12, alignItems: "center", backgroundColor: cores.branco },
  botaoClaroTexto: { color: cores.verdeEscuro, fontFamily: fonte, fontWeight: "800" },
  link: { fontFamily: fonte, color: cores.texto, textAlign: "center", fontWeight: "700" },
  logo: { backgroundColor: cores.branco, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  modulo: { backgroundColor: cores.branco, borderRadius: 16, padding: 12, gap: 8 },
  grupo: { fontFamily: fonte, fontWeight: "800", color: cores.titulo, marginTop: 6 },
});

export default Definicoes;
