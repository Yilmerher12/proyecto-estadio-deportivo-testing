import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '../services/authService';
import { clearTokens, getRefreshToken, saveTokens } from '../services/tokenService';
import { useAuthStore } from './authStore';

// Se simulan la red, SecureStore y AsyncStorage: aquí solo se prueba la lógica del store.
// Con fábrica (no automock): el automock carga el módulo real, y tokenService arrastra
// expo-secure-store -> react-native, que Node no sabe leer.
vi.mock('../services/authService', () => ({
  login: vi.fn(),
  register: vi.fn(),
  refreshTokens: vi.fn(),
}));
vi.mock('../services/tokenService', () => ({
  saveTokens: vi.fn(),
  clearTokens: vi.fn(),
  getRefreshToken: vi.fn(),
}));
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined),
  },
}));

const response = {
  id: 4,
  username: 'hincha',
  email: 'hincha@example.com',
  firstName: 'Ana',
  lastName: 'Gómez',
  image: '',
  accessToken: 'a1',
  refreshToken: 'r1',
};
const credentials = { username: 'hincha', password: 'clave-123' };

beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
});

describe('login', () => {
  it('should save the tokens and derive the fan tier and tickets from the user id', async () => {
    // Arrange
    vi.mocked(authService.login).mockResolvedValue(response);

    // Act
    await useAuthStore.getState().login(credentials);

    // Assert: id 4 -> tiers[4 % 3] = 'Plata' y (4 * 7) % 25 = 3 entradas.
    const state = useAuthStore.getState();
    expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'a1', refreshToken: 'r1' });
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toMatchObject({ username: 'hincha', fanTier: 'Plata', ticketsPurchased: 3 });
    expect(state.isLoading).toBe(false);
  });

  it('should show the message of the server and rethrow when the login fails', async () => {
    // Arrange
    const failure = new AxiosError('fallo', '401', undefined, undefined, {
      data: { message: 'Invalid credentials' },
    } as never);
    vi.mocked(authService.login).mockRejectedValue(failure);

    // Act + Assert
    await expect(useAuthStore.getState().login(credentials)).rejects.toBe(failure);
    const state = useAuthStore.getState();
    expect(state.error).toBe('Invalid credentials');
    expect(state.isAuthenticated).toBe(false);
    expect(saveTokens).not.toHaveBeenCalled();
  });

  it('should use a generic message when the error is not from the network layer', async () => {
    // Arrange
    vi.mocked(authService.login).mockRejectedValue(new Error('boom'));

    // Act
    await useAuthStore.getState().login(credentials).catch(() => {});

    // Assert
    expect(useAuthStore.getState().error).toBe('Ocurrió un error inesperado');
  });

  it('should use "Credenciales incorrectas" when the server sends no message', async () => {
    // Arrange
    vi.mocked(authService.login).mockRejectedValue(new AxiosError('fallo'));

    // Act
    await useAuthStore.getState().login(credentials).catch(() => {});

    // Assert
    expect(useAuthStore.getState().error).toBe('Credenciales incorrectas');
  });
});

describe('register', () => {
  it('should authenticate the new user and save the tokens', async () => {
    // Arrange
    vi.mocked(authService.register).mockResolvedValue(response);

    // Act
    await useAuthStore
      .getState()
      .register({ username: 'hincha', email: 'hincha@example.com', password: 'clave-123' });

    // Assert
    expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'a1', refreshToken: 'r1' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});

describe('logout', () => {
  it('should clear the tokens and the session', async () => {
    // Arrange
    useAuthStore.setState({ user: { id: 1 } as never, isAuthenticated: true });

    // Act
    await useAuthStore.getState().logout();

    // Assert
    expect(clearTokens).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('refreshTokens', () => {
  it('should log out when there is no refresh token', async () => {
    // Arrange
    vi.mocked(getRefreshToken).mockResolvedValue(null);
    useAuthStore.setState({ isAuthenticated: true });

    // Act
    await useAuthStore.getState().refreshTokens();

    // Assert
    expect(authService.refreshTokens).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('should save the new tokens when the refresh works', async () => {
    // Arrange
    vi.mocked(getRefreshToken).mockResolvedValue('r1');
    vi.mocked(authService.refreshTokens).mockResolvedValue({
      ...response,
      accessToken: 'a2',
      refreshToken: 'r2',
    });

    // Act
    await useAuthStore.getState().refreshTokens();

    // Assert
    expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'a2', refreshToken: 'r2' });
  });

  it('should log out when the refresh fails', async () => {
    // Arrange
    vi.mocked(getRefreshToken).mockResolvedValue('r1');
    vi.mocked(authService.refreshTokens).mockRejectedValue(new Error('vencido'));
    useAuthStore.setState({ isAuthenticated: true });

    // Act
    await useAuthStore.getState().refreshTokens();

    // Assert
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(clearTokens).toHaveBeenCalled();
  });
});

describe('clearError', () => {
  it('should remove the error message', () => {
    // Arrange
    useAuthStore.setState({ error: 'algo falló' });

    // Act
    useAuthStore.getState().clearError();

    // Assert
    expect(useAuthStore.getState().error).toBeNull();
  });
});
