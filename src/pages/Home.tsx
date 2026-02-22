import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header con logo */}
      <header className="pt-12 pb-6 px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Rankify</h1>
        <p className="text-gray-400">Gamificación en tiempo real</p>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md space-y-6">
          {/* Tarjeta de estudiante */}
          <Card
            variant="elevated"
            className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => navigate('/student/join')}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Soy Estudiante</h2>
                <p className="text-gray-400 text-sm">
                  Únete a una sesión con tu código
                </p>
              </div>
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Card>

          {/* Tarjeta de admin */}
          <Card
            variant="elevated"
            className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => navigate('/admin/create')}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-success/20 rounded-xl flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Soy Admin</h2>
                <p className="text-gray-400 text-sm">
                  Crea y administra sesiones
                </p>
              </div>
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Card>
        </div>

        {/* Información adicional */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Compite en tiempo real con tus compañeros</p>
          <p className="mt-1">Responde rápido para obtener más puntos</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-gray-600 text-xs">
        <p>Rankify v1.0</p>
      </footer>
    </div>
  );
}
