/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  IModelsClient,
  IModelsClientOptions,
} from "@itwin/imodels-client-authoring";
import {
  AuthorizationCallback,
  Changeset,
  CheckpointState,
  GetSingleCheckpointParams,
  GetSingleNamedVersionParams,
  IModelScopedOperationParams,
  IModelsErrorCode,
} from "@itwin/imodels-client-management";
import {
  IModelMetadata,
  NamedVersionMetadata,
  ReusableIModelMetadata,
  ReusableTestIModelProvider,
  TestAuthorizationProvider,
  TestIModelCreator,
  TestIModelGroup,
  TestIModelGroupFactory,
  TestSetupError,
  TestUtilTypes,
  assertCheckpoint,
  assertError,
} from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Authoring] CheckpointOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModel: ReusableIModelMetadata;
  let testIModelNamedVersion: NamedVersionMetadata;
  let testIModelGroup: TestIModelGroup;
  let testIModelForWrite: IModelMetadata;

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
      testSuiteName: "AuthoringCheckpointOperations",
    });

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForWrite = await testIModelCreator.createEmptyAndUploadChangesets(
      testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write")
    );

    const reusableTestIModelProvider = container.get(
      ReusableTestIModelProvider
    );
    testIModel = await reusableTestIModelProvider.getOrCreate();
    testIModelNamedVersion = testIModel.namedVersions[0];
  });

  it("should get by changeset id", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
      changesetId: testIModelNamedVersion.changesetId,
    };

    // Act
    const checkpoint = await iModelsClient.checkpoints.getSingle(
      getSingleCheckpointParams
    );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIModelNamedVersion.changesetId,
        changesetIndex: testIModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  it("should get by changeset index", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
      changesetIndex: testIModelNamedVersion.changesetIndex,
    };

    // Act
    const checkpoint = await iModelsClient.checkpoints.getSingle(
      getSingleCheckpointParams
    );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIModelNamedVersion.changesetId,
        changesetIndex: testIModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  it("should get by named version id", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
      namedVersionId: testIModelNamedVersion.id,
    };

    // Act
    const checkpoint = await iModelsClient.checkpoints.getSingle(
      getSingleCheckpointParams
    );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIModelNamedVersion.changesetId,
        changesetIndex: testIModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  it("should get latest", async () => {
    // Arrange
    const expectedNamedVersion =
      testIModel.namedVersions[testIModel.namedVersions.length - 1];
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
    };

    // Act
    const checkpoint = await iModelsClient.checkpoints.getSingle(
      getSingleCheckpointParams
    );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: expectedNamedVersion.changesetId,
        changesetIndex: expectedNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: async (params: IModelScopedOperationParams) =>
        iModelsClient.checkpoints.getSingle({
          ...params,
          changesetId: testIModelNamedVersion.changesetId,
        }),
    },
    {
      label: "by changeset index",
      functionUnderTest: async (params: IModelScopedOperationParams) =>
        iModelsClient.checkpoints.getSingle({
          ...params,
          changesetIndex: testIModelNamedVersion.changesetIndex,
        }),
    },
    {
      label: "by named version id",
      functionUnderTest: async (params: IModelScopedOperationParams) =>
        iModelsClient.checkpoints.getSingle({
          ...params,
          namedVersionId: testIModelNamedVersion.id,
        }),
    },
    {
      label: "(latest)",
      functionUnderTest: async (params: IModelScopedOperationParams) =>
        iModelsClient.checkpoints.getSingle(params),
    },
  ].forEach((testCase) => {
    it(`should not find checkpoint ${testCase.label} if iModel does not exist`, async () => {
      // Arrange
      const iModelScopedOperationParams: IModelScopedOperationParams = {
        authorization,
        iModelId: "invalidIModelId",
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
          message: "Requested iModel is not available.",
        },
      });
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: async (params: IModelScopedOperationParams) =>
        iModelsClient.checkpoints.getSingle({
          ...params,
          changesetId: "invalidId",
        }),
    },
    {
      label: "by changeset index",
      functionUnderTest: async (params: IModelScopedOperationParams) =>
        iModelsClient.checkpoints.getSingle({
          ...params,
          changesetIndex: 1000,
        }),
    },
  ].forEach((testCase) => {
    it(`should not find checkpoint ${testCase.label} if changeset does not exist`, async () => {
      // Arrange
      const iModelScopedOperationParams: IModelScopedOperationParams = {
        authorization,
        iModelId: testIModel.id,
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
          message: "Requested Changeset is not available.",
        },
      });
    });
  });

  it("should not find checkpoint by named version id if named version does not exist", async () => {
    // Arrange
    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization,
      iModelId: testIModel.id,
      namedVersionId: "invalidId",
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
        message: "Requested Named Version is not available.",
      },
    });
  });

  it("should reschedule named version checkpoint if it is not succeeded", async () => {
    // Arrange
    const changeset = await getChangesetWithoutNamedVersion({
      authorization,
      iModelId: testIModelForWrite.id,
    });
    const namedVersion = await iModelsClient.namedVersions.create({
      authorization,
      iModelId: testIModelForWrite.id,
      namedVersionProperties: {
        name: `Named Version ${changeset.index}`,
        description: `Some description for Named Version ${changeset.index}`,
        changesetId: changeset.id,
      },
    });
    const getSingleNamedVersionParams: GetSingleNamedVersionParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      namedVersionId: namedVersion.id,
    };

    // Act
    const checkpoint =
      await iModelsClient.checkpoints.updateNamedVersionCheckpoint(
        getSingleNamedVersionParams
      );

    // Assert
    expect(checkpoint.changesetId).to.equal(namedVersion.changesetId);
    expect(checkpoint.changesetIndex).to.equal(namedVersion.changesetIndex);
    expect(checkpoint.state).to.equal(CheckpointState.Scheduled);
    expect(checkpoint.directoryAccessInfo).to.be.null;
    expect(checkpoint._links).to.exist;
    expect(checkpoint._links.download).to.be.null;
  });

  it("should not update named version checkpoint if checkpoint succeeded", async () => {
    // Arrange
    const getSingleNamedVersionParams: GetSingleNamedVersionParams = {
      authorization,
      iModelId: testIModel.id,
      namedVersionId: testIModelNamedVersion.id,
    };

    // Act
    const checkpoint =
      await iModelsClient.checkpoints.updateNamedVersionCheckpoint(
        getSingleNamedVersionParams
      );

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: testIModelNamedVersion.changesetId,
        changesetIndex: testIModelNamedVersion.changesetIndex,
        state: CheckpointState.Successful,
      },
    });
  });

  it("should not update named version checkpoint if iModel does not exist", async () => {
    // Arrange
    const getSingleNamedVersionParams: GetSingleNamedVersionParams = {
      authorization,
      iModelId: "invalidId",
      namedVersionId: testIModelNamedVersion.id,
    };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.checkpoints.updateNamedVersionCheckpoint(
        getSingleNamedVersionParams
      );
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.IModelNotFound,
        message: "Requested iModel is not available.",
      },
    });
  });

  it("should not update named version checkpoint if named version does not exist", async () => {
    // Arrange
    const getSingleNamedVersionParams: GetSingleNamedVersionParams = {
      authorization,
      iModelId: testIModel.id,
      namedVersionId: "invalidId",
    };

    // Act
    let objectThrown: unknown;
    try {
      await iModelsClient.checkpoints.updateNamedVersionCheckpoint(
        getSingleNamedVersionParams
      );
    } catch (e) {
      objectThrown = e;
    }

    // Assert
    assertError({
      objectThrown,
      expectedError: {
        code: IModelsErrorCode.NamedVersionNotFound,
        message: "Requested Named Version is not available.",
      },
    });
  });

  async function getChangesetWithoutNamedVersion(
    params: IModelScopedOperationParams
  ): Promise<Changeset> {
    for await (const changeset of iModelsClient.changesets.getRepresentationList(
      params
    )) {
      const namedVersion = await changeset.getNamedVersion();
      if (!namedVersion) return changeset;
    }

    throw new TestSetupError(
      "Test iModel does not have any changesets without named versions."
    );
  }
});
