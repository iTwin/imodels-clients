# iTwin.js

Copyright © Bentley Systems, Incorporated. All rights reserved. See [LICENSE.md](./LICENSE.md) for license terms and full copyright notice.

[iTwin.js](http://www.itwinjs.org) is an open source platform for creating, querying, modifying, and displaying Infrastructure Digital Twins. To learn more about the iTwin Platform and its APIs, visit the [iTwin developer portal](https://developer.bentley.com/).

If you have questions, or wish to contribute to iTwin.js, see our [Contributing guide](https://github.com/iTwin/itwinjs-core/blob/master/CONTRIBUTING.md).

## About this Repository

This repository contains packages that help consumption of iModels API. Please visit the [iModels API documentation page](https://developer.bentley.com/apis/imodels/) on iTwin developer portal to learn more about the iModels service and its APIs. API clients contain methods that either act as a thin wrapper for sending a single request to the API or combine several requests to execute a more complex operation.

This repository contains multiple packages:
- `@itwin/imodels-client-management` is an API client that exposes a subset of iModels API operations and is intended to use in iModel management applications. Such applications do not edit the iModel file itself, they allow user to perform administrative tasks - create Named Versions, view Changeset metadata and such. An example of iTwin management application is the [iTwin Demo Portal](https://itwindemo.bentley.com/).
- `@itwin/imodels-client-authoring` is an API client that extends `@itwin/imodels-client-management` and exposes additional API operations to facilitate iModel editing workflows. This client should not be used directly as the operations it exposes can only be used meaningfully via [iTwin.js](https://www.itwinjs.org/) library.
- `@itwin/imodels-client-common-config` package is used internally to share common configuration across the API clients.
- `@itwin/imodels-clients-tests` package is used internally for API client testing.
