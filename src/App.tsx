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
      <Routes>
        {/* Pagina principal — no necesita auth */}
        <Route path="/" element={<Home />} />

        {/* Rutas de estudiante — NO usan auth de admin */}
        <Route path="/student/join" element={<JoinSession />} />
        <Route path="/student/waiting" element={<WaitingRoom />} />
        <Route path="/student/play" element={<PlaySession />} />
        <Route path="/student/results" element={<Results />} />

        {/* Rutas de autenticacion y admin — envueltas en AuthProvider */}
        <Route
          path="/auth/*"
          element={
            <AuthProvider>
              <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </AuthProvider>
          }
        />

        <Route
          path="/admin/*"
          element={
            <AuthProvider>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/rooms/new" element={<CreateRoom />} />
                <Route path="/rooms/:id" element={<RoomDetail />} />
                <Route path="/rooms/:id/questions" element={<RoomQuestions />} />
                <Route path="/lobby" element={<SessionLobby />} />
                <Route path="/live" element={<LiveSession />} />
                <Route path="/results" element={<SessionResults />} />
                <Route path="/questions" element={<QuestionsPlaceholder />} />
                <Route path="/rooms" element={<RoomsPlaceholder />} />
                <Route path="/history" element={<HistoryPlaceholder />} />
                <Route path="/profile" element={<ProfilePlaceholder />} />
              </Routes>
            </AuthProvider>
          }
        />

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
    </BrowserRouter>
  );
}

export default App;
