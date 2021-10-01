/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { iModelsClient as AuthoringiModelsClient } from "@itwin/imodels-client-authoring";
import { CreateNamedVersionParams, GetNamedVersionListParams, NamedVersion, NamedVersionState, RequestContext, UpdateNamedVersionParams, iModel, iModelsClient } from "@itwin/imodels-client-management";
import { Constants, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestiModelGroup, TestiModelMetadata, assertCollection, assertNamedVersion, cleanUpiModels, createDefaultTestiModel } from "../common";

describe("[Management] NamedVersionOperations", () => {
  let imodelsClient: iModelsClient;
  let requestContext: RequestContext;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;
  let testiModel: iModel;

  // Since we reuse the same iModel to create several named versions we use this variable to
  // track the index of the next available changeset to create a new named version on.
  let changesetWithoutNamedVersion = 1;

  // We create several named versions in setup to have some entities for collection
  // query tests and persist them to use in entity update tests.
  const namedVersionCountCreatedInSetup = 3;
  const namedVersionsCreatedInSetup: NamedVersion[] = [];
  let updatedNamedVersions = 0;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    requestContext = await TestAuthenticationProvider.getRequestContext();
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "ManagementNamedVersionOperations"
      }
    });

    testiModel = await createDefaultTestiModel({
      imodelsClient: new AuthoringiModelsClient(new TestClientOptions()),
      requestContext,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for creating Named Versions")
    });

    for (let i = 0; i < namedVersionCountCreatedInSetup; i++) {
      namedVersionsCreatedInSetup.push(await imodelsClient.NamedVersions.create({
        requestContext,
        imodelId: testiModel.id,
        namedVersionProperties: {
          name: `Milestone ${changesetWithoutNamedVersion}`,
          description: `Description for milestone ${changesetWithoutNamedVersion}`,
          changesetId: TestiModelMetadata.Changesets[changesetWithoutNamedVersion - 1].id
        }
      }));
      changesetWithoutNamedVersion++;
    }
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, requestContext, projectId, testiModelGroup });
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetNamedVersionListParams) => imodelsClient.NamedVersions.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetNamedVersionListParams) => imodelsClient.NamedVersions.getRepresentationList(params)
    }
  ].forEach(testCase => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getNamedVersionListParams: GetNamedVersionListParams = {
        requestContext,
        imodelId: testiModel.id,
        urlParams: {
          $top: 2
        }
      };

      // Act
      const namedVersions = await testCase.functionUnderTest(getNamedVersionListParams);

      // Assert
      assertCollection({
        asyncIterable: namedVersions,
        isEntityCountCorrect: count => count >= namedVersionCountCreatedInSetup
      });
    });
  });

  it("should create named version on baseline", async () => {
    // Arrange
    const createNamedVersionParams: CreateNamedVersionParams = {
      requestContext,
      imodelId: testiModel.id,
      namedVersionProperties: {
        name: "Named Version on baseline",
        description: "Some description for Named Version on baseline"
      }
    };

    // Act
    const namedVersion = await imodelsClient.NamedVersions.create(createNamedVersionParams);

    // Assert
    assertNamedVersion({
      actualNamedVersion: namedVersion,
      expectedNamedVersionProperties: createNamedVersionParams.namedVersionProperties
    });
  });

  it("should create named version on a specific changeset", async () => {
    // Arrange
    const createNamedVersionParams: CreateNamedVersionParams = {
      requestContext,
      imodelId: testiModel.id,
      namedVersionProperties: {
        name: `Named Version ${changesetWithoutNamedVersion}`,
        description: `Some description for Named Version ${changesetWithoutNamedVersion}`,
        changesetId: TestiModelMetadata.Changesets[changesetWithoutNamedVersion - 1].id
      }
    };
    changesetWithoutNamedVersion++;

    // Act
    const namedVersion = await imodelsClient.NamedVersions.create(createNamedVersionParams);

    // Assert
    assertNamedVersion({
      actualNamedVersion: namedVersion,
      expectedNamedVersionProperties: createNamedVersionParams.namedVersionProperties
    });
  });

  it("should update named version name", async () => {
    // Arrange
    const namedVersionToUpdate = namedVersionsCreatedInSetup[updatedNamedVersions++];
    const newNamedVersionName = "Some other name";
    const updateNamedVersionParams: UpdateNamedVersionParams = {
      requestContext,
      imodelId: testiModel.id,
      namedVersionId: namedVersionToUpdate.id,
      namedVersionProperties: {
        name: newNamedVersionName
      }
    };

    // Act
    const updatedNamedVersion = await imodelsClient.NamedVersions.update(updateNamedVersionParams);

    // Assert
    expect(updatedNamedVersion.name).to.equal(newNamedVersionName);
    expect(updatedNamedVersion.description).to.equal(namedVersionToUpdate.description);
    expect(updatedNamedVersion.state).to.equal(namedVersionToUpdate.state);
  });

  it("should update named version description", async () => {
    // Arrange
    const namedVersionToUpdate = namedVersionsCreatedInSetup[updatedNamedVersions++];
    const newNamedVersionDescription = "Some other description";
    const updateNamedVersionParams: UpdateNamedVersionParams = {
      requestContext,
      imodelId: testiModel.id,
      namedVersionId: namedVersionToUpdate.id,
      namedVersionProperties: {
        description: newNamedVersionDescription
      }
    };

    // Act
    const updatedNamedVersion = await imodelsClient.NamedVersions.update(updateNamedVersionParams);

    // Assert
    expect(updatedNamedVersion.name).to.equal(namedVersionToUpdate.name);
    expect(updatedNamedVersion.description).to.equal(newNamedVersionDescription);
    expect(updatedNamedVersion.state).to.equal(namedVersionToUpdate.state);
  });

  it("should update named version state", async () => {
    // Arrange
    const namedVersionToUpdate = namedVersionsCreatedInSetup[updatedNamedVersions++];
    const newNamedVersionState = NamedVersionState.Hidden;
    const updateNamedVersionParams: UpdateNamedVersionParams = {
      requestContext,
      imodelId: testiModel.id,
      namedVersionId: namedVersionToUpdate.id,
      namedVersionProperties: {
        state: newNamedVersionState
      }
    };

    // Act
    const updatedNamedVersion = await imodelsClient.NamedVersions.update(updateNamedVersionParams);

    // Assert
    expect(updatedNamedVersion.name).to.equal(namedVersionToUpdate.name);
    expect(updatedNamedVersion.description).to.equal(namedVersionToUpdate.description);
    expect(updatedNamedVersion.state).to.equal(newNamedVersionState);
  });
});
