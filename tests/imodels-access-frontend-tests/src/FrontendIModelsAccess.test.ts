/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ChangesetIndexAndId, IModelVersion } from "@itwin/core-common";
import { IModelIdArg } from "@itwin/core-frontend";
import { FrontendIModelsAccess } from "@itwin/imodels-access-frontend";
import { expect } from "chai";

import { IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-management";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelFileProvider, TestUtilTypes } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider.js";

describe("FrontendIModelsAccess", () => {
  let frontendIModelsAccess: FrontendIModelsAccess;
  let accessToken: string;
  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelForRead: ReusableIModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    const iModelsClient = new IModelsClient(iModelsClientOptions);
    frontendIModelsAccess = new FrontendIModelsAccess(iModelsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    const authorizationCallback = authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  });

  describe("getLatestChangeset", () => {
    it("should return latest changeset", async () => {
      // Arrange
      const getLatestChangesetParams: IModelIdArg = {
        accessToken,
        iModelId: testIModelForRead.id
      };

      // Act
      const latestChangeset: ChangesetIndexAndId = await frontendIModelsAccess.getLatestChangeset(getLatestChangesetParams);

      // Assert
      const expectedChangesetFile = testIModelFileProvider.changesets[testIModelFileProvider.changesets.length - 1];
      expect(latestChangeset.id).to.be.equal(expectedChangesetFile.id);
      expect(latestChangeset.index).to.be.equal(expectedChangesetFile.index);
    });
  });

  describe("getChangesetFromVersion", () => {
    it("should retrieve correct changeset info when iModel version is first", async () => {
      // Arrange
      const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
        accessToken,
        iModelId: testIModelForRead.id,
        version: IModelVersion.first()
      };

      // Act
      const changesetFromVersion: ChangesetIndexAndId = await frontendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams);

      // Assert
      expect(changesetFromVersion.id).to.be.equal("");
      expect(changesetFromVersion.index).to.be.equal(0);
    });

    it("should retrieve correct changeset info when iModel version is on a specific changeset", async () => {
      // Arrange
      const testChangesetFile = testIModelFileProvider.changesets[3];
      const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
        accessToken,
        iModelId: testIModelForRead.id,
        version: IModelVersion.asOfChangeSet(testChangesetFile.id)
      };

      // Act
      const changesetFromVersion: ChangesetIndexAndId = await frontendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams);

      // Assert
      expect(changesetFromVersion.id).to.be.equal(testChangesetFile.id);
      expect(changesetFromVersion.index).to.be.equal(testChangesetFile.index);
    });

    it("should retrieve correct changeset info when iModel version is on a specific named version", async () => {
      // Arrange
      const testIModelNamedVersion = testIModelForRead.namedVersions[0];
      const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
        accessToken,
        iModelId: testIModelForRead.id,
        version: IModelVersion.named(testIModelNamedVersion.name)
      };

      // Act
      const changesetFromVersion: ChangesetIndexAndId = await frontendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams);

      // Assert
      expect(changesetFromVersion.id).to.be.equal(testIModelNamedVersion.changesetId);
      expect(changesetFromVersion.index).to.be.equal(testIModelNamedVersion.changesetIndex);
    });

    it("should retrieve correct changeset info when iModel version is last", async () => {
      // Arrange
      const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
        accessToken,
        iModelId: testIModelForRead.id,
        version: IModelVersion.latest()
      };

      // Act
      const changesetFromVersion: ChangesetIndexAndId = await frontendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams);

      // Assert
      const latestTestChangesetFile = testIModelFileProvider.changesets[testIModelFileProvider.changesets.length - 1];
      expect(changesetFromVersion.id).to.be.equal(latestTestChangesetFile.id);
      expect(changesetFromVersion.index).to.be.equal(latestTestChangesetFile.index);
    });
  });

  describe("getChangesetFromNamedVersion", () => {
    it("should return changeset of the exact named version when named version name is provided", async () => {
      // Arrange
      const testIModelNamedVersion = testIModelForRead.namedVersions[0];
      const getChangesetFromNamedVersionParams: IModelIdArg & { versionName?: string } = {
        accessToken,
        iModelId: testIModelForRead.id,
        versionName: testIModelNamedVersion.name
      };

      // Act
      const changesetFromNamedVersion: ChangesetIndexAndId = await frontendIModelsAccess.getChangesetFromNamedVersion(getChangesetFromNamedVersionParams);

      // Assert
      const expectedChangesetFile = testIModelFileProvider.changesets[testIModelNamedVersion.changesetIndex - 1];
      expect(changesetFromNamedVersion.id).to.be.equal(expectedChangesetFile.id);
      expect(changesetFromNamedVersion.index).to.be.equal(expectedChangesetFile.index);
    });

    it("should return the latest changeset when named version name is not provided", async () => {
      // Arrange
      const getChangesetFromNamedVersionParams: IModelIdArg & { versionName?: string } = {
        accessToken,
        iModelId: testIModelForRead.id
      };

      // Act
      const changesetFromNamedVersion: ChangesetIndexAndId = await frontendIModelsAccess.getChangesetFromNamedVersion(getChangesetFromNamedVersionParams);

      // Assert
      const latestTestIModelNamedVersion = testIModelForRead.namedVersions[testIModelForRead.namedVersions.length - 1];
      const expectedChangesetFile = testIModelFileProvider.changesets[latestTestIModelNamedVersion.changesetIndex - 1];
      expect(changesetFromNamedVersion.id).to.be.equal(expectedChangesetFile.id);
      expect(changesetFromNamedVersion.index).to.be.equal(expectedChangesetFile.index);
    });
  });
});
