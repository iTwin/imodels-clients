/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModel, IModelLinks } from "@itwin/imodels-client-management";

/**
 * Links that belong to iModel entity returned from iModels API.
 * @deprecated
 */
// eslint-disable-next-line deprecation/deprecation
export type iModelLinks = IModelLinks;

/**
 * DTO to hold a single iModel API response returned by iModel creation operation.
 * @deprecated
 */
export interface IModelCreateResponse {
  // eslint-disable-next-line deprecation/deprecation
  iModel: IModel & { _links: iModelLinks };
}
