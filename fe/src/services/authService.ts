// ============================================
// AUTH SERVICE — Llamadas a la API de autenticación
// ============================================
import axios from 'axios';
import type { AuthResponse, LoginCredentials, RegisterData } from '../types';
import { api } from './api';

const BASE_URL = 'https://dummyjson.com';

/**
 * Autentica al usuario con username y password.
 * Retorna tokens + datos del usuario.
 *
 * Se usa `axios` directo (no la instancia `api`) porque el interceptor de
 * `api` inyecta un Authorization header que todavía no existe en este punto.
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${BASE_URL}/auth/login`, {
    username: credentials.username,
    password: credentials.password,
    expiresInMins: 30,
  });
  return data;
}

/**
 * Registra un nuevo usuario.
 * dummyjson.com no tiene endpoint real de registro, así que esta función
 * simula uno para poder practicar el flujo completo (formulario → store →
 * navegación condicional) sin depender de un backend propio.
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    id: Math.floor(Math.random() * 1000),
    username: data.username,
    email: data.email,
    firstName: data.firstName ?? data.username,
    lastName: data.lastName ?? '',
    image: '',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };
}

/**
 * Renueva el access token usando el refresh token.
 * Llamado automáticamente por el interceptor de Axios en respuestas 401.
 * Usa axios directo (NO la instancia `api`) para evitar un loop infinito de
 * interceptores.
 */
export async function refreshTokens(refreshToken: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${BASE_URL}/auth/refresh`, {
    refreshToken,
    expiresInMins: 30,
  });
  return data;
}

/**
 * Obtiene el perfil del usuario autenticado.
 * Ya implementado para que veas el interceptor de auth en acción.
 */
export async function getProfile(): Promise<AuthResponse> {
  const { data } = await api.get<AuthResponse>(`${BASE_URL}/auth/me`);
  return data;
}
