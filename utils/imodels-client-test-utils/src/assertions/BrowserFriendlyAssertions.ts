/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { expect } from "chai";

import {
  Application,
  Briefcase,
  ChangesetExtendedData,
  Checkpoint,
  CheckpointState,
  ContentType,
  EntityListIterator,
  IModel,
  IModelPermission,
  IModelProperties,
  IModelState,
  IModelsError,
  IModelsErrorDetail,
  Link,
  MinimalBriefcase,
  MinimalIModel,
  MinimalNamedVersion,
  MinimalUser,
  NamedVersion,
  NamedVersionPropertiesForCreate,
  NamedVersionState,
  Thumbnail,
  ThumbnailSize,
  User,
  UserPermissions,
} from "@itwin/imodels-client-management";

import {
  assertBriefcaseCallbacks,
  assertIModelCallbacks,
  assertNamedVersionCallbacks,
} from "./RelatedEntityCallbackAssertions";

export async function assertCollection<T>(params: {
  asyncIterable: EntityListIterator<T>;
  isEntityCountCorrect: (count: number) => boolean;
}): Promise<void> {
  let entityCount = 0;
  for await (const entity of params.asyncIterable) {
    expect(entity).to.exist;
    entityCount++;
  }
  expect(params.isEntityCountCorrect(entityCount)).to.equal(true);
}

export function assertMinimalIModel(params: {
  actualIModel: MinimalIModel;
}): void {
  expect(params.actualIModel).to.exist;
  expect(params.actualIModel.id).to.not.be.empty;
  expect(params.actualIModel.displayName).to.not.be.empty;
}

export async function assertIModel(params: {
  actualIModel: IModel;
  expectedIModelProperties: IModelProperties;
}): Promise<void> {
  assertMinimalIModel({
    actualIModel: params.actualIModel,
  });

  expect(params.actualIModel.name).to.equal(
    params.expectedIModelProperties.name
  );
  assertOptionalProperty(
    params.expectedIModelProperties.description,
    params.actualIModel.description
  );
  assertOptionalProperty(
    params.expectedIModelProperties.extent,
    params.actualIModel.extent
  );
  expect(params.actualIModel.containersEnabled).to.equal(
    params.expectedIModelProperties.containersEnabled
  );
  expect(params.actualIModel.createdDateTime).to.not.be.empty;
  expect(params.actualIModel.state).to.equal(IModelState.Initialized);
  expect(params.actualIModel.dataCenterLocation).to.not.be.empty;

  await assertIModelCallbacks({
    iModel: params.actualIModel,
  });
}

export function assertMinimalBriefcase(params: {
  actualBriefcase: MinimalBriefcase;
}): void {
  expect(params.actualBriefcase).to.exist;
  expect(params.actualBriefcase.id).to.not.be.empty;
  expect(params.actualBriefcase.displayName).to.not.be.empty;
}

export async function assertBriefcase(params: {
  actualBriefcase: Briefcase;
  expectedBriefcaseProperties: {
    deviceName: string;
    briefcaseId?: number;
    ownerId?: string;
  };
}): Promise<void> {
  assertMinimalBriefcase({
    actualBriefcase: params.actualBriefcase,
  });

  if (params.expectedBriefcaseProperties.ownerId)
    expect(params.actualBriefcase.ownerId).to.be.equal(
      params.expectedBriefcaseProperties.ownerId
    );
  else expect(params.actualBriefcase.ownerId).to.not.be.empty;

  expect(params.actualBriefcase.acquiredDateTime).to.not.be.empty;

  expect(params.actualBriefcase.fileSize).to.be.greaterThan(0);
  assertOptionalProperty(
    params.expectedBriefcaseProperties?.deviceName,
    params.actualBriefcase.deviceName
  );

  if (params.expectedBriefcaseProperties.briefcaseId)
    expect(params.actualBriefcase.briefcaseId).to.equal(
      params.expectedBriefcaseProperties.briefcaseId
    );
  else expect(params.actualBriefcase.briefcaseId).to.be.greaterThan(0);

  assertApplication({
    actualApplication: params.actualBriefcase.application,
  });

  expect(params.actualBriefcase._links).to.exist;
  expect(params.actualBriefcase._links.owner).to.exist;
  expect(params.actualBriefcase._links.owner!.href).to.not.be.empty;
  expect(params.actualBriefcase._links.checkpoint).to.exist;
  expect(params.actualBriefcase._links.checkpoint!.href).to.not.be.empty;

  await assertBriefcaseCallbacks({
    briefcase: params.actualBriefcase,
  });
}

export function assertMinimalNamedVersion(params: {
  actualNamedVersion: MinimalNamedVersion;
  expectedNamedVersionProperties: Pick<
    NamedVersionPropertiesForCreate,
    "changesetId"
  > & {
    changesetIndex: number;
  };
}): void {
  expect(params.actualNamedVersion).to.exist;
  expect(params.actualNamedVersion.id).to.not.be.empty;
  expect(params.actualNamedVersion.displayName).to.not.be.empty;

  assertOptionalProperty(
    params.expectedNamedVersionProperties.changesetId,
    params.actualNamedVersion.changesetId
  );
  expect(params.actualNamedVersion.changesetIndex).to.equal(
    params.expectedNamedVersionProperties.changesetIndex
  );
}

