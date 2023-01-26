# @itwin/imodels-clients-tests

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains tests for various classes in the [`@itwin/imodels-client-management`](../../clients/imodels-client-management/README.md) and [`@itwin/imodels-client-authoring`](../../clients/imodels-client-authoring/README.md) packages.

**Note:** This package is not intended for outside use - it is internal and meant to be consumed only in internal pipelines or locally to verify correct code behavior.

## Running tests

- Create `.env` file in the current directory (`./tests/imodels-clients-tests`). The following variables should be configured:
  - `TEST_ITWIN_NAME`
  - `TEST_IMODEL_NAME`
  - `AUTH_AUTHORITY`
  - `AUTH_CLIENT_ID`
  - `AUTH_CLIENT_SECRET`
  - `AUTH_REDIRECT_URL`
  - `APIS_IMODELS_BASE_URL`
  - `APIS_IMODELS_VERSION`
  - `APIS_IMODELS_SCOPES`
  - `APIS_ITWINS_BASE_URL`
  - `APIS_ITWINS_SCOPES`
  - `TEST_USERS_ADMIN1_EMAIL`
  - `TEST_USERS_ADMIN1_PASSWORD`
  - `TEST_USERS_ADMIN2_FULLY_FEATURED_EMAIL`
  - `TEST_USERS_ADMIN2_FULLY_FEATURED_PASSWORD`
  - `TEST_BEHAVIOR_OPTIONS_RECREATE_IMODEL` - set this option to "1" to recreate reusable test IModel.
- Run `npm run test:integration` command or use "iModels Clients Tests" launch configuration in VS Code.