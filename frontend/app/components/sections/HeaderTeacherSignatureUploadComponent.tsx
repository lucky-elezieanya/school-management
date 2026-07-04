"use client";

import { uploadHeadTeacherSignature } from "@/app/services/results";
import { useState } from "react";

export default function HeadTeacherSignatureUploadComponent() {
  const [owner, setOwner] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) return;

    try {
      setLoading(true);

      await uploadHeadTeacherSignature(owner, file);

      alert("Signature uploaded");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md rounded-lg border bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold">
        Upload Head Teacher Signature
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Owner"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="w-full rounded border p-2"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded border p-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Signature"}
        </button>
      </form>
    </div>
  );
}
