/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClient, RequestContext } from "@itwin/imodels-client-authoring";

export interface TestiModelBriefcase {
  id: number;
  deviceName: string;
}

export interface TestiModelChangeset {
  id: string;
  index: number;
  description: string;
  parentId?: string;
  containingChanges: number;
}

export interface TestiModelNamedVersion {
  id: string;
  changesetId: string;
  changesetIndex: number;
}

export interface EmptyTestiModel {
  id: string;
  name: string;
  description: string;
}

export interface TestiModelWithChangesets extends EmptyTestiModel {
  briefcase: TestiModelBriefcase;
  changesets: TestiModelChangeset[];
}

export interface TestiModelWithChangesetsAndNamedVersions extends TestiModelWithChangesets {
  namedVersions: TestiModelNamedVersion[];
}

export interface TestiModelSetupContext {
  imodelsClient: iModelsClient;
  requestContext: RequestContext;
}

export interface iModelIdentificationByNameParams {
  projectId: string;
  imodelName: string;
}

export interface iModelIdParam {
  imodelId: string;
}

