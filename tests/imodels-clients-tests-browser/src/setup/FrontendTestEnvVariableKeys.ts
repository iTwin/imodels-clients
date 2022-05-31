/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
const frontendTestEnvVariableKeys = {
  iModelsClientApiOptions: "iModelsClientApiOptions",
  admin1AuthorizationInfo: "admin1AuthorizationInfo",

  testProjectId: "testProjectId",
  testIModelForReadId: "testIModelForReadId",

  testPngFilePath: "testPngFilePath",
} as const;

export { frontendTestEnvVariableKeys as FrontendTestEnvVariableKeys };