/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient } from "@itwin/imodels-client-management";

export async function cleanUpiModelsAfterTestRun(
  imodelPrefixForTestSuite: string,
  imodelsClient: iModelsClient,
  requestContext: { accessToken: string },
  projectId: string
): Promise<void> {
  const imodels = imodelsClient.iModels.getMinimalList({ requestContext: requestContext, urlParams: { projectId } });
  for await (const imodel of imodels)
    if (imodel.displayName.startsWith(imodelPrefixForTestSuite))
      await imodelsClient.iModels.delete({ requestContext, imodelId: imodel.id });
}