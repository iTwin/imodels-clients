/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModel, Lock, NamedVersion, toArray } from "@itwin/imodels-client-authoring";
import { TestSetupError } from "../../CommonTestUtils";
import { TestIModelCreator } from "./TestIModelCreator";
import { TestIModelFileProvider } from "./TestIModelFileProvider";
import { BriefcaseMetadata, IModelIdParam, IModelIdentificationByNameParams, NamedVersionMetadata, ReusableIModelMetadata, TestIModelSetupContext } from "./TestIModelInterfaces";

export class TestIModelRetriever {
  public static async queryWithRelatedData(params: TestIModelSetupContext & IModelIdentificationByNameParams): Promise<ReusableIModelMetadata | undefined> {
    const iModel = await TestIModelRetriever.findIModelByName(params);
    if (!iModel)
      return undefined;

    const paramsWithIModelId = { ...params, iModelId: iModel.id };
    const briefcase = await TestIModelRetriever.queryAndValidateBriefcase(paramsWithIModelId);
    const namedVersions = await TestIModelRetriever.queryAndValidateNamedVersions(paramsWithIModelId);
    const lock = await TestIModelRetriever.queryAndValidateLock(paramsWithIModelId);

    return {
      id: iModel.id,
      name: iModel.name,
      description: iModel.description!,
      briefcase,
      namedVersions,
      lock
    };
  }

  private static async queryAndValidateBriefcase(params: TestIModelSetupContext & IModelIdParam): Promise<BriefcaseMetadata> {
    const briefcases = await toArray(params.iModelsClient.briefcases.getRepresentationList(params));
    if (briefcases.length !== 1)
      throw new TestSetupError(`${briefcases.length} is an unexpected briefcase count for reusable test IModel.`);

    return { id: briefcases[0].briefcaseId, deviceName: briefcases[0].deviceName! };
  }

  private static async queryAndValidateNamedVersions(params: TestIModelSetupContext & IModelIdParam): Promise<NamedVersionMetadata[]> {
    const namedVersions: NamedVersion[] = await toArray(params.iModelsClient.namedVersions.getRepresentationList(params));
    if (namedVersions.length !== TestIModelCreator.namedVersionIndexes.length)
      throw new TestSetupError(`${namedVersions.length} is an unexpected named version count for reusable test iModel.`);

    const mappedNamedVersions = namedVersions
      .map((namedVersion) => ({
        id: namedVersion.id,
        changesetId: namedVersion.changesetId!,
        changesetIndex: TestIModelFileProvider.changesets.find((cs) => cs.id === namedVersion.changesetId)!.index
      }))
      .sort((nv1, nv2) => nv1.changesetIndex - nv2.changesetIndex);

    if (!mappedNamedVersions.every((mappedNamedVersion, i) => mappedNamedVersion.changesetIndex === TestIModelCreator.namedVersionIndexes[i]))
      throw new TestSetupError("Reusable test iModel contains unexpected named versions.");

    return mappedNamedVersions;
  }

  private static async queryAndValidateLock(params: TestIModelSetupContext & IModelIdParam): Promise<Lock> {
    const locks: Lock[] = await toArray(params.iModelsClient.locks.getList(params));
    if (locks.length !== 1)
      throw new TestSetupError(`${locks.length} is an unexpected lock count for reusable test iModel.`);

    return locks[0];
  }

  private static async findIModelByName(params: TestIModelSetupContext & IModelIdentificationByNameParams): Promise<IModel | undefined> {
    const iModels = params.iModelsClient.iModels.getRepresentationList({
      authorization: params.authorization,
      urlParams: {
        projectId: params.projectId
      }
    });

    for await (const iModel of iModels) {
      if (iModel.displayName === params.iModelName)
        return iModel;
    }

    return undefined;
  }
}
