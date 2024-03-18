import { OperationsBase, OperationsBaseOptions, SendDeleteRequestParams, SendGetRequestParams, SendPatchRequestParams, SendPostRequestParams, SendPutRequestParams } from "@itwin/imodels-client-management/lib/base/internal";
import { ContentType, HttpResponse } from "@itwin/imodels-client-management/lib/base/types";

export class TestOperationsWrapper extends OperationsBase<OperationsBaseOptions> {
  public constructor(options: OperationsBaseOptions) {
    super(options);
  }

  public override async sendGetRequest<TData>(params: SendGetRequestParams & { responseType?: ContentType.Json }): Promise<HttpResponse<TData>>;
  public override async sendGetRequest(params: SendGetRequestParams & { responseType: ContentType.Png }): Promise<HttpResponse<Uint8Array>>;
  public override async sendGetRequest<TData>(params: SendGetRequestParams): Promise<HttpResponse<TData | Uint8Array>> {
    if(params.responseType === ContentType.Png)
      return super.sendGetRequest({...params, responseType: params.responseType});
    return super.sendGetRequest<TData>({...params, responseType: params.responseType });
  }

  public override async sendPostRequest<TData>(params: SendPostRequestParams): Promise<HttpResponse<TData>> {
    return super.sendPostRequest(params);
  }

  public override async sendDeleteRequest<TData>(params: SendDeleteRequestParams): Promise<HttpResponse<TData>> {
    return super.sendDeleteRequest(params);
  }

  public override async sendPutRequest<TData>(params: SendPutRequestParams): Promise<HttpResponse<TData>> {
    return super.sendPutRequest(params);
  }

  public override async sendPatchRequest<TData>(params: SendPatchRequestParams): Promise<HttpResponse<TData>> {
    return super.sendPatchRequest(params);
  }
}
