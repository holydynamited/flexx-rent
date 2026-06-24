-- Agent CRM schema sync for current DB model:
-- - properties.agent_id -> profiles.id
-- - bookings.status: NEW | PENDING | CANCELLED
-- - bookings.agent_id -> profiles.id (instead of users.id)

-- 1) Properties ownership column for agent scoping
SET @properties_agent_column_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND column_name = 'agent_id'
);

SET @add_properties_agent_column_sql := IF(
  @properties_agent_column_exists = 0,
  'ALTER TABLE properties ADD COLUMN agent_id INT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @add_properties_agent_column_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @properties_agent_index_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'properties'
    AND index_name = 'idx_properties_agent_id'
);

SET @add_properties_agent_index_sql := IF(
  @properties_agent_index_exists = 0,
  'ALTER TABLE properties ADD INDEX idx_properties_agent_id (agent_id)',
  'SELECT 1'
);

PREPARE stmt FROM @add_properties_agent_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @properties_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'properties'
    AND CONSTRAINT_NAME = 'fk_properties_agent_profile'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @properties_fk_sql := IF(
  @properties_fk_exists = 0,
  'ALTER TABLE properties ADD CONSTRAINT fk_properties_agent_profile FOREIGN KEY (agent_id) REFERENCES profiles(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE stmt FROM @properties_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Booking status normalization
ALTER TABLE bookings
  MODIFY COLUMN status ENUM('NEW', 'PENDING_PAYMENT', 'RESERVED', 'PENDING', 'CANCELLED')
  NOT NULL DEFAULT 'NEW';

UPDATE bookings
SET status = 'PENDING'
WHERE status IN ('PENDING_PAYMENT', 'RESERVED');

ALTER TABLE bookings
  MODIFY COLUMN status ENUM('NEW', 'PENDING', 'CANCELLED')
  NOT NULL DEFAULT 'NEW';

-- 3) Rebind bookings.agent_id from users.id -> profiles.id
SET @bookings_old_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_NAME = 'bookings_ibfk_3'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @drop_old_fk_sql := IF(
  @bookings_old_fk_exists = 1,
  'ALTER TABLE bookings DROP FOREIGN KEY bookings_ibfk_3',
  'SELECT 1'
);

PREPARE stmt FROM @drop_old_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Convert existing agent_id(user_id) values to profile_id.
UPDATE bookings b
LEFT JOIN profiles p ON p.user_id = b.agent_id
SET b.agent_id = p.id
WHERE b.agent_id IS NOT NULL;

SET @bookings_new_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND CONSTRAINT_NAME = 'fk_bookings_agent_profile'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);

SET @add_new_fk_sql := IF(
  @bookings_new_fk_exists = 0,
  'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_agent_profile FOREIGN KEY (agent_id) REFERENCES profiles(id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE stmt FROM @add_new_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
