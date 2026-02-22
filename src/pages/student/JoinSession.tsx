import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout';
import { Button, Input, CodeInput, Card } from '@/components/ui';
import { useSession } from '@/hooks';
import { isValidSessionCode, isValidNickname } from '@/lib/utils';

export function JoinSession() {
  const navigate = useNavigate();
  const { joinExistingSession, isLoading, error, clearError } = useSession();

  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [codeError, setCodeError] = useState('');
  const [nicknameError, setNicknameError] = useState('');

  const handleCodeChange = (value: string) => {
    setCode(value);
    setCodeError('');
    clearError();
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setNicknameError('');
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar código
    if (!isValidSessionCode(code)) {
      setCodeError('El código debe tener 5 caracteres');
      return;
    }

    // Validar nickname
    if (!isValidNickname(nickname)) {
      setNicknameError('El nombre debe tener entre 2 y 20 caracteres');
      return;
    }

    const participant = await joinExistingSession(code.toUpperCase(), nickname.trim());

    if (participant) {
      navigate('/student/waiting', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header showBack title="Unirse a Sesión" />

      <main className="flex-1 flex flex-col px-4 py-6">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Código de sesión */}
          <Card variant="elevated" className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              Ingresa el código de sesión
            </h2>
            <CodeInput
              value={code}
              onChange={handleCodeChange}
              error={codeError}
              disabled={isLoading}
            />
            <p className="text-center text-gray-500 text-sm mt-3">
              Tu profesor te dará el código
            </p>
          </Card>

          {/* Nickname */}
          <Card variant="elevated" className="mb-6">
            <Input
              label="Tu nombre o apodo"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder="Ej: Juan, SuperStudent, etc."
              error={nicknameError}
              disabled={isLoading}
              maxLength={20}
            />
            <p className="text-gray-500 text-sm mt-2">
              Este nombre aparecerá en el ranking
            </p>
          </Card>

          {/* Error general */}
          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center">
              {error}
            </div>
          )}

          {/* Espacio flexible */}
          <div className="flex-1" />

          {/* Botón de unirse */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            disabled={code.length < 5 || nickname.length < 2}
          >
            Unirme a la Sesión
          </Button>
        </form>
      </main>
    </div>
  );
}
