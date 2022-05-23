/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { AuthorizationCallback, EntityListIterator, EntityListIteratorImpl, IModel, IModelResponse, IModelState, IModelsErrorCode, IModelsErrorImpl, IModelsResponse, MinimalIModel, OperationsBase, PreferReturn, waitForCondition } from "../../base";
import { OperationOptions } from "../OperationOptions";
import { CreateEmptyIModelParams, CreateIModelFromTemplateParams, DeleteIModelParams, GetIModelListParams, GetSingleIModelParams, IModelProperties, IModelPropertiesForCreateFromTemplate, IModelPropertiesForUpdate, UpdateIModelParams } from "./IModelOperationParams";

export class IModelOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  /**
   * Gets iModels for a specific project. This method returns iModels in their minimal representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.bentley.com/apis/imodels/operations/get-project-imodels/ Get Project iModels}
   * operation from iModels API.
   * @param {GetiModelListParams} params parameters for this operation. See {@link GetiModelListParams}.
   * @returns {EntityListIterator<MinimaliModel>} iterator for iModel list. See {@link EntityListIterator}, {@link MinimaliModel}.
   */
  public getMinimalList(params: GetIModelListParams): EntityListIterator<MinimalIModel> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalIModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getIModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor: (response: unknown) => (response as IModelsResponse<MinimalIModel>).iModels
    }));
  }

  /**
   * Gets iModels for a specific project. This method returns iModels in their full representation. The returned iterator
   * internally queries entities in pages. Wraps the {@link https://developer.bentley.com/apis/imodels/operations/get-project-imodels/ Get Project iModels}
   * operation from iModels API.
   * @param {GetiModelListParams} params parameters for this operation. See {@link GetiModelListParams}.
   * @returns {EntityListIterator<iModel>} iterator for iModel list. See {@link EntityListIterator}, {@link iModel}.
   */
  public getRepresentationList(params: GetIModelListParams): EntityListIterator<IModel> {
    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<IModel>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getIModelListUrl({ urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor: (response: unknown) => (response as IModelsResponse<IModel>).iModels
    }));
  }

  /**
   * Gets a single iModel by its id. This method returns an iModel in its full representation. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/get-imodel-details/ Get iModel} operation from iModels API.
   * @param {GetSingleiModelParams} params parameters for this operation. See {@link GetSingleiModelParams}.
   * @returns {Promise<iModel>} an iModel with specified id. See {@link iModel}.
   */
  public async getSingle(params: GetSingleIModelParams): Promise<IModel> {
    const response = await this.sendGetRequest<IModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId })
    });
    return response.iModel;
  }

  /**
   * Creates an empty iModel with specified properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/create-imodel/ Create iModel} operation from iModels API.
   * @param {CreateEmptyiModelParams} params parameters for this operation. See {@link CreateEmptyiModelParams}.
   * @returns {Promise<iModel>} newly created iModel. See {@link iModel}.
   */
  public async createEmpty(params: CreateEmptyIModelParams): Promise<IModel> {
    const createIModelBody = this.getCreateEmptyIModelRequestBody(params.iModelProperties);
    return this.sendIModelPostRequest(params.authorization, createIModelBody);
  }

  /**
   * Creates an iModel from a template. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/create-imodel/ Create iModel} operation from iModels API.
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
    const createdIModel = await this.sendIModelPostRequest(params.authorization, createIModelBody);

    await this.waitForTemplatedIModelInitialization({
      authorization: params.authorization,
      iModelId: createdIModel.id,
      timeOutInMs: params.timeOutInMs
    });

    return this.getSingle({
      authorization: params.authorization,
      iModelId: createdIModel.id
    });
  }

  /**
   * Updates iModel properties. Wraps the
   * {@link https://developer.bentley.com/apis/imodels/operations/update-imodel/ Update iModel} operation from iModels API.
   * @param {UpdateIModelParams} params parameters for this operation. See {@link UpdateIModelParams}.
   * @returns {Promise<IModel>} updated iModel. See {@link IModel}.
   */
  public async update(params: UpdateIModelParams): Promise<IModel> {
    const updateIModelBody = this.getUpdateIModelRequestBody(params.iModelProperties);
    const updateIModelResponse = await this.sendPatchRequest<IModelResponse>({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId }),
      body: updateIModelBody
    });
    return updateIModelResponse.iModel;
  }

  /**
   * Deletes an iModel with specified id. Wraps the {@link https://developer.bentley.com/apis/imodels/operations/delete-imodel/ Delete iModel}
   * operation from iModels API.
   * @param {DeleteiModelParams} params parameters for this operation. See {@link DeleteiModelParams}.
   * @returns {Promise<void>} a promise that resolves after operation completes.
   */
  public async delete(params: DeleteIModelParams): Promise<void> {
    return this.sendDeleteRequest({
      authorization: params.authorization,
      url: this._options.urlFormatter.getSingleIModelUrl({ iModelId: params.iModelId })
    });
  }

  protected getCreateEmptyIModelRequestBody(iModelProperties: IModelProperties): object {
    return {
      projectId: iModelProperties.projectId,
      name: iModelProperties.name,
      description: iModelProperties.description,
      extent: iModelProperties.extent
    };
  }

  protected async sendIModelPostRequest(authorization: AuthorizationCallback, createIModelBody: object): Promise<IModel> {
    const createIModelResponse = await this.sendPostRequest<IModelResponse>({
      authorization,
      url: this._options.urlFormatter.getCreateIModelUrl(),
      body: createIModelBody
    });
    return createIModelResponse.iModel;
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
  }): Promise<void> {
    const isIModelInitialized: () => Promise<boolean> = async () => {
      const iModel: IModel = await this.getSingle({
        authorization: params.authorization,
        iModelId: params.iModelId
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
