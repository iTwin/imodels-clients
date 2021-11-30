/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { AcquireBriefcaseParams, AuthorizationCallback, AxiosRestClient, AzureSdkFileHandler, ChangesetResponse, GetSingleChangesetParams, ProgressCallback, ProgressData, iModelsApiUrlFormatter, iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, ReusableTestiModelProvider, ReusableiModelMetadata, TestAuthorizationProvider, TestChangesetFile, TestClientOptions, TestProjectProvider, TestiModelCreator, TestiModelFileProvider, TestiModelGroup, cleanUpiModels, cleanupDirectory, iModelMetadata } from "../common";

describe("AzureSdkFileHandler", () => {
  let azureSdkFileHandler: AzureSdkFileHandler;
  let testClientOptions: TestClientOptions;
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;

  let testiModelForWrite: iModelMetadata;
  let testiModelForDownload: ReusableiModelMetadata;

  beforeEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  before(async () => {
    azureSdkFileHandler = new AzureSdkFileHandler();

    testClientOptions = new TestClientOptions();
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AzureSdkFileHandler"
      }
    });

    testiModelForWrite = await TestiModelCreator.createEmpty({
      authorization,
      imodelsClient,
      projectId,
      imodelName: testiModelGroup.getPrefixedUniqueiModelName("Test iModel for write")
    });
    testiModelForDownload = await ReusableTestiModelProvider.getOrCreate({
      authorization,
      imodelsClient,
      projectId
    });
  });

  afterEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  after(async () => {
    await cleanUpiModels({ imodelsClient, authorization, projectId, testiModelGroup });
  });

  it("should call callback when downloading file", async () => {
    // Arrange
    const testChangeset = TestiModelFileProvider.changesets[0];
    const downloadUrl = await getTestChangesetDownloadUrl(testChangeset);
    const targetFilePath = path.join(Constants.TestDownloadDirectoryPath, "AzureSdkFileHandlerTests_download");

    const progressLogs: ProgressData[] = [];
    const progressCallback: ProgressCallback = (data: ProgressData) => progressLogs.push(data);

    // Act
    await azureSdkFileHandler.downloadFile({ downloadUrl, targetFilePath, progressCallback });

    // Assert
    // Changeset file is small so we expect file to be downloaded as a single chunk.
    expect(progressLogs.length).to.be.equal(1);
    const progressLog = progressLogs[0];
    expect(progressLog.bytesTotal).to.equal(progressLog.bytesTransferred);
    expect(progressLog.bytesTotal).to.equal(fs.statSync(testChangeset.filePath).size);
  });

  it("should call callback when uploading file", async () => {
    // Arrange
    const testChangeset = TestiModelFileProvider.changesets[0];
    const uploadUrl = await getTestChangesetUploadUrl(testChangeset);
    const sourceFilePath = testChangeset.filePath;

    const progressLogs: ProgressData[] = [];
    const progressCallback: ProgressCallback = (data: ProgressData) => progressLogs.push(data);

    // Act
    await azureSdkFileHandler.uploadFile({ uploadUrl, sourceFilePath, progressCallback });

    // Assert
    // Changeset file is small so we expect file to be uploaded as a single chunk.
    expect(progressLogs.length).to.be.equal(1);
    const progressLog = progressLogs[0];
    expect(progressLog.bytesTotal).to.equal(progressLog.bytesTransferred);
    expect(progressLog.bytesTotal).to.equal(fs.statSync(testChangeset.filePath).size);
  });

  async function getTestChangesetDownloadUrl(testChangeset: TestChangesetFile): Promise<string> {
    const getSingleChangesetParams: GetSingleChangesetParams = {
      authorization,
      imodelId: testiModelForDownload.id,
      changesetId: testChangeset.id
    };
    const changeset = await imodelsClient.Changesets.getSingle(getSingleChangesetParams);
    return changeset._links.download.href;
  }

  async function getTestChangesetUploadUrl(testChangeset: TestChangesetFile): Promise<string> {
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      imodelId: testiModelForWrite.id
    };
    const briefcase = await imodelsClient.Briefcases.acquire(acquireBriefcaseParams);

    const restClient = new AxiosRestClient();
    const urlFormatter = new iModelsApiUrlFormatter(testClientOptions.api.baseUri!);
    const authorizationValue = await authorization();
    const changesetMetadataCreateResponse = await restClient.sendPostRequest<ChangesetResponse>({
      url: urlFormatter.getChangesetListUrl({ imodelId: testiModelForWrite.id }),
      headers: {
        Authorization: `${authorizationValue.scheme} ${authorizationValue.token}`
      },
      body: {
        id: testChangeset.id,
        parentId: testChangeset.parentId,
        briefcaseId: briefcase.briefcaseId,
        fileSize: fs.statSync(testChangeset.filePath).size
      }
    });
    return changesetMetadataCreateResponse.changeset._links.upload.href;
  }
});
