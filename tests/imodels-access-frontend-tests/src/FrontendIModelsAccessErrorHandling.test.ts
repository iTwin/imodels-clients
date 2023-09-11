/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelHubStatus, IModelStatus } from "@itwin/core-bentley";
import { IModelError, IModelVersion } from "@itwin/core-common";
import { IModelIdArg } from "@itwin/core-frontend";
import { FrontendIModelsAccess } from "@itwin/imodels-access-frontend";
import { expect } from "chai";

import { IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-management";
import { ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestUtilTypes } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider";

describe("FrontendIModelsAccess error handling", () => {
  let frontendIModelsAccess: FrontendIModelsAccess;
  let accessToken: string;
  let testIModelForRead: ReusableIModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    const iModelsClient = new IModelsClient(iModelsClientOptions);
    frontendIModelsAccess = new FrontendIModelsAccess(iModelsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    const authorizationCallback = authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  });

  it("should throw IModelError if iModel does not exist when querying latest changeset", async () => {
    const getLatestChangesetParams: IModelIdArg = {
      accessToken,
      iModelId: "nonExistentiModelId"
    };

    await executeFuncAndAssertError(
      async () => frontendIModelsAccess.getLatestChangeset(getLatestChangesetParams),
      IModelHubStatus.iModelDoesNotExist
    );
  });

  it("should throw IModelError if iModel does not exist when resolving changeset for version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.named("non existent named version")
    };

    await executeFuncAndAssertError(
      async () => frontendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelHubStatus.iModelDoesNotExist
    );
  });

  it("should throw IModelError if named version does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: testIModelForRead.id,
      version: IModelVersion.named("non existent named version")
    };

    await executeFuncAndAssertError(
      async () => frontendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelStatus.NotFound
    );
  });

  it("should throw IModelError if changeset does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: testIModelForRead.id,
      version: IModelVersion.asOfChangeSet("nonExistentChangesetId")
    };

    await executeFuncAndAssertError(
      async () => frontendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelHubStatus.ChangeSetDoesNotExist
    );
  });

  it("should throw IModelError if iModel does not exist when resolving changeset from latest version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.latest()
    };

    await executeFuncAndAssertError(
      async () => frontendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelHubStatus.iModelDoesNotExist
    );
  });

  it("should throw IModelError if IModel does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IModelIdArg & { versionName: string } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      versionName: "non existent named version"
    };

    await executeFuncAndAssertError(
      async () => frontendIModelsAccess.getChangesetFromNamedVersion(getChangesetFromNamedVersionParams),
      IModelHubStatus.iModelDoesNotExist
    );
  });

  it("should throw IModelError if Named Version does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IModelIdArg & { versionName: string } = {
      accessToken,
      iModelId: testIModelForRead.id,
      versionName: "non existent named version"
    };

    await executeFuncAndAssertError(
      async () => frontendIModelsAccess.getChangesetFromNamedVersion(getChangesetFromNamedVersionParams),
      IModelStatus.NotFound
    );
  });

  async function executeFuncAndAssertError(func: () => (Promise<void> | Promise<unknown>), expectedErrorNumber: number): Promise<void> {
    let thrownError: unknown;
    try {
      await func();
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).to.not.be.undefined;
    expect(thrownError).to.be.instanceOf(IModelError);
    expect((thrownError as IModelError).errorNumber).to.be.equal(expectedErrorNumber);
    expect((thrownError as IModelError).message).to.not.be.empty;
  }
});
