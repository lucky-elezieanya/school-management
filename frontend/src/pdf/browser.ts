import chromium from "@sparticuz/chromium";
import puppeteer, { Browser } from "puppeteer-core";

import { findChrome } from "./findChrome";

let browser: Browser | null = null;

const DEFAULT_VIEWPORT = {
  width: 794,
  height: 1123,
  deviceScaleFactor: 2,
};

export async function getBrowser(): Promise<Browser> {
  if (browser?.connected) {
    return browser;
  }

  if (process.env.NODE_ENV === "production") {
    browser = await puppeteer.launch({
      executablePath: await chromium.executablePath(),

      args: chromium.args,

      headless: true,

      defaultViewport: DEFAULT_VIEWPORT,

      protocolTimeout: 120_000,
    });
  } else {
    browser = await puppeteer.launch({
      executablePath: findChrome(),

      headless: true,

      defaultViewport: DEFAULT_VIEWPORT,

      protocolTimeout: 120_000,
    });
  }

  browser.once("disconnected", () => {
    browser = null;
  });

  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (!browser) {
    return;
  }

  await browser.close();

  browser = null;
}
