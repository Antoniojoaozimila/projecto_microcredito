import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiEdit3,
  FiMenu,
  FiSun,
  FiMoon,
  FiSunrise,
  FiCalendar,
  FiClock,
  FiShield,
  FiCreditCard,
  FiInfo,
  FiCheck,
  FiInbox,
  FiSettings,
  FiMail,
} from "react-icons/fi";
import { MdWavingHand } from "react-icons/md";
import { AuthContext } from "../../contexts/AuthContext";
import { SidebarContext } from "../../context/sidebarContext";
import { NotificationContext } from "../../contexts/NotificationContext";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import HeaderSearch from "./HeaderSearch";
import "./Header.css";

const getGreetingMeta = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: "Bom dia", period: "morning" };
  if (hour >= 12 && hour < 18) return { text: "Boa tarde", period: "afternoon" };
  return { text: "Boa noite", period: "evening" };
};

const PeriodIcon = ({ period }) => {
  if (period === "morning") return <FiSunrise />;
  if (period === "afternoon") return <FiSun />;
  return <FiMoon />;
};

const formatDate = (d) => {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTime = (d) => {
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
};

const formatRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `Há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  return `Há ${days} dias`;
};

const notifTypeMeta = (type) => {
  if (type === "cobranca") return { label: "Cobrança", Icon: FiBell };
  if (type === "seguro") return { label: "Seguro", Icon: FiShield };
  if (type === "pagamento") return { label: "Pagamento", Icon: FiCreditCard };
  return { label: "Sistema", Icon: FiInfo };
};

export default function Header() {
  const { usuario, logout } = useContext(AuthContext);
  const { toggleCollapsed, isSidebarCollapsed } = useContext(SidebarContext);
  const { notifications, markAsRead, clearAll } = useContext(NotificationContext);
  const [greeting, setGreeting] = useState(getGreetingMeta());
  const [dateTime, setDateTime] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const rightRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => {
      setDateTime(new Date());
      setGreeting(getGreetingMeta());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (rightRef.current && !rightRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/microcredito/login");
  };

  const nome = usuario?.nome || "Utilizador";
  const email = usuario?.email || "";
  const tipoMap = { admin: "Administrador", agente: "Agente", supervisor: "Supervisor" };
  const tipoLabel = tipoMap[usuario?.tipo] || "Utilizador";
  const initials = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const goTo = (path) => {
    setProfileOpen(false);
    navigate(path);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button type="button" className="header-menu-btn" onClick={toggleCollapsed} title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}>
          <FiMenu className="header-menu-icon" />
        </button>
        <div className="header-greeting-block">
          <h1 className="header-greeting">
            <span className="header-wave" aria-hidden="true" title={greeting.text}>
              <MdWavingHand />
            </span>
            <span className={`header-greeting-period header-greeting-period--${greeting.period}`}>
              <PeriodIcon period={greeting.period} />
              {greeting.text}
            </span>
            <span className="header-greeting-sep">,</span>
            <span className="header-greeting-name">{nome}</span>
          </h1>
          <p className="header-datetime">
            <span className="header-datetime-chip">
              <FiCalendar />
              {formatDate(dateTime)}
            </span>
            <span className="header-datetime-chip">
              <FiClock />
              {formatTime(dateTime)}
            </span>
          </p>
        </div>
      </div>

      <div className="header-center">
        <HeaderSearch />
      </div>

      <div className="header-right notranslate" ref={rightRef}>
        <div className="header-notifications" ref={notifRef}>
          <button
            type="button"
            className={`header-notif-btn${notifications.length > 0 ? " has-alerts" : ""}${notifOpen ? " is-open" : ""}`}
            onClick={() => setNotifOpen(!notifOpen)}
            title="Notificações"
          >
            <FiBell className="header-notif-icon" />
            {notifications.length > 0 && (
              <span className="header-notif-badge">{notifications.length > 9 ? "9+" : notifications.length}</span>
            )}
          </button>
          {notifOpen && (
            <div className="header-notif-dropdown">
              <div className="header-notif-dropdown-top">
                <div className="header-notif-dropdown-title">
                  <span className="header-notif-dropdown-bell">
                    <FiBell />
                  </span>
                  <div>
                    <strong>Notificações</strong>
                    <small>
                      {notifications.length === 0
                        ? "Tudo em dia"
                        : `${notifications.length} nova${notifications.length === 1 ? "" : "s"}`}
                    </small>
                  </div>
                </div>
                {notifications.length > 0 && (
                  <button type="button" className="header-notif-clear" onClick={clearAll}>
                    <FiCheck />
                    Limpar
                  </button>
                )}
              </div>
              <div className="header-notif-list">
                {notifications.length === 0 ? (
                  <div className="header-notif-empty">
                    <span className="header-notif-empty-icon">
                      <FiInbox />
                    </span>
                    <p>Sem notificações</p>
                    <small>Assim que houver novidades, aparecem aqui.</small>
                  </div>
                ) : (
                  notifications.map((n, i) => {
                    const { label, Icon } = notifTypeMeta(n.type);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        className={`header-notif-item header-notif-item--${n.type || "info"}`}
                        style={{ animationDelay: `${i * 55}ms` }}
                        onClick={() => { markAsRead(n.id); }}
                      >
                        <span className="header-notif-item-icon">
                          <Icon />
                        </span>
                        <span className="header-notif-item-body">
                          <span className="header-notif-item-msg">{n.message}</span>
                          <span className="header-notif-item-meta">
                            <FiClock />
                            {formatRelative(n.date)}
                            <span className="header-notif-item-dot" />
                            {label}
                          </span>
                        </span>
                        <span className="header-notif-item-go" aria-hidden="true">
                          <FiChevronRight />
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        <LanguageSwitcher />
        <div className="header-profile">
          <button
            type="button"
            className={`header-profile-btn${profileOpen ? " is-open" : ""}`}
            onClick={() => setProfileOpen(!profileOpen)}
            title="Conta"
          >
            <span className="header-profile-avatar">
              {usuario?.fotoPerfil ? (
                <img src={usuario.fotoPerfil} alt="" className="header-profile-photo" />
              ) : (
                <span className="header-profile-initials">{initials || <FiUser />}</span>
              )}
              <span className="header-profile-online" aria-hidden="true" />
            </span>
            <span className="header-profile-meta">
              <span className="header-profile-name">{nome}</span>
              <span className="header-profile-role">{tipoLabel}</span>
            </span>
            <FiChevronDown className={`header-profile-chevron ${profileOpen ? "open" : ""}`} />
          </button>
          {profileOpen && (
            <div className="header-profile-dropdown">
              <div className="header-profile-dropdown-top">
                <span className="header-profile-dropdown-avatar">
                  {usuario?.fotoPerfil ? (
                    <img src={usuario.fotoPerfil} alt="" />
                  ) : (
                    initials || <FiUser />
                  )}
                  <span className="header-profile-dropdown-online" aria-hidden="true" />
                </span>
                <strong className="header-profile-card-name">{nome}</strong>
                {email && (
                  <span className="header-profile-card-email">
                    <FiMail />
                    {email}
                  </span>
                )}
                <span className="header-profile-card-badge">
                  <FiShield />
                  {tipoLabel}
                </span>
              </div>
              <div className="header-profile-menu">
                <button
                  type="button"
                  className="header-profile-item"
                  style={{ animationDelay: "40ms" }}
                  onClick={() => goTo("/imperial/dashboard/settings?tab=account")}
                >
                  <span className="header-profile-item-icon">
                    <FiEdit3 />
                  </span>
                  <span className="header-profile-item-body">
                    <span>Editar perfil</span>
                    <small>Nome, foto e dados da conta</small>
                  </span>
                  <FiChevronRight className="header-profile-item-go" />
                </button>
                <button
                  type="button"
                  className="header-profile-item"
                  style={{ animationDelay: "95ms" }}
                  onClick={() => goTo("/imperial/dashboard/settings")}
                >
                  <span className="header-profile-item-icon header-profile-item-icon--settings">
                    <FiSettings />
                  </span>
                  <span className="header-profile-item-body">
                    <span>Configurações</span>
                    <small>Preferências do sistema</small>
                  </span>
                  <FiChevronRight className="header-profile-item-go" />
                </button>
                <div className="header-profile-menu-sep" />
                <button
                  type="button"
                  className="header-profile-item header-profile-item--danger"
                  style={{ animationDelay: "150ms" }}
                  onClick={handleLogout}
                >
                  <span className="header-profile-item-icon header-profile-item-icon--logout">
                    <FiLogOut />
                  </span>
                  <span className="header-profile-item-body">
                    <span>Sair do sistema</span>
                    <small>Encerrar a sessão atual</small>
                  </span>
                  <FiChevronRight className="header-profile-item-go" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
