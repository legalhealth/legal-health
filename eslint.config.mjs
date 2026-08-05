// Configuração de lint do monorepo (T-03 / S0-B).
// A regra de fronteira de dependência (INV-1, INV-3) é adicionada na tarefa T-04 (S0-I).
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/web-build/**',
      '**/coverage/**',
      'docs/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // catch silencioso é proibido (Playbook §3.3)
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
);
