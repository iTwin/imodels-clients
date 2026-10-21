const itwinPlugin = require("@itwin/eslint-plugin");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const importPlugin = require("eslint-plugin-import");
const mochaPlugin = require("eslint-plugin-mocha").default;
const prettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = [
  { ignores: ["lib/**", "**/node_modules/**"] },
  prettierRecommended,
  ...tsPlugin.configs["flat/recommended"],
  ...tsPlugin.configs["flat/recommended-type-checked"],
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      parserOptions: {
        project: "tsconfig.json"
      }
    },
    plugins: {
      mocha: mochaPlugin,
      "@itwin": itwinPlugin,
      import: importPlugin
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error",
        {
          "args": "after-used",
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_|inject|injectable",
        }],
      "@itwin/no-internal-barrel-imports": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": [
        "error",
        {
          "allowArgumentsExplicitlyTypedAsAny": true
        }
      ],
      "no-param-reassign": [
        "error",
        {
          "props": false
        }
      ],
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "import/order": ["error", {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "object"
        ],
        "pathGroups": [
          {
            "pattern": "@itwin/cloud-agnostic-core",
            "group": "internal"
          },
          {
            "pattern": "@itwin/object-storage**",
            "group": "internal"
          },
          {
            "pattern": "@itwin/**",
            "group": "external",
            "position": "after"
          }
        ],
        "pathGroupsExcludedImportTypes": ["builtin"],
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        },
        "newlines-between": "always"
      }],
      "mocha/no-pending-tests": "error",
      "mocha/no-exclusive-tests": "error"
    }
  }
];
