import js from "@eslint/js";
import globals from "globals";
import tsEslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default defineConfig({
    ignores: ['dist', 'build', 'node_modules', 'public', 'scripts'],
  },
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      // Prettier
      'prettier/prettier': ['warn', { endOfLine: 'auto' }],
      // React specific
      '@typescript-eslint/consistent-type-imports': 'error',
      // TypeScript
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-unused-expressions': [
        'warn',
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],
      'no-use-before-define': 'off',
      // Import
      'import/prefer-default-export': 'off',
      'no-console': 'warn',
    },
  },
);
