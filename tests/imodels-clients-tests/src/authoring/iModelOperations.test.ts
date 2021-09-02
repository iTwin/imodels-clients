/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModel, iModelsClient, RequestContext } from "@itwin/imodels-client-authoring";
import { assertiModel } from "../AssertionUtils";
import { cleanUpiModelsWithPrefix, generateiModelNameWithPrefixes, getAuthorizedRequestContext, getTestiModelsClientConfig, getTestProjectId } from "../CommonTestUtils";
import { Constants } from "../Constants";

describe("[Authoring] iModelsClient", () => {
  let requestContext: RequestContext;
  let projectId: string;
  let imodelsClient: iModelsClient;

  const imodelsPrefixForTestSuite = "[Authoring][iModelOperations]";

  before(async () => {
    requestContext = await getAuthorizedRequestContext();
    projectId = getTestProjectId();
    imodelsClient = new iModelsClient(getTestiModelsClientConfig());
  });

  after(async () => {
    return cleanUpiModelsWithPrefix({
      imodelsClient,
      requestContext,
      projectId,
      prefixes: {
        package: Constants.PackagePrefix,
        testSuite: imodelsPrefixForTestSuite
      }
    });
  });

  function getiModelName(name: string): string {
    return generateiModelNameWithPrefixes({
      imodelName: name,
      prefixes: {
        package: Constants.PackagePrefix,
        testSuite: imodelsPrefixForTestSuite
      }
    });
  }

  it("should create an iModel from baseline", async () => {
    // Arrange
    const imodelCreationParams = {
      requestContext,
      imodelProperties: {
        projectId: projectId,
        name: getiModelName("Sample iModel from baseline")
      },
      baselineFileProperties: {
        path: `${Constants.AssetsPath}f3e3d446-edc4-4cb0-a80d-dd2ab3e32b0d.bim`
      }
    };

    // Act
    const imodel: iModel = await imodelsClient.iModels.createFromBaseline(imodelCreationParams);

    // Assert
    assertiModel({
      actualiModel: imodel,
      expectediModelProperties: { ...imodelCreationParams.imodelProperties }
    });
  });
});
