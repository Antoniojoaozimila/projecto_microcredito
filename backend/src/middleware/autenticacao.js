import jwt from "jsonwebtoken";

export const autenticar = (req, res, next) => {
  const cabecalho = req.headers.authorization || "";
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : "";
  if (!token) return res.status(401).json({ mensagem: "Sessão em falta." });
  try {
    req.utilizador = jwt.verify(token, process.env.JWT_SEGREDO || "microcredito-local-segredo-2026");
    return next();
  } catch {
    return res.status(401).json({ mensagem: "Sessão inválida ou expirada." });
  }
};
