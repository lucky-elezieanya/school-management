import { Browser } from "puppeteer-core";

import { StudentResultSnapshot } from "@/app/types/result-snapshot";

export async function renderPdf(
  browser: Browser,
  snapshot: StudentResultSnapshot,
): Promise<Uint8Array> {
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    const url = `${process.env.APP_URL}/results/pdf/${snapshot.id}`;

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 120000,
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

    return pdf;
  } finally {
    await page.close();
  }
}
