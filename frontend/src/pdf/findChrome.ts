import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

function isExecutable(file: string): boolean {
  try {
    if (!fs.existsSync(file)) {
      return false;
    }

    execFileSync(file, ["--version"], {
      stdio: "ignore",
    });

    return true;
  } catch {
    return false;
  }
}

function searchPath(names: string[]): string | null {
  const command = process.platform === "win32" ? "where" : "which";

  for (const name of names) {
    const result = spawnSync(command, [name], {
      encoding: "utf8",
    });

    if (result.status === 0) {
      const executable = result.stdout.split(/\r?\n/).find(Boolean);

      if (executable && isExecutable(executable)) {
        return executable;
      }
    }
  }

  return null;
}

export function findChrome(): string {
  if (process.env.CHROME_PATH && isExecutable(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const fromPath = searchPath([
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    "chrome",
  ]);

  if (fromPath) {
    return fromPath;
  }

  const candidates = [
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",

    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",

    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",

    // WSL -> Windows Chrome
    "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe",
    "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",

    // Microsoft Edge (works with Puppeteer too)

    "/usr/bin/microsoft-edge",
    "/usr/bin/microsoft-edge-stable",

    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",

    "/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ];

  for (const executable of candidates) {
    if (isExecutable(executable)) {
      return executable;
    }
  }

  throw new Error(
    [
      "",
      "Unable to locate a Chromium-based browser.",
      "",
      "Searched:",
      "",
      "- CHROME_PATH",
      "- PATH (which/where)",
      "- Google Chrome",
      "- Chromium",
      "- Microsoft Edge",
      "",
      "Install Chrome/Chromium or set CHROME_PATH.",
    ].join("\n"),
  );
}
