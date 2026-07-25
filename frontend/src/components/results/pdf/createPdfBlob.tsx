"use client";

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

export async function createPdfBlob(
  element: HTMLElement,
  filename?: string,
): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;

  // Wait for fonts
  if ("fonts" in document) {
    await (document as any).fonts.ready;
  }

  // Wait for all images
  const images = Array.from(
    element.querySelectorAll("img"),
  ) as HTMLImageElement[];

  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }),
  );

  // Wait two paint cycles
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));

  const worker = html2pdf()
    .set({
      filename: filename ?? "result.pdf",

      margin: 0,

      image: {
        type: "jpeg",
        quality: 1,
      },

      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: "#ffffff",
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    })
    .from(element);

  const blob = await worker.outputPdf("blob");

  return blob;
}
