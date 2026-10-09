CREATE TABLE zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  provincia VARCHAR(100) NOT NULL,
  distrito VARCHAR(100) NULL,
  bairro VARCHAR(100) NULL,
  coordenadas_centro VARCHAR(50) NULL,
  raio_km DECIMAL(5,2) NULL,
  responsavel_id INT NULL,
  status ENUM('Ativa','Inativa') NOT NULL DEFAULT 'Ativa',
  observacoes TEXT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_zones_status (status)
);

CREATE TABLE collectors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nome_completo VARCHAR(200) NOT NULL,
  documento VARCHAR(50) NOT NULL UNIQUE,
  telefone_principal VARCHAR(20) NOT NULL,
  telefone_alternativo VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  zona_id INT NOT NULL,
  meta_mensal DECIMAL(15,2) NULL,
  comissao_percentual DECIMAL(5,2) NULL,
  status ENUM('Ativo','Inativo','Suspenso') NOT NULL DEFAULT 'Ativo',
  data_admissao DATE NULL,
  observacoes TEXT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_collectors_zona (zona_id),
  CONSTRAINT fk_collectors_zona FOREIGN KEY (zona_id) REFERENCES zones(id)
);

CREATE TABLE collection_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_agenda VARCHAR(50) NOT NULL UNIQUE,
  collector_id INT NOT NULL,
  zona_id INT NOT NULL,
  data_agendada DATE NOT NULL,
  hora_inicio TIME NULL,
  hora_fim TIME NULL,
  total_clientes INT NOT NULL DEFAULT 0,
  total_esperado DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cobrado DECIMAL(15,2) NULL DEFAULT 0,
  status ENUM('Pendente','Em Curso','Concluída','Cancelada') NOT NULL DEFAULT 'Pendente',
  observacoes TEXT NULL,
  criado_por INT NOT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_schedules_data (data_agendada),
  CONSTRAINT fk_schedules_collector FOREIGN KEY (collector_id) REFERENCES collectors(id),
  CONSTRAINT fk_schedules_zona FOREIGN KEY (zona_id) REFERENCES zones(id)
);

CREATE TABLE collection_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  client_id INT NOT NULL,
  loan_id INT NOT NULL,
  installment_id INT NOT NULL,
  valor_esperado DECIMAL(15,2) NOT NULL,
  valor_cobrado DECIMAL(15,2) NULL DEFAULT 0,
  data_cobranca DATE NULL,
  hora_cobranca TIME NULL,
  status ENUM('Pendente','Cobrado','Parcialmente Cobrado','Não Cobrado','Reagendado') NOT NULL DEFAULT 'Pendente',
  motivo_nao_cobro TEXT NULL,
  promessa_pagamento DATE NULL,
  observacoes TEXT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_items_schedule (schedule_id),
  CONSTRAINT fk_items_schedule FOREIGN KEY (schedule_id) REFERENCES collection_schedules(id),
  CONSTRAINT fk_items_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_items_loan FOREIGN KEY (loan_id) REFERENCES loans(id)
);

CREATE TABLE collection_routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  ordem_visita INT NOT NULL,
  client_id INT NOT NULL,
  coordenadas VARCHAR(50) NULL,
  distancia_anterior_km DECIMAL(5,2) NULL,
  tempo_estimado_min INT NULL,
  status ENUM('Pendente','Visitado','Não Visitado') NOT NULL DEFAULT 'Pendente',
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_routes_schedule (schedule_id),
  CONSTRAINT fk_routes_schedule FOREIGN KEY (schedule_id) REFERENCES collection_schedules(id),
  CONSTRAINT fk_routes_client FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE collection_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  loan_id INT NOT NULL,
  installment_id INT NULL,
  tipo_notificacao ENUM('Lembrete Antes','Lembrete No Dia','Aviso Atraso','Aviso Final','Acordo Pagamento') NOT NULL,
  canal ENUM('SMS','Email','WhatsApp','Chamada','Presencial') NOT NULL,
  mensagem TEXT NOT NULL,
  data_envio TIMESTAMP NULL,
  status ENUM('Pendente','Enviada','Entregue','Lida','Falhou') NOT NULL DEFAULT 'Pendente',
  resposta_cliente TEXT NULL,
  data_resposta TIMESTAMP NULL,
  observacoes TEXT NULL,
  criado_por INT NOT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_cliente (client_id),
  CONSTRAINT fk_notif_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_notif_loan FOREIGN KEY (loan_id) REFERENCES loans(id)
);

CREATE TABLE payment_promises (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  loan_id INT NOT NULL,
  installment_id INT NULL,
  valor_prometido DECIMAL(15,2) NOT NULL,
  data_prometida DATE NOT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  registado_por INT NOT NULL,
  status ENUM('Pendente','Cumprida','Não Cumprida','Reagendada') NOT NULL DEFAULT 'Pendente',
  observacoes TEXT NULL,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_promises_data (data_prometida),
  CONSTRAINT fk_promises_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_promises_loan FOREIGN KEY (loan_id) REFERENCES loans(id)
);
