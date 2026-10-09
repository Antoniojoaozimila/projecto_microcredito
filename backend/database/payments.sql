ALTER TABLE loan_installments
  ADD COLUMN juros_pago DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER valor_pago,
  ADD COLUMN principal_pago DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER juros_pago,
  ADD COLUMN multa_paga DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER multa;

ALTER TABLE loans
  ADD COLUMN multas_pagas DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER saldo_devedor,
  ADD COLUMN data_quitacao TIMESTAMP NULL AFTER data_desembolso;

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_recibo VARCHAR(50) NOT NULL UNIQUE,
  loan_id INT NOT NULL,
  client_id INT NOT NULL,
  installment_id INT NULL,
  valor_pago DECIMAL(15,2) NOT NULL,
  valor_parcela DECIMAL(15,2) NOT NULL DEFAULT 0,
  valor_juros_pago DECIMAL(15,2) NOT NULL DEFAULT 0,
  valor_principal_pago DECIMAL(15,2) NOT NULL DEFAULT 0,
  valor_multa DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo_devedor_apos DECIMAL(15,2) NOT NULL DEFAULT 0,
  data_pagamento DATE NOT NULL,
  hora_pagamento TIME NULL,
  forma_pagamento ENUM('Dinheiro','E-Mola','Mpesa','Transferência Bancária','Cheque') NOT NULL,
  referencia_transacao VARCHAR(100) NULL,
  carteira_id INT NOT NULL,
  tipo_pagamento ENUM('Pagamento de Parcela','Pagamento Antecipado','Pagamento Parcial','Quitação Total','Multa') NOT NULL,
  status ENUM('Confirmado','Pendente','Cancelado','Estornado') NOT NULL DEFAULT 'Confirmado',
  comprovativo VARCHAR(255) NULL,
  observacoes TEXT NULL,
  motivo_estorno TEXT NULL,
  estornado_por INT NULL,
  data_estorno TIMESTAMP NULL,
  registado_por INT NOT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_payments_loan (loan_id),
  KEY idx_payments_data (data_pagamento),
  CONSTRAINT fk_payments_loan FOREIGN KEY (loan_id) REFERENCES loans(id),
  CONSTRAINT fk_payments_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_payments_installment FOREIGN KEY (installment_id) REFERENCES loan_installments(id),
  CONSTRAINT fk_payments_wallet FOREIGN KEY (carteira_id) REFERENCES wallets(id),
  CONSTRAINT fk_payments_registado FOREIGN KEY (registado_por) REFERENCES users(id),
  CONSTRAINT fk_payments_estornado FOREIGN KEY (estornado_por) REFERENCES users(id),
  CONSTRAINT chk_payments_valor CHECK (valor_pago >= 1)
);

CREATE TABLE payment_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  installment_id INT NOT NULL,
  valor_alocado DECIMAL(15,2) NOT NULL,
  tipo_alocacao ENUM('Juros','Principal','Multa') NOT NULL,
  data_registo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_allocations_payment (payment_id),
  CONSTRAINT fk_allocations_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_allocations_installment FOREIGN KEY (installment_id) REFERENCES loan_installments(id)
);
