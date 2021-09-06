/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModel, Link } from "@itwin/imodels-client-management";

export interface iModelLinks {
  upload: Link;
  complete: Link;
}

export interface iModelCreateResponse {
  iModel: iModel & { _links: iModelLinks };
}