module.exports = {
  root: true,

  parser: "@typescript-eslint/parser",

  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module",
  },

  env: {
    es2021: true,
    node: true,
  },

  plugins: ["@typescript-eslint"],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier", // optional but helps auto-format
  ],

  // 👇 Ignore compiled files and config files
  ignorePatterns: [
    ".eslintrc.js",
    "lib/**/*",         // compiled JS output
    "node_modules/**/*" // dependencies
  ],

  rules: {
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
    "max-len": "off",
    "camelcase": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-namespace": "off",
    "new-cap": "off",
    "no-irregular-whitespace": "off",
    "import/no-duplicates": "off",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
};
