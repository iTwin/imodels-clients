import * as puppeteer from "puppeteer";
import axios, { AxiosResponse } from "axios";
import { URLSearchParams } from "url";

interface AccessTokenResponse {
  access_token: string;
}

interface AuthConfig {
  authority: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  redirectUrl: string;
}

interface TestUserCredentials {
  email: string;
  password: string;
}

export class TestAuthClient {
  public async getAccessToken(params: {
    authConfig: AuthConfig,
    testUserCredentials: TestUserCredentials
  }): Promise<string> {
    const browserLaunchOptions: puppeteer.LaunchOptions & puppeteer.BrowserLaunchArgumentOptions = { dumpio: true, headless: true };
    const browser: puppeteer.Browser = await puppeteer.launch(browserLaunchOptions);
    const browserPage: puppeteer.Page = await browser.newPage();

    await browserPage.setRequestInterception(true);
    const authorizationCodePromise = this.interceptRedirectAndGetAuthorizationCode({ browserPage, ...params });

    await browserPage.goto(this.getAuthenticationUrl(params), { waitUntil: "networkidle2" });
    await this.fillCredentials({ browserPage, ...params });
    const accessToken = await this.exchangeAuthorizationCodeForAccessToken({ authorizationCode: await authorizationCodePromise, ...params });

    await browser.close();
    return accessToken;
  }

  private getAuthenticationUrl(params: {
    authConfig: AuthConfig
  }): string {
    return `${params.authConfig.authority}/connect/authorize?` +
      `client_id=${encodeURIComponent(params.authConfig.clientId)}&` +
      `scope=${encodeURIComponent(params.authConfig.scopes)}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(params.authConfig.redirectUrl)}`;
  }

  private async fillCredentials(params: {
    browserPage: puppeteer.Page,
    testUserCredentials: TestUserCredentials
  }): Promise<void> {
    const emailField = await params.browserPage.waitForSelector("#identifierInput");
    await emailField.type(params.testUserCredentials.email);

    const nextButton = await params.browserPage.waitForSelector("#sign-in-button");
    await nextButton.click();

    const passwordField = await params.browserPage.waitForSelector("#password");
    await passwordField.type(params.testUserCredentials.password);

    const signInButton = await params.browserPage.waitForSelector("#sign-in-button");
    await Promise.all([
      signInButton.click(),
      params.browserPage.waitForNavigation({ waitUntil: "networkidle2" })
    ]);

    await this.handleConsentPageIfNeeded(params);
  }

  private async handleConsentPageIfNeeded(params: {
    browserPage: puppeteer.Page
  }): Promise<void> {
    const isConsentPage = params.browserPage.url().indexOf("consent") !== -1;
    if (!isConsentPage)
      return;

    const consentButton = await params.browserPage.waitForSelector("#bentleySubmit");
    await Promise.all([
      consentButton.click(),
      params.browserPage.waitForNavigation({ waitUntil: "networkidle2" })
    ]);
  }

  private async exchangeAuthorizationCodeForAccessToken(params: {
    authorizationCode: string,
    authConfig: AuthConfig
  }): Promise<string> {
    const authorizationCode = this.getCodeFromUrl(params.authorizationCode);
    const encodedClientCredentials = Buffer.from(`${encodeURIComponent(params.authConfig.clientId)}:${encodeURIComponent(params.authConfig.clientSecret)}`).toString('base64');

    const response: AxiosResponse<AccessTokenResponse> = await axios({
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${encodedClientCredentials}`
      },
      data: new URLSearchParams({
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: params.authConfig.redirectUrl
      }),
      url: `${params.authConfig.authority}/connect/token`
    });

    return response.data.access_token;
  }

  private getCodeFromUrl(redirectUrl: string): string {
    const codeOccurrenceIdx = redirectUrl.indexOf("code");
    const codeUrlParam = redirectUrl.substring(codeOccurrenceIdx);
    const code = codeUrlParam.split("=")[1];
    return code;
  }

  private async interceptRedirectAndGetAuthorizationCode(params: { browserPage: puppeteer.Page, authConfig: AuthConfig }): Promise<string> {
    return new Promise<string>((resolve) => {
      params.browserPage.on("request", async (interceptedRequest) => {
        const currentRequestUrl = interceptedRequest.url();
        if (!currentRequestUrl.startsWith(params.authConfig.redirectUrl)) {
          interceptedRequest.continue();
        } else {
          await interceptedRequest.respond({
            status: 200,
            contentType: "text/html",
            body: "OK"
          });

          resolve(this.getCodeFromUrl(currentRequestUrl));
        }
      })
    });
  }
}

describe("auth client", () => {
  it.only("should auth", async () => {
    const testAuthClient = new TestAuthClient();
    const token = await testAuthClient.getAccessToken({
      authConfig: {

      },
      testUserCredentials: {

      }
    });
    console.log(token);
  });
})