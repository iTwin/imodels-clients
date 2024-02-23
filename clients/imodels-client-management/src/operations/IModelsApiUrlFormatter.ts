/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { CollectionRequestParams, Dictionary,OrderBy } from "../base/types";

import { GetBriefcaseListUrlParams } from "./briefcase/BriefcaseOperationParams";
import { ChangesetIdOrIndex, GetChangesetListUrlParams } from "./changeset/ChangesetOperationParams";
import { GetChangesetGroupListUrlParams } from "./changeset-group/ChangesetGroupOperationParams";
import { CheckpointParentEntityId } from "./checkpoint/CheckpointOperationParams";
import { GetIModelListUrlParams } from "./imodel/IModelOperationParams";
import { GetNamedVersionListUrlParams } from "./named-version/NamedVersionOperationParams";
import { DownloadThumbnailUrlParams } from "./OperationParamExports";

type OrderByForAnyEntity = OrderBy<{ [key: string]: unknown }, string>;
type UrlParameterValue = string | number | OrderByForAnyEntity;

export class IModelsApiUrlFormatter {
  private readonly _regexIgnoreCaseOption = "i";
  private readonly _groupNames = {
    iModelId: "iModelId",
    changesetIdOrIndex: "changesetIdOrIndex",
    namedVersionId: "namedVersionId",
    userId: "userId"
  };
  private readonly _numericRegex = new RegExp("^\\d+$");
  private readonly _changesetUrlRegex = new RegExp(`/iModels/(?<${this._groupNames.iModelId}>.*)/changesets/(?<${this._groupNames.changesetIdOrIndex}>[^/]*)`, this._regexIgnoreCaseOption);
  private readonly _checkpointUrlRegex = new RegExp(`/iModels/(?<${this._groupNames.iModelId}>.*)/changesets/(?<${this._groupNames.changesetIdOrIndex}>.*)/checkpoint`, this._regexIgnoreCaseOption);
  private readonly _namedVersionUrlRegex = new RegExp(`/iModels/(?<${this._groupNames.iModelId}>.*)/namedversions/(?<${this._groupNames.namedVersionId}>[^/]*)`, this._regexIgnoreCaseOption);
  private readonly _userUrlRegex = new RegExp(`/iModels/(?<${this._groupNames.iModelId}>.*)/users/(?<${this._groupNames.userId}>[^/]*)`, this._regexIgnoreCaseOption);

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

  public getSingleChangesetGroupUrl(params: { iModelId: string } & { changesetGroupId: string }): string {
    return `${this.baseUrl}/${params.iModelId}/changesetgroups/${params.changesetGroupId}`;
  }

  public getChangesetGroupListUrl(params: { iModelId: string, urlParams?: GetChangesetGroupListUrlParams }): string {
    return `${this.baseUrl}/${params.iModelId}/changesetgroups${this.formQueryString({ ...params.urlParams })}`;
  }

  public parseChangesetUrl(url: string): { iModelId: string } & ChangesetIdOrIndex {
    const matchedGroups: Dictionary<string> = this._changesetUrlRegex.exec(url)!.groups!;
    return {
      iModelId: matchedGroups[this._groupNames.iModelId],
      ...this.parseChangesetIdOrIndex(matchedGroups[this._groupNames.changesetIdOrIndex])
    };
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

  public getThumbnailUrl(params: { iModelId: string, urlParams?: DownloadThumbnailUrlParams }): string {
    return `${this.baseUrl}/${params.iModelId}/thumbnail${this.formQueryString({ ...params.urlParams })}`;
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

  public parseCheckpointUrl(url: string): { iModelId: string } & ChangesetIdOrIndex {
    const matchedGroups: Dictionary<string> = this._checkpointUrlRegex.exec(url)!.groups!;
    return {
      iModelId: matchedGroups[this._groupNames.iModelId],
      ...this.parseChangesetIdOrIndex(matchedGroups[this._groupNames.changesetIdOrIndex])
    };
  }

  public parseNamedVersionUrl(url: string): { iModelId: string, namedVersionId: string } {
    const matchedGroups: Dictionary<string> = this._namedVersionUrlRegex.exec(url)!.groups!;
    return {
      iModelId: matchedGroups[this._groupNames.iModelId],
      namedVersionId: matchedGroups[this._groupNames.namedVersionId]
    };
  }

  public parseUserUrl(url: string): { iModelId: string, userId: string } {
    const matchedGroups: Dictionary<string> = this._userUrlRegex.exec(url)!.groups!;
    return {
      iModelId: matchedGroups[this._groupNames.iModelId],
      userId: matchedGroups[this._groupNames.userId]
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

  /**
   * API could return Changeset urls that either contain id or index since both are valid identifiers
   * so here we handle both scenarios. We assume if the value contains only digits and is shorter than 40
   * symbols it is a numeric index, otherwise, it is a string id.
   */
  private parseChangesetIdOrIndex(changesetIdOrIndex: string): ChangesetIdOrIndex {
    const containsOnlyDigits = this._numericRegex.test(changesetIdOrIndex);
    if (containsOnlyDigits && changesetIdOrIndex.length < 40)
      return {
        changesetIndex: parseInt(changesetIdOrIndex, 10)
      };

    return {
      changesetId: changesetIdOrIndex
    };
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
