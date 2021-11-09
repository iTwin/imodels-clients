import { AuthorizationCallback, iModelsClient } from "@itwin/imodels-client-authoring";
import { Config, Constants, TestAuthorizationProvider, TestClientOptions, TestiModelGroup, TestProjectProvider } from "../common";

describe("[Authoring] LockOperations", () => {
  let imodelsClient: iModelsClient;
  let authorization: AuthorizationCallback;
  let projectId: string;
  let testiModelGroup: TestiModelGroup;

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
  });

  it ("should get lock list", () => {
    // Arrange

    // Act

    // Asert
  });
});