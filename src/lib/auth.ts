import { supabase } from './supabase';
import type { Admin } from '@/types';

// Validaciones

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'El email es requerido';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'El formato del email no es valido';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es requerida';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/\d/.test(password)) return 'La contraseña debe contener al menos un numero';
  return null;
}

// Timeout helper — rechaza si la promesa no resuelve en `ms`
function timeoutReject(ms: number, label: string): Promise<never> {
  return new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${label} tardo mas de ${ms}ms`)), ms)
  );
}

// Asegurar que existe perfil en tabla admins (idempotente con upsert)
async function ensureAdminProfile(
  userId: string,
  email: string,
  displayName?: string,
  avatarUrl?: string | null
): Promise<{ data: Admin | null; error: string | null }> {
  try {
    // Intentar obtener el perfil existente (maybeSingle no da error con 0 resultados)
    console.log('[auth] ensureAdminProfile: buscando perfil para', userId);
    const selectResult = await Promise.race([
      supabase.from('admins').select('*').eq('id', userId).maybeSingle(),
      timeoutReject(8000, 'SELECT admins'),
    ]);

    if (selectResult.error) {
      console.error('[auth] ensureAdminProfile: error en SELECT:', selectResult.error.message);
    }

    if (selectResult.data) {
      console.log('[auth] ensureAdminProfile: perfil encontrado');
      return { data: selectResult.data as Admin, error: null };
    }

    // Si no existe, crear con upsert (seguro contra race conditions)
    console.log('[auth] ensureAdminProfile: perfil no encontrado, creando con upsert...');
    const upsertResult = await Promise.race([
      supabase
        .from('admins')
        .upsert({
          id: userId,
          email,
          display_name: displayName || email.split('@')[0],
          avatar_url: avatarUrl || null,
        }, { onConflict: 'id' })
        .select()
        .single(),
      timeoutReject(8000, 'UPSERT admins'),
    ]);

    if (upsertResult.error) {
      console.error('[auth] ensureAdminProfile: error en UPSERT:', upsertResult.error.message);
      return { data: null, error: 'Error al crear perfil: ' + upsertResult.error.message };
    }

    console.log('[auth] ensureAdminProfile: perfil creado exitosamente');
    return { data: upsertResult.data as Admin, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[auth] ensureAdminProfile: excepcion:', msg);
    return { data: null, error: msg };
  }
}

// Registro

export async function registerAdmin(
  email: string,
  password: string,
  displayName: string,
  avatarUrl: string
): Promise<{ data: Admin | null; error: string | null }> {
  try {
    console.log('[auth] registerAdmin: iniciando registro...');
    const { data: authData, error: authError } = await Promise.race([
      supabase.auth.signUp({ email, password }),
      timeoutReject(15000, 'signUp'),
    ]);

    if (authError) {
      console.error('[auth] registerAdmin: error en signUp:', authError.message);
      if (authError.message.includes('already registered')) {
        return { data: null, error: 'Este email ya esta registrado' };
      }
      if (authError.message.includes('rate limit') || authError.message.includes('email_send_rate')) {
        return { data: null, error: 'Demasiados intentos. Espera unos minutos.' };
      }
      return { data: null, error: authError.message };
    }

    if (!authData.user) {
      return { data: null, error: 'Error al crear la cuenta' };
    }

    console.log('[auth] registerAdmin: usuario creado, asegurando perfil admin...');
    return ensureAdminProfile(authData.user.id, email, displayName, avatarUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de conexion al registrar';
    console.error('[auth] registerAdmin: excepcion:', msg);
    return { data: null, error: msg };
  }
}

// Login

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ data: Admin | null; error: string | null }> {
  try {
    console.log('[auth] loginAdmin: iniciando login...');
    const { data: authData, error: authError } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      timeoutReject(15000, 'signInWithPassword'),
    ]);

    if (authError) {
      console.error('[auth] loginAdmin: error en signIn:', authError.message);
      if (authError.message.includes('Invalid login credentials')) {
        return { data: null, error: 'Email o contraseña incorrectos' };
      }
      if (authError.message.includes('rate limit')) {
        return { data: null, error: 'Demasiados intentos. Espera unos minutos.' };
      }
      return { data: null, error: authError.message };
    }

    if (!authData.user) {
      return { data: null, error: 'Error al iniciar sesion' };
    }

    console.log('[auth] loginAdmin: auth exitoso, asegurando perfil admin...');
    return ensureAdminProfile(authData.user.id, authData.user.email || email);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de conexion al iniciar sesion';
    console.error('[auth] loginAdmin: excepcion:', msg);
    return { data: null, error: msg };
  }
}

// Obtener admin actual

export async function getCurrentAdmin(): Promise<{ data: Admin | null; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      console.log('[auth] getCurrentAdmin: no hay sesion activa');
      return { data: null, error: null };
    }

    console.log('[auth] getCurrentAdmin: sesion encontrada, cargando perfil...');
    return ensureAdminProfile(session.user.id, session.user.email || '');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al obtener sesion';
    console.error('[auth] getCurrentAdmin: excepcion:', msg);
    return { data: null, error: msg };
  }
}

// Cerrar sesion

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
