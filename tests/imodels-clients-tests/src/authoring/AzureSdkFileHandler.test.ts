/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { expect } from "chai";
import { AuthorizationCallback, AzureSdkFileHandler, GetChangesetByIdParams, ProgressCallback, ProgressData } from "@itwin/imodels-client-authoring";
import { iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, ReusableTestiModelProvider, TestAuthorizationProvider, TestChangesetFile, TestClientOptions, TestProjectProvider, TestiModelFileProvider, iModelMetadata } from "../common";

describe("AzureSdkFileHandler", () => {
  let azureSdkFileHandler: AzureSdkFileHandler;
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let testiModel: iModelMetadata;

  before(async () => {
    azureSdkFileHandler = new AzureSdkFileHandler();

    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    const projectId = await TestProjectProvider.getProjectId();
    testiModel = await ReusableTestiModelProvider.getOrCreate({
      authorization,
      imodelsClient,
      projectId
    });
  });

  it("should call callback when downloading file", async () => {
    // Arrange
    const testChangeset = TestiModelFileProvider.changesets[0];
    const downloadUrl = await getTestChangesetDownloadUrl(testChangeset);
    const targetFilePath = `${Constants.TestDownloadDirectoryPath}\\AzureSdkFileHandlerTests_download`;

    const progressLogs: ProgressData[] = [];
    const progressCallback: ProgressCallback = (data: ProgressData) => progressLogs.push(data);

    // Act
    await azureSdkFileHandler.downloadFile({ downloadUrl, targetFilePath, progressCallback });

    // Assert
    // Changeset file is small so we expect file to be downloaded as a single chunk.
    expect(progressLogs.length).to.be.equal(1);
    const progressLog = progressLogs[0];
    expect(progressLog.bytesTotal).to.equal(progressLog.bytesDownloaded);
    expect(progressLog.bytesTotal).to.equal(fs.statSync(testChangeset.filePath).size);
  });

  async function getTestChangesetDownloadUrl(testChangeset: TestChangesetFile): Promise<string> {
    const getChangesetByIdParams: GetChangesetByIdParams = {
      authorization,
      imodelId: testiModel.id,
      changesetId: testChangeset.id
    };
    const changeset = await imodelsClient.Changesets.getById(getChangesetByIdParams);
    return changeset._links.download.href;
  }
});
