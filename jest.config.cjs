/** Jest config for contract tests (TypeScript) */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/contract/**/*.test.ts"],
  transform: { "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  transformIgnorePatterns: ["/node_modules/"],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.ts"],
  reporters: ["default"],
  testTimeout: 30000,
};
