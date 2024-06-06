/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { sleep } from "@itwin/imodels-client-management/lib/base/internal";
import { injectable } from "inversify";

import { ChangesetGroupState, CheckpointState, ContainerTypes, GetSingleCheckpointParams, IModel, Lock, LockLevel, LockedObjects, UpdateChangesetGroupParams } from "@itwin/imodels-client-authoring";

import { TestSetupError } from "../../CommonTestUtils";
import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";
import { TestITwinProvider } from "../itwin/TestITwinProvider";

import { TestIModelFileProvider } from "./TestIModelFileProvider";
import { BriefcaseMetadata, ChangesetExtendedDataMetadata, ChangesetGroupMetadata, IModelMetadata, NamedVersionMetadata, ReusableIModelMetadata } from "./TestIModelInterfaces";
import { TestIModelsClient } from "./TestIModelsClient";

@injectable()
export class TestIModelCreator {
  public static briefcaseCount = 3;

  public static namedVersions = [
    { name: "Named version 5", changesetIndex: 5 },
    { name: "Named version 10", changesetIndex: 10 }
  ];

  public static changesetExtendedData = [
    { changesetIndex: 1, data: { someKey: "someValue" } },
    { changesetIndex: 2, data: { someKey: "someValue2" } }
  ];

  public static changesetGroups = [
    { description: "Initial group", changesetIndexes: [1, 2, 3] },
    { description: "Another one", changesetIndexes: [4, 5, 6] }
  ];

  private readonly _reusableIModelCreationInProgressDescription = "Reusable iModel creation in progress";
  private readonly _reusableIModelCreationCompletedDescription = "Reusable iModel creation completed";
  private readonly _briefcaseDeviceName = "Some device name";

  constructor(
    private readonly _iModelsClient: TestIModelsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    private readonly _testITwinProvider: TestITwinProvider,
    private readonly _testIModelFileProvider: TestIModelFileProvider
  ) { }

  public async createEmpty(iModelName: string, iModelDescription: string = "Some description"): Promise<IModelMetadata> {
    const iTwinId = await this._testITwinProvider.getOrCreate();
    const iModel = await this._iModelsClient.iModels.createEmpty({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelProperties: {
        iTwinId,
        name: iModelName,
        description: iModelDescription,
        containersEnabled: ContainerTypes.None
      }
    });

    return {
      id: iModel.id,
      name: iModel.name,
      description: iModel.description!
    };
  }

  public async createEmptyAndUploadChangesets(iModelName: string): Promise<IModelMetadata> {
    const iModel = await this.createEmpty(iModelName);
    const briefcases = await this.acquireBriefcases(iModel.id, TestIModelCreator.briefcaseCount);
    await this.uploadChangesets(iModel.id, briefcases[0].id, []);
    return iModel;
  }

  public async createReusable(iModelName: string): Promise<ReusableIModelMetadata> {
    const iModel = await this.createEmpty(iModelName, this._reusableIModelCreationInProgressDescription);
    const briefcases = await this.acquireBriefcases(iModel.id, TestIModelCreator.briefcaseCount);
    const changesetGroups = await this.createChangesetGroups(iModel.id);
    await this.uploadChangesets(iModel.id, briefcases[0].id, changesetGroups);
    await this.completeChangesetGroups(iModel.id, changesetGroups);
    const changesetExtendedData = await this.createChangesetExtendedData(iModel.id);
    const namedVersions = await this.createNamedVersionsOnReusableIModel(iModel.id);
    const lock = await this.createLockOnReusableIModel(iModel.id, briefcases[0].id);
    const initializedIModel = await this._iModelsClient.iModels.update({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId: iModel.id,
      iModelProperties: {
        description: this._reusableIModelCreationCompletedDescription
      }
    });

    return {
      ...iModel,
      description: initializedIModel.description!,
      briefcases,
      namedVersions,
      lock,
      changesetGroups,
      changesetExtendedData
    };
  }

  public isReusableIModelInitialized(iModel: IModel): boolean {
    return iModel.description === this._reusableIModelCreationCompletedDescription;
  }

  private async createNamedVersionsOnReusableIModel(iModelId: string): Promise<NamedVersionMetadata[]> {
    const namedVersions: NamedVersionMetadata[] = [];
    const checkpointGenerationPromises: Promise<void>[] = [];
    for (const namedVersionMetadata of TestIModelCreator.namedVersions) {
      const namedVersion: NamedVersionMetadata = await this.createNamedVersionOnChangesetIndex(
        iModelId,
        namedVersionMetadata.name,
        namedVersionMetadata.changesetIndex
      );
      namedVersions.push(namedVersion);
      checkpointGenerationPromises.push(
        this.waitForNamedVersionCheckpointGenerated(iModelId, namedVersion.id)
      );
    }

    await Promise.all(checkpointGenerationPromises);
    return namedVersions;
  }

  private async createLockOnReusableIModel(iModelId: string, briefcaseId: number): Promise<Lock> {
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

    const acquiredLocks: Lock = await this._iModelsClient.locks.update({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId,
      briefcaseId,
      lockedObjects: testIModelLocks
    });

    return acquiredLocks;
  }

