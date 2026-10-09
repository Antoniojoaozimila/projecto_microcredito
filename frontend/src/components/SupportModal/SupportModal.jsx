import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaWhatsapp, FaSms, FaPhone } from "react-icons/fa";
import { DESENVOLVEDORES } from "../../constants/suporteDesenvolvedores";
import "./SupportModal.css";

const MSG_SUPORTE = "Olá, preciso de suporte no sistema Sistema de Microcrédito.";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },
  },
  exit: { opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.4 },
  }),
};

const SupportModal = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return undefined;

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="support-modal-overlay"
          role="presentation"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className="support-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-title"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="support-modal-header">
              <button
                type="button"
                className="support-modal-close"
                onClick={onClose}
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
              <motion.h2
                id="support-modal-title"
                className="support-modal-title"
                animate={{
                  textShadow: [
                    "0 0 8px rgba(255,255,255,0.3)",
                    "0 0 20px rgba(255,255,255,0.6)",
                    "0 0 8px rgba(255,255,255,0.3)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                Suporte Técnico
              </motion.h2>
              <p className="support-modal-subtitle">
                Equipa de desenvolvimento pronta para ajudar.
              </p>
            </header>

            <div className="support-modal-body">
              {DESENVOLVEDORES.map((dev, idx) => {
                const telLink = `+${dev.telefoneIntl.replace(/^\+/, "")}`;
                const whatsappUrl = `https://wa.me/${dev.telefoneIntl}?text=${encodeURIComponent(MSG_SUPORTE)}`;
                const smsUrl = `sms:${telLink}?body=${encodeURIComponent(MSG_SUPORTE)}`;
                const telUrl = `tel:${telLink}`;

                return (
                  <motion.article
                    key={dev.id}
                    className="support-dev-card"
                    custom={idx}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="support-dev-photo-wrap">
                      <img
                        src={dev.foto}
                        alt={dev.nome}
                        className="support-dev-photo"
                      />
                    </div>
                    <div className="support-dev-info">
                      <h3>{dev.nome}</h3>
                      <p className="support-dev-role">{dev.cargo}</p>
                      <p className="support-dev-phone">
                        <FaPhone /> {dev.telefone}
                      </p>
                      <div className="support-dev-actions">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="support-dev-btn whatsapp"
                        >
                          <FaWhatsapp /> WhatsApp
                        </a>
                        <a href={smsUrl} className="support-dev-btn sms">
                          <FaSms /> SMS
                        </a>
                        <a href={telUrl} className="support-dev-btn tel">
                          <FaPhone /> Chamada
                        </a>
                      </div>
                    </div>
                    <span className="support-dev-shine" aria-hidden="true" />
                  </motion.article>
                );
              })}
            </div>

            <footer className="support-modal-footer">
              Sistema de Microcrédito · Suporte técnico da plataforma
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SupportModal;
