/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ParsedUrlQuery } from "querystring";
import { URLSearchParams, parse } from "url";
import axios, { AxiosResponse } from "axios";
import * as puppeteer from "puppeteer";
import { TestSetupError } from "../../CommonTestUtils";
import { AuthConfigValues } from "../../Config";

interface AccessTokenResponse {
  access_token: string;
}

export interface TestUserCredentials {
  email: string;
  password: string;
}

export class TestAuthenticationClient {
  // cspell:disable-next-line
  private _pageLoadedEvent: puppeteer.PuppeteerLifeCycleEvent = "networkidle2";
  private _consentPageTitle = "Request for Approval";
  private _pageElementIds = {
    fields: {
      email: "#identifierInput",
      password: "#password"
    },
    buttons: {
      next: "#sign-in-button",
      signIn: "#sign-in-button",
      consent: "#bentleySubmit"
    }
  }

  constructor(private _authConfig: AuthConfigValues & { scopes: string }) {
  }

  public async getAccessToken(testUserCredentials: TestUserCredentials): Promise<string> {
    const browserLaunchOptions: puppeteer.BrowserLaunchArgumentOptions = { headless: true };
    const browser: puppeteer.Browser = await puppeteer.launch(browserLaunchOptions);
    const browserPage: puppeteer.Page = await browser.newPage();

    const authorizationCodePromise = this.interceptRedirectAndGetAuthorizationCode(browserPage);

    await browserPage.goto(this.getAuthenticationUrl(), { waitUntil: this._pageLoadedEvent });
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
      "response_type=code&" +
      `redirect_uri=${encodeURIComponent(this._authConfig.redirectUrl)}`;
  }

  private async fillCredentials(browserPage: puppeteer.Page, testUserCredentials: TestUserCredentials): Promise<void> {
    const emailField = await this.captureElement(browserPage, this._pageElementIds.fields.email);
    await emailField.type(testUserCredentials.email);

    const nextButton = await this.captureElement(browserPage, this._pageElementIds.buttons.next);
    await nextButton.click();

    const passwordField = await this.captureElement(browserPage, this._pageElementIds.fields.password);
    await passwordField.type(testUserCredentials.password);

    const signInButton = await this.captureElement(browserPage, this._pageElementIds.buttons.signIn);
    await Promise.all([
      signInButton.click(),
      browserPage.waitForNavigation({ waitUntil: this._pageLoadedEvent })
    ]);
  }

  private async consentIfNeeded(browserPage: puppeteer.Page): Promise<void> {
    const isConsentPage = await browserPage.title() === this._consentPageTitle;
    if (!isConsentPage)
      return;

    const consentButton = await this.captureElement(browserPage, this._pageElementIds.buttons.consent);
    await Promise.all([
      consentButton.click(),
      browserPage.waitForNavigation({ waitUntil: this._pageLoadedEvent })
    ]);
  }

  private async exchangeAuthorizationCodeForAccessToken(authorizationCode: string): Promise<string> {
    const requestUrl = `${this._authConfig.authority}/connect/token`;
    const requestBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: this._authConfig.redirectUrl
    });
    const encodedClientCredentials = Buffer.from(`${encodeURIComponent(this._authConfig.clientId)}:${encodeURIComponent(this._authConfig.clientSecret)}`).toString("base64");
    const requestConfig = {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${encodedClientCredentials}`
      }
    };

    const response: AxiosResponse<AccessTokenResponse> = await axios.post(requestUrl, requestBody, requestConfig);
    return response.data.access_token;
  }


  private async interceptRedirectAndGetAuthorizationCode(browserPage: puppeteer.Page): Promise<string> {
    await browserPage.setRequestInterception(true);
    return new Promise<string>((resolve) => {
      browserPage.on("request", async (interceptedRequest) => {
        const currentRequestUrl = interceptedRequest.url();
        if (!currentRequestUrl.startsWith(this._authConfig.redirectUrl))
          interceptedRequest.continue();
        else {
          await this.respondSuccess(interceptedRequest);
          resolve(this.getCodeFromUrl(currentRequestUrl));
        }
      });
    });
  }

  private async respondSuccess(request: puppeteer.HTTPRequest): Promise<void> {
    await request.respond({
      status: 200,
      contentType: "text/html",
      body: "OK"
    });
  }

  private getCodeFromUrl(redirectUrl: string): string {
    const urlQuery: ParsedUrlQuery = parse(redirectUrl, true).query;
    if (!urlQuery.code)
      throw new TestSetupError("Sign in failed: could not parse code from url.");

    return urlQuery.code.toString();
  }

  private async captureElement(browserPage: puppeteer.Page, selector: string): Promise<puppeteer.ElementHandle<Element>> {
    const element = await browserPage.waitForSelector(selector);
    if (!element)
      throw new TestSetupError(`Sign in failed: could not find element with selector '${selector}'.`);

    return element;
  }
}
