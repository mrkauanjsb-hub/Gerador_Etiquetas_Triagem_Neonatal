import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Inclui os módulos do MVP, inclusive os que ainda não têm testes.
      // Evita confundir cobertura do motor com cobertura da aplicação inteira.
      include: ['src/app/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/*.test.ts'],
      reportsDirectory: './coverage'
    }
  }
});
