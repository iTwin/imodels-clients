/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { NamedVersion, iModel } from "@itwin/imodels-client-authoring";
import { TestSetupError, toArray } from "../../CommonTestUtils";
import { TestiModelBriefcase, TestiModelChangeset, TestiModelNamedVersion, TestiModelSetupContext, TestiModelWithChangesetsAndNamedVersions, iModelIdParam, iModelIdentificationByNameParams } from "./TestiModelInterfaces";
import { TestiModelMetadata } from "./TestiModelMetadata";

export class TestiModelRetriever {
  public static async queryWithRelatedData(params: TestiModelSetupContext & iModelIdentificationByNameParams)
    : Promise<TestiModelWithChangesetsAndNamedVersions | undefined> {
    const imodel = await TestiModelRetriever.findiModelByName(params);
    if (!imodel)
      return undefined;

    const paramsWithiModelId = { ...params, imodelId: imodel.id };
    const briefcase = await TestiModelRetriever.queryAndValidateBriefcase(paramsWithiModelId);
    const changesets = await TestiModelRetriever.queryAndValidateChangesets(paramsWithiModelId);
    const namedVersions = await TestiModelRetriever.queryAndValidateNamedVersions(paramsWithiModelId);

    return {
      id: imodel.id,
      name: imodel.name,
      description: imodel.description!,
      briefcase,
      changesets,
      namedVersions
    };
  }

  private static async queryAndValidateBriefcase(params: TestiModelSetupContext & iModelIdParam): Promise<TestiModelBriefcase> {
    const briefcases = await toArray(params.imodelsClient.Briefcases.getRepresentationList(params));
    if (briefcases.length !== 1)
      throw new TestSetupError(`${briefcases.length} is an unexpected briefcase count for reusable test iModel.`);

    return { id: briefcases[0].briefcaseId, deviceName: briefcases[0].deviceName! };
  }

  private static async queryAndValidateChangesets(params: TestiModelSetupContext & iModelIdParam): Promise<TestiModelChangeset[]> {
    const changesets = await toArray(params.imodelsClient.Changesets.getRepresentationList(params));
    if (changesets.length !== TestiModelMetadata.Changesets.length)
      throw new TestSetupError(`${changesets.length} is an unexpected changeset count for reusable test iModel.`);

    return changesets;
  }

  private static async queryAndValidateNamedVersions(params: TestiModelSetupContext & iModelIdParam): Promise<TestiModelNamedVersion[]> {
    const namedVersions: NamedVersion[] = await toArray(params.imodelsClient.NamedVersions.getRepresentationList(params));
    if (namedVersions.length !== 2)
      throw new TestSetupError(`${namedVersions.length} is an unexpected named version count for reusable test iModel.`);

    const mappedNamedVersions = namedVersions
      .map(nv => ({
        id: nv.id,
        changesetId: nv.changesetId!,
        changesetIndex: TestiModelMetadata.Changesets.find(cs => cs.id === nv.changesetId)!.index
      }))
      .sort((nv1, nv2) => nv1.changesetIndex - nv2.changesetIndex);

    if (mappedNamedVersions[0].changesetIndex !== 5 || mappedNamedVersions[1].changesetIndex !== 10)
      throw new TestSetupError("");

    return mappedNamedVersions;
  }

  private static async findiModelByName(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<iModel | undefined> {
    const imodels = params.imodelsClient.iModels.getRepresentationList({
      requestContext: params.requestContext,
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
