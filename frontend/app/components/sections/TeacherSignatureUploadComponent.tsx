"use client";

import { uploadTeacherSignature } from "@/app/services/results";
import { useState } from "react";

export default function TeacherSignatureUploadComponent({
  classTeacherId,
}: {
  schoolClassId: number;
  classTeacherId: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    if (!file) return;

    try {
      setLoading(true);

      const res = await uploadTeacherSignature(file, classTeacherId, true);
      if (res) {
        alert(`${res.message}\n`);
      }
      return;
    } catch (error) {
      alert(`Upload failed\n${error}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md rounded-lg border bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold">
        Upload Class Teacher Signature
      </h2>
      {!classTeacherId && (
        <div className="w-full rounded-lg border border-amber-300 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86l-8 14A1 1 0 003.17 19h17.66a1 1 0 00.88-1.48l-8-14a1 1 0 00-1.76 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-800 sm:text-base">
                Class Teacher Not Assigned
              </h3>
              <p className="mt-1 text-sm text-amber-700 leading-relaxed">
                The selected class does not have an assigned class teacher.
                Please go back and assign a class teacher before continuing.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full rounded border p-2"
        />

        <button
          type="submit"
          disabled={loading || !classTeacherId}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Signature"}
        </button>
      </form>
    </div>
  );
}
