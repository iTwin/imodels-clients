import { Changeset, CheckpointState, iModel, iModelsClient, NamedVersion, RequestContext } from "@itwin/imodels-client-authoring";
import { Config, TestAuthenticationProvider, TestiModelFileProvider } from "..";
import { sleep, TestSetupError, toArray } from "../CommonTestUtils";

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

export interface TestiModelSetupContext {
  imodelsClient: iModelsClient;
  requestContext: RequestContext;
}

export interface iModelIdentificationByNameParams {
  projectId: string;
  imodelName: string;
}

interface iModelIdParam {
  imodelId: string;
}

export class TestiModelProvider {
  private static _reusableiModel: TestiModelWithChangesetsAndNamedVersions | undefined;

  public static async getOrCreateReusable(params: TestiModelSetupContext & { projectId: string }): Promise<TestiModelWithChangesetsAndNamedVersions> {
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

  public static async createEmpty(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<EmptyTestiModel> {
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

  public static async createWithChangesets(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<TestiModelWithChangesets> {
    const imodel = await TestiModelProvider.createEmpty(params);

    const briefcase = await params.imodelsClient.Briefcases.acquire({
      requestContext: params.requestContext,
      imodelId: imodel.id,
      briefcaseProperties: {
        deviceName: "Some device name"
      }
    });

    const changesets: Changeset[] = [];
    for (let i = 0; i < TestiModelFileProvider.Changesets.length; i++) {
      const createdChangeset = await params.imodelsClient.Changesets.create({
        requestContext: params.requestContext,
        imodelId: imodel.id,
        changesetProperties: {
          briefcaseId: briefcase.briefcaseId,
          description: TestiModelFileProvider.Changesets[i].description,
          containingChanges: TestiModelFileProvider.Changesets[i].containingChanges,
          id: TestiModelFileProvider.Changesets[i].id,
          parentId: i == 0
            ? undefined
            : TestiModelFileProvider.Changesets[i - 1].id,
          changesetFilePath: TestiModelFileProvider.Changesets[i].filePath
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

  public static async createWithChangesetsAndNamedVersions(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<TestiModelWithChangesetsAndNamedVersions> {
    const imodel = await TestiModelProvider.createWithChangesets(params);

    // We use this specific user that is able to generate checkpoints
    // for named version creation to mimic production environment.
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

  private static async createNamedVersionOnChangesetIndex(params: TestiModelSetupContext & iModelIdParam & { changesetIndex: number })
    : Promise<TestiModelNamedVersion> {
    const changesetMetadata = TestiModelFileProvider.Changesets[params.changesetIndex - 1];
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

  private static async queryWithRelatedData(params: TestiModelSetupContext & iModelIdentificationByNameParams)
    : Promise<TestiModelWithChangesetsAndNamedVersions | undefined> {
    const imodel = await TestiModelProvider.findiModelByName(params);
    if (!imodel)
      return undefined;

    const paramsWithiModelId = { ...params, imodelId: imodel.id };
    const briefcase = await TestiModelProvider.queryAndValidateBriefcase(paramsWithiModelId);
    const changesets = await TestiModelProvider.queryAndValidateChangesets(paramsWithiModelId);
    const namedVersions = await TestiModelProvider.queryAndValidateNamedVersions(paramsWithiModelId);

    return {
      id: imodel.id,
      name: imodel.name,
      description: imodel.description!,
      briefcase,
      changesets,
      namedVersions
    }
  }

  private static async queryAndValidateBriefcase(params: TestiModelSetupContext & iModelIdParam): Promise<TestiModelBriefcase> {
    const briefcases = await toArray(params.imodelsClient.Briefcases.getRepresentationList(params));
    if (briefcases.length !== 1)
      throw new TestSetupError("");

    return { id: briefcases[0].briefcaseId, deviceName: briefcases[0].deviceName! };
  }

  private static async queryAndValidateChangesets(params: TestiModelSetupContext & iModelIdParam): Promise<TestiModelChangeset[]> {
    const changesets = await toArray(params.imodelsClient.Changesets.getRepresentationList(params));
    if (changesets.length !== TestiModelFileProvider.Changesets.length)
      throw new TestSetupError("");

    return changesets;
  }

  private static async queryAndValidateNamedVersions(params: TestiModelSetupContext & iModelIdParam): Promise<TestiModelNamedVersion[]> {
    const namedVersions: NamedVersion[] = await toArray(params.imodelsClient.NamedVersions.getRepresentationList(params));
    const mappedNamedVersions = namedVersions
      .map(nv => ({
        id: nv.id,
        changesetId: nv.changesetId!,
        changesetIndex: TestiModelFileProvider.Changesets.find(cs => cs.id === nv.changesetId)!.index
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

  private static async waitForNamedVersionCheckpointGenerated(params: TestiModelSetupContext & iModelIdParam & { namedVersionId: string }): Promise<void> {
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