/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { iModelOrderByProperty, iModelsApiUrlFormatter, OrderByOperator } from "@itwin/imodels-client-management";

describe("[Management] iModelsApiUrlFormatter", () => {
  let imodelsApiUrlFormatter: iModelsApiUrlFormatter;
  let imodelsApiBaseUri: string;

  before(() => {
    imodelsApiBaseUri = "https://api.bentley.com/imodels";
    imodelsApiUrlFormatter = new iModelsApiUrlFormatter(imodelsApiBaseUri);
  });

  describe("iModel urls", () => {
    it("should format create iModel url", () => {
      // Act
      const createiModelUrl = imodelsApiUrlFormatter.getCreateiModelUrl();

      // Assert
      expect(createiModelUrl).to.be.equal("https://api.bentley.com/imodels");
    });

    it("should format single iModel url", () => {
      // Arrange
      const getSingleiModelUrlParams = { imodelId: "IMODEL_ID" };

      // Act
      const singleiModelUrl = imodelsApiUrlFormatter.getSingleiModelUrl(getSingleiModelUrlParams);

      // Assert
      expect(singleiModelUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID");
    });

    it("should format iModel list url", () => {
      // Arrange
      const getiModelListUrlParams = { imodelId: "IMODEL_ID", urlParams: { projectId: "PROJECT_ID" } };

      // Act
      const imodelListUrl = imodelsApiUrlFormatter.getiModelListUrl(getiModelListUrlParams);

      // Assert
      expect(imodelListUrl).to.equal("https://api.bentley.com/imodels?projectId=PROJECT_ID");
    });
  })

  describe("Briefcase urls", () => {
    it("should format single Briefcase url", () => {
      // Arrange
      const getSingleBriefcaseUrlParams = { imodelId: "IMODEL_ID", briefcaseId: 2 };

      // Act
      const singleBriefcaseUrl = imodelsApiUrlFormatter.getSingleBriefcaseUrl(getSingleBriefcaseUrlParams);

      // Assert
      expect(singleBriefcaseUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID/briefcases/2");
    });

    it("should format Briefcase list url", () => {
      // Arrange
      const getBriefcaseListUrlParams = { imodelId: "IMODEL_ID" };

      // Act
      const briefcaseListUrl = imodelsApiUrlFormatter.getBriefcaseListUrl(getBriefcaseListUrlParams);

      // Assert
      expect(briefcaseListUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID/briefcases");
    });
  });

  describe("Named Version urls", () => {
    it("should format single Named Version url", () => {
      // Arrange
      const getSingleNamedVersionUrl = { imodelId: "IMODEL_ID", namedVersionId: "NAMED_VERSION_ID" };

      // Act
      const singleNamedVersionUrl = imodelsApiUrlFormatter.getSingleNamedVersionUrl(getSingleNamedVersionUrl);

      // Assert
      expect(singleNamedVersionUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID/namedversions/NAMED_VERSION_ID");
    });

    it("should format Named Version list url", () => {
      // Arrange
      const getNamedVersionListUrlParams = { imodelId: "IMODEL_ID" };

      // Act
      const namedVersionListUrl = imodelsApiUrlFormatter.getNamedVersionListUrl(getNamedVersionListUrlParams);

      // Assert
      expect(namedVersionListUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID/namedversions");
    });

    it("should parse named version url", () => {
      // Arrange
      const namedVersionUrl = "https://api.bentley.com/imodels/IMODEL_ID/namedversions/NAMED_VERSION_ID";

      // Act
      const { imodelId, namedVersionId } = imodelsApiUrlFormatter.parseNamedVersionUrl(namedVersionUrl);

      // Assert
      expect(imodelId).to.be.equal("IMODEL_ID");
      expect(namedVersionId).to.be.equal("NAMED_VERSION_ID");
    });
  })

  describe("Changeset urls", () => {
    it("should format changeset list url", () => {
      // Arrange
      const getChangesetListUrlParams = { imodelId: "IMODEL_ID" };

      // Act
      const changesetListUrl = imodelsApiUrlFormatter.getChangesetListUrl(getChangesetListUrlParams);

      // Assert
      expect(changesetListUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/changesets");
    });

    it("should format single changeset url with id", () => {
      // Arrange
      const getSingleChangesetUrlParams = { imodelId: "IMODEL_ID", changesetId: "CHANGESET_ID" };

      // Act
      const singleChangesetUrl = imodelsApiUrlFormatter.getSingleChangesetUrl(getSingleChangesetUrlParams);

      // Assert
      expect(singleChangesetUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/changesets/CHANGESET_ID");
    });

    it("should format single changeset url with index", () => {
      // Arrange
      const getSingleChangesetUrlParams = { imodelId: "IMODEL_ID", changesetIndex: 5 };

      // Act
      const singleChangesetUrl = imodelsApiUrlFormatter.getSingleChangesetUrl(getSingleChangesetUrlParams);

      // Assert
      expect(singleChangesetUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/changesets/5");
    });
  });

  describe("Checkpoint urls", () => {
    it("should parse checkpoint url", () => {
      // Arrange
      const checkpointUrl = "https://api.bentley.com/imodels/IMODEL_ID/changesets/5/checkpoint";

      // Act
      const { imodelId, changesetIndex } = imodelsApiUrlFormatter.parseCheckpointUrl(checkpointUrl);

      // Assert
      expect(imodelId).to.be.equal("IMODEL_ID");
      expect(changesetIndex).to.be.equal(5);
    });
  });

  describe("Url parameter forming", () => {
    it("should append all url params", () => {
      // Arrange
      const getiModelListUrlParams = {
        urlParams: {
          projectId: "PROJECT_ID",
          name: "IMODEL_NAME",
          $skip: 1,
          $top: 2,
          $orderBy: {
            property: iModelOrderByProperty.Name,
            operator: OrderByOperator.Ascending
          },
          testParam1: 1,
          testParam2: "param2"
        }
      };

      // Act
      const imodelListUrl = imodelsApiUrlFormatter.getiModelListUrl(getiModelListUrlParams);

      // Assert
      expect(imodelListUrl).to.be.equal("https://api.bentley.com/imodels?projectId=PROJECT_ID&name=IMODEL_NAME&$skip=1&$top=2&$orderBy=name asc&testParam1=1&testParam2=param2");
    });

    [
      {
        label: "null",
        valueUndexTest: null
      },
      {
        label: "undefined",
        valueUnderTest: undefined
      },
      {
        label: "empty string",
        valueUnderTest: "",
      },
      {
        label: "whitespace string",
        valueUnderTest: "  ",
      }
    ].forEach((testCase) => {
      it(`should not append param if it is ${testCase.label}`, () => {
        // Arrange
        const getiModelListUrlParams = {
          urlParams: {
            projectId: "PROJECT_ID",
            testValue: testCase.valueUnderTest
          }
        };

        // Act
        const imodelListUrl = imodelsApiUrlFormatter.getiModelListUrl(getiModelListUrlParams);

        // Assert
        expect(imodelListUrl).to.be.equal("https://api.bentley.com/imodels?projectId=PROJECT_ID");
      });
    });

    it(`should append param if it is equal to 0`, () => {
      // Arrange
      const getiModelListUrlParams = {
        urlParams: {
          projectId: "PROJECT_ID",
          testValue: 0
        }
      };

      // Act
      const imodelListUrl = imodelsApiUrlFormatter.getiModelListUrl(getiModelListUrlParams);

      // Assert
      expect(imodelListUrl).to.be.equal("https://api.bentley.com/imodels?projectId=PROJECT_ID&testValue=0");
    });
  });
});