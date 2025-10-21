import js from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Base configuration
  js.configs.recommended,
  ...tseslint.configs.recommended,
  perfectionist.configs["recommended-natural"],

  // Global ignores
  {
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "coverage/**",
      "**/*.gen.ts",
      "**/*.generated.ts",
      "**/routeTree.gen.ts",
      "**/playwright-report/**",
      "**/test-results/**",
      "e2e/.auth/**",
      "**/prisma/migrations/**",
    ],
  },

  // TypeScript files configuration
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // General code quality rules
      "no-console": "warn",
      "no-duplicate-imports": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "quote-props": ["error", "consistent-as-needed"],
    },
  },

  // Test files configuration
  {
    files: ["**/*.{test,spec}.{ts,tsx,js}", "**/test/**/*.{ts,tsx,js}"],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off"
    },
  },

  // E2E test files configuration
  {
    files: ["e2e/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "perfectionist/sort-objects": "off",
    },
  },
];
