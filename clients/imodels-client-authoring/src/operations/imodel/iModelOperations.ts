/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelOperations as ManagementiModelOperations, iModel, iModelResponse, RecursiveRequired, RequestContextParam, iModelsErrorImpl, iModelsErrorCode } from "@itwin/imodels-client-management";
import { FileHandler } from "../../base";
import { BaselineFileState } from "../../base/interfaces/apiEntities/BaselineFileInterfaces";
import { iModelsClientOptions } from "../../iModelsClient";
import { BaselineFileOperations } from "../baselineFile/BaselineFileOperations";
import { CreateiModelFromBaselineParams } from "./iModelOperationParams";

export class iModelOperations extends ManagementiModelOperations {
  private _fileHandler: FileHandler;
  private _baselineFileOperations: BaselineFileOperations;

  constructor(options: RecursiveRequired<iModelsClientOptions>) {
    super(options);
    this._fileHandler = options.fileHandler;
    this._baselineFileOperations = new BaselineFileOperations(options);
  }

  public async createFromBaseline(params: CreateiModelFromBaselineParams): Promise<iModel> {
    const imodelCreateResponse = await this.sendPostRequest<iModelResponse>({
      ...params,
      url: this._apiBaseUrl,
      body: {
        ...params.imodelProperties, baselineFile: {
          size: this._fileHandler.getFileSize(params.baselineFileProperties.path)
        }
      }
    });

    const uploadUrl = imodelCreateResponse.iModel._links.upload.href;
    await this._fileHandler.uploadFile(uploadUrl, params.baselineFileProperties.path);

    const completeUrl = imodelCreateResponse.iModel._links.complete.href;
    await this.sendPostRequest({
      ...params,
      url: completeUrl,
      body: undefined
    });

    await this.waitForiModelInitialization({ ...params, imodelId: imodelCreateResponse.iModel.id });
    return this.getById({ ...params, imodelId: imodelCreateResponse.iModel.id });
  }

  private async waitForiModelInitialization(params: RequestContextParam & { imodelId: string, timeOutInMs?: number }): Promise<void> {
    const sleepPeriodInMs = 1000;
    const timeOutInMs = params.timeOutInMs ?? 5 * 60 * 1000;
    for (let retries = Math.ceil(timeOutInMs / sleepPeriodInMs); retries > 0; --retries) {
      const baselineFileState = (await this._baselineFileOperations.getByiModelId(params)).state;

      if (baselineFileState === BaselineFileState.Initialized)
        return;

      if (baselineFileState !== BaselineFileState.WaitingForFile && baselineFileState !== BaselineFileState.InitializationScheduled)
        throw new iModelsErrorImpl({
          code: iModelsErrorCode.InitializationFailed,
          message: `iModel initialization failed with state '${baselineFileState}'`
        });
    }

    throw new iModelsErrorImpl({
      code: iModelsErrorCode.InitializationFailed,
      message: "Timed out waiting for iModel initialization."
    });
  }
}
