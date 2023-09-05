/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  CheckpointArg, CheckpointProps,
  V2CheckpointAccessProps
} from "@itwin/core-backend";
import axios, { AxiosResponse } from "axios";

import {
  Checkpoint,
  GetSingleChangesetParams,
  GetSingleCheckpointParams,
  IModelScopedOperationParams,
  IModelsClient
} from "@itwin/imodels-client-authoring";

import { Constants } from "./Constants";
import { handleAPIErrors } from "./ErrorHandlingFunctions";
import { ClientToPlatformAdapter } from "./interface-adapters/ClientToPlatformAdapter";
import { PlatformToClientAdapter } from "./interface-adapters/PlatformToClientAdapter";

export async function queryCurrentOrPrecedingV2Checkpoint(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams,
  checkpointProps: CheckpointProps
): Promise<V2CheckpointAccessProps | undefined> {
  const changesetIndex = await resolveChangesetIndexFromParamsOrQueryApi(iModelsClient, iModelScopedOperationParams, checkpointProps);

  if (changesetIndex === 0) {
    const baselineCheckpoint = await getBaselineCheckpoint(iModelsClient, iModelScopedOperationParams);
    if (!baselineCheckpoint?.containerAccessInfo)
      return undefined;
    return ClientToPlatformAdapter.toV2CheckpointAccessProps(baselineCheckpoint.containerAccessInfo);
  }

  const isQueriedCheckpointValid = (queriedCheckpoint: Checkpoint) => !!queriedCheckpoint.containerAccessInfo;
  const checkpoint = await findLatestCheckpointForChangeset(iModelsClient, iModelScopedOperationParams, changesetIndex, isQueriedCheckpointValid);
  if (checkpoint === undefined)
    return undefined;
  return ClientToPlatformAdapter.toV2CheckpointAccessProps(checkpoint.containerAccessInfo!);
}

export async function queryCurrentOrPrecedingV1Checkpoint(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams,
  // eslint-disable-next-line deprecation/deprecation
  checkpointArg: CheckpointArg
): Promise<Checkpoint | undefined> {
  const changesetIndex = await resolveChangesetIndexFromParamsOrQueryApi(iModelsClient, iModelScopedOperationParams, checkpointArg.checkpoint);

  if (changesetIndex === 0) {
    const baselineCheckpoint = await getBaselineCheckpoint(iModelsClient, iModelScopedOperationParams);
    return baselineCheckpoint;
  }

  const isQueriedCheckpointValid = (queriedCheckpoint: Checkpoint) => !!queriedCheckpoint._links.download;
  const checkpoint = await findLatestCheckpointForChangeset(iModelsClient, iModelScopedOperationParams, changesetIndex, isQueriedCheckpointValid);
  return checkpoint;
}

/**
 * iModels API returns a link to a file in Azure Blob Storage. The API does not return checkpoint file size as
 * a standalone property so we query it from Azure using the method described below.
 *
 * To get the total size of the file we send a GET request to the file download url with `Range: bytes=0-0` header
 * specified which requests to get only the first byte of the file. As a response we get the first file byte in
 * the body and `Content-Range` response header which contains information about the total file size. See
 * https://docs.microsoft.com/en-us/rest/api/storageservices/get-blob#response-headers,
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range.
 *
 * The format of returned `Content-Range` header in this case is
 * `<unit> <range-start>-<range-end>/<size>`, e.g. `bytes 0-0/1253376`.
 */
export async function getV1CheckpointSize(downloadUrl: string): Promise<number> {
  const emptyRangeHeaderValue = "bytes=0-0";
  const contentRangeHeaderName = "content-range";

  const response: AxiosResponse = await axios.get(downloadUrl, { headers: { Range: emptyRangeHeaderValue } });
  const rangeHeaderValue: string = response.headers[contentRangeHeaderName];
  const rangeTotalBytesString: string = rangeHeaderValue.split("/")[1];
  const rangeTotalBytes: number = parseInt(rangeTotalBytesString, 10);

  return rangeTotalBytes;
}

async function findLatestCheckpointForChangeset(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams,
  changesetIndex: number,
  isExpectedCheckpoint: (checkpoint: Checkpoint) => boolean
): Promise<Checkpoint | undefined> {
  if (changesetIndex <= 0)
    return undefined;

  const getSingleChangesetParams: GetSingleChangesetParams = {
    ...iModelScopedOperationParams,
    ...PlatformToClientAdapter.toChangesetIdOrIndex({ index: changesetIndex })
  };

  const changeset = await handleAPIErrors(
    async () => iModelsClient.changesets.getSingle(getSingleChangesetParams)
  );
  const checkpoint = await handleAPIErrors(
    async () => changeset.getCurrentOrPrecedingCheckpoint()
  );

  if (!checkpoint)
    return undefined;

  if (isExpectedCheckpoint(checkpoint))
    return checkpoint;

  const previousChangesetIndex = checkpoint.changesetIndex - 1;
  return findLatestCheckpointForChangeset(iModelsClient, iModelScopedOperationParams, previousChangesetIndex, isExpectedCheckpoint);
}

async function getBaselineCheckpoint(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams
): Promise<Checkpoint | undefined> {
  const getCheckpointParams: GetSingleCheckpointParams = {
    ...iModelScopedOperationParams,
    changesetIndex: 0
  };
  const result = await handleAPIErrors(
    async () => iModelsClient.checkpoints.getSingle(getCheckpointParams)
  );
  return result;
}

async function resolveChangesetIndexFromParamsOrQueryApi(
  iModelsClient: IModelsClient,
  iModelScopedOperationParams: IModelScopedOperationParams,
  checkpointProps: CheckpointProps
): Promise<number> {
  if (checkpointProps.changeset.id === Constants.ChangeSet0.id || checkpointProps.changeset.index === Constants.ChangeSet0.index)
    return Constants.ChangeSet0.index;

  if (checkpointProps.changeset.index !== undefined)
    return checkpointProps.changeset.index;

  const getSingleChangesetParams: GetSingleChangesetParams = {
    ...iModelScopedOperationParams,
    changesetId: checkpointProps.changeset.id
  };

  const changeset = await handleAPIErrors(
    async () => iModelsClient.changesets.getSingle(getSingleChangesetParams)
  );

  return changeset.index;
}
