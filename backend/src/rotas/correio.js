import { Router } from "express";
import { autenticar } from "../middleware/autenticacao.js";
import { Configuracao } from "../modelos/colecoes.js";
import { enviarCorreio, verificarCorreio } from "../servicos/correio.js";

const router = Router();
const CHAVE = "microcredito-config-v1";

router.post("/verificar", autenticar, async (req, res) => {
  try {
    const parcial = req.body || {};
    if (Object.keys(parcial).length) {
      const actual = (await Configuracao.findByPk(CHAVE))?.valor || {};
      const seguinte = { ...actual, ...parcial };
      if (!parcial.email_smtp_pass) seguinte.email_smtp_pass = actual.email_smtp_pass || "";
      await Configuracao.upsert({ chave: CHAVE, valor: seguinte });
    }
    const servidor = await verificarCorreio();
    res.json({ ok: true, host: servidor.host, port: servidor.port });
  } catch (erro) {
    res.status(400).json({ mensagem: erro.message });
  }
});

router.post("/enviar", autenticar, async (req, res) => {
  try {
    const resultado = await enviarCorreio({
      para: req.body?.para,
      assunto: req.body?.assunto,
      mensagem: req.body?.mensagem,
    });
    res.json(resultado);
  } catch (erro) {
    res.status(400).json({ mensagem: erro.message });
  }
});

export default router;
