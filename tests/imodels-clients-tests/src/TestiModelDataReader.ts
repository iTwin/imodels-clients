/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";

export interface TestiModelDescriptor {
  baselineFilePath: string;
}

export interface TestChangesetDescripor {
  id: string;
  parentId: string;
  changesetFilePath: string;
}

interface ChangesetDescriptorFile {
  changesets: ChangesetDescriptorFileItem[];
}

interface ChangesetDescriptorFileItem {
  index: number;
  id: string;
  parentId: string;
  fileName: string;
}

export class TestiModelDataReader {
  private _changesetDescriptors: TestChangesetDescripor[];

  constructor(private _imodelDataRootPath: string) {
  }

  public get iModel(): TestiModelDescriptor {
    const fileNamesInDirectory = fs.readdirSync(this._imodelDataRootPath);
    const bimFile = fileNamesInDirectory.find(fileName => fileName.indexOf(".bim") >= 0);
    if (!bimFile)
      throw new Error("bim file not found");

    return {
      baselineFilePath: `${this._imodelDataRootPath}${bimFile}`
    };
  }

  public get Changesets(): TestChangesetDescripor[] {
    if (!this._changesetDescriptors)
      this.readChangesetDescriptorsFromFile();

    return this._changesetDescriptors;

  }

  private readChangesetDescriptorsFromFile(): void {
    const changesetDescriptFileString = fs.readFileSync(`${this._imodelDataRootPath}changesets.json`, "utf8");
    const changesetDescriptorFile: ChangesetDescriptorFile = JSON.parse(changesetDescriptFileString);
    this._changesetDescriptors = changesetDescriptorFile.changesets.map(cs => {
      return {
        id: cs.id,
        parentId: cs.parentId,
        changesetFilePath: `${this._imodelDataRootPath}changesets/${cs.fileName}`
      }
    });
  }
}
