# Estadio Deportivo — Semana 08: Autenticación y Estado Global

> **Programa:** Tecnólogo en Análisis y Desarrollo de Software (ADSO)
> **Institución:** SENA — Ficha 3228970
> **Aprendiz:** Yilmer Hernández Camargo
> **Bootcamp:** `bc-reactnative` — Semana 08 (Autenticación con JWT + Zustand + SecureStore)

## Dominio asignado

**Estadio Deportivo** — cuenta de aficionado con login/registro (vía `dummyjson.com` como API de
práctica) y catálogo de concesiones del estadio (comida, bebidas, merchandising) consumido de
`dummyjson.com/products`. Cada usuario autenticado tiene, además de sus datos básicos, dos campos
propios del dominio derivados de forma determinística de su id: **nivel de aficionado**
(`fanTier`: Bronce/Plata/Oro) y **boletos comprados** (`ticketsPurchased`), visibles en su perfil.

## Qué implementé

- **`authService.ts`** — `login` contra `dummyjson.com/auth/login`, `refreshTokens` contra
  `/auth/refresh` (ambos con `axios` directo, no la instancia `api`, para no disparar el
  interceptor de Authorization antes de tener token). `register` no existe como endpoint real en
  dummyjson, así que lo simulé con un `setTimeout` y datos mock — permite practicar el flujo
  completo (formulario → store → navegación) sin depender de backend propio.
- **`api.ts`** — interceptor de respuesta: en un 401, toma el refresh token de SecureStore, pide
  tokens nuevos, reintenta la petición original una sola vez (`_retry` flag para evitar loops
  infinitos), y si el refresh falla limpia sesión.
- **`authStore.ts`** (Zustand + `persist`) — `login`/`register`/`logout`/`refreshTokens`. Los
  tokens **nunca** se persisten en el store de Zustand/AsyncStorage: `saveTokens` los manda directo
  a `expo-secure-store`, y `partialize` limita lo que Zustand persiste a `{ user, isAuthenticated }`
  únicamente.
- **`LoginScreen` / `RegisterScreen`** — React Hook Form + Zod (`zodResolver`), con
  `Alert.alert` en el catch de cada submit.
- **`RootNavigator`** — cambia entre `AuthNavigator` y `AppNavigator` leyendo
  `isAuthenticated` del store; no hay navegación manual a mano en las pantallas de login/registro.
- **`HomeScreen`** — catálogo de concesiones vía TanStack Query contra
  `dummyjson.com/products?limit=20`.
- **`ProfileScreen`** — agregué la sección "Mi cuenta del estadio" con `fanTier` y
  `ticketsPurchased`, además de los datos base que ya traía el starter.

## Bugs que encontré y corregí

- El starter listaba una ruta `Settings` en `AppStackParamList` que nunca tuvo un
  `Tab.Screen` registrado — quedaba como referencia muerta en el tipo y en el mapa de iconos de
  `AppNavigator`. La quité de ambos lugares.
- `App.tsx` traía `react-native-safe-area-context` instalado pero sin usar. Envolví
  `RootNavigator` en `SafeAreaProvider`, igual que en semanas anteriores.
- Fuera de eso, el starter de esta semana compiló limpio (`tsc --noEmit` sin errores) desde el
  primer intento — no encontré bugs reales de compilación o lógica en el código dado.

## Cómo lo verifiqué (y qué no pude verificar aquí)

Levanté la app con `expo start --web` en el navegador y confirmé:

- La app monta y `RootNavigator` enruta correctamente: sin sesión (`isAuthenticated: false` en
  `auth-storage` de `localStorage`), muestra `AuthNavigator` → `LoginScreen` (título "Iniciar
  Sesión").
- El formulario de login renderiza con las credenciales de prueba precargadas
  (`emilys` / `emilyspass`) y pasa la validación de Zod.
- La API de `dummyjson.com/auth/login` responde 200 con datos reales del usuario (lo probé con un
  `fetch` directo desde la consola del navegador).

**No pude verificar el submit de login/registro completo en el navegador**: `expo-secure-store`
no tiene implementación web (su build `.web.js` es literalmente un objeto vacío), así que
`saveTokens()` lanza `TypeError` en cuanto intenta guardar los tokens, el store lo captura y
`Alert.alert` no hace nada en `react-native-web` (no está implementado ahí) — el fallo queda
silencioso para quien mira la pantalla, aunque el estado sí se queda en `isAuthenticated: false`.
Esto es un límite real de mi entorno (sin macOS/Xcode ni emulador Android configurado), no un bug
del código: `SecureStore` es un módulo nativo por diseño, y es justo lo que pide la semana ("tokens
nunca en AsyncStorage"). Para probar el flujo de auth completo (login, refresh, logout, y que los
tokens efectivamente vivan en SecureStore y no en AsyncStorage) hace falta correrlo desde **Expo
Go** en un teléfono real o un emulador — ahí sí funciona.

## Cómo correr

```bash
pnpm install
pnpm start
```

Escanea el QR con Expo Go para probar el flujo de autenticación completo. Para un build nativo
(requerido formalmente por la semana): `pnpm expo run:android` o `pnpm expo run:ios`.
