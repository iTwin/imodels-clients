/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { IModelsApiUrlFormatter } from "@itwin/imodels-client-authoring";

describe("[Authoring] IModelsApiUrlFormatter", () => {
  let iModelsApiUrlFormatter: IModelsApiUrlFormatter;
  let iModelsApiBaseUri: string;

  before(() => {
    iModelsApiBaseUri = "https://api.bentley.com/imodels";
    iModelsApiUrlFormatter = new IModelsApiUrlFormatter(iModelsApiBaseUri);
  });

  describe("Baseline urls", () => {
    it("should format baseline url", () => {
      // Arrange
      const getBaselineUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const baselineUrl = iModelsApiUrlFormatter.getBaselineUrl(getBaselineUrlParams);

      // Assert
      expect(baselineUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/baselinefile");
    });
  });

  describe("Lock urls", () => {
    it("should format lock list url", () => {
      // Arrange
      const getLockListUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const lockListUrl = iModelsApiUrlFormatter.getLockListUrl(getLockListUrlParams);

      // Assert
      expect(lockListUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/locks");
    });
  });
});
