/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { TestSetupError } from "../../CommonTestUtils";

export interface TestiModelBaselineFile {
  filePath: string;
}

export interface TestChangesetFile {
  id: string;
  index: number;
  description: string;
  parentId: string;
  containingChanges: number;
  filePath: string;
}

interface ChangesetDescriptorFile {
  changesets: ChangesetDescriptorFileItem[];
}

interface ChangesetDescriptorFileItem extends TestChangesetFile {
  fileName: string;
}

export class TestiModelFileProvider {
  private static readonly _imodelDataRootPath = `${__dirname}/../../../assets/test-imodel`;
  private static _baselineFile: TestiModelBaselineFile;
  private static _changesetFiles: TestChangesetFile[];

  public static get imodel(): TestiModelBaselineFile {
    return this._baselineFile ?? this.initializeBaselineFile();
  }

  public static get changesets(): TestChangesetFile[] {
    return this._changesetFiles ?? this.initializeChangesetFiles();
  }

  private static initializeBaselineFile(): TestiModelBaselineFile {
    const fileNamesInDirectory = fs.readdirSync(this._imodelDataRootPath);
    const bimFile = fileNamesInDirectory.find(fileName => fileName.indexOf(".bim") >= 0);
    if (!bimFile)
      throw new TestSetupError("Baseline file for test iModel not found.");

    this._baselineFile = {
      filePath: `${this._imodelDataRootPath}/${bimFile}`
    };
    return this._baselineFile;
  }

  private static initializeChangesetFiles(): TestChangesetFile[] {
    const changesetDescriptorFilePath = `${this._imodelDataRootPath}/changesets.json`;
    if (!fs.existsSync(changesetDescriptorFilePath))
      throw new TestSetupError("Changeset descriptor file for test iModel not found.");

    const changesetDescriptorFileString = fs.readFileSync(changesetDescriptorFilePath, "utf8");
    const changesetDescriptorFile: ChangesetDescriptorFile = JSON.parse(changesetDescriptorFileString);
    if (!changesetDescriptorFile?.changesets)
      throw new TestSetupError("Changeset descriptor file does not contain expected data.");

    this._changesetFiles = changesetDescriptorFile.changesets.map(cs => {
      const changesetFilePath = `${this._imodelDataRootPath}/changesets/${cs.fileName}`;
      if (!fs.existsSync(changesetFilePath))
        throw new TestSetupError("Changeset file for test iModel not found.");
      return { ...cs, filePath: changesetFilePath };
    });

    return this._changesetFiles;
  }
}
