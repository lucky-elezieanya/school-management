"use client";

import JSZip from "jszip";
import { saveAs } from "file-saver";

import { StudentResultSnapshot } from "@/app/types/result-snapshot";
import { createPdfBlob } from "./createPdfBlob";
import { processSnapshots } from "./processSnapshots";

function sanitize(value: string) {
  return value
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .replace(/,+/g, "")
    .trim();
}

function buildFilename(snapshot: StudentResultSnapshot) {
  return `${sanitize(snapshot.student.fullName)}_${sanitize(
    snapshot.school.term.name,
  )}_${sanitize(snapshot.school.session.name)}.pdf`;
}

export async function downloadAllPdfs(
  snapshots: StudentResultSnapshot[],
  getElement: (snapshot: StudentResultSnapshot) => Promise<HTMLElement>,
  onProgress?: (completed: number, total: number) => void,
) {
  if (!snapshots.length) return;

  const zip = new JSZip();

  await processSnapshots(
    snapshots,
    async (snapshot) => {
      const element = await getElement(snapshot);
      
      console.log("Expected:", snapshot.student.fullName);

      console.log("Rendered:", element.dataset.studentId);

      const blob = await createPdfBlob(element, buildFilename(snapshot));

      zip.file(buildFilename(snapshot), blob);
    },
    1, // important
    onProgress,
  );

  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
  });

  saveAs(
    zipBlob,
    `${sanitize(snapshots[0].school.term.name)}_${sanitize(
      snapshots[0].school.session.name,
    )}_Results.zip`,
  );
}