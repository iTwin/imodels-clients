/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, iModelsClient } from "@itwin/imodels-client-authoring";

export interface BriefcaseMetadata {
  id: number;
  deviceName: string;
}

export interface NamedVersionMetadata {
  id: string;
  changesetId: string;
  changesetIndex: number;
}

export interface iModelMetadata {
  id: string;
  name: string;
  description: string;
}

export interface ReusableiModelMetadata extends iModelMetadata {
  briefcase: BriefcaseMetadata;
  namedVersions: NamedVersionMetadata[];
}

export interface TestiModelSetupContext extends AuthorizationParam {
  imodelsClient: iModelsClient;
}

export interface iModelIdentificationByNameParams {
  projectId: string;
  imodelName: string;
}

export interface iModelIdParam {
  imodelId: string;
}
