import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { HomeScreen } from './HomeScreen';

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

const products = [
  { id: 1, title: 'Perro caliente', category: 'comida', price: 8, thumbnail: 'https://img/1.png' },
  { id: 2, title: 'Gaseosa', category: 'bebida', price: 3, thumbnail: 'https://img/2.png' },
];

// retry: false para que un error se muestre al instante y no tras 3 reintentos.
function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <HomeScreen />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  useAuthStore.setState({
    user: { id: 1, username: 'hincha', email: 'h@example.com', firstName: 'Ana', lastName: 'Gómez' },
  });
});

describe('HomeScreen', () => {
  it('should show a loading indicator while the catalog is loading', () => {
    // Arrange: una promesa que nunca se resuelve deja la consulta "cargando".
    vi.spyOn(axios, 'get').mockReturnValue(new Promise(() => {}));

    // Act
    renderHome();

    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Catálogo de concesiones del estadio')).not.toBeInTheDocument();
  });

  it('should greet the user and list one card per product', async () => {
    // Arrange
    vi.spyOn(axios, 'get').mockResolvedValue({ data: { products } });

    // Act
    renderHome();

    // Assert
    expect(await screen.findByText('Hola, Ana 👋')).toBeInTheDocument();
    expect(screen.getByText('Perro caliente')).toBeInTheDocument();
    expect(screen.getByText('$8')).toBeInTheDocument();
    expect(screen.getByText('Gaseosa')).toBeInTheDocument();
    expect(screen.getByText('bebida')).toBeInTheDocument();
  });

  it('should show the empty message when the catalog has no products', async () => {
    // Arrange
    vi.spyOn(axios, 'get').mockResolvedValue({ data: { products: [] } });

    // Act
    renderHome();

    // Assert
    expect(await screen.findByText('No hay productos para mostrar')).toBeInTheDocument();
  });

  it('should show the error message and no catalog when the request fails', async () => {
    // Arrange
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('sin red'));

    // Act
    renderHome();

    // Assert
    expect(await screen.findByText('No se pudo cargar el contenido')).toBeInTheDocument();
    expect(screen.queryByText('No hay productos para mostrar')).not.toBeInTheDocument();
  });
});
