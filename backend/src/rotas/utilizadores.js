import { Router } from "express";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { Utilizador } from "../modelos/utilizador.js";
import { autenticar } from "../middleware/autenticacao.js";
import { lerPolitica, validarSenhaPolitica } from "../servicos/politica.js";

const router = Router();

const PERFIS = {
  Administrador: "admin",
  Gestor: "supervisor",
  Analista: "subscricao",
  Cobrador: "agente",
};

const rotuloPerfil = (tipo) => Object.entries(PERFIS).find(([, valor]) => valor === tipo)?.[0] || "Analista";

const telefoneOk = (valor) => /^(\+258)?8[2-7]\d{7}$/.test(String(valor || "").replace(/\s/g, ""));
const emailOk = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor || "").trim());

const publico = (linha) => ({
  id: linha.id,
  nome_completo: linha.nome,
  email: linha.email,
  telefone: linha.telefone || "",
  perfil: linha.perfil || rotuloPerfil(linha.tipo),
  zona_id: linha.zona_id || "",
  status: linha.estado || (linha.activo ? "Ativo" : "Inativo"),
  observacoes: linha.observacoes || "",
  foto_perfil: linha.foto_perfil || "",
  tipo: linha.tipo,
});

const soAdmin = (req, res, next) => {
  if (req.utilizador?.tipo !== "admin") {
    return res.status(403).json({ mensagem: "Só um administrador pode gerir utilizadores." });
  }
  return next();
};

const outrosAdminsActivos = (id) => Utilizador.count({
  where: { tipo: "admin", activo: true, id: { [Op.ne]: id } },
});

const lerCorpo = (body, edicao, politica = {}) => {
  const nome = String(body.nome_completo || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const telefone = String(body.telefone || "").replace(/\s/g, "");
  const perfil = String(body.perfil || "");
  const status = String(body.status || "Ativo");
  const senha = String(body.senha || "");
  const confirmar = String(body.confirmar || "");
  if (nome.length < 3 || nome.length > 200) return { erro: "O nome deve ter entre 3 e 200 caracteres." };
  if (!emailOk(email)) return { erro: "Email inválido." };
  if (telefone && !telefoneOk(telefone)) return { erro: "Use um telefone moçambicano (Ex: 84xxxxxxx)." };
  if (!PERFIS[perfil]) return { erro: "Seleccione um perfil válido." };
  if (!["Ativo", "Inativo", "Suspenso"].includes(status)) return { erro: "Estado inválido." };
  if (perfil === "Cobrador" && !String(body.zona_id || "").trim()) return { erro: "O cobrador precisa de uma zona." };
  if (!edicao || senha || confirmar) {
    const falhaSenha = validarSenhaPolitica(senha, politica);
    if (falhaSenha) return { erro: falhaSenha };
    if (senha !== confirmar) return { erro: "A confirmação da senha não coincide." };
  }
  return {
    nome,
    email,
    telefone,
    perfil,
    tipo: PERFIS[perfil],
    zona_id: body.zona_id ? String(body.zona_id) : null,
    estado: status,
    activo: status === "Ativo",
    observacoes: String(body.observacoes || ""),
    foto_perfil: body.foto_perfil || null,
    senha,
  };
};

router.use(autenticar, soAdmin);

router.get("/", async (_req, res) => {
  const linhas = await Utilizador.findAll({ order: [["nome", "ASC"]] });
  res.json(linhas.map(publico));
});

router.post("/", async (req, res) => {
  const dados = lerCorpo(req.body, false, await lerPolitica());
  if (dados.erro) return res.status(400).json({ mensagem: dados.erro });
  const duplicado = await Utilizador.findOne({
    where: { [Op.or]: [{ nome: dados.nome }, { email: dados.email }, { nome_utilizador: dados.nome }] },
  });
  if (duplicado?.email === dados.email) return res.status(400).json({ mensagem: "Já existe um utilizador com este email." });
  if (duplicado) return res.status(400).json({ mensagem: "Já existe um utilizador com este nome. O nome é usado para entrar no sistema." });
  const criado = await Utilizador.create({
    nome_utilizador: dados.nome,
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    senha_hash: await bcrypt.hash(dados.senha, 10),
    tipo: dados.tipo,
    perfil: dados.perfil,
    zona_id: dados.zona_id,
    estado: dados.estado,
    observacoes: dados.observacoes,
    foto_perfil: dados.foto_perfil,
    activo: dados.activo,
  });
  return res.status(201).json(publico(criado));
});

router.put("/:id", async (req, res) => {
  const linha = await Utilizador.findByPk(req.params.id);
  if (!linha) return res.status(404).json({ mensagem: "Utilizador não encontrado." });
  const dados = lerCorpo(req.body, true, await lerPolitica());
  if (dados.erro) return res.status(400).json({ mensagem: dados.erro });
  const duplicado = await Utilizador.findOne({
    where: {
      id: { [Op.ne]: linha.id },
      [Op.or]: [{ nome: dados.nome }, { email: dados.email }, { nome_utilizador: dados.nome }],
    },
  });
  if (duplicado?.email === dados.email) return res.status(400).json({ mensagem: "Já existe um utilizador com este email." });
  if (duplicado) return res.status(400).json({ mensagem: "Já existe um utilizador com este nome. O nome é usado para entrar no sistema." });
  const deixaDeSerAdmin = linha.tipo === "admin" && linha.activo && (dados.tipo !== "admin" || !dados.activo);
  if (deixaDeSerAdmin && (await outrosAdminsActivos(linha.id)) === 0) {
    return res.status(400).json({ mensagem: "Tem de permanecer pelo menos um administrador activo." });
  }
  linha.nome = dados.nome;
  linha.nome_utilizador = dados.nome;
  linha.email = dados.email;
  linha.telefone = dados.telefone;
  linha.tipo = dados.tipo;
  linha.perfil = dados.perfil;
  linha.zona_id = dados.zona_id;
  linha.estado = dados.estado;
  linha.activo = dados.activo;
  linha.observacoes = dados.observacoes;
  if (dados.foto_perfil) linha.foto_perfil = dados.foto_perfil;
  if (dados.senha) linha.senha_hash = await bcrypt.hash(dados.senha, 10);
  await linha.save();
  return res.json(publico(linha));
});

router.delete("/:id", async (req, res) => {
  const linha = await Utilizador.findByPk(req.params.id);
  if (!linha) return res.status(404).json({ mensagem: "Utilizador não encontrado." });
  if (Number(linha.id) === Number(req.utilizador.id)) {
    return res.status(400).json({ mensagem: "Não pode remover a conta com que está ligado." });
  }
  if (linha.tipo === "admin" && linha.activo && (await outrosAdminsActivos(linha.id)) === 0) {
    return res.status(400).json({ mensagem: "Não pode remover o único administrador activo." });
  }
  await linha.destroy();
  return res.json({ ok: true });
});

export default router;
