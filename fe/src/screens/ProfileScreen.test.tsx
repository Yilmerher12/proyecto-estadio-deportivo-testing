import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTokens } from '../services/tokenService';
import { useAuthStore } from '../stores/authStore';
import { ProfileScreen } from './ProfileScreen';

// Se simulan SecureStore, AsyncStorage y el servicio de auth que el store importa.
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

beforeEach(() => {
  vi.restoreAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});

describe('ProfileScreen', () => {
  it('should show the account data and the stadium level of the user', () => {
    // Arrange
    useAuthStore.setState({
      user: {
        id: 4,
        username: 'hincha',
        email: 'h@example.com',
        firstName: 'Ana',
        lastName: 'Gómez',
        fanTier: 'Plata',
        ticketsPurchased: 3,
      },
    });

    // Act
    render(<ProfileScreen />);

    // Assert
    expect(screen.getByText('Ana Gómez')).toBeInTheDocument();
    expect(screen.getByText('h@example.com')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Plata')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should show placeholders when there is no user', () => {
    // Arrange + Act
    render(<ProfileScreen />);

    // Assert: sin usuario, el avatar muestra "?", el correo "—" y 0 boletos.
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should ask for confirmation and close the session only when the user confirms', async () => {
    // Arrange
    const alert = vi.spyOn(Alert, 'alert').mockImplementation(() => {});
    useAuthStore.setState({ user: { id: 1 } as never, isAuthenticated: true });
    const user = userEvent.setup();
    render(<ProfileScreen />);

    // Act: primero solo se abre la confirmación.
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    // Assert: todavía no se cerró la sesión.
    expect(alert).toHaveBeenCalledWith('Cerrar sesión', '¿Estás seguro de que quieres salir?', expect.any(Array));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Act: la persona pulsa "Salir" en la confirmación.
    const buttons = alert.mock.calls[0][2] as { text: string; onPress?: () => Promise<void> }[];
    await buttons.find((b) => b.text === 'Salir')?.onPress?.();

    // Assert
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    expect(clearTokens).toHaveBeenCalled();
  });
});
