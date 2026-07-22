"use client";

import { Download, Printer, Upload } from "lucide-react";

import { PdfActionProps } from "./types";

import { downloadPdf } from "./downloadPdf";
import { htmlToPdf } from "./htmlToPdf";
import { uploadPdf } from "./uploadPdf";
import { usePrintPdf } from "./printPdf";

export default function PdfActions({ pdfRef, snapshot }: PdfActionProps) {
  const print = usePrintPdf(pdfRef);

  async function handleDownload() {
    if (!pdfRef.current) return;

    await downloadPdf(
      pdfRef.current,
      `${snapshot.student.fullName.replace(/\s+/g, "_")}.pdf`,
    );
  }

  async function handleUpload() {
    if (!pdfRef.current) return;

    const blob = await htmlToPdf(pdfRef.current);

    await uploadPdf({
      blob,
      snapshot,
    });
  }

  return (
    <div
      className="
        flex
        w-full
        flex-wrap
        items-center
        justify-between
        gap-4
      "
    >
      <div>
        <h2
          className="
            text-lg
            font-semibold
            text-slate-800
          "
        >
          {snapshot.student.fullName}'s Result
        </h2>

        <p
          className="
            text-sm
            text-slate-500
          "
        >
          Preview, print and download the generated result.
        </p>
      </div>

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-3
        "
      >
        {/* Download */}

        <button
          onClick={handleDownload}
          className="
            inline-flex
            items-center
            gap-2

            rounded-lg

            bg-blue-600
            px-5
            py-2.5

            text-sm
            font-medium
            text-white

            shadow-md

            transition-all
            duration-200

            hover:bg-blue-700
            hover:shadow-lg

            active:scale-[0.98]
          "
        >
          <Download size={18} />
          Download PDF
        </button>

        {/* Print */}

        <button
          onClick={print}
          className="
            inline-flex
            items-center
            gap-2

            rounded-lg

            border
            border-slate-300

            bg-white

            px-5
            py-2.5

            text-sm
            font-medium
            text-slate-700

            transition-all
            duration-200

            hover:border-slate-400
            hover:bg-slate-100

            active:scale-[0.98]
          "
        >
          <Printer size={18} />
          Print
        </button>

        {/* Upload */}

        <button
          onClick={handleUpload}
          className="
            inline-flex
            items-center
            gap-2

            rounded-lg

            border
            border-emerald-300

            bg-emerald-50

            px-5
            py-2.5

            text-sm
            font-medium
            text-emerald-700

            transition-all
            duration-200

            hover:bg-emerald-100
            hover:border-emerald-400

            active:scale-[0.98]
          "
        >
          <Upload size={18} />
          Upload
        </button>
      </div>
    </div>
  );
}
