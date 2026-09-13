-- Speeds up the admin "Clientes" search (firstName/lastName/email/phone
-- contains, case-insensitive), which today can only sequential-scan for a
-- "%term%" pattern. pg_trgm + GIN indexes let Postgres use an index for
-- substring search — this stops being fast without it once the customer
-- table grows into the thousands.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "User_firstName_trgm_idx" ON "User" USING gin ("firstName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_lastName_trgm_idx" ON "User" USING gin ("lastName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_email_trgm_idx" ON "User" USING gin ("email" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_phone_trgm_idx" ON "User" USING gin ("phone" gin_trgm_ops);
