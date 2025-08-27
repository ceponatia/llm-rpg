// Flat ESLint config (ESLint 9+)
// Never add .eslintignore file back to project!
import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import * as reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.vite/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.d.ts',
      'packages/types/src/**/*.js',
      'dev-front/**' // legacy experimental dir
    ]
  },
  js.configs.recommended,
  // Browser application packages (React frontends etc.)
  {
    files: [
      'packages/admin-dashboard/src/**/*.{js,jsx,ts,tsx}',
      'packages/frontend/src/**/*.{js,jsx,ts,tsx}',
      'packages/affect/src/**/*.{js,jsx,ts,tsx}',
      'packages/context-modifier/src/**/*.{js,jsx,ts,tsx}',
      'packages/mca/src/**/*.{js,jsx,ts,tsx}'
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Allow testing globals (Vitest / Jest style) where relevant
        ...globals.es2024
      }
    }
  },
  // Type-aware rules only for real source files
  ...tseslint.config({
    files: ['packages/**/src/**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic
    ],
    languageOptions: {
      parserOptions: { project: ['./tsconfig.base.json'], tsconfigRootDir: '.' }
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true, ignoreRestArgs: false }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      '@typescript-eslint/require-array-sort-compare': ['warn', { ignoreStringArrays: true }],
      '@typescript-eslint/prefer-nullish-coalescing': ['warn', { ignoreConditionalTests: true }],
      // Temporarily relaxed (will ratchet later)
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-member-accessibility': 'warn',
      '@typescript-eslint/strict-boolean-expressions': ['warn', {
        allowString: true,
        allowNumber: true,
        allowNullableObject: true,
        allowNullableBoolean: true,
        allowNullableString: true,
        allowNullableNumber: true,
        allowAny: false
      }],
      '@typescript-eslint/no-unnecessary-condition': ['warn', { allowConstantLoopConditions: true }],
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/array-type': ['warn', { default: 'array' }],
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', disallowTypeAnnotations: false }],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
      '@typescript-eslint/prefer-readonly': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-duplicate-imports': 'error',
      'eqeqeq': ['error', 'smart'],
      'curly': ['error', 'all'],
      'prefer-const': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }),
  // Non-type-aware TS/JS (config & scripts) with Node env
  {
    files: [
      '**/vite.config.{ts,js}',
      '**/vitest.config.{ts,js}',
      '**/tailwind.config.{cjs,js}',
      '**/postcss.config.{cjs,js}',
      'scripts/**/*.{js,cjs,ts}',
      '*.cjs'
    ],
    languageOptions: {
      sourceType: 'module',
      parserOptions: { project: null },
      globals: {
  ...globals.node,
  module: 'readonly',
  require: 'readonly',
  __dirname: 'readonly',
  process: 'readonly',
  console: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-member-accessibility': 'off',
  // Requires parserServices (TS only) - disable for plain JS scripts
  '@typescript-eslint/consistent-type-imports': 'off'
    }
  },
  // Allow logger to use console fully
  {
    files: ['packages/utils/src/logger.ts'],
    rules: { 'no-console': 'off' }
  },
  prettier
];
