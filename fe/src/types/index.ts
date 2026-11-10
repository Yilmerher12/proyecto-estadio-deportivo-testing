// ============================================
// TIPOS GLOBALES — week-08 Autenticación
// Estadio Deportivo — Concesiones
// ============================================

/** Tokens recibidos del server al autenticarse */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Datos del usuario autenticado */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image?: string;
  // Campos derivados del dominio (Estadio Deportivo), calculados a partir del
  // id del usuario — no vienen de dummyjson.com, que no conoce este dominio.
  fanTier?: 'Bronce' | 'Plata' | 'Oro';
  ticketsPurchased?: number;
}

/** Payload decodificado del JWT */
export interface JwtPayload {
  sub: number;
  username: string;
  iat: number;
  exp: number;
}

/** Credentials para login */
export interface LoginCredentials {
  username: string;
  password: string;
}

/** Datos para registro */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/** Respuesta del endpoint /auth/login y /auth/refresh */
export interface AuthResponse extends AuthTokens {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image: string;
}

/** Producto de las concesiones (HomeScreen, desde dummyjson.com/products) */
export interface ConcessionProduct {
  id: number;
  title: string;
  price: number;
  category: string;
  thumbnail: string;
}
