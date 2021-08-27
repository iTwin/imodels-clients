/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient as iModelsClient_Authoring, iModelsClientOptions as iModelsClientOptions_Authoring } from "@itwin/imodels-client-authoring";
import { iModelsClient as iModelsClient_Management, iModelState, RequestContext } from "@itwin/imodels-client-management";

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getTestiModelsClientConfig(): iModelsClientOptions_Authoring {
  return {
    backendOptions: {
      baseUri: "" // TODO: read config
    }
  };
}

export function getTestProjectId(): string {
  return ""; // TODO: read config
}

export function getAuthorizedRequestContext(): RequestContext {
  return {
    authorization: {
      scheme: "", // TODO: read config
      token: "" // TODO: read config
    }
  };
}

export function generateiModelNameWithPrefixes(params: {
  imodelName: string,
  prefixes: {
    package: string,
    testSuite?: string,
  }
}): string {
  return `${getCombinedPrefix(params)} ${params.imodelName}`;
}

export async function cleanUpiModelsWithPrefix(params: {
  imodelsClient: iModelsClient_Management | iModelsClient_Authoring,
  requestContext: RequestContext,
  projectId: string,
  prefixes: {
    package: string,
    testSuite?: string,
  }
}): Promise<void> {
  const imodels = params.imodelsClient.iModels.getMinimalList({ requestContext: params.requestContext, urlParams: { projectId: params.projectId } });
  for await (const imodel of imodels)
    if (imodel.displayName.startsWith(getCombinedPrefix(params)))
      await params.imodelsClient.iModels.delete({ requestContext: params.requestContext, imodelId: imodel.id });
}

export async function waitForiModelInitialization(params: {
  imodelsClient: iModelsClient_Management | iModelsClient_Authoring,
  requestContext: RequestContext,
  imodelId: string,
}): Promise<void> {
  const sleepPeriodInMs = 500;
  const totalWaitTimeInMs = 30 * 1000;
  let retryCount = totalWaitTimeInMs / sleepPeriodInMs;

  let imodelState = iModelState.NotInitialized;
  while (imodelState !== iModelState.Initialized && retryCount-- > 0) {
    imodelState = (await params.imodelsClient.iModels.getById(params)).state;
    await sleep(sleepPeriodInMs);
  }

  if (imodelState !== iModelState.Initialized)
    throw new Error("iModel not initialized.");
}

function getCombinedPrefix(params: {
  prefixes: {
    package: string,
    testSuite?: string,
  }
}): string {
  let combinedPrefix = params.prefixes.package;
  if (params.prefixes.testSuite)
    combinedPrefix += params.prefixes.testSuite;
  return combinedPrefix;
}
