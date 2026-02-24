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

  // Cargar admin al iniciar — usar onAuthStateChange como unica fuente de verdad
  // Esto evita llamadas concurrentes a getSession() que causan deadlock del LockManager
  useEffect(() => {
    let mounted = true;

    console.log('[useAuth] init: registrando listener de auth...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] onAuthStateChange:', event, { hasSession: !!session });

      // No competir con login/register que ya manejan el estado
      if (isAuthActionInProgress.current) {
        console.log('[useAuth] onAuthStateChange: ignorado (accion en progreso)');
        // Pero si seguimos en carga inicial, marcar como listo
        if (isLoading && mounted) setIsLoading(false);
        return;
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (session?.user) {
          console.log('[useAuth] onAuthStateChange: cargando perfil admin...');
          const { data } = await getCurrentAdmin();
          if (mounted) {
            setAdmin(data);
            setIsLoading(false);
          }
        } else {
          if (mounted) {
            setAdmin(null);
            setIsLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setAdmin(null);
          setIsLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // No hacer nada, el admin ya esta cargado
        if (mounted && isLoading) setIsLoading(false);
      }
    });

    // Fallback: si onAuthStateChange no dispara en 5s, dejar de mostrar loading
    const fallbackTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('[useAuth] fallback: timeout de 5s, dejando de cargar');
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      console.log('[useAuth] login: llamando loginAdmin...');
      const { data, error } = await loginAdmin(email, password);
      console.log('[useAuth] login: loginAdmin respondio', { hasData: !!data, error });

      if (error) return error;

      if (!data) return 'No se pudo obtener el perfil de administrador';

      setAdmin(data);
      return null;
    } catch (err) {
      console.error('[useAuth] login: excepcion:', err);
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
