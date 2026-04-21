/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  IModelsClient as AuthoringIModelsClient,
  IModelsClientOptions as AuthoringIModelsClientOptions,
  UpdateLockParams,
} from "@itwin/imodels-client-authoring";
import {
  AuthorizationCallback,
  GetLockListParams,
  IModelsClient,
  IModelsClientOptions,
  Lock,
  LockLevel,
  LockLevelFilter,
  ReleaseLocksChunkParams,
  toArray,
} from "@itwin/imodels-client-management";
import {
  IModelMetadata,
  ReusableIModelMetadata,
  ReusableTestIModelProvider,
  TestAuthorizationProvider,
  TestIModelCreator,
  TestIModelGroup,
  TestIModelGroupFactory,
  TestUtilTypes,
  assertCollection,
  assertLock,
} from "@itwin/imodels-client-test-utils";

import { Constants, getTestDIContainer, getTestRunId } from "../common";

describe("[Management] LockOperations", () => {
  let iModelsClient: IModelsClient;
  let authorization: AuthorizationCallback;

  let testIModelForRead: ReusableIModelMetadata;

  let testIModelGroup: TestIModelGroup;
  let testIModelForWrite: IModelMetadata;
  let testIModelForWriteBriefcaseIds: number[] = [];
  let authoringClient: AuthoringIModelsClient;

  before(async () => {
    const container = getTestDIContainer();

    const iModelsClientOptions = container.get<IModelsClientOptions>(
      TestUtilTypes.IModelsClientOptions
    );
    iModelsClient = new IModelsClient(iModelsClientOptions);

    const authorizationProvider = container.get(TestAuthorizationProvider);
    authorization = authorizationProvider.getAdmin1Authorization();

    const reusableTestIModelProvider = container.get(
      ReusableTestIModelProvider
    );
    testIModelForRead = await reusableTestIModelProvider.getOrCreate();

    const testIModelGroupFactory = container.get(TestIModelGroupFactory);
    testIModelGroup = testIModelGroupFactory.create({
      testRunId: getTestRunId(),
      packageName: Constants.PackagePrefix,
      testSuiteName: "ManagementLockOperations",
    });

    const authoringClientOptions =
      container.get<AuthoringIModelsClientOptions>(
        TestUtilTypes.IModelsClientOptions
      );
    authoringClient = new AuthoringIModelsClient(authoringClientOptions);

    const testIModelCreator = container.get(TestIModelCreator);
    testIModelForWrite = await testIModelCreator.createEmptyAndUploadChangesets(
      testIModelGroup.getPrefixedUniqueIModelName("Test iModel for write")
    );
  });

  afterEach(async () => {
    for (const briefcaseId of testIModelForWriteBriefcaseIds) {
      await iModelsClient.briefcases.release({
        authorization,
        iModelId: testIModelForWrite.id,
        briefcaseId,
      });
    }
    testIModelForWriteBriefcaseIds = [];
  });

  after(async () => {
    await testIModelGroup.cleanupIModels();
  });

  it("should return all items when querying collection", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForRead.id,
    };

    // Act
    const locks = iModelsClient.locks.getList(getLockListParams);

    // Assert
    await assertCollection({
      asyncIterable: locks,
      isEntityCountCorrect: (count) => count === 1,
    });
  });

  it("should return correct values when querying collection with briefcaseId filter", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForRead.id,
      urlParams: {
        briefcaseId: testIModelForRead.briefcases[0].id,
      },
    };

    // Act
    const locks = iModelsClient.locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    const lock = lockArray[0];
    assertLock({
      actualLock: lock,
      expectedLock: testIModelForRead.lock,
    });
  });

  it("should return empty collection when querying locks for non-existent briefcase", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForRead.id,
      urlParams: {
        briefcaseId: 500,
      },
    };

    // Act
    const locks = iModelsClient.locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    expect(lockArray.length).to.equal(0);
  });

  ([LockLevel.Shared, LockLevel.Exclusive] as LockLevelFilter[]).forEach(
    (lockLevel) => {
      it(`should return correct values when querying collection with lockLevel filter (${lockLevel})`, async () => {
        // Arrange
        const expectedLock: Lock = {
          briefcaseId: testIModelForRead.lock.briefcaseId,
          lockedObjects: testIModelForRead.lock.lockedObjects.filter(
            (lockedObject) => lockedObject.lockLevel === lockLevel
          ),
        };
        expect(expectedLock.lockedObjects.length).to.be.greaterThan(0);

        const getLockListParams: GetLockListParams = {
          authorization,
          iModelId: testIModelForRead.id,
          urlParams: {
            lockLevel,
          },
        };

        // Act
        const locks = iModelsClient.locks.getList(getLockListParams);

        // Assert
        const lockArray = await toArray(locks);
        expect(lockArray.length).to.be.equal(1);
        const actualLock = lockArray[0];
        assertLock({
          actualLock,
          expectedLock,
        });
      });
    }
  );

  it("should release locks chunk", async () => {
    // Arrange
    const briefcase = await authoringClient.briefcases.acquire({
      authorization,
      iModelId: testIModelForWrite.id,
    });
    testIModelForWriteBriefcaseIds.push(briefcase.briefcaseId);

    const updateLockParams: UpdateLockParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
      lockedObjects: [
        {
          lockLevel: LockLevel.Exclusive,
          objectIds: ["0xdd", "0xee", "0xff"],
        },
      ],
    };
    await authoringClient.locks.update(updateLockParams);

    const releaseLocksChunkParams: ReleaseLocksChunkParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      briefcaseId: briefcase.briefcaseId,
    };

    // Act
    const result =
      await iModelsClient.locks.releaseLocksChunk(releaseLocksChunkParams);

    // Assert
    expect(result.isLastChunk).to.be.true;

    const getLockListParams: GetLockListParams = {
      authorization,
      iModelId: testIModelForWrite.id,
      urlParams: {
        briefcaseId: briefcase.briefcaseId,
      },
    };
    const locks = iModelsClient.locks.getList(getLockListParams);
    const lockArray = await toArray(locks);
    expect(lockArray.length).to.equal(0);
  });

});
