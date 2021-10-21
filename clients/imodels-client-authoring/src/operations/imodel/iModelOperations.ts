/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelOperations as ManagementiModelOperations, RecursiveRequired, RequestContextParams, iModel, iModelsErrorCode, iModelsErrorImpl } from "@itwin/imodels-client-management";
import { FileHandler, iModelCreateResponse } from "../../base";
import { BaselineFileState } from "../../base/interfaces/apiEntities/BaselineFileInterfaces";
import { Constants } from "../../Constants";
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
    const { filePath: imodelFilePath, ...imodelMetadataProperties } = params.imodelProperties;
    const imodelCreateResponse = await this.sendPostRequest<iModelCreateResponse>({
      requestContext: params.requestContext,
      url: this._apiBaseUrl,
      body: {
        ...imodelMetadataProperties,
        baselineFile: {
          size: this._fileHandler.getFileSize(imodelFilePath)
        }
      }
    });

    const uploadUrl = imodelCreateResponse.iModel._links.upload.href;
    await this._fileHandler.uploadFile(uploadUrl, imodelFilePath);

    const completeUrl = imodelCreateResponse.iModel._links.complete.href;
    await this.sendPostRequest({
      requestContext: params.requestContext,
      url: completeUrl,
      body: undefined
    });

    await this.waitForBaselineFileInitialization({
      requestContext: params.requestContext,
      imodelId: imodelCreateResponse.iModel.id
    });
    return this.getById({
      requestContext: params.requestContext,
      imodelId: imodelCreateResponse.iModel.id
    });
  }

  private async waitForBaselineFileInitialization(params: RequestContextParams & { imodelId: string, timeOutInMs?: number }): Promise<void> {
    const sleepPeriodInMs = Constants.time.sleepPeriodInMs;
    const timeOutInMs = params.timeOutInMs ?? Constants.time.imodelInitiazationTimeOutInMs;
    for (let retries = Math.ceil(timeOutInMs / sleepPeriodInMs); retries > 0; --retries) {
      const baselineFileState = (await this._baselineFileOperations.getByiModelId(params)).state;

      if (baselineFileState === BaselineFileState.Initialized)
        return;

      if (baselineFileState !== BaselineFileState.WaitingForFile && baselineFileState !== BaselineFileState.InitializationScheduled)
        throw new iModelsErrorImpl({
          code: iModelsErrorCode.BaselineFileInitializationFailed,
          message: `Baseline File initialization failed with state '${baselineFileState}.'`
        });
    }

    throw new iModelsErrorImpl({
      code: iModelsErrorCode.BaselineFileInitializationFailed,
      message: "Timed out waiting for Baseline File initialization."
    });
  }
}
