/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";

import { injectable } from "inversify";

import { SynchronizationInfoForCreate } from "@itwin/imodels-client-authoring";

import { TestSetupError } from "../../CommonTestUtils";

export interface TestIModelBaselineFile {
  filePath: string;
}

export interface TestChangesetFile {
  id: string;
  index: number;
  description: string;
  parentId: string;
  containingChanges: number;
  synchronizationInfo?: SynchronizationInfoForCreate;
  filePath: string;
}

interface ChangesetDescriptorFile {
  changesets: ChangesetDescriptorFileItem[];
}

interface ChangesetDescriptorFileItem extends TestChangesetFile {
  fileName: string;
}

@injectable()
export class TestIModelFileProvider {
  private readonly _iModelDataRootPath = `${__dirname}/../../assets/test-imodel`;
  private _baselineFile: TestIModelBaselineFile | undefined;
  private _changesetFiles: TestChangesetFile[] | undefined;

  public get iModel(): TestIModelBaselineFile {
    return this._baselineFile ?? this.initializeBaselineFile();
  }

  public get changesets(): TestChangesetFile[] {
    return this._changesetFiles ?? this.initializeChangesetFiles();
  }

  private initializeBaselineFile(): TestIModelBaselineFile {
    const fileNamesInDirectory = fs.readdirSync(this._iModelDataRootPath);
    const bimFile = fileNamesInDirectory.find(
      (fileName) => fileName.indexOf(".bim") >= 0
    );
    if (!bimFile)
      throw new TestSetupError("Baseline file for test iModel not found.");

    this._baselineFile = {
      filePath: `${this._iModelDataRootPath}/${bimFile}`,
    };
    return this._baselineFile;
  }

  private initializeChangesetFiles(): TestChangesetFile[] {
    const changesetDescriptorFilePath = `${this._iModelDataRootPath}/changesets.json`;
    if (!fs.existsSync(changesetDescriptorFilePath))
      throw new TestSetupError(
        "Changeset descriptor file for test iModel not found."
      );

    const changesetDescriptorFileString = fs.readFileSync(
      changesetDescriptorFilePath,
      "utf8"
    );
    const changesetDescriptorFile: ChangesetDescriptorFile = JSON.parse(
      changesetDescriptorFileString
    );
    if (!changesetDescriptorFile?.changesets)
      throw new TestSetupError(
        "Changeset descriptor file does not contain expected data."
      );

    this._changesetFiles = changesetDescriptorFile.changesets.map((cs) => {
      const changesetFilePath = `${this._iModelDataRootPath}/changesets/${cs.fileName}`;
      if (!fs.existsSync(changesetFilePath))
        throw new TestSetupError("Changeset file for test iModel not found.");
      return { ...cs, filePath: changesetFilePath };
    });

    return this._changesetFiles;
  }
}
