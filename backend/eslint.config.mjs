import globals from 'globals';

import rootConfig from '../eslint.config.js';

export default [
  ...rootConfig,
  // Backend-specific overrides for local files
  {
    files: ['src/**/*.{ts,js}'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-console': 'off', // Allow console.log in backend
    },
  },
];
