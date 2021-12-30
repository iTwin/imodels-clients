/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModel, Link } from "@itwin/imodels-client-management";

/** DTO to hold links that belong to iModel entity returned from iModels API. */
export interface IModelLinks {
  /** Link where to upload the iModel Baseline file. Link points to a remote storage. */
  upload: Link;
  /**
   * Link to confirm the Baseline file upload and complete the iModel creation process. Points to a specific
   * iModel Baseline instance in iModels API.
   */
  complete: Link;
}

/** DTO to hold a single iModel API response returned by iModel creation operation. */
export interface IModelCreateResponse {
  iModel: IModel & { _links: IModelLinks };
}
