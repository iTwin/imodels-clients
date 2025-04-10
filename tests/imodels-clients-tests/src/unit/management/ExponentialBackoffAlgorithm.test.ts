/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ExponentialBackoffAlgorithm } from "@itwin/imodels-client-management";
import { expect } from "chai";

describe("[Management] ExponentialBackoffAlgorithm", () => {
  it("should calculate sleep duration correctly", () => {
    const testedClass = new ExponentialBackoffAlgorithm({
      baseDelayInMs: 300,
      factor: 3
    });

    expect(testedClass.getSleepDurationInMs(0)).to.be.equal(300);
    expect(testedClass.getSleepDurationInMs(1)).to.be.equal(900);
    expect(testedClass.getSleepDurationInMs(2)).to.be.equal(2700);
    expect(testedClass.getSleepDurationInMs(3)).to.be.equal(8100);
  });
});
