// src/validators/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    email: z.string().email('Correo inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Correo inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Correo inválido'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token requerido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
