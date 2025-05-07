/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import { ITwinError } from "@itwin/core-bentley";
import { IModelVersion } from "@itwin/core-common";
import { IModelIdArg } from "@itwin/core-frontend";
import { FrontendIModelsAccess } from "@itwin/imodels-access-frontend";
import {
  IModelsClient,
  IModelsClientOptions,
  IModelsErrorCode,
  IModelsErrorScope,
} from "@itwin/imodels-client-management";
import {
  ReusableIModelMetadata,
  ReusableTestIModelProvider,
  TestAuthorizationProvider,
  TestUtilTypes,
} from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider";

describe("FrontendIModelsAccess error handling", () => {
  let frontendIModelsAccess: FrontendIModelsAccess;
  let accessToken: string;
  let testIModelForRead: ReusableIModelMetadata;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(
      TestUtilTypes.IModelsClientOptions
    );
    const iModelsClient = new IModelsClient(iModelsClientOptions);
    frontendIModelsAccess = new FrontendIModelsAccess(iModelsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    const authorizationCallback =
      authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;

    const reusableTestIModelProvider = container.get(
      ReusableTestIModelProvider
    );
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();
  });

  it("should throw ITwinError if iModel does not exist when querying latest changeset", async () => {
    const getLatestChangesetParams: IModelIdArg = {
      accessToken,
      iModelId: "nonExistentiModelId",
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIModelsAccess.getLatestChangeset(getLatestChangesetParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when resolving changeset for version (IModelVersion.named)", async () => {
    const getChangesetFromVersionParams: IModelIdArg & {
      version: IModelVersion;
    } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.named("non existent named version"),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIModelsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if named version does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & {
      version: IModelVersion;
    } = {
      accessToken,
      iModelId: testIModelForRead.id,
      version: IModelVersion.named("non existent named version"),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIModelsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IModelsErrorCode.NamedVersionNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when resolving changeset for version (IModelVersion.asOfChangeSet)", async () => {
    const getChangesetFromVersionParams: IModelIdArg & {
      version: IModelVersion;
    } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.asOfChangeSet("nonExistentChangesetId"),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIModelsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if changeset does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & {
      version: IModelVersion;
    } = {
      accessToken,
      iModelId: testIModelForRead.id,
      version: IModelVersion.asOfChangeSet("nonExistentChangesetId"),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIModelsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IModelsErrorCode.ChangesetNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when resolving changeset from latest version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & {
      version: IModelVersion;
    } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.latest(),
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIModelsAccess.getChangesetFromVersion(
          getChangesetFromVersionParams
        ),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if IModel does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IModelIdArg & {
      versionName: string;
    } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      versionName: "non existent named version",
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIModelsAccess.getChangesetFromNamedVersion(
          getChangesetFromNamedVersionParams
        ),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if Named Version does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IModelIdArg & {
      versionName: string;
    } = {
      accessToken,
      iModelId: testIModelForRead.id,
      versionName: "non existent named version",
    };

    await executeFuncAndAssertError(
      async () =>
        frontendIModelsAccess.getChangesetFromNamedVersion(
          getChangesetFromNamedVersionParams
        ),
      IModelsErrorCode.NamedVersionNotFound
    );
  });

  async function executeFuncAndAssertError(
    func: () => Promise<void> | Promise<unknown>,
    expectedErrorCode: string
  ): Promise<void> {
    let thrownError: unknown;
    try {
      await func();
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(
      ITwinError.isError(thrownError, IModelsErrorScope, expectedErrorCode)
    ).to.be.true;
    expect(thrownError).to.not.be.undefined;
    expect((thrownError as ITwinError).message).to.not.be.empty;
  }
});
