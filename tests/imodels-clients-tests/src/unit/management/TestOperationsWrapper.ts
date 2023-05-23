import { OperationsBase, OperationsBaseOptions, SendDeleteRequestParams, SendGetRequestParams, SendPatchRequestParams, SendPostRequestParams, SendPutRequestParams } from "@itwin/imodels-client-management/lib/base/internal";
import { ContentType } from "@itwin/imodels-client-management/lib/base/types";

export class TestOperationsWrapper extends OperationsBase<OperationsBaseOptions> {

  public constructor(options: OperationsBaseOptions) {
    super(options);
  }

  public override async sendGetRequest<TResponse>(params: SendGetRequestParams & { responseType?: ContentType.Json }): Promise<TResponse>;
  public override async sendGetRequest(params: SendGetRequestParams & { responseType: ContentType.Png }): Promise<Uint8Array>;
  public override async sendGetRequest<TResponse>(params: SendGetRequestParams): Promise<TResponse | Uint8Array> {
    if(params.responseType === ContentType.Png)
      return super.sendGetRequest({...params, responseType: params.responseType});
    return super.sendGetRequest<TResponse>({...params, responseType: params.responseType });
  }

  public override async sendPostRequest<TResponse>(params: SendPostRequestParams): Promise<TResponse> {
    return super.sendPostRequest(params);
  }

  public override async sendDeleteRequest<TResponse>(params: SendDeleteRequestParams): Promise<TResponse> {
    return super.sendDeleteRequest(params);
  }

  public override async sendPutRequest<TResponse>(params: SendPutRequestParams): Promise<TResponse> {
    return super.sendPutRequest(params);
  }

  public override async sendPatchRequest<TResponse>(params: SendPatchRequestParams): Promise<TResponse> {
    return super.sendPatchRequest(params);
  }

}
