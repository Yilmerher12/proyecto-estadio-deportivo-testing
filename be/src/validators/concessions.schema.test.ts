import { describe, expect, it } from 'vitest';
import { createConcessionSchema } from './concessions.schema';

const valid = { name: 'Perro caliente', category: 'Comida', price: 8000, stock: 50 };

// Envuelve el body como lo hace el controlador: schema.parse({ body: req.body }).
function parse(body: Record<string, unknown>) {
  return createConcessionSchema.safeParse({ body });
}

describe('createConcessionSchema', () => {
  it('should accept price 0 and stock 0 (lower boundary)', () => {
    // Arrange + Act
    const result = parse({ ...valid, price: 0, stock: 0 });

    // Assert
    expect(result.success).toBe(true);
  });

  it('should reject a negative price', () => {
    // Arrange + Act
    const result = parse({ ...valid, price: -1 });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['body', 'price']);
  });

  it('should reject a category that is not in the list', () => {
    // Arrange + Act
    const result = parse({ ...valid, category: 'Juguetes' });

    // Assert
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['body', 'category']);
  });

  // Valores límite del nombre: mínimo 2 y máximo 200 caracteres.
  it.each([
    { length: 1, ok: false },
    { length: 2, ok: true },
    { length: 200, ok: true },
    { length: 201, ok: false },
  ])('should return success=$ok for a name of $length characters', ({ length, ok }) => {
    // Arrange + Act
    const result = parse({ ...valid, name: 'a'.repeat(length) });

    // Assert
    expect(result.success).toBe(ok);
  });

  it('should convert price and stock sent as text (multipart/form-data)', () => {
    // Arrange + Act
    const result = parse({ ...valid, price: '8000', stock: '50' });

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.body.price).toBe(8000);
    expect(result.data?.body.stock).toBe(50);
  });
});
