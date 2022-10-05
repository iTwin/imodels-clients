/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Changeset } from "@itwin/imodels-client-management";

import { DownloadedFileProps } from "../CommonInterfaces";

/** Changeset metadata along with the downloaded file path. */
export type DownloadedChangeset = Changeset & DownloadedFileProps;
