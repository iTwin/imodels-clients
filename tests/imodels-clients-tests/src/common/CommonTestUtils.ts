/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import * as path from "path";
import { IModelsClient as AuthoringIModelsClient } from "@itwin/imodels-client-authoring";
import { AuthorizationParam, IModelsClient as ManagementIModelsClient } from "@itwin/imodels-client-management";
import { TestIModelGroup } from "./TestIModelGroup";

export class TestSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestSetupFailed";
  }
}

export async function cleanUpIModels(params: AuthorizationParam & {
  iModelsClient: ManagementIModelsClient | AuthoringIModelsClient;
  projectId: string;
  testIModelGroup: TestIModelGroup;
}): Promise<void> {
  const iModels = params.iModelsClient.IModels.getMinimalList({
    authorization: params.authorization,
    urlParams: {
      projectId: params.projectId
    }
  });
  for await (const iModel of iModels)
    if (params.testIModelGroup.doesIModelBelongToContext(iModel.displayName))
      await params.iModelsClient.IModels.delete({
        authorization: params.authorization,
        iModelId: iModel.id
      });
}

export function createDirectory(directoryPath: string): void {
  if (fs.existsSync(directoryPath))
    return;

  const parentDirectory = path.dirname(directoryPath);
  createDirectory(parentDirectory);
  fs.mkdirSync(directoryPath);
}

export function cleanupDirectory(directory: string): void {
  if (fs.existsSync(directory)) {
    fs.rmdirSync(directory, { recursive: true });
    fs.mkdirSync(directory);
  }
}

let testInstanceId: string;
export function getTestRunId(): string {
  if (!testInstanceId)
    testInstanceId = createGuidValue();
  return testInstanceId;
}

export function createGuidValue(): string {
  // https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  // cspell:disable-next-line
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
