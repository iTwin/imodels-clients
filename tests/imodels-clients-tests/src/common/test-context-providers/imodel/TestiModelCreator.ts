/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset, CheckpointState } from "@itwin/imodels-client-authoring";
import { TestSetupError, sleep } from "../../CommonTestUtils";
import { Config } from "../../Config";
import { TestAuthenticationProvider } from "../auth/TestAuthenticationProvider";
import { TestiModelFileProvider } from "./TestiModelFileProvider";
import { BriefcaseMetadata, NamedVersionMetadata, ReusableiModelMetadata, TestiModelSetupContext, iModelIdParam, iModelIdentificationByNameParams, iModelMetadata } from "./TestiModelInterfaces";

export class TestiModelCreator {
  public static namedVersionIndexes = [5, 10];

  private static readonly _imodelDescription = "Some description";
  private static readonly _briefcaseDeviceName = "Some device name";

  public static async createEmpty(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<iModelMetadata> {
    const imodel = await params.imodelsClient.iModels.createEmpty({
      authorization: params.authorization,
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

  public static async createEmptyAndUploadChangesets(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<iModelMetadata> {
    const imodel = await TestiModelCreator.createEmpty(params);
    await TestiModelCreator.uploadChangesets({ ...params, imodelId: imodel.id });

    return imodel;
  }

  public static async createReusable(params: TestiModelSetupContext & iModelIdentificationByNameParams): Promise<ReusableiModelMetadata> {
    const imodel = await TestiModelCreator.createEmpty(params);
    const briefcase = await TestiModelCreator.uploadChangesets({ ...params, imodelId: imodel.id });

    // We use this specific user that is able to generate checkpoints
    // for named version creation to mimic production environment.
    const authorizationForUser2 = await TestAuthenticationProvider.getRequestContext(Config.get().testUsers.admin2FullyFeatured);
    const imodelScopedRequestParams = {
      imodelsClient: params.imodelsClient,
      authorization: authorizationForUser2,
      imodelId: imodel.id
    };

    const namedVersions: NamedVersionMetadata[] = [];
    const checkpointGenerationPromises: Promise<void>[] = [];
    for (const index of TestiModelCreator.namedVersionIndexes) {
      const namedVersion: NamedVersionMetadata = await TestiModelCreator.createNamedVersionOnChangesetIndex({
        ...imodelScopedRequestParams,
        changesetIndex: index
      });
      namedVersions.push(namedVersion);
      checkpointGenerationPromises.push(
        TestiModelCreator.waitForNamedVersionCheckpointGenerated({ ...imodelScopedRequestParams, namedVersionId: namedVersion.id })
      );
    }

    await Promise.all(checkpointGenerationPromises);

    return {
      ...imodel,
      briefcase,
      namedVersions
    };
  }

  public static async uploadChangesets(params: TestiModelSetupContext & iModelIdParam): Promise<BriefcaseMetadata> {
    const briefcase = await TestiModelCreator.acquireBriefcase(params);

    const changesets: Changeset[] = [];
    for (let i = 0; i < TestiModelFileProvider.changesets.length; i++) {
      const createdChangeset = await params.imodelsClient.Changesets.create({
        authorization: params.authorization,
        imodelId: params.imodelId,
        changesetProperties: {
          briefcaseId: briefcase.id,
          description: TestiModelFileProvider.changesets[i].description,
          containingChanges: TestiModelFileProvider.changesets[i].containingChanges,
          id: TestiModelFileProvider.changesets[i].id,
          parentId: i == 0
            ? undefined
            : TestiModelFileProvider.changesets[i - 1].id,
          changesetFilePath: TestiModelFileProvider.changesets[i].filePath
        }
      });
      changesets.push(createdChangeset);
    }

    return briefcase;
  }

  private static async acquireBriefcase(params: TestiModelSetupContext & iModelIdParam): Promise<BriefcaseMetadata> {
    const briefcase = await params.imodelsClient.Briefcases.acquire({
      authorization: params.authorization,
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

  private static async createNamedVersionOnChangesetIndex(params: TestiModelSetupContext & iModelIdParam & { changesetIndex: number })
    : Promise<NamedVersionMetadata> {
    const changesetMetadata = TestiModelFileProvider.changesets[params.changesetIndex - 1];
    const namedVersion = await params.imodelsClient.NamedVersions.create({
      authorization: params.authorization,
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

      if (checkpoint.state === CheckpointState.Successful && checkpoint._links?.download !== undefined && checkpoint.containerAccessInfo !== null)
        return;

      if (checkpoint.state !== CheckpointState.Scheduled && checkpoint.state !== CheckpointState.Successful)
        throw new TestSetupError(`Checkpoint generation failed with state: ${checkpoint.state}.`);

      await sleep(sleepPeriodInMs);
    }

    throw new TestSetupError("Timed out while waiting for checkpoint generation to complete.");
  }
}
