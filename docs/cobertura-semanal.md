# Cobertura semanal

La cobertura mide qué porcentaje del código ejecutan las pruebas unitarias. El umbral de cada semana es el mayor entre el de la semana anterior y la cobertura real redondeada hacia abajo: solo sube, nunca baja. Se configura en `be/vitest.config.ts` y `fe/vitest.config.ts` (`thresholds`), y el CI (`.github/workflows/tests.yml`) pone en rojo cualquier PR que lo incumpla.

| Semana | Backend `be/` (% líneas) | Frontend `fe/` (% líneas) | Umbral configurado (sentencias / ramas / funciones / líneas) |
|---|---|---|---|
| S1 (línea base) | 0 (0 de 283) | 0 (0 de 75) | 0 / 0 / 0 / 0 en ambos |
| S2 (cierre) | 30.38 (86 de 283) | 54.66 (41 de 75) | `be`: 30 / 26 / 23 / 30 · `fe`: 53 / 31 / 65 / 54 |
| S3 (cierre) | 43.46 (123 de 283) | 73.98 (91 de 123) | `be`: 42 / 53 / 30 / 43 · `fe`: 74 / 73 / 84 / 73 |

Pisos del bootcamp: 30 % de líneas en la semana 2 y 40 % en la semana 3, en cada parte.

> **Cambio de alcance en el frontend (S3):** hasta la semana 2 el frontend solo medía `schemas/`, `services/` y `stores/` (75 líneas). En la semana 3 se agregaron `screens/` y `components/` (123 líneas en total) para medir también las pantallas. Se midió así, sin excluir pantallas sin pruebas, y se probaron todas las pantallas con lógica para no bajar los umbrales de la semana anterior. `api.ts` y `authService.ts` siguen en 0 %.

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

## Semana 3: pruebas de componentes y backend al 40 %

Los componentes de React Native se prueban con Vitest, `jsdom` y Testing Library: `vitest.config.ts` hace que el código que pide `react-native` use `react-native-web` (la librería `react-native` está escrita en Flow y Node no la lee), así los componentes se dibujan como HTML. `vitest.setup.ts` agrega los matchers de jest-dom y limpia el DOM entre tests.

Frontend (20 tests nuevos, 45 en total):
- `screens/LoginScreen.test.tsx` (componente principal de la semana): campos con las credenciales por defecto, envío con lo escrito, mensajes de validación de usuario y contraseña, botón deshabilitado mientras carga, alerta si falla y enlace a "Crear cuenta".
- `screens/RegisterScreen.test.tsx`: formulario vacío, un mensaje por campo inválido, confirmación de contraseña distinta, envío sin `confirmPassword`, alerta si falla y enlace a "Iniciar sesión".
- `screens/HomeScreen.test.tsx` (lista con estados): cargando, con datos, vacío y error.
- `screens/ProfileScreen.test.tsx`: datos del usuario, valores por defecto sin usuario y cierre de sesión solo tras confirmar.

Arreglos de accesibilidad en los componentes (los tests con consultas accesibles fallaron sin ellos):
- `FormField`: `aria-label` en el campo (la etiqueta era un texto suelto) y `role="alert"` en el mensaje de error.
- `LoginScreen`, `RegisterScreen` y `ProfileScreen`: `role="button"` en los botones y `role="link"` en los enlaces de navegación.

Backend (15 tests nuevos, 60 en total):
- `middlewares/error.middleware.test.ts`: AppError, errores de validación (422 con los campos), id mal formado (400), archivo muy grande, error de carga desconocido y error interno sin revelar el mensaje.
- `middlewares/auth.middleware.test.ts`: se agregó `authenticate` (sin header, sin "Bearer ", token inválido y token válido).
- `middlewares/upload.middleware.test.ts`: acepta JPEG, PNG y WebP reales y rechaza un archivo que dice ser imagen pero no lo es.

### Mutaciones de la semana 3

| Mutante | Test que lo detectó |
|---|---|
| `LoginScreen`: `disabled={isLoading}` por `disabled={false}` | `should disable the button while the login is in progress` |
| `HomeScreen`: `if (isError)` por `if (!isError)` | `should greet the user and list one card per product`, `should show the empty message when the catalog has no products` y `should show the error message and no catalog when the request fails` |
| `error.middleware`: `issue.path.slice(1)` por `issue.path.slice(0)` | `should answer 422 with the invalid fields when the validation fails` |
