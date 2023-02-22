/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelsErrorImpl, waitForCondition } from "@itwin/imodels-client-management/lib/base/internal";
import { IModelOperations as ManagementIModelOperations } from "@itwin/imodels-client-management/lib/operations";

import { AuthorizationParam, IModel, IModelsErrorCode } from "@itwin/imodels-client-management";

import { BaselineFileState } from "../../base/types";
import { IModelsClient } from "../../IModelsClient";
import { BaselineFileOperations } from "../baseline-file/BaselineFileOperations";
import { assertLink } from "../CommonFunctions";
import { OperationOptions } from "../OperationOptions";

import { CreateIModelFromBaselineParams, IModelPropertiesForCreateFromBaseline } from "./IModelOperationParams";

export class IModelOperations<TOptions extends OperationOptions> extends ManagementIModelOperations<TOptions> {
  private _baselineFileOperations: BaselineFileOperations<TOptions>;

  constructor(options: TOptions, iModelsClient: IModelsClient) {
    super(options, iModelsClient);
    this._baselineFileOperations = new BaselineFileOperations<TOptions>(options);
  }

  /**
  * Creates an iModel from Baseline file with specified properties. Wraps the
  * {@link https://developer.bentley.com/apis/imodels-v2/operations/create-imodel/ Create iModel} operation from iModels API.
  * Internally it creates an iModel instance, uploads the Baseline file, confirms Baseline
  * file upload and then repeatedly queries the Baseline file state until the iModel is initialized. The execution of
  * this method can take up to several minutes due to waiting for initialization to complete. It also depends on the
  * Baseline file size - the larger the file, the longer the upload will take.
  * @param {CreateiModelFromBaselineParams} params parameters for this operation. See {@link CreateiModelFromBaselineParams}.
  * @returns {Promise<iModel>} newly created iModel. See {@link iModel}.
  * @throws an error that implements `iModelsError` interface with code `iModelsErrorCode.BaselineFileInitializationFailed` if Baseline file initialization failed
  * or did not complete in time. See {@link iModelsErrorCode}.
  */
  public async createFromBaseline(params: CreateIModelFromBaselineParams): Promise<IModel> {
    const baselineFileSize = await this._options.localFileSystem.getFileSize(params.iModelProperties.filePath);
    const createIModelBody = this.getCreateIModelFromBaselineRequestBody(params.iModelProperties, baselineFileSize);
    const createdIModel = await this.sendIModelPostRequest(params.authorization, createIModelBody);

    assertLink(createdIModel._links.upload);
    const uploadUrl = createdIModel._links.upload.href;
    await this._options.cloudStorage.upload({
      url: uploadUrl,
      data: params.iModelProperties.filePath
    });

    assertLink(createdIModel._links.complete);
    const confirmUploadUrl = createdIModel._links.complete.href;
    await this.sendPostRequest({
      authorization: params.authorization,
      url: confirmUploadUrl,
      body: undefined
    });

    await this.waitForBaselineFileInitialization({
      authorization: params.authorization,
      iModelId: createdIModel.id
    });
    return this.getSingle({
      authorization: params.authorization,
      iModelId: createdIModel.id
    });
  }

  private getCreateIModelFromBaselineRequestBody(
    iModelProperties: IModelPropertiesForCreateFromBaseline,
    baselineFileSize: number
  ): object {
    return {
      ...this.getCreateEmptyIModelRequestBody(iModelProperties),
      baselineFile: {
        size: baselineFileSize
      }
    };
  }

  private async waitForBaselineFileInitialization(params: AuthorizationParam & { iModelId: string, timeOutInMs?: number }): Promise<void> {
    const isBaselineInitialized: () => Promise<boolean> = async () => {
      const baselineFileState = (await this._baselineFileOperations.getSingle(params)).state;

      if (baselineFileState !== BaselineFileState.Initialized &&
        baselineFileState !== BaselineFileState.WaitingForFile &&
        baselineFileState !== BaselineFileState.InitializationScheduled
      )
        throw new IModelsErrorImpl({
          code: IModelsErrorCode.BaselineFileInitializationFailed,
          message: `Baseline File initialization failed with state '${baselineFileState}.'`
        });

      return baselineFileState === BaselineFileState.Initialized;
    };

    return waitForCondition({
      conditionToSatisfy: isBaselineInitialized,
      timeoutErrorFactory: () => new IModelsErrorImpl({
        code: IModelsErrorCode.BaselineFileInitializationFailed,
        message: "Timed out waiting for Baseline File initialization."
      }),
      timeOutInMs: params.timeOutInMs
    });
  }
}
