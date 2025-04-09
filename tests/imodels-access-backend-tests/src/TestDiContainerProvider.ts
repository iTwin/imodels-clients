/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import path from "node:path";

import { Container } from "inversify";

import { TestUtilBootstrapper } from "@itwin/imodels-client-test-utils";
import { fileURLToPath } from "node:url";

let container: Container;
export function getTestDIContainer(): Container {
  if (container)
    return container;

  container = new Container();
  TestUtilBootstrapper.bind(container, path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env"));

  return container;
}
