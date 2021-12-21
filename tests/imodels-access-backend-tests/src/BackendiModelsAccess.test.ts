/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { ChangesetRangeArg, IModelIdArg } from "@itwin/core-backend";
import { BriefcaseId, ChangesetFileProps, ChangesetType, LocalDirName } from "@itwin/core-common";
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { expect } from "chai";
import { ContainingChanges, IModelsClient } from "@itwin/imodels-client-authoring";
import { cleanupDirectory, Config, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestClientOptions, TestIModelFileProvider, TestProjectProvider } from "@itwin/imodels-clients-tests";

describe("BackendiModelsAccess", () => {
  let backendIModelsAccess: BackendIModelsAccess;
  let accessToken: string;
  let projectId: string;
  let testIModelForRead: ReusableIModelMetadata;
  let testDownloadPath = path.join(__dirname, "../lib/testDownloads");

  before(async () => {
    const iModelsClient = new IModelsClient(new TestClientOptions());
    const authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);

    backendIModelsAccess = new BackendIModelsAccess(iModelsClient);
    accessToken = `${(await authorization()).scheme} ${(await authorization()).token}`;
    projectId = await TestProjectProvider.getProjectId();
    testIModelForRead = await ReusableTestIModelProvider.getOrCreate({
      iModelsClient,
      authorization,
      projectId
    });
  });

  afterEach(() => {
    cleanupDirectory(testDownloadPath);
  });

  it("should get current user briefcase ids", async () => {
    // Arrange
    const getMyBriefcaseIdsParams: IModelIdArg = {
      accessToken,
      iModelId: testIModelForRead.id
    };

    // Act
    const briefcaseIds: BriefcaseId[] = await backendIModelsAccess.getMyBriefcaseIds(getMyBriefcaseIdsParams);

    // Assert
    expect(briefcaseIds.length).to.equal(1);
    const briefcaseId = briefcaseIds[0];
    expect(briefcaseId).to.equal(testIModelForRead.briefcase.id);
  });

  it("should download changesets", async () => {
    // Arrange
    const downloadChangesetsParams: ChangesetRangeArg & { targetDir: LocalDirName } = {
      accessToken,
      iModelId: testIModelForRead.id,
      targetDir: testDownloadPath
    };

    // Act
    const downloadedChangesets: ChangesetFileProps[] = await backendIModelsAccess.downloadChangesets(downloadChangesetsParams);

    // Assert
    expect(downloadedChangesets.length).to.be.equal(TestIModelFileProvider.changesets.length);
    for (let i = 0; i < downloadedChangesets.length; i++) {
      const downloadedChangeset = downloadedChangesets[i];
      const expectedChangesetFile = TestIModelFileProvider.changesets[i];

      expect(fs.existsSync(downloadedChangeset.pathname)).to.equal(true);
      expect(downloadedChangeset.id).to.be.equal(expectedChangesetFile.id);
      expect(downloadedChangeset.index).to.be.equal(expectedChangesetFile.index);
      expect(downloadedChangeset.parentId).to.be.equal(expectedChangesetFile.parentId);
      expect(downloadedChangeset.description).to.be.equal(expectedChangesetFile.description);
      expect(downloadedChangeset.briefcaseId).to.be.equal(testIModelForRead.briefcase.id);
      expect(downloadedChangeset.size).to.be.equal(fs.statSync(expectedChangesetFile.filePath).size);

      if (expectedChangesetFile.containingChanges === ContainingChanges.Schema)
        expect(downloadedChangeset.changesType).to.be.equal(ChangesetType.Schema);
      else
        expect(downloadedChangeset.changesType).to.be.equal(ChangesetType.Regular);
    }
  });
});
