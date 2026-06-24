-- Payments MVP migration
-- Safe for repeated execution on MySQL variants without ADD COLUMN IF NOT EXISTS support.

-- 1) payments.transaction_id
SET @payments_transaction_id_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND column_name = 'transaction_id'
);

SET @add_payments_transaction_id_sql := IF(
  @payments_transaction_id_exists = 0,
  'ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(191) NULL',
  'SELECT 1'
);

PREPARE stmt FROM @add_payments_transaction_id_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) payments.transaction_status
SET @payments_transaction_status_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND column_name = 'transaction_status'
);

SET @add_payments_transaction_status_sql := IF(
  @payments_transaction_status_exists = 0,
  'ALTER TABLE payments ADD COLUMN transaction_status VARCHAR(32) NOT NULL DEFAULT ''PENDING''',
  'SELECT 1'
);

PREPARE stmt FROM @add_payments_transaction_status_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) payments.amount
SET @payments_amount_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND column_name = 'amount'
);

SET @add_payments_amount_sql := IF(
  @payments_amount_exists = 0,
  'ALTER TABLE payments ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0.00',
  'SELECT 1'
);

PREPARE stmt FROM @add_payments_amount_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) payments.paid_at
SET @payments_paid_at_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND column_name = 'paid_at'
);

SET @add_payments_paid_at_sql := IF(
  @payments_paid_at_exists = 0,
  'ALTER TABLE payments ADD COLUMN paid_at TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @add_payments_paid_at_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5) Backfill transaction_id for existing rows, then enforce uniqueness
SET @fill_transaction_id_sql := '
  UPDATE payments
  SET transaction_id = CONCAT(''legacy_tx_'', id)
  WHERE transaction_id IS NULL OR transaction_id = ''''
';
PREPARE stmt FROM @fill_transaction_id_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @payments_transaction_id_uniq_idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND index_name = 'uq_payments_transaction_id'
);

SET @add_payments_transaction_id_uniq_idx_sql := IF(
  @payments_transaction_id_uniq_idx_exists = 0,
  'ALTER TABLE payments ADD UNIQUE INDEX uq_payments_transaction_id (transaction_id)',
  'SELECT 1'
);

PREPARE stmt FROM @add_payments_transaction_id_uniq_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6) Supporting index for booking lookup
SET @payments_booking_id_idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND index_name = 'idx_payments_booking_id'
);

SET @add_payments_booking_id_idx_sql := IF(
  @payments_booking_id_idx_exists = 0,
  'ALTER TABLE payments ADD INDEX idx_payments_booking_id (booking_id)',
  'SELECT 1'
);

PREPARE stmt FROM @add_payments_booking_id_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
