/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import path from "node:path";
import { AcquireNewBriefcaseIdArg, BriefcaseDbArg, BriefcaseIdArg, ChangesetArg, ChangesetRangeArg, CheckpointProps, CreateNewIModelProps, DownloadChangesetArg, DownloadRequest, IModelHost, IModelIdArg, IModelNameArg, ITwinIdArg, LockMap, LockState } from "@itwin/core-backend";
import { ITwinError } from "@itwin/core-bentley";
import { ChangesetFileProps, IModelVersion } from "@itwin/core-common";
import { BackendIModelsAccess } from "@itwin/imodels-access-backend";
import { expect } from "chai";

import { IModelsClient, IModelsClientOptions, IModelsErrorCode, IModelsErrorScope } from "@itwin/imodels-client-authoring";
import { IModelMetadata, ReusableIModelMetadata, ReusableTestIModelProvider, TestAuthorizationProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, TestIModelGroupFactory, TestITwinProvider, TestUtilTypes, cleanupDirectory, createGuidValue } from "@itwin/imodels-client-test-utils";

import { getTestDIContainer } from "./TestDiContainerProvider.js";
import { TestIModelHostAuthorizationClient } from "./TestIModelHostAuthorizationClient.js";
import { fileURLToPath } from "node:url";

describe("BackendIModelsAccess error handling", () => {
  const testRunId = createGuidValue();

  let backendIModelsAccess: BackendIModelsAccess;

  let accessToken: string;
  let iTwinId: string;

  let testIModelFileProvider: TestIModelFileProvider;
  let testIModelGroup: TestIModelGroup;
  let testIModelForRead: ReusableIModelMetadata;
  let testIModelForWrite: IModelMetadata;

  const testDownloadPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../lib/esm/testDownloads");

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
    await IModelHost.startup();

    const testITwinProvider = container.get(TestITwinProvider);
    iTwinId = await testITwinProvider.getOrCreate();

    testIModelFileProvider = container.get(TestIModelFileProvider);

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({
      testRunId,
      packageName: "IModelsAccessBackendTests",
      testSuiteName: "BackendIModelsAccess errors"
    });

    const reusableTestIModelProvider = container.get(ReusableTestIModelProvider);
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForWrite = await testIModelCreator.createEmpty(testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write"));
  });

  beforeEach(async () => {
    await cleanupDirectory(testDownloadPath);
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  it("should throw ITwinError if changeset does not exist when downloading a single changeset", async () => {
    const downloadChangesetParams: DownloadChangesetArg = {
      accessToken,
      iModelId: testIModelForRead.id,
      targetDir: testDownloadPath,
      changeset: { index: 555 }
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.downloadChangeset(downloadChangesetParams),
      IModelsErrorCode.ChangesetNotFound
    );
  });

  it("should throw ITwinError if changeset does not exist when querying a single changeset", async () => {
    const queryChangesetParams: ChangesetArg = {
      accessToken,
      iModelId: testIModelForRead.id,
      changeset: { index: 555 }
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.queryChangeset(queryChangesetParams),
      IModelsErrorCode.ChangesetNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when querying changesets", async () => {
    const queryChangesetsParams: ChangesetRangeArg = {
      accessToken,
      iModelId: "nonExistentiModelId"
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.queryChangesets(queryChangesetsParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if Briefcase does not exist when pushing changeset", async () => {
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
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.pushChangeset(pushChangesetParams),
      IModelsErrorCode.BriefcaseNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when querying latest changeset", async () => {
    const getLatestChangesetParams: IModelIdArg = {
      accessToken,
      iModelId: "nonExistentiModelId"
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getLatestChangeset(getLatestChangesetParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when resolving changeset for version (IModelVersion.named)", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.named("non existent named version")
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if named version does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: testIModelForWrite.id,
      version: IModelVersion.named("non existent named version")
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelsErrorCode.NamedVersionNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when resolving changeset for version (IModelVersion.asOfChangeSet)", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.asOfChangeSet("nonExistentChangesetId")
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if changeset does not exist when resolving changeset from version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: testIModelForWrite.id,
      version: IModelVersion.asOfChangeSet("nonExistentChangesetId")
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelsErrorCode.ChangesetNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when resolving changeset from latest version", async () => {
    const getChangesetFromVersionParams: IModelIdArg & { version: IModelVersion } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      version: IModelVersion.latest()
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromVersion(getChangesetFromVersionParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if IModel does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IModelIdArg & { versionName: string } = {
      accessToken,
      iModelId: "nonExistentiModelId",
      versionName: "non existent named version"
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromNamedVersion(getChangesetFromNamedVersionParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if Named Version does not exist when querying changeset for named version", async () => {
    const getChangesetFromNamedVersionParams: IModelIdArg & { versionName: string } = {
      accessToken,
      iModelId: testIModelForWrite.id,
      versionName: "non existent named version"
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.getChangesetFromNamedVersion(getChangesetFromNamedVersionParams),
      IModelsErrorCode.NamedVersionNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when acquiring briefcase", async () => {
    const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
      accessToken,
      iModelId: "nonExistentiModelId"
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.acquireNewBriefcaseId(acquireNewBriefcaseIdParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError when too many briefcases per user per minute are acquired", async () => {
    const briefcaseIds: number[] = [];
    try {
      const acquireNewBriefcaseIdParams: AcquireNewBriefcaseIdArg = {
        accessToken,
        iModelId: testIModelForWrite.id
      };

      const acquire6BriefcasesFunc = async () => {
        for (let i = 0; i < 6; i++) {
          const briefcaseId = await backendIModelsAccess.acquireNewBriefcaseId(acquireNewBriefcaseIdParams);
          briefcaseIds.push(briefcaseId);
        }
      };

      await executeFuncAndAssertError(
        acquire6BriefcasesFunc,
        IModelsErrorCode.MaximumNumberOfBriefcasesPerUserPerMinute
      );

    } finally {
      for (const briefcaseId of briefcaseIds) {
        const releaseBriefcaseParams: BriefcaseIdArg = {
          accessToken,
          iModelId: testIModelForWrite.id,
          briefcaseId
        };
        await backendIModelsAccess.releaseBriefcase(releaseBriefcaseParams);
      }
    }
  });

  it("should throw ITwinError if briefcase does not exist when releasing briefcase", async () => {
    const releaseBriefcaseParams: BriefcaseIdArg = {
      accessToken,
      iModelId: testIModelForWrite.id,
      briefcaseId: 555
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.releaseBriefcase(releaseBriefcaseParams),
      IModelsErrorCode.BriefcaseNotFound
    );
  });

  it("should throw ITwinError if changeset does not exist when downloading V1 checkpoint for specific changeset", async () => {
    const downloadV1CheckpointParams: DownloadRequest = {
      localFile: path.join(testDownloadPath, "error handling v1.bim"),
      checkpoint: {
        accessToken,
        iTwinId: "",
        iModelId: testIModelForWrite.id,
        changeset: { id: "nonExistentChangesetId" }
      }
    };

    await executeFuncAndAssertError(
      // eslint-disable-next-line deprecation/deprecation
      async () => backendIModelsAccess.downloadV1Checkpoint(downloadV1CheckpointParams),
      IModelsErrorCode.ChangesetNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when downloading baseline V1 checkpoint", async () => {
    const downloadV1CheckpointParams: DownloadRequest = {
      localFile: path.join(testDownloadPath, "error handling v1.bim"),
      checkpoint: {
        accessToken,
        iTwinId: "",
        iModelId: "nonExistentiModelId",
        changeset: { id: "", index: 0 }
      }
    };

    await executeFuncAndAssertError(
      // eslint-disable-next-line deprecation/deprecation
      async () => backendIModelsAccess.downloadV1Checkpoint(downloadV1CheckpointParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when querying V2 checkpoint", async () => {
    const queryV2CheckpointParams: CheckpointProps = {
      accessToken,
      iTwinId: "",
      iModelId: "nonExistentiModelId",
      changeset: { id: "nonExistentChangesetId" }
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.queryV2Checkpoint(queryV2CheckpointParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if briefcase does not exist when acquiring locks", async () => {
    const briefcaseDbParams: BriefcaseDbArg = {
      accessToken,
      iModelId: testIModelForWrite.id,
      briefcaseId: 555,
      changeset: { id: "", index: 0 }
    };
    // eslint-disable-next-line deprecation/deprecation
    const locksToAcquire: LockMap = new Map<string, LockState>([
      // eslint-disable-next-line deprecation/deprecation
      ["0x1", LockState.Exclusive],
      // eslint-disable-next-line deprecation/deprecation
      ["0x2", LockState.Exclusive],
      // eslint-disable-next-line deprecation/deprecation
      ["0x3", LockState.Shared]
    ]);

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.acquireLocks(briefcaseDbParams, locksToAcquire),
      IModelsErrorCode.BriefcaseNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when querying all locks", async () => {
    const queryAllLocksParams: BriefcaseDbArg = {
      accessToken,
      iModelId: "nonExistentiModelId",
      briefcaseId: 555,
      changeset: { id: "", index: 0 }
    };
    await executeFuncAndAssertError(
      async () => backendIModelsAccess.queryAllLocks(queryAllLocksParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if iModel does not exist when releasing all locks", async () => {
    const briefcaseDbParams: BriefcaseDbArg = {
      accessToken,
      iModelId: "nonExistentiModelId",
      briefcaseId: 5,
      changeset: { id: "", index: 0 }
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.releaseAllLocks(briefcaseDbParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  it("should throw ITwinError if iTwin does not exist when querying iModel with specific name", async () => {
    const queryIModelByNameParams: IModelNameArg = {
      accessToken,
      iTwinId: createGuidValue(),
      iModelName: "nonExistentiModelName"
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.queryIModelByName(queryIModelByNameParams),
      IModelsErrorCode.ITwinNotFound
    );
  });

  it("should throw ITwinError if user attempts to create iModel with duplicate name", async () => {
    const createNewIModelParams: CreateNewIModelProps = {
      accessToken,
      iTwinId,
      iModelName: testIModelForRead.name
    };

    await executeFuncAndAssertError(
      async () => backendIModelsAccess.createNewIModel(createNewIModelParams),
      IModelsErrorCode.IModelExists
    );
  });

  it("should throw ITwinError if user attempts to delete nonexistent iModel", async () => {
    const deleteIModelParams: IModelIdArg & ITwinIdArg = {
      accessToken,
      iModelId: "nonExistentiModelId",
      iTwinId: ""
    };
    await executeFuncAndAssertError(
      async () => backendIModelsAccess.deleteIModel(deleteIModelParams),
      IModelsErrorCode.IModelNotFound
    );
  });

  async function executeFuncAndAssertError(func: () => (Promise<void> | Promise<unknown>), expectedErrorCode: string): Promise<void> {
    let thrownError: unknown;
    try {
      await func();
    } catch (error: unknown) {
      thrownError = error;
    }

    expect(thrownError).to.not.be.undefined;
    expect(ITwinError.isError(thrownError, IModelsErrorScope, expectedErrorCode)).to.be.true;
    expect((thrownError as ITwinError).message).to.not.be.empty;
  }
});
