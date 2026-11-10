# Cobertura semanal

La cobertura mide qué porcentaje del código ejecutan las pruebas unitarias. El umbral de cada semana es el mayor entre el de la semana anterior y la cobertura real redondeada hacia abajo: solo sube, nunca baja. Se configura en `be/vitest.config.ts` y `fe/vitest.config.ts` (`thresholds`), y el CI (`.github/workflows/tests.yml`) pone en rojo cualquier PR que lo incumpla.

| Semana | Backend `be/` (% líneas) | Frontend `fe/` (% líneas) | Umbral configurado (sentencias / ramas / funciones / líneas) |
|---|---|---|---|
| S1 (línea base) | 0 (0 de 283) | 0 (0 de 75) | 0 / 0 / 0 / 0 en ambos |
| S2 (cierre) | 30.38 (86 de 283) | 54.66 (41 de 75) | `be`: 30 / 26 / 23 / 30 · `fe`: 53 / 31 / 65 / 54 |

El reto de la semana 2 pide un piso de 30 % de líneas en cada parte: el backend llega justo (30.38 %) y el frontend lo supera.

> Los E2E de `e2e/` no suman a este porcentaje: arrancan el backend como un proceso aparte y solo cuenta lo que ejecutan los tests de Vitest.

## Semana 2: pruebas unitarias

Backend (45 tests):
- `middlewares/auth.middleware.test.ts`: `authorize` (401 sin usuario, 403 con rol no permitido, pasa con rol permitido).
- `validators/concessions.schema.test.ts`: precio 0 válido, precio negativo y categoría inválida rechazados, nombre en los valores límite 1/2/200/201 y conversión de texto a número.
- `validators/auth.schema.test.ts`: registro (contraseña en el límite 7/8, correo y nombre inválidos), login, olvido y reinicio de contraseña.
- `utils/jwt.test.ts`: ida y vuelta del token, firma de otro secreto, token vencido y token alterado.
- `services/auth.service.test.ts`: correo repetido (409), contraseña guardada con hash, mismo mensaje 401 para usuario inexistente y contraseña errónea, olvido de contraseña sin revelar si el correo existe, token de reinicio de 1 hora y reinicio de contraseña. El repositorio de Mongo y el correo van simulados.
- `services/concessions.service.test.ts`: 404 y 403 por dueño, creación con y sin imagen, cambio de imagen (sube la nueva antes de borrar la vieja, y no falla si borrar la vieja falla) y borrado (borra la imagen en Cloudinary solo si existe). Mongo, Cloudinary y correo van simulados.

Frontend (25 tests):
- `schemas/authSchema.test.ts`: valores límite de usuario (2 a 50) y contraseña (6 a 100), recorte de espacios, correo en minúsculas y confirmación de contraseña.
- `services/tokenService.test.ts`: guardar, leer y borrar los dos tokens (SecureStore simulado con un Map).
- `stores/authStore.test.ts`: login y registro, nivel de hincha y entradas derivados del id, los tres mensajes de error, logout y renovación de tokens. La red, SecureStore y AsyncStorage van simulados.

Se usan mocks con fábrica en el frontend porque el automock carga el módulo real, y `tokenService` arrastra `expo-secure-store` y `react-native`, que Node no sabe leer.

## Mutaciones manuales

Cambié una regla del código, corrí los tests y confirmé que alguno fallaba. Después revertí el cambio.

| Mutante | Test que lo detectó |
|---|---|
| `authorize`: `!roles.includes(req.user.role)` por `roles.includes(req.user.role)` | `should respond 403 when the role is not in the allowed list` y `should call next without error when the role is allowed` |
| `createConcessionSchema`: precio con `.min(0)` cambiado por `.min(1)` | `should accept price 0 and stock 0 (lower boundary)` |
| `forgotPassword`: vencimiento de `60 * 60 * 1000` (1 hora) por `60 * 1000` (1 minuto) | `should save a token that expires in 1 hour and email the reset link` |
| `toAuthUser` (frontend): orden de los niveles `['Bronce', 'Plata', 'Oro']` por `['Bronce', 'Oro', 'Plata']` | `should save the tokens and derive the fan tier and tickets from the user id` |

## Umbral incumplido

Con `pnpm exec vitest run --coverage --coverage.thresholds.lines=50` en `be/` el comando termina con código 1 y el mensaje `Coverage for lines (...) does not meet global threshold (50%)`. Por eso el job del CI queda en rojo cuando la cobertura baja.
