import { useState } from "react";
import { FaWhatsapp, FaSms, FaPhone } from "react-icons/fa";
import SupportModal from "../SupportModal/SupportModal";
import "./SupportContact.css";

const SupportContact = ({ className = "", variant = "footer" }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => setModalOpen(true);

  return (
    <>
      <div className={`support-contact support-contact--${variant} ${className}`.trim()}>
        {variant === "footer" && (
          <span className="support-contact-label">Suporte:</span>
        )}
        <button
          type="button"
          className="support-contact-btn whatsapp"
          onClick={openModal}
          title="Suporte via WhatsApp"
        >
          <FaWhatsapp /> WhatsApp
        </button>
        <button
          type="button"
          className="support-contact-btn sms"
          onClick={openModal}
          title="Suporte via SMS"
        >
          <FaSms /> SMS
        </button>
        <button
          type="button"
          className="support-contact-btn tel"
          onClick={openModal}
          title="Suporte via chamada"
        >
          <FaPhone /> {variant === "login" ? "Chamadas" : "Chamada"}
        </button>
      </div>

      <SupportModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default SupportContact;
