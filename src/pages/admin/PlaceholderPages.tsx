import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, BottomNav } from '@/components/layout';
import { Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { adminNavItems } from './navItems';

function PlaceholderPage({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/register', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col pb-24">
      <Header title={title} />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card variant="outlined">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-dark-700 rounded-2xl flex items-center justify-center text-gray-500">
              {icon}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
            <p className="text-gray-400 text-sm">{description}</p>
            <p className="text-gray-600 text-xs mt-3">Disponible pronto</p>
          </div>
        </Card>
      </main>
      <BottomNav items={adminNavItems} />
    </div>
  );
}

export function QuestionsPlaceholder() {
  return (
    <PlaceholderPage
      title="Banco de Preguntas"
      description="Administra y reutiliza tus preguntas"
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
  );
}

export function RoomsPlaceholder() {
  return (
    <PlaceholderPage
      title="Mis Salas"
      description="Todas tus salas en un solo lugar"
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      }
    />
  );
}

export function HistoryPlaceholder() {
  return (
    <PlaceholderPage
      title="Historial"
      description="Revisa los resultados de sesiones anteriores"
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
  );
}

export function ProfilePlaceholder() {
  return (
    <PlaceholderPage
      title="Perfil"
      description="Configura tu perfil y preferencias"
      icon={
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      }
    />
  );
}
