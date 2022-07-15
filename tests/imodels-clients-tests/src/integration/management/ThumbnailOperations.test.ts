/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";

import { expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";

import { AuthorizationCallback, ContentType, DownloadThumbnailParams, IModelScopedOperationParams, IModelsClient, IModelsClientOptions, Thumbnail, ThumbnailSize, UploadThumbnailParams } from "@itwin/imodels-client-management";
import { IModelMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelCreator, TestIModelGroup, TestIModelGroupFactory, TestUtilTypes, assertThumbnail, cleanupDirectory, createGuidValue } from "@itwin/imodels-client-test-utils";

use(chaiAsPromised);

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] ThumbnailOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelGroup: TestIModelGroup;
  let testIModelForRead: ReusableIModelMetadata;
  let testIModelForWrite: IModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix, testSuiteName: "ManagementThumbnailOperations"
    });

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForWrite = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write"));
  });

  afterEach(async () => {
    await cleanupDirectory(Constants.TestDownloadDirectoryPath);
  });

  it("should download a small thumbnail", async () => {
    // Arrange
    const downloadThumbnailParams: DownloadThumbnailParams = {
      authorization,
      iModelId: testIModelForRead.id
    };

    // Act
    const thumbnail: Thumbnail = await iModelsClient.thumbnails.download(downloadThumbnailParams);

    // Assert
    assertThumbnail({
      actualThumbnail: thumbnail,
      expectedThumbnailProperties: {
        size: ThumbnailSize.Small
      }
    });

    const saveFilePromise = saveThumbnailToFile(thumbnail);
    await expect(saveFilePromise).to.eventually.be.fulfilled;
  });

  it("should download a large thumbnail", async () => {
    // Arrange
    const downloadThumbnailParams: DownloadThumbnailParams = {
      authorization,
      iModelId: testIModelForRead.id,
      urlParams: {
        size: ThumbnailSize.Large
      }
    };

    // Act
    const thumbnail: Thumbnail = await iModelsClient.thumbnails.download(downloadThumbnailParams);

    // Assert
    assertThumbnail({
      actualThumbnail: thumbnail,
      expectedThumbnailProperties: {
        size: ThumbnailSize.Large
      }
    });

    const saveFilePromise = saveThumbnailToFile(thumbnail);
    await expect(saveFilePromise).to.eventually.be.fulfilled;
  });

  [
    {
      label: "png",
      contentType: ContentType.Png,
      fileToUploadPath: path.join(Constants.AssetsDirectoryPath, "Sample.png")
    } as const,
    {
      label: "jpeg",
      contentType: ContentType.Jpeg,
      fileToUploadPath: path.join(Constants.AssetsDirectoryPath, "Sample.jpeg")
    } as const
  ].forEach((testCase) => {
    it(`should upload a ${testCase.label} thumbnail`, async () => {
      // Arrange
      const iModelScopedOperationParams: IModelScopedOperationParams = {
        authorization,
        iModelId: testIModelForWrite.id
      };
      const initialThumbnail: Thumbnail = await iModelsClient.thumbnails.download(iModelScopedOperationParams);

      const fileContents: Buffer = await fs.promises.readFile(testCase.fileToUploadPath);
      const uploadThumbnailParams: UploadThumbnailParams = {
        ...iModelScopedOperationParams,
        thumbnailProperties: {
          imageType: testCase.contentType,
          image: fileContents
        }
      };

      // Act
      await iModelsClient.thumbnails.upload(uploadThumbnailParams);

      // Assert
      const newThumbnail: Thumbnail = await iModelsClient.thumbnails.download(iModelScopedOperationParams);
      expect(newThumbnail.image.length).to.not.be.equal(initialThumbnail.image.length);
    });
  });

  async function saveThumbnailToFile(thumbnail: Thumbnail): Promise<void> {
    const downloadDirectory = path.join(Constants.TestDownloadDirectoryPath, "[Management] ThumbnailOperations");
    await fs.promises.mkdir(downloadDirectory, { recursive: true });
    const targetFilePath = path.join(downloadDirectory, `test download - ${createGuidValue()}.png`);
    await fs.promises.writeFile(targetFilePath, Buffer.from(thumbnail.image.buffer), "binary");
  }
});
