import { Briefcase, Changeset, CheckpointState, iModel, iModelsClient, NamedVersion, RequestContext } from "@itwin/imodels-client-authoring";
import { Config, TestAuthenticationProvider, TestiModelMetadata } from ".";
import { sleep, TestSetupError, toArray } from "./CommonTestUtils";

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

export interface TestiModelNamedVersion {
  id: string;
  changesetId: string;
  changesetIndex: number;
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

export interface TestiModelWithChangesetsAndNamedVersions extends TestiModelWithChangesets {
  namedVersions: TestiModelNamedVersion[];
}

export class TestiModelProvider {
  private static _reusableiModel: TestiModelWithChangesetsAndNamedVersions | undefined;

  public static async getOrCreateReusable(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    projectId: string
  }): Promise<TestiModelWithChangesetsAndNamedVersions> {
    if (TestiModelProvider._reusableiModel)
      return TestiModelProvider._reusableiModel;

    const paramsWithiModelName = {
      ...params,
      imodelName: Config.get().testiModelName
    };

    TestiModelProvider._reusableiModel =
      await TestiModelProvider.queryWithRelatedData(paramsWithiModelName) ??
      await TestiModelProvider.createWithChangesetsAndNamedVersions(paramsWithiModelName);

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

  public static async createWithChangesetsAndNamedVersions(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    projectId: string,
    imodelName: string
  }): Promise<TestiModelWithChangesetsAndNamedVersions> {

    const imodel = await TestiModelProvider.createWithChangesets(params);

    // We use this specific user for named version creation to mimic production
    // environment since this user is able to generate checkpoints.
    const requestContextForUser2 = await TestAuthenticationProvider.getRequestContext(Config.get().testUsers.user2);
    const imodelScopedRequestParams = {
      imodelsClient: params.imodelsClient,
      requestContext: requestContextForUser2,
      imodelId: imodel.id
    };
    const testNamedVersion1 = await TestiModelProvider.createNamedVersionOnChangesetIndex({ ...imodelScopedRequestParams, changesetIndex: 5 });
    const testNamedVersion2 = await TestiModelProvider.createNamedVersionOnChangesetIndex({ ...imodelScopedRequestParams, changesetIndex: 10 });

    await Promise.all([
      TestiModelProvider.waitForNamedVersionCheckpointGenerated({ ...imodelScopedRequestParams, namedVersionId: testNamedVersion1.id }),
      TestiModelProvider.waitForNamedVersionCheckpointGenerated({ ...imodelScopedRequestParams, namedVersionId: testNamedVersion2.id })
    ]);

    return {
      ...imodel,
      namedVersions: [testNamedVersion1, testNamedVersion2]
    }
  }

  private static async createNamedVersionOnChangesetIndex(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    imodelId: string,
    changesetIndex: number
  }): Promise<TestiModelNamedVersion> {
    const changesetMetadata = TestiModelMetadata.Changesets[params.changesetIndex - 1];
    const namedVersion = await params.imodelsClient.NamedVersions.create({
      requestContext: params.requestContext,
      imodelId: params.imodelId,
      namedVersionProperties: {
        name: `Named version ${changesetMetadata.index}`,
        changesetId: changesetMetadata.id
      }
    });
    return {
      id: namedVersion.id,
      changesetId: changesetMetadata.id,
      changesetIndex: changesetMetadata.index
    }
  }

  private static async queryWithRelatedData(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    projectId: string,
    imodelName: string
  }): Promise<TestiModelWithChangesetsAndNamedVersions | undefined> {
    const existingiModel = await TestiModelProvider.findiModelByName(params);
    if (!existingiModel)
      return undefined;

    const imodelScopedRequestParams = {
      requestContext: params.requestContext,
      imodelId: existingiModel.id
    };
    const briefcase: Briefcase = (await toArray(params.imodelsClient.Briefcases.getRepresentationList(imodelScopedRequestParams)))[0];
    const changesets: Changeset[] = await toArray(params.imodelsClient.Changesets.getRepresentationList(imodelScopedRequestParams));

    const namedVersions: NamedVersion[] = await toArray(params.imodelsClient.NamedVersions.getRepresentationList(imodelScopedRequestParams));
    const mappedNamedVersions = namedVersions
      .map(nv => ({
        id: nv.id,
        changesetId: nv.changesetId!,
        changesetIndex: TestiModelMetadata.Changesets.find(cs => cs.id === nv.changesetId)!.index
      }))
      .sort((nv1, nv2) => nv1.changesetIndex - nv2.changesetIndex);

    return {
      id: existingiModel.id,
      name: existingiModel.name,
      description: existingiModel.description!,
      briefcase: {
        id: briefcase.briefcaseId,
        deviceName: briefcase.deviceName!
      },
      changesets,
      namedVersions: mappedNamedVersions
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

  private static async waitForNamedVersionCheckpointGenerated(params: {
    imodelsClient: iModelsClient,
    requestContext: RequestContext,
    imodelId: string,
    namedVersionId: string
  }): Promise<void> {
    const sleepPeriodInMs = 1000;
    const timeOutInMs = 5 * 60 * 1000;
    for (let retries = timeOutInMs / sleepPeriodInMs; retries > 0; --retries) {
      const checkpoint = await params.imodelsClient.Checkpoints.getByNamedVersionId(params);

      if (checkpoint.state === CheckpointState.Successful)
        return;

      if (checkpoint.state !== CheckpointState.Scheduled)
        throw new TestSetupError(`Checkpoint generation failed with state: ${checkpoint.state}.`);

      await sleep(sleepPeriodInMs);
    }

    throw new TestSetupError(`Timed out while waiting for checkpoint generation to complete.`);
  }
}