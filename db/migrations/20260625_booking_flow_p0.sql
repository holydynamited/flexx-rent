-- Booking flow P0 normalization:
-- NEW -> PENDING_PAYMENT -> RESERVED -> CANCELLED

-- 1) Ensure bookings.status supports transition values + legacy PENDING for data migration.
ALTER TABLE bookings
  MODIFY COLUMN status ENUM('NEW', 'PENDING', 'PENDING_PAYMENT', 'RESERVED', 'CANCELLED')
  NOT NULL DEFAULT 'NEW';

-- Normalize legacy PENDING to PENDING_PAYMENT.
UPDATE bookings
SET status = 'PENDING_PAYMENT'
WHERE status = 'PENDING';

-- Keep only target states in enum.
ALTER TABLE bookings
  MODIFY COLUMN status ENUM('NEW', 'PENDING_PAYMENT', 'RESERVED', 'CANCELLED')
  NOT NULL DEFAULT 'NEW';

-- 2) Ensure properties.status contains hold and paid states.
ALTER TABLE properties
  MODIFY COLUMN status ENUM('AVAILABLE', 'PENDING_PAYMENT', 'RESERVED', 'ARCHIVED')
  NOT NULL DEFAULT 'AVAILABLE';

-- 3) Booking indexes for status-driven checks and expiry sweeps.
SET @bookings_property_status_idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'bookings'
    AND index_name = 'idx_bookings_property_status'
);

SET @add_bookings_property_status_idx_sql := IF(
  @bookings_property_status_idx_exists = 0,
  'ALTER TABLE bookings ADD INDEX idx_bookings_property_status (property_id, status)',
  'SELECT 1'
);

PREPARE stmt FROM @add_bookings_property_status_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @bookings_expires_at_idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'bookings'
    AND index_name = 'idx_bookings_expires_at'
);

SET @add_bookings_expires_at_idx_sql := IF(
  @bookings_expires_at_idx_exists = 0,
  'ALTER TABLE bookings ADD INDEX idx_bookings_expires_at (expires_at)',
  'SELECT 1'
);

PREPARE stmt FROM @add_bookings_expires_at_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) payments indexes required for idempotent webhook processing.
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
