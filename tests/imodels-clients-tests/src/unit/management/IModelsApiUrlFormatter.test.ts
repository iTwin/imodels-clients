/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsApiUrlFormatter } from "@itwin/imodels-client-management/lib/operations";
import { expect } from "chai";

import { IModelOrderByProperty, OrderByOperator } from "@itwin/imodels-client-management";

describe("[Management] IModelsApiUrlFormatter", () => {
  let iModelsApiUrlFormatter: IModelsApiUrlFormatter;
  let iModelsApiBaseUrl: string;

  before(() => {
    iModelsApiBaseUrl = "https://api.bentley.com/imodels";
    iModelsApiUrlFormatter = new IModelsApiUrlFormatter(iModelsApiBaseUrl);
  });

  describe("iModel urls", () => {
    it("should format create iModel url", () => {
      // Act
      const createIModelUrl = iModelsApiUrlFormatter.getCreateIModelUrl();

      // Assert
      expect(createIModelUrl).to.be.equal("https://api.bentley.com/imodels");
    });

    it("should format clone iModel url", () => {
      // Arrange
      const getCloneIModelUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const cloneIModelUrl = iModelsApiUrlFormatter.getCloneIModelUrl(getCloneIModelUrlParams);

      // Assert
      expect(cloneIModelUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/clone");
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
      const getIModelListUrlParams = { iModelId: "IMODEL_ID", urlParams: { iTwinId: "ITWIN_ID" } };

      // Act
      const iModelListUrl = iModelsApiUrlFormatter.getIModelListUrl(getIModelListUrlParams);

      // Assert
      expect(iModelListUrl).to.equal("https://api.bentley.com/imodels?iTwinId=ITWIN_ID");
    });

    it("should parse iModel url", () => {
      // Arrange
      const iModelUrl = "https://api.bentley.com/imodels/IMODEL_ID";

      // Act
      const { iModelId } = iModelsApiUrlFormatter.parseIModelUrl(iModelUrl);

      // Assert
      expect(iModelId).to.be.equal("IMODEL_ID");
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

    [
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/5",
        expectedChangesetIndex: 5
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/5/",
        expectedChangesetIndex: 5
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/55555555",
        expectedChangesetIndex: 55555555
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/9007199254740991",
        expectedChangesetIndex: 9007199254740991
      }
    ].forEach((testCase) => {
      it(`should parse changeset url with index ${testCase.expectedChangesetIndex}`, () => {
        // Act
        const { iModelId, changesetId, changesetIndex } = iModelsApiUrlFormatter.parseChangesetUrl(testCase.url);

        // Assert
        expect(iModelId).to.be.equal("IMODEL_ID");
        expect(changesetId).to.be.undefined;
        expect(changesetIndex).to.be.equal(testCase.expectedChangesetIndex);
      });
    });

    [
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/CHANGESET_ID",
        expectedChangesetId: "CHANGESET_ID"
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/CHANGESET_ID/",
        expectedChangesetId: "CHANGESET_ID"
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/5555555555555555555555555555555555555555",
        expectedChangesetId: "5555555555555555555555555555555555555555"
      }
    ].forEach((testCase) => {
      it(`should parse changeset url with id (${testCase.expectedChangesetId})`, () => {
        // Act
        const { iModelId, changesetId, changesetIndex } = iModelsApiUrlFormatter.parseChangesetUrl(testCase.url);

        // Assert
        expect(iModelId).to.be.equal("IMODEL_ID");
        expect(changesetId).to.be.equal(testCase.expectedChangesetId);
        expect(changesetIndex).to.be.undefined;
      });
    });
  });

  describe("Changeset Extended Data urls", () => {
    it("should format changeset extended data list url", () => {
      // Arrange
      const getChangesetExtendedDataListUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const changesetExtendedDataListUrl = iModelsApiUrlFormatter.getChangesetExtendedDataListUrl(getChangesetExtendedDataListUrlParams);

      // Assert
      expect(changesetExtendedDataListUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/changesets/extendeddata");
    });
  });

  describe("Changeset Group urls", () => {
    it("should format changeset group list url", () => {
      // Arrange
      const getChangesetGroupListUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const changesetGroupListUrl = iModelsApiUrlFormatter.getChangesetGroupListUrl(getChangesetGroupListUrlParams);

      // Assert
      expect(changesetGroupListUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/changesetgroups");
    });

    it("should format single changeset group url", () => {
      // Arrange
      const getSingleChangesetGroupUrlParams = { iModelId: "IMODEL_ID", changesetGroupId: "GROUP_ID" };

      // Act
      const singleChangesetGroupUrl = iModelsApiUrlFormatter.getSingleChangesetGroupUrl(getSingleChangesetGroupUrlParams);

      // Assert
      expect(singleChangesetGroupUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/changesetgroups/GROUP_ID");
    });
  });

  describe("Checkpoint urls", () => {
    [
      {
        params: { iModelId: "IMODEL_ID" },
        expectedUrl: "https://api.bentley.com/imodels/IMODEL_ID/briefcases/checkpoint"
      },
      {
        params: { iModelId: "IMODEL_ID", namedVersionId: "NAMED_VERSION_ID" },
        expectedUrl: "https://api.bentley.com/imodels/IMODEL_ID/namedversions/NAMED_VERSION_ID/checkpoint"
      },
      {
        params: { iModelId: "IMODEL_ID", changesetId: "CHANGESET_ID" },
        expectedUrl: "https://api.bentley.com/imodels/IMODEL_ID/changesets/CHANGESET_ID/checkpoint"
      },
      {
        params: { iModelId: "IMODEL_ID", changesetIndex: 0 },
        expectedUrl: "https://api.bentley.com/imodels/IMODEL_ID/changesets/0/checkpoint"
      },
      {
        params: { iModelId: "IMODEL_ID", changesetIndex: 17 },
        expectedUrl: "https://api.bentley.com/imodels/IMODEL_ID/changesets/17/checkpoint"
      }
    ].forEach((testCase) => {
      it("should format checkpoint url", () => {
        // Act
        const checkpointUrl = iModelsApiUrlFormatter.getCheckpointUrl(testCase.params);

        // Assert
        expect(checkpointUrl).to.be.equal(testCase.expectedUrl);
      });
    });

    [
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/5/checkpoint",
        expectedChangesetIndex: 5
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/5/checkpoint/",
        expectedChangesetIndex: 5
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/55555555/checkpoint",
        expectedChangesetIndex: 55555555
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/9007199254740991/checkpoint",
        expectedChangesetIndex: 9007199254740991
      }
    ].forEach((testCase) => {
      it(`should parse checkpointUrl url with index ${testCase.expectedChangesetIndex}`, () => {
        // Act
        const { iModelId, changesetId, changesetIndex } = iModelsApiUrlFormatter.parseCheckpointUrl(testCase.url);

        // Assert
        expect(iModelId).to.be.equal("IMODEL_ID");
        expect(changesetId).to.be.undefined;
        expect(changesetIndex).to.be.equal(testCase.expectedChangesetIndex);
      });
    });

    [
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/CHANGESET_ID5/checkpoint",
        expectedChangesetId: "CHANGESET_ID5"
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/CHANGESET_ID/checkpoint/",
        expectedChangesetId: "CHANGESET_ID"
      },
      {
        url: "https://api.bentley.com/imodels/IMODEL_ID/changesets/5555555555555555555555555555555555555555/checkpoint",
        expectedChangesetId: "5555555555555555555555555555555555555555"
      }
    ].forEach((testCase) => {
      it(`should parse checkpointUrl url with id (${testCase.expectedChangesetId})`, () => {
        // Act
        const { iModelId, changesetId, changesetIndex } = iModelsApiUrlFormatter.parseCheckpointUrl(testCase.url);

        // Assert
        expect(iModelId).to.be.equal("IMODEL_ID");
        expect(changesetId).to.be.equal(testCase.expectedChangesetId);
        expect(changesetIndex).to.be.undefined;
      });
    });
  });

  describe("Thumbnail urls", () => {
    it("should format thumbnail url", () => {
      // Arrange
      const getThumbnailUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const thumbnailUrl = iModelsApiUrlFormatter.getThumbnailUrl(getThumbnailUrlParams);

      // Assert
      expect(thumbnailUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/thumbnail");
    });
  });

  describe("User urls", () => {
    it("should format user list url", () => {
      // Arrange
      const getUserListUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const userListUrl = iModelsApiUrlFormatter.getUserListUrl(getUserListUrlParams);

      // Assert
      expect(userListUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/users");
    });

    it("should format single user url", () => {
      // Arrange
      const getSingleUserUrlParams = { iModelId: "IMODEL_ID", userId: "USER_ID" };

      // Act
      const singleUserUrl = iModelsApiUrlFormatter.getSingleUserUrl(getSingleUserUrlParams);

      // Assert
      expect(singleUserUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/users/USER_ID");
    });

    it("should parse user url", () => {
      // Arrange
      const userUrl = "https://api.bentley.com/imodels/IMODEL_ID/users/USER_ID";

      // Act
      const { iModelId, userId } = iModelsApiUrlFormatter.parseUserUrl(userUrl);

      // Assert
      expect(iModelId).to.be.equal("IMODEL_ID");
      expect(userId).to.be.equal("USER_ID");
    });
  });

  describe("User Permission urls", () => {
    it("should format permissions url", () => {
      // Arrange
      const getUserPermissionsUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const userPermissionsUrl = iModelsApiUrlFormatter.getUserPermissionsUrl(getUserPermissionsUrlParams);

      // Assert
      expect(userPermissionsUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/permissions");
    });
  });

  describe("Operation urls", () => {
    it("should format create iModel operation details url", () => {
      // Arrange
      const getCreateIModelOperationDetailsUrlParams = { iModelId: "IMODEL_ID" };

      // Act
      const getCreateIModelOperationDetailsUrl = iModelsApiUrlFormatter.getCreateIModelOperationDetailsUrl(getCreateIModelOperationDetailsUrlParams);

      // Assert
      expect(getCreateIModelOperationDetailsUrl).to.be.equal("https://api.bentley.com/imodels/IMODEL_ID/operations/create");
    });
  });

  describe("Url parameter forming", () => {
    it("should append all url params", () => {
      // Arrange
      const getIModelListUrlParams = {
        urlParams: {
          iTwinId: "ITWIN_ID",
          name: "IMODEL_NAME",
          $skip: 1,
          $top: 2,
          $continuationToken: "TOKEN",
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
      expect(iModelListUrl).to.be.equal("https://api.bentley.com/imodels?iTwinId=ITWIN_ID&name=IMODEL_NAME&$skip=1&$top=2&$continuationToken=TOKEN&$orderBy=name asc&testParam1=1&testParam2=param2");
    });

    [
      {
        label: "single property asc",
        orderBy: { property: IModelOrderByProperty.Name, operator: OrderByOperator.Ascending },
        expectedUrlParams: "$orderBy=name asc"
      },
      {
        label: "single property desc",
        orderBy: { property: IModelOrderByProperty.Name, operator: OrderByOperator.Descending },
        expectedUrlParams: "$orderBy=name desc"
      },
      {
        label: "single property with no operator",
        orderBy: { property: IModelOrderByProperty.Name },
        expectedUrlParams: "$orderBy=name"
      },
      {
        label: "multiple properties",
        orderBy: [
          { property: IModelOrderByProperty.Name, operator: OrderByOperator.Ascending },
          { property: IModelOrderByProperty.CreatedDateTime, operator: OrderByOperator.Descending }
        ],
        expectedUrlParams: "$orderBy=name asc,createdDateTime desc"
      },
      {
        label: "multiple properties with no operator",
        orderBy: [
          { property: IModelOrderByProperty.Name },
          { property: IModelOrderByProperty.CreatedDateTime }
        ],
        expectedUrlParams: "$orderBy=name,createdDateTime"
      }
    ].forEach((testCase) => {
      it(`should append $orderBy correctly (${testCase.label})`, () => {
        // Arrange
        const getIModelListUrlParams = {
          urlParams: {
            iTwinId: "ITWIN_ID",
            $orderBy: testCase.orderBy
          }
        };

        // Act
        const iModelListUrl = iModelsApiUrlFormatter.getIModelListUrl(getIModelListUrlParams);

        // Assert
        expect(iModelListUrl).to.be.equal(`https://api.bentley.com/imodels?iTwinId=ITWIN_ID&${testCase.expectedUrlParams}`);
      });
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
            iTwinId: "ITWIN_ID",
            testValue: testCase.valueUnderTest
          }
        };

        // Act
        const iModelListUrl = iModelsApiUrlFormatter.getIModelListUrl(getIModelListUrlParams);

        // Assert
        expect(iModelListUrl).to.be.equal("https://api.bentley.com/imodels?iTwinId=ITWIN_ID");
      });
    });

    it("should append param if it is equal to 0", () => {
      // Arrange
      const getIModelListUrlParams = {
        urlParams: {
          iTwinId: "ITWIN_ID",
          testValue: 0
        }
      };

      // Act
      const iModelListUrl = iModelsApiUrlFormatter.getIModelListUrl(getIModelListUrlParams);

      // Assert
      expect(iModelListUrl).to.be.equal("https://api.bentley.com/imodels?iTwinId=ITWIN_ID&testValue=0");
    });
  });
});
