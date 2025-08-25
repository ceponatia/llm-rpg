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
    '**/*.d.ts'
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
  }
};
