/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { AuthorizationCallback, CheckpointState, GetSingleCheckpointParams, IModelScopedOperationParams, IModelsClient, IModelsErrorCode } from "@itwin/imodels-client-authoring";
import { Config, Constants, NamedVersionMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestClientOptions, TestIModelGroup, TestProjectProvider, assertCheckpoint, assertError, cleanUpIModels } from "../common";

describe("[Authoring] CheckpointOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModelGroup: TestIModelGroup;
  let testIModel: ReusableIModelMetadata;
  let testIModelNamedVersion: NamedVersionMetadata;

  before(async () => {
    iModelsClient = new IModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testIModelGroup = new TestIModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringCheckpointOperations"
      }
    });

    testIModel = await ReusableTestIModelProvider.getOrCreate({
      authorization,
      iModelsClient,
      projectId
    });
    testIModelNamedVersion = testIModel.namedVersions[0];
  });

  after(async () => {
    await cleanUpIModels({ iModelsClient, authorization, projectId, testIModelGroup });
  });

  it("should get by changeset id", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
      changesetId: testIModelNamedVersion.changesetId
    };

    // Act
    const checkpoint = await iModelsClient.Checkpoints.getSingle(getSingleCheckpointParams);

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIModelNamedVersion.changesetId,
        changesetIndex: testIModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful
      }
    });
  });

  it("should get by changeset index", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
      changesetIndex: testIModelNamedVersion.changesetIndex
    };

    // Act
    const checkpoint = await iModelsClient.Checkpoints.getSingle(getSingleCheckpointParams);

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIModelNamedVersion.changesetId,
        changesetIndex: testIModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful
      }
    });
  });

  it("should get by named version id", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
      namedVersionId: testIModelNamedVersion.id
    };

    // Act
    const checkpoint = await iModelsClient.Checkpoints.getSingle(getSingleCheckpointParams);

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIModelNamedVersion.changesetId,
        changesetIndex: testIModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful
      }
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.Checkpoints.getSingle(
        {
          ...params,
          changesetId: testIModelNamedVersion.changesetId
        })
    },
    {
      label: "by changeset index",
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.Checkpoints.getSingle(
        {
          ...params,
          changesetIndex: testIModelNamedVersion.changesetIndex
        })
    },
    {
      label: "by named version id",
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.Checkpoints.getSingle(
        {
          ...params,
          namedVersionId: testIModelNamedVersion.id
        })
    }
  ].forEach((testCase) => {
    it(`should not find checkpoint ${testCase.label} if iModel does not exist`, async () => {
      // Arrange
      const iModelScopedOperationParams: IModelScopedOperationParams = {
        authorization,
        iModelId: "invalidIModelId"
      };

      // Act
      let errorThrown: Error | undefined;
      try {
        await testCase.functionUnderTest(iModelScopedOperationParams);
      } catch (e) {
        errorThrown = e;
      }

      // Assert
      expect(errorThrown).to.not.be.undefined;
      assertError({
        actualError: errorThrown!,
        expectedError: {
          code: IModelsErrorCode.IModelNotFound,
          message: "Requested iModel is not available."
        }
      });
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.Checkpoints.getSingle(
        {
          ...params,
          changesetId: "invalidId"
        })
    },
    {
      label: "by changeset index",
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.Checkpoints.getSingle(
        {
          ...params,
          changesetIndex: 1000
        })
    }
  ].forEach((testCase) => {
    it(`should not find checkpoint ${testCase.label} if changeset does not exist`, async () => {
      // Arrange
      const iModelScopedOperationParams: IModelScopedOperationParams = {
        authorization,
        iModelId: testIModel.id
      };

      // Act
      let errorThrown: Error | undefined;
      try {
        await testCase.functionUnderTest(iModelScopedOperationParams);
      } catch (e) {
        errorThrown = e;
      }

      // Assert
      expect(errorThrown).to.not.be.undefined;
      assertError({
        actualError: errorThrown!,
        expectedError: {
          code: IModelsErrorCode.ChangesetNotFound,
          message: "Requested Changeset is not available."
        }
      });
    });
  });

  it("should not find checkpoint by named version id if named version does not exist", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
      namedVersionId: "invalidId"
    };

    // Act
    let errorThrown: Error | undefined;
    try {
      await iModelsClient.Checkpoints.getSingle(getSingleCheckpointParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: IModelsErrorCode.NamedVersionNotFound,
        message: "Requested Named Version is not available."
      }
    });
  });
});
