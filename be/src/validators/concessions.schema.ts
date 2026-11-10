import { z } from 'zod';
import { CONCESSION_CATEGORIES } from '../models/concession.model';

// El create llega como multipart/form-data cuando trae imagen, así que
// price y stock viajan como texto: z.coerce los convierte a número.
export const createConcessionSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
    description: z.string().max(1000).optional(),
    category: z.enum(CONCESSION_CATEGORIES, {
      error: 'La categoría debe ser Comida, Bebida o Merchandising',
    }),
    price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
    stock: z.coerce.number().int().min(0).optional(),
  }),
});

// Campos sin .default(): un PUT parcial no debe pisar valores ausentes.
export const updateConcessionSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(200).optional(),
    description: z.string().max(1000).optional(),
    category: z.enum(CONCESSION_CATEGORIES).optional(),
    price: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().int().min(0).optional(),
  }),
});

export type CreateConcessionInput = z.infer<typeof createConcessionSchema>['body'];
export type UpdateConcessionInput = z.infer<typeof updateConcessionSchema>['body'];
