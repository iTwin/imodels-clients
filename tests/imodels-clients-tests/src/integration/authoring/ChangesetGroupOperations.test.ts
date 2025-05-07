/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  CreateChangesetGroupParams,
  IModelsClient,
  IModelsClientOptions,
  UpdateChangesetGroupParams,
} from "@itwin/imodels-client-authoring";
import {
  AuthorizationCallback,
  ChangesetGroup,
  ChangesetGroupState,
} from "@itwin/imodels-client-management";
import {
  IModelMetadata,
  TestAuthorizationProvider,
  TestIModelCreator,
  TestIModelGroup,
  TestIModelGroupFactory,
  TestUtilTypes,
  assertChangesetGroup,
} from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] ChangesetGroupOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelGroup: TestIModelGroup;
  let testIModel: IModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(
      TestUtilTypes.IModelsClientOptions
    );
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "AuthoringChangesetGroupOperations",
    });

    const testIModelCreator = container.get(TestIModelCreator);
    testIModel = await testIModelCreator.createEmpty(
      testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write")
    );
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  it("should create changeset group", async () => {
    // Arrange
    const createChangesetGroupParams: CreateChangesetGroupParams = {
      authorization,
      iModelId: testIModel.id,
      changesetGroupProperties: {
        description: "some description",
      },
    };

    // Act
    const changesetGroup: ChangesetGroup =
      await iModelsClient.changesetGroups.create(createChangesetGroupParams);

    // Assert
    await assertChangesetGroup({
      actualChangesetGroup: changesetGroup,
      expectedChangesetGroupProperties: {
        ...createChangesetGroupParams.changesetGroupProperties,
        state: ChangesetGroupState.InProgress,
      },
    });
  });

  it("should update changeset group", async () => {
    // Arrange
    const createChangesetGroupParams: CreateChangesetGroupParams = {
      authorization,
      iModelId: testIModel.id,
      changesetGroupProperties: {
        description: "some description",
      },
    };
    const changesetGroup: ChangesetGroup =
      await iModelsClient.changesetGroups.create(createChangesetGroupParams);
    const updateChangesetGroupParams: UpdateChangesetGroupParams = {
      authorization,
      iModelId: testIModel.id,
      changesetGroupId: changesetGroup.id,
      changesetGroupProperties: {
        state: ChangesetGroupState.Completed,
      },
    };

    // Act
    const updatedChangesetGroup = await iModelsClient.changesetGroups.update(
      updateChangesetGroupParams
    );

    // Assert
    await assertChangesetGroup({
      actualChangesetGroup: updatedChangesetGroup,
      expectedChangesetGroupProperties: {
        ...createChangesetGroupParams.changesetGroupProperties,
        ...updateChangesetGroupParams.changesetGroupProperties,
      },
    });
  });
});
