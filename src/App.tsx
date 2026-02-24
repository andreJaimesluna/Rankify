import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/components/auth';
import {
  Home,
  JoinSession,
  WaitingRoom,
  PlaySession,
  Results,
  Dashboard,
  CreateRoom,
  RoomDetail,
  RoomQuestions,
  SessionLobby,
  LiveSession,
  SessionResults,
  QuestionsPlaceholder,
  RoomsPlaceholder,
  HistoryPlaceholder,
  ProfilePlaceholder,
} from '@/pages';
import { Register, Login } from '@/pages/auth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Pagina principal */}
          <Route path="/" element={<Home />} />

          {/* Rutas de autenticacion */}
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/login" element={<Login />} />

          {/* Rutas de estudiante */}
          <Route path="/student/join" element={<JoinSession />} />
          <Route path="/student/waiting" element={<WaitingRoom />} />
          <Route path="/student/play" element={<PlaySession />} />
          <Route path="/student/results" element={<Results />} />

          {/* Rutas de administrador */}
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/rooms/new" element={<CreateRoom />} />
          <Route path="/admin/rooms/:id" element={<RoomDetail />} />
          <Route path="/admin/rooms/:id/questions" element={<RoomQuestions />} />
          <Route path="/admin/lobby" element={<SessionLobby />} />
          <Route path="/admin/live" element={<LiveSession />} />
          <Route path="/admin/results" element={<SessionResults />} />

          {/* Admin placeholders */}
          <Route path="/admin/questions" element={<QuestionsPlaceholder />} />
          <Route path="/admin/rooms" element={<RoomsPlaceholder />} />
          <Route path="/admin/history" element={<HistoryPlaceholder />} />
          <Route path="/admin/profile" element={<ProfilePlaceholder />} />

          {/* Ruta por defecto (404) */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
                <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                <p className="text-gray-400 mb-6">Pagina no encontrada</p>
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
