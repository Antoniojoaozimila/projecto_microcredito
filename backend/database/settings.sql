CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_completo VARCHAR(200) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  foto_perfil VARCHAR(255) NULL,
  role_id INT NOT NULL,
  zona_id INT NULL,
  status ENUM('Ativo','Inativo','Suspenso','Bloqueado') NOT NULL DEFAULT 'Ativo',
  ultimo_acesso TIMESTAMP NULL,
  ip_ultimo_acesso VARCHAR(50) NULL,
  tentativas_login INT NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMP NULL,
  token_reset_senha VARCHAR(255) NULL,
  token_expiracao TIMESTAMP NULL,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret VARCHAR(255) NULL,
  observacoes TEXT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  criado_por INT NULL
);

CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  tipo ENUM('Texto','Número','Booleano','JSON','Data') NOT NULL,
  categoria ENUM('Geral','Crédito','Cobrança','Notificações','Segurança','Integrações','Relatórios') NOT NULL,
  descricao TEXT NULL,
  valor_padrao TEXT NULL,
  opcoes JSON NULL,
  editavel BOOLEAN NOT NULL DEFAULT TRUE,
  visivel BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  atualizado_por INT NULL
);

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT NULL,
  permissoes JSON NOT NULL,
  nivel_acesso INT NOT NULL,
  status ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(100) NOT NULL UNIQUE,
  modulo VARCHAR(50) NOT NULL,
  acao ENUM('Criar','Ler','Atualizar','Excluir','Aprovar','Exportar') NOT NULL,
  descricao TEXT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_role_permission (role_id, permission_id)
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  client_id INT NULL,
  tipo ENUM('Sistema','Empréstimo','Pagamento','Cobrança','Alerta','Marketing') NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  canal ENUM('Push','Email','SMS','WhatsApp','Sistema') NOT NULL,
  prioridade ENUM('Baixa','Média','Alta','Urgente') NOT NULL DEFAULT 'Média',
  status ENUM('Pendente','Enviada','Entregue','Lida','Falhou') NOT NULL DEFAULT 'Pendente',
  data_envio TIMESTAMP NULL,
  data_leitura TIMESTAMP NULL,
  link VARCHAR(255) NULL,
  metadata JSON NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('Sistema','Empréstimo','Pagamento','Cobrança','Alerta','Marketing') NOT NULL,
  canal ENUM('Push','Email','SMS','WhatsApp') NOT NULL,
  assunto VARCHAR(200) NULL,
  conteudo TEXT NOT NULL,
  variaveis JSON NULL,
  status ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE notification_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo_evento VARCHAR(100) NOT NULL,
  canal ENUM('Push','Email','SMS','WhatsApp') NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  dias_antes INT NULL,
  hora_envio TIME NULL,
  template_id INT NOT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE integrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('Pagamento','SMS','Email','Banco','Outro') NOT NULL,
  provedor VARCHAR(100) NOT NULL,
  url_api VARCHAR(255) NULL,
  api_key VARCHAR(255) NULL,
  api_secret VARCHAR(255) NULL,
  configuracoes JSON NULL,
  status ENUM('Ativa','Inativa','Erro') NOT NULL DEFAULT 'Inativa',
  ultimo_teste TIMESTAMP NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  acao VARCHAR(100) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  entidade_id INT NULL,
  dados_anteriores JSON NULL,
  dados_novos JSON NULL,
  ip VARCHAR(50) NULL,
  user_agent VARCHAR(255) NULL,
  data_acao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
