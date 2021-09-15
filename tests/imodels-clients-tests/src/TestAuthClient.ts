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
  constructor(private _authConfig: AuthConfig) {
  }

  public async getAccessToken(testUserCredentials: TestUserCredentials): Promise<string> {
    const browserLaunchOptions: puppeteer.BrowserLaunchArgumentOptions = { headless: true };
    const browser: puppeteer.Browser = await puppeteer.launch(browserLaunchOptions);
    const browserPage: puppeteer.Page = await browser.newPage();

    const authorizationCodePromise = this.interceptRedirectAndGetAuthorizationCode(browserPage);

    await browserPage.goto(this.getAuthenticationUrl(), { waitUntil: "networkidle2" });
    await this.fillCredentials(browserPage, testUserCredentials);
    await this.consentIfNeeded(browserPage);
    const accessToken = await this.exchangeAuthorizationCodeForAccessToken(await authorizationCodePromise);

    await browser.close();
    return accessToken;
  }

  private getAuthenticationUrl(): string {
    return `${this._authConfig.authority}/connect/authorize?` +
      `client_id=${encodeURIComponent(this._authConfig.clientId)}&` +
      `scope=${encodeURIComponent(this._authConfig.scopes)}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(this._authConfig.redirectUrl)}`;
  }

  private async fillCredentials(browserPage: puppeteer.Page, testUserCredentials: TestUserCredentials): Promise<void> {
    const emailField = await browserPage.waitForSelector("#identifierInput");
    await emailField.type(testUserCredentials.email);

    const nextButton = await browserPage.waitForSelector("#sign-in-button");
    await nextButton.click();

    const passwordField = await browserPage.waitForSelector("#password");
    await passwordField.type(testUserCredentials.password);

    const signInButton = await browserPage.waitForSelector("#sign-in-button");
    await Promise.all([
      signInButton.click(),
      browserPage.waitForNavigation({ waitUntil: "networkidle2" })
    ]);
  }

  private async consentIfNeeded(browserPage: puppeteer.Page): Promise<void> {
    const isConsentPage = await browserPage.title() === "Request for Approval"; // todo: check if valid
    if (!isConsentPage)
      return;

    const consentButton = await browserPage.waitForSelector("#bentleySubmit");
    await Promise.all([
      consentButton.click(),
      browserPage.waitForNavigation({ waitUntil: "networkidle2" }) // todo: event names into constants
    ]);
  }

  private async exchangeAuthorizationCodeForAccessToken(authorizationCode: string): Promise<string> {
    const encodedClientCredentials = Buffer.from(`${encodeURIComponent(this._authConfig.clientId)}:${encodeURIComponent(this._authConfig.clientSecret)}`).toString('base64');

    const response: AxiosResponse<AccessTokenResponse> = await axios({
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${encodedClientCredentials}`
      },
      data: new URLSearchParams({
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: this._authConfig.redirectUrl
      }),
      url: `${this._authConfig.authority}/connect/token`
    });

    return response.data.access_token;
  }

  private getCodeFromUrl(redirectUrl: string): string {
    const codeOccurrenceIdx = redirectUrl.indexOf("code");
    const codeUrlParam = redirectUrl.substring(codeOccurrenceIdx);
    const code = codeUrlParam.split("=")[1];
    return code;
  }

  private async interceptRedirectAndGetAuthorizationCode(browserPage: puppeteer.Page): Promise<string> {
    await browserPage.setRequestInterception(true);
    return new Promise<string>((resolve) => {
      browserPage.on("request", async (interceptedRequest) => {
        const currentRequestUrl = interceptedRequest.url();
        if (!currentRequestUrl.startsWith(this._authConfig.redirectUrl)) {
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
