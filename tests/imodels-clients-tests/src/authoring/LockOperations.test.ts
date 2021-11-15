/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { AuthorizationCallback, GetLockListParams, LockLevel, UpdateLockParams, iModelsClient, iModelsErrorCode, toArray } from "@itwin/imodels-client-authoring";
import { Config, Constants, ReusableTestiModelProvider, ReusableiModelMetadata, TestAuthorizationProvider, TestClientOptions, TestProjectProvider, TestiModelCreator, TestiModelFileProvider, TestiModelGroup, assertCollection, assertError, assertLock, iModelMetadata } from "../common";

describe("[Authoring] LockOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;

  let testiModelForRead: ReusableiModelMetadata;
  let testiModelForWrite: iModelMetadata;
  let testiModelForWriteBriefcaseIds: number[] = [];

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringLockOperations"
      }
    });

    testiModelForRead = await ReusableTestiModelProvider.getOrCreate({
      authorization,
      imodelsClient,
      projectId
    });
    testiModelForWrite = await TestiModelCreator.createEmptyAndUploadChangesets({
      imodelsClient,
      authorization,
      projectId,
      imodelName: testiModelGroup.getPrefixedUniqueiModelName("Test iModel for write")
    });
  });

  afterEach(async () => {
    for (const briefcaseId of testiModelForWriteBriefcaseIds) {
      await imodelsClient.Briefcases.release({
        authorization,
        imodelId: testiModelForWrite.id,
        briefcaseId
      });
    }
    testiModelForWriteBriefcaseIds = [];
  });

  it("should return all items when querying collection", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      imodelId: testiModelForRead.id
    };

    // Act
    const locks = imodelsClient.Locks.getList(getLockListParams);

    // Assert
    await assertCollection({
      asyncIterable: locks,
      isEntityCountCorrect: count => count === 1
    });
  });

  it("should return correct values when querying collection with briefcaseId filter", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      imodelId: testiModelForRead.id,
      urlParams: {
        briefcaseId: testiModelForRead.briefcase.id
      }
    };

    // Act
    const locks = imodelsClient.Locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    const lock = lockArray[0];
    assertLock({
      actualLock: lock,
      expectedLock: testiModelForRead.lock
    });
  });

  it("should return empty collection when querying locks for non-existent briefcase", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      imodelId: testiModelForRead.id,
      urlParams: {
        briefcaseId: 500
      }
    };

    // Act
    const locks = imodelsClient.Locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    expect(lockArray.length).to.equal(0);
  });

  it("should acquire new locks", async () => {
    // Arrange
    const briefcase = await imodelsClient.Briefcases.acquire({ authorization, imodelId: testiModelForWrite.id });
    testiModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
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
    const acquiredLock = await imodelsClient.Locks.update(updateLockParams);

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
    const briefcase = await imodelsClient.Briefcases.acquire({ authorization, imodelId: testiModelForWrite.id });
    testiModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0xcc"]
        }
      ]
    };

    await imodelsClient.Locks.update(updateLockParams1);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      changesetId: TestiModelFileProvider.changesets[0].id,
      lockedObjects: [
        {
          lockLevel: LockLevel.None,
          objectIds: updateLockParams1.lockedObjects[0].objectIds
        }
      ]
    };

    // Act
    const releasedLock = await imodelsClient.Locks.update(updateLockParams2);

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
    const briefcase = await imodelsClient.Briefcases.acquire({ authorization, imodelId: testiModelForWrite.id });
    testiModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.None,
          objectIds: ["0x1"]
        }
      ]
    };

    // Act
    let errorThrown: Error | undefined = undefined;
    try {
      await imodelsClient.Locks.update(updateLockParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: iModelsErrorCode.LockNotFound,
        message: "Requested Lock(s) is not available."
      }
    });
  });

  it("should return error when trying to update lock on non-existing imodel", async () => {
    // Arrange
    const updateLockParams: UpdateLockParams = {
      authorization,
      imodelId: "invalid imodel id",
      briefcaseId: 0,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x2"]
        }
      ]
    };

    // Act
    let errorThrown: Error | undefined = undefined;
    try {
      await imodelsClient.Locks.update(updateLockParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: iModelsErrorCode.iModelNotFound,
        message: "Requested iModel is not available."
      }
    });
  });

  it("should return error when trying to update lock on non-existing briefcase", async () => {
    // Arrange
    const updateLockParams: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
      briefcaseId: 0,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x3"]
        }
      ]
    };

    // Act
    let errorThrown: Error | undefined = undefined;
    try {
      await imodelsClient.Locks.update(updateLockParams);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: iModelsErrorCode.BriefcaseNotFound,
        message: "Requested Briefcase is not available."
      }
    });
  });

  it("should return error when trying to update lock with non-existing changeset specified", async () => {
    // Arrange
    const briefcase = await imodelsClient.Briefcases.acquire({ authorization, imodelId: testiModelForWrite.id });
    testiModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
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
    let errorThrown: Error | undefined = undefined;
    try {
      const resp = await imodelsClient.Locks.update(updateLockParams);
      console.log(resp);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: iModelsErrorCode.ChangesetNotFound,
        message: "Requested Changeset is not available."
      }
    });
  });

  it("should return error when trying to acquire exclusive lock on an object that is already locked by another briefcase", async () => {
    // Arrange
    const briefcase1 = await imodelsClient.Briefcases.acquire({ authorization, imodelId: testiModelForWrite.id });
    testiModelForWriteBriefcaseIds.push(briefcase1.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
      briefcaseId: briefcase1.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x5"]
        }
      ]
    };

    await imodelsClient.Locks.update(updateLockParams1);

    const briefcase2 = await imodelsClient.Briefcases.acquire({ authorization, imodelId: testiModelForWrite.id });
    testiModelForWriteBriefcaseIds.push(briefcase2.briefcaseId);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
      briefcaseId: briefcase2.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: updateLockParams1.lockedObjects[0].objectIds
        }
      ]
    };

    // Act
    let errorThrown: Error | undefined = undefined;
    try {
      await imodelsClient.Locks.update(updateLockParams2);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: iModelsErrorCode.ConflictWithAnotherUser,
        message: "Lock(s) is owned by another briefcase."
      }
    });
  });

  it("should return error when trying to acquire lock on an object that has been locked by a more recent changeset", async () => {
    // Arrange
    const briefcase1 = await imodelsClient.Briefcases.acquire({ authorization, imodelId: testiModelForWrite.id });
    testiModelForWriteBriefcaseIds.push(briefcase1.briefcaseId);

    const updateLockParams1: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
      changesetId: TestiModelFileProvider.changesets[5].id,
      briefcaseId: briefcase1.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Shared,
          objectIds: ["0x5"]
        }
      ]
    };

    await imodelsClient.Locks.update(updateLockParams1);

    const briefcase2 = await imodelsClient.Briefcases.acquire({ authorization, imodelId: testiModelForWrite.id });
    testiModelForWriteBriefcaseIds.push(briefcase2.briefcaseId);

    const updateLockParams2: UpdateLockParams = {
      authorization,
      imodelId: testiModelForWrite.id,
      changesetId: TestiModelFileProvider.changesets[4].id,
      briefcaseId: briefcase2.briefcaseId,
      lockedObjects: updateLockParams1.lockedObjects
    };

    // Act
    let errorThrown: Error | undefined = undefined;
    try {
      await imodelsClient.Locks.update(updateLockParams2);
    } catch (e) {
      errorThrown = e;
    }

    // Assert
    expect(errorThrown).to.not.be.undefined;
    assertError({
      actualError: errorThrown!,
      expectedError: {
        code: iModelsErrorCode.NewerChangesExist,
        message: "One or more objects have been locked in a newer Changeset."
      }
    });
  });
});
