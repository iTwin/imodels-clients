/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

const { defineConfig } = require("cypress");
// const { setupIntegrationTests } = require("./lib/esm/CypressSetup.js");

module.exports = defineConfig({

  fixturesFolder: false,
  screenshotOnRunFailure: false,

  e2e: {
    supportFile: false,
    browser: "chrome",
    defaultCommandTimeout: 10000,
    specPattern: "lib/**/*.test.js",
    video: false,
    async setupNodeEvents(on, config) {
      const { setupIntegrationTests } = await import("./lib/esm/CypressSetup.js");
      return setupIntegrationTests(on, config);
    },
  },
});
