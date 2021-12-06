/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Link, IModel } from "@itwin/imodels-client-management";

export interface IModelLinks {
  upload: Link;
  complete: Link;
}

export interface IModelCreateResponse {
  IModel: IModel & { _links: IModelLinks };
}
