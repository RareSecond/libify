import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

import rootConfig from "../eslint.config.js";

// List of all Mantine style props to ban
const mantineStyleProps = [
  // Margin props
  "m",
  "mt",
  "mb",
  "ml",
  "mr",
  "ms",
  "me",
  "mx",
  "my",
  // Padding props
  "p",
  "pt",
  "pb",
  "pl",
  "pr",
  "ps",
  "pe",
  "px",
  "py",
  // Sizing props
  "w",
  "h",
  "miw",
  "maw",
  "mih",
  "mah",
  // Typography props
  "c",
  "ff",
  "fz",
  "fw",
  "lts",
  "ta",
  "lh",
  "fs",
  "tt",
  "td",
  // Other style props
  "bd",
  "bdrs",
  "bg",
  "opacity",
  "pos",
  "display",
  "flex",
];

export default [
  ...rootConfig,
  // Frontend-specific overrides for local files
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "max-lines": [
        "error",
        { max: 250, skipBlankLines: true, skipComments: true },
      ],
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Enforce Tailwind-only styling: Ban style prop and Mantine props on components
      "react/forbid-component-props": [
        "error",
        {
          forbid: [
            {
              message:
                "Use Tailwind CSS classes via className instead of inline styles",
              propName: "style",
            },
            ...mantineStyleProps.map((prop) => ({
              message: `Use Tailwind CSS classes instead of Mantine's '${prop}' prop`,
              propName: prop,
            })),
          ],
        },
      ],

      // Ban style prop on DOM elements too
      "react/forbid-dom-props": [
        "error",
        {
          forbid: [
            {
              message:
                "Use Tailwind CSS classes via className instead of inline styles",
              propName: "style",
            },
          ],
        },
      ],
    },
  },
];
