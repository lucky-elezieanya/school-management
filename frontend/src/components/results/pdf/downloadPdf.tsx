"use client";

import { saveAs } from "file-saver";

import { StudentResultSnapshot } from "@/app/types/result-snapshot";

import { buildFilename, createPdfBlob } from "./createPdfBlob";

export async function downloadPdf(
  element: HTMLElement,
  snapshot: StudentResultSnapshot,
) {
  const blob = await createPdfBlob(element, buildFilename(snapshot));

  saveAs(blob, buildFilename(snapshot));
}
