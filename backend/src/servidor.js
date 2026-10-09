import "dotenv/config";
import express from "express";
import cors from "cors";
import { criarBase, sequelize } from "./config/baseDados.js";
import { sincronizarTabelas } from "./modelos/colecoes.js";
import { semearAdmin, semearAdminTeste } from "./modelos/utilizador.js";
import rotasAutenticacao from "./rotas/autenticacao.js";
import rotasSincronizar from "./rotas/sincronizar.js";
import rotasCorreio from "./rotas/correio.js";
import rotasUtilizadores from "./rotas/utilizadores.js";

const dominio = String(process.env.DOMINIO || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const origensPermitidas = [
  "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174",
  "http://localhost:5175", "http://127.0.0.1:5175",
  "http://102.222.88.49", "http://102.222.88.49:5173", "http://102.222.88.49:4173",
  "http://192.168.110.149:5173", "http://192.168.110.149:5174", "http://192.168.110.149:4173",
  "https://mukuyure.com", "https://www.mukuyure.com", "https://app.mukuyure.com",
  "http://148.230.115.150", "https://148-230-115-150.sslip.io",
  ...(dominio ? [`https://${dominio}`, `http://${dominio}`] : []),
  ...String(process.env.CORS_ORIGENS || "").split(",").map((o) => o.trim()).filter(Boolean),
];

if (process.env.NODE_ENV === "production" && !process.env.JWT_SEGREDO) {
  console.error("Defina JWT_SEGREDO nas variáveis de ambiente antes de arrancar em produção.");
  process.exit(1);
}

const app = express();
app.use(cors({
  origin: origensPermitidas,
  credentials: true,
}));
app.use(express.json({ limit: "30mb" }));

app.get("/api/saude", (_req, res) => res.json({ ok: true, servico: "microcredito" }));
app.use("/api/autenticacao", rotasAutenticacao);
app.use("/api/correio", rotasCorreio);
app.use("/api/utilizadores", rotasUtilizadores);
app.use("/api", rotasSincronizar);

const porta = Number(process.env.PORTA || 3000);

try {
  await criarBase();
  await sequelize.authenticate();
  await sincronizarTabelas();
  await semearAdmin();
  // A conta fictícia de testes só existe se SEMEAR_ADMIN_TESTE não for "false" (desligue-a em produção).
  if (String(process.env.SEMEAR_ADMIN_TESTE ?? "true").toLowerCase() !== "false") await semearAdminTeste();
  const servidor = app.listen(porta, "0.0.0.0", () => {
    console.log(`API do microcrédito em http://0.0.0.0:${porta}`);
  });
  servidor.on("error", (erro) => {
    if (erro.code === "EADDRINUSE") {
      console.error(`A porta ${porta} já está em uso.`);
    } else {
      console.error(erro.message);
    }
    process.exit(1);
  });
} catch (erro) {
  console.error("Não foi possível ligar ao MySQL.");
  console.error(erro.message);
  process.exit(1);
}