export async function assertNamedVersion(params: {
  actualNamedVersion: NamedVersion;
  expectedNamedVersionProperties: NamedVersionPropertiesForCreate & {
    changesetIndex: number;
  };
  expectedLinks: {
    changeset: boolean;
  };
}): Promise<void> {
  assertMinimalNamedVersion({
    actualNamedVersion: params.actualNamedVersion,
    expectedNamedVersionProperties: params.expectedNamedVersionProperties,
  });

  expect(params.actualNamedVersion.name).to.equal(
    params.expectedNamedVersionProperties.name
  );
  assertOptionalProperty(
    params.expectedNamedVersionProperties.description,
    params.actualNamedVersion.description
  );
  expect(params.actualNamedVersion.state).to.equal(NamedVersionState.Visible);

  assertApplication({
    actualApplication: params.actualNamedVersion.application,
  });

  expect(params.actualNamedVersion._links).to.exist;
  expect(params.actualNamedVersion._links.creator).to.exist;
  expect(params.actualNamedVersion._links.creator?.href).to.not.be.empty;
  assertOptionalLink({
    actualLink: params.actualNamedVersion._links.changeset,
    shouldLinkExist: params.expectedLinks.changeset,
  });

  await assertNamedVersionCallbacks({
    namedVersion: params.actualNamedVersion,
    shouldChangesetExist: params.expectedLinks.changeset,
  });
}

export function assertCheckpoint(params: {
  actualCheckpoint: Checkpoint;
  expectedCheckpointProperties: {
    changesetId?: string;
    changesetIndex?: number;
    state: CheckpointState;
  };
}): void {
  if (params.expectedCheckpointProperties.changesetId)
    expect(params.actualCheckpoint.changesetId).to.equal(
      params.expectedCheckpointProperties.changesetId
    );

  if (params.expectedCheckpointProperties.changesetIndex != null)
    expect(params.actualCheckpoint.changesetIndex).to.equal(
      params.expectedCheckpointProperties.changesetIndex
    );
  else
    expect(params.actualCheckpoint.changesetIndex).to.be.greaterThanOrEqual(0);

  expect(params.actualCheckpoint.state).to.equal(
    params.expectedCheckpointProperties.state
  );

  expect(params.actualCheckpoint.directoryAccessInfo).to.not.be.null;
  expect(params.actualCheckpoint.directoryAccessInfo!.baseUrl).to.not.be.empty;
  expect(params.actualCheckpoint.directoryAccessInfo!.baseDirectory).to.not.be
    .empty;
  expect(
    params.actualCheckpoint.directoryAccessInfo?.azure?.sasToken ??
      params.actualCheckpoint.directoryAccessInfo?.google?.authorization
  ).to.not.be.empty;
  expect(params.actualCheckpoint.dbName).to.not.be.empty;

  expect(params.actualCheckpoint._links).to.exist;
  expect(params.actualCheckpoint._links.download).to.exist;
  expect(params.actualCheckpoint._links.download!.href).to.not.be.empty;
}

export function assertThumbnail(params: {
  actualThumbnail: Thumbnail;
  expectedThumbnailProperties: {
    size: ThumbnailSize;
  };
}): void {
  expect(params.actualThumbnail).to.exist;
  expect(params.actualThumbnail.image).to.exist;
  expect(params.actualThumbnail.image).to.not.be.empty;

  expect(params.actualThumbnail.size).to.be.equal(
    params.expectedThumbnailProperties.size
  );
  expect(params.actualThumbnail.imageType).to.be.equal(ContentType.Png);
}

export function assertMinimalUser(params: { actualUser: MinimalUser }): void {
  expect(params.actualUser).to.exist;
  expect(params.actualUser.id).to.not.be.empty;
  expect(params.actualUser.displayName).to.not.be.empty;

  expect(params.actualUser._links).to.exist;
  expect(params.actualUser._links.self).to.exist;
  expect(params.actualUser._links.self?.href).to.not.be.empty;
}

export function assertUser(params: { actualUser: User }): void {
  assertMinimalUser({
    actualUser: params.actualUser,
  });

  expect(params.actualUser.givenName).to.not.be.empty;
  expect(params.actualUser.surname).to.not.be.empty;
  expect(params.actualUser.email).to.not.be.empty;

  expect(params.actualUser.statistics).to.exist;
  expect(
    params.actualUser.statistics.pushedChangesetsCount
  ).to.be.greaterThanOrEqual(0);
  expect(
    params.actualUser.statistics.createdVersionsCount
  ).to.be.greaterThanOrEqual(0);
  expect(params.actualUser.statistics.briefcasesCount).to.greaterThanOrEqual(0);
}

