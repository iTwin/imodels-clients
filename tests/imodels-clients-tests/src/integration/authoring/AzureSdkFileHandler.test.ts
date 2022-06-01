/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { AcquireBriefcaseParams, AuthorizationCallback, AxiosRestClient, AzureSdkFileHandler, ChangesetResponse, ContentType, GetSingleChangesetParams, IModelsApiUrlFormatter, IModelsClient, IModelsClientOptions, ProgressCallback, ProgressData } from "@itwin/imodels-client-authoring";
import { IModelMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestChangesetFile, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestUtilTypes, cleanupDirectory } from "@itwin/imodels-client-test-utils";
import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("AzureSdkFileHandler", () => {
  let azureSdkFileHandler: AzureSdkFileHandler;

  let iModelsClientOptions: IModelsClientOptions;
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;
  let testIModelForWrite: IModelMetadata;
  let testIModelForDownload: ReusableIModelMetadata;

  beforeEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  before(async () => {
    const container = getTestDIContainer();

    azureSdkFileHandler = new AzureSdkFileHandler();

    iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({ testRunId: getTestRunId(), packageName: Constants.PackagePrefix, testSuiteName: "AzureSdkFileHandler" });

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForWrite = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write"));

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForDownload = await reusableTestIModelProvider.getOrCreate();
  });

  afterEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  it("should call callback when downloading file", async () => {
    // Arrange
    const testChangeset = testIModelFileProvider.changesets[0];
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
    const testChangeset = testIModelFileProvider.changesets[0];
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
    const changeset = await iModelsClient.changesets.getSingle(getSingleChangesetParams);
    return changeset._links.download!.href;
  }

  async function getTestChangesetUploadUrl(testChangeset: TestChangesetFile): Promise<string> {
    const acquireBriefcaseParams: AcquireBriefcaseParams = {
      authorization,
      iModelId: testIModelForWrite.id
    };
    const briefcase = await iModelsClient.briefcases.acquire(acquireBriefcaseParams);

    const restClient = new AxiosRestClient();
    const urlFormatter = new IModelsApiUrlFormatter(iModelsClientOptions.api!.baseUrl!);
    const authorizationValue = await authorization();
    const changesetMetadataCreateResponse = await restClient.sendPostRequest<ChangesetResponse>({
      url: urlFormatter.getChangesetListUrl({ iModelId: testIModelForWrite.id }),
      headers: {
        Authorization: `${authorizationValue.scheme} ${authorizationValue.token}`
      },
      body: {
        contentType: ContentType.Json,
        content: {
          id: testChangeset.id,
          parentId: testChangeset.parentId,
          briefcaseId: briefcase.briefcaseId,
          fileSize: fs.statSync(testChangeset.filePath).size
        }
      }
    });
    return changesetMetadataCreateResponse.changeset._links.upload!.href;
  }
});
