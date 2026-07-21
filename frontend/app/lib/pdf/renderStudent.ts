import { getBrowser } from "../../pdf/browser";

export async function renderStudentPdf(snapshotId: string): Promise<Buffer> {
  const browser = await getBrowser();

  const page = await browser.newPage();

  try {
    await page.goto(
      `${process.env.NEXT_PUBLIC_APP_URL}/results/pdf/${snapshotId}`,
      {
        waitUntil: "networkidle0",
      },
    );

    await page.waitForFunction(() => {
      return (window as any).__PDF_READY__ === true;
    });

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
