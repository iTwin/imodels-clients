/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { inject, injectable } from "inversify";
import { GetBriefcaseListParams, GetLockListParams, GetNamedVersionListParams, IModel, Lock, NamedVersion, toArray } from "@itwin/imodels-client-authoring";
import { TestSetupError } from "../../CommonTestUtils";
import { TestAuthorizationProvider } from "../auth/TestAuthorizationProvider";
import { TestProjectProvider } from "../project/TestProjectProvider";
import { TestIModelCreator } from "./TestIModelCreator";
import { TestIModelFileProvider } from "./TestIModelFileProvider";
import { BriefcaseMetadata, NamedVersionMetadata, ReusableIModelMetadata } from "./TestIModelInterfaces";
import { TestIModelsClient } from "./TestIModelsClient";

@injectable()
export class TestIModelRetriever {
  constructor(
    @inject(TestIModelsClient)
    private readonly _iModelsClient: TestIModelsClient,
    @inject(TestAuthorizationProvider)
    private readonly _testAuthorizationProvider: TestAuthorizationProvider,
    @inject(TestProjectProvider)
    private readonly _testProjectProvider: TestProjectProvider,
    @inject(TestIModelFileProvider)
    private readonly _testIModelFileProvider: TestIModelFileProvider
  ) { }

  public async queryWithRelatedData(iModelName: string): Promise<ReusableIModelMetadata | undefined> {
    const iModel = await this.findIModelByName(iModelName);
    if (!iModel)
      return undefined;

    const briefcase = await this.queryAndValidateBriefcase(iModel.id);
    const namedVersions = await this.queryAndValidateNamedVersions(iModel.id);
    const lock = await this.queryAndValidateLock(iModel.id);

    return {
      id: iModel.id,
      name: iModel.name,
      description: iModel.description!,
      briefcase,
      namedVersions,
      lock
    };
  }

  private async queryAndValidateBriefcase(iModelId: string): Promise<BriefcaseMetadata> {
    const getBriefcaseListParams: GetBriefcaseListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId
    };
    const briefcases = await toArray(this._iModelsClient.briefcases.getRepresentationList(getBriefcaseListParams));
    if (briefcases.length !== 1)
      throw new TestSetupError(`${briefcases.length} is an unexpected briefcase count for reusable test IModel.`);

    return { id: briefcases[0].briefcaseId, deviceName: briefcases[0].deviceName! };
  }

  private async queryAndValidateNamedVersions(iModelId: string): Promise<NamedVersionMetadata[]> {
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      iModelId
    };
    const namedVersions: NamedVersion[] = await toArray(this._iModelsClient.namedVersions.getRepresentationList(getNamedVersionListParams));
    if (namedVersions.length !== TestIModelCreator.namedVersionIndexes.length)
      throw new TestSetupError(`${namedVersions.length} is an unexpected named version count for reusable test iModel.`);

    const mappedNamedVersions = namedVersions
      .map((namedVersion) => ({
        id: namedVersion.id,
        changesetId: namedVersion.changesetId!,
        changesetIndex: this._testIModelFileProvider.changesets.find((cs) => cs.id === namedVersion.changesetId)!.index
      }))
      .sort((nv1, nv2) => nv1.changesetIndex - nv2.changesetIndex);

    if (!mappedNamedVersions.every((mappedNamedVersion, i) => mappedNamedVersion.changesetIndex === TestIModelCreator.namedVersionIndexes[i]))
      throw new TestSetupError("Reusable test iModel contains unexpected named versions.");

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

  private async findIModelByName(iModelName: string): Promise<IModel | undefined> {
    const projectId = await this._testProjectProvider.getOrCreate();
    const iModelIterator = this._iModelsClient.iModels.getRepresentationList({
      authorization: this._testAuthorizationProvider.getAdmin1Authorization(),
      urlParams: {
        projectId,
        name: iModelName
      }
    });
    const iModels = await toArray(iModelIterator);
    return iModels.length === 0
      ? undefined
      : iModels[0];
  }
}
