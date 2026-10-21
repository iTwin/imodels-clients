const baseConfig = require("./node_modules/@itwin/imodels-client-common-config/eslint.config.js");

module.exports = [
  ...baseConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["tsconfig.json", "cjs.tsconfig.json"]
      }
    }
  }
];
