import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail } from '@/lib/auth';

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  // Si ya esta autenticado, redirigir al dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    setServerError(null);

    try {
      console.log('[Login] handleLogin: iniciando...');
      const error = await login(email, password);
      console.log('[Login] handleLogin: login respondio', { error });

      if (error) {
        setServerError(error);
        setIsLoading(false);
        return;
      }

      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('[Login] handleLogin: excepcion:', err);
      setServerError('Error inesperado. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header showBack title="Iniciar Sesion" />

      <main className="flex-1 flex flex-col p-4">
        <Card variant="elevated" className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            Bienvenido de vuelta
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Ingresa con tu email y contraseña
          </p>

          <div className="space-y-4" onKeyDown={handleKeyDown}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              error={errors.email}
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                error={errors.password}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </Card>

        {serverError && (
          <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center text-sm">
            {serverError}
          </div>
        )}

        <div className="flex-1" />

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleLogin}
            isLoading={isLoading}
          >
            Iniciar Sesion
          </Button>

          <p className="text-center text-gray-500 text-sm">
            ¿No tienes cuenta?{' '}
            <button
              onClick={() => navigate('/auth/register')}
              className="text-primary hover:underline"
            >
              Crear cuenta
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
