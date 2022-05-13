# iModels API clients

This is documentation for iModels API clients in `@itwin/imodels-client-management` and `@itwin/imodels-client-authoring` packages. Please visit the [iModels API documentation page](https://developer.bentley.com/apis/imodels/) on iTwin developer portal to learn more about the iModels service and its APIs. API clients contain methods that either act as a thin wrapper for sending a single request to the API or combine several requests to execute a more complex operation.

iModels API is a part of [iTwin Platform](https://developer.bentley.com/). iTwin platform together with an open source [iTwin.js](https://www.itwinjs.org/) library provides capabilities for creating, querying, modifying, and displaying Infrastructure Digital Twins.

Users can choose to use either one of the following packages that contain `IModelsClient`:
- `@itwin/imodels-client-management` ([documentation](./IModelsClientManagement.md)) - client from this package exposes a subset of iModels API operations and is intended to use in iModel management applications. Such applications do not edit the iModel file itself, they allow user to perform administrative tasks - create Named Versions, view Changeset metadata and such. An example of iTwin management application is the [iTwin Demo Portal](https://itwindemo.bentley.com/).
- `@itwin/imodels-client-authoring` ([documentation](./IModelsClientAuthoring.md)) - client from this package extends the one from `@itwin/imodels-client-management` and exposes additional API operations to facilitate iModel editing workflows. Usually it is not recommended to use the client from this package directly as the additional operations it exposes can only be used meaningfully via [iTwin.js](https://www.itwinjs.org/) library.
