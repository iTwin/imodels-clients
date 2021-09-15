/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient as AuthoringiModelsClient } from "@itwin/imodels-client-authoring";
import { iModel, iModelsClient as ManagementiModelsClient } from "@itwin/imodels-client-management";
import { TestContext } from "./TestContext";

export class TestSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestSetupFailed";
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function createEmptyiModel(params: {
  imodelsClient: ManagementiModelsClient | AuthoringiModelsClient,
  testContext: TestContext,
  imodelName: string
}): Promise<iModel> {
  return params.imodelsClient.iModels.createEmpty({
    requestContext: await params.testContext.getRequestContext(),
    imodelProperties: {
      projectId: await params.testContext.getProjectId(),
      name: params.imodelName
    }
  });
}

export async function cleanUpiModels(params: {
  imodelsClient: ManagementiModelsClient | AuthoringiModelsClient,
  testContext: TestContext
}): Promise<void> {
  const imodels = params.imodelsClient.iModels.getMinimalList({
    requestContext: await params.testContext.getRequestContext(),
    urlParams: {
      projectId: await params.testContext.getProjectId()
    }
  });

  for await (const imodel of imodels)
    if (params.testContext.doesiModelBelongToContext(imodel.displayName))
      await params.imodelsClient.iModels.delete({
        requestContext: await params.testContext.getRequestContext(),
        imodelId: imodel.id
      });
}

export async function findiModelWithName(params: {
  imodelsClient: ManagementiModelsClient | AuthoringiModelsClient,
  testContext: TestContext,
  expectediModelname: string
}): Promise<iModel> {
  const imodels = params.imodelsClient.iModels.getRepresentationList({
    requestContext: await params.testContext.getRequestContext(),
    urlParams: {
      projectId: await params.testContext.getProjectId()
    }
  });

  for await (const imodel of imodels)
    if (imodel.displayName === params.expectediModelname)
      return imodel;

  return undefined;
}
