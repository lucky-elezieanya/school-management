"use client";

import { BASE_URL, uploadFile } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClassUpload() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      setFile(selectedFile);
    }
  };
  const handleUploadSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a spreadsheet");
      return;
    }

    setLoading(true);

    try {
      const url = `${BASE_URL}/academics/classes/upload/`;
      const res = await uploadFile(file, url);
      if (res) {
        alert(`Classes uploaded successfully,
                            ${res.created_count} classes created,
                            ${res.skipped_count} records skipped`);
        router.push("/admin/administration/classes");
      }
    } catch (error: any) {
      console.log(error);

      alert(
        error?.error || error?.detail || "Something went wrong during upload",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white  rounded-3xl shadow-lg p-6 md:p-10">
      {/* ============ UPLOAD MODE ====================== */}
      <h2 className="text-2xl font-semibold text-emerald-900 mb-4">
        Upload Class Spreadsheet
      </h2>

      <p className="text-gray-600 mb-8">
        Upload an Excel or CSV file containing class records.
      </p>

      <form onSubmit={handleUploadSubmit} className="space-y-6">
        <div className="border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-3xl p-10 text-center">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block mx-auto"
          />

          {file && (
            <p className="mt-4 text-emerald-800 font-medium text-sm">
              Selected File: {file.name}
            </p>
          )}
        </div>
        {/* ================= SAMPLE SPREADSHEET ================= */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">
                Spreadsheet Format Guide
              </h3>

              <p className="text-sm text-gray-600 mt-1">
                Ensure your Excel or CSV file follows this exact structure.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-emerald-100 shadow-sm">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-emerald-800 text-white">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">class_name</th>
                  <th className="px-4 py-3 whitespace-nowrap">class_description</th>
                  <th className="px-4 py-3 whitespace-nowrap">arm</th>
                  <th className="px-4 py-3 whitespace-nowrap">class_teacher_username</th>
                </tr>
              </thead>

              <tbody className="bg-white">
                <tr className="border-b border-gray-100 hover:bg-pink-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap">JSS1</td>
                  <td className="px-4 py-3 whitespace-nowrap">JUNIOR SECONDARY ONE</td>
                  <td className="px-4 py-3 whitespace-nowrap">A</td>
                  <td className="px-4 py-3 whitespace-nowrap">ken</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tips */}
          <div className="mt-4 bg-pink-50 border border-pink-100 rounded-2xl p-4">
            <h4 className="font-semibold text-emerald-900 mb-2">
              Important Notes
            </h4>

            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>The column names must match exactly as shown above.</li>

              <li>
                Accepted file types:
                <span className="font-medium"> .xlsx, .xls, .csv</span>
              </li>

              <li>Do not leave required fields empty.</li>

              <li>Each row represents one class record.</li>
            </ul>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-800 hover:bg-emerald-900 transition text-white py-4 rounded-xl font-semibold disabled:opacity-50"
        >
          {loading
            ? "Uploading Class Spreadsheet..."
            : "Upload Class Spreadsheet"}
        </button>
      </form>
    </div>
  );
}
