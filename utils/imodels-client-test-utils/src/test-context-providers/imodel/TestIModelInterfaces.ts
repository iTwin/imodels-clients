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
  name: string;
  changesetId: string;
  changesetIndex: number;
}

export interface ChangesetExtendedDataMetadata {
  changesetId: string;
  changesetIndex: number;
  data: object;
}

export interface ChangesetGroupMetadata {
  id: string;
  description: string;
  changesetIndexes: number[];
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
  changesetExtendedData: ChangesetExtendedDataMetadata[];
  changesetGroups: ChangesetGroupMetadata[];
}

export interface TestIModelSetupContext extends AuthorizationParam {
  iModelsClient: IModelsClient;
}

export interface IModelIdentificationByNameParams {
  iTwinId: string;
  iModelName: string;
}

export interface IModelIdParam {
  iModelId: string;
}
