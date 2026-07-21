import { StudentResultSnapshot } from "@/app/types/result-snapshot";

import { getBrowser } from "./browser";
import { renderPdf } from "./renderPdf";

export async function generateStudentPdf(
  snapshot: StudentResultSnapshot,
): Promise<Buffer> {
  const browser = await getBrowser();

  return renderPdf(browser, snapshot);
}
