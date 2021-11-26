/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OrderBy } from "../base/interfaces/CommonInterfaces";
import { Dictionary } from "../base/interfaces/UtilityTypes";
import { ChangesetIdOrIndex, GetChangesetListUrlParams } from "./changeset/ChangesetOperationParams";

type OrderByForAnyEntity = OrderBy<{ [key: string]: unknown }, string>;
type UrlParameterValue = string | number | OrderByForAnyEntity;

interface iModelId {
  imodelId: string;
}

interface ChangesetIndex {
  changesetIndex: number;
}

interface NamedVersionId {
  namedVersionId: string;
}

interface UrlParams<TParams> {
  urlParams?: TParams;
}

export class iModelsApiUrlFormatter {
  private readonly _regexIgnoreCaseOption = "i";
  private readonly _groupNames = {
    imodelId: "imodelId",
    changesetIndex: "changesetIndex",
    namedVersionId: "namedVersionId"
  };
  private readonly _checkpointUrlRegex = new RegExp(`/imodels/(?<${this._groupNames.imodelId}>.*?)/changesets/(?<${this._groupNames.changesetIndex}>.*?)/checkpoint`, this._regexIgnoreCaseOption);
  private readonly _namedVersionUrlRegex = new RegExp(`/imodels/(?<${this._groupNames.imodelId}>.*?)/namedversions/(?<${this._groupNames.namedVersionId}>.*)`, this._regexIgnoreCaseOption);

  // TODO: make `apiBaseUrl` protected when all url formation is move here
  constructor(public readonly baseUri: string) {
  }

  public getChangesetsUrl(params: iModelId & UrlParams<GetChangesetListUrlParams>): string {
    return `${this.baseUri}/${params.imodelId}/changesets${this.formQueryString({ ...params.urlParams })}`;
  }

  public getChangesetUrl(params: iModelId & ChangesetIdOrIndex): string {
    return `${this.baseUri}/${params.imodelId}/changesets/${params.changesetId ?? params.changesetIndex}`;
  }

  public getCheckpointUrl(params: iModelId & ChangesetIdOrIndex): string {
    return `${this.baseUri}/${params.imodelId}/changesets/${params.changesetId ?? params.changesetIndex}/checkpoint`;
  }

  public parseCheckpointUrl(url: string): iModelId & ChangesetIndex {
    const matchedGroups: Dictionary<string> = this._checkpointUrlRegex.exec(url)!.groups!;
    return {
      imodelId: matchedGroups[this._groupNames.imodelId],
      changesetIndex: parseInt(matchedGroups[this._groupNames.changesetIndex], 10)
    };
  }

  public parseNamedVersionUrl(url: string): iModelId & NamedVersionId {
    const matchedGroups: Dictionary<string> = this._namedVersionUrlRegex.exec(url)!.groups!;
    return {
      imodelId: matchedGroups[this._groupNames.imodelId],
      namedVersionId: matchedGroups[this._groupNames.namedVersionId]
    };
  }

  protected formQueryString(urlParameters: Dictionary<UrlParameterValue> | undefined): string {
    let queryString = "";
    for (const urlParameterKey in urlParameters) {
      if (!Object.hasOwnProperty.call(urlParameters, urlParameterKey))
        continue;

      const urlParameterValue = urlParameters[urlParameterKey];
      if (!urlParameterValue)
        continue;

      queryString = this.appendToQueryString(queryString, urlParameterKey, urlParameterValue);
    }

    return queryString;
  }

  private appendToQueryString(existingQueryString: string, parameterKey: string, parameterValue: UrlParameterValue): string {
    const separator = existingQueryString.length === 0 ? "?" : "&";
    return `${existingQueryString}${separator}${parameterKey}=${this.stringify(parameterValue)}`;
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
