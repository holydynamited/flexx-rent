SET @users_is_blocked_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'users'
    AND column_name = 'is_blocked'
);

SET @add_users_is_blocked_sql := IF(
  @users_is_blocked_exists = 0,
  'ALTER TABLE users ADD COLUMN is_blocked TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE stmt FROM @add_users_is_blocked_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @profiles_rejection_reason_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'profiles'
    AND column_name = 'rejection_reason'
);

SET @add_profiles_rejection_reason_sql := IF(
  @profiles_rejection_reason_exists = 0,
  'ALTER TABLE profiles ADD COLUMN rejection_reason TEXT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @add_profiles_rejection_reason_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @payments_payout_calculated_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND column_name = 'payout_calculated'
);

SET @add_payments_payout_calculated_sql := IF(
  @payments_payout_calculated_exists = 0,
  'ALTER TABLE payments ADD COLUMN payout_calculated TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);

PREPARE stmt FROM @add_payments_payout_calculated_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @payments_payout_paid_at_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'payments'
    AND column_name = 'payout_paid_at'
);

SET @add_payments_payout_paid_at_sql := IF(
  @payments_payout_paid_at_exists = 0,
  'ALTER TABLE payments ADD COLUMN payout_paid_at TIMESTAMP NULL DEFAULT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @add_payments_payout_paid_at_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
