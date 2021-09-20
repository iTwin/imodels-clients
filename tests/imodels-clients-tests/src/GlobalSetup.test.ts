/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModel, iModelsClient, RequestContext } from "@itwin/imodels-client-authoring";
import { cleanUpiModels, findiModelWithName, TestSetupError } from "./common/CommonTestUtils";
import { Config } from "./common/Config";
import { Constants } from "./common/Constants";
import { TestAuthenticationProvider } from "./common/TestAuthenticationProvider";
import { TestClientOptions } from "./common/TestClientOptions";
import { TestiModelGroup } from "./common/TestiModelGroup";
import { TestiModelMetadata } from "./common/TestiModelMetadata";
import { TestProjectProvider } from "./common/TestProjectProvider";

before(async () => {
  const imodelsClient = new iModelsClient(new TestClientOptions());
  const requestContext = await TestAuthenticationProvider.getRequestContext();
  const projectId = await TestProjectProvider.getProjectId();
  const testiModelGroup = new TestiModelGroup({ labels: { package: Constants.PackagePrefix } });

  await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });

  const existingiModel = await findiModelWithName({ imodelsClient, requestContext, projectId, expectediModelname: Config.get().testiModelName });
  if (!existingiModel)
    await createDefaultTestiModel({ imodelsClient, requestContext, projectId, imodelName: Config.get().testiModelName });
});

after(async () => {
  const imodelsClient = new iModelsClient(new TestClientOptions());
  const requestContext = await TestAuthenticationProvider.getRequestContext();
  const projectId = await TestProjectProvider.getProjectId();
  const testiModelGroup = new TestiModelGroup({ labels: { package: Constants.PackagePrefix } });

  await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });
});

async function createDefaultTestiModel(params: {
  imodelsClient: iModelsClient,
  requestContext: RequestContext,
  projectId: string,
  imodelName: string
}): Promise<iModel> {
  const imodel = await params.imodelsClient.iModels.createFromBaseline({
    requestContext: params.requestContext,
    imodelProperties: {
      projectId: params.projectId,
      name: params.imodelName
    },
    baselineFileProperties: {
      path: TestiModelMetadata.iModel.baselineFilePath
    }
  });

  const briefcase = await params.imodelsClient.Briefcases.acquire({
    requestContext: params.requestContext,
    imodelId: imodel.id,
    briefcaseProperties: {
      deviceName: TestiModelMetadata.Briefcase.deviceName
    }
  });

  // Briefcase id is generated by the iModels API but usually the first briefcase id has a value of 2.
  // We assert the expected value here to be sure so that later we could use it in read operation test asserts.
  if (briefcase.briefcaseId !== TestiModelMetadata.Briefcase.id)
    throw new TestSetupError(`Unexpected briefcaseId: expected the default iModel briefcase to equal ${TestiModelMetadata.Briefcase.id}`);

  for (let i = 0; i < TestiModelMetadata.Changesets.length; i++) {
    await params.imodelsClient.Changesets.create({
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
  }

  return imodel;
}
