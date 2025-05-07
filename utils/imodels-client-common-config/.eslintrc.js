require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  "parser": "@typescript-eslint/parser",
  "plugins": [
    "mocha",
    "@itwin",
    "@typescript-eslint",
    "import",
    "deprecation"
  ],
  "extends": [
    "plugin:prettier/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parserOptions": {
    "project": "tsconfig.json",
    "sourceType": "module"
  },
  "rules": {
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
    "mocha/no-skipped-tests": "error",
    "mocha/no-exclusive-tests": "error"
  }
}
