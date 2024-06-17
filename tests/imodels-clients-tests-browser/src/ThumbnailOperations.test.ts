/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "reflect-metadata";

import { ThumbnailOperations } from "@itwin/imodels-client-management/lib/esm/operations";
import { assertThumbnail } from "@itwin/imodels-client-test-utils/lib/assertions/BrowserFriendlyAssertions";

import { ApiOptions, Authorization, AuthorizationCallback, ContentType, DownloadThumbnailParams, IModelScopedOperationParams, IModelsClient, Thumbnail, ThumbnailSize, UploadThumbnailParams } from "@itwin/imodels-client-management";

import { FrontendTestEnvVariableKeys } from "./setup/FrontendTestEnvVariableKeys";

describe(`[Management] ${ThumbnailOperations.name}`, () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelForReadId: string;
  let testIModelForWriteId: string;

  let testPngFilePath: string;

  before(async () => {
    const iModelsClientApiOptions: ApiOptions = JSON.parse(Cypress.env(FrontendTestEnvVariableKeys.iModelsClientApiOptions));
    iModelsClient = new IModelsClient({ api: iModelsClientApiOptions });

    const admin1AuthorizationInfo: Authorization = JSON.parse(Cypress.env(FrontendTestEnvVariableKeys.admin1AuthorizationInfo));
    authorization = async () => admin1AuthorizationInfo;

    testIModelForReadId = Cypress.env(FrontendTestEnvVariableKeys.testIModelForReadId);

    const iTwinId: string = Cypress.env(FrontendTestEnvVariableKeys.testITwinId);
    const uniqueId = new Date().getTime();
    const testIModelForWrite = await iModelsClient.iModels.createEmpty({
      authorization,
      iModelProperties: {
        iTwinId,
        name: `Thumbnail browser tests [${uniqueId}]`
      }
    });
    testIModelForWriteId = testIModelForWrite.id;

    testPngFilePath = Cypress.env(FrontendTestEnvVariableKeys.testPngFilePath);
  });

  after(async () => {
    if (!testIModelForWriteId)
      return;

    await iModelsClient.iModels.delete({
      authorization,
      iModelId: testIModelForWriteId
    });
  });

  it("should download a small thumbnail", async () => {
    // Arrange
    const downloadThumbnailParams: DownloadThumbnailParams = {
      authorization,
      iModelId: testIModelForReadId
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
  });

  it("should upload a png thumbnail", async () => {
    // Arrange
    const iModelScopedOperationParams: IModelScopedOperationParams = {
      authorization,
      iModelId: testIModelForWriteId
    };
    const initialThumbnail: Thumbnail = await iModelsClient.thumbnails.download(iModelScopedOperationParams);

    const testPngFileBytes = await readFile(testPngFilePath);
    const uploadThumbnailParams: UploadThumbnailParams = {
      ...iModelScopedOperationParams,
      thumbnailProperties: {
        imageType: ContentType.Png,
        image: testPngFileBytes
      }
    };

    // Act
    await iModelsClient.thumbnails.upload(uploadThumbnailParams);

    // Assert
    const newThumbnail: Thumbnail = await iModelsClient.thumbnails.download(iModelScopedOperationParams);
    expect(newThumbnail.image.length).to.not.be.equal(initialThumbnail.image.length);
  });

  async function readFile(filePath: string): Promise<Uint8Array> {
    return new Promise((resolve) => {
      cy.readFile(filePath, "binary").then((stringContent: string) => {
        const binaryContent = Uint8Array.from(stringContent, (x) => x.charCodeAt(0));
        resolve(binaryContent);
      });
    });
  }
});
