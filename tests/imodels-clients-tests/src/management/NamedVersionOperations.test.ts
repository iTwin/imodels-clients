/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { IModelsClient as AuthoringIModelsClient } from "@itwin/imodels-client-authoring";
import { AuthorizationCallback, CreateNamedVersionParams, GetNamedVersionListParams, IModelScopedOperationParams, IModelsClient, NamedVersion, NamedVersionState, UpdateNamedVersionParams, toArray } from "@itwin/imodels-client-management";
import { Config, Constants, IModelMetadata, TestAuthorizationProvider, TestClientOptions, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestProjectProvider, TestSetupError, assertCollection, assertNamedVersion, cleanUpIModels } from "../common";

describe("[Management] NamedVersionOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModelGroup: TestIModelGroup;
  let testIModel: IModelMetadata;

  // We create several named versions in setup to have some entities for collection
  // query tests and persist them to use in entity update tests.
  const namedVersionCountCreatedInSetup = 3;
  const namedVersionsCreatedInSetup: NamedVersion[] = [];
  let updatedNamedVersions = 0;

  before(async () => {
    iModelsClient = new IModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testIModelGroup = new TestIModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "ManagementNamedVersionOperations"
      }
    });

    testIModel = await TestIModelCreator.createEmptyAndUploadChangesets({
      iModelsClient: new AuthoringIModelsClient(new TestClientOptions()),
      authorization,
      projectId,
      iModelName: testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write")
    });

    for (let i = 0; i < namedVersionCountCreatedInSetup; i++) {
      const changesetIndex = await getChangesetIndexForNewNamedVersion({ authorization, iModelId: testIModel.id });
      namedVersionsCreatedInSetup.push(await iModelsClient.namedVersions.create({
        authorization,
        iModelId: testIModel.id,
        namedVersionProperties: {
          name: `Milestone ${changesetIndex}`,
          description: `Description for milestone ${changesetIndex}`,
          changesetId: TestIModelFileProvider.changesets[changesetIndex - 1].id
        }
      }));
    }
  });

  after(async () => {
    await cleanUpIModels({ iModelsClient, authorization, projectId, testIModelGroup });
  });

  [
    {
      label: "minimal",
      functionUnderTest: (params: GetNamedVersionListParams) => iModelsClient.namedVersions.getMinimalList(params)
    },
    {
      label: "representation",
      functionUnderTest: (params: GetNamedVersionListParams) => iModelsClient.namedVersions.getRepresentationList(params)
    }
  ].forEach((testCase) => {
    it(`should return all items when querying ${testCase.label} collection`, async () => {
      // Arrange
      const getNamedVersionListParams: GetNamedVersionListParams = {
        authorization,
        iModelId: testIModel.id,
        urlParams: {
          $top: 2
        }
      };

      // Act
      const namedVersions = testCase.functionUnderTest(getNamedVersionListParams);

      // Assert
      await assertCollection({
        asyncIterable: namedVersions,
        isEntityCountCorrect: (count) => count >= namedVersionCountCreatedInSetup
      });
    });
  });

  it("should return versions that match the name filter when querying representation collection", async () => {
    // Arrange
    const existingNamedVersion = namedVersionsCreatedInSetup[0];
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        name: existingNamedVersion.name
      }
    };

    // Act
    const namedVersions = iModelsClient.namedVersions.getRepresentationList(getNamedVersionListParams);

    // Assert
    const namedVersionArray = await toArray(namedVersions);
    expect(namedVersionArray.length).to.equal(1);
    const namedVersion = namedVersionArray[0];
    expect(namedVersion.id).to.equal(existingNamedVersion.id);
    expect(namedVersion.name).to.equal(existingNamedVersion.name);
  });

  it("should not return versions if none match the name filter when querying representation collection", async () => {
    // Arrange
    const getNamedVersionListParams: GetNamedVersionListParams = {
      authorization,
      iModelId: testIModel.id,
      urlParams: {
        name: "Non existent name"
      }
    };

    // Act
    const namedVersions = iModelsClient.namedVersions.getRepresentationList(getNamedVersionListParams);

    // Assert
    const namedVersionArray = await toArray(namedVersions);
    expect(namedVersionArray.length).to.equal(0);
  });

  it("should create named version on baseline", async () => {
    // Arrange
    const createNamedVersionParams: CreateNamedVersionParams = {
      authorization,
      iModelId: testIModel.id,
      namedVersionProperties: {
        name: "Named Version on baseline",
        description: "Some description for Named Version on baseline"
      }
    };

    // Act
    const namedVersion = await iModelsClient.namedVersions.create(createNamedVersionParams);

    // Assert
    assertNamedVersion({
      actualNamedVersion: namedVersion,
      expectedNamedVersionProperties: createNamedVersionParams.namedVersionProperties
    });
  });

  it("should create named version on a specific changeset", async () => {
    // Arrange
    const changesetIndex = await getChangesetIndexForNewNamedVersion({ authorization, iModelId: testIModel.id });
    const createNamedVersionParams: CreateNamedVersionParams = {
      authorization,
      iModelId: testIModel.id,
      namedVersionProperties: {
        name: `Named Version ${changesetIndex}`,
        description: `Some description for Named Version ${changesetIndex}`,
        changesetId: TestIModelFileProvider.changesets[changesetIndex - 1].id
      }
    };

    // Act
    const namedVersion = await iModelsClient.namedVersions.create(createNamedVersionParams);

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
      iModelId: testIModel.id,
      namedVersionId: namedVersionToUpdate.id,
      namedVersionProperties: {
        name: newNamedVersionName
      }
    };

    // Act
    const updatedNamedVersion = await iModelsClient.namedVersions.update(updateNamedVersionParams);

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
      iModelId: testIModel.id,
      namedVersionId: namedVersionToUpdate.id,
      namedVersionProperties: {
        description: newNamedVersionDescription
      }
    };

    // Act
    const updatedNamedVersion = await iModelsClient.namedVersions.update(updateNamedVersionParams);

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
      iModelId: testIModel.id,
      namedVersionId: namedVersionToUpdate.id,
      namedVersionProperties: {
        state: newNamedVersionState
      }
    };

    // Act
    const updatedNamedVersion = await iModelsClient.namedVersions.update(updateNamedVersionParams);

    // Assert
    expect(updatedNamedVersion.name).to.equal(namedVersionToUpdate.name);
    expect(updatedNamedVersion.description).to.equal(namedVersionToUpdate.description);
    expect(updatedNamedVersion.state).to.equal(newNamedVersionState);
  });

  async function getChangesetIndexForNewNamedVersion(params: IModelScopedOperationParams): Promise<number> {
    for await (const changeset of iModelsClient.changesets.getRepresentationList(params)) {
      const namedVersion = await changeset.getNamedVersion();
      if (!namedVersion)
        return changeset.index;
    }

    throw new TestSetupError("Test iModel does not have any changesets without named versions.");
  }
});
