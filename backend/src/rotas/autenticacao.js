import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { Utilizador } from "../modelos/utilizador.js";
import { autenticar } from "../middleware/autenticacao.js";
import { lerPolitica, minutosSessao, validarSenhaPolitica } from "../servicos/politica.js";

const router = Router();
const segredo = () => process.env.JWT_SEGREDO || "microcredito-local-segredo-2026";

const tokenDe = (utilizador, minutos) => jwt.sign({
  id: utilizador.id,
  nome: utilizador.nome,
  email: utilizador.email,
  tipo: utilizador.tipo,
}, segredo(), { expiresIn: `${minutos}m` });

router.post("/entrar", async (req, res) => {
  const identificador = String(req.body?.nome || req.body?.utilizador || "").trim();
  const senha = String(req.body?.senha || "");
  if (!identificador || !senha) return res.status(400).json({ mensagem: "Indique o utilizador e a senha." });
  const utilizador = await Utilizador.findOne({
    where: {
      [Op.or]: [{ nome_utilizador: identificador }, { nome: identificador }, { email: identificador }],
      activo: true,
    },
  });
  if (!utilizador || !(await bcrypt.compare(senha, utilizador.senha_hash))) {
    return res.status(401).json({ mensagem: "Utilizador ou senha incorrectos." });
  }
  const politica = await lerPolitica();
  return res.json({
    token: tokenDe(utilizador, minutosSessao(politica)),
    tipo: utilizador.tipo,
    nome: utilizador.nome,
    email: utilizador.email,
  });
});

router.put("/senha", autenticar, async (req, res) => {
  const senhaActual = String(req.body?.senhaActual || "");
  const novaSenha = String(req.body?.novaSenha || "");
  const politica = await lerPolitica();
  const falhaSenha = validarSenhaPolitica(novaSenha, politica);
  if (falhaSenha) return res.status(400).json({ mensagem: falhaSenha });
  const utilizador = await Utilizador.findByPk(req.utilizador.id);
  if (!utilizador || !(await bcrypt.compare(senhaActual, utilizador.senha_hash))) {
    return res.status(400).json({ mensagem: "A senha actual não confere." });
  }
  utilizador.senha_hash = await bcrypt.hash(novaSenha, 10);
  await utilizador.save();
  return res.json({ ok: true });
});

export default router;
