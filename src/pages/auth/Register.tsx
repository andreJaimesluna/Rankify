import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Input, Card } from '@/components/ui';
import { AvatarSelector } from '@/components/auth/AvatarSelector';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword } from '@/lib/auth';

type Step = 'credentials' | 'profile';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState<Step>('credentials');

  // Step 1 state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 state
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Shared state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Step 1: Validar y avanzar ---
  const handleStep1Next = () => {
    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setStep('profile');
      setServerError(null);
    }
  };

  // --- Step 2: Registrar ---
  const handleRegister = async () => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'El nombre es requerido';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!avatarUrl) {
      newErrors.avatar = 'Selecciona un avatar';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    setServerError(null);

    const error = await register(email, password, displayName.trim(), avatarUrl);

    if (error) {
      setServerError(error);
      // Si es error de email duplicado, volver al paso 1
      if (error.includes('email') || error.includes('registrado')) {
        setStep('credentials');
      }
      setIsLoading(false);
      return;
    }

    // Registro exitoso → redirigir al dashboard (por ahora, admin/create)
    navigate('/admin/create', { replace: true });
  };

  // --- Step 1: Credenciales ---
  if (step === 'credentials') {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col">
        <Header showBack title="Crear Cuenta" />

        <main className="flex-1 flex flex-col p-4">
          {/* Indicador de pasos */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <span className="text-sm text-white font-medium hidden sm:inline">Credenciales</span>
            </div>
            <div className="w-8 h-0.5 bg-dark-600" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-dark-600 text-gray-500 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span className="text-sm text-gray-500 hidden sm:inline">Perfil</span>
            </div>
          </div>

          <Card variant="elevated" className="mb-6">
            <h2 className="text-xl font-bold text-white mb-2">
              Tu email y contraseña
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Estos datos serán tu acceso a Rankify
            </p>

            <div className="space-y-4">
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
                  placeholder="Mínimo 8 caracteres con un número"
                  error={errors.password}
                  autoComplete="new-password"
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

              <Input
                label="Confirmar contraseña"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
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
              onClick={handleStep1Next}
            >
              Continuar
            </Button>

            <p className="text-center text-gray-500 text-sm">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => navigate('/auth/login')}
                className="text-primary hover:underline"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </main>
      </div>
    );
  }

  // --- Step 2: Perfil ---
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header showBack onBack={() => setStep('credentials')} title="Crear Cuenta" />

      <main className="flex-1 flex flex-col p-4">
        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center text-sm font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-success font-medium hidden sm:inline">Credenciales</span>
          </div>
          <div className="w-8 h-0.5 bg-primary" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
              2
            </div>
            <span className="text-sm text-white font-medium hidden sm:inline">Perfil</span>
          </div>
        </div>

        <Card variant="elevated" className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            Tu perfil
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Así te verán los participantes
          </p>

          <div className="space-y-6">
            <Input
              label="Nombre para mostrar"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: Profesor García"
              error={errors.displayName}
              maxLength={100}
            />

            <div>
              <AvatarSelector selected={avatarUrl} onSelect={setAvatarUrl} />
              {errors.avatar && (
                <p className="mt-2 text-sm text-error">{errors.avatar}</p>
              )}
            </div>
          </div>
        </Card>

        {serverError && (
          <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center text-sm">
            {serverError}
          </div>
        )}

        <div className="flex-1" />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleRegister}
          isLoading={isLoading}
        >
          Crear Cuenta
        </Button>
      </main>
    </div>
  );
}
