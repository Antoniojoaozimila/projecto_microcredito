import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText } from "react-icons/fi";
import "./Legal.css";

const TermosUso = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page" id="termos-uso">
      <button type="button" className="legal-back" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Voltar
      </button>
      <header className="legal-header">
        <FiFileText className="legal-header-icon" />
        <div>
          <h1 className="legal-title">Termos de Uso</h1>
          <p className="legal-subtitle">Sistema de Microcrédito · Setembro de 2026</p>
        </div>
      </header>
      <div className="legal-content">
        <section className="legal-section">
          <h2>1. Acesso</h2>
          <p>
            O sistema destina-se a quem gere crédito: registo de clientes, abertura de empréstimos, movimento de
            carteiras, pagamentos e cobrança. Cada pessoa entra com o seu nome completo e usa apenas as funções do
            seu perfil.
          </p>
        </section>
        <section className="legal-section">
          <h2>2. Uso correcto</h2>
          <p>
            Os valores lançados devem corresponder a operações reais. Um empréstimo só pode sair de uma carteira com
            saldo disponível, como E-mola, M-Pesa, M-Kesh ou Standard Bank. É proibido alterar saldos, apagar
            histórico de pagamentos ou usar o sistema para fins alheios ao microcrédito.
          </p>
        </section>
        <section className="legal-section">
          <h2>3. Juros e prestações</h2>
          <p>
            O tipo de juro aplicável, incluindo valor fixo sem juros, fica definido no empréstimo. O calendário de
            vencimentos e os lembretes seguem essa condição. O cliente e o administrador podem receber avisos com a
            antecedência e no horário configurados.
          </p>
        </section>
        <section className="legal-section">
          <h2>4. Responsabilidade</h2>
          <p>
            Quem regista um pagamento, uma despesa ou uma transferência entre carteiras confirma que a informação é
            verdadeira. A instituição responde pela decisão de crédito. A plataforma organiza e conserva esses
            registos.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermosUso;
