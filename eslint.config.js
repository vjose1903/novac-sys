import typescriptParser from '@typescript-eslint/parser';
import angularEslintPlugin from '@angular-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: [
        'dist/**',
        'node_modules/**',
        '.angular/**',
        '.nx/**',
    ],
  },
  {
    files: ['*.ts', '*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@angular-eslint': angularEslintPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...angularEslintPlugin.configs.recommended.rules,
      'prettier/prettier': 'warn',

    },
  },
  {
    files: ['*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  },
];
