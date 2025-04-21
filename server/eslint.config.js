// eslint.config.js (New ESLint v9+ Configuration)
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended, // Base ESLint rules
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    ignores: ['node_modules/', 'logs/', 'data/', 'dist/'], // Replaces .eslintignore
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
      'no-unused-vars': 'warn',
    },
  },
  prettierConfig, // Ensures Prettier doesn't conflict with ESLint
];
