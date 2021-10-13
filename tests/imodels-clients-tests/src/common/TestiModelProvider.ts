import { Briefcase, Changeset, iModel, iModelsClient, RequestContext } from "@itwin/imodels-client-authoring";
import { Config, TestiModelMetadata } from ".";
import { toArray } from "./CommonTestUtils";

export interface TestiModelBriefcase {
  id: number;
  deviceName: string;
}

export interface TestiModelChangeset {
  id: string;
  index: number;
  description: string;
  parentId?: string;
  containingChanges: number;
}

export interface EmptyTestiModel {
  id: string;
  name: string;
  description: string;
}

export interface TestiModelWithChangesets extends EmptyTestiModel {
  briefcase: TestiModelBriefcase;
  changesets: TestiModelChangeset[];
}

export class TestiModelProvider {
  private static _reusableiModel: TestiModelWithChangesets | undefined;

  public static async getOrCreateReusable(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    projectId: string
  }): Promise<TestiModelWithChangesets> {
    if (TestiModelProvider._reusableiModel)
      return TestiModelProvider._reusableiModel;

    const paramsWithiModelName = {
      ...params,
      imodelName: Config.get().testiModelName
    };

    TestiModelProvider._reusableiModel =
      await TestiModelProvider.getTestiModel(paramsWithiModelName) ??
      await TestiModelProvider.createWithChangesets(paramsWithiModelName);

    return TestiModelProvider._reusableiModel!;
  }

  public static async createEmpty(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    projectId: string,
    imodelName: string
  }): Promise<EmptyTestiModel> {
    const imodel = await params.imodelsClient.iModels.createEmpty({
      requestContext: params.requestContext,
      imodelProperties: {
        projectId: params.projectId,
        name: params.imodelName,
        description: "Some description"
      }
    });

    return {
      id: imodel.id,
      name: imodel.name,
      description: imodel.description!
    }
  }

  public static async createWithChangesets(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    projectId: string,
    imodelName: string
  }): Promise<TestiModelWithChangesets> {
    const imodel = await TestiModelProvider.createEmpty(params);

    const briefcase = await params.imodelsClient.Briefcases.acquire({
      requestContext: params.requestContext,
      imodelId: imodel.id,
      briefcaseProperties: {
        deviceName: "Some device name"
      }
    });

    const changesets: Changeset[] = [];
    for (let i = 0; i < TestiModelMetadata.Changesets.length; i++) {
      const createdChangeset = await params.imodelsClient.Changesets.create({
        requestContext: params.requestContext,
        imodelId: imodel.id,
        changesetProperties: {
          briefcaseId: briefcase.briefcaseId,
          description: TestiModelMetadata.Changesets[i].description,
          containingChanges: TestiModelMetadata.Changesets[i].containingChanges,
          id: TestiModelMetadata.Changesets[i].id,
          parentId: i == 0
            ? undefined
            : TestiModelMetadata.Changesets[i - 1].id,
          changesetFilePath: TestiModelMetadata.Changesets[i].changesetFilePath
        }
      });
      changesets.push(createdChangeset);
    }

    return {
      ...imodel,
      briefcase: {
        id: briefcase.briefcaseId,
        deviceName: briefcase.deviceName!
      },
      changesets: changesets
    }
  }

  private static async getTestiModel(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    projectId: string,
    imodelName: string
  }): Promise<TestiModelWithChangesets | undefined> {
    const existingiModel = await TestiModelProvider.findiModelByName(params);
    if (!existingiModel)
      return undefined;

    const imodelScopedRequestParams = { requestContext: params.requestContext, imodelId: existingiModel.id };
    const briefcase: Briefcase = (await toArray(params.imodelsClient.Briefcases.getRepresentationList(imodelScopedRequestParams)))[0];
    const changesets: Changeset[] = await toArray(params.imodelsClient.Changesets.getRepresentationList(imodelScopedRequestParams));

    return {
      id: existingiModel.id,
      name: existingiModel.name,
      description: existingiModel.description!,
      briefcase: {
        id: briefcase.briefcaseId,
        deviceName: briefcase.deviceName!
      },
      changesets
    }
  }

  private static async findiModelByName(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    projectId: string,
    imodelName: string
  }): Promise<iModel | undefined> {
    const imodels = params.imodelsClient.iModels.getRepresentationList({
      requestContext: params.requestContext,
      urlParams: {
        projectId: params.projectId
      }
    });

    for await (const imodel of imodels) {
      if (imodel.displayName === params.imodelName) {
        return imodel
      }
    }

    return undefined;
  }
}