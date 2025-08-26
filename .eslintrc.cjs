/**
 * Root ESLint configuration focused on strong TypeScript typing & correctness.
 * Applies across all workspace packages (ts / tsx files).
 */
module.exports = {
  root: true,
  ignorePatterns: [
    '**/dist/**',
    '**/build/**',
    '**/.vite/**',
    '**/coverage/**',
    '**/node_modules/**',
  '**/*.d.ts',
  // Ignore compiled duplicate JS outputs of TS sources (types package emits .js alongside .ts)
  'packages/types/src/**/*.js',
  // Ignore JS config files (typed via JSDoc instead of TS parser)
  'packages/**/postcss.config.js',
  'packages/**/tailwind.config.js',
  'packages/**/vite.config.js'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.base.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict',
    'plugin:@typescript-eslint/stylistic',
    'plugin:react-hooks/recommended',
    'eslint-config-prettier'
  ],
  rules: {
    // Strong typing & safety
    '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true, ignoreRestArgs: false }],
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true, allowTypedFunctionExpressions: true }],
    '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', disallowTypeAnnotations: false }],
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off', // can enable later (noisy)
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    '@typescript-eslint/require-array-sort-compare': ['warn', { ignoreStringArrays: true }],
    '@typescript-eslint/strict-boolean-expressions': ['error', {
      allowString: false,
      allowNumber: false,
      allowNullableObject: false,
      allowNullableBoolean: false,
      allowNullableString: false,
      allowNullableNumber: false,
      allowAny: false
    }],
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],
    '@typescript-eslint/array-type': ['error', { default: 'generic' }],
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignoreConditionalTests: false, ignoreMixedLogicalExpressions: false }],
    // General quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-duplicate-imports': 'error',
    'eqeqeq': ['error', 'smart'],
    'curly': ['error', 'all'],
    'prefer-const': 'error',
    // React hooks already handled by plugin:react-hooks/recommended
    'react-hooks/exhaustive-deps': 'warn'
  },
  overrides: [
    // Allow console usage in centralized logger implementation only
    {
      files: ['packages/utils/src/logger.ts'],
      rules: { 'no-console': 'off' }
    },
    // Plain Node/Build config JS files: use default parser (Espree) without TS project requirement
    {
      files: [
        'postcss.config.js',
        'tailwind.config.js',
        'vite.config.js',
        'packages/**/postcss.config.js',
        'packages/**/tailwind.config.js',
        'packages/**/vite.config.js'
      ],
      parser: 'espree',
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      env: { node: true, es2022: true },
      rules: {
        // Disable TS-specific rules for these plain JS config files
  '@typescript-eslint/no-var-requires': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/consistent-type-imports': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/strict-boolean-expressions': 'off'
  , '@typescript-eslint/prefer-readonly': 'off'
  , '@typescript-eslint/prefer-readonly-parameter-types': 'off'
  , '@typescript-eslint/no-unnecessary-type-assertion': 'off'
  , '@typescript-eslint/no-unnecessary-condition': 'off'
      }
    },
    // Authored helper JS scripts (keep linting but not type-aware)
    {
      files: [
        'packages/types/scripts/**/*.js'
      ],
      parser: 'espree',
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      env: { node: true, es2022: true },
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    }
  ]
};
