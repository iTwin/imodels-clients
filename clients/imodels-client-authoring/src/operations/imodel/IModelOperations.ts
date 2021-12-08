/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, IModel, IModelsErrorCode, IModelsErrorImpl, IModelOperations as ManagementIModelOperations, sleep } from "@itwin/imodels-client-management";
import { IModelCreateResponse } from "../../base";
import { BaselineFileState } from "../../base/interfaces/apiEntities/BaselineFileInterfaces";
import { Constants } from "../../Constants";
import { BaselineFileOperations } from "../baselineFile/BaselineFileOperations";
import { OperationOptions } from "../OperationOptions";
import { CreateIModelFromBaselineParams, IModelPropertiesForCreateFromBaseline } from "./IModelOperationParams";

export class IModelOperations<TOptions extends OperationOptions> extends ManagementIModelOperations<TOptions> {
  private _baselineFileOperations: BaselineFileOperations<TOptions>;

  constructor(options: TOptions) {
    super(options);
    this._baselineFileOperations = new BaselineFileOperations<TOptions>(options);
  }

  /**
  * Creates an iModel from baseline with specified properties. Wraps the
  * {@link https://developer.bentley.com/apis/imodels/operations/create-imodel/ Create iModel} operation from iModels API.
  * Internally it creates the iModel instace, uploads the Baseline file, confirms Baseline
  * file upload and then repeatedly queries the Baseline file state until the iModel is initialized. The execution of this method
  * can take up to several minutes due to waiting for initialization to complete.
  * @param {CreateiModelFromBaselineParams} params parameters for this operation. See {@link CreateiModelFromBaselineParams}.
  * @returns {Promise<iModel>} newly created iModel. See {@link iModel}.
  * @throws an error that implements `iModelsError` interface with code `iModelsErrorCode.BaselineFileInitializationFailed` if Baseline file initialization failed
  * or did not complete in time. See {@link iModelsErrorCode}.
  */
  public async createFromBaseline(params: CreateIModelFromBaselineParams): Promise<IModel> {
    const createIModelBody = this.getCreateIModelFromBaselineRequestBody(params.imodelProperties);
    const createIModelResponse = await this.sendPostRequest<IModelCreateResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getCreateIModelUrl(),
      body: createIModelBody
    });

    const uploadUrl = createIModelResponse.iModel._links.upload.href;
    await this._options.fileHandler.uploadFile({ uploadUrl, sourceFilePath: params.iModelProperties.filePath });

    const confirmUploadUrl = createIModelResponse.iModel._links.complete.href;
    await this.sendPostRequest({
      authorization: params.authorization,
      url: confirmUploadUrl,
      body: undefined
    });

    await this.waitForBaselineFileInitialization({
      authorization: params.authorization,
      iModelId: createIModelResponse.iModel.id
    });
    return this.getSingle({
      authorization: params.authorization,
      iModelId: createIModelResponse.iModel.id
    });
  }

  private getCreateIModelFromBaselineRequestBody(iModelProperties: IModelPropertiesForCreateFromBaseline): object {
    return {
      ...this.getCreateEmptyIModelRequestBody(iModelProperties),
      baselineFile: {
        size: this._options.fileHandler.getFileSize(iModelProperties.filePath)
      }
    };
  }

  private async waitForBaselineFileInitialization(params: AuthorizationParam & { iModelId: string, timeOutInMs?: number }): Promise<void> {
    const sleepPeriodInMs = Constants.time.sleepPeriodInMs;
    const timeOutInMs = params.timeOutInMs ?? Constants.time.iModelInitiazationTimeOutInMs;
    for (let retries = Math.ceil(timeOutInMs / sleepPeriodInMs); retries > 0; --retries) {
      const baselineFileState = (await this._baselineFileOperations.getSingle(params)).state;

      if (baselineFileState === BaselineFileState.Initialized)
        return;

      if (baselineFileState !== BaselineFileState.WaitingForFile && baselineFileState !== BaselineFileState.InitializationScheduled)
        throw new IModelsErrorImpl({
          code: IModelsErrorCode.BaselineFileInitializationFailed,
          message: `Baseline File initialization failed with state '${baselineFileState}.'`
        });

      await sleep(sleepPeriodInMs);
    }

    throw new IModelsErrorImpl({
      code: IModelsErrorCode.BaselineFileInitializationFailed,
      message: "Timed out waiting for Baseline File initialization."
    });
  }
}
