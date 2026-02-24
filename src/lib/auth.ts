import { supabase } from './supabase';
import type { Admin } from '@/types';

// Validaciones

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'El email es requerido';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'El formato del email no es válido';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es requerida';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/\d/.test(password)) return 'La contraseña debe contener al menos un número';
  return null;
}

// Registro

export async function registerAdmin(
  email: string,
  password: string,
  displayName: string,
  avatarUrl: string
): Promise<{ data: Admin | null; error: string | null }> {
  // 1. Registrar en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { data: null, error: 'Este email ya está registrado' };
    }
    if (authError.message.includes('rate limit')) {
      return { data: null, error: 'Demasiados intentos. Espera unos minutos.' };
    }
    return { data: null, error: authError.message };
  }

  if (!authData.user) {
    return { data: null, error: 'Error al crear la cuenta' };
  }

  // 2. Crear perfil en tabla admins con el mismo UUID de auth
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .insert({
      id: authData.user.id,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
    })
    .select()
    .single();

  if (adminError) {
    return { data: null, error: 'Cuenta creada pero error al guardar perfil: ' + adminError.message };
  }

  return { data: adminData as Admin, error: null };
}

// Login

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ data: Admin | null; error: string | null }> {
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

  // Obtener perfil del admin
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (adminError) {
    // Si no tiene perfil en admins, crear uno basico
    const { data: newAdmin, error: insertError } = await supabase
      .from('admins')
      .insert({
        id: authData.user.id,
        email: authData.user.email || email,
        display_name: email.split('@')[0],
        avatar_url: null,
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: 'Error al obtener perfil de administrador' };
    }

    return { data: newAdmin as Admin, error: null };
  }

  return { data: adminData as Admin, error: null };
}

// Obtener admin actual

export async function getCurrentAdmin(): Promise<{ data: Admin | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // Si el usuario existe en Auth pero no en admins, crear perfil basico
    const { data: newAdmin, error: insertError } = await supabase
      .from('admins')
      .insert({
        id: user.id,
        email: user.email || '',
        display_name: user.email?.split('@')[0] || 'Admin',
        avatar_url: null,
      })
      .select()
      .single();

    if (insertError) {
      return { data: null, error: 'Error al crear perfil de administrador' };
    }

    return { data: newAdmin as Admin, error: null };
  }

  return { data: data as Admin, error: null };
}

// Cerrar sesión

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