export function assertUserStatistics(params: {
  actualUser: User;
  expectedUserStatistics: {
    pushedChangesetsCount: number;
    createdVersionsCount: number;
    briefcasesCount: number;
    applications: {
      ownsLocks: boolean;
      ownsExclusiveRootElementLock: boolean;
    }[];
  };
}): void {
  expect(params.actualUser.statistics).to.exist;
  expect(params.actualUser.statistics.pushedChangesetsCount).to.equal(
    params.expectedUserStatistics.pushedChangesetsCount
  );
  expect(params.actualUser.statistics.lastChangesetPushDate == null).to.equal(
    params.actualUser.statistics.pushedChangesetsCount == 0
  );
  expect(params.actualUser.statistics.createdVersionsCount).to.equal(
    params.expectedUserStatistics.createdVersionsCount
  );
  expect(params.actualUser.statistics.briefcasesCount).to.equal(
    params.expectedUserStatistics.briefcasesCount
  );
  expect(params.actualUser.statistics.applications.length).to.equal(
    params.expectedUserStatistics.applications.length
  );
  expect(params.actualUser.statistics.applications.length).to.equal(
    params.expectedUserStatistics.applications.length
  );

  for (let i = 0; i < params.actualUser.statistics.applications.length; i++) {
    const application = params.actualUser.statistics.applications[i];
    expect(application.id).to.not.be.empty;
    expect(application.name).to.not.be.empty;
    expect(application.ownsLocks).to.equal(
      params.expectedUserStatistics.applications[i].ownsLocks
    );
    expect(application.ownsExclusiveRootElementLock).to.equal(
      params.expectedUserStatistics.applications[i].ownsExclusiveRootElementLock
    );
  }
}

export function assertUserPermissions(params: {
  actualPermissions: UserPermissions;
  expectedPermissions: IModelPermission[];
}): void {
  expect(params.actualPermissions).to.exist;
  expect(params.actualPermissions.permissions).to.exist;
  expect(params.actualPermissions.permissions.length).to.be.equal(
    params.expectedPermissions.length
  );

  for (const actualIModelPermission of params.actualPermissions.permissions) {
    const isCurrentPermissionExpected = params.expectedPermissions.includes(
      actualIModelPermission
    );
    expect(isCurrentPermissionExpected).to.equal(true);
  }
}

export function assertChangesetExtendedDataBrowser(params: {
  actualChangesetExtendedData: ChangesetExtendedData;
  expectedChangesetExtendedData: {
    changesetIndex: number;
    data: object;
  };
}): void {
  expect(params.actualChangesetExtendedData).to.exist;
  expect(params.actualChangesetExtendedData.changesetId).to.not.be.empty;
  expect(params.actualChangesetExtendedData.changesetIndex).to.equal(
    params.expectedChangesetExtendedData.changesetIndex
  );
  expect(params.actualChangesetExtendedData.data).to.deep.equal(
    params.expectedChangesetExtendedData.data
  );
}

export function assertError(params: {
  objectThrown: unknown;
  expectedError: Partial<IModelsError>;
}): void {
  expect(params.objectThrown).is.not.undefined;
  expect(params.objectThrown instanceof Error);

  const iModelsError = params.objectThrown as IModelsError;
  expect(iModelsError).to.exist;
  expect(iModelsError.code).to.equal(params.expectedError.code);
  expect(iModelsError.name).to.equal(params.expectedError.code);
  expect(iModelsError.message).to.equal(params.expectedError.message);

  if (params.expectedError.details) {
    expect(iModelsError.details).to.exist;
    expect(iModelsError.details!.length).to.equal(
      params.expectedError.details.length
    );

    for (const expectedDetail of params.expectedError.details) {
      const detailVerificationFunc = (detail: IModelsErrorDetail) =>
        detail.code === expectedDetail.code &&
        detail.message === expectedDetail.message &&
        detail.target === expectedDetail.target;
      expect(iModelsError.details!.find(detailVerificationFunc)).to.exist;
    }
  } else {
    expect(iModelsError.details).to.be.undefined;
  }

  if (params.expectedError.originalError) {
    expect(iModelsError.originalError).to.exist;
    expect(iModelsError.originalError!.code).to.equal(
      params.expectedError.originalError.code
    );
    expect(iModelsError.originalError!.message).to.equal(
      params.expectedError.originalError.message
    );
  }
}

export function assertOptionalProperty<TPropertyType>(
  expectedValue: TPropertyType,
  actualValue: TPropertyType
): void {
  if (expectedValue) expect(actualValue).to.deep.equal(expectedValue);
  else expect(actualValue).to.equal(null);
}

export function assertOptionalLink(params: {
  actualLink: Link | null | undefined;
  shouldLinkExist: boolean;
}): void {
  if (params.shouldLinkExist) {
    expect(params.actualLink).to.exist;
    expect(params.actualLink!.href).to.not.be.empty;
  } else {
    expect(params.actualLink).to.equal(null);
  }
}

export function assertApplication(params: {
  actualApplication: Application | null;
}): void {
  expect(params.actualApplication).to.exist;
  expect(params.actualApplication!.id).to.not.be.empty;
  expect(params.actualApplication!.name).to.not.be.empty;
}
