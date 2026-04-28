const baseConfig = require("@itwin/imodels-client-common-config/eslint.config.base");

module.exports = [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ["tsconfig.json", "cjs.tsconfig.json"],
      },
    },
  },
];
