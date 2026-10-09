import { useState, useEffect, useRef, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FiSettings, FiUser, FiLock, FiBell, FiMoon, FiSun,
  FiWifi, FiDatabase, FiCreditCard, FiGlobe, FiBarChart2,
  FiCheck, FiX, FiChevronDown, FiSave, FiRefreshCw, FiCamera
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Switch from 'react-switch';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { AuthContext } from '../contexts/AuthContext';
import api, { baseURL } from '../services/api';
import { gravarSenhaDemo, senhaDemoActual } from '../constants/demoAdmin';
import './Settings.css';

const Settings = () => {
  const { usuario, updateUser } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('account');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState(70);
  const [expandedSection, setExpandedSection] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const settingsRef = useRef(null);

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifBrowser, setNotifBrowser] = useState(true);
  const [notifSom, setNotifSom] = useState(false);
  const [segurancaRequererSenha, setSegurancaRequererSenha] = useState(false);
  const [doisFatores, setDoisFatores] = useState(false);
  const [tamanhoFonte, setTamanhoFonte] = useState(16);
  const [densidadeUI, setDensidadeUI] = useState(2);
  const [cacheLimpo, setCacheLimpo] = useState(false);
  const [espacoUsado, setEspacoUsado] = useState(0);
  const [carregandoReload, setCarregandoReload] = useState(false);

  const [profileNome, setProfileNome] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [fotoPreview, setFotoPreview] = useState(null);
  const photoInputRef = useRef(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const allowed = ['account', 'security', 'notifications', 'appearance', 'network', 'data'];
    if (tab && allowed.includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (usuario) {
      setProfileNome(usuario.nome ?? '');
      setProfileEmail(usuario.email ?? '');
      setProfileUsername(usuario.email ?? '');
      setFotoPreview(usuario.fotoPerfil ?? null);
    }
  }, [usuario]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (settingsRef.current) {
        settingsRef.current.style.opacity = 1;
        settingsRef.current.style.transform = 'translateY(0)';
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let total = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key))
          total += (localStorage[key].length + key.length) * 2;
      }
      setEspacoUsado(total);
    } catch (_) {}
  }, [activeTab, cacheLimpo]);

  useEffect(() => {
    const sectionByTab = { account: 'profile', security: 'security-session', notifications: 'notif', appearance: 'theme', network: 'network-info', data: 'data-storage' };
    setExpandedSection(sectionByTab[activeTab] || null);
  }, [activeTab]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (novaSenha && novaSenha !== confirmarSenha) {
      alert('A nova senha e a confirmação não coincidem.');
      return;
    }
    setIsSaving(true);
    try {
      updateUser({
        nome: profileNome,
        email: profileUsername || profileEmail,
        fotoPerfil: fotoPreview ?? undefined,
      });
      if (senhaAtual && novaSenha) {
        if (String(usuario?.token || "").startsWith("demo-")) {
          const identificador = usuario?.email || usuario?.nome || "";
          const actual = senhaDemoActual(identificador);
          if (!actual || senhaAtual !== actual || !gravarSenhaDemo(identificador, novaSenha)) {
            alert('Não foi possível alterar a senha. Verifique a senha actual.');
            return;
          }
        } else {
          await api.put("/api/autenticacao/senha", { senhaActual, novaSenha });
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (erro) {
      alert(erro.response?.data?.mensagem || 'Não foi possível alterar a senha. Verifique a senha actual.');
    } finally {
      setIsSaving(false);
    }
  };

  // Alternar seção expandida
  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Configurações de animação
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className={`settings-container ${darkMode ? 'dark-mode' : ''}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      ref={settingsRef}
    >
      <div className="settings-header">
        <div className="header-content">
          <FiSettings className="settings-icon" />
          <h1>Configurações do Sistema</h1>
          <div className="header-actions">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="settings-reload-btn"
              onClick={() => { setCarregandoReload(true); setTimeout(() => setCarregandoReload(false), 700); }}
              disabled={carregandoReload}
            >
              <FiRefreshCw className={carregandoReload ? 'spin' : ''} />
              {carregandoReload ? 'A carregar…' : 'Recarregar'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`save-btn ${isSaving ? 'saving' : ''}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <FiRefreshCw className="spin" /> Salvando...
                </>
              ) : (
                <>
                  <FiSave /> Salvar Alterações
                </>
              )}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              className="save-success"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FiCheck /> Configurações salvas com sucesso!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {carregandoReload ? (
        <div className="settings-loader-wrap">
          <PageLoader />
        </div>
      ) : (
      <div className="settings-layout">
        <div className="settings-sidebar">
          <motion.div 
            className={`sidebar-item ${activeTab === 'account' ? 'active' : ''}`}
            whileHover={{ x: 5 }}
            onClick={() => setActiveTab('account')}
          >
            <FiUser /> Conta
          </motion.div>
          <motion.div 
            className={`sidebar-item ${activeTab === 'security' ? 'active' : ''}`}
            whileHover={{ x: 5 }}
            onClick={() => setActiveTab('security')}
          >
            <FiLock /> Segurança
          </motion.div>
          <motion.div 
            className={`sidebar-item ${activeTab === 'notifications' ? 'active' : ''}`}
            whileHover={{ x: 5 }}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell /> Notificações
          </motion.div>
          <motion.div 
            className={`sidebar-item ${activeTab === 'appearance' ? 'active' : ''}`}
            whileHover={{ x: 5 }}
            onClick={() => setActiveTab('appearance')}
          >
            {darkMode ? <FiMoon /> : <FiSun />} Aparência
          </motion.div>
          <motion.div 
            className={`sidebar-item ${activeTab === 'network' ? 'active' : ''}`}
            whileHover={{ x: 5 }}
            onClick={() => setActiveTab('network')}
          >
            <FiWifi /> Rede
          </motion.div>
          <motion.div 
            className={`sidebar-item ${activeTab === 'data' ? 'active' : ''}`}
            whileHover={{ x: 5 }}
            onClick={() => setActiveTab('data')}
          >
            <FiDatabase /> Dados
          </motion.div>
        </div>

        <div className="settings-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="tab-content"
            >
              {activeTab === 'account' && (
                <div className="account-settings">
                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('profile')}>
                      <h2>Editar perfil</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'profile' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'profile' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="section-content"
                        >
                          <div className="form-group">
                            <label>Nome completo</label>
                            <input type="text" placeholder="Digite seu nome" value={profileNome} onChange={(e) => setProfileNome(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Email</label>
                            <input type="email" placeholder="seu@email.com" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Username (email institucional para acesso)</label>
                            <input type="text" placeholder="email@institucional.com" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} />
                            <span className="form-hint">Será usado para entrar no sistema.</span>
                          </div>
                          <div className="form-group">
                            <label>Senha actual</label>
                            <input type="password" placeholder="••••••••" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Nova senha</label>
                            <input type="password" placeholder="••••••••" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Confirmar nova senha</label>
                            <input type="password" placeholder="••••••••" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label>Foto de perfil</label>
                            <div className="avatar-upload">
                              <div className="avatar-preview" style={{ backgroundImage: fotoPreview ? `url(${fotoPreview})` : 'none' }}>
                                {!fotoPreview && <FiUser className="avatar-placeholder-icon" />}
                              </div>
                              <input ref={photoInputRef} type="file" accept="image/*" className="avatar-input" onChange={handlePhotoChange} />
                              <button type="button" className="upload-btn" onClick={() => photoInputRef.current?.click()}>
                                <FiCamera /> Alterar foto
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('preferences')}>
                      <h2>Preferências</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'preferences' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'preferences' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="section-content"
                        >
                          <div className="toggle-item">
                            <div className="toggle-label">
                              <span>Idioma Automático</span>
                              <span className="toggle-description">Detectar idioma com base na localização</span>
                            </div>
                            <Switch
                              checked={autoSave}
                              onChange={setAutoSave}
                              onColor="#106a37"
                              offColor="#dddddd"
                              checkedIcon={false}
                              uncheckedIcon={false}
                              height={24}
                              width={48}
                            />
                          </div>
                          <div className="toggle-item">
                            <div className="toggle-label">
                              <span>Modo de Economia de Dados</span>
                              <span className="toggle-description">Reduzir uso de dados em redes móveis</span>
                            </div>
                            <Switch
                              checked={!autoSave}
                              onChange={() => setAutoSave(!autoSave)}
                              onColor="#106a37"
                              offColor="#dddddd"
                              checkedIcon={false}
                              uncheckedIcon={false}
                              height={24}
                              width={48}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="appearance-settings">
                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('theme')}>
                      <h2>Tema</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'theme' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'theme' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="section-content"
                        >
                          <div className="toggle-item">
                            <div className="toggle-label">
                              <span>Modo Escuro</span>
                              <span className="toggle-description">Ativar interface em cores escuras</span>
                            </div>
                            <Switch
                              checked={darkMode}
                              onChange={setDarkMode}
                              onColor="#106a37"
                              offColor="#dddddd"
                              checkedIcon={<FiMoon className="switch-icon" />}
                              uncheckedIcon={<FiSun className="switch-icon" />}
                              height={24}
                              width={48}
                            />
                          </div>

                          <div className="theme-colors">
                            <h3>Cores do Tema</h3>
                            <div className="color-options">
                              {['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12'].map(color => (
                                <motion.div
                                  key={color}
                                  className="color-option"
                                  style={{ backgroundColor: color }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('display')}>
                      <h2>Exibição</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'display' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'display' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="section-content"
                        >
                          <div className="slider-item">
                            <label>Tamanho da Fonte</label>
                            <Slider
                              min={12}
                              max={24}
                              value={tamanhoFonte}
                              onChange={(v) => setTamanhoFonte(Array.isArray(v) ? v[0] : v)}
                              trackStyle={{ backgroundColor: '#106a37' }}
                              handleStyle={{
                                borderColor: '#106a37',
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            />
                            <div className="slider-values">
                              <span>Pequeno</span>
                              <span>Grande</span>
                            </div>
                          </div>

                          <div className="slider-item">
                            <label>Densidade da Interface</label>
                            <Slider
                              min={1}
                              max={3}
                              value={densidadeUI}
                              onChange={(v) => setDensidadeUI(Array.isArray(v) ? v[0] : v)}
                              marks={{ 1: 'Compacto', 2: 'Padrão', 3: 'Espaçado' }}
                              trackStyle={{ backgroundColor: '#106a37' }}
                              handleStyle={{
                                borderColor: '#106a37',
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="account-settings">
                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('security-session')}>
                      <h2>Sessão e acesso</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'security-session' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'security-session' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="section-content">
                          <div className="toggle-item">
                            <div className="toggle-label">
                              <span>Requerer senha ao sair</span>
                              <span className="toggle-description">Pedir confirmação de senha ao terminar sessão</span>
                            </div>
                            <Switch checked={segurancaRequererSenha} onChange={setSegurancaRequererSenha} onColor="#106a37" offColor="#dddddd" height={24} width={48} checkedIcon={false} uncheckedIcon={false} />
                          </div>
                          <div className="info-block">
                            <strong>Última actividade:</strong> {new Date().toLocaleString('pt-PT')}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('security-2fa')}>
                      <h2>Autenticação em dois factores</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'security-2fa' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'security-2fa' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="section-content">
                          <div className="toggle-item">
                            <div className="toggle-label">
                              <span>Activar 2FA</span>
                              <span className="toggle-description">Código adicional por aplicativo ou SMS no login</span>
                            </div>
                            <Switch checked={doisFatores} onChange={setDoisFatores} onColor="#106a37" offColor="#dddddd" height={24} width={48} checkedIcon={false} uncheckedIcon={false} />
                          </div>
                          {doisFatores && <p className="form-hint">Configure um aplicativo autenticador (ex: Google Authenticator) nas próximas etapas.</p>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="account-settings">
                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('notif')}>
                      <h2>Notificações</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'notif' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'notif' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="section-content">
                          <div className="toggle-item">
                            <div className="toggle-label">
                              <span>Notificações por email</span>
                              <span className="toggle-description">Receber alertas e resumos no seu email</span>
                            </div>
                            <Switch checked={notifEmail} onChange={setNotifEmail} onColor="#106a37" offColor="#dddddd" height={24} width={48} checkedIcon={false} uncheckedIcon={false} />
                          </div>
                          <div className="toggle-item">
                            <div className="toggle-label">
                              <span>Notificações no navegador</span>
                              <span className="toggle-description">Permitir notificações push no browser</span>
                            </div>
                            <Switch checked={notifBrowser} onChange={setNotifBrowser} onColor="#106a37" offColor="#dddddd" height={24} width={48} checkedIcon={false} uncheckedIcon={false} />
                          </div>
                          <div className="toggle-item">
                            <div className="toggle-label">
                              <span>Som nas notificações</span>
                              <span className="toggle-description">Reproduzir som ao receber alertas</span>
                            </div>
                            <Switch checked={notifSom} onChange={setNotifSom} onColor="#106a37" offColor="#dddddd" height={24} width={48} checkedIcon={false} uncheckedIcon={false} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {activeTab === 'network' && (
                <div className="account-settings">
                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('network-info')}>
                      <h2>Rede e conexão</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'network-info' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'network-info' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="section-content">
                          <div className="form-group">
                            <label>URL da API</label>
                            <input type="text" readOnly value={baseURL || '—'} className="readonly-input" />
                            <span className="form-hint">Servidor backend utilizado pela aplicação.</span>
                          </div>
                          <div className="info-block">
                            <strong>Estado:</strong> <span className="status-online">Conectado</span>
                          </div>
                          <div className="form-group" style={{ marginTop: 16 }}>
                            <button type="button" className="upload-btn" onClick={() => { try { localStorage.removeItem('pagamentos_cache'); setCacheLimpo(true); setTimeout(() => setCacheLimpo(false), 2000); } catch (_) {} }}>
                              <FiRefreshCw /> Limpar cache da aplicação
                            </button>
                            {cacheLimpo && <span className="form-hint" style={{ marginTop: 8, color: '#106a37' }}>Cache limpo.</span>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="account-settings">
                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('data-storage')}>
                      <h2>Armazenamento local</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'data-storage' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'data-storage' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="section-content">
                          <div className="info-block">
                            <strong>Espaço utilizado (localStorage):</strong> {(espacoUsado / 1024).toFixed(2)} KB
                          </div>
                          <div className="toggle-item" style={{ marginTop: 16 }}>
                            <div className="toggle-label">
                              <span>Limpar cache local</span>
                              <span className="toggle-description">Remove dados em cache (ex.: listas). Os dados no servidor não são afectados.</span>
                            </div>
                            <button type="button" className="upload-btn" onClick={() => { try { localStorage.removeItem('pagamentos_cache'); setCacheLimpo(true); setTimeout(() => setCacheLimpo(false), 1500); let t = 0; for (let k in localStorage) if (localStorage.hasOwnProperty(k)) t += (localStorage[k].length + k.length) * 2; setEspacoUsado(t); } catch (_) {} }}>Limpar</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div variants={itemVariants} className="setting-section">
                    <div className="section-header" onClick={() => toggleSection('data-export')}>
                      <h2>Exportar dados</h2>
                      <FiChevronDown className={`expand-icon ${expandedSection === 'data-export' ? 'expanded' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === 'data-export' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="section-content">
                          <p className="form-hint">Exporte uma cópia dos seus dados de configuração e preferências (guardados localmente).</p>
                          <button type="button" className="upload-btn" style={{ marginTop: 12 }} onClick={() => { const data = { usuario: usuario ? { nome: usuario.nome, email: usuario.email } : null, exportadoEm: new Date().toISOString(), preferencias: { notifEmail, notifBrowser, notifSom, darkMode } }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `configuracoes-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href); }}>
                            <FiDatabase /> Exportar configurações (JSON)
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      )}
    </motion.div>
  );
};

export default Settings;