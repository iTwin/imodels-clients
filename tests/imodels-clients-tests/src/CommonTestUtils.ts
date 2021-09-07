/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient as AuthoringiModelsClient } from "@itwin/imodels-client-authoring";
import { iModel, iModelsClient as ManagementiModelsClient } from "@itwin/imodels-client-management";
import { TestSuiteContext } from "./TestSuiteContext";

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function createEmptyiModel(params: {
  imodelsClient: ManagementiModelsClient | AuthoringiModelsClient,
  testContext: TestSuiteContext,
  imodelName: string
}): Promise<iModel> {
  return params.imodelsClient.iModels.createEmpty({
    requestContext: params.testContext.RequestContext,
    imodelProperties: {
      projectId: params.testContext.ProjectId,
      name: params.testContext.getPrefixediModelName("Sample iModel from baseline")
    }
  });
}

export async function cleanUpiModels(params: {
  imodelsClient: ManagementiModelsClient | AuthoringiModelsClient,
  testContext: TestSuiteContext
}): Promise<void> {
  const imodels = params.imodelsClient.iModels.getMinimalList({
    requestContext: params.testContext.RequestContext,
    urlParams: {
      projectId: params.testContext.ProjectId
    }
  });

  for await (const imodel of imodels)
    if (params.testContext.doesiModelBelongToSuite(imodel.displayName))
      await params.imodelsClient.iModels.delete({
        requestContext: params.testContext.RequestContext,
        imodelId: imodel.id
      });
}