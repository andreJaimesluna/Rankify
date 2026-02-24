-- =============================================
-- RANKIFY v1.1 — Migración de esquema
-- =============================================
-- Este script transforma el esquema v1.0 al modelo v1.1
-- Ejecutar en Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query
--
-- IMPORTANTE: Esta migración elimina las tablas v1.0 y crea
-- el nuevo esquema. Asegúrate de tener backup si hay datos.
-- =============================================

BEGIN;

-- =============================================
-- 1. ELIMINAR ESQUEMA v1.0
-- =============================================

-- Eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Permitir lectura pública de answers" ON answers;
DROP POLICY IF EXISTS "Permitir inserción pública de answers" ON answers;
DROP POLICY IF EXISTS "Permitir lectura pública de participants" ON participants;
DROP POLICY IF EXISTS "Permitir inserción pública de participants" ON participants;
DROP POLICY IF EXISTS "Permitir actualización pública de participants" ON participants;
DROP POLICY IF EXISTS "Permitir lectura pública de questions" ON questions;
DROP POLICY IF EXISTS "Permitir inserción pública de questions" ON questions;
DROP POLICY IF EXISTS "Permitir eliminación pública de questions" ON questions;
DROP POLICY IF EXISTS "Permitir lectura pública de sessions" ON sessions;
DROP POLICY IF EXISTS "Permitir inserción pública de sessions" ON sessions;
DROP POLICY IF EXISTS "Permitir actualización pública de sessions" ON sessions;

-- Eliminar función de limpieza v1.0
DROP FUNCTION IF EXISTS cleanup_expired_sessions();

-- Eliminar tablas v1.0 (en orden por dependencias)
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- =============================================
-- 2. CREAR TIPOS ENUM
-- =============================================

CREATE TYPE room_status AS ENUM ('draft', 'scheduled', 'active', 'finished', 'archived');
CREATE TYPE question_order_type AS ENUM ('sequential', 'random');

-- =============================================
-- 3. CREAR TABLAS v1.1
-- =============================================

-- Tabla de administradores
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  institution VARCHAR(255),
  bio TEXT,
  default_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banco de preguntas (ahora pertenecen a un admin, no a una sesión)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INTEGER NOT NULL,
  time_limit_seconds INTEGER DEFAULT 30,
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Salas de juego (reemplaza sessions)
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(5) UNIQUE NOT NULL,
  status room_status DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  max_participants INTEGER,
  time_limit_per_question INTEGER DEFAULT 30,
  question_order question_order_type DEFAULT 'sequential',
  show_ranking_between_questions BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla puente: preguntas asignadas a salas
CREATE TABLE room_questions (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  PRIMARY KEY (room_id, question_id)
);

-- Participantes de una sala
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_score INTEGER DEFAULT 0,
  UNIQUE(room_id, nickname)
);

-- Respuestas de los participantes
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  room_question_id UUID NOT NULL,
  selected_option_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL,
  score_awarded INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. ÍNDICES PARA RENDIMIENTO
-- =============================================

-- Admins
CREATE INDEX idx_admins_email ON admins(email);

-- Questions
CREATE INDEX idx_questions_admin_id ON questions(admin_id);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);

-- Rooms
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_admin_id ON rooms(admin_id);

-- Room Questions
CREATE INDEX idx_room_questions_room ON room_questions(room_id, order_index);

-- Participants
CREATE INDEX idx_participants_room ON participants(room_id);
CREATE INDEX idx_participants_score ON participants(room_id, total_score DESC);

-- Answers
CREATE INDEX idx_answers_participant ON answers(participant_id);
CREATE INDEX idx_answers_room_question ON answers(room_question_id);

-- =============================================
-- 5. TRIGGER PARA updated_at AUTOMÁTICO
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================
-- Para v1.1 mantenemos políticas públicas en participantes/respuestas
-- y restringimos admin-owned resources (se refinará con auth en futuros tickets)

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Admins: acceso público para lectura, inserción y actualización (MVP)
CREATE POLICY "admins_select" ON admins FOR SELECT USING (true);
CREATE POLICY "admins_insert" ON admins FOR INSERT WITH CHECK (true);
CREATE POLICY "admins_update" ON admins FOR UPDATE USING (true);

-- Questions: acceso público (MVP)
CREATE POLICY "questions_select" ON questions FOR SELECT USING (true);
CREATE POLICY "questions_insert" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "questions_update" ON questions FOR UPDATE USING (true);
CREATE POLICY "questions_delete" ON questions FOR DELETE USING (true);

-- Rooms: acceso público (MVP)
CREATE POLICY "rooms_select" ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update" ON rooms FOR UPDATE USING (true);

-- Room Questions: acceso público (MVP)
CREATE POLICY "room_questions_select" ON room_questions FOR SELECT USING (true);
CREATE POLICY "room_questions_insert" ON room_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "room_questions_delete" ON room_questions FOR DELETE USING (true);

-- Participants: acceso público
CREATE POLICY "participants_select" ON participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_update" ON participants FOR UPDATE USING (true);

-- Answers: acceso público
CREATE POLICY "answers_select" ON answers FOR SELECT USING (true);
CREATE POLICY "answers_insert" ON answers FOR INSERT WITH CHECK (true);

-- =============================================
-- 7. REALTIME
-- =============================================
-- Habilitar realtime para tablas que lo necesitan
-- Ejecutar desde Dashboard o con permisos de superusuario:

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;

COMMIT;
