# Semana 10 — Estadio deportivo (Uploads con Cloudinary + Emails con Nodemailer)

> **Programa:** Tecnólogo en Análisis y Desarrollo de Software (ADSO)
> **Institución:** SENA — Ficha 3228970
> **Aprendiz:** Yilmer Hernández Camargo
> **Bootcamp:** `bc-expressjs` — Semana 10 (File Uploads & Emails)

## Dominio

**Estadio Deportivo** — el recurso principal son las **concesiones** (`/api/v1/concessions`):
productos de comida, bebida y merchandising con `name`, `description`, `category`
(`Comida | Bebida | Merchandising`), `price`, `stock`, `imageUrl` e `imagePublicId`.

- **Upload principal:** foto del producto → `PUT /concessions/:id/image` (también acepta la imagen
  al crear, con `POST /concessions` en `multipart/form-data`).
- **Upload de usuario:** avatar → `PUT /users/me/avatar`.
- **Emails:** bienvenida al registrarse, "Concesión agregada al catálogo" al crear un producto, y
  recuperación de contraseña con token temporal. Los tres con plantilla del estadio.

## Stack

Express 5 + TypeScript · Mongoose · Multer (`memoryStorage`) · Cloudinary (`upload_stream`) ·
Nodemailer (Ethereal en desarrollo, SMTP real en producción) · JWT + bcrypt · Zod · Helmet · CORS ·
`express-rate-limit`.

## Endpoints

Todas las respuestas usan `{ status: "success" | "error", ... }`.

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | — | Crea usuario, devuelve `accessToken`, envía correo de bienvenida |
| POST | `/api/v1/auth/login` | — | Devuelve `accessToken` |
| POST | `/api/v1/auth/forgot-password` | — | Envía correo con enlace de reset (siempre responde 200) |
| POST | `/api/v1/auth/reset-password` | — | `{ token, password }` → cambia la contraseña |
| GET | `/api/v1/users/me` | Bearer | Perfil |
| PUT | `/api/v1/users/me/avatar` | Bearer | Campo `avatar` (multipart), reemplaza y borra el anterior |
| GET | `/api/v1/concessions` | Bearer | Concesiones del usuario |
| GET | `/api/v1/concessions/:id` | — | Detalle (con nombre/correo del creador) |
| POST | `/api/v1/concessions` | Bearer | Crea (multipart, campo `image` opcional) + correo de notificación |
| PUT | `/api/v1/concessions/:id` | Bearer (dueño) | Actualiza campos |
| PUT | `/api/v1/concessions/:id/image` | Bearer (dueño) | Campo `image` (multipart), reemplaza y borra la anterior |
| DELETE | `/api/v1/concessions/:id` | Bearer (dueño) | Borra la concesión y su imagen en Cloudinary |

### Ejemplos

```bash
# Registro → 201
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana Fan","email":"ana@estadio.com","password":"Password1"}'
# {"status":"success","data":{"accessToken":"eyJ..."}}

# Crear concesión con foto → 201
curl -X POST http://localhost:3000/api/v1/concessions \
  -H "Authorization: Bearer $TOKEN" \
  -F name="Cerveza artesanal" -F category=Bebida -F price=9500 -F stock=100 \
  -F image=@cerveza.jpg
# {"status":"success","data":{"concession":{"_id":"...","name":"Cerveza artesanal",
#   "imageUrl":"https://res.cloudinary.com/.../cerveza.jpg","imagePublicId":"estadio-deportivo/concessions/..."}}}

# Imagen que no es imagen → 400
# {"status":"error","message":"El archivo no es una imagen válida"}
```

## Configuración (`.env`)

Copia `.env.example` a `.env` y completa:

