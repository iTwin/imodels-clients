/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { GetChangesetListUrlParams } from "./operations";
import { OrderBy } from "./base/interfaces/CommonInterfaces";
import { Dictionary } from "./base/interfaces/UtilityTypes";

type OrderByForAnyEntity = OrderBy<{ [key: string]: unknown }, string>;
type UrlParameterValue = string | number | OrderByForAnyEntity;

interface iModelId {
  imodelId: string;
}

interface ChangesetIndex {
  changesetIndex: number;
}

interface ChangesetIdOrIndex {
  changesetIdOrIndex: string | number;
}

interface NamedVersionId {
  namedVersionId: string;
}

interface UrlParams<TParams> {
  urlParams?: TParams;
}

export class iModelsApiUrlFormatter {
  private _apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this._apiBaseUrl = apiBaseUrl;
  }

  public getChangesetsUrl(params: iModelId & UrlParams<GetChangesetListUrlParams>): string {
    return `${this._apiBaseUrl}/${params.imodelId}/changesets${this.formQueryString({ ...params.urlParams })}`;
  }

  public getChangesetUrl(params: iModelId & ChangesetIdOrIndex): string {
    return `${this._apiBaseUrl}/${params.imodelId}/changesets/${params.changesetIdOrIndex}`;
  }

  public getCheckpointUrl(params: iModelId & ChangesetIdOrIndex): string {
    return `${this._apiBaseUrl}/${params.imodelId}/changesets/${params.changesetIdOrIndex}/checkpoint`;
  }

  public parseCheckpointUrl(url: string): iModelId & ChangesetIndex {
    const urlParts = url.split("/");
    return {
      imodelId: urlParts[4], // TODO
      changesetIndex: parseInt(urlParts[6]) // TODO
    };
  }

  public parseNamedVersionUrl(url: string): iModelId & NamedVersionId {
    const urlParts = url.split("/");
    return {
      imodelId: urlParts[4], // TODO
      namedVersionId: urlParts[6] // TODO
    };
  }

  private formQueryString(urlParams: Dictionary<UrlParameterValue> | undefined): string {
    let queryString = "";
    for (const urlParameterKey in urlParams) {
      const urlParameterValue = urlParams[urlParameterKey];
      if (!urlParameterValue)
        continue;

      queryString = this.appendToQueryString(queryString, urlParameterKey, urlParameterValue);
    }

    return queryString;
  }

  private appendToQueryString(existingQueryString: string, parameterKey: string, parameterValue: UrlParameterValue): string {
    const separator = existingQueryString.length === 0 ? "?" : "&";
    return existingQueryString + `${separator}${parameterKey}=${this.stringify(parameterValue)}`;
  }

  private stringify(urlParameterValue: UrlParameterValue): string {
    if (this.isOrderBy(urlParameterValue)) {
      let result: string = urlParameterValue.property;
      if (urlParameterValue.operator)
        result += ` ${urlParameterValue.operator}`;

      return result;
    }

    return urlParameterValue.toString();
  }

  private isOrderBy(parameterValue: UrlParameterValue): parameterValue is OrderByForAnyEntity {
    return (parameterValue as OrderByForAnyEntity).property !== undefined;
  }
}
