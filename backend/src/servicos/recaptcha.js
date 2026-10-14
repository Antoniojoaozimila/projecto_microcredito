const ePedidoWeb = (req) => {
  const origem = String(req.headers.origin || req.headers.referer || "");
  return /nbmm\.tech|localhost|127\.0\.0\.1/i.test(origem);
};

export const validarRecaptcha = async (req) => {
  const secret = String(process.env.RECAPTCHA_SECRET || "").trim();
  if (!secret) return "";
  if (!ePedidoWeb(req)) return "";
  const token = String(req.body?.recaptchaToken || "").trim();
  if (!token) return "Marque a caixa “Não sou um robô” antes de entrar.";
  try {
    const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
    const corpo = new URLSearchParams({ secret, response: token });
    if (ip) corpo.set("remoteip", ip);
    const resposta = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpo,
    });
    const dados = await resposta.json();
    if (dados?.success) return "";
    return "A verificação anti-robô falhou. Actualize a página e tente novamente.";
  } catch {
    return "Não foi possível validar o reCAPTCHA. Tente novamente.";
  }
};
