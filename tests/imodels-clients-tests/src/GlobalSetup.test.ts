/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestiModelGroup, cleanUpiModels, findiModelWithName, createDefaultTestiModel } from "./common";

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


