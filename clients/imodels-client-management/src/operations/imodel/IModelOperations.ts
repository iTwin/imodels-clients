/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { EntityListIteratorImpl, IModelResponse, IModelsErrorImpl, IModelsResponse, OperationsBase, waitForCondition } from "../../base/internal";
import { AuthorizationCallback, EntityListIterator, HeaderFactories, IModel, IModelState, IModelsErrorCode, MinimalIModel, PreferReturn, User } from "../../base/types";
import { IModelsClient } from "../../IModelsClient";
import { OperationOptions } from "../OperationOptions";

import { CreateEmptyIModelParams, CreateIModelFromTemplateParams, DeleteIModelParams, GetIModelListParams, GetSingleIModelParams, IModelProperties, IModelPropertiesForCreateFromTemplate, IModelPropertiesForUpdate, UpdateIModelParams } from "./IModelOperationParams";

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
   * @param {GetiModelListParams} params parameters for this operation. See {@link GetiModelListParams}.
   * @returns {EntityListIterator<MinimaliModel>} iterator for iModel list. See {@link EntityListIterator}, {@link MinimaliModel}.
   */
  public getMinimalList(params: GetIModelListParams): EntityListIterator<MinimalIModel> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalIModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getIModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as IModelsResponse<MinimalIModel>).iModels,
      headers: params.headers
    }));
  }

  /**
   * Gets iModels for a specific iTwin. This method returns iModels in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/get-itwin-imodels/ Get iTwin iModels}
   * operation from iModels API.
   * @param {GetiModelListParams} params parameters for this operation. See {@link GetiModelListParams}.
   * @returns {EntityListIterator<iModel>} iterator for iModel list. See {@link EntityListIterator}, {@link iModel}.
   */
  public getRepresentationList(params: GetIModelListParams): EntityListIterator<IModel> {
    const entityCollectionAccessor = (response: unknown) => {
      const iModels = (response as IModelsResponse<IModel>).iModels;
      const mappedIModels = iModels.map((iModel) => this.appendRelatedEntityCallbacks(params.authorization, iModel, params.headers));
      return mappedIModels;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<IModel>({
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
   * @param {GetSingleiModelParams} params parameters for this operation. See {@link GetSingleiModelParams}.
   * @returns {Promise<iModel>} an iModel with specified id. See {@link iModel}.
   */
  public async getSingle(params: GetSingleIModelParams): Promise<IModel> {
    const response = await this.sendGetRequest<IModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId }),
      headers: params.headers
    });
    const result: IModel = this.appendRelatedEntityCallbacks(params.authorization, response.iModel, params.headers);
    return result;
  }

  /**
   * Creates an empty iModel with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels-v2/operations/create-imodel/ Create iModel} operation from iModels API.
   * @param {CreateEmptyiModelParams} params parameters for this operation. See {@link CreateEmptyiModelParams}.
   * @returns {Promise<iModel>} newly created iModel. See {@link iModel}.
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
   * @returns {Promise<iModel>} newly created iModel. See {@link iModel}.
   * @throws an error that implements `iModelsError` interface with code `iModelsErrorCode.IModelFromTemplateInitializationFailed`
   * if iModel initialization failed or did not complete in time. See {@link iModelsErrorCode}.
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
    const result: IModel = this.appendRelatedEntityCallbacks(params.authorization, updateIModelResponse.iModel, params.headers);
    return result;
  }

  /**
   * Deletes an iModel with specified id. Wraps the {@link https://developer.bentley.com/apis/imodels-v2/operations/delete-imodel/ Delete iModel}
   * operation from iModels API.
   * @param {DeleteiModelParams} params parameters for this operation. See {@link DeleteiModelParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async delete(params: DeleteIModelParams): Promise<void> {
    return this.sendDeleteRequest({
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
    return createIModelResponse.iModel;
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

  private getUpdateIModelRequestBody(iModelProperties: IModelPropertiesForUpdate): object {
    return {
      name: iModelProperties.name,
      description: iModelProperties.description,
      extent: iModelProperties.extent
    };
  }

  private async waitForTemplatedIModelInitialization(params: {
    authorization: AuthorizationCallback;
    iModelId: string;
    timeOutInMs?: number;
    headers?: HeaderFactories;
  }): Promise<void> {
    const isIModelInitialized: () => Promise<boolean> = async () => {
      const iModel: IModel = await this.getSingle({
        authorization: params.authorization,
        iModelId: params.iModelId,
        headers: params.headers
      });
      return iModel.state === IModelState.Initialized;
    };

    return waitForCondition({
      conditionToSatisfy: isIModelInitialized,
      timeoutErrorFactory: () => new IModelsErrorImpl({
        code: IModelsErrorCode.IModelFromTemplateInitializationFailed,
        message: "Timed out waiting for Baseline File initialization."
      }),
      timeOutInMs: params.timeOutInMs
    });
  }
}
