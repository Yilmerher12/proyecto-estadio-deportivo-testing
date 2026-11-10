# Estadio Deportivo — Pruebas (Bootcamp Testing ADSO)

Entrega individual del bootcamp de testing sobre el dominio del trimestre pasado: un estadio deportivo.

| Carpeta | Qué es | Origen |
|---|---|---|
| `be/` | API de concesiones, usuarios y autenticación (Express 5 + Mongoose) | Repo `proyecto_estadio_deportivo_expressjs`, rama `week-10` |
| `fe/` | App móvil con login (React Native + Expo) | Repo `proyecto_estadio_deportivo_reactnative`, rama `week-08` |
| `e2e/` | Pruebas E2E por API con Playwright | Este repo |

El `fe/` no se conecta al `be/` (usa `dummyjson.com` para el login), así que cada lado se prueba por separado.

## Cómo correr las pruebas

Desde la raíz, enciende MongoDB de prueba (puerto 27018, sin datos persistentes):

```bash
docker compose up -d --wait estadio_mongo_test
```

E2E (Playwright enciende el backend solo en el puerto 3100):

```bash
cd e2e && pnpm install && pnpm test
```

Pruebas unitarias con cobertura:

```bash
cd be && pnpm install && pnpm test
```

```bash
cd fe && pnpm install && pnpm test
```

Cobertura semanal: [docs/cobertura-semanal.md](docs/cobertura-semanal.md).
