import { Router } from "express";
import { autenticar } from "../middleware/autenticacao.js";
import { lerTudo, guardarColecao } from "../servicos/sincronizacao.js";
import { Configuracao } from "../modelos/colecoes.js";

const router = Router();

// Pública: a tela de login precisa do nome e logo antes de haver sessão.
router.get("/marca", async (_req, res) => {
  const linha = await Configuracao.findOne({ where: { chave: "microcredito-marca-v1" } });
  let valor = linha?.valor || {};
  if (typeof valor === "string") {
    try { valor = JSON.parse(valor); } catch { valor = {}; }
  }
  res.json({
    nome: valor.nome || "",
    logo: valor.logo || "",
    favicon: valor.favicon || "",
  });
});

router.get("/sincronizar", autenticar, async (_req, res) => {
  res.json({ colecoes: await lerTudo() });
});

router.put("/sincronizar/:chave", autenticar, async (req, res) => {
  const chave = decodeURIComponent(req.params.chave);
  if (!chave.startsWith("microcredito-")) return res.status(400).json({ mensagem: "Coleção desconhecida." });
  const valor = await guardarColecao(chave, req.body);
  res.json({ ok: true, valor });
});

export default router;
