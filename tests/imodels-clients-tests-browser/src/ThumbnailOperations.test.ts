/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ApiOptions, Authorization, AuthorizationCallback, DownloadThumbnailParams, IModelsClient, Thumbnail, ThumbnailSize } from "@itwin/imodels-client-management";
import { assertThumbnail } from "@itwin/imodels-client-test-utils/lib/assertions/BrowserFriendlyAssertions";
import { FrontendTestEnvVariableKeys } from "./setup/FrontendTestEnvVariableKeys";

describe("[Management] ThumbnailOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelForReadId: string; // todo: testIModelForReadId

  before(() => {
    console.log("before");

    const iModelsClientApiOptions: ApiOptions = JSON.parse(Cypress.env(FrontendTestEnvVariableKeys.iModelsClientApiOptions));
    iModelsClient = new IModelsClient({ api: iModelsClientApiOptions });

    const admin1AuthorizationInfo: Authorization = JSON.parse(Cypress.env(FrontendTestEnvVariableKeys.admin1AuthorizationInfo));
    authorization = async () => admin1AuthorizationInfo;

    testIModelForReadId = Cypress.env(FrontendTestEnvVariableKeys.testIModelForReadId);
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

  it("should download a large thumbnail", async () => {
    // Arrange
    const downloadThumbnailParams: DownloadThumbnailParams = {
      authorization,
      iModelId: testIModelForReadId,
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
  });
});
