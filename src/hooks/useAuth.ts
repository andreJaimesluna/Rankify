import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { registerAdmin, loginAdmin, getCurrentAdmin, signOut } from '@/lib/auth';
import type { Admin } from '@/types';

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (email: string, password: string, displayName: string, avatarUrl: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  register: async () => null,
  login: async () => null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthContextType {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Flag para evitar que onAuthStateChange compita con login/register
  const isAuthActionInProgress = useRef(false);

  // Cargar admin al iniciar
  useEffect(() => {
    getCurrentAdmin().then(({ data }) => {
      setAdmin(data);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // Escuchar cambios de auth (solo para SIGNED_OUT y recargas de pagina)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      // No competir con login/register que ya manejan el estado
      if (isAuthActionInProgress.current) return;

      if (event === 'SIGNED_IN') {
        const { data } = await getCurrentAdmin();
        if (data) setAdmin(data);
      } else if (event === 'SIGNED_OUT') {
        setAdmin(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    displayName: string,
    avatarUrl: string
  ): Promise<string | null> => {
    isAuthActionInProgress.current = true;
    try {
      const { data, error } = await registerAdmin(email, password, displayName, avatarUrl);

      if (error) return error;

      setAdmin(data);
      return null;
    } catch {
      return 'Error inesperado al registrar';
    } finally {
      isAuthActionInProgress.current = false;
    }
  }, []);

  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<string | null> => {
    isAuthActionInProgress.current = true;
    try {
      const { data, error } = await loginAdmin(email, password);

      if (error) return error;

      if (!data) return 'No se pudo obtener el perfil de administrador';

      setAdmin(data);
      return null;
    } catch {
      return 'Error inesperado al iniciar sesion';
    } finally {
      isAuthActionInProgress.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setAdmin(null);
  }, []);

  return {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    register,
    login,
    logout,
  };
}
