/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, IModelsClient, Lock } from "@itwin/imodels-client-authoring";

export interface BriefcaseMetadata {
  id: number;
  deviceName: string;
}

export interface NamedVersionMetadata {
  id: string;
  changesetId: string;
  changesetIndex: number;
}

export interface IModelMetadata {
  id: string;
  name: string;
  description: string;
}

export interface ReusableIModelMetadata extends IModelMetadata {
  briefcase: BriefcaseMetadata;
  namedVersions: NamedVersionMetadata[];
  lock: Lock;
}

export interface TestIModelSetupContext extends AuthorizationParam {
  iModelsClient: IModelsClient;
}

export interface IModelIdentificationByNameParams {
  projectId: string;
  iModelName: string;
}

export interface IModelIdParam {
  iModelId: string;
}
