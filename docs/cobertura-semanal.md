# Cobertura semanal

La cobertura mide qué porcentaje del código ejecutan las pruebas unitarias. El umbral de cada semana es el mayor entre el de la semana anterior y la cobertura real redondeada hacia abajo: solo sube, nunca baja. Se configura en `be/vitest.config.ts` y `fe/vitest.config.ts` (`thresholds`).

| Semana | Backend `be/` (% líneas) | Frontend `fe/` (% líneas) | Umbral configurado |
|---|---|---|---|
| S1 (línea base) | 0 (0 de 283 líneas) | 0 (0 de 75 líneas) | 0 en ambos |

> Los E2E de `e2e/` no suman a este porcentaje: arrancan el backend como un proceso aparte y solo miden la cobertura de los tests de Vitest. La línea base es 0 porque el proyecto llegó sin pruebas unitarias.
