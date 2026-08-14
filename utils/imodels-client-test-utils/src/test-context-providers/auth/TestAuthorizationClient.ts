/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
// cspell:ignore domcontentloaded
import { ParsedUrlQuery } from "querystring";
import { URLSearchParams, parse } from "url";

import axios, { AxiosResponse } from "axios";
import { injectable } from "inversify";
import { Browser, ElementHandle, Page, chromium } from "playwright-core";

import { TestSetupError } from "../../CommonTestUtils";

import { TestAuthorizationClientConfig } from "./TestAuthorizationClientConfigImpl";

export interface TestUserCredentials {
  email: string;
  password: string;
  scopes: string;
}

interface AccessTokenResponse {
  access_token: string;
}

@injectable()
export class TestAuthorizationClient {
  private _consentPageTitle = "Permissions";
  private _pageElementIds = {
    fields: {
      email: "#identifierInput",
      password: "#password",
    },
    buttons: {
      next: "#sign-in-button",
      signIn: "#sign-in-button",
      consent: ".ping.button.normal.allow",
    },
  };

  constructor(private readonly _authConfig: TestAuthorizationClientConfig) {}

  public async getAccessToken(
    testUserCredentials: TestUserCredentials
  ): Promise<string> {
    const launchOptions = {
      headless: true,
      // cspell:disable-next-line
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    let browser: Browser;
    try {
      console.log("[Auth] Launching system Chrome...");
      browser = await chromium.launch({
        ...launchOptions,
        channel: "chrome",
      });
      console.log("[Auth] System Chrome launched.");
    } catch {
      try {
        console.log(
          "[Auth] System Chrome not found, falling back to managed Chromium..."
        );
        // Uses managed Chromium installed by @playwright/browser-chromium during rush install
        browser = await chromium.launch(launchOptions);
        console.log("[Auth] Managed Chromium launched.");
      } catch (e) {
        throw new TestSetupError(
          `Failed to launch browser. Run 'npx playwright install chromium' to install the managed browser. Details: ${String(
            e
          )}`
        );
      }
    }
    const browserPage: Page = await browser.newPage();

    const authorizationCodePromise =
      this.interceptRedirectAndGetAuthorizationCode(browserPage);

    console.log(
      `[Auth] Navigating to auth URL (authority: ${this._authConfig.authority})...`
    );
    await browserPage.goto(this.getAuthorizationUrl(testUserCredentials), {
      waitUntil: "domcontentloaded",
    });
    console.log(`[Auth] Page loaded, title: "${await browserPage.title()}"`);
    await this.fillCredentials(browserPage, testUserCredentials);
    await this.consentIfNeeded(browserPage);
    console.log("[Auth] Waiting for authorization code...");
    const accessToken = await this.exchangeAuthorizationCodeForAccessToken(
      await authorizationCodePromise
    );
    console.log("[Auth] Access token obtained.");

    await browser.close();
    return accessToken;
  }

  private getAuthorizationUrl(
    testUserCredentials: TestUserCredentials
  ): string {
    return (
      `${this._authConfig.authority}/connect/authorize?` +
      `client_id=${encodeURIComponent(this._authConfig.clientId)}&` +
      `scope=${encodeURIComponent(testUserCredentials.scopes)}&` +
      "response_type=code&" +
      `redirect_uri=${encodeURIComponent(this._authConfig.redirectUrl)}`
    );
  }

  private async fillCredentials(
    browserPage: Page,
    testUserCredentials: TestUserCredentials
  ): Promise<void> {
    console.log("[Auth] Filling email...");
    const emailField = await this.captureElement(
      browserPage,
      this._pageElementIds.fields.email
    );
    await emailField.fill(testUserCredentials.email);

    console.log("[Auth] Clicking next...");
    const nextButton = await this.captureElement(
      browserPage,
      this._pageElementIds.buttons.next
    );
    await nextButton.click();

    console.log("[Auth] Filling password...");
    const passwordField = await this.captureElement(
      browserPage,
      this._pageElementIds.fields.password
    );
    await passwordField.fill(testUserCredentials.password);

    console.log("[Auth] Clicking sign in...");
    const signInButton = await this.captureElement(
      browserPage,
      this._pageElementIds.buttons.signIn
    );
    await Promise.all([
      signInButton.click(),
      browserPage.waitForLoadState("domcontentloaded"),
    ]);
    console.log(`[Auth] Signed in, title: "${await browserPage.title()}"`);
  }

  private async consentIfNeeded(browserPage: Page): Promise<void> {
    const title = await browserPage.title();
    const isConsentPage = title === this._consentPageTitle;
    console.log(
      `[Auth] Consent check - page title: "${title}", needs consent: ${isConsentPage}`
    );
    if (!isConsentPage) return;

    const consentButton = await this.captureElement(
      browserPage,
      this._pageElementIds.buttons.consent
    );
    await Promise.all([
      consentButton.click(),
      browserPage.waitForLoadState("domcontentloaded"),
    ]);
    console.log("[Auth] Consent granted.");
  }

  private async exchangeAuthorizationCodeForAccessToken(
    authorizationCode: string
  ): Promise<string> {
    const requestUrl = `${this._authConfig.authority}/connect/token`;
    const requestBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: this._authConfig.redirectUrl,
    });
    const encodedClientCredentials = Buffer.from(
      `${encodeURIComponent(this._authConfig.clientId)}:${encodeURIComponent(
        this._authConfig.clientSecret
      )}`
    ).toString("base64");
    const requestConfig = {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${encodedClientCredentials}`,
      },
    };

    const response: AxiosResponse<AccessTokenResponse> = await axios.post(
      requestUrl,
      requestBody,
      requestConfig
    );
    return response.data.access_token;
  }

  private interceptRedirectAndGetAuthorizationCode(
    browserPage: Page
  ): Promise<string> {
    return new Promise<string>((resolve) => {
      // page.route doesn't intercept navigation-level redirects to unreachable hosts; page.on("request") does
      browserPage.on("request", (request) => {
        const url = request.url();
        if (url.startsWith(this._authConfig.redirectUrl))
          resolve(this.getCodeFromUrl(url));
      });
    });
  }

  private getCodeFromUrl(redirectUrl: string): string {
    const urlQuery: ParsedUrlQuery = parse(redirectUrl, true).query;
    if (!urlQuery.code)
      throw new TestSetupError(
        "Sign in failed: could not parse code from url."
      );

    return urlQuery.code.toString();
  }

  private async captureElement(
    browserPage: Page,
    selector: string
  ): Promise<ElementHandle<SVGElement | HTMLElement>> {
    const element = await browserPage.waitForSelector(selector);
    if (!element)
      throw new TestSetupError(
        `Sign in failed: could not find element with selector '${selector}'.`
      );

    return element;
  }
}
