/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import * as fs from "fs";
import { TestSetupError } from "./CommonTestUtils";
import { Config } from "./Config";
import { Constants } from "./Constants";

export interface TestiModelDescriptor {
  name: string;
  description: string;
  baselineFilePath: string;
}

export interface TestBriefcaseDescriptor {
  id: number;
  deviceName: string;
}

export interface TestChangesetDescriptor {
  id: string;
  description: string;
  parentId: string;
  containingChanges: number;

  index: number;
  changesetFilePath: string;
}

interface ChangesetDescriptorFile {
  changesets: ChangesetDescriptorFileItem[];
}

interface ChangesetDescriptorFileItem {
  id: string;
  index: number;
  description: string;
  containingChanges: number;
  parentId: string;
  fileName: string;
}

export class TestiModelMetadata {
  private static _imodelDataRootPath = `${Constants.AssetsPath}test-imodel`
  private static _imodelDescriptor: TestiModelDescriptor;
  private static _changesetDescriptors: TestChangesetDescriptor[];

  public static get iModel(): TestiModelDescriptor {
    return this._imodelDescriptor ?? this.initializeiModelDescriptor();
  }

  public static get Briefcase(): TestBriefcaseDescriptor {
    return { id: 2, deviceName: Constants.TestDeviceName };
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
      name: Config.get().DefaultiModelName,
      description: "Default test iModel description",
      baselineFilePath: `${this._imodelDataRootPath}/${bimFile}`
    };
    return this._imodelDescriptor;
  }

  private static initializeChangesetDescriptors(): TestChangesetDescriptor[] {
    const changesetDescriptorFilePath = `${this._imodelDataRootPath}/changesets.json`;
    if (!fs.existsSync(changesetDescriptorFilePath))
      throw new TestSetupError("Changeset descriptor file for test iModel not found.");

    const changesetDescriptFileString = fs.readFileSync(changesetDescriptorFilePath, "utf8");
    const changesetDescriptorFile: ChangesetDescriptorFile = JSON.parse(changesetDescriptFileString);
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
