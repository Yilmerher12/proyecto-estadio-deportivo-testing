import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { RegisterScreen } from './RegisterScreen';

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

function renderRegister() {
  const navigation = { navigate } as never;
  return render(<RegisterScreen navigation={navigation} route={{} as never} />);
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  values: { username: string; email: string; password: string; confirm: string },
) {
  await user.type(screen.getByLabelText('Usuario'), values.username);
  await user.type(screen.getByLabelText('Correo electrónico'), values.email);
  await user.type(screen.getByLabelText('Contraseña'), values.password);
  await user.type(screen.getByLabelText('Confirmar contraseña'), values.confirm);
}

beforeEach(() => {
  vi.resetAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
});

describe('RegisterScreen', () => {
  it('should show an empty form with the four fields', () => {
    // Arrange + Act
    renderRegister();

    // Assert
    expect(screen.getByLabelText('Usuario')).toHaveValue('');
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    expect(screen.getByLabelText('Confirmar contraseña')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Crear Cuenta' })).toBeEnabled();
  });

  it('should show one message per invalid field when the empty form is sent', async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegister();

    // Act
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    // Assert
    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((a) => a.textContent)).toEqual([
      'El usuario debe tener al menos 2 caracteres',
      'Ingresa un correo electrónico válido',
      'La contraseña debe tener al menos 6 caracteres',
    ]);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should point at the confirmation field when the passwords do not match', async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegister();

    // Act
    await fillForm(user, {
      username: 'hincha',
      email: 'h@example.com',
      password: 'clave-123',
      confirm: 'otra-clave',
    });
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should send the data without the password confirmation when the form is valid', async () => {
    // Arrange
    vi.mocked(authService.register).mockResolvedValue({
      id: 1,
      username: 'hincha',
      email: 'h@example.com',
      firstName: 'hincha',
      lastName: '',
      image: '',
      accessToken: 'a1',
      refreshToken: 'r1',
    });
    const user = userEvent.setup();
    renderRegister();

    // Act
    await fillForm(user, {
      username: 'hincha',
      email: 'H@Example.com',
      password: 'clave-123',
      confirm: 'clave-123',
    });
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    // Assert: el correo llega en minúsculas (lo normaliza el esquema).
    await waitFor(() =>
      expect(authService.register).toHaveBeenCalledWith({
        username: 'hincha',
        email: 'h@example.com',
        password: 'clave-123',
      }),
    );
  });

  it('should alert "No se pudo crear la cuenta" when the register fails', async () => {
    // Arrange
    const alert = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    vi.mocked(authService.register).mockRejectedValue(new Error('500'));
    const user = userEvent.setup();
    renderRegister();

    // Act
    await fillForm(user, {
      username: 'hincha',
      email: 'h@example.com',
      password: 'clave-123',
      confirm: 'clave-123',
    });
    await user.click(screen.getByRole('button', { name: 'Crear Cuenta' }));

    // Assert
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Error', 'No se pudo crear la cuenta'));
  });

  it('should go back to the login screen from the "Iniciar sesión" link', async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegister();

    // Act
    await user.click(screen.getByRole('link', { name: /Iniciar sesión/ }));

    // Assert
    expect(navigate).toHaveBeenCalledWith('Login');
  });
});
