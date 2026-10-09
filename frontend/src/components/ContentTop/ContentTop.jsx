import { useState, useContext, useEffect, useRef } from "react";
import { iconsImgs } from "../../utils/images";
import "./ContentTop.css";
import { SidebarContext } from "../../context/sidebarContext";

const ContentTop = () => {
  const { toggleSidebar } = useContext(SidebarContext);
  const [greeting, setGreeting] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  return (
    <div className="main-content-top">
      <div className="content-top-left">
        <button 
          type="button" 
          className="sidebar-toggler" 
          onClick={toggleSidebar}
          aria-label="Alternar menu lateral"
        >
          <img src={iconsImgs.menu} alt="Menu" />
        </button>

        <div className="greeting">
          <h3 className="greeting-text">
            <span className="greeting-salutation">{greeting}</span>
            <span className="greeting-name">, Elton Matsinhe</span>
          </h3>
        </div>
      </div>

      <div className="content-top-center">
        <div className={`search-container ${showSearch ? "active" : ""}`}>
          <button
            type="button"
            className="search-btn content-top-btn"
            onClick={() => setShowSearch((prev) => !prev)}
            aria-label="Buscar"
          >
            <img src={iconsImgs.search} alt="Buscar" />
          </button>
          {showSearch && (
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Pesquisar..."
              onBlur={() => setShowSearch(false)}
            />
          )}
        </div>
      </div>

      <div className="content-top-right">
        <button 
          className="notification-btn content-top-btn" 
          title="Notificações"
          aria-label="Notificações"
        >
          <img src={iconsImgs.bell} alt="Notificações" />
          <span className="notification-btn-dot"></span>
        </button>

        <div 
          className="avatar-dropdown-wrapper"
          ref={dropdownRef}
        >
          <button
            className="avatar-btn content-top-btn"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="Menu do usuário"
          >
            <img
              src={iconsImgs.gears}
              alt="Configurações"
              className="settings-icon"
              title="Configurações"
            />
          </button>

          <div className={`avatar-dropdown-menu ${dropdownOpen ? "open" : ""}`}>
            <div className="dropdown-triangle"></div>
            <ul>
              <li>
                <button className="dropdown-btn">
                  <img src={iconsImgs.user} alt="" />
                  <span>Editar perfil</span>
                </button>
              </li>
              <li>
                <button className="dropdown-btn">
                  <img src={iconsImgs.settings} alt="" />
                  <span>Configurações</span>
                </button>
              </li>
              <li>
                <button className="dropdown-btn logout-btn">
                  <img src={iconsImgs.logout} alt="" />
                  <span>Sair</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentTop;