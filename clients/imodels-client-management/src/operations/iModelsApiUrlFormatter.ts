/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { OrderBy } from "../base/interfaces/CommonInterfaces";
import { Dictionary } from "../base/interfaces/UtilityTypes";
import { ChangesetIdOrIndex, GetChangesetListUrlParams } from "./changeset/ChangesetOperationParams";
import { CheckpointParentEntityId, GetBriefcaseListUrlParams, GetNamedVersionListUrlParams, GetiModelListUrlParams } from ".";

type OrderByForAnyEntity = OrderBy<{ [key: string]: unknown }, string>;
type UrlParameterValue = string | number | OrderByForAnyEntity;

export class iModelsApiUrlFormatter {
  private readonly _regexIgnoreCaseOption = "i";
  private readonly _groupNames = {
    imodelId: "imodelId",
    changesetIndex: "changesetIndex",
    namedVersionId: "namedVersionId"
  };
  private readonly _checkpointUrlRegex = new RegExp(`/imodels/(?<${this._groupNames.imodelId}>.*?)/changesets/(?<${this._groupNames.changesetIndex}>.*?)/checkpoint`, this._regexIgnoreCaseOption);
  private readonly _namedVersionUrlRegex = new RegExp(`/imodels/(?<${this._groupNames.imodelId}>.*?)/namedversions/(?<${this._groupNames.namedVersionId}>.*)`, this._regexIgnoreCaseOption);

  constructor(protected readonly baseUri: string) {
  }

  public getCreateiModelUrl(): string {
    return this.baseUri;
  }

  public getSingleiModelUrl(params: { imodelId: string }): string {
    return `${this.baseUri}/${params.imodelId}`;
  }

  public getiModelListUrl(params: { urlParams: GetiModelListUrlParams }): string {
    return `${this.baseUri}${this.formQueryString({ ...params.urlParams })}`;
  }

  public getSingleBriefcaseUrl(params: { imodelId: string } & { briefcaseId: number }): string {
    return `${this.baseUri}/${params.imodelId}/briefcases/${params.briefcaseId}`;
  }

  public getBriefcaseListUrl(params: { imodelId: string, urlParams?: GetBriefcaseListUrlParams }): string {
    return `${this.baseUri}/${params.imodelId}/briefcases${this.formQueryString({ ...params.urlParams })}`;
  }

  public getSingleChangesetUrl(params: { imodelId: string } & ChangesetIdOrIndex): string {
    return `${this.baseUri}/${params.imodelId}/changesets/${params.changesetId ?? params.changesetIndex}`;
  }

  public getChangesetListUrl(params: { imodelId: string, urlParams?: GetChangesetListUrlParams }): string {
    return `${this.baseUri}/${params.imodelId}/changesets${this.formQueryString({ ...params.urlParams })}`;
  }

  public getSingleNamedVersionUrl(params: { imodelId: string } & { namedVersionId: string }): string {
    return `${this.baseUri}/${params.imodelId}/namedversions/${params.namedVersionId}`;
  }

  public getNamedVersionListUrl(params: { imodelId: string, urlParams?: GetNamedVersionListUrlParams }): string {
    return `${this.baseUri}/${params.imodelId}/namedversions${this.formQueryString({ ...params.urlParams })}`;
  }

  public getCheckpointUrl(params: { imodelId: string } & CheckpointParentEntityId): string {
    const parentEntityUrlPath = params.namedVersionId
      ? `namedversions/${params.namedVersionId}`
      : `changesets/${params.changesetId ?? params.changesetIndex}`;

    return `${this.baseUri}/${params.imodelId}/${parentEntityUrlPath}/checkpoint`;
  }

  public parseCheckpointUrl(url: string): { imodelId: string, changesetIndex: number } {
    const matchedGroups: Dictionary<string> = this._checkpointUrlRegex.exec(url)!.groups!;
    return {
      imodelId: matchedGroups[this._groupNames.imodelId],
      changesetIndex: parseInt(matchedGroups[this._groupNames.changesetIndex], 10)
    };
  }

  public parseNamedVersionUrl(url: string): { imodelId: string, namedVersionId: string } {
    const matchedGroups: Dictionary<string> = this._namedVersionUrlRegex.exec(url)!.groups!;
    return {
      imodelId: matchedGroups[this._groupNames.imodelId],
      namedVersionId: matchedGroups[this._groupNames.namedVersionId]
    };
  }

  protected formQueryString(urlParameters: Dictionary<UrlParameterValue> | undefined): string {
    let queryString = "";
    for (const urlParameterKey in urlParameters) {
      if (!Object.prototype.hasOwnProperty.call(urlParameters, urlParameterKey))
        continue;

      const urlParameterValue = urlParameters[urlParameterKey];
      if (!this.shouldAppendToUrl(urlParameterValue))
        continue;

      queryString = this.appendToQueryString(queryString, urlParameterKey, urlParameterValue);
    }

    return queryString;
  }

  private shouldAppendToUrl(urlParameterValue: UrlParameterValue): boolean {
    if (urlParameterValue === null || urlParameterValue === undefined)
      return false;

    if (typeof urlParameterValue === "string" && !urlParameterValue.trim())
      return false;

    return true;
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
