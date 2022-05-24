/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Possible iModel permission values. */
export enum IModelPermission {
  /** Allows to view iModel in web browser, but does not allow to get its local copy and view in desktop app. */
  WebView = "imodels_webview",
  /** Allows to open and view an iModel only in read-only state. */
  Read = "imodels_read",
  /**
   * Allows to make changes to an iModel. Allows to create and modify Named Versions. Allows to create mapping
   * between PW connection and iModel to facilitate connectors.
   */
  Write = "imodels_write",
  /**
   * Allows to create an iModel. Allows to configure access per iModel. Allows to manage Locks, Codes or local copies
   * for the entire iModel. This permission is both iModel and Project level permission, but Create iModel operation
   * requires that user has `imodels_manage` permission on the Project level. Use
   * {@link https://developer.bentley.com/apis/projects/ Projects API} to check if user can create an iModel on a
   * given Project.
   */
  Manage = "imodels_manage",
  /**
   * Allows to delete an iModel. This permission is only available on the Project level. Use
   * {@link https://developer.bentley.com/apis/projects/ Projects API} to check if user can delete iModels on a given
   * Project. */
  Delete = "imodels-delete"
}

/** User permissions. */
export interface UserPermissions {
  /** A set of iModel permissions current user has on a given iModel. */
  permissions: IModelPermission[];
}
