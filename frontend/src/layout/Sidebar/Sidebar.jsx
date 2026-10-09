import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeftRight,
  BadgeCheck,
  BadgePercent,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  BellRing,
  CalendarDays,
  CirclePlus,
  Clock,
  DatabaseBackup,
  Download,
  FilePlus2,
  FileSearch,
  FileSpreadsheet,
  Gavel,
  HandCoins,
  History,
  Landmark,
  LayoutDashboard,
  List,
  Lock,
  LogOut,
  Map,
  MapPinned,
  MessageSquare,
  PieChart,
  Plug,
  Receipt,
  Route,
  Scale,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
  ShieldPlus,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import { navigationLinks } from "../../data/data";
import { SidebarContext } from "../../context/sidebarContext";
import { AuthContext } from "../../contexts/AuthContext";
import companyLogo from "../../assets/logo.png";
import { useMarca } from "../../services/marcaSistema";
import "./Sidebar.css";

const PATH_AGENTES = "/imperial/dashboard/agentes";
const PATH_ATIVACOES = "/imperial/dashboard/ativacoes-manuais";
const PATH_SUPERVISORES = "/imperial/dashboard/supervisores";

const MENU_ICONS = {
  dashboard: LayoutDashboard,
  clientes: Users,
  lista: List,
  "novo-cliente": UserPlus,
  mapa: Map,
  emprestimos: HandCoins,
  "novo-emprestimo": FilePlus2,
  "detalhes-emprestimo": FileSearch,
  aprovacoes: BadgeCheck,
  contratos: ScrollText,
  calendario: CalendarDays,
  pagamentos: Wallet,
  registar: CirclePlus,
  historico: History,
  recibos: Receipt,
  pendentes: Clock,
  atraso: AlertCircle,
  garantias: Shield,
  "nova-garantia": ShieldPlus,
  penhoradas: Lock,
  execucao: Gavel,
  alertas: Bell,
  cobrancas: MessageSquare,
  agenda: CalendarDays,
  rota: Route,
  zonas: MapPinned,
  cobradores: UserCheck,
  inadimplencia: AlertCircle,
  notificacoes: BellRing,
  carteiras: WalletCards,
  "gestao-carteiras": Landmark,
  movimentos: ArrowLeftRight,
  despesas: Banknote,
  saldo: Activity,
  conciliacao: Scale,
  relatorios: BarChart3,
  "rel-financeiro": PieChart,
  performance: TrendingUp,
  "rel-clientes": Users,
  "rel-carteiras": Wallet,
  exportacao: Download,
  "modelo-bm": FileSpreadsheet,
  configuracoes: Settings,
  utilizadores: Users,
  identidade: Building2,
  perfis: ShieldCheck,
  "tipos-garantia": Shield,
  taxas: BadgePercent,
  backup: DatabaseBackup,
  integracoes: Plug,
  sair: LogOut,
};

const linkHiddenForRole = (path, tipo) => {
  if (tipo === "admin") return false;
  if (tipo === "subscricao") {
    return path === PATH_AGENTES || path === PATH_ATIVACOES || path === PATH_SUPERVISORES;
  }
  if (tipo === "supervisor") {
    return path === PATH_ATIVACOES || path === PATH_SUPERVISORES;
  }
  return path === PATH_AGENTES || path === PATH_ATIVACOES || path === PATH_SUPERVISORES;
};

const getIcon = (key) => MENU_ICONS[key] || List;

