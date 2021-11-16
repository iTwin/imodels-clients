/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, iModelOperations as ManagementiModelOperations, iModel, iModelsErrorCode, iModelsErrorImpl, sleep } from "@itwin/imodels-client-management";
import { iModelCreateResponse } from "../../base";
import { BaselineFileState } from "../../base/interfaces/apiEntities/BaselineFileInterfaces";
import { Constants } from "../../Constants";
import { BaselineFileOperations } from "../baselineFile/BaselineFileOperations";
import { OperationOptions } from "../OperationOptions";
import { CreateiModelFromBaselineParams } from "./iModelOperationParams";

export class iModelOperations<TOptions extends OperationOptions> extends ManagementiModelOperations<TOptions> {
  private _baselineFileOperations: BaselineFileOperations<TOptions>;

  constructor(options: TOptions) {
    super(options);
    this._baselineFileOperations = new BaselineFileOperations<TOptions>(options);
  }

  public async createFromBaseline(params: CreateiModelFromBaselineParams): Promise<iModel> {
    const { filePath: imodelFilePath, ...imodelMetadataProperties } = params.imodelProperties;
    const imodelCreateResponse = await this.sendPostRequest<iModelCreateResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.baseUri,
      body: {
        ...imodelMetadataProperties,
        baselineFile: {
          size: this._options.fileHandler.getFileSize(imodelFilePath)
        }
      }
    });

    const uploadUrl = imodelCreateResponse.iModel._links.upload.href;
    await this._options.fileHandler.uploadFile({ uploadUrl, sourceFilePath: imodelFilePath });

    const completeUrl = imodelCreateResponse.iModel._links.complete.href;
    await this.sendPostRequest({
      authorization: params.authorization,
      url: completeUrl,
      body: undefined
    });

    await this.waitForBaselineFileInitialization({
      authorization: params.authorization,
      imodelId: imodelCreateResponse.iModel.id
    });
    return this.getSingle({
      authorization: params.authorization,
      imodelId: imodelCreateResponse.iModel.id
    });
  }

  private async waitForBaselineFileInitialization(params: AuthorizationParam & { imodelId: string, timeOutInMs?: number }): Promise<void> {
    const sleepPeriodInMs = Constants.time.sleepPeriodInMs;
    const timeOutInMs = params.timeOutInMs ?? Constants.time.imodelInitiazationTimeOutInMs;
    for (let retries = Math.ceil(timeOutInMs / sleepPeriodInMs); retries > 0; --retries) {
      const baselineFileState = (await this._baselineFileOperations.getSingle(params)).state;

      if (baselineFileState === BaselineFileState.Initialized)
        return;

      if (baselineFileState !== BaselineFileState.WaitingForFile && baselineFileState !== BaselineFileState.InitializationScheduled)
        throw new iModelsErrorImpl({
          code: iModelsErrorCode.BaselineFileInitializationFailed,
          message: `Baseline File initialization failed with state '${baselineFileState}.'`
        });

      await sleep(sleepPeriodInMs);
    }

    throw new iModelsErrorImpl({
      code: iModelsErrorCode.BaselineFileInitializationFailed,
      message: "Timed out waiting for Baseline File initialization."
    });
  }
}
