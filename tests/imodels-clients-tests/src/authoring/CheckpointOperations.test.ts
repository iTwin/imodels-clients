/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { AuthorizationCallback, CheckpointState, GetSingleCheckpointParams, iModelScopedOperationParams, iModelsClient, iModelsErrorCode } from "@itwin/imodels-client-authoring";
import { Config, Constants, NamedVersionMetadata, ReusableTestiModelProvider, ReusableiModelMetadata, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, TestiModelGroup, assertCheckpoint, assertError, cleanUpiModels } from "../common";

describe("[Authoring] CheckpointOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;
  let testiModel: ReusableiModelMetadata;
  let testiModelNamedVersion: NamedVersionMetadata;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringCheckpointOperations"
      }
    });

    testiModel = await ReusableTestiModelProvider.getOrCreate({
      authorization,
      imodelsClient,
      projectId
    });
    testiModelNamedVersion = testiModel.namedVersions[0];
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, authorization, projectId, testiModelGroup });
  });

  it("should get by changeset id", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      imodelId: testiModel.id,
      changesetId: testiModelNamedVersion.changesetId
    };

    // Act
    const checkpoint = await imodelsClient.Checkpoints.getSingle(getSingleCheckpointParams);

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testiModelNamedVersion.changesetId,
        changesetIndex: testiModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful
      }
    });
  });

  it("should get by changeset index", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      imodelId: testiModel.id,
      changesetIndex: testiModelNamedVersion.changesetIndex
    };

    // Act
    const checkpoint = await imodelsClient.Checkpoints.getSingle(getSingleCheckpointParams);

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testiModelNamedVersion.changesetId,
        changesetIndex: testiModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful
      }
    });
  });

  it("should get by named version id", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      imodelId: testiModel.id,
      namedVersionId: testiModelNamedVersion.id
    };

    // Act
    const checkpoint = await imodelsClient.Checkpoints.getSingle(getSingleCheckpointParams);

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testiModelNamedVersion.changesetId,
        changesetIndex: testiModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful
      }
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getSingle(
        {
          ...params,
          changesetId: testiModelNamedVersion.changesetId
        })
    },
    {
      label: "by changeset index",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getSingle(
        {
          ...params,
          changesetIndex: testiModelNamedVersion.changesetIndex
        })
    },
    {
      label: "by named version id",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getSingle(
        {
          ...params,
          namedVersionId: testiModelNamedVersion.id
        })
    }
  ].forEach(testCase => {
    it(`should not find checkpoint ${testCase.label} if iModel does not exist`, async () => {
      // Arrange
      const imodelScopedOperationParams: iModelScopedOperationParams = {
        authorization,
        imodelId: "invalidiModelId"
      };

      // Act
      let errorThrown: Error | undefined = undefined;
      try {
        await testCase.functionUnderTest(imodelScopedOperationParams);
      } catch (e) {
        errorThrown = e;
      }

      // Assert
      expect(errorThrown).to.not.be.undefined;
      assertError({
        actualError: errorThrown!,
        expectedError: {
          code: iModelsErrorCode.iModelNotFound,
          message: "Requested iModel is not available."
        }
      });
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getSingle(
        {
          ...params,
          changesetId: "invalidId"
        })
    },
    {
      label: "by changeset index",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getSingle(
        {
          ...params,
          changesetIndex: 1000
        })
    }
  ].forEach(testCase => {
    it(`should not find checkpoint ${testCase.label} if changeset does not exist`, async () => {
      // Arrange
      const imodelScopedOperationParams: iModelScopedOperationParams = {
        authorization,
        imodelId: testiModel.id
      };

      // Act
      let errorThrown: Error | undefined = undefined;
      try {
        await testCase.functionUnderTest(imodelScopedOperationParams);
      } catch (e) {
        errorThrown = e;
      }

      // Assert
      expect(errorThrown).to.not.be.undefined;
      assertError({
        actualError: errorThrown!,
        expectedError: {
          code: iModelsErrorCode.ChangesetNotFound,
          message: "Requested Changeset is not available."
        }
      });
    });
  });

  it("should not find checkpoint by named version id if named version does not exist", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      imodelId: testiModel.id,
      namedVersionId: "invalidId"
    };

    // Act
    let errorThrown: Error | undefined = undefined;
    try {
      await imodelsClient.Checkpoints.getSingle(getSingleCheckpointParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: iModelsErrorCode.NamedVersionNotFound,
        message: "Requested Named Version is not available."
      }
    });
  });
});
