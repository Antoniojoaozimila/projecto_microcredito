CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_relatorio VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  tipo ENUM('Financeiro','Inadimplência','Performance','Clientes','Carteiras','Empréstimos','Pagamentos','Garantias','Cobranças','Personalizado') NOT NULL,
  descricao TEXT NULL,
  parametros JSON NULL,
  formato ENUM('PDF','Excel','CSV','JSON') NOT NULL,
  ficheiro_url VARCHAR(255) NULL,
  tamanho_kb INT NULL,
  periodo_inicio DATE NULL,
  periodo_fim DATE NULL,
  status ENUM('Pendente','Em Processamento','Concluído','Falhou','Cancelado') NOT NULL DEFAULT 'Pendente',
  gerado_por INT NOT NULL,
  data_geracao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_expiracao TIMESTAMP NULL,
  observacoes TEXT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_reports_tipo (tipo),
  KEY idx_reports_status (status)
);

CREATE TABLE report_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  tipo ENUM('Financeiro','Inadimplência','Performance','Clientes','Carteiras','Empréstimos','Pagamentos','Garantias','Cobranças','Personalizado') NOT NULL,
  descricao TEXT NULL,
  query_sql TEXT NULL,
  colunas JSON NOT NULL,
  filtros JSON NULL,
  agrupamentos JSON NULL,
  ordenacao JSON NULL,
  graficos JSON NULL,
  status ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  criado_por INT NOT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE report_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NULL,
  nome VARCHAR(200) NOT NULL,
  frequencia ENUM('Diário','Semanal','Mensal','Trimestral','Anual') NOT NULL,
  dia_semana INT NULL,
  dia_mes INT NULL,
  hora_envio TIME NOT NULL,
  formato ENUM('PDF','Excel','CSV') NOT NULL,
  destinatarios JSON NOT NULL,
  parametros JSON NULL,
  status ENUM('Ativo','Inativo','Pausado') NOT NULL DEFAULT 'Ativo',
  ultima_execucao TIMESTAMP NULL,
  proxima_execucao TIMESTAMP NULL,
  criado_por INT NOT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
