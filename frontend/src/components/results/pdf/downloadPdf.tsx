"use client";

import { saveAs } from "file-saver";

import { StudentResultSnapshot } from "@/app/types/result-snapshot";

export function sanitize(value: string): string {
  return value
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .replace(/,+/g, "")
    .trim();
}

export function buildFilename(snapshot: StudentResultSnapshot): string {
  return `${sanitize(snapshot.student.fullName)}_${sanitize(
    snapshot.school.term.name,
  )}_${sanitize(snapshot.school.session.name)}.pdf`;
}
  

export async function downloadPdf(
  element: HTMLElement,
  snapshot: StudentResultSnapshot,
) {
  const html2pdf = (await import("html2pdf.js")).default;


  const filename = buildFilename(snapshot);
  await html2pdf()
    .set({
      filename: filename,
      margin: 0,
      image: {
        type: "png",
        quality: 1,
      },
      html2canvas: {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        logging: false,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0
        
    },
    jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        
      },
    })
    .from(element)
    .save();
}
