import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCoffee } from "react-icons/fi";
import "./Legal.css";

const Cookies = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page" id="cookies">
      <button type="button" className="legal-back" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Voltar
      </button>
      <header className="legal-header">
        <FiCoffee className="legal-header-icon" />
        <div>
          <h1 className="legal-title">Cookies</h1>
          <p className="legal-subtitle">Sistema de Microcrédito · Setembro de 2026</p>
        </div>
      </header>
      <div className="legal-content">
        <section className="legal-section">
          <h2>1. O que guardamos</h2>
          <p>
            O sistema usa cookies e armazenamento local apenas para manter a sessão depois do login, recordar o nome
            quando escolhe “Lembrar-me” e guardar preferências de ecrã, como o menu lateral aberto ou fechado.
          </p>
        </section>
        <section className="legal-section">
          <h2>2. Para que servem</h2>
          <p>
            Sem estes dados o acesso teria de ser repetido em cada página e o reCAPTCHA não conseguiria confirmar que
            a entrada é feita por uma pessoa. Não usamos cookies para publicidade nem para seguir a navegação fora
            do Sistema de Microcrédito.
          </p>
        </section>
        <section className="legal-section">
          <h2>3. Quanto tempo ficam</h2>
          <p>
            A sessão termina ao sair ou quando o browser a apaga. O nome recordado permanece até desmarcar a opção ou
            limpar os dados do site. Pode apagar estes registos nas definições do browser; nesse caso será preciso
            iniciar sessão outra vez.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Cookies;
