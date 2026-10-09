import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiShield } from "react-icons/fi";
import "./Legal.css";

const Privacidade = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page" id="politica-privacidade">
      <button type="button" className="legal-back" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Voltar
      </button>
      <header className="legal-header">
        <FiShield className="legal-header-icon" />
        <div>
          <h1 className="legal-title">Política de Privacidade</h1>
          <p className="legal-subtitle">Sistema de Microcrédito · Setembro de 2026</p>
        </div>
      </header>
      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Introdução</h2>
          <p>
            Esta política explica como o Sistema de Microcrédito trata os dados pessoais de clientes, cobradores e
            utilizadores internos. O tratamento serve a concessão de crédito, a gestão de carteiras, o registo de
            pagamentos e a cobrança de parcelas.
          </p>
        </section>
        <section className="legal-section">
          <h2>2. Dados que tratamos</h2>
          <p>
            Recolhemos o nome completo, contactos, documento de identificação, zona ou território, dados do empréstimo,
            garantias, movimentos de carteira e o histórico de pagamentos e cobranças. Também registamos o utilizador
            que acede ao sistema e a hora das operações relevantes.
          </p>
        </section>
        <section className="legal-section">
          <h2>3. Para que usamos os dados</h2>
          <p>
            Os dados são usados para analisar e acompanhar empréstimos, calcular prestações, avisar vencimentos,
            organizar rotas de cobrança e apresentar relatórios à gestão. Os lembretes ao cliente e ao administrador
            só são enviados de acordo com a periodicidade e o horário configurados no sistema.
          </p>
        </section>
        <section className="legal-section">
          <h2>4. Conservação e partilha</h2>
          <p>
            Os dados ficam guardados pelo tempo necessário à vida do crédito e às obrigações legais. Não são vendidos.
            Podem ser partilhados com quem opera a cobrança, com a instituição financeira da carteira usada no
            desembolso e com quem a lei obrigar a informar.
          </p>
        </section>
        <section className="legal-section">
          <h2>5. Os seus direitos</h2>
          <p>
            Pode pedir acesso, correcção ou limitação dos seus dados através do suporte do sistema, por WhatsApp, SMS
            ou chamada. O pedido é tratado pela equipa que gere a plataforma.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacidade;
