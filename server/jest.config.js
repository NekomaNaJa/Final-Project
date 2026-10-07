export default {
  testEnvironment: "node",
  transform: {},
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "routes/**/*.js",
    "utils/**/*.js",
    "!node_modules/**",
  ],
  coverageReporters: ["text", "lcov", "clover"],
  testMatch: ["**/tests/**/*.test.js"],
};
