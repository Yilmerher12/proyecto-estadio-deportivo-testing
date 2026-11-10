import { expect, test } from '@playwright/test';

const PASSWORD = 'Clave-segura-123';

// Registra un usuario con correo único y devuelve su correo y su accessToken.
// El correo lleva Date.now() porque la BD conserva los datos entre ejecuciones.
async function registerUser(request, unique) {
  const email = `hincha-${unique}@example.com`;
  const response = await request.post('/api/v1/auth/register', {
    data: { name: 'Hincha de Prueba', email, password: PASSWORD },
  });
  expect(response.status()).toBe(201);
  const { accessToken } = (await response.json()).data;
  return { email, accessToken };
}

test('should list the concession after creating it', async ({ request }) => {
  // Arrange
  const unique = Date.now();
  const { accessToken } = await registerUser(request, unique);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const name = `Perro caliente ${unique}`;

  // Act
  const created = await request.post('/api/v1/concessions', {
    headers,
    data: { name, category: 'Comida', price: 8000, stock: 50 },
  });
  const list = await request.get('/api/v1/concessions', { headers });

  // Assert
  expect(created.status()).toBe(201);
  expect(list.status()).toBe(200);
  const { concessions } = (await list.json()).data;
  expect(concessions.map((c) => c.name)).toContain(name);
});

test('should reject the login when the password is wrong', async ({ request }) => {
  // Arrange
  const { email } = await registerUser(request, Date.now());

  // Act
  const response = await request.post('/api/v1/auth/login', {
    data: { email, password: 'otra-clave-incorrecta' },
  });

  // Assert
  expect(response.status()).toBe(401);
  expect((await response.json()).message).toBe('Credenciales inválidas');
});
