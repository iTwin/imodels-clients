/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { AuthorizationCallback, GetLockListParams, LockLevel, UpdateLockParams, IModelsClient, IModelsErrorCode, toArray } from "@itwin/imodels-client-authoring";
import { Config, Constants, ReusableTestIModelProvider, ReusableIModelMetadata, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, TestIModelCreator, TestIModelFileProvider, TestIModelGroup, assertCollection, assertError, assertLock, IModelMetadata } from "../common";

describe("[Authoring] LockOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testIModelGroup: TestIModelGroup;

  let testIModelForRead: ReusableIModelMetadata;
  let testIModelForWrite: IModelMetadata;
  let testIModelForWriteBriefcaseIds: number[] = [];

  before(async () => {
    iModelsClient = new IModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testIModelGroup = new TestIModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringLockOperations"
      }
    });

    testIModelForRead = await ReusableTestIModelProvider.getOrCreate({
      authorization,
      iModelsClient,
      projectId
    });
    testIModelForWrite = await TestIModelCreator.createEmptyAndUploadChangesets({
      iModelsClient,
      authorization,
      projectId,
      iModelName: testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write")
    });
  });

  afterEach(async () => {
    for (const briefcaseId of testIModelForWriteBriefcaseIds) {
      await iModelsClient.Briefcases.release({
        authorization,
        iModelId: testIModelForWrite.id,
        briefcaseId
      });
    }
    testIModelForWriteBriefcaseIds = [];
  });

  it("should return all items when querying collection", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForRead.id
    };

    // Act
    const locks = iModelsClient.Locks.getList(getLockListParams);

    // Assert
    await assertCollection({
      asyncIterable: locks,
      isEntityCountCorrect: (count) => count === 1
    });
  });

  it("should return correct values when querying collection with briefcaseId filter", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForRead.id,
      urlParams: {
        briefcaseId: testIModelForRead.briefcase.id
      }
    };

    // Act
    const locks = iModelsClient.Locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    const lock = lockArray[0];
    assertLock({
      actualLock: lock,
      expectedLock: testIModelForRead.lock
    });
  });

  it("should return empty collection when querying locks for non-existent briefcase", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForRead.id,
      urlParams: {
        briefcaseId: 500
      }
    };

    // Act
    const locks = iModelsClient.Locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    expect(lockArray.length).to.equal(0);
  });

  it("should acquire new locks", async () => {
    // Arrange
    const briefcase = await iModelsClient.Briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0xaa"]
        },
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0xbb"]
        }
      ]
    };

    // Act
    const acquiredLock = await iModelsClient.Locks.update(updateLockParams);

    // Assert
    assertLock({
      actualLock: acquiredLock,
      expectedLock: {
        briefcaseId: briefcase.briefcaseId,
        lockedObjects: updateLockParams.lockedObjects
      }
    });
  });

  it("should release locks", async () => {
    // Arrange
    const briefcase = await iModelsClient.Briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0xcc"]
        }
      ]
    };

    await iModelsClient.Locks.update(updateLockParams1);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      changesetId: TestIModelFileProvider.changesets[0].id,
      lockedObjects: [
        {
          lockLevel: LockLevel.None,
          objectIds: updateLockParams1.lockedObjects[0].objectIds
        }
      ]
    };

    // Act
    const releasedLock = await iModelsClient.Locks.update(updateLockParams2);

    // Assert
    assertLock({
      actualLock: releasedLock,
      expectedLock: {
        briefcaseId: briefcase.briefcaseId,
        lockedObjects: []
      }
    });
  });

  it("should return error when trying to update non-existing lock to LockLevel.None", async () => {
    // Arrange
    const briefcase = await iModelsClient.Briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.None,
          objectIds: ["0x1"]
        }
      ]
    };

    // Act
    let errorThrown: Error | undefined;
    try {
      await iModelsClient.Locks.update(updateLockParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: IModelsErrorCode.LockNotFound,
        message: "Requested Lock(s) is not available."
      }
    });
  });

  it("should return error when trying to update lock on non-existing iModel", async () => {
    // Arrange
    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: "invalid iModel id",
      briefcaseId: 0,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x2"]
        }
      ]
    };

    // Act
    let errorThrown: Error | undefined;
    try {
      await iModelsClient.Locks.update(updateLockParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: IModelsErrorCode.IModelNotFound,
        message: "Requested iModel is not available."
      }
    });
  });

  it("should return error when trying to update lock on non-existing briefcase", async () => {
    // Arrange
    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: 0,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x3"]
        }
      ]
    };

    // Act
    let errorThrown: Error | undefined;
    try {
      await iModelsClient.Locks.update(updateLockParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: IModelsErrorCode.BriefcaseNotFound,
        message: "Requested Briefcase is not available."
      }
    });
  });

  it("should return error when trying to update lock with non-existing changeset specified", async () => {
    // Arrange
    const briefcase = await iModelsClient.Briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      changesetId: "invalid changeset id",
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x4"]
        }
      ]
    };

    // Act
    let errorThrown: Error | undefined;
    try {
      await iModelsClient.Locks.update(updateLockParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: IModelsErrorCode.ChangesetNotFound,
        message: "Requested Changeset is not available."
      }
    });
  });

  it("should return error when trying to acquire exclusive lock on an object that is already locked by another briefcase", async () => {
    // Arrange
    const briefcase1 = await iModelsClient.Briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase1.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase1.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x5"]
        }
      ]
    };

    await iModelsClient.Locks.update(updateLockParams1);

    const briefcase2 = await iModelsClient.Briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase2.briefcaseId);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase2.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: updateLockParams1.lockedObjects[0].objectIds
        }
      ]
    };

    // Act
    let errorThrown: Error | undefined;
    try {
      await iModelsClient.Locks.update(updateLockParams2);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: IModelsErrorCode.ConflictWithAnotherUser,
        message: "Lock(s) is owned by another briefcase."
      }
    });
  });

  it("should return error when trying to acquire lock on an object that has been locked by a more recent changeset", async () => {
    // Arrange
    const briefcase1 = await iModelsClient.Briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase1.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      changesetId: TestIModelFileProvider.changesets[5].id,
      briefcaseId: briefcase1.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x5"]
        }
      ]
    };

    await iModelsClient.Locks.update(updateLockParams1);

    const briefcase2 = await iModelsClient.Briefcases.acquire({ authorization, iModelId: testIModelForWrite.id });
    testIModelForWriteBriefcaseIds.push(briefcase2.briefcaseId);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      changesetId: TestIModelFileProvider.changesets[4].id,
      briefcaseId: briefcase2.briefcaseId,
      lockedObjects: updateLockParams1.lockedObjects
    };

    // Act
    let errorThrown: Error | undefined;
    try {
      await iModelsClient.Locks.update(updateLockParams2);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: IModelsErrorCode.NewerChangesExist,
        message: "One or more objects have been locked in a newer Changeset."
      }
    });
  });
});
