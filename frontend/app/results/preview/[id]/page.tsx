"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  FileSearch,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { PdfPreview } from "@/src/components/results/pdf";

interface ResultSnapshot {
  id: string;
  data: any;
}

export default function ResultPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<ResultSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const loadSnapshot = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");
      setNotFound(false);

      const response = await fetch(
        `${BASE_URL}/results/result-snapshots/${id}/`,
        {
          headers: apiHeaders(),
          cache: "no-store",
        },
      );

      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      setSnapshot(data);
    } catch {
      setError("Something went wrong while loading the student's result.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshot();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-600">Loading result preview...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <FileSearch className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-slate-900">
            Oops! Result Not Found
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This student's result does not exist yet or may have been removed.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            If the results have just been approved, the result may still be
            processing.
          </p>
          <div className="flex flex-row gap-3 mx-auto justify-center w-2/3">
            <button
              onClick={loadSnapshot}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>

            <button
              onClick={() => router.back()}
              className="
    mt-8
    inline-flex
    items-center
    gap-2
    rounded-lg
    border
    border-slate-300
    bg-white
    px-5
    py-3
    text-sm
    font-semibold
    text-slate-700
    shadow-sm
    transition-all
    duration-200
    hover:-translate-x-1
    hover:border-emerald-500
    hover:bg-emerald-50
    hover:text-emerald-700
    focus:outline-none
    focus:ring-2
    focus:ring-emerald-500
    focus:ring-offset-2
    active:translate-x-0
  "
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-slate-900">
            Unable to Load Result
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>

          <button
            onClick={loadSnapshot}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col">
      <PdfPreview snapshot={snapshot.data} />
    </div>
  );
}
