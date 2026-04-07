-- Standing passengers + default max capacity 26 (jeepney-style limit)
-- Run ONCE when upgrading an existing database (before restarting the API).
-- If `standing_passengers` already exists (e.g. you recreated DB from schema.sql), skip the ADD COLUMN.

ALTER TABLE users
  ADD COLUMN standing_passengers INT NOT NULL DEFAULT 0
  COMMENT 'Passengers standing (included in current_passengers total)'
  AFTER current_passengers;

-- Normalize legacy default and bump typical jeepney cap to 26
UPDATE users
SET max_capacity = 26
WHERE role = 1 AND (max_capacity IS NULL OR max_capacity = 20);

ALTER TABLE users
  MODIFY COLUMN max_capacity INT NOT NULL DEFAULT 26;
