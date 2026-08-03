/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { IModelsApiUrlFormatter } from "@itwin/imodels-client-authoring";

describe("[Authoring] IModelsApiUrlFormatter", () => {
  let iModelsApiUrlFormatter: IModelsApiUrlFormatter;
  let iModelsApibaseUrl: string;

  before(() => {
    iModelsApibaseUrl = "https://api.bentley.com/imodels";
    iModelsApiUrlFormatter = new IModelsApiUrlFormatter(iModelsApibaseUrl);
  });

  describe("Baseline urls", () => {
    it("should format baseline url", () => {
      // Arrange
      const getBaselineUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const baselineUrl =
        iModelsApiUrlFormatter.getBaselineUrl(getBaselineUrlParams);

      // Assert
      expect(baselineUrl).to.be.equal(
        "https://api.bentley.com/imodels/IMODEL_ID/baselinefile"
      );
    });
  });

  describe("Lock urls", () => {
    it("should format lock list url", () => {
      // Arrange
      const getLockListUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const lockListUrl =
        iModelsApiUrlFormatter.getLockListUrl(getLockListUrlParams);

      // Assert
      expect(lockListUrl).to.be.equal(
        "https://api.bentley.com/imodels/IMODEL_ID/locks"
      );
    });

    it("should format released lock list url with required params", () => {
      // Arrange
      const params = {
        iModelId: "IMODEL_ID",
        urlParams: { afterChangesetIndex: 5 },
      };

      // Act
      const releasedLockListUrl =
        iModelsApiUrlFormatter.getReleasedLockListUrl(params);

      // Assert
      expect(releasedLockListUrl).to.be.equal(
        "https://api.bentley.com/imodels/IMODEL_ID/locks/releasedlocks?afterChangesetIndex=5"
      );
    });

    it("should format released lock list url with all params", () => {
      // Arrange
      const params = {
        iModelId: "IMODEL_ID",
        urlParams: {
          afterChangesetIndex: 3,
          $top: 10,
          $continuationToken: "TOKEN",
        },
      };

      // Act
      const releasedLockListUrl =
        iModelsApiUrlFormatter.getReleasedLockListUrl(params);

      // Assert
      expect(releasedLockListUrl).to.be.equal(
        "https://api.bentley.com/imodels/IMODEL_ID/locks/releasedlocks?afterChangesetIndex=3&$top=10&$continuationToken=TOKEN"
      );
    });
  });
});
