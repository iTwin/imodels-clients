/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient } from "@itwin/imodels-client-management";

export function generateiModelNameWithPrefixes(params: {
  imodelName: string,
  prefixes: {
    package: string,
    testSuite?: string,
  }
}): string {
  return `${getCombinedPrefix(params)} ${params.imodelName}`;
};

export async function cleanUpiModelsWithPrefix(params: {
  imodelsClient: iModelsClient,
  requestContext: { accessToken: string },
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

