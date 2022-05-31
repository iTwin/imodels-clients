/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Link } from "@itwin/imodels-client-management";

export function assertLink(link: Link | null | undefined): asserts link is Link {
  if (!link || !link.href)
    throw new Error("Assertion failed: link is falsy.");
}
