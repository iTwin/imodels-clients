/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { AcquireBriefcaseParams, AuthorizationCallback, AxiosRestClient, AzureSdkFileHandler, ChangesetResponse, GetSingleChangesetParams, ProgressCallback, ProgressData, IModelsApiUrlFormatter, IModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, ReusableTestIModelProvider, ReusableIModelMetadata, TestAuthorizationProvider, TestChangesetFile, TestClientOptions, TestProjectProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, cleanUpIModels, cleanupDirectory, IModelMetadata } from "../common";

describe("AzureSdkFileHandler", () => {
  let azureSdkFileHandler: AzureSdkFileHandler;
  let testClientOptions: TestClientOptions;
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModelGroup: TestIModelGroup;

  let testIModelForWrite: IModelMetadata;
  let testIModelForDownload: ReusableIModelMetadata;

  beforeEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  before(async () => {
    azureSdkFileHandler = new AzureSdkFileHandler();

    testClientOptions = new TestClientOptions();
    iModelsClient = new IModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testIModelGroup = new TestIModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AzureSdkFileHandler"
      }
    });

    testIModelForWrite = await TestIModelCreator.createEmpty({
      authorization,
      iModelsClient,
      projectId,
      iModelName: testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write")
    });
    testIModelForDownload = await ReusableTestIModelProvider.getOrCreate({
      authorization,
      iModelsClient,
      projectId
    });
  });

  afterEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  after(async () => {
    await cleanUpIModels({ iModelsClient, authorization, projectId, testIModelGroup });
  });

  it("should call callback when downloading file", async () => {
    // Arrange
    const testChangeset = TestIModelFileProvider.changesets[0];
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
    const testChangeset = TestIModelFileProvider.changesets[0];
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
      iModelId: testIModelForDownload.id,
      changesetId: testChangeset.id
    };
    const changeset = await iModelsClient.Changesets.getSingle(getSingleChangesetParams);
    return changeset._links.download.href;
  }

  async function getTestChangesetUploadUrl(testChangeset: TestChangesetFile): Promise<string> {
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iModelId: testIModelForWrite.id
    };
    const briefcase = await iModelsClient.Briefcases.acquire(acquireBriefcaseParams);

    const restClient = new AxiosRestClient();
    const urlFormatter = new IModelsApiUrlFormatter(testClientOptions.api.baseUri!);
    const authorizationValue = await authorization();
    const changesetMetadataCreateResponse = await restClient.sendPostRequest<ChangesetResponse>({
      url: urlFormatter.getChangesetListUrl({ iModelId: testIModelForWrite.id }),
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
