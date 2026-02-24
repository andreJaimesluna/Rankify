-- =============================================
-- RANKIFY v1.1 — Seed de datos de prueba
-- =============================================
-- Ejecutar después de la migración 001_v1.1_schema.sql
-- Crea 1 admin de prueba y 3 preguntas de ejemplo
-- =============================================

BEGIN;

-- 1. Admin de prueba
INSERT INTO admins (id, email, password_hash, display_name, institution, bio, default_preferences)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@rankify.test',
  -- Hash de "password123" (bcrypt) — solo para desarrollo
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PQm2Pro0Y9gSHmGNqKZCy',
  'Admin Demo',
  'Universidad de Pruebas',
  'Cuenta de administrador para desarrollo y testing.',
  '{"default_time_limit": 30, "show_ranking": true}'::jsonb
);

-- 2. Tres preguntas de ejemplo
INSERT INTO questions (id, admin_id, text, options, correct_option_index, time_limit_seconds, tags)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '¿Cuál es el lenguaje de programación más usado en desarrollo web frontend?',
    '[{"id": 0, "text": "Python"}, {"id": 1, "text": "JavaScript"}, {"id": 2, "text": "Java"}, {"id": 3, "text": "C++"}]'::jsonb,
    1,
    30,
    ARRAY['programación', 'web', 'frontend']
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '¿Qué protocolo se usa para transferir páginas web?',
    '[{"id": 0, "text": "FTP"}, {"id": 1, "text": "SMTP"}, {"id": 2, "text": "HTTP"}, {"id": 3, "text": "SSH"}]'::jsonb,
    2,
    25,
    ARRAY['redes', 'web', 'protocolos']
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    '¿Cuántos bits tiene un byte?',
    '[{"id": 0, "text": "4"}, {"id": 1, "text": "8"}, {"id": 2, "text": "16"}, {"id": 3, "text": "32"}]'::jsonb,
    1,
    20,
    ARRAY['fundamentos', 'hardware']
  );

COMMIT;
