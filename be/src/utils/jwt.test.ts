import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { generateAccessToken, verifyAccessToken } from './jwt';

const payload = { userId: 'u1', email: 'ana@example.com', role: 'user' };

describe('access token', () => {
  it('should return the same payload after generating and verifying a token', () => {
    // Arrange + Act
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);

    // Assert
    expect(decoded).toMatchObject(payload);
  });

  it('should reject a token signed with a different secret', () => {
    // Arrange
    const forged = jwt.sign(payload, 'otro-secreto-distinto-de-mas-de-32-caracteres');

    // Act + Assert
    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it('should reject an expired token', () => {
    // Arrange: mismo secreto, pero venció hace 10 segundos.
    const expired = jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, { expiresIn: -10 });

    // Act + Assert
    expect(() => verifyAccessToken(expired)).toThrow(/expired/i);
  });

  it('should reject a token that was modified', () => {
    // Arrange
    const token = generateAccessToken(payload);
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');

    // Act + Assert
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});
