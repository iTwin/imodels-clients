/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";
import { Container } from "inversify";
import { TestUtilBootstrapper } from "@itwin/imodels-client-test-utils";

let container: Container;
export function getTestDIContainer(): Container {
  if (container)
    return container;

  container = new Container();
  TestUtilBootstrapper.bind(container, path.join(__dirname, "..", ".env"));

  return container;
}
