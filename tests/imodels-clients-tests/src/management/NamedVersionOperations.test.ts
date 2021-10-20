/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { iModelsClient as AuthoringiModelsClient } from "@itwin/imodels-client-authoring";
import { AuthorizationCallback, CreateNamedVersionParams, GetNamedVersionListParams, NamedVersion, NamedVersionState, UpdateNamedVersionParams, iModelScopedOperationParams, iModelsClient } from "@itwin/imodels-client-management";
import { Config, Constants, TestAuthenticationProvider, TestClientOptions, TestProjectProvider, TestSetupError, TestiModelCreator, TestiModelFileProvider, TestiModelGroup, assertCollection, assertNamedVersion, cleanUpiModels, iModelMetadata } from "../common";

describe("[Management] NamedVersionOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;
  let testiModel: iModelMetadata;

  // We create several named versions in setup to have some entities for collection
  // query tests and persist them to use in entity update tests.
  const namedVersionCountCreatedInSetup = 3;
  const namedVersionsCreatedInSetup: NamedVersion[] = [];
  let updatedNamedVersions = 0;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthenticationProvider.getRequestContext(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "ManagementNamedVersionOperations"
      }
    });

    testiModel = await TestiModelCreator.createEmptyAndUploadChangesets({
      imodelsClient: new AuthoringiModelsClient(new TestClientOptions()),
      authorization,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for write")
    });

    for (let i = 0; i < namedVersionCountCreatedInSetup; i++) {
      const changesetIndex = await getChangesetIndexForNewNamedVersion({ authorization, imodelId: testiModel.id });
      namedVersionsCreatedInSetup.push(await imodelsClient.NamedVersions.create({
        authorization,
        imodelId: testiModel.id,
        namedVersionProperties: {
          name: `Milestone ${changesetIndex}`,
          description: `Description for milestone ${changesetIndex}`,
          changesetId: TestiModelFileProvider.changesets[changesetIndex - 1].id
        }
      }));
    }
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, authorization, projectId, testiModelGroup });
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
        authorization,
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
      authorization,
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
    const changesetIndex = await getChangesetIndexForNewNamedVersion({ authorization, imodelId: testiModel.id });
    const createNamedVersionParams: CreateNamedVersionParams = {
      authorization,
      imodelId: testiModel.id,
      namedVersionProperties: {
        name: `Named Version ${changesetIndex}`,
        description: `Some description for Named Version ${changesetIndex}`,
        changesetId: TestiModelFileProvider.changesets[changesetIndex - 1].id
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

  it("should update named version name", async () => {
    // Arrange
    const namedVersionToUpdate = namedVersionsCreatedInSetup[updatedNamedVersions++];
    const newNamedVersionName = "Some other name";
    const updateNamedVersionParams: UpdateNamedVersionParams = {
      authorization,
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
      authorization,
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
      authorization,
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

  async function getChangesetIndexForNewNamedVersion(params: iModelScopedOperationParams): Promise<number> {
    for await (const changeset of imodelsClient.Changesets.getRepresentationList(params))
      if (!changeset._links.namedVersion)
        return changeset.index;

    throw new TestSetupError("Test iModel does not have any changesets without named versions.");
  }
});
