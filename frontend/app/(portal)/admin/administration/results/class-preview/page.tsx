"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Loader2,
  Printer,
  AlertCircle,
} from "lucide-react";

import { apiHeaders } from "@/app/lib/api";

export default function ClassPreviewPage() {
  const router = useRouter();
  const params = useSearchParams();

  const classId = params.get("class_id");
  const termId = params.get("term_id");
  const sessionId = params.get("session_id");

  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      try {
        if (!classId || !termId || !sessionId) {
          throw new Error("Missing required parameters.");
        }

        const response = await fetch(
          `/api/class-pdf?class_id=${classId}&term_id=${termId}&session_id=${sessionId}`,
          {
            headers: apiHeaders()
          },
        );

        if (!response.ok) {
          const message = await response.text();

          throw new Error(message || "Unable to load PDF.");
        }

        const blob = await response.blob();

        objectUrl = URL.createObjectURL(blob);

        setPdfUrl(objectUrl);
      } catch (err: any) {
        setError(err.message || "Unable to load PDF.");
      } finally {
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [classId, termId, sessionId]);

  const downloadPdf = () => {
    if (!pdfUrl) return;

    const a = document.createElement("a");

    a.href = pdfUrl;
    a.download = "Class_Broadsheet.pdf";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const printPdf = () => {
    if (!pdfUrl) return;

    const win = window.open(pdfUrl);

    if (!win) return;

    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="max-w-lg rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2 font-semibold text-red-700">
            <AlertCircle className="h-5 w-5" />
            Error
          </div>

          <p className="mt-3 text-red-600">{error}</p>

          <button
            onClick={() => router.back()}
            className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="flex h-screen flex-col bg-slate-100">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="text-lg font-bold">Class Result Broadsheet</h1>

        <div className="flex gap-3">
          <button
            onClick={printPdf}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>

          <button
            onClick={downloadPdf}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      <div className="flex-1 bg-gray-200 p-3">
        {pdfUrl && (
          <embed
            src={pdfUrl}
            type="application/pdf"
            className="h-full w-full rounded-lg bg-white shadow-lg"
          />
        )}
      </div>
    </section>
  );
}
