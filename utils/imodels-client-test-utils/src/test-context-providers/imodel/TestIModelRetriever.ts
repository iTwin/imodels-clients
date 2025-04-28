/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { injectable } from "inversify";

import { GetLockListParams, Lock } from "@itwin/imodels-client-authoring";
import {  GetBriefcaseListParams, GetChangesetExtendedDataListParams, GetChangesetGroupListParams,GetChangesetListParams, GetNamedVersionListParams, IModel,NamedVersion, toArray } from "@itwin/imodels-client-management";

import { TestSetupError } from "../../CommonTestUtils";
import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";
import { TestITwinProvider } from "../itwin/TestITwinProvider";

import { TestIModelCreator } from "./TestIModelCreator";
import { TestIModelFileProvider } from "./TestIModelFileProvider";
import { BriefcaseMetadata, ChangesetExtendedDataMetadata, ChangesetGroupMetadata, NamedVersionMetadata, ReusableIModelMetadata } from "./TestIModelInterfaces";
import { TestIModelsClient } from "./TestIModelsClient";

@injectable()
export class TestIModelRetriever {
  constructor(
    private readonly _iModelsClient: TestIModelsClient,
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    private readonly _testITwinProvider: TestITwinProvider,
    private readonly _testIModelFileProvider: TestIModelFileProvider
  ) { }

  public async findIModelByName(iModelName: string): Promise<IModel | undefined> {
    const iTwinId = await this._testITwinProvider.getOrCreate();
    const iModelIterator = this._iModelsClient.iModels.getRepresentationList({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      urlParams: {
        iTwinId,
        name: iModelName
      }
    });
    const iModels = await toArray(iModelIterator);
    return iModels.length === 0
      ? undefined
      : iModels[0];
  }

  public async queryRelatedData(iModel: IModel): Promise<ReusableIModelMetadata> {
    const briefcases = await this.queryAndValidateBriefcases(iModel.id);
    const namedVersions = await this.queryAndValidateNamedVersions(iModel.id);
    const lock = await this.queryAndValidateLock(iModel.id);
    const changesetGroups = await this.queryAndValidateChangesetGroups(iModel.id);
    const changesetExtendedData = await this.queryAndValidateChangesetExtendedData(iModel.id);
    await this.queryAndValidateChangesets(iModel.id, changesetGroups);

    return {
      id: iModel.id,
      name: iModel.name,
      description: iModel.description!,
      briefcases,
      namedVersions,
      lock,
      changesetGroups,
      changesetExtendedData
    };
  }

  private async queryAndValidateBriefcases(iModelId: string): Promise<BriefcaseMetadata[]> {
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId
    };
    const briefcases = await toArray(this._iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams));
    if (briefcases.length !== TestIModelCreator.briefcaseCount)
      throw new TestSetupError(`${briefcases.length} is an unexpected briefcase count for reusable test iModel.`);

    return briefcases.map((briefcase) => ({
      id: briefcase.briefcaseId,
      deviceName: briefcase.deviceName!,
      ownerId: briefcase.ownerId
    }));
  }

  private async queryAndValidateNamedVersions(iModelId: string): Promise<NamedVersionMetadata[]> {
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId
    };
    const namedVersions: NamedVersion[] = await toArray(this._iModelsClient.namedVersions.getRepresentationList(getNamedVersionListParams));
    if (namedVersions.length !== TestIModelCreator.namedVersions.length)
      throw new TestSetupError(`${namedVersions.length} is an unexpected named version count for reusable test iModel.`);

    const mappedNamedVersions = namedVersions
      .map((namedVersion) => ({
        id: namedVersion.id,
        name: namedVersion.name,
        changesetId: namedVersion.changesetId!,
        changesetIndex: this._testIModelFileProvider.changesets.find((cs) => cs.id === namedVersion.changesetId)!.index
      }))
      .sort((nv1, nv2) => nv1.changesetIndex - nv2.changesetIndex);

    if (!mappedNamedVersions.every((nv, i) => nv.name === TestIModelCreator.namedVersions[i].name))
      throw new TestSetupError("Reusable test iModel contains unexpected named versions - names do not match");

    if (!mappedNamedVersions.every((nv, i) => nv.changesetIndex === TestIModelCreator.namedVersions[i].changesetIndex))
      throw new TestSetupError("Reusable test iModel contains unexpected named versions - Changeset indexes do not match.");

    return mappedNamedVersions;
  }

  private async queryAndValidateLock(iModelId: string): Promise<Lock> {
    const getLockListParams: GetLockListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId
    };
    const locks: Lock[] = await toArray(this._iModelsClient.locks.getList(getLockListParams));
    if (locks.length !== 1)
      throw new TestSetupError(`${locks.length} is an unexpected lock count for reusable test iModel.`);

    return locks[0];
  }

  private async queryAndValidateChangesetExtendedData(iModelId: string): Promise<ChangesetExtendedDataMetadata[]> {
    const getChangesetExtendedDataListParams: GetChangesetExtendedDataListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId
    };
    const changesetExtendedDataList = await toArray(this._iModelsClient.changesetExtendedData.getList(getChangesetExtendedDataListParams));
    if (changesetExtendedDataList.length !== TestIModelCreator.changesetExtendedData.length)
      throw new TestSetupError(`${changesetExtendedDataList.length} is an unexpected changeset extended data count for reusable test iModel.`);

    return changesetExtendedDataList.map((csExtendedData) => ({
      changesetId: csExtendedData.changesetId,
      changesetIndex: csExtendedData.changesetIndex,
      data: csExtendedData.data
    }));
  }

  private async queryAndValidateChangesetGroups(iModelId: string): Promise<ChangesetGroupMetadata[]> {
    const getChangesetGroupListParams: GetChangesetGroupListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId
    };
    const changesetGroups = await toArray(this._iModelsClient.changesetGroups.getList(getChangesetGroupListParams));
    if (changesetGroups.length !== TestIModelCreator.changesetGroups.length)
      throw new TestSetupError(`${changesetGroups.length} is an unexpected changeset group count for reusable test iModel.`);

    return changesetGroups.map((csGroup) => {
      const changesetIndexes = TestIModelCreator.changesetGroups.find((x) => x.description === csGroup.description)?.changesetIndexes;
      if (!changesetIndexes)
        throw new TestSetupError("Could not find expected changeset group by description.");
      return { id: csGroup.id, description: csGroup.description, changesetIndexes };
    });
  }

  private async queryAndValidateChangesets(iModelId: string, changesetGroups: ChangesetGroupMetadata[]): Promise<void> {
    const getChangesetListParams: GetChangesetListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId
    };
    const changesets = await toArray(this._iModelsClient.changesets.getMinimalList(getChangesetListParams));
    if (changesets.length !== this._testIModelFileProvider.changesets.length)
      throw new TestSetupError(`${changesets.length} is an unexpected changeset count for reusable test iModel.`);

    for (const changeset of changesets) {
      const expectedGroupId = changesetGroups.find((csGroup) => csGroup.changesetIndexes.includes(changeset.index))?.id ?? null;
      if (changeset.groupId !== expectedGroupId)
        throw new TestSetupError(`Changeset with index ${changeset.index} group id is incorrect.`);
    }
  }
}