- `MONGODB_URI`, `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (mínimo 32 caracteres).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (cuenta gratuita en
  cloudinary.com → Dashboard → API Keys).
- Correo: en desarrollo no hace falta nada, se crea una cuenta **Ethereal** automática y la consola
  imprime la URL de vista previa de cada correo. En producción, definir `SMTP_HOST`, `SMTP_PORT`,
  `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` y `EMAIL_FROM`.

Los secretos nunca van en el código; `.env` está en `.gitignore`.

```bash
pnpm install
pnpm dev        # tsx watch, http://localhost:3000
pnpm build && pnpm start
```

## Seguridad de los uploads

- Solo JPEG, PNG y WebP (`fileFilter` por MIME), máx **5 MB**, 1 archivo, 10 campos por request.
- **Magic bytes:** el MIME de Multer sale del header del cliente y se puede falsificar, así que
  `validateImageSignature` revisa los primeros bytes del buffer (FFD8FF / PNG / RIFF…WEBP).
  Un `.php` enviado como `image/jpeg` termina en 400.
- `memoryStorage`: nada toca el disco del servidor; el buffer va directo a Cloudinary por stream.
- Los errores de Multer (tamaño, archivo inesperado) se traducen a 400 con mensaje claro.

## Bugs que encontré y corregí en el starter

- **Faltaban `cors`, `helmet` y `express-rate-limit` en `package.json`** aunque `app.ts` los importa:
  no compilaba tras `pnpm install`. Agregados (con `@types/cors`).
- **`jwt.ts` leía `env.JWT_SECRET`**, que no existe (el env define `JWT_ACCESS_SECRET`): error de
  compilación y, de haberse ejecutado, firma con `undefined`. Ahora usa `JWT_ACCESS_SECRET` y
  `JWT_ACCESS_EXPIRES_IN`.
- **El dueño recibía 403 al editar/borrar su propia concesión.** `findById` hacía `populate` de
  `createdBy`, y `String(item.createdBy)` de un documento populado nunca es el id del usuario.
  Separé `findById` (sin populate, para permisos) de `findByIdWithOwner` (solo para el GET).
- **`SMTP_SECURE` con `z.coerce.boolean()`**: `Boolean("false")` es `true`, así que `SMTP_SECURE=false`
  activaba TLS implícito y rompía el puerto 587. Ahora es `enum(['true','false'])` → boolean real.
- **Los errores de validación de Zod devolvían 500** (el error handler no los conocía). Ahora 422 con
  `details: [{ field, message }]`.
- **Un id mal formado (`/concessions/123`) devolvía 500** por el `CastError` de Mongoose; ahora 400.
- **HTML injection en los correos**: el nombre del usuario se interpolaba crudo en las plantillas
  (`name: "<a href=...>"`). Las plantillas ahora escapan los valores.
- **`forgot-password` esperaba el envío SMTP** antes de responder: el tiempo de respuesta (o un 500 si
  el SMTP fallaba) permitía averiguar qué correos existen. Ahora es fire-and-forget, igual que el
  correo de bienvenida.
- **Al reemplazar una imagen se borraba la anterior antes de subir la nueva**: si la subida fallaba,
  la concesión quedaba apuntando a una imagen inexistente. Ahora se sube primero y se borra la vieja
  después.
- **Multer 1.4.x** está deprecado y tiene vulnerabilidades conocidas; subí a **Multer 2.x**
  (misma API).
- Los límites del starter no coincidían con el enunciado (10 MB para imágenes del recurso): unifiqué
  en 5 MB.

## Cómo lo verifiqué (y qué no pude verificar)

Levanté la API real contra un MongoDB local y ejecuté un script de 34 comprobaciones HTTP (no incluido
en el repo): registro/login, CRUD de concesiones, ownership (403), reemplazo de imagen con borrado de la
anterior, avatar, rechazo de PDF / MIME falsificado / archivo de 6 MB / petición sin archivo, y el flujo
completo de reset de contraseña (token guardado hasheado, un solo uso). **34 de 34 pasaron.** Los tres
correos se enviaron de verdad a Ethereal (la consola mostró las URLs de vista previa).

**Lo que no pude probar contra el servicio real:** Cloudinary. No tengo credenciales en este entorno,
así que en esa verificación `upload_stream` y `destroy` estaban simulados (los datos que la API guarda —
`imageUrl` y `imagePublicId` — y la lógica de "borrar la anterior" sí quedaron comprobados). Para el
entregable con capturas: poner tus credenciales en `.env` y repetir el upload con Thunder Client /
Postman; el código de subida no cambia.
