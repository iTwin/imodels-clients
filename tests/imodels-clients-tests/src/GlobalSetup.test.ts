/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModel, iModelsClient } from "@itwin/imodels-client-authoring";
import { cleanUpiModels, findiModelWithName, TestSetupError } from "./CommonTestUtils";
import { Config } from "./Config";
import { Constants } from "./Constants";
import { TestiModelMetadata } from "./TestiModelMetadata";
import { TestContext } from "./TestContext";

before(async () => {
  const testContext = new TestContext({ labels: { package: Constants.PackagePrefix } });
  const imodelsClient = new iModelsClient(testContext.ClientConfig);
  const existingiModel = await findiModelWithName({ imodelsClient, testContext, expectediModelname: Config.get().DefaultiModelName });
  if (!existingiModel)
    await createDefaultTestiModel({ imodelsClient, testContext, imodelName: Config.get().DefaultiModelName });
});

after(async () => {
  const testContext = new TestContext({ labels: { package: Constants.PackagePrefix } });
  const imodelsClient = new iModelsClient(testContext.ClientConfig);
  cleanUpiModels({ imodelsClient, testContext });
});

async function createDefaultTestiModel(params: {
  imodelsClient: iModelsClient,
  testContext: TestContext,
  imodelName: string
}): Promise<iModel> {
  const imodel = await params.imodelsClient.iModels.createFromBaseline({
    requestContext: params.testContext.RequestContext,
    imodelProperties: {
      projectId: params.testContext.ProjectId,
      name: params.imodelName
    },
    baselineFileProperties: {
      path: TestiModelMetadata.iModel.baselineFilePath
    }
  });

  const briefcase = await params.imodelsClient.Briefcases.acquire({
    requestContext: params.testContext.RequestContext,
    imodelId: imodel.id
  });
  if (briefcase.briefcaseId !== TestiModelMetadata.Briefcase.id)
    throw new TestSetupError(`Unexpected briefcaseId: expected the default iModel briefcase to equal ${TestiModelMetadata.Briefcase.id}`);

  for (let i = 0; i < TestiModelMetadata.Changesets.length; i++) {
    await params.imodelsClient.Changesets.create({
      requestContext: params.testContext.RequestContext,
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
