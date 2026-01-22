import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintPluginPrettier from 'eslint-plugin-prettier';
import storybookPlugin from 'eslint-plugin-storybook';

export default defineConfig({
    ignores: ['dist', 'build', 'node_modules', '.storybook', 'storybook-static', 'public', 'scripts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
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
      storybook: storybookPlugin,
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
  // Storybook files configuration
  {
    files: ['**/*.stories.{js,jsx,ts,tsx}', '.storybook/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      storybook: storybookPlugin,
    },
    rules: {
      ...storybookPlugin.configs.recommended.overrides,
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Files that intentionally use 'any' for component registry pattern or type utilities
  // See: https://github.com/myosh/odin/issues/MYOSH-11613
  {
    files: [
      '**/dynamic-form/dynamic-field.service.ts',
      '**/dynamic-form/dynamic-form.interfaces.ts',
      '**/common/types/add-function-parameters.ts',
      '**/common/hooks/use-event.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  });
