import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { LoginScreen } from './LoginScreen';

// Se simulan la red, SecureStore y AsyncStorage: aquí solo se prueba la pantalla.
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

const navigate = vi.fn();

function renderLogin() {
  const navigation = { navigate } as never;
  return render(<LoginScreen navigation={navigation} route={{} as never} />);
}

beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
});

describe('LoginScreen', () => {
  it('should show the form with the default credentials', () => {
    // Arrange + Act
    renderLogin();

    // Assert
    expect(screen.getByText('Bienvenido')).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toHaveValue('emilys');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('emilyspass');
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeEnabled();
  });

  it('should call the login service with the typed credentials', async () => {
    // Arrange
    vi.mocked(authService.login).mockResolvedValue({
      id: 1,
      username: 'hincha',
      email: 'h@example.com',
      firstName: 'Ana',
      lastName: 'Gómez',
      image: '',
      accessToken: 'a1',
      refreshToken: 'r1',
    });
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.clear(screen.getByLabelText('Usuario'));
    await user.type(screen.getByLabelText('Usuario'), 'hincha');
    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'clave-123');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    // Assert
    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith({ username: 'hincha', password: 'clave-123' }),
    );
  });

  it('should show the validation message and not call the service when the username is too short', async () => {
    // Arrange
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.clear(screen.getByLabelText('Usuario'));
    await user.type(screen.getByLabelText('Usuario'), 'a');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El usuario debe tener al menos 2 caracteres',
    );
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should show the validation message when the password is too short', async () => {
    // Arrange
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), '12345');
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La contraseña debe tener al menos 6 caracteres',
    );
  });

  it('should disable the button while the login is in progress', async () => {
    // Arrange: una promesa que nunca se resuelve deja el login "cargando".
    vi.mocked(authService.login).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    // Assert
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
    expect(screen.queryByText('Iniciar Sesión')).not.toBeInTheDocument();
  });

  it('should alert "Credenciales incorrectas" when the login fails', async () => {
    // Arrange
    const alert = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    vi.mocked(authService.login).mockRejectedValue(new Error('401'));
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.click(screen.getByRole('button', { name: 'Iniciar Sesión' }));

    // Assert
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', 'Credenciales incorrectas'));
  });

  it('should go to the register screen from the "Crear cuenta" link', async () => {
    // Arrange
    const user = userEvent.setup();
    renderLogin();

    // Act
    await user.click(screen.getByRole('link', { name: /Crear cuenta/ }));

    // Assert
    expect(navigate).toHaveBeenCalledWith('Register');
  });
});
