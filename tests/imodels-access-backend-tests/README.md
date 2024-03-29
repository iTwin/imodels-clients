# @itwin/imodels-access-backend-tests

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this package

This package contains tests for various classes in the [`@itwin/imodels-access-backend`](../../itwin-platform-access/imodels-access-backend/README.md) package.

**Note:** This package is not intended for outside use - it is internal and meant to be consumed only in internal pipelines or locally to verify correct code behavior.

## Running tests

- Create `.env` file in the current directory (`./tests/imodels-access-backend-tests`). The following variables should be configured:
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
- Run `npm run test:integration` command or use "Backend iModels Access Tests" launch configuration in VS Code.
