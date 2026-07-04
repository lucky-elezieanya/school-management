"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  Loader2,
  Printer,
  AlertCircle,
} from "lucide-react";

import { BASE_URL, apiHeaders } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/hooks/useAuth";

interface StudentResultPreviewProps {
  studentId: number;
  classId: number;
  termId: number;
  sessionId: number;
  title?: string;
  //   onClose?: () => void;
}

export default function StudentResultPreview({
  studentId,
  classId,
  termId,
  sessionId,
  title = "Student Result Sheet",
  //   onClose,
}: StudentResultPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const [filename, setFilename] = useState("Student_Result.pdf");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${BASE_URL}/results/results/student-pdf-info/?student_id=${studentId}&class_id=${classId}&term_id=${termId}&session_id=${sessionId}`,
          {
            headers: apiHeaders(),
          },
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);

          throw new Error(data?.detail ?? "Unable to load student result PDF.");
        }

        const data = await response.json();

        setFilename(data.filename);

        setPdfUrl(`/api/pdf-proxy?url=${encodeURIComponent(data.url)}`);
      } catch (err: any) {
        setError(err.message || "Unable to load PDF.");
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [studentId, classId, termId, sessionId]);

  const printPdf = () => {
    if (!pdfUrl) return;

    window.open(pdfUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="max-w-lg rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-2 font-semibold text-red-700">
            <AlertCircle className="h-5 w-5" />
            Error
          </div>

          <p className="mt-3 text-red-600">{error}</p>

        </div>
      </div>
    );
  }

  return (
    <section className="flex h-screen flex-col bg-slate-100">
      {/* Toolbar */}

      <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
      
          <button
            onClick={() =>
              router.push(
                `${user.role === "admin" ? `/admin/administration/students/${studentId}` : `/teachers/students/${studentId}`}`,
              )
            }
            className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={printPdf}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>

          <a
            href={pdfUrl}
            download={filename}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>

      {/* PDF */}

      <div className="flex-1 bg-gray-200 p-3">
        <embed
          src={pdfUrl}
          type="application/pdf"
          className="h-full w-full rounded-lg bg-white shadow-lg"
        />
      </div>
    </section>
  );
}
