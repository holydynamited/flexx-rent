-- Matcher questionnaire persistence migration.
-- Idempotent-safe for MySQL versions with limited IF NOT EXISTS support.

SET @search_questionnaire_table_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
);

SET @create_search_questionnaire_sql := IF(
  @search_questionnaire_table_exists = 0,
  'CREATE TABLE search_questionnaire (
    id INT NOT NULL AUTO_INCREMENT,
    client_profile_id INT NOT NULL,
    city VARCHAR(120) NOT NULL,
    max_total_rent DECIMAL(10,2) NOT NULL,
    min_rooms DECIMAL(3,1) NOT NULL,
    min_area_sqm DECIMAL(10,2) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
  'SELECT 1'
);

PREPARE stmt FROM @create_search_questionnaire_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_client_profile_id_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND column_name = 'client_profile_id'
);
SET @sq_client_profile_id_sql := IF(
  @sq_client_profile_id_exists = 0,
  'ALTER TABLE search_questionnaire ADD COLUMN client_profile_id INT NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sq_client_profile_id_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_city_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND column_name = 'city'
);
SET @sq_city_sql := IF(
  @sq_city_exists = 0,
  'ALTER TABLE search_questionnaire ADD COLUMN city VARCHAR(120) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sq_city_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_max_total_rent_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND column_name = 'max_total_rent'
);
SET @sq_max_total_rent_sql := IF(
  @sq_max_total_rent_exists = 0,
  'ALTER TABLE search_questionnaire ADD COLUMN max_total_rent DECIMAL(10,2) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sq_max_total_rent_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_min_rooms_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND column_name = 'min_rooms'
);
SET @sq_min_rooms_sql := IF(
  @sq_min_rooms_exists = 0,
  'ALTER TABLE search_questionnaire ADD COLUMN min_rooms DECIMAL(3,1) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sq_min_rooms_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_min_area_sqm_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND column_name = 'min_area_sqm'
);
SET @sq_min_area_sqm_sql := IF(
  @sq_min_area_sqm_exists = 0,
  'ALTER TABLE search_questionnaire ADD COLUMN min_area_sqm DECIMAL(10,2) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sq_min_area_sqm_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_is_active_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND column_name = 'is_active'
);
SET @sq_is_active_sql := IF(
  @sq_is_active_exists = 0,
  'ALTER TABLE search_questionnaire ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE stmt FROM @sq_is_active_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_updated_at_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND column_name = 'updated_at'
);
SET @sq_updated_at_sql := IF(
  @sq_updated_at_exists = 0,
  'ALTER TABLE search_questionnaire ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE stmt FROM @sq_updated_at_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Keep only latest questionnaire per client before applying unique constraint.
SET @sq_dedupe_sql := IF(
  @search_questionnaire_table_exists = 1,
  'DELETE q1
   FROM search_questionnaire q1
   JOIN search_questionnaire q2
     ON q1.client_profile_id = q2.client_profile_id
    AND (
      q1.updated_at < q2.updated_at OR
      (q1.updated_at = q2.updated_at AND q1.id < q2.id)
    )',
  'SELECT 1'
);
PREPARE stmt FROM @sq_dedupe_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_unique_client_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND index_name = 'uq_search_questionnaire_client_profile_id'
);
SET @sq_unique_client_sql := IF(
  @sq_unique_client_exists = 0,
  'ALTER TABLE search_questionnaire ADD UNIQUE INDEX uq_search_questionnaire_client_profile_id (client_profile_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sq_unique_client_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_active_city_idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND index_name = 'idx_search_questionnaire_active_city'
);
SET @sq_active_city_idx_sql := IF(
  @sq_active_city_idx_exists = 0,
  'ALTER TABLE search_questionnaire ADD INDEX idx_search_questionnaire_active_city (is_active, city)',
  'SELECT 1'
);
PREPARE stmt FROM @sq_active_city_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sq_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'search_questionnaire'
    AND constraint_name = 'fk_search_questionnaire_client_profile'
    AND constraint_type = 'FOREIGN KEY'
);
SET @sq_fk_sql := IF(
  @sq_fk_exists = 0,
  'ALTER TABLE search_questionnaire
   ADD CONSTRAINT fk_search_questionnaire_client_profile
   FOREIGN KEY (client_profile_id) REFERENCES profiles(id)
   ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sq_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
