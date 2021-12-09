# iModels API Client Libraries

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

## About this Repository

This repository contains packages that help consumption of iModels API. Please visit the [iModels API documentation page](https://developer.bentley.com/apis/imodels/) on iTwin developer portal to learn more about the iModels service and its APIs. API clients contain methods that either act as a thin wrapper for sending a single request to the API or combine several requests to execute a more complex operation.

iModels API is a part of [iTwin.js](http://www.itwinjs.org) platform. It is an open source platform for creating, querying, modifying, and displaying Infrastructure Digital Twins. To learn more about the iTwin Platform and its APIs, visit the [iTwin developer portal](https://developer.bentley.com/).

This repository contains multiple packages:
- [`@itwin/imodels-client-management`](clients/imodels-client-management/README.md) is an API client that exposes a subset of iModels API operations and is intended to use in iModel management applications. Such applications do not edit the iModel file itself, they allow user to perform administrative tasks - create Named Versions, view Changeset metadata and such. An example of iTwin management application is the [iTwin Demo Portal](https://itwindemo.bentley.com/).
- [`@itwin/imodels-client-authoring`](clients/imodels-client-authoring/README.md) is an API client that extends `@itwin/imodels-client-management` and exposes additional API operations to facilitate iModel editing workflows. This client should not be used directly as the operations it exposes can only be used meaningfully via [iTwin.js](https://www.itwinjs.org/) library.
- [`@itwin/imodels-access-frontend`](itwin-platform-access/imodels-access-frontend/README.md) package contains an implementation of [`FrontendHubAccess`](https://github.com/iTwin/itwinjs-core/blob/master/core/frontend/src/FrontendHubAccess.ts) interface which enables the iTwin.js platform to use iModels API.
- [`@itwin/imodels-access-backend`](itwin-platform-access/imodels-access-backend/README.md) package contains an implementation of [`BackendHubAccess`](https://github.com/iTwin/itwinjs-core/blob/master/core/backend/src/BackendHubAccess.ts) interface which enables the iTwin.js platform to use iModels API. 
- [`@itwin/imodels-client-common-config`](utils/imodels-client-common-config/README.md) package is used internally to share common configuration across the API clients.
- [`@itwin/imodels-clients-tests`](tests/imodels-clients-tests/README.md) package is used internally for `@itwin/imodels-client-management` and `@itwin/imodels-client-authoring` package testing.
- [`@itwin/imodels-access-backend-tests`](tests/imodels-access-backend-tests/README.md) package is used internally for API client testing.
