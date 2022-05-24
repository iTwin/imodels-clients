/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, CheckpointState, GetSingleCheckpointParams, IModelScopedOperationParams, IModelsClient, IModelsClientOptions, IModelsErrorCode } from "@itwin/imodels-client-authoring";
import { NamedVersionMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestUtilTypes, assertCheckpoint, assertError } from "@itwin/imodels-client-test-utils";
import { getTestDIContainer } from "../common";

describe("[Authoring] CheckpointOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModel: ReusableIModelMetadata;
  let testIModelNamedVersion: NamedVersionMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModel = await reusableTestIModelProvider.getOrCreate();
    testIModelNamedVersion = testIModel.namedVersions[0];
  });

  it("should get by changeset id", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
      changesetId: testIModelNamedVersion.changesetId
    };

    // Act
    const checkpoint = await iModelsClient.checkpoints.getSingle(getSingleCheckpointParams);

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
    const checkpoint = await iModelsClient.checkpoints.getSingle(getSingleCheckpointParams);

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
    const checkpoint = await iModelsClient.checkpoints.getSingle(getSingleCheckpointParams);

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
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.checkpoints.getSingle(
        {
          ...params,
          changesetId: testIModelNamedVersion.changesetId
        })
    },
    {
      label: "by changeset index",
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.checkpoints.getSingle(
        {
          ...params,
          changesetIndex: testIModelNamedVersion.changesetIndex
        })
    },
    {
      label: "by named version id",
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.checkpoints.getSingle(
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
      let objectThrown: unknown;
      try {
        await testCase.functionUnderTest(iModelScopedOperationParams);
      } catch (e) {
        objectThrown = e;
      }

      // Assert
      assertError({
        objectThrown,
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
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.checkpoints.getSingle(
        {
          ...params,
          changesetId: "invalidId"
        })
    },
    {
      label: "by changeset index",
      functionUnderTest: async (params: IModelScopedOperationParams) => iModelsClient.checkpoints.getSingle(
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
      let objectThrown: unknown;
      try {
        await testCase.functionUnderTest(iModelScopedOperationParams);
      } catch (e) {
        objectThrown = e;
      }

      // Assert
      assertError({
        objectThrown,
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
    let objectThrown: unknown;
    try {
      await iModelsClient.checkpoints.getSingle(getSingleCheckpointParams);
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.NamedVersionNotFound,
        message: "Requested Named Version is not available."
      }
    });
  });
});
