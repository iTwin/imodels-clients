/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { iModelsApiUrlFormatter } from "@itwin/imodels-client-management";

describe("iModelsApiUrlFormatter", () => {
  let imodelsApiUrlFormatter: iModelsApiUrlFormatter;
  let imodelsApiBaseUri: string;

  before(() => {
    imodelsApiBaseUri = "https://api.bentley.com/imodels";
    imodelsApiUrlFormatter = new iModelsApiUrlFormatter(imodelsApiBaseUri);
  });

  it("should format changesets url", () => {
    // Arrange
    const imodelId = "imodelId";
    const $skip = 10;
    const $top = 15;
    const afterIndex = 5;

    // Act
    const changesetsUrl = imodelsApiUrlFormatter.getChangesetsUrl({ imodelId, urlParams: { $skip, $top, afterIndex } });

    // Assert
    expect(changesetsUrl).to.be.equal("https://api.bentley.com/imodels/imodelId/changesets?$skip=10&$top=15&afterIndex=5")
  });

  it("should format changeset url with id", () => {
    // Arrange
    const imodelId = "imodelId";
    const changesetId = "changesetId";

    // Act
    const changesetUrl = imodelsApiUrlFormatter.getChangesetUrl({ imodelId, changesetIdOrIndex: changesetId });

    // Assert
    expect(changesetUrl).to.be.equal("https://api.bentley.com/imodels/imodelId/changesets/changesetId");
  });

  it("should format changeset url with index", () => {
    // Arrange
    const imodelId = "imodelId";
    const changesetIndex = 5;

    // Act
    const changesetUrl = imodelsApiUrlFormatter.getChangesetUrl({ imodelId, changesetIdOrIndex: changesetIndex });

    // Assert
    expect(changesetUrl).to.be.equal("https://api.bentley.com/imodels/imodelId/changesets/5");
  });

  it("should parse checkpoint url", () => {
    // Arrange
    const checkpointUrl = "https://api.bentley.com/imodels/imodelId/changesets/5/checkpoint";

    // Act
    const { imodelId, changesetIndex } = imodelsApiUrlFormatter.parseCheckpointUrl(checkpointUrl);

    // Assert
    expect(imodelId).to.be.equal("imodelId");
    expect(changesetIndex).to.be.equal(5);
  });

  it("should parse named version url", () => {
    // Arrange
    const namedVersionUrl = "https://api.bentley.com/imodels/imodelId/namedversions/namedVersionId";

    // Act
    const { imodelId, namedVersionId } = imodelsApiUrlFormatter.parseNamedVersionUrl(namedVersionUrl);

    // Assert
    expect(imodelId).to.be.equal("imodelId");
    expect(namedVersionId).to.be.equal("namedVersionId");
  });
});
