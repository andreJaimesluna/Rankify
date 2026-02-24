-- =============================================
-- RANKIFY v1.1 — Migración: Adaptar admins para Supabase Auth
-- =============================================
-- Supabase Auth maneja contraseñas internamente en auth.users.
-- La tabla admins pasa a ser solo perfil, vinculada por UUID.
-- =============================================

-- Eliminar columna password_hash (Supabase Auth la maneja)
ALTER TABLE admins DROP COLUMN IF EXISTS password_hash;

-- Limpiar seed anterior (el admin demo tenía password_hash)
DELETE FROM questions WHERE admin_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM admins WHERE id = 'a0000000-0000-0000-0000-000000000001';
