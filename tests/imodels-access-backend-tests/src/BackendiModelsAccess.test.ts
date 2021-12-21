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
import { ContainingChanges, IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-authoring";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelFileProvider, TestUtilTypes, cleanupDirectory } from "@itwin/imodels-client-test-utils";
import { getTestDIContainer } from "./TestDiContainerProvider";

describe("BackendIModelsAccess", () => {
  let backendIModelsAccess: BackendIModelsAccess;
  let accessToken: string;
  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelForRead: ReusableIModelMetadata;
  const testDownloadPath = path.join(__dirname, "../lib/testDownloads");

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    const iModelsClient = new IModelsClient(iModelsClientOptions);
    backendIModelsAccess = new BackendIModelsAccess(iModelsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    const authorizationCallback = authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  });

  beforeEach(() => {
    cleanupDirectory(testDownloadPath);
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
    expect(downloadedChangesets.length).to.be.equal(testIModelFileProvider.changesets.length);
    for (let i = 0; i < downloadedChangesets.length; i++) {
      const downloadedChangeset = downloadedChangesets[i];
      const expectedChangesetFile = testIModelFileProvider.changesets[i];

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
