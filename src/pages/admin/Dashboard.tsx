import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, BottomNav } from '@/components/layout';
import { Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { getAdminRooms, getAdminStats } from '@/lib/supabase';
import type { AdminStats } from '@/lib/supabase';
import type { Room } from '@/types';
import { ROUTES } from '@/lib/constants';
import { adminNavItems } from './navItems';

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  active: 'En curso',
  finished: 'Finalizada',
  archived: 'Archivada',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  scheduled: 'bg-amber-500/20 text-amber-400',
  active: 'bg-success/20 text-success',
  finished: 'bg-primary/20 text-primary',
  archived: 'bg-dark-600 text-gray-500',
};

export function Dashboard() {
  const navigate = useNavigate();
  const { admin, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/register', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Cargar datos del dashboard
  useEffect(() => {
    if (!admin) return;

    async function loadDashboard() {
      setIsLoading(true);

      const [statsResult, roomsResult] = await Promise.all([
        getAdminStats(admin!.id),
        getAdminRooms(admin!.id),
      ]);

      if (statsResult.data) setStats(statsResult.data);
      if (roomsResult.data) setRecentRooms(roomsResult.data.slice(0, 5));

      setIsLoading(false);
    }

    loadDashboard();
  }, [admin]);

  if (authLoading || !admin) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col pb-24">
      <Header
        rightContent={
          <button
            onClick={logout}
            className="text-gray-400 hover:text-gray-200 transition-colors text-sm"
          >
            Salir
          </button>
        }
      />

      <main className="flex-1 p-4 space-y-6">
        {/* Saludo */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            {admin.avatar_url && (
              <span className="text-3xl">{admin.avatar_url}</span>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                Hola, {admin.display_name}
              </h1>
              <p className="text-gray-400 text-sm">
                Bienvenido a tu panel de control
              </p>
            </div>
          </div>
        </div>

        {/* Metricas */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} variant="outlined" padding="sm">
                <div className="animate-pulse">
                  <div className="h-4 bg-dark-600 rounded w-16 mb-2" />
                  <div className="h-8 bg-dark-600 rounded w-10" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Card variant="outlined" padding="sm">
              <p className="text-gray-400 text-xs mb-1">Total salas</p>
              <p className="text-2xl font-bold text-white">{stats?.totalRooms || 0}</p>
            </Card>
            <Card variant="outlined" padding="sm">
              <p className="text-gray-400 text-xs mb-1">Participantes</p>
              <p className="text-2xl font-bold text-white">{stats?.totalParticipants || 0}</p>
            </Card>
            <Card variant="outlined" padding="sm">
              <p className="text-gray-400 text-xs mb-1">Promedio/sala</p>
              <p className="text-2xl font-bold text-white">{stats?.avgParticipantsPerRoom || 0}</p>
            </Card>
            <Card variant="outlined" padding="sm">
              <p className="text-gray-400 text-xs mb-1">Ultima sala</p>
              <p className="text-sm font-medium text-white truncate">
                {stats?.lastActiveRoom?.name || '—'}
              </p>
            </Card>
          </div>
        )}

        {/* Acciones rapidas */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Acciones rapidas</h2>
          <div className="grid grid-cols-3 gap-3">
            <Card
              variant="elevated"
              padding="sm"
              className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate(ROUTES.ADMIN_CREATE_ROOM)}
            >
              <div className="flex flex-col items-center text-center gap-2 py-2">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-white">Crear Sala</span>
              </div>
            </Card>

            <Card
              variant="elevated"
              padding="sm"
              className="cursor-pointer opacity-50"
            >
              <div className="flex flex-col items-center text-center gap-2 py-2">
                <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-500">Banco Preguntas</span>
              </div>
            </Card>

            <Card
              variant="elevated"
              padding="sm"
              className="cursor-pointer opacity-50"
            >
              <div className="flex flex-col items-center text-center gap-2 py-2">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-500">Historial</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Salas recientes */}
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Salas recientes</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} variant="outlined">
                  <div className="animate-pulse">
                    <div className="h-5 bg-dark-600 rounded w-40 mb-2" />
                    <div className="h-4 bg-dark-600 rounded w-24" />
                  </div>
                </Card>
              ))}
            </div>
          ) : recentRooms.length > 0 ? (
            <div className="space-y-3">
              {recentRooms.map((room) => (
                <Card
                  key={room.id}
                  variant="outlined"
                  className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  onClick={() => navigate(`/admin/rooms/${room.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{room.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-500 text-xs font-mono">{room.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[room.status]}`}>
                          {statusLabels[room.status]}
                        </span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="outlined">
              <div className="text-center py-6">
                <p className="text-gray-400">No tienes salas aun</p>
                <p className="text-gray-500 text-sm mt-1">Crea tu primera sala para comenzar</p>
              </div>
            </Card>
          )}
        </div>
      </main>

      <BottomNav items={adminNavItems} />
    </div>
  );
}
