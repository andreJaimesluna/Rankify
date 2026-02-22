-- =============================================
-- RANKIFY - Database Schema for Supabase
-- =============================================
-- Ejecuta este script en Supabase SQL Editor
-- Dashboard -> SQL Editor -> New Query

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(5) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  current_question_index INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- Tabla de preguntas
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  options JSONB NOT NULL,
  correct_option_id INTEGER NOT NULL,
  time_limit INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de participantes
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  score INTEGER DEFAULT 0,
  is_connected BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, nickname)
);

-- Tabla de respuestas
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  selected_option_id INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, participant_id)
);

-- =============================================
-- ÍNDICES PARA RENDIMIENTO
-- =============================================

CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_score ON participants(session_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_questions_session ON questions(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(session_id, question_order);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_participant ON answers(participant_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
-- Para el MVP, permitimos acceso público
-- En producción, deberías ajustar estas políticas

-- Habilitar RLS en todas las tablas
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (para el MVP)
-- Sessions
CREATE POLICY "Permitir lectura pública de sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de sessions" ON sessions
  FOR UPDATE USING (true);

-- Questions
CREATE POLICY "Permitir lectura pública de questions" ON questions
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de questions" ON questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir eliminación pública de questions" ON questions
  FOR DELETE USING (true);

-- Participants
CREATE POLICY "Permitir lectura pública de participants" ON participants
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de participants" ON participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de participants" ON participants
  FOR UPDATE USING (true);

-- Answers
CREATE POLICY "Permitir lectura pública de answers" ON answers
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción pública de answers" ON answers
  FOR INSERT WITH CHECK (true);

-- =============================================
-- REALTIME
-- =============================================
-- Habilitar realtime para las tablas necesarias
-- Esto se hace desde el Dashboard de Supabase:
-- Database -> Replication -> Seleccionar tablas: sessions, participants, answers

-- Alternativa por SQL (requiere permisos de superusuario):
-- ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE participants;
-- ALTER PUBLICATION supabase_realtime ADD TABLE answers;

-- =============================================
-- FUNCIÓN PARA LIMPIAR SESIONES EXPIRADAS
-- =============================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM sessions
  WHERE expires_at < NOW()
  AND status != 'active';
END;
$$;

-- Puedes programar esta función con pg_cron si lo tienes habilitado
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions()');
