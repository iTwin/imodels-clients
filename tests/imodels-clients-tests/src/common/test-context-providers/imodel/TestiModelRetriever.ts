/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Lock, NamedVersion, iModel, toArray } from "@itwin/imodels-client-authoring";
import { TestSetupError } from "../../CommonTestUtils";
import { TestiModelCreator } from "./TestiModelCreator";
import { TestiModelFileProvider } from "./TestiModelFileProvider";
import { BriefcaseMetadata, NamedVersionMetadata, ReusableiModelMetadata, TestiModelSetupContext, iModelIdParam, iModelIdentificationByNameParams } from "./TestiModelInterfaces";

export class TestiModelRetriever {
  public static async queryWithRelatedData(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<ReusableiModelMetadata | undefined> {
    const imodel = await TestiModelRetriever.findiModelByName(params);
    if (!imodel)
      return undefined;

    const paramsWithiModelId = { ...params, imodelId: imodel.id };
    const briefcase = await TestiModelRetriever.queryAndValidateBriefcase(paramsWithiModelId);
    const namedVersions = await TestiModelRetriever.queryAndValidateNamedVersions(paramsWithiModelId);
    const lock = await TestiModelRetriever.queryAndValidateLock(paramsWithiModelId);

    return {
      id: imodel.id,
      name: imodel.name,
      description: imodel.description!,
      briefcase,
      namedVersions,
      lock
    };
  }

  private static async queryAndValidateBriefcase(params: TestiModelSetupContext & iModelIdParam): Promise<BriefcaseMetadata> {
    const briefcases = await toArray(params.imodelsClient.Briefcases.getRepresentationList(params));
    if (briefcases.length !== 1)
      throw new TestSetupError(`${briefcases.length} is an unexpected briefcase count for reusable test iModel.`);

    return { id: briefcases[0].briefcaseId, deviceName: briefcases[0].deviceName! };
  }

  private static async queryAndValidateNamedVersions(params: TestiModelSetupContext & iModelIdParam): Promise<NamedVersionMetadata[]> {
    const namedVersions: NamedVersion[] = await toArray(params.imodelsClient.NamedVersions.getRepresentationList(params));
    if (namedVersions.length !== TestiModelCreator.namedVersionIndexes.length)
      throw new TestSetupError(`${namedVersions.length} is an unexpected named version count for reusable test iModel.`);

    const mappedNamedVersions = namedVersions
      .map((namedVersion) => ({
        id: namedVersion.id,
        changesetId: namedVersion.changesetId!,
        changesetIndex: TestiModelFileProvider.changesets.find((cs) => cs.id === namedVersion.changesetId)!.index
      }))
      .sort((nv1, nv2) => nv1.changesetIndex - nv2.changesetIndex);

    if (!mappedNamedVersions.every((mappedNamedVersion, i) => mappedNamedVersion.changesetIndex === TestiModelCreator.namedVersionIndexes[i]))
      throw new TestSetupError("Reusable test iModel contains unexpected named versions.");

    return mappedNamedVersions;
  }

  private static async queryAndValidateLock(params: TestiModelSetupContext & iModelIdParam): Promise<Lock> {
    const locks: Lock[] = await toArray(params.imodelsClient.Locks.getList(params));
    if (locks.length !== 1)
      throw new TestSetupError(`${locks.length} is an unexpected lock count for reusable test iModel.`);

    return locks[0];
  }

  private static async findiModelByName(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<iModel | undefined> {
    const imodels = params.imodelsClient.iModels.getRepresentationList({
      authorization: params.authorization,
      urlParams: {
        projectId: params.projectId
      }
    });

    for await (const imodel of imodels) {
      if (imodel.displayName === params.imodelName)
        return imodel;
    }

    return undefined;
  }
}
