/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, CheckpointState } from "@itwin/imodels-client-authoring";
import { TestSetupError, sleep } from "../../CommonTestUtils";
import { Config } from "../../Config";
import { TestAuthenticationProvider } from "../auth/TestAuthenticationProvider";
import { EmptyiModelMetadata, BriefcaseMetadata, ChangesetMetadata, NamedVersionMetadata, TestiModelSetupContext, iModelWithChangesetsMetadata, ReusableiModelMetadata, iModelIdParam, iModelIdentificationByNameParams } from "./TestiModelInterfaces";
import { TestiModelFileProvider } from "./TestiModelFileProvider";

export class TestiModelCreator {
  public static namedVersionIndexes = [5, 10];

  private static readonly _imodelDescription = "Some description";
  private static readonly _briefcaseDeviceName = "Some device name";

  public static async createEmpty(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<EmptyiModelMetadata> {
    const imodel = await params.imodelsClient.iModels.createEmpty({
      requestContext: params.requestContext,
      imodelProperties: {
        projectId: params.projectId,
        name: params.imodelName,
        description: TestiModelCreator._imodelDescription
      }
    });

    return {
      id: imodel.id,
      name: imodel.name,
      description: imodel.description!
    };
  }

  public static async createWithChangesets(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<iModelWithChangesetsMetadata> {
    const imodel = await TestiModelCreator.createEmpty(params);
    const briefcase = await TestiModelCreator.acquireBriefcase({ ...params, imodelId: imodel.id });
    const changesets = await TestiModelCreator.uploadChangesets({ ...params, imodelId: imodel.id, briefcaseId: briefcase.id });

    return {
      ...imodel,
      briefcase,
      changesets
    };
  }

  public static async createWithChangesetsAndNamedVersions(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<ReusableiModelMetadata> {
    const imodel = await TestiModelCreator.createWithChangesets(params);

    // We use this specific user that is able to generate checkpoints
    // for named version creation to mimic production environment.
    const requestContextForUser2 = await TestAuthenticationProvider.getRequestContext(Config.get().testUsers.user2);
    const imodelScopedRequestParams = {
      imodelsClient: params.imodelsClient,
      requestContext: requestContextForUser2,
      imodelId: imodel.id
    };

    const namedVersions: NamedVersionMetadata[] = [];
    const checpointGenerationPromises: Promise<void>[] = [];
    for (const index of TestiModelCreator.namedVersionIndexes) {
      const namedVersion: NamedVersionMetadata = await TestiModelCreator.createNamedVersionOnChangesetIndex({
        ...imodelScopedRequestParams,
        changesetIndex: index
      })
      namedVersions.push(namedVersion);
      checpointGenerationPromises.push(
        TestiModelCreator.waitForNamedVersionCheckpointGenerated({ ...imodelScopedRequestParams, namedVersionId: namedVersion.id })
      );
    }

    await Promise.all(checpointGenerationPromises);

    return {
      ...imodel,
      namedVersions
    };
  }

  private static async acquireBriefcase(params: TestiModelSetupContext & iModelIdParam): Promise<BriefcaseMetadata> {
    const briefcase = await params.imodelsClient.Briefcases.acquire({
      requestContext: params.requestContext,
      imodelId: params.imodelId,
      briefcaseProperties: {
        deviceName: TestiModelCreator._briefcaseDeviceName
      }
    });

    return {
      id: briefcase.briefcaseId,
      deviceName: briefcase.deviceName!
    };
  }

  private static async uploadChangesets(params: TestiModelSetupContext & iModelIdParam & { briefcaseId: number }): Promise<ChangesetMetadata[]> {
    const changesets: Changeset[] = [];
    for (let i = 0; i < TestiModelFileProvider.Changesets.length; i++) {
      const createdChangeset = await params.imodelsClient.Changesets.create({
        requestContext: params.requestContext,
        imodelId: params.imodelId,
        changesetProperties: {
          briefcaseId: params.briefcaseId,
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

    return changesets;
  }

  private static async createNamedVersionOnChangesetIndex(params: TestiModelSetupContext & iModelIdParam & { changesetIndex: number })
    : Promise<NamedVersionMetadata> {
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
    };
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

    throw new TestSetupError("Timed out while waiting for checkpoint generation to complete.");
  }
}
