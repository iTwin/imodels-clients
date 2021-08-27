/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelOperations as iModelOperations_Management, iModel, iModelResponse, RecursiveRequired } from "@itwin/imodels-client-management";
import { FileHandler } from "../../base";
import { iModelsClientOptions } from "../../iModelsClient";
import { CreateiModelFromBaselineParams } from "./iModelOperationParams";

export class iModelOperations extends iModelOperations_Management {
  private _fileHandler: FileHandler;

  constructor(options: RecursiveRequired<iModelsClientOptions>) {
    super(options);
    this._fileHandler = options.fileHandler;
  }

  public async createFromBaseline(params: CreateiModelFromBaselineParams): Promise<iModel> {
    const imodelCreateResponse = await this.sendPostRequest<iModelResponse>({
      ...params,
      url: this._apiBaseUrl,
      body: { ...params.imodelProperties, baselineFile: { size: this._fileHandler.getFileSize(params.baselineFileProperties.path) } }
    });

    const uploadUrl = imodelCreateResponse.iModel._links.upload.href;
    await this._fileHandler.uploadFile(uploadUrl, params.baselineFileProperties.path);

    const completeUrl = imodelCreateResponse.iModel._links.complete.href;
    await this.sendPostRequest({
      ...params,
      url: completeUrl,
      body: undefined
    });

    return this.getById({ ...params, imodelId: imodelCreateResponse.iModel.id });
  }
}
