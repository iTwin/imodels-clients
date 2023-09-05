/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { BriefcaseDbArg, ChangesetArg, ChangesetRangeArg, DownloadChangesetArg, IModelHost, IModelIdArg } from "@itwin/core-backend";
import { IModelHubStatus, IModelStatus } from "@itwin/core-bentley";
import { ChangesetFileProps, IModelError, IModelVersion } from "@itwin/core-common";
import { expect } from "chai";
import { getTestDIContainer } from "./TestDiContainerProvider";
import { IModelMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestUtilTypes, cleanupDirectory, createGuidValue } from "@itwin/imodels-client-test-utils";
import { TestIModelHostAuthorizationClient } from "./TestIModelHostAuthorizationClient";
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { IModelsClient, IModelsClientOptions } from "@itwin/imodels-client-authoring";
import path = require("path");

describe.only("BackendIModelsAccess (error handling)", () => {
  const testRunId = createGuidValue();

  let backendIModelsAccess: BackendIModelsAccess;

  let accessToken: string;
  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;
  let testIModelForRead: ReusableIModelMetadata;
  let testIModelForWrite: IModelMetadata;

  const testDownloadPath = path.join(__dirname, "../lib/testDownloads");

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(TestUtilTypes.IModelsClientOptions);
    const iModelsClient = new IModelsClient(iModelsClientOptions);
    backendIModelsAccess = new BackendIModelsAccess(iModelsClient);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    const authorizationCallback = authorizationProvider.getAdmin1Authorization();
    const authorization = await authorizationCallback();
    accessToken = `${authorization.scheme} ${authorization.token}`;
    IModelHost.authorizationClient = new TestIModelHostAuthorizationClient(accessToken);

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({
      testRunId,
      packageName: "IModelsAccessBackendTests",
      testSuiteName: "BackendIModelsAccess"
    });

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForWrite = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write"));
  });

  beforeEach(async () => {
    await cleanupDirectory(testDownloadPath);
  });

  it("should throw IModelError if changeset does not exist when downloading a single changeset", async () => {
    const downloadChangesetParams: DownloadChangesetArg = {
      accessToken,
      iModelId: testIModelForRead.id,
      targetDir: testDownloadPath,
      changeset: { index: 555 }
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.downloadChangeset(downloadChangesetParams),
      IModelHubStatus.ChangeSetDoesNotExist
    );
  })

  it("should throw IModelError if changeset does not exist when querying a single changeset", async () => {
    const queryChangesetParams: ChangesetArg = {
      accessToken,
      iModelId: testIModelForRead.id,
      changeset: { index: 555 }
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.queryChangeset(queryChangesetParams),
      IModelHubStatus.ChangeSetDoesNotExist
    );
  })

  it("should throw IModelError if iModel does not exist when querying changesets", async () => {
    const queryChangesetsParams: ChangesetRangeArg = {
      accessToken,
      iModelId: "nonExistentiModelId"
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.queryChangesets(queryChangesetsParams),
      IModelHubStatus.iModelDoesNotExist
    );
  })

  it("should throw IModelError if Briefcase does not exist when pushing changeset", async () => {
    const testIModelChangeset = testIModelFileProvider.changesets[0];
    const pushChangesetParams: IModelIdArg & { changesetProps: ChangesetFileProps } = {
      accessToken,
      iModelId: testIModelForWrite.id,
      changesetProps: {
        pathname: testIModelChangeset.filePath,
        id: testIModelChangeset.id,
        index: testIModelChangeset.index,
        parentId: testIModelChangeset.parentId,
        changesType: 0,
        description: testIModelChangeset.description,
        briefcaseId: 555,
        pushDate: new Date().toDateString(),
        userCreated: createGuidValue(),
        size: 555
      }
    }

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.pushChangeset(pushChangesetParams),
      IModelHubStatus.BriefcaseDoesNotExist
    );
  })

  it("should throw IModelError if iModel does not exist when querying latest changeset", async () => {
    const getLatestChangesetParams: IModelIdArg = {
      accessToken,
      iModelId: "nonExistentiModelId"
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getLatestChangeset(getLatestChangesetParams),
      IModelHubStatus.iModelDoesNotExist
    );
  });

  it("should throw IModel error if iModel does not exist when resolving changeset for version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.named("non existent named version")
    }

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelHubStatus.iModelDoesNotExist
    );
  });

  it("should throw IModel error if named version does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: testIModelForWrite.id,
      version: IModelVersion.named("non existent named version")
    }

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelStatus.NotFound
    );
  });

  it("should throw IModel error if changeset does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: testIModelForWrite.id,
      version: IModelVersion.asOfChangeSet("nonExistentChangesetId")
    }

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelHubStatus.ChangeSetDoesNotExist
    );
  });

  it("should throw IModel error if iModel does not exist when resolving changeset from latest version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.latest()
    }

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelHubStatus.iModelDoesNotExist
    );
  });





  it("should throw IModelError if iModel does not exist when releasing all locks", async () => {
    const briefcaseDbParams: BriefcaseDbArg = {
      accessToken,
      iModelId: "nonExistentiModelId",
      briefcaseId: 5,
      changeset: { id: "", index: 0 }
    };

    await executeFuncAndAssertError(
      () => backendIModelsAccess.releaseAllLocks(briefcaseDbParams),
      IModelHubStatus.iModelDoesNotExist
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
})