/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsApiUrlFormatter } from "@itwin/imodels-client-authoring";
import { expect } from "chai";

describe("[Authoring] iModelsApiUrlFormatter", () => {
  let imodelsApiUrlFormatter: iModelsApiUrlFormatter;
  let imodelsApiBaseUri: string;

  before(() => {
    imodelsApiBaseUri = "https://api.bentley.com/imodels";
    imodelsApiUrlFormatter = new iModelsApiUrlFormatter(imodelsApiBaseUri);
  });

  describe("Baseline urls", () => {
    it("should format baseline url", () => {
      // Arrange
      const getBaselineUrlParams = { imodelId: "IMODEL_ID" };

      // Act
      const baselineUrl = imodelsApiUrlFormatter.getBaselineUrl(getBaselineUrlParams);

      // Assert
      expect(baselineUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/baselinefile");
    });
  });

  describe("Lock urls", () => {
    it("should format lock list url", () => {
      // Arrange
      const getLockListUrlParams = { imodelId: "IMODEL_ID" };

      // Act
      const lockListUrl = imodelsApiUrlFormatter.getLockListUrl(getLockListUrlParams);

      // Assert
      expect(lockListUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/locks");
    });
  });
});