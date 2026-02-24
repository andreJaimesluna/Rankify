import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/components/auth';
import {
  Home,
  JoinSession,
  WaitingRoom,
  PlaySession,
  Results,
  CreateSession,
  SessionLobby,
  LiveSession,
  SessionResults,
} from '@/pages';
import { Register } from '@/pages/auth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Página principal */}
          <Route path="/" element={<Home />} />

          {/* Rutas de autenticación */}
          <Route path="/auth/register" element={<Register />} />

          {/* Rutas de estudiante */}
          <Route path="/student/join" element={<JoinSession />} />
          <Route path="/student/waiting" element={<WaitingRoom />} />
          <Route path="/student/play" element={<PlaySession />} />
          <Route path="/student/results" element={<Results />} />

          {/* Rutas de administrador */}
          <Route path="/admin/create" element={<CreateSession />} />
          <Route path="/admin/lobby" element={<SessionLobby />} />
          <Route path="/admin/live" element={<LiveSession />} />
          <Route path="/admin/results" element={<SessionResults />} />

          {/* Ruta por defecto (404) */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                <p className="text-gray-400 mb-6">Página no encontrada</p>
                <a
                  href="/"
                  className="text-primary hover:underline"
                >
                  Volver al inicio
                </a>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
