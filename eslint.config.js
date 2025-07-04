import js from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
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
      "frontend/src/routeTree.gen.ts",
      "**/src/data/**",
      "backend/prisma/migrations/**",
    ],
  },

  // TypeScript files configuration
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-inferrable-types": "error",
      // General TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // General code quality rules
      "no-console": "warn",
      "no-duplicate-imports": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "quote-props": ["error", "as-needed"],
    },
  },

  // React-specific configuration
  {
    files: ["frontend/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  // Backend-specific configuration
  {
    files: ["backend/**/*.{ts,js}"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-console": "off", // Allow console.log in backend
    },
  },

  // Test files configuration
  {
    files: ["**/*.{test,spec}.{ts,tsx,js}", "**/test/**/*.{ts,tsx,js}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];
