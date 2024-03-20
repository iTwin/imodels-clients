/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityListIteratorImpl, IModelResponse, IModelsErrorImpl, IModelsResponse, OperationsBase, waitForCondition } from "../../base/internal";
import { AuthorizationCallback, EntityListIterator, HeaderFactories, HttpResponse, IModel, IModelCreationState, IModelsErrorCode, MinimalIModel, PreferReturn, User } from "../../base/types";
import { Constants } from "../../Constants";
import { IModelsClient } from "../../IModelsClient";
import { OperationOptions } from "../OperationOptions";
import { assertStringHeaderValue } from "../SharedFunctions";

import { CloneIModelParams, CreateEmptyIModelParams, CreateIModelFromTemplateParams, DeleteIModelParams, GetIModelListParams, GetSingleIModelParams, IModelProperties, IModelPropertiesForClone, IModelPropertiesForCreateFromTemplate, IModelPropertiesForUpdate, UpdateIModelParams } from "./IModelOperationParams";

export class IModelOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions,
    private _iModelsClient: IModelsClient
  ) {
    super(options);
  }
  /**
   * Gets iModels for a specific iTwin. This method returns iModels in their minimal representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/get-itwin-imodels/ Get iTwin iModels}
   * operation from iModels API.
   * @param {GetIModelListParams} params parameters for this operation. See {@link GetIModelListParams}.
   * @returns {EntityListIterator<MinimalIModel>} iterator for iModel list. See {@link EntityListIterator}, {@link MinimalIModel}.
   */
  public getMinimalList(params: GetIModelListParams): EntityListIterator<MinimalIModel> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalIModel, IModelsResponse<MinimalIModel>>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getIModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response) => response.body.iModels,
      headers: params.headers
    }));
  }

  /**
   * Gets iModels for a specific iTwin. This method returns iModels in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/get-itwin-imodels/ Get iTwin iModels}
   * operation from iModels API.
   * @param {GetIModelListParams} params parameters for this operation. See {@link GetIModelListParams}.
   * @returns {EntityListIterator<IModel>} iterator for iModel list. See {@link EntityListIterator}, {@link IModel}.
   */
  public getRepresentationList(params: GetIModelListParams): EntityListIterator<IModel> {
    const entityCollectionAccessor = (response: HttpResponse<IModelsResponse<IModel>>) => {
      const iModels = response.body.iModels;
      const mappedIModels = iModels.map((iModel) => this.appendRelatedEntityCallbacks(params.authorization, iModel, params.headers));
      return mappedIModels;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<IModel, IModelsResponse<IModel>>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getIModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor,
      headers: params.headers
    }));
  }

  /**
   * Gets a single iModel by its id. This method returns an iModel in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/get-imodel-details/ Get iModel} operation from iModels API.
   * @param {GetSingleIModelParams} params parameters for this operation. See {@link GetSingleIModelParams}.
   * @returns {Promise<iModel>} an iModel with specified id. See {@link IModel}.
   */
  public async getSingle(params: GetSingleIModelParams): Promise<IModel> {
    const response = await this.sendGetRequest<IModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId }),
      headers: params.headers
    });
    const result: IModel = this.appendRelatedEntityCallbacks(params.authorization, response.body.iModel, params.headers);
    return result;
  }

  /**
   * Creates an empty iModel with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/create-imodel/ Create iModel} operation from iModels API.
   * @param {CreateEmptyIModelParams} params parameters for this operation. See {@link CreateEmptyIModelParams}.
   * @returns {Promise<iModel>} newly created iModel. See {@link IModel}.
   */
  public async createEmpty(params: CreateEmptyIModelParams): Promise<IModel> {
    const createIModelBody = this.getCreateEmptyIModelRequestBody(params.iModelProperties);
    const createdIModel = await this.sendIModelPostRequest(params.authorization, createIModelBody, params.headers);
    const result: IModel = this.appendRelatedEntityCallbacks(params.authorization, createdIModel, params.headers);
    return result;
  }

  /**
   * Creates an iModel from a template. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/create-imodel/ Create iModel} operation from iModels API.
   * It uses the `template` request body property to specify the source iModel which will be used as a template. Internally
   * this method creates the iModel instance and then repeatedly queries the iModel state until the iModel is initialized.
   * The execution of this method can take up to several minutes due to waiting for initialization to complete.
   * @param {CreateIModelFromTemplateParams} params parameters for this operation. See {@link CreateIModelFromTemplateParams}.
   * @returns {Promise<iModel>} newly created iModel. See {@link IModel}.
   * @throws an error that implements `iModelsError` interface with code {@link IModelsErrorCode.IModelFromTemplateInitializationFailed} if
   * iModel initialization failed or did not complete in time. See {@link IModelsErrorCode}.
   */
  public async createFromTemplate(params: CreateIModelFromTemplateParams): Promise<IModel> {
    const createIModelBody = this.getCreateIModelFromTemplateRequestBody(params.iModelProperties);
    const createdIModel = await this.sendIModelPostRequest(params.authorization, createIModelBody, params.headers);

    await this.waitForTemplatedIModelInitialization({
      authorization: params.authorization,
      iModelId: createdIModel.id,
      timeOutInMs: params.timeOutInMs,
      headers: params.headers
    });

    return this.getSingle({
      authorization: params.authorization,
      iModelId: createdIModel.id,
      headers: params.headers
    });
  }

  /**
   * Clones the specified iModel. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/clone-imodel/ Clone iModel} operation from iModels API.
   * Internally this method clones the iModel and then repeatedly queries the new iModel's state until it is initialized.
   * The execution of this method can take up to several minutes due to waiting for initialization to complete.
   * @param {CloneIModelParams} params parameters for this operation. See {@link CloneIModelParams}.
   * @returns {Promise<IModel>} newly created iModel. See {@link IModel}.
   * @throws an error that implements `iModelsError` interface with code {@link IModelsErrorCode.ClonedIModelInitializationFailed} if
   * iModel initialization failed or {@link IModelsErrorCode.ClonedIModelInitializationTimedOut} if operation did not complete in time.
   * See {@link IModelsErrorCode}.
   */
  public async clone(params: CloneIModelParams): Promise<IModel> {
    const cloneIModelBody = this.getCloneIModelRequestBody(params.iModelProperties);
    const cloneIModelResponse = await this.sendPostRequest<void>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getCloneIModelUrl({ iModelId: params.iModelId }),
      body: cloneIModelBody,
      headers: params.headers
    });

    const locationHeaderValue = cloneIModelResponse.headers.get(Constants.headers.location);
    assertStringHeaderValue(Constants.headers.location, locationHeaderValue);
    const { iModelId: clonedIModelId } = this._options.urlFormatter.parseIModelUrl(locationHeaderValue);

    await this.waitForClonedIModelInitialization({
      authorization: params.authorization,
      iModelId: clonedIModelId
    });

    return this.getSingle({
      authorization: params.authorization,
      iModelId: clonedIModelId
    });
  }

  /**
   * Updates iModel properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/update-imodel/ Update iModel} operation from iModels API.
   * @param {UpdateIModelParams} params parameters for this operation. See {@link UpdateIModelParams}.
   * @returns {Promise<IModel>} updated iModel. See {@link IModel}.
   */
  public async update(params: UpdateIModelParams): Promise<IModel> {
    const updateIModelBody = this.getUpdateIModelRequestBody(params.iModelProperties);
    const updateIModelResponse = await this.sendPatchRequest<IModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId }),
      body: updateIModelBody,
      headers: params.headers
    });
    const result: IModel = this.appendRelatedEntityCallbacks(params.authorization, updateIModelResponse.body.iModel, params.headers);
    return result;
  }

  /**
   * Deletes an iModel with specified id. Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/delete-imodel/ Delete iModel}
   * operation from iModels API.
   * @param {DeleteIModelParams} params parameters for this operation. See {@link DeleteIModelParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async delete(params: DeleteIModelParams): Promise<void> {
    await this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId }),
      headers: params.headers
    });
  }

  protected appendRelatedEntityCallbacks(authorization: AuthorizationCallback, iModel: IModel, headers?: HeaderFactories): IModel {
    const getCreator = async () => this.getCreator(authorization, iModel._links.creator?.href, headers);

    const result: IModel = {
      ...iModel,
      getCreator
    };

    return result;
  }

  protected getCreateEmptyIModelRequestBody(iModelProperties: IModelProperties): object {
    return {
      iTwinId: iModelProperties.iTwinId,
      name: iModelProperties.name,
      description: iModelProperties.description,
      extent: iModelProperties.extent
    };
  }

  protected async sendIModelPostRequest(authorization: AuthorizationCallback, createIModelBody: object, headers?: HeaderFactories): Promise<IModel> {
    const createIModelResponse = await this.sendPostRequest<IModelResponse>({
      authorization,
      url: this._options.urlFormatter.getCreateIModelUrl(),
      body: createIModelBody,
      headers
    });
    return createIModelResponse.body.iModel;
  }

  private async getCreator(authorization: AuthorizationCallback, creatorLink: string | undefined, headers?: HeaderFactories): Promise<User | undefined> {
    if (!creatorLink)
      return undefined;

    const { iModelId, userId } = this._options.urlFormatter.parseUserUrl(creatorLink);
    return this._iModelsClient.users.getSingle({
      authorization,
      iModelId,
      userId,
      headers
    });
  }

  private getCreateIModelFromTemplateRequestBody(iModelProperties: IModelPropertiesForCreateFromTemplate): object {
    return {
      ...this.getCreateEmptyIModelRequestBody(iModelProperties),
      template: {
        iModelId: iModelProperties.template.iModelId,
        changesetId: iModelProperties.template.changesetId
      }
    };
  }

  private getCloneIModelRequestBody(iModelProperties: IModelPropertiesForClone): object {
    return {
      iTwinId: iModelProperties.iTwinId,
      name: iModelProperties.name,
      description: iModelProperties.description,
      changesetId: iModelProperties.changesetId,
      changesetIndex: iModelProperties.changesetIndex
    };
  }

  private getUpdateIModelRequestBody(iModelProperties: IModelPropertiesForUpdate): object {
    return {
      name: iModelProperties.name,
      description: iModelProperties.description,
      extent: iModelProperties.extent
    };
  }

  private async isIModelInitialized(params: {
    authorization: AuthorizationCallback;
    iModelId: string;
    errorCodeOnFailure: IModelsErrorCode;
    headers?: HeaderFactories;
  }): Promise<boolean> {
    const { state } = await this._iModelsClient.operations.getCreateIModelDetails({
      authorization: params.authorization,
      iModelId: params.iModelId,
      headers: params.headers
    });

    if (state !== IModelCreationState.Scheduled &&
      state !== IModelCreationState.WaitingForFile &&
      state !== IModelCreationState.Successful
    )
      throw new IModelsErrorImpl({
        code: params.errorCodeOnFailure,
        message: `iModel initialization failed with state '${state}'`
      });

    return state === IModelCreationState.Successful;
  }

  private async waitForTemplatedIModelInitialization(params: {
    authorization: AuthorizationCallback;
    iModelId: string;
    timeOutInMs?: number;
    headers?: HeaderFactories;
  }): Promise<void> {
    return waitForCondition({
      conditionToSatisfy: async () => this.isIModelInitialized({
        authorization: params.authorization,
        iModelId: params.iModelId,
        errorCodeOnFailure: IModelsErrorCode.IModelFromTemplateInitializationFailed,
        headers: params.headers
      }),
      timeoutErrorFactory: () => new IModelsErrorImpl({
        code: IModelsErrorCode.IModelFromTemplateInitializationTimedOut,
        message: "Timed out waiting for Baseline File initialization."
      }),
      timeOutInMs: params.timeOutInMs
    });
  }

  private async waitForClonedIModelInitialization(params: {
    authorization: AuthorizationCallback;
    iModelId: string;
    timeOutInMs?: number;
    headers?: HeaderFactories;
  }): Promise<void> {
    return waitForCondition({
      conditionToSatisfy: async () => this.isIModelInitialized({
        authorization: params.authorization,
        iModelId: params.iModelId,
        errorCodeOnFailure: IModelsErrorCode.ClonedIModelInitializationFailed,
        headers: params.headers
      }),
      timeoutErrorFactory: () => new IModelsErrorImpl({
        code: IModelsErrorCode.ClonedIModelInitializationTimedOut,
        message: "Timed out waiting for Cloned iModel initialization."
      }),
      timeOutInMs: params.timeOutInMs
    });
  }
}
