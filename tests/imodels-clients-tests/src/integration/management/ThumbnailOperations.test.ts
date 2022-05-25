/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import * as chaiAsPromised from "chai-as-promised";
import { AuthorizationCallback, IModelsClient, IModelsClientOptions, DownloadThumbnailParams, Thumbnail, ThumbnailSize, ImageType, UploadThumbnailParams } from "@itwin/imodels-client-management";
import { cleanupDirectory, createGuidValue, IModelMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelCreator, TestIModelGroup, TestIModelGroupFactory, TestUtilTypes, assertThumbnail } from "@itwin/imodels-client-test-utils";
import { use, expect } from "chai";

use(chaiAsPromised);

import { Constants, getTestDIContainer, getTestRunId } from "../common";
import { IModelScopedOperationParams } from "../../../../../clients/imodels-client-authoring/node_modules/@itwin/imodels-client-management/lib/IModelsClientExports";

describe.only("[Management] ThumbnailOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelGroup: TestIModelGroup;
  let testIModelCreator: TestIModelCreator;
  let testIModelForRead: ReusableIModelMetadata;

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

    testIModelCreator = container.get(TestIModelCreator);

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  });

  afterEach(() => {
    cleanupDirectory(Constants.TestDownloadDirectoryPath);
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
      imageType: ImageType.Png,
      fileToUploadPath: path.join(Constants.AssetsDirectoryPath, "Sample.png")
    },
    {
      label: "jpeg",
      imageType: ImageType.Jpeg,
      fileToUploadPath: path.join(Constants.AssetsDirectoryPath, "Sample.jpeg")
    }
  ].forEach(testCase => {
    it(`should upload a ${testCase.label} thumbnail`, async () => {
      // Arrange
      const testIModelForWrite: IModelMetadata = await testIModelCreator.createEmpty(
        testIModelGroup.getPrefixedUniqueIModelName(`Test upload ${testCase.label}`)
      );
      const iModelScopedOperationParams: IModelScopedOperationParams = {
        authorization,
        iModelId: testIModelForWrite.id
      };
      const initialThumbnail: Thumbnail = await iModelsClient.thumbnails.download(iModelScopedOperationParams);

      const fileContents: Buffer = await fs.promises.readFile(testCase.fileToUploadPath);
      const uploadThumbnailParams: UploadThumbnailParams = {
        ...iModelScopedOperationParams,
        thumbnailProperties: {
          imageType: testCase.imageType,
          data: fileContents
        }
      }

      // Act
      await iModelsClient.thumbnails.upload(uploadThumbnailParams);

      // Assert
      const newThumbnail: Thumbnail = await iModelsClient.thumbnails.download(iModelScopedOperationParams);
      expect(newThumbnail.data.length).to.not.be.equal(initialThumbnail.data.length);
    });
  })

  async function saveThumbnailToFile(thumbnail: Thumbnail): Promise<void> {
    const downloadDirectory = path.join(Constants.TestDownloadDirectoryPath, "[Management] ThumbnailOperations");
    await fs.promises.mkdir(downloadDirectory, { recursive: true });
    const targetFilePath = path.join(downloadDirectory, `test download - ${createGuidValue()}.png`)
    await fs.promises.writeFile(targetFilePath, Buffer.from(thumbnail.data.buffer), "binary");
  }
});
