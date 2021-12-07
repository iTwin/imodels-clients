/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, CheckpointState, Lock, LockLevel, LockedObjects, sleep } from "@itwin/imodels-client-authoring";
import { TestSetupError } from "../../CommonTestUtils";
import { Config } from "../../Config";
import { TestAuthorizationProvider } from "../auth/TestAuthenticationProvider";
import { TestIModelFileProvider } from "./TestIModelFileProvider";
import { BriefcaseMetadata, IModelIdParam, IModelIdentificationByNameParams, IModelMetadata, NamedVersionMetadata, ReusableIModelMetadata, TestIModelSetupContext } from "./TestIModelInterfaces";

export class TestIModelCreator {
  public static namedVersionIndexes = [5, 10];

  private static readonly _iModelDescription = "Some description";
  private static readonly _briefcaseDeviceName = "Some device name";

  public static async createEmpty(params: TestIModelSetupContext & IModelIdentificationByNameParams): Promise<IModelMetadata> {
    const iModel = await params.iModelsClient.iModels.createEmpty({
      authorization: params.authorization,
      iModelProperties: {
        projectId: params.projectId,
        name: params.iModelName,
        description: TestIModelCreator._iModelDescription
      }
    });

    return {
      id: iModel.id,
      name: iModel.name,
      description: iModel.description!
    };
  }

  public static async createEmptyAndUploadChangesets(params: TestIModelSetupContext & IModelIdentificationByNameParams): Promise<IModelMetadata> {
    const iModel = await TestIModelCreator.createEmpty(params);
    await TestIModelCreator.uploadChangesets({ ...params, iModelId: iModel.id });

    return iModel;
  }

  public static async createReusable(params: TestIModelSetupContext & IModelIdentificationByNameParams): Promise<ReusableIModelMetadata> {
    const iModel = await TestIModelCreator.createEmpty(params);
    const briefcase = await TestIModelCreator.uploadChangesets({ ...params, iModelId: iModel.id });
    const namedVersions = await TestIModelCreator.createNamedVersionsOnReusableIModel({ ...params, iModelId: iModel.id });
    const lock = await TestIModelCreator.createLockOnReusableIModel({ ...params, iModelId: iModel.id, briefcaseId: briefcase.id });

    return {
      ...iModel,
      briefcase,
      namedVersions,
      lock
    };
  }

  private static async createNamedVersionsOnReusableIModel(params: TestIModelSetupContext & IModelIdParam): Promise<NamedVersionMetadata[]> {
    // We use this specific user that is able to generate checkpoints
    // for named version creation to mimic production environment.
    const authorizationForUser2 = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin2FullyFeatured);
    const iModelScopedRequestParams = {
      iModelsClient: params.iModelsClient,
      authorization: authorizationForUser2,
      iModelId: params.iModelId
    };

    const namedVersions: NamedVersionMetadata[] = [];
    const checkpointGenerationPromises: Promise<void>[] = [];
    for (const index of TestIModelCreator.namedVersionIndexes) {
      const namedVersion: NamedVersionMetadata = await TestIModelCreator.createNamedVersionOnChangesetIndex({
        ...iModelScopedRequestParams,
        changesetIndex: index
      });
      namedVersions.push(namedVersion);
      checkpointGenerationPromises.push(
        TestIModelCreator.waitForNamedVersionCheckpointGenerated({ ...iModelScopedRequestParams, namedVersionId: namedVersion.id })
      );
    }

    await Promise.all(checkpointGenerationPromises);
    return namedVersions;
  }

  private static async createLockOnReusableIModel(params: TestIModelSetupContext & IModelIdParam & { briefcaseId: number }): Promise<Lock> {
    const testIModelLocks: LockedObjects[] = [
      {
        lockLevel: LockLevel.Exclusive,
        objectIds: ["0x1", "0xa"]
      },
      {
        lockLevel: LockLevel.Shared,
        objectIds: ["0x2", "0xb"]
      }
    ];

    const acquiredLocks: Lock = await params.iModelsClient.locks.update({
      authorization: params.authorization,
      iModelId: params.iModelId,
      briefcaseId: params.briefcaseId,
      lockedObjects: testIModelLocks
    });

    return acquiredLocks;
  }

  public static async uploadChangesets(params: TestIModelSetupContext & IModelIdParam): Promise<BriefcaseMetadata> {
    const briefcase = await TestIModelCreator.acquireBriefcase(params);

    const changesets: Changeset[] = [];
    for (let i = 0; i < TestIModelFileProvider.changesets.length; i++) {
      const createdChangeset = await params.iModelsClient.changesets.create({
        authorization: params.authorization,
        iModelId: params.iModelId,
        changesetProperties: {
          briefcaseId: briefcase.id,
          description: TestIModelFileProvider.changesets[i].description,
          containingChanges: TestIModelFileProvider.changesets[i].containingChanges,
          id: TestIModelFileProvider.changesets[i].id,
          parentId: i === 0
            ? undefined
            : TestIModelFileProvider.changesets[i - 1].id,
          filePath: TestIModelFileProvider.changesets[i].filePath
        }
      });
      changesets.push(createdChangeset);
    }

    return briefcase;
  }

  private static async acquireBriefcase(params: TestIModelSetupContext & IModelIdParam): Promise<BriefcaseMetadata> {
    const briefcase = await params.iModelsClient.briefcases.acquire({
      authorization: params.authorization,
      iModelId: params.iModelId,
      briefcaseProperties: {
        deviceName: TestIModelCreator._briefcaseDeviceName
      }
    });

    return {
      id: briefcase.briefcaseId,
      deviceName: briefcase.deviceName!
    };
  }

  private static async createNamedVersionOnChangesetIndex(params: TestIModelSetupContext & IModelIdParam & { changesetIndex: number }): Promise<NamedVersionMetadata> {
    const changesetMetadata = TestIModelFileProvider.changesets[params.changesetIndex - 1];
    const namedVersion = await params.iModelsClient.namedVersions.create({
      authorization: params.authorization,
      iModelId: params.iModelId,
      namedVersionProperties: {
        name: `Named version ${changesetMetadata.index}`,
        changesetId: changesetMetadata.id
      }
    });
    return {
      id: namedVersion.id,
      changesetId: changesetMetadata.id,
      changesetIndex: changesetMetadata.index
    };
  }

  private static async waitForNamedVersionCheckpointGenerated(params: TestIModelSetupContext & IModelIdParam & { namedVersionId: string }): Promise<void> {
    const sleepPeriodInMs = 1000;
    const timeOutInMs = 5 * 60 * 1000;
    for (let retries = timeOutInMs / sleepPeriodInMs; retries > 0; --retries) {
      const checkpoint = await params.iModelsClient.checkpoints.getSingle(params);

      if (checkpoint.state === CheckpointState.Successful && checkpoint._links?.download !== undefined && checkpoint.containerAccessInfo !== null)
        return;

      if (checkpoint.state !== CheckpointState.Scheduled && checkpoint.state !== CheckpointState.Successful)
        throw new TestSetupError(`Checkpoint generation failed with state: ${checkpoint.state}.`);

      await sleep(sleepPeriodInMs);
    }

    throw new TestSetupError("Timed out while waiting for checkpoint generation to complete.");
  }
}
