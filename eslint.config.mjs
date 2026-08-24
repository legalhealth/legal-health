// Configuração de lint do monorepo (T-03 / S0-B; fronteira de invariantes em S0-I).
//
// A regra de fronteira de dependência implementa INV-1 e INV-3 do Engineering
// Playbook §1.1, conforme Ordem Oficial §2.1 (item S0-I), ADR-0002 §2.2,
// critério de aceite A8 e checklist C09. Usa exclusivamente regras nativas do
// ESLint — nenhuma dependência ou plugin novo foi introduzido.
//
//   INV-1  "@lh/core não importa React, cliente HTTP, SDK de banco, Date.now()
//           nem gerador aleatório."                (verificação: lint no CI)
//   INV-3  "Nenhuma chamada a provedor de IA fora de ai-gateway."
//                                                  (verificação: lint de importação)
//
// A violação reprova `npm run lint` e, por consequência, o job de CI (S0-C).
import tseslint from 'typescript-eslint';

/** INV-3 — SDKs de provedor de IA. Permitidos apenas em apps/api/ai-gateway (Playbook §2). */
const AI_PROVIDER_IMPORTS = [
  {
    group: [
      '@anthropic-ai/*',
      'openai',
      'openai/*',
      '@openai/*',
      '@google/generative-ai',
      '@google-cloud/aiplatform',
      '@aws-sdk/client-bedrock*',
      '@mistralai/*',
      'cohere-ai',
      'groq-sdk',
      'replicate',
      'langchain',
      'langchain/*',
      '@langchain/*',
    ],
    message:
      'INV-3: nenhuma chamada a provedor de IA fora de apps/api/ai-gateway (Playbook §1.1).',
  },
];

/** INV-1 — proibições exclusivas do domínio puro @lh/core. */
const CORE_FORBIDDEN_IMPORTS = [
  {
    group: ['react', 'react-*', 'react/*', 'react-dom/*'],
    message: 'INV-1: @lh/core não importa React (Playbook §1.1; critério A8).',
  },
  {
    group: [
      'axios',
      'node-fetch',
      'got',
      'ky',
      'undici',
      'superagent',
      'request',
      'http',
      'https',
      'node:http',
      'node:https',
    ],
    message: 'INV-1: @lh/core não importa cliente HTTP (Playbook §1.1; critério A8).',
  },
  {
    group: [
      '@supabase/*',
      'pg',
      'pg-*',
      'mysql',
      'mysql2',
      'mongodb',
      'mongoose',
      'prisma',
      '@prisma/*',
      'drizzle-orm',
      'drizzle-orm/*',
      'knex',
      'sequelize',
      'typeorm',
    ],
    message: 'INV-1: @lh/core não importa SDK de banco (Playbook §1.1).',
  },
  {
    group: ['crypto', 'node:crypto'],
    message: 'INV-1: @lh/core não usa gerador aleatório (Playbook §1.1).',
  },
];

/** INV-3 — endereços de provedor de IA embutidos em literais (padrão PR-01 da Due Diligence). */
const AI_PROVIDER_HOST_PATTERN =
  /api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis\.com|api\.cohere\.(ai|com)|api\.mistral\.ai|api\.groq\.com|bedrock-runtime\..*\.amazonaws\.com/;

const AI_PROVIDER_HOST_SYNTAX = [
  {
    selector: `Literal[value=${AI_PROVIDER_HOST_PATTERN}]`,
    message:
      'INV-3: endereço de provedor de IA só pode existir em apps/api/ai-gateway (Playbook §1.1).',
  },
  {
    selector: `TemplateElement[value.raw=${AI_PROVIDER_HOST_PATTERN}]`,
    message:
      'INV-3: endereço de provedor de IA só pode existir em apps/api/ai-gateway (Playbook §1.1).',
  },
];

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

      // INV-3 — vale para todo o monorepo; a exceção de ai-gateway vem adiante.
      'no-restricted-imports': ['error', { patterns: AI_PROVIDER_IMPORTS }],
      'no-restricted-syntax': ['error', ...AI_PROVIDER_HOST_SYNTAX],
    },
  },
  {
    // INV-1 — domínio puro. Repete os padrões de INV-3 porque, em flat config,
    // a última declaração de uma regra substitui a anterior para os mesmos arquivos.
    files: ['packages/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [...AI_PROVIDER_IMPORTS, ...CORE_FORBIDDEN_IMPORTS] },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Date',
          property: 'now',
          message: 'INV-1: @lh/core não usa Date.now() (Playbook §1.1).',
        },
        {
          object: 'Math',
          property: 'random',
          message: 'INV-1: @lh/core não usa gerador aleatório (Playbook §1.1).',
        },
        {
          object: 'crypto',
          property: 'getRandomValues',
          message: 'INV-1: @lh/core não usa gerador aleatório (Playbook §1.1).',
        },
      ],
    },
  },
  {
    // Exceção única de INV-3: o AI Gateway é o lugar autorizado (Playbook §1.1 e §2).
    // Diretório criado na Sprint 4; a exceção fica declarada desde já.
    files: ['apps/api/ai-gateway/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
    },
  },
);
