/**
 * Minimal legacy ESLint 8 bridge for Codacy.
 * Codacy is still reporting ESLint 8.57.0 and appears to invoke ESLint with flags
 * that ignore "ignorePatterns" and overrides. That caused huge noise from
 * generated coverage & dist artifacts plus missing browser/node globals.
 *
 * Until Codacy upgrades to ESLint 9 + flat config support, we suppress the
 * noisy rules globally and declare both browser & node environments so that
 * identifiers like window, document, navigator, process, console, crypto do
 * not raise no-undef. This keeps the signal surface small without fighting
 * the tool. Real rules live in eslint.config.mjs.
 */
module.exports = {
  root: true,
  env: { node: true, browser: true, es2022: true },
  ignorePatterns: [
    '**/dist/**',
    '**/build/**',
    '**/.vite/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/*.d.ts',
    'packages/types/src/**/*.js',
    '.eslintrc.cjs'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.base.json'],
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  extends: ['eslint:recommended'],
  rules: {
    // Suppress high-noise rules on generated / external code surfaced by Codacy
    'no-undef': 'off',
    'no-redeclare': 'off',
    'no-prototype-builtins': 'off',
    'no-useless-escape': 'off',
    'no-unused-vars': 'off',
    'no-control-regex': 'off',
    // Maintain a little basic hygiene
    'no-duplicate-imports': 'error',
    'eqeqeq': ['error', 'smart'],
    'curly': ['error', 'all']
  }
};
