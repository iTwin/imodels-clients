/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { GetCheckpointByChangesetIdParams, GetCheckpointByChangesetIndexParams, GetCheckpointByNamedVersionIdParams, iModelsClient, RequestContext, iModel, iModelsErrorCode, iModelScopedOperationParams } from "@itwin/imodels-client-authoring";
import { expect } from "chai";
import { TestiModelGroup, TestClientOptions, TestAuthenticationProvider, TestProjectProvider, Constants, createDefaultTestiModel, cleanUpiModels, assertBaseEntity, TestiModelMetadata, assertError } from "../common";

interface iModelTimelinePoint {
  changesetId: string;
  changesetIndex: number;
  namedVersionId: string;
}

describe.only("[Authoring] CheckpointOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;
  let testiModel: iModel;

  let imodelPointWithCheckpoint: iModelTimelinePoint;
  let imodelPointWithoutCheckpoint: iModelTimelinePoint;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    requestContext = await TestAuthenticationProvider.getRequestContext();
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringCheckpointOperations"
      }
    });

    testiModel = await createDefaultTestiModel({
      imodelsClient,
      requestContext,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for write")
    });

    const changesetIndexWithCheckpoint = 5;
    imodelPointWithCheckpoint = await setupNamedVersion({ requestContext, changesetIndex: changesetIndexWithCheckpoint }); // TODO: different context

    const changesetIndexWithoutCheckpoint = changesetIndexWithCheckpoint + 1;
    imodelPointWithoutCheckpoint = await setupNamedVersion({ requestContext, changesetIndex: changesetIndexWithoutCheckpoint });
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
    assertBaseEntity(checkpoint); // TODO
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
    assertBaseEntity(checkpoint); // TODO
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
    assertBaseEntity(checkpoint); // TODO
  });

  [
    {
      label: "by changeset id",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getByChangesetId(
        {
          ...params,
          changesetId: imodelPointWithoutCheckpoint.changesetId
        })
    },
    {
      label: "by changeset index",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getByChangesetIndex(
        {
          ...params,
          changesetIndex: imodelPointWithoutCheckpoint.changesetIndex
        })
    },
    {
      label: "by named version id",
      functionUnderTest: (params: iModelScopedOperationParams) => imodelsClient.Checkpoints.getByNamedVersionId(
        {
          ...params,
          namedVersionId: imodelPointWithoutCheckpoint.namedVersionId
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

    it(`should not find checkpoint ${testCase.label} if checkpoint for parent entity does not exist`, async () => {
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
          code: iModelsErrorCode.CheckpointNotFound,
          message: "Requested Checkpoint not available."
        }
      });
    });
  });

  async function setupNamedVersion(params: { requestContext: RequestContext, changesetIndex: number }): Promise<iModelTimelinePoint> { // TODO rename
    const changesetMetadata = TestiModelMetadata.Changesets[params.changesetIndex - 1];
    const namedVersion = await imodelsClient.NamedVersions.create({
      requestContext,
      imodelId: testiModel.id,
      namedVersionProperties: {
        name: "Named Version",
        changesetId: changesetMetadata.id
      }
    });
    return {
      changesetId: changesetMetadata.id,
      changesetIndex: changesetMetadata.index,
      namedVersionId: namedVersion.id
    }
  }
});
