import { AuthorizationCallback, GetLockListParams, iModelsClient, toArray } from "@itwin/imodels-client-authoring";
import { expect } from "chai";
import { Config, Constants, iModelMetadata, TestAuthorizationProvider, TestClientOptions, TestiModelCreator, TestiModelGroup, TestProjectProvider } from "../common";

describe("[Authoring] LockOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;
  let testiModel: iModelMetadata;

  before(async () => {
    imodelsClient = new iModelsClient(new TestClientOptions());
    authorization = await TestAuthorizationProvider.getAuthorization(Config.get().testUsers.admin1);
    projectId = await TestProjectProvider.getProjectId();
    testiModelGroup = new TestiModelGroup({
      labels: {
        package: Constants.PackagePrefix,
        testSuite: "AuthoringLockOperations"
      }
    });
    testiModel = await TestiModelCreator.createEmpty({
      authorization,
      imodelsClient,
      projectId,
      imodelName: testiModelGroup.getPrefixediModelName("Test iModel for write")
    });
  });

  it("should get lock list", async () => {
    // Arrange
    const getLockListParams: GetLockListParams = {
      authorization,
      imodelId: testiModel.id
    }

    // Act
    const locks = imodelsClient.Locks.getList(getLockListParams);

    // Assert
    const lockArray = await toArray(locks);
    expect(lockArray).length.to.equal(0);
  });
});