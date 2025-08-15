/** ESLint config for TS Node + Express */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended","plugin:@typescript-eslint/recommended"],
  env: { node: true, es2022: true },
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  rules: { "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], "no-console":"off" }
};
