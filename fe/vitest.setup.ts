// Agrega los matchers de jest-dom (toBeInTheDocument, toBeDisabled, ...) a expect.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library solo limpia el DOM por sí sola si hay `globals: true`. Sin esto, cada render se
// acumula en el documento y las consultas encuentran elementos repetidos de tests anteriores.
afterEach(() => {
  cleanup();
});
