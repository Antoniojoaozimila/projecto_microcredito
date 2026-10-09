import { useState, useContext, useEffect, useMemo, useRef } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { HiOutlineLogin } from "react-icons/hi";
import ReCAPTCHA from "react-google-recaptcha";
import heroSrc from "../../assets/imagem.png";
import logoSrc from "../../assets/logo-claro.png";
import { useMarca } from "../../services/marcaSistema";
import { carregarMarcaPublica } from "../../services/ponteServidor";
import SupportContact from "../SupportContact/SupportContact";
import SupportModal from "../SupportModal/SupportModal";
import {
  sanitizeFullName,
  sanitizeFullNameInput,
  sanitizePassword,
  isValidFullName,
  isValidPassword,
  getLockRemainingMs,
  registerLoginFailure,
  registerLoginSuccess,
  formatLockTime,
  wasSubmittedTooFast,
  isHoneypotTriggered,
  GENERIC_LOGIN_ERROR,
  LOGIN_LIMITS,
} from "../../utils/loginSecurity";
import "./Login.css";

// Desativado temporariamente: a chave só é válida no domínio registado no Google.
// Voltar a colocar em `true` depois de configurar o domínio.
const RECAPTCHA_ENABLED = false;
const RECAPTCHA_SITE_KEY = "6LefTLstAAAAANiDhBTqkaqP9jTXAyhV0T4VdP0D";
const REMEMBER_KEY = "microcredito-remember-email";

