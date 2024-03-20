import { AxiosHeadersAdapterFactory, AxiosRestClient, IModelsErrorParser } from "@itwin/imodels-client-management/lib/base/internal";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { expect } from "chai";

import { ContentType, HttpRequestWithJsonBodyParams } from "@itwin/imodels-client-management";

describe("[Management] AxiosRestClient", () => {
  let axiosMock: MockAdapter;

  before(() => {
    axiosMock = new MockAdapter(axios);
  });

  it("should get response header value by case-insensitive name", async () => {
    // Arrange
    const requestParams: HttpRequestWithJsonBodyParams = {
      url: "https://imodelhub.bentley.com",
      headers: {},
      body: {
        content: {},
        contentType: ContentType.Json
      }
    };
    const responseBody = {
      iModelId: "IMODEL_ID"
    };
    const responseHeaders = {
      "location": "https://some-url.com",
      "retry-after": 60
    };
    axiosMock.onPost(requestParams.url).reply(200, responseBody, responseHeaders);
    const restClient = new AxiosRestClient(IModelsErrorParser.parse, new AxiosHeadersAdapterFactory());

    // Act
    const response = await restClient.sendPostRequest(requestParams);

    // Assert
    expect(response.body).to.deep.equal(responseBody);
    expect(response.headers.get("location")).to.equal("https://some-url.com");
    expect(response.headers.get("Location")).to.equal("https://some-url.com");
    expect(response.headers.get("LOCATION")).to.equal("https://some-url.com");
    expect(response.headers.get("Retry-After")).to.equal("60");
    expect(response.headers.get("non-existent-header")).to.not.exist;
  });
});
