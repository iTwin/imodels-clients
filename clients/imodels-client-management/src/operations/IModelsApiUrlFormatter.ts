/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, OrderBy } from "../base/interfaces/CommonInterfaces";
import { Dictionary } from "../base/interfaces/UtilityTypes";
import { ChangesetIdOrIndex, GetChangesetListUrlParams } from "./changeset/ChangesetOperationParams";
import { CheckpointParentEntityId, GetBriefcaseListUrlParams, GetIModelListUrlParams, GetNamedVersionListUrlParams } from ".";

type OrderByForAnyEntity = OrderBy<{ [key: string]: unknown }, string>;
type UrlParameterValue = string | number | OrderByForAnyEntity;

export class IModelsApiUrlFormatter {
  private readonly _regexIgnoreCaseOption = "i";
  private readonly _groupNames = {
    iModelId: "iModelId",
    changesetIndex: "changesetIndex",
    namedVersionId: "namedVersionId"
  };
  private readonly _checkpointUrlRegex = new RegExp(`/iModels/(?<${this._groupNames.iModelId}>.*?)/changesets/(?<${this._groupNames.changesetIndex}>.*?)/checkpoint`, this._regexIgnoreCaseOption);
  private readonly _namedVersionUrlRegex = new RegExp(`/iModels/(?<${this._groupNames.iModelId}>.*?)/namedversions/(?<${this._groupNames.namedVersionId}>.*)`, this._regexIgnoreCaseOption);

  constructor(protected readonly baseUrl: string) {
  }

  public getCreateIModelUrl(): string {
    return this.baseUrl;
  }

  public getSingleIModelUrl(params: { iModelId: string }): string {
    return `${this.baseUrl}/${params.iModelId}`;
  }

  public getIModelListUrl(params: { urlParams: GetIModelListUrlParams }): string {
    return `${this.baseUrl}${this.formQueryString({ ...params.urlParams })}`;
  }

  public getSingleBriefcaseUrl(params: { iModelId: string } & { briefcaseId: number }): string {
    return `${this.baseUrl}/${params.iModelId}/briefcases/${params.briefcaseId}`;
  }

  public getBriefcaseListUrl(params: { iModelId: string, urlParams?: GetBriefcaseListUrlParams }): string {
    return `${this.baseUrl}/${params.iModelId}/briefcases${this.formQueryString({ ...params.urlParams })}`;
  }

  public getSingleChangesetUrl(params: { iModelId: string } & ChangesetIdOrIndex): string {
    return `${this.baseUrl}/${params.iModelId}/changesets/${params.changesetId ?? params.changesetIndex}`;
  }

  public getChangesetListUrl(params: { iModelId: string, urlParams?: GetChangesetListUrlParams }): string {
    return `${this.baseUrl}/${params.iModelId}/changesets${this.formQueryString({ ...params.urlParams })}`;
  }

  public getSingleNamedVersionUrl(params: { iModelId: string } & { namedVersionId: string }): string {
    return `${this.baseUrl}/${params.iModelId}/namedversions/${params.namedVersionId}`;
  }

  public getNamedVersionListUrl(params: { iModelId: string, urlParams?: GetNamedVersionListUrlParams }): string {
    return `${this.baseUrl}/${params.iModelId}/namedversions${this.formQueryString({ ...params.urlParams })}`;
  }

  public getCheckpointUrl(params: { iModelId: string } & CheckpointParentEntityId): string {
    const parentEntityUrlPath = params.namedVersionId
      ? `namedversions/${params.namedVersionId}`
      : `changesets/${params.changesetId ?? params.changesetIndex}`;

    return `${this.baseUrl}/${params.iModelId}/${parentEntityUrlPath}/checkpoint`;
  }

  public getUserListUrl(params: { iModelId: string, urlParams?: CollectionRequestParams }): string {
    return `${this.baseUrl}/${params.iModelId}/users${this.formQueryString({ ...params.urlParams })}`;
  }

  public getSingleUserUrl(params: { iModelId: string } & { userId: string }): string {
    return `${this.baseUrl}/${params.iModelId}/users/${params.userId}`;
  }

  public getUserPermissionsUrl(params: { iModelId: string }): string {
    return `${this.baseUrl}/${params.iModelId}/permissions`;
  }

  public parseCheckpointUrl(url: string): { iModelId: string, changesetIndex: number } {
    const matchedGroups: Dictionary<string> = this._checkpointUrlRegex.exec(url)!.groups!;
    return {
      iModelId: matchedGroups[this._groupNames.iModelId],
      changesetIndex: parseInt(matchedGroups[this._groupNames.changesetIndex], 10)
    };
  }

  public parseNamedVersionUrl(url: string): { iModelId: string, namedVersionId: string } {
    const matchedGroups: Dictionary<string> = this._namedVersionUrlRegex.exec(url)!.groups!;
    return {
      iModelId: matchedGroups[this._groupNames.iModelId],
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