const Sidebar = () => {
  const marca = useMarca();
  const { isSidebarCollapsed } = useContext(SidebarContext);
  const { usuario } = useContext(AuthContext);
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [hoveredItem, setHoveredItem] = useState(null);

  const tipo = String(usuario?.tipo || "").toLowerCase();

  const linksVisiveis = useMemo(() => {
    return navigationLinks
      .map((link) => {
        if (link.type === "divider" || link.type === "logout") return link;
        if (link.children?.length) {
          const children = link.children.filter((child) => {
            if (Array.isArray(child.roles) && !child.roles.includes(tipo)) return false;
            if (child.path && linkHiddenForRole(child.path, tipo)) return false;
            return true;
          });
          return { ...link, children };
        }
        if (Array.isArray(link.roles) && !link.roles.includes(tipo)) return null;
        if (link.path && linkHiddenForRole(link.path, tipo)) return null;
        return link;
      })
      .filter((link) => link && (link.type === "divider" || link.type === "logout" || link.path || link.children?.length));
  }, [tipo]);

  useEffect(() => {
    const next = {};
    linksVisiveis.forEach((link) => {
      if (link.children?.some((child) => location.pathname.startsWith(child.path))) {
        next[link.id] = true;
      }
    });
    if (Object.keys(next).length) {
      setOpenMenus((prev) => ({ ...prev, ...next }));
    }
  }, [location.pathname, linksVisiveis]);

  const toggleMenu = (id) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderItemInner = (link, { showLabel = true, chevronOpen = null, highlightKey } = {}) => {
    const Icon = getIcon(link.icon);
    const isHovered = hoveredItem === highlightKey;
    return (
      <>
        {isHovered && (
          <motion.span
            layoutId="nav-hover-bg"
            className="nav-hover-bg"
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          />
        )}
        <span className="nav-item-body">
          <span className="nav-icon-tile">
            <Icon className="nav-link-react-icon" strokeWidth={2.1} />
          </span>
          {showLabel && !isSidebarCollapsed && <span className="nav-link-text">{link.title}</span>}
        </span>
        {chevronOpen !== null && !isSidebarCollapsed && (
          <span className={`nav-toggle ${chevronOpen ? "open" : ""}`} aria-hidden="true">
            <span className="nav-toggle-h" />
            <span className="nav-toggle-v" />
          </span>
        )}
      </>
    );
  };

  let motionIndex = 0;

  return (
    <aside className={`sidebar ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-top">
        {!isSidebarCollapsed && (
          <div className="logo-container notranslate">
            <img src={marca.logo || companyLogo} alt="Logo da Empresa" className="company-logo" />
          </div>
        )}
      </div>

      <nav className="navigation custom-scrollbar">
        <div className="nav-edge-fade nav-edge-fade-top" aria-hidden="true" />
        <LayoutGroup id="sidebar-nav">
          <ul className="nav-list">
          {linksVisiveis.map((link) => {
            if (link.type === "divider") {
              return (
                <li className="nav-item" key={link.id}>
                  <div className={`nav-section-divider ${isSidebarCollapsed ? "is-collapsed" : ""}`}>
                    <span className="nav-section-line" />
                    {!isSidebarCollapsed && <span className="nav-section-label">{link.title}</span>}
                    <span className="nav-section-line" />
                  </div>
                </li>
              );
            }

            if (link.type === "submenu" && link.children?.length) {
              const childActive = link.children.some((child) =>
                location.pathname.startsWith(child.path)
              );
              const isOpen = !!openMenus[link.id] && !isSidebarCollapsed;
              const index = motionIndex++;

              return (
                <motion.li
                  className="nav-item"
                  key={link.id}
                  initial={{ opacity: 0, scale: 0.86, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.035 }}
                >
                  {isSidebarCollapsed ? (
                    <NavLink
                      to={link.children.find((c) => c.path.endsWith("/listar"))?.path || link.children[0].path}
                      className={() => `nav-link ${childActive ? "active" : ""} ${hoveredItem === link.id ? "selected" : ""}`}
                      title={link.title}
                      onMouseEnter={() => setHoveredItem(link.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {renderItemInner(link, { showLabel: false, highlightKey: link.id })}
                      <span className="nav-link-tooltip">{link.title}</span>
                    </NavLink>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`nav-link nav-link-parent ${childActive ? "active" : ""} ${hoveredItem === link.id ? "selected" : ""}`}
                        onClick={() => toggleMenu(link.id)}
                        onMouseEnter={() => setHoveredItem(link.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {renderItemInner(link, { chevronOpen: isOpen, highlightKey: link.id })}
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.ul
                            className="nav-submenu submenu-scrollbar open"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          >
                            {link.children.map((child, childIndex) => (
                              <motion.li
                                key={child.id}
                                initial={{ opacity: 0, x: -8, scale: 0.92 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{ duration: 0.18, delay: childIndex * 0.04 }}
                              >
                                <NavLink
                                  to={child.path}
                                  end
                                  className={({ isActive }) =>
                                    `nav-link nav-sublink ${isActive ? "active" : ""} ${hoveredItem === child.id ? "selected" : ""}`
                                  }
                                  onMouseEnter={() => setHoveredItem(child.id)}
                                  onMouseLeave={() => setHoveredItem(null)}
                                >
                                  {() => renderItemInner(child, { highlightKey: child.id })}
                                </NavLink>
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.li>
              );
            }

            const index = motionIndex++;
            return (
              <motion.li
                className="nav-item"
                key={link.id}
                initial={{ opacity: 0, scale: 0.86, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.035 }}
              >
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""} ${hoveredItem === link.id ? "selected" : ""}`
                  }
                  title={isSidebarCollapsed ? link.title : undefined}
                  onMouseEnter={() => setHoveredItem(link.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {() => (
                    <>
                      {renderItemInner(link, { showLabel: !isSidebarCollapsed, highlightKey: link.id })}
                      {isSidebarCollapsed && <span className="nav-link-tooltip">{link.title}</span>}
                    </>
                  )}
                </NavLink>
              </motion.li>
            );
          })}
          </ul>
        </LayoutGroup>
        <div className="nav-edge-fade nav-edge-fade-bottom" aria-hidden="true" />
      </nav>
    </aside>
  );
};

export default Sidebar;
