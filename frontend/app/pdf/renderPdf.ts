import { Browser } from "puppeteer-core";

import { StudentResultSnapshot } from "@/app/types/result-snapshot";
import { renderResultSheet } from "./PdfDocument";

export async function renderPdf(
  browser: Browser,
  snapshot: StudentResultSnapshot,
): Promise<Buffer> {
  const html = renderResultSheet(snapshot);

  const page = await browser.newPage();
  await page.setViewport({
    width: 794,
    height: 1123,
    deviceScaleFactor: 2,
  });

  try {
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForNetworkIdle();

    await page.evaluate(async () => {
      await Promise.all(
        Array.from(document.images).map(async (img) => {
          if (img.complete) return;

          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        }),
      );
    });

    await page.emulateMediaType("screen");

    const pdf = await page.pdf({
      format: "A4",

      printBackground: true,

      preferCSSPageSize: true,

      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
