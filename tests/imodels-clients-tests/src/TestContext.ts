/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { iModelsClientOptions, RequestContext } from "@itwin/imodels-client-authoring";
import { Config } from "./Config";

export class TestContext {
  private _imodelNamePrefix: string;

  constructor(params: {
    labels: {
      package: string,
      testSuite?: string,
    }
  }) {
    this._imodelNamePrefix = `[${params.labels.package}]`;
    if (params.labels.testSuite)
      this._imodelNamePrefix += `[${params.labels.testSuite}]`;
  }

  public get ClientConfig(): iModelsClientOptions {
    return {
      api: {
        baseUri: Config.get().apiBaseUrl
      }
    };
  }

  public get ProjectId(): string {
    return "1e811135-6df3-4eb1-824f-746f0a63c590"; // TODO: read config
  }

  public get RequestContext(): RequestContext {
    return {
      authorization: {
        scheme: "Bearer", // TODO: read config
        token: "eyJhbGciOiJSUzI1NiIsImtpZCI6IkJlbnRsZXlRQSIsInBpLmF0bSI6ImE4bWUifQ.eyJzY29wZSI6WyJpbW9kZWxzOnJlYWQiLCJpbW9kZWxzOm1vZGlmeSJdLCJjbGllbnRfaWQiOiJpdHdpbi1kZXZlbG9wZXItY29uc29sZS1zYW5kYm94IiwiYXVkIjpbImh0dHBzOi8vcWEtaW1zLmJlbnRsZXkuY29tL2FzL3Rva2VuLm9hdXRoMiIsImh0dHBzOi8vcWEtaW1zb2lkYy5iZW50bGV5LmNvbS9hcy90b2tlbi5vYXV0aDIiLCJodHRwczovL3FhMi1pbXMuYmVudGxleS5jb20vYXMvdG9rZW4ub2F1dGgyIiwiaHR0cHM6Ly9xYTItaW1zb2lkYy5iZW50bGV5LmNvbS9hcy90b2tlbi5vYXV0aDIiLCJodHRwczovL3FhLWltc29pZGMuYmVudGxleS5jb20vcmVzb3VyY2VzIiwiaHR0cHM6Ly9xYTItaW1zLmJlbnRsZXkuY29tL3Jlc291cmNlcyIsImJlbnRsZXktYXBpLW1hbmFnZW1lbnQiXSwic3ViIjoiZjRhNTFmZDgtZDlmMC00ZTllLWJjMTItZmJlMjNiM2VhZWExIiwicm9sZSI6WyJTSVRFX0FETUlOSVNUUkFUT1IiLCJTdXBlckFkbWluIiwiQWRtaW4iLCJQVyBQcm9qZWN0IEluc2lnaHRzIEVhcmx5IEFjY2VzcyIsIkJFTlRMRVlfRU1QTE9ZRUUiLCJJTVNBZG1pbiIsIklNU09JREMgQWRtaW4iLCJVc2VyTWFuYWdlbWVudEFkbWluIiwiUHJvamVjdCBNYW5hZ2VyIiwiRGVzaWduIEluc2lnaHRzIEVhcmx5IEFjY2VzcyIsIklNU1Byb2ZpbGVBZG1pbiIsIkNPTk5FQ1QgR2VvLUxvY2F0aW9uIl0sIm9yZyI6IjcyYWRhZDMwLWMwN2MtNDY1ZC1hMWZlLTJmMmRmYWM5NTBhNCIsInN1YmplY3QiOiJmNGE1MWZkOC1kOWYwLTRlOWUtYmMxMi1mYmUyM2IzZWFlYTEiLCJpc3MiOiJodHRwczovL3FhLWltcy5iZW50bGV5LmNvbSIsImVudGl0bGVtZW50IjoiU0VMRUNUXzIwMDYiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJBdXN0ZWphLkthbHBha292YWl0ZUBiZW50bGV5LmNvbSIsImdpdmVuX25hbWUiOiJBdXN0ZWphIiwic2lkIjoiM2NTSlJuSkRkaDltSGhaRzFhaWlBNVlNM1ZZLlVVRkpUVk10UW1WdWRHeGxlUzFFUlEuU2JvVS5Cd2VCdEdTTmU5MGFHYlljdDNnQWxrRG9wIiwibmJmIjoxNjMyMjIxNDQxLCJ1bHRpbWF0ZV9zaXRlIjoiMTAwMTM4OTExNyIsInVzYWdlX2NvdW50cnlfaXNvIjoiVVMiLCJhdXRoX3RpbWUiOjE2MzIyMjE3NDEsIm5hbWUiOiJBdXN0ZWphLkthbHBha292YWl0ZUBiZW50bGV5LmNvbSIsIm9yZ19uYW1lIjoiQmVudGxleSBTeXN0ZW1zIEluYyIsImZhbWlseV9uYW1lIjoiS2FscGFrb3ZhaXRlIiwiZW1haWwiOiJBdXN0ZWphLkthbHBha292YWl0ZUBiZW50bGV5LmNvbSIsImV4cCI6MTYzMjIyNTM2Mn0.vn7eT4z6B1J1nAWzZKRphBGYNnRhhV3Hq9I96-ajpJWYnsfppM9slljQ4ap4Kajwm16736Sgq3Sj3EwPypSWGsd-1uH5aj7VFavpPzgmQB10ym_sOAYxl79ACm2KE6MfWEViDvyRXppzcjNetfXPfyqqkoDFZMwfyXZbGCu3a0_GIzwbU2S5TuCyHvlaXCTfvwvYtuLZTCj--IkSDmhDza3I6BTFIAwjkDstXEjT76frjXp73mn40humtXTPAd9mlp-25wSjoStzY5kriTgkq-EosLU6bqCZOPczYtrm1wq6OyVC8nYkMOjm8XGasaqukaSI0SuYYcKcxs0oDUbQMQ" // TODO: read config
      }
    };
  }

  public getPrefixediModelName(imodelName: string): string {
    return `${this._imodelNamePrefix} ${imodelName}`;
  }

  public doesiModelBelongToContext(imodelName: string): boolean {
    return imodelName.startsWith(this._imodelNamePrefix);
  }
}