  private async uploadChangesets(iModelId: string, briefcaseId: number, changesetGroups: ChangesetGroupMetadata[]): Promise<void> {
    for (let i = 0; i < this._testIModelFileProvider.changesets.length; i++) {
      const changeset = this._testIModelFileProvider.changesets[i];
      const parentId = i === 0 ? undefined : this._testIModelFileProvider.changesets[i - 1].id;
      const changesetGroupId = changesetGroups.find((csGroup) => csGroup.changesetIndexes.includes(changeset.index))?.id;

      await this._iModelsClient.changesets.create({
        authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
        iModelId,
        changesetProperties: {
          briefcaseId,
          description: changeset.description,
          containingChanges: changeset.containingChanges,
          id: changeset.id,
          parentId,
          synchronizationInfo: changeset.synchronizationInfo,
          filePath: changeset.filePath,
          groupId: changesetGroupId
        }
      });
    }
  }

  private async createChangesetExtendedData(iModelId: string): Promise<ChangesetExtendedDataMetadata[]> {
    const changesetExtendedDataList: ChangesetExtendedDataMetadata[] = [];
    for (const changesetExtendedDataMetadata of TestIModelCreator.changesetExtendedData) {
      const changesetMetadata = this._testIModelFileProvider.changesets[changesetExtendedDataMetadata.changesetIndex - 1];
      const changesetExtendedData = await this._iModelsClient.changesetExtendedData.create({
        authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
        iModelId,
        changesetExtendedDataProperties: {
          data: changesetExtendedDataMetadata.data
        },
        changesetIndex: changesetExtendedDataMetadata.changesetIndex
      });

      changesetExtendedDataList.push({
        changesetId: changesetMetadata.id,
        changesetIndex: changesetExtendedDataMetadata.changesetIndex,
        data: changesetExtendedData.data
      });
    }

    return changesetExtendedDataList;
  }

  private async createChangesetGroups(iModelId: string): Promise<ChangesetGroupMetadata[]> {
    const changesetGroups: ChangesetGroupMetadata[] = [];

    for (const changesetGroupMetadata of TestIModelCreator.changesetGroups) {
      const changesetGroup = await this._iModelsClient.changesetGroups.create({
        authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
        iModelId,
        changesetGroupProperties: changesetGroupMetadata
      });

      changesetGroups.push({
        id: changesetGroup.id,
        description: changesetGroup.description,
        changesetIndexes: changesetGroupMetadata.changesetIndexes
      });
    }

    return changesetGroups;
  }

  private async completeChangesetGroups(iModelId: string, changesetGroups: ChangesetGroupMetadata[]): Promise<void> {
    for (const changesetGroup of changesetGroups) {
      const updateChangesetGroupParams: UpdateChangesetGroupParams = {
        authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
        iModelId,
        changesetGroupId: changesetGroup.id,
        changesetGroupProperties: {
          state: ChangesetGroupState.Completed
        }
      };

      await this._iModelsClient.changesetGroups.update(updateChangesetGroupParams);
    }
  }

  private async acquireBriefcases(iModelId: string, briefcaseCount: number): Promise<BriefcaseMetadata[]> {
    const briefcases: BriefcaseMetadata[] = [];
    for (let i = 1; i <= briefcaseCount; i++) {
      const briefcase = await this.acquireBriefcase(iModelId);
      briefcases.push(briefcase);
    }
    return briefcases;
  }

  private async acquireBriefcase(iModelId: string): Promise<BriefcaseMetadata> {
    const briefcase = await this._iModelsClient.briefcases.acquire({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId,
      briefcaseProperties: {
        deviceName: this._briefcaseDeviceName
      }
    });

    return {
      id: briefcase.briefcaseId,
      deviceName: briefcase.deviceName!,
      ownerId: briefcase.ownerId
    };
  }

  private async createNamedVersionOnChangesetIndex(iModelId: string, namedVersionName: string, changesetIndex: number): Promise<NamedVersionMetadata> {
    // We use this specific user that is able to generate checkpoints
    // for named version creation to mimic production environment.
    const authorizationForFullyFeaturedUser = this._testAuthorizationProvider.getFullyFeaturedAdmin2Authorization();

    const changesetMetadata = this._testIModelFileProvider.changesets[changesetIndex - 1];
    const namedVersion = await this._iModelsClient.namedVersions.create({
      authorization: authorizationForFullyFeaturedUser,
      iModelId,
      namedVersionProperties: {
        name: namedVersionName,
        changesetId: changesetMetadata.id
      }
    });
    return {
      id: namedVersion.id,
      name: namedVersion.name,
      changesetId: changesetMetadata.id,
      changesetIndex: changesetMetadata.index
    };
  }

  private async waitForNamedVersionCheckpointGenerated(iModelId: string, namedVersionId: string): Promise<void> {
    await sleep(3000);

    const getSingleCheckpointParams: GetSingleCheckpointParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId,
      namedVersionId
    };
    const sleepPeriodInMs = 1000;
    const timeOutInMs = 5 * 60 * 1000;
    for (let retries = timeOutInMs / sleepPeriodInMs; retries > 0; --retries) {
      const checkpoint = await this._iModelsClient.checkpoints.getSingle(getSingleCheckpointParams);

      if (checkpoint.state === CheckpointState.Successful && checkpoint._links?.download !== undefined && checkpoint.containerAccessInfo !== null)
        return;

      if (checkpoint.state !== CheckpointState.Scheduled && checkpoint.state !== CheckpointState.Successful)
        throw new TestSetupError(`Checkpoint generation failed with state: ${checkpoint.state}.`);

      await sleep(sleepPeriodInMs);
    }

    throw new TestSetupError("Timed out while waiting for checkpoint generation to complete.");
  }
}
