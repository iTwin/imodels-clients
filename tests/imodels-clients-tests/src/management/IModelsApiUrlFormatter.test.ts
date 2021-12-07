/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { OrderByOperator, IModelOrderByProperty, IModelsApiUrlFormatter } from "@itwin/imodels-client-management";

describe("[Management] IModelsApiUrlFormatter", () => {
  let iModelsApiUrlFormatter: IModelsApiUrlFormatter;
  let iModelsApiBaseUri: string;

  before(() => {
    iModelsApiBaseUri = "https://api.bentley.com/imodels";
    iModelsApiUrlFormatter = new IModelsApiUrlFormatter(iModelsApiBaseUri);
  });

  describe("iModel urls", () => {
    it("should format create iModel url", () => {
      // Act
      const createIModelUrl = iModelsApiUrlFormatter.getCreateIModelUrl();

      // Assert
      expect(createIModelUrl).to.be.equal("https://api.bentley.com/imodels");
    });

    it("should format single iModel url", () => {
      // Arrange
      const getSingleIModelUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const singleIModelUrl = iModelsApiUrlFormatter.getSingleIModelUrl(getSingleIModelUrlParams);

      // Assert
      expect(singleIModelUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID");
    });

    it("should format iModel list url", () => {
      // Arrange
      const getIModelListUrlParams = { iModelId: "IMODEL_ID", urlParams: { projectId: "PROJECT_ID" } };

      // Act
      const iModelListUrl = iModelsApiUrlFormatter.getIModelListUrl(getIModelListUrlParams);

      // Assert
      expect(iModelListUrl).to.equal("https://api.bentley.com/imodels?projectId=PROJECT_ID");
    });
  });

  describe("Briefcase urls", () => {
    it("should format single Briefcase url", () => {
      // Arrange
      const getSingleBriefcaseUrlParams = { iModelId: "IMODEL_ID", briefcaseId: 2 };

      // Act
      const singleBriefcaseUrl = iModelsApiUrlFormatter.getSingleBriefcaseUrl(getSingleBriefcaseUrlParams);

      // Assert
      expect(singleBriefcaseUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID/briefcases/2");
    });

    it("should format Briefcase list url", () => {
      // Arrange
      const getBriefcaseListUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const briefcaseListUrl = iModelsApiUrlFormatter.getBriefcaseListUrl(getBriefcaseListUrlParams);

      // Assert
      expect(briefcaseListUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID/briefcases");
    });
  });

  describe("Named Version urls", () => {
    it("should format single Named Version url", () => {
      // Arrange
      const getSingleNamedVersionUrl = { iModelId: "IMODEL_ID", namedVersionId: "NAMED_VERSION_ID" };

      // Act
      const singleNamedVersionUrl = iModelsApiUrlFormatter.getSingleNamedVersionUrl(getSingleNamedVersionUrl);

      // Assert
      expect(singleNamedVersionUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID/namedversions/NAMED_VERSION_ID");
    });

    it("should format Named Version list url", () => {
      // Arrange
      const getNamedVersionListUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const namedVersionListUrl = iModelsApiUrlFormatter.getNamedVersionListUrl(getNamedVersionListUrlParams);

      // Assert
      expect(namedVersionListUrl).to.equal("https://api.bentley.com/imodels/IMODEL_ID/namedversions");
    });

    it("should parse named version url", () => {
      // Arrange
      const namedVersionUrl = "https://api.bentley.com/imodels/IMODEL_ID/namedversions/NAMED_VERSION_ID";

      // Act
      const { iModelId, namedVersionId } = iModelsApiUrlFormatter.parseNamedVersionUrl(namedVersionUrl);

      // Assert
      expect(iModelId).to.be.equal("IMODEL_ID");
      expect(namedVersionId).to.be.equal("NAMED_VERSION_ID");
    });
  });

  describe("Changeset urls", () => {
    it("should format changeset list url", () => {
      // Arrange
      const getChangesetListUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const changesetListUrl = iModelsApiUrlFormatter.getChangesetListUrl(getChangesetListUrlParams);

      // Assert
      expect(changesetListUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/changesets");
    });

    it("should format single changeset url with id", () => {
      // Arrange
      const getSingleChangesetUrlParams = { iModelId: "IMODEL_ID", changesetId: "CHANGESET_ID" };

      // Act
      const singleChangesetUrl = iModelsApiUrlFormatter.getSingleChangesetUrl(getSingleChangesetUrlParams);

      // Assert
      expect(singleChangesetUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/changesets/CHANGESET_ID");
    });

    it("should format single changeset url with index", () => {
      // Arrange
      const getSingleChangesetUrlParams = { iModelId: "IMODEL_ID", changesetIndex: 5 };

      // Act
      const singleChangesetUrl = iModelsApiUrlFormatter.getSingleChangesetUrl(getSingleChangesetUrlParams);

      // Assert
      expect(singleChangesetUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/changesets/5");
    });
  });

  describe("Checkpoint urls", () => {
    it("should parse checkpoint url", () => {
      // Arrange
      const checkpointUrl = "https://api.bentley.com/imodels/IMODEL_ID/changesets/5/checkpoint";

      // Act
      const { iModelId, changesetIndex } = iModelsApiUrlFormatter.parseCheckpointUrl(checkpointUrl);

      // Assert
      expect(iModelId).to.be.equal("IMODEL_ID");
      expect(changesetIndex).to.be.equal(5);
    });
  });

  describe("Url parameter forming", () => {
    it("should append all url params", () => {
      // Arrange
      const getIModelListUrlParams = {
        urlParams: {
          projectId: "PROJECT_ID",
          name: "IMODEL_NAME",
          $skip: 1,
          $top: 2,
          $orderBy: {
            property: IModelOrderByProperty.Name,
            operator: OrderByOperator.Ascending
          },
          testParam1: 1,
          testParam2: "param2"
        }
      };

      // Act
      const iModelListUrl = iModelsApiUrlFormatter.getIModelListUrl(getIModelListUrlParams);

      // Assert
      expect(iModelListUrl).to.be.equal("https://api.bentley.com/imodels?projectId=PROJECT_ID&name=IMODEL_NAME&$skip=1&$top=2&$orderBy=name asc&testParam1=1&testParam2=param2");
    });

    [
      {
        label: "null",
        valueUnderTest: null
      },
      {
        label: "undefined",
        valueUnderTest: undefined
      },
      {
        label: "empty string",
        valueUnderTest: ""
      },
      {
        label: "whitespace string",
        valueUnderTest: "  "
      }
    ].forEach((testCase) => {
      it(`should not append param if it is ${testCase.label}`, () => {
        // Arrange
        const getIModelListUrlParams = {
          urlParams: {
            projectId: "PROJECT_ID",
            testValue: testCase.valueUnderTest
          }
        };

        // Act
        const iModelListUrl = iModelsApiUrlFormatter.getIModelListUrl(getIModelListUrlParams);

        // Assert
        expect(iModelListUrl).to.be.equal("https://api.bentley.com/imodels?projectId=PROJECT_ID");
      });
    });

    it("should append param if it is equal to 0", () => {
      // Arrange
      const getIModelListUrlParams = {
        urlParams: {
          projectId: "PROJECT_ID",
          testValue: 0
        }
      };

      // Act
      const iModelListUrl = iModelsApiUrlFormatter.getIModelListUrl(getIModelListUrlParams);

      // Assert
      expect(iModelListUrl).to.be.equal("https://api.bentley.com/imodels?projectId=PROJECT_ID&testValue=0");
    });
  });
});