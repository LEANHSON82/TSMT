import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'mocks/data/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'prettier'),
];

export default config;
