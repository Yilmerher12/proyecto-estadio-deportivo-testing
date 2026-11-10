import * as SecureStore from 'expo-secure-store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokenService';

// SecureStore es nativo (no existe en Node): se simula con un Map en memoria.
vi.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: vi.fn(async (key: string, value: string) => void store.set(key, value)),
    getItemAsync: vi.fn(async (key: string) => store.get(key) ?? null),
    deleteItemAsync: vi.fn(async (key: string) => void store.delete(key)),
  };
});

beforeEach(async () => {
  await clearTokens();
  vi.clearAllMocks();
});

describe('tokenService', () => {
  it('should save both tokens under their own keys', async () => {
    // Arrange + Act
    await saveTokens({ accessToken: 'a1', refreshToken: 'r1' });

    // Assert
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_access_token', 'a1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_refresh_token', 'r1');
    expect(await getAccessToken()).toBe('a1');
    expect(await getRefreshToken()).toBe('r1');
  });

  it('should return null when there are no tokens saved', async () => {
    // Arrange + Act + Assert
    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });

  it('should delete both tokens on clear (logout)', async () => {
    // Arrange
    await saveTokens({ accessToken: 'a1', refreshToken: 'r1' });

    // Act
    await clearTokens();

    // Assert
    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });
});
