/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CreateChangesetParams, iModel, iModelsClient, RequestContext } from "@itwin/imodels-client-authoring";
import { expect } from "chai";
import { cleanUpiModelsWithPrefix, generateiModelNameWithPrefixes, getAuthorizedRequestContext, getTestiModelsClientConfig, getTestProjectId } from "../CommonTestUtils";
import { Constants } from "../Constants";
import { TestiModelDataReader } from "../TestiModelDataReader";

describe("[Authoring] ChangesetOperations", () => {
  let requestContext: RequestContext;
  let projectId: string;
  let imodelsClient: iModelsClient;
  let testiModel: iModel;
  let testiModelDataReader: TestiModelDataReader;

  const imodelsPrefixForTestSuite = "[Authoring][ChangesetOperations]";

  before(async () => {
    requestContext = await getAuthorizedRequestContext();
    projectId = getTestProjectId();
    imodelsClient = new iModelsClient(getTestiModelsClientConfig());

    testiModel = await imodelsClient.iModels.createFromBaseline({
      requestContext,
      imodelProperties: {
        projectId: projectId,
        name: getiModelName("Sample iModel from baseline")
      },
      baselineFileProperties: {
        path: `${Constants.AssetsPath}test-imodel/f3e3d446-edc4-4cb0-a80d-dd2ab3e32b0d.bim`
      }
    });

    testiModelDataReader = new TestiModelDataReader(`${Constants.AssetsPath}test-imodel`);
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

  function getiModelName(name: string): string { // todo: kinda duplicate
    return generateiModelNameWithPrefixes({
      imodelName: name,
      prefixes: {
        package: Constants.PackagePrefix,
        testSuite: imodelsPrefixForTestSuite
      }
    });
  }

  it("should be able to create changeset", async () => {
    // Arrange
    const changesetMetadata = testiModelDataReader.Changesets[0];

    const changesetCreationParams: CreateChangesetParams = {
      requestContext,
      imodelId: testiModel.id,
      changesetProperties: {
        briefcaseId: 1,
        id: changesetMetadata.id,
        changesetFilePath: changesetMetadata.parentId
      }
    };

    // Act
    const changeset = await imodelsClient.Changesets.create(changesetCreationParams);

    // Assert
    expect(changeset).to.not.be.undefined;
  });
});
