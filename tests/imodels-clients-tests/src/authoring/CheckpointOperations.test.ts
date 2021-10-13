/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { GetCheckpointByChangesetIdParams, GetCheckpointByChangesetIndexParams, GetCheckpointByNamedVersionIdParams, iModelsClient, RequestContext, iModelsErrorCode, iModelScopedOperationParams, CheckpointState } from "@itwin/imodels-client-authoring";
import { expect } from "chai";
import { TestiModelGroup, TestClientOptions, TestAuthenticationProvider, TestProjectProvider, Constants, cleanUpiModels, assertError, Config, TestSetupError, sleep, assertCheckpoint } from "../common";
import { TestiModelWithChangesets, TestiModelProvider } from "../common/TestiModelProvider";

interface iModelTimelinePoint {
  changesetId: string;
  changesetIndex: number;
  namedVersionId: string;
}

describe("[Authoring] CheckpointOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;
  let testiModel: TestiModelWithChangesets;
  let imodelPointWithCheckpoint: iModelTimelinePoint;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    requestContext = await TestAuthenticationProvider.getRequestContext(Config.get().testUsers.user1);
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringCheckpointOperations"
      }
    });

    testiModel = await TestiModelProvider.createWithChangesets({
      requestContext,
      imodelsClient,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for write")
    });

    const changesetIndexWithCheckpoint = 5;
    const requestContextForUser2 = await TestAuthenticationProvider.getRequestContext(Config.get().testUsers.user2);
    imodelPointWithCheckpoint = await setupNamedVersion({ requestContext: requestContextForUser2, changesetIndex: changesetIndexWithCheckpoint });
    await waitForNamedVersionCheckpointGenerated(imodelPointWithCheckpoint.namedVersionId);
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });
  });

  it("should get by changeset id", async () => {
    // Arrange
    const getCheckpointByChangesetIdParams: GetCheckpointByChangesetIdParams = {
      requestContext,
      imodelId: testiModel.id,
      changesetId: imodelPointWithCheckpoint.changesetId
    };

    // Act
    const checkpoint = await imodelsClient.Checkpoints.getByChangesetId(getCheckpointByChangesetIdParams);

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: imodelPointWithCheckpoint.changesetId,
        changesetIndex: imodelPointWithCheckpoint.changesetIndex,
        state: CheckpointState.Successful
      }
    });
  });

  it("should get by changeset index", async () => {
    // Arrange
    const getCheckpointByChangesetIndexParams: GetCheckpointByChangesetIndexParams = {
      requestContext,
      imodelId: testiModel.id,
      changesetIndex: imodelPointWithCheckpoint.changesetIndex
    };

    // Act
    const checkpoint = await imodelsClient.Checkpoints.getByChangesetIndex(getCheckpointByChangesetIndexParams);

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: imodelPointWithCheckpoint.changesetId,
        changesetIndex: imodelPointWithCheckpoint.changesetIndex,
        state: CheckpointState.Successful
      }
    });
  });

  it("should get by named version id", async () => {
    // Arrange
    const getCheckpointByNamedVersionIdParams: GetCheckpointByNamedVersionIdParams = {
      requestContext,
      imodelId: testiModel.id,
      namedVersionId: imodelPointWithCheckpoint.namedVersionId
    };

    // Act
    const checkpoint = await imodelsClient.Checkpoints.getByNamedVersionId(getCheckpointByNamedVersionIdParams);

    // Assert
    assertCheckpoint({
      actualCheckpoint: checkpoint,
      expectedCheckpointProperties: {
        changesetId: imodelPointWithCheckpoint.changesetId,
        changesetIndex: imodelPointWithCheckpoint.changesetIndex,
        state: CheckpointState.Successful
      }
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getByChangesetId(
        {
          ...params,
          changesetId: imodelPointWithCheckpoint.changesetId
        })
    },
    {
      label: "by changeset index",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getByChangesetIndex(
        {
          ...params,
          changesetIndex: imodelPointWithCheckpoint.changesetIndex
        })
    },
    {
      label: "by named version id",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getByNamedVersionId(
        {
          ...params,
          namedVersionId: imodelPointWithCheckpoint.namedVersionId
        })
    }
  ].forEach(testCase => {
    it(`should not find checkpoint ${testCase.label} if iModel does not exist`, async () => {
      // Arrange
      const imodelScopedOperationParams: iModelScopedOperationParams = {
        requestContext,
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
          message: "Requested iModel not available."
        }
      });
    });
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getByChangesetId(
        {
          ...params,
          changesetId: "invalidId"
        })
    },
    {
      label: "by changeset index",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getByChangesetIndex(
        {
          ...params,
          changesetIndex: 1000
        })
    }
  ].forEach(testCase => {
    it(`should not find checkpoint ${testCase.label} if changeset does not exist`, async () => {
      // Arrange
      const imodelScopedOperationParams: iModelScopedOperationParams = {
        requestContext,
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
          message: "Requested Changeset not available."
        }
      });
    });
  });

  it(`should not find checkpoint by named version id if named version does not exist`, async () => {
    // Arrange
    const getCheckpointByNamedVersionIdParams: GetCheckpointByNamedVersionIdParams = {
      requestContext,
      imodelId: testiModel.id,
      namedVersionId: "invalidId"
    };

    // Act
    let errorThrown: Error | undefined = undefined;
    try {
      await imodelsClient.Checkpoints.getByNamedVersionId(getCheckpointByNamedVersionIdParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: iModelsErrorCode.NamedVersionNotFound,
        message: "Requested Named Version not available."
      }
    });
  });

  async function setupNamedVersion(params: { requestContext: RequestContext, changesetIndex: number }): Promise<iModelTimelinePoint> { // TODO rename
    const changesetMetadata = testiModel.changesets[params.changesetIndex - 1];
    const namedVersion = await imodelsClient.NamedVersions.create({
      requestContext: params.requestContext,
      imodelId: testiModel.id,
      namedVersionProperties: {
        name: `Named Version ${changesetMetadata.index}`,
        changesetId: changesetMetadata.id
      }
    });
    return {
      changesetId: changesetMetadata.id,
      changesetIndex: changesetMetadata.index,
      namedVersionId: namedVersion.id
    }
  }

  async function waitForNamedVersionCheckpointGenerated(namedVersionId: string): Promise<void> { // TODO: rethink params
    const sleepPeriodInMs = 1000;
    const timeOutInMs = 5 * 60 * 1000;
    for (let retries = timeOutInMs / sleepPeriodInMs; retries > 0; --retries) {
      const checkpoint = await imodelsClient.Checkpoints.getByNamedVersionId({
        requestContext,
        imodelId: testiModel.id,
        namedVersionId
      });

      if (checkpoint.state === CheckpointState.Successful)
        return;

      if (checkpoint.state !== CheckpointState.Scheduled)
        throw new TestSetupError(`Checkpoint generation failed with state: ${checkpoint.state}.`);

      await sleep(sleepPeriodInMs);
    }

    throw new TestSetupError(`Timed out while waiting for checkpoint generation to complete.`);
  }
});
