"use client";

import { toast } from "sonner";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { PdfActionProps } from "./types";
import { usePrintPdf } from "./printPdf";
import { useRouter } from "next/navigation";
import { downloadPdf } from "./downloadPdf";



export default function PdfActions({ pdfRef, snapshot }: PdfActionProps) {
  const print = usePrintPdf(pdfRef);
  const router = useRouter();
  async function handleDownload() {
    if (!pdfRef.current) return;
    try {
      await downloadPdf(pdfRef.current, snapshot);
    } catch (error) {
      toast.error(`${error || "Failed to download PDF"}`);
    }
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
      <button
        type="button"
        onClick={() => router.back()}
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
        <ArrowLeft size={18} />
        Back
      </button>
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
          type="button"
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
          type="button"
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
      </div>
    </div>
  );
}
