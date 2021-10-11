/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestSetupError, TestiModelGroup, cleanUpiModels, createDefaultTestiModel, findiModelWithName } from "./common";

before(async () => {
  const imodelsClient = new iModelsClient(new TestClientOptions());
  const requestContext = await TestAuthenticationProvider.getRequestContext();
  const projectId = await TestProjectProvider.getProjectId();
  const testiModelGroup = new TestiModelGroup({ labels: { package: Constants.PackagePrefix } });

  await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });

  try {
    await findiModelWithName({ imodelsClient, requestContext, projectId, expectediModelname: Config.get().testiModelName });
  } catch (e) {
    if (e instanceof TestSetupError) {
      await createDefaultTestiModel({ imodelsClient, requestContext, projectId, imodelName: Config.get().testiModelName });
      return;
    }
    throw e;
  }
});

after(async () => {
  const imodelsClient = new iModelsClient(new TestClientOptions());
  const requestContext = await TestAuthenticationProvider.getRequestContext();
  const projectId = await TestProjectProvider.getProjectId();
  const testiModelGroup = new TestiModelGroup({ labels: { package: Constants.PackagePrefix } });

  await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });
});


