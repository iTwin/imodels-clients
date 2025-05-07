/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  AuthorizationParam,
  HeadersParam,
  IModel,
  IModelsErrorCode,
  IModelsErrorImpl,
  IModelOperations as ManagementIModelOperations,
  UtilityFunctions,
  assertLink,
} from "@itwin/imodels-client-management";

import { BaselineFileState } from "../../base/types";
import { IModelsClient } from "../../IModelsClient";
import { BaselineFileOperations } from "../baseline-file/BaselineFileOperations";
import { OperationOptions } from "../OperationOptions";

import {
  CreateIModelFromBaselineParams,
  IModelPropertiesForCreateFromBaseline,
} from "./IModelOperationParams";

export class IModelOperations<
  TOptions extends OperationOptions
> extends ManagementIModelOperations<TOptions> {
  private _baselineFileOperations: BaselineFileOperations<TOptions>;

  constructor(options: TOptions, iModelsClient: IModelsClient) {
    super(options, iModelsClient);
    this._baselineFileOperations = new BaselineFileOperations<TOptions>(
      options
    );
  }

  /**
   * Creates an iModel from Baseline file with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/create-imodel/ Create iModel} operation from iModels API.
   * Internally it creates an iModel instance, uploads the Baseline file, confirms Baseline
   * file upload and then repeatedly queries the Baseline file state until the iModel is initialized. The execution of
   * this method can take up to several minutes due to waiting for initialization to complete. It also depends on the
   * Baseline file size - the larger the file, the longer the upload will take.
   * @param {CreateIModelFromBaselineParams} params parameters for this operation. See {@link CreateIModelFromBaselineParams}.
   * @returns {Promise<IModel>} newly created iModel. See {@link IModel}.
   * @throws an error that implements `iModelsError` interface with code {@link IModelsErrorCode.BaselineFileInitializationFailed} if
   * Baseline file initialization failed or {@link IModelsErrorCode.BaselineFileInitializationTimedOut} if the operation did not complete in time.
   * See {@link IModelsErrorCode}.
   */
  public async createFromBaseline(
    params: CreateIModelFromBaselineParams
  ): Promise<IModel> {
    const baselineFileSize = await this._options.localFileSystem.getFileSize(
      params.iModelProperties.filePath
    );
    const createIModelBody = this.getCreateIModelFromBaselineRequestBody(
      params.iModelProperties,
      baselineFileSize
    );
    const createdIModel = await this.sendIModelPostRequest(
      params.authorization,
      createIModelBody,
      params.headers
    );

    assertLink(createdIModel._links.upload);
    const uploadLink = createdIModel._links.upload;
    await this._options.cloudStorage.upload({
      url: uploadLink.href,
      storageType: uploadLink.storageType,
      data: params.iModelProperties.filePath,
    });

    assertLink(createdIModel._links.complete);
    const confirmUploadUrl = createdIModel._links.complete.href;
    await this.sendPostRequest({
      authorization: params.authorization,
      url: confirmUploadUrl,
      body: undefined,
      headers: params.headers,
    });

    await this.waitForBaselineFileInitialization({
      authorization: params.authorization,
      iModelId: createdIModel.id,
      headers: params.headers,
      timeOutInMs: params.timeOutInMs,
    });
    return this.getSingle({
      authorization: params.authorization,
      iModelId: createdIModel.id,
      headers: params.headers,
    });
  }

  private getCreateIModelFromBaselineRequestBody(
    iModelProperties: IModelPropertiesForCreateFromBaseline,
    baselineFileSize: number
  ): object {
    return {
      ...this.getCreateEmptyIModelRequestBody(iModelProperties),
      baselineFile: {
        size: baselineFileSize,
      },
    };
  }

  private async waitForBaselineFileInitialization(
    params: AuthorizationParam &
      HeadersParam & { iModelId: string; timeOutInMs?: number }
  ): Promise<void> {
    const isBaselineInitialized: () => Promise<boolean> = async () => {
      const { state } = await this._baselineFileOperations.getSingle(params);

      if (
        state !== BaselineFileState.Initialized &&
        state !== BaselineFileState.WaitingForFile &&
        state !== BaselineFileState.InitializationScheduled
      )
        throw new IModelsErrorImpl({
          code: IModelsErrorCode.BaselineFileInitializationFailed,
          message: `Baseline File initialization failed with state '${state}.'`,
          originalError: undefined,
          statusCode: undefined,
          details: undefined,
        });

      return state === BaselineFileState.Initialized;
    };

    return UtilityFunctions.waitForCondition({
      conditionToSatisfy: isBaselineInitialized,
      timeoutErrorFactory: () =>
        new IModelsErrorImpl({
          code: IModelsErrorCode.BaselineFileInitializationTimedOut,
          message: "Timed out waiting for Baseline File initialization.",
          originalError: undefined,
          statusCode: undefined,
          details: undefined,
        }),
      timeOutInMs: params.timeOutInMs,
    });
  }
}
