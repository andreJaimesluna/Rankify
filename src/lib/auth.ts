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

// Asegurar que existe perfil en tabla admins (idempotente con upsert)
async function ensureAdminProfile(
  userId: string,
  email: string,
  displayName?: string,
  avatarUrl?: string | null
): Promise<{ data: Admin | null; error: string | null }> {
  try {
    // Primero intentar obtener el perfil existente
    const { data: existing } = await supabase
      .from('admins')
      .select('*')
      .eq('id', userId)
      .single();

    if (existing) {
      return { data: existing as Admin, error: null };
    }

    // Si no existe, crear con upsert (seguro contra race conditions)
    const { data, error } = await supabase
      .from('admins')
      .upsert({
        id: userId,
        email,
        display_name: displayName || email.split('@')[0],
        avatar_url: avatarUrl || null,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return { data: null, error: 'Error al crear perfil: ' + error.message };
    }

    return { data: data as Admin, error: null };
  } catch (err) {
    return { data: null, error: 'Error de conexion al verificar perfil' };
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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
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

    return ensureAdminProfile(authData.user.id, email, displayName, avatarUrl);
  } catch (err) {
    return { data: null, error: 'Error de conexion al registrar' };
  }
}

// Login

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ data: Admin | null; error: string | null }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
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

    return ensureAdminProfile(authData.user.id, authData.user.email || email);
  } catch (err) {
    return { data: null, error: 'Error de conexion al iniciar sesion' };
  }
}

// Obtener admin actual

export async function getCurrentAdmin(): Promise<{ data: Admin | null; error: string | null }> {
  try {
    // Usar getSession (lee de localStorage, no hace network call) para evitar fallos silenciosos
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return { data: null, error: null };
    }

    return ensureAdminProfile(session.user.id, session.user.email || '');
  } catch (err) {
    return { data: null, error: 'Error al obtener sesion actual' };
  }
}

// Cerrar sesion

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
