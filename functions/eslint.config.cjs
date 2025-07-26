// functions/eslint.config.cjs
const parser = require("@typescript-eslint/parser");
const plugin = require("@typescript-eslint/eslint-plugin");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: ["lib/**/*", "eslint.config.cjs"],
  },
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      parser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
      globals: {
        process: "readonly",
        console: "readonly",
        FirebaseFirestore: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": plugin,
    },
    rules: {},
  },
];