const LoginBubbles = ({ variant }) => {
  const bubbles = useMemo(
    () =>
      Array.from({ length: variant === "photo" ? 16 : 14 }, (_, i) => ({
        id: `${variant}-${i}`,
        left: `${(i * 17 + (variant === "photo" ? 3 : 8)) % 94}%`,
        size: 6 + ((i * 3) % 5) * 3,
        duration: 10 + (i % 7) * 1.7,
        delay: -i * 0.9,
        drift: i % 2 === 0 ? 16 : -18,
      })),
    [variant]
  );

  return (
    <div className={`login-bubbles login-bubbles--${variant}`} aria-hidden="true">
      {bubbles.map((bubble) => (
        <span
          key={bubble.id}
          style={{
            left: bubble.left,
            width: bubble.size,
            height: bubble.size,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
            "--drift": `${bubble.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

const readRememberedName = () => {
  try {
    const value = localStorage.getItem(REMEMBER_KEY) || "";
    return value.includes("@") ? "" : value;
  } catch {
    return "";
  }
};

const Login = () => {
  const marca = useMarca();
  const { usuario, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const formStartedAt = useRef(Date.now());
  const submittingRef = useRef(false);

  const [username, setUsername] = useState(readRememberedName);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => Boolean(readRememberedName()));
  const [activeField, setActiveField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formError, setFormError] = useState("");
  const [lockMs, setLockMs] = useState(() => getLockRemainingMs());
  const [supportOpen, setSupportOpen] = useState(false);

  const isLocked = lockMs > 0;
  const fieldsDisabled = isLocked || loading;

  useEffect(() => {
    carregarMarcaPublica();
  }, []);

  useEffect(() => {
    document.title = marca.nome;
  }, [marca.nome]);

  useEffect(() => {
    if (window.top !== window.self) {
      try {
        window.top.location = window.self.location;
      } catch {
        document.body.innerHTML = "";
      }
    }
  }, []);

  useEffect(() => {
    if (lockMs <= 0) return undefined;
    const tick = window.setInterval(() => {
      const remaining = getLockRemainingMs();
      setLockMs(remaining);
      if (remaining <= 0) window.clearInterval(tick);
    }, 250);
    return () => window.clearInterval(tick);
  }, [lockMs]);

  useEffect(() => {
    if (usuario) {
      navigate("/imperial/dashboard/home", { replace: true });
    }
  }, [usuario, navigate]);

  const resetRecaptcha = () => {
    recaptchaRef.current?.reset();
    setRecaptchaToken(null);
  };

  const handleRemember = (checked) => {
    setRemember(checked);
    if (!checked) {
      try {
        localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore */
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (submittingRef.current || loading || isLocked) return;

    const nomeTentativa = sanitizeFullName(username);
    const senhaTentativa = sanitizePassword(password).trim();
    const honeypotPreenchido =
      isHoneypotTriggered(honeypot) &&
      honeypot.trim() !== nomeTentativa &&
      honeypot.trim() !== senhaTentativa;

    if (honeypotPreenchido || wasSubmittedTooFast(formStartedAt.current)) {
      setFormError(GENERIC_LOGIN_ERROR);
      resetRecaptcha();
      return;
    }

    if (RECAPTCHA_ENABLED && !recaptchaToken) {
      setRecaptchaError(true);
      return;
    }

    const nome = nomeTentativa;
    const senha = senhaTentativa;

    if (!isValidFullName(nome) || !isValidPassword(senha)) {
      setFormError(GENERIC_LOGIN_ERROR);
      resetRecaptcha();
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      await login(nome, senha, recaptchaToken || "");
      registerLoginSuccess();
      setLockMs(0);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, nome);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore */
      }
    } catch (erro) {
      const vindoDaApi = erro?.response?.data?.mensagem;
      if (!vindoDaApi && erro?.message && erro.message !== "Sessão inválida") {
        setFormError("A ligação ao servidor demorou demais. Tente novamente.");
        setPassword("");
        resetRecaptcha();
        return;
      }
      const result = registerLoginFailure();
      setLockMs(result.remainingMs);
      setFormError(
        result.locked
          ? `Muitas tentativas. Aguarde ${formatLockTime(result.remainingMs)}.`
          : GENERIC_LOGIN_ERROR
      );
      setPassword("");
      resetRecaptcha();
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="login-shell notranslate">
      <section className="login-visual" aria-hidden="true">
        <img src={heroSrc} alt="" className="login-visual-fill" />
        <img src={heroSrc} alt="" className="login-visual-photo" />
        <LoginBubbles variant="photo" />
      </section>

      <main className="login-panel">
        <svg
          className="login-panel-shape"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#f4faf6"
            d="M16,0 C2,24 12,46 4,68 C0,82 10,94 16,100 L100,100 L100,0 Z"
          />
        </svg>

        <LoginBubbles variant="panel" />

        <div className="login-leaves" aria-hidden="true">
          <svg className="login-leaf login-leaf--tr" viewBox="0 0 240 260">
            <path
              d="M168 18c28 18 46 52 42 86-18-8-34-28-42-52 8 22 10 48 2 72-16-6-30-22-38-42 6 28 2 54-12 74-20-18-30-46-28-74 2-36 28-70 76-64z"
              fill="#6fbf45"
            />
            <path
              d="M196 36c22 26 24 62 8 90-14-20-18-46-10-72 2 24-2 46-14 64-10-16-14-36-12-56 4-22 16-40 28-26z"
              fill="#3e9a4a"
            />
            <path
              d="M214 78c16 18 14 42 2 60-10-14-12-32-6-48 0 16-6 30-14 40-6-12-8-26-4-40 6-10 14-18 22-12z"
              fill="#8ed14f"
            />
            <path
              d="M150 8c8 22 4 42-6 58-8-16-8-34-2-52 2-4 5-6 8-6z"
              fill="#2f8f46"
            />
          </svg>
          <svg className="login-leaf login-leaf--bl" viewBox="0 0 220 180">
            <path
              d="M28 150c18-40 58-78 104-96-28 22-48 52-54 86 20-28 48-46 78-52-36 20-62 52-74 88 16-20 38-32 62-36-40 16-70 42-86 74-12-20-20-42-30-64z"
              fill="#5cb85c"
            />
            <path
              d="M46 132c22-24 52-40 82-46-24 10-42 28-50 50 14-12 32-18 50-18-22 8-40 24-50 46-10-10-20-22-32-32z"
              fill="#2f8a45"
            />
          </svg>
        </div>

        <div className="login-panel-scroll">
          <div className="login-panel-inner">
            <img
              src={marca.logo || logoSrc}
              alt={marca.nome}
              className="login-brand"
            />

            <section className="login-card">
              <header className="login-card-head">
                <h1>Bem-vindo(a)!</h1>
                <p>Acesse a sua conta para continuar.</p>
              </header>

              <form className="login-form" onSubmit={handleSubmit} autoComplete="on" noValidate>
                <div className="login-hp" aria-hidden="true">
                  <label htmlFor="login-company-website">Website</label>
                  <input
                    id="login-company-website"
                    name="company_website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="new-password"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {isLocked && (
                  <p className="login-alert" role="alert">
                    Acesso temporariamente bloqueado. Tente novamente em {formatLockTime(lockMs)}.
                  </p>
                )}

                {formError && !isLocked && (
                  <p className="login-alert" role="alert">
                    {formError}
                  </p>
                )}

                <div className={`login-field${activeField === "username" ? " is-focused" : ""}`}>
                  <label className="login-sr" htmlFor="login-nome">
                    Nome completo
                  </label>
                  <span className="login-field-icon" aria-hidden="true">
                    <FaUser />
                  </span>
                  <input
                    id="login-nome"
                    name="nome"
                    type="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    spellCheck={false}
                    maxLength={LOGIN_LIMITS.NAME_MAX}
                    placeholder="Nome completo"
                    required
                    disabled={fieldsDisabled}
                    value={username}
                    onChange={(e) => setUsername(sanitizeFullNameInput(e.target.value))}
                    onFocus={() => setActiveField("username")}
                    onBlur={() => setActiveField(null)}
                  />
                </div>

                <div className={`login-field${activeField === "password" ? " is-focused" : ""}`}>
                  <label className="login-sr" htmlFor="login-password">
                    Senha de acesso
                  </label>
                  <span className="login-field-icon" aria-hidden="true">
                    <FaLock />
                  </span>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={LOGIN_LIMITS.PASSWORD_MAX}
                    placeholder="Senha de acesso"
                    required
                    disabled={fieldsDisabled}
                    value={password}
                    onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                    onFocus={() => setActiveField("password")}
                    onBlur={() => setActiveField(null)}
                  />
                  <button
                    type="button"
                    className="login-eye"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={fieldsDisabled}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <div className="login-options">
                  <label className="login-remember">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => handleRemember(e.target.checked)}
                    />
                    <span>Lembrar-me</span>
                  </label>
                  <button
                    type="button"
                    className="login-forgot"
                    onClick={() => setSupportOpen(true)}
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {RECAPTCHA_ENABLED && (
                <div className={`login-recaptcha${recaptchaError ? " has-error" : ""}`}>
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={RECAPTCHA_SITE_KEY}
                    hl="pt"
                    isolated
                    onChange={(token) => {
                      setRecaptchaToken(token);
                      setRecaptchaError(false);
                    }}
                    onExpired={() => {
                      setRecaptchaToken(null);
                      setRecaptchaError(true);
                    }}
                    onErrored={() => {
                      setRecaptchaToken(null);
                      setRecaptchaError(true);
                    }}
                  />
                  {recaptchaError && (
                    <p className="login-alert" role="alert">
                      Marque a caixa “Não sou um robô” antes de entrar.
                    </p>
                  )}
                </div>
                )}

                <button type="submit" className="login-submit" disabled={loading || isLocked}>
                  <HiOutlineLogin aria-hidden="true" />
                  <span>{loading ? "A entrar…" : "Aceder ao Sistema"}</span>
                </button>
              </form>

              <div className="login-alt">
                <span>Contacte o suporte através de</span>
              </div>

              <SupportContact variant="login" />

              <footer className="login-foot">
                <p className="login-foot-line">
                  <span>© {new Date().getFullYear()} | {marca.nome}</span>
                  <span className="login-foot-dot" aria-hidden="true">
                    ·
                  </span>
                  <span className="login-foot-tag">Juntos pelo desenvolvimento</span>
                </p>
                <a
                  className="login-credit"
                  href="https://saviltech.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Criado pela SavilTech &amp; Serviços LDA
                </a>
              </footer>
            </section>
          </div>
        </div>
      </main>

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
};

export default Login;
