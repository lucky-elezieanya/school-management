import { closeBrowser } from "./browser";

let initialized = false;

export function registerPdfShutdown() {
  if (initialized) return;

  initialized = true;

  process.once("SIGINT", async () => {
    await closeBrowser();
  });

  process.once("SIGTERM", async () => {
    await closeBrowser();
  });
}