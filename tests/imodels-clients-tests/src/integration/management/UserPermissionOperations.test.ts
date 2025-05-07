/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AuthorizationCallback,
  GetUserPermissionsParams,
  IModelPermission,
  IModelsClient,
  IModelsClientOptions,
  UserPermissions,
} from "@itwin/imodels-client-management";
import {
  ReusableIModelMetadata,
  ReusableTestIModelProvider,
  TestAuthorizationProvider,
  TestUtilTypes,
  assertUserPermissions,
} from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "../common";

describe("[Management] UserPermissionOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelForRead: ReusableIModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(
      TestUtilTypes.IModelsClientOptions
    );
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIModelProvider = container.get(
      ReusableTestIModelProvider
    );
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  });

  it("should get user permissions", async () => {
    // Arrange
    const getUserPermissionsParams: GetUserPermissionsParams = {
      authorization,
      iModelId: testIModelForRead.id,
    };

    // Act
    const permissions: UserPermissions =
      await iModelsClient.userPermissions.get(getUserPermissionsParams);

    // Assert
    assertUserPermissions({
      actualPermissions: permissions,
      expectedPermissions: [
        IModelPermission.WebView,
        IModelPermission.Read,
        IModelPermission.Write,
        IModelPermission.Manage,
      ],
    });
  });
});
