/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { TestSetupError } from "../../CommonTestUtils";
import { Constants } from "../../Constants";

export interface TestiModelDescriptor {
  baselineFilePath: string;
}

export interface TestChangesetDescriptor {
  id: string;
  index: number;
  description: string;
  parentId: string;
  containingChanges: number;
  changesetFilePath: string;
}

interface ChangesetDescriptorFile {
  changesets: ChangesetDescriptorFileItem[];
}

interface ChangesetDescriptorFileItem extends TestChangesetDescriptor {
  fileName: string;
}

export class TestiModelMetadata {
  private static _imodelDataRootPath = `${Constants.AssetsPath}test-imodel`
  private static _imodelDescriptor: TestiModelDescriptor;
  private static _changesetDescriptors: TestChangesetDescriptor[];

  public static get iModel(): TestiModelDescriptor {
    return this._imodelDescriptor ?? this.initializeiModelDescriptor();
  }

  public static get Changesets(): TestChangesetDescriptor[] {
    return this._changesetDescriptors ?? this.initializeChangesetDescriptors();
  }

  private static initializeiModelDescriptor(): TestiModelDescriptor {
    const fileNamesInDirectory = fs.readdirSync(this._imodelDataRootPath);
    const bimFile = fileNamesInDirectory.find(fileName => fileName.indexOf(".bim") >= 0);
    if (!bimFile)
      throw new TestSetupError("Baseline file for test iModel not found.");

    this._imodelDescriptor = {
      baselineFilePath: `${this._imodelDataRootPath}/${bimFile}`
    };
    return this._imodelDescriptor;
  }

  private static initializeChangesetDescriptors(): TestChangesetDescriptor[] {
    const changesetDescriptorFilePath = `${this._imodelDataRootPath}/changesets.json`;
    if (!fs.existsSync(changesetDescriptorFilePath))
      throw new TestSetupError("Changeset descriptor file for test iModel not found.");

    const changesetDescriptorFileString = fs.readFileSync(changesetDescriptorFilePath, "utf8");
    const changesetDescriptorFile: ChangesetDescriptorFile = JSON.parse(changesetDescriptorFileString);
    if (!changesetDescriptorFile?.changesets)
      throw new TestSetupError("Changeset descriptor file does not contain expected data.");

    this._changesetDescriptors = changesetDescriptorFile.changesets.map(cs => {
      const changesetFilePath = `${this._imodelDataRootPath}/changesets/${cs.fileName}`;
      if (!fs.existsSync(changesetFilePath))
        throw new TestSetupError("Changeset file for test iModel not found.");
      return { ...cs, changesetFilePath };
    });

    return this._changesetDescriptors;
  }
}
