/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  ContentType,
  HttpResponse,
  OperationsBase,
  OperationsBaseOptions,
  SendDeleteRequestParams,
  SendGetRequestParams,
  SendPatchRequestParams,
  SendPostRequestParams,
  SendPutRequestParams,
} from "@itwin/imodels-client-management";

export class TestOperationsWrapper extends OperationsBase<OperationsBaseOptions> {
  public constructor(options: OperationsBaseOptions) {
    super(options);
  }

  public override async sendGetRequest<TBody>(
    params: SendGetRequestParams & { responseType?: ContentType.Json }
  ): Promise<HttpResponse<TBody>>;
  public override async sendGetRequest(
    params: SendGetRequestParams & { responseType: ContentType.Png }
  ): Promise<HttpResponse<Uint8Array>>;
  public override async sendGetRequest<TBody>(
    params: SendGetRequestParams
  ): Promise<HttpResponse<TBody | Uint8Array>> {
    if (params.responseType === ContentType.Png)
      return super.sendGetRequest({
        ...params,
        responseType: params.responseType,
      });
    return super.sendGetRequest<TBody>({
      ...params,
      responseType: params.responseType,
    });
  }

  public override async sendPostRequest<TBody>(
    params: SendPostRequestParams
  ): Promise<HttpResponse<TBody>> {
    return super.sendPostRequest(params);
  }

  public override async sendDeleteRequest<TBody>(
    params: SendDeleteRequestParams
  ): Promise<HttpResponse<TBody>> {
    return super.sendDeleteRequest(params);
  }

  public override async sendPutRequest<TBody>(
    params: SendPutRequestParams
  ): Promise<HttpResponse<TBody>> {
    return super.sendPutRequest(params);
  }

  public override async sendPatchRequest<TBody>(
    params: SendPatchRequestParams
  ): Promise<HttpResponse<TBody>> {
    return super.sendPatchRequest(params);
  }
}
