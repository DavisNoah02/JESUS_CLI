import js from "@eslint/js";
import globals from "globals";

/**
 * Flat ESLint config for Jesus CLI.
 *
 * The project has no runtime dependencies, so this runs against plain Node
 * globals only. The rules below are the ones the build guide commits to:
 * no unused bindings, strict equality, and no accidental `var`.
 */
export default [
  {
    ignores: ["node_modules/**", "coverage/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "none" }],
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "off",
    },
  },
  {
    // The theme tests match real ANSI escape sequences, which contain
    // control characters. That is the point of those assertions.
    files: ["test/**/*.js"],
    rules: {
      "no-control-regex": "off",
    },
  },
];
