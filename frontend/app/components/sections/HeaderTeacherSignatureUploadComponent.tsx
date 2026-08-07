"use client";
import { toast } from "sonner";
import { apiAction, handleUserDelete } from "@/app/lib/api";
import { uploadHeadTeacherSignature } from "@/app/services/results";
import { useEffect, useState } from "react";

interface SignatureItem {
  id: number;
  owner: string;
  signature: string;
  is_active: boolean;
  created_at: string;
}

export default function HeadTeacherSignatureUploadComponent() {
  const [owner, setOwner] = useState("Head Teacher");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  // Fetch signatures on mount
  async function fetchSignatures() {
    try {
      setFetching(true);
      const res = await apiAction("results", "headteacher-signatures");
      setSignatures(res.results || res || []);
    } catch (error: any) {
      toast.error(`Error fetching signatures: ${error}`);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchSignatures();
  }, []);

  // Handle local file selection and object URL generation for preview
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);

    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  // Handle Form Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) return;

    try {
      setLoading(true);
      await uploadHeadTeacherSignature(owner, file);

      toast.success("Signature uploaded successfully");

      setFile(null);
      setPreviewUrl(null);

      // Refresh list after upload
      await fetchSignatures();
    } catch (error) {
      console.log(error);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  // Handle Activate Signature
  async function handleActivate(id: number) {
    try {
      setActivatingId(id);

      // Call to custom DRF action: POST /headteacher-signatures/{id}/activate/
      await apiAction(
        "results",
        `headteacher-signatures/${id}/activate`,
        undefined,
        "POST",
      );

      toast.success("Signature set as active");
      await fetchSignatures();
    } catch (error) {
      console.log(error);
      toast.error("Failed to activate signature");
    } finally {
      setActivatingId(null);
    }
  }

  // Handle Delete Signature
  async function handleDelete(id: number) {
    try {
      const res = await handleUserDelete(
        "results",
        "headteacher-signatures",
        id,
        "Signature",
      );

      if (!res) {
        toast.error("Failed to delete signature");
        return;
      }

      setSignatures((prev) => prev.filter((item) => item.id !== id));
      fetchSignatures();
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  }

  return (
    <div className="max-w-md space-y-6 rounded-lg border bg-white p-6 shadow">
      <div>
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
            onChange={handleFileChange}
            className="w-full rounded border p-2"
          />

          {/* Image Preview for selected file */}
          {previewUrl && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Selected File Preview:</p>
              <div className="relative h-24 w-full overflow-hidden rounded border bg-gray-50 p-2">
                <img
                  src={previewUrl}
                  alt="Selected signature preview"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Signature"}
          </button>
        </form>
      </div>

      <hr className="my-4" />

      {/* Existing Signatures List */}
      <div>
        <h3 className="mb-3 text-md font-semibold text-gray-800">
          Existing Signatures
        </h3>

        {fetching ? (
          <p className="text-sm text-gray-500">Loading signatures...</p>
        ) : signatures.length === 0 ? (
          <p className="text-sm text-gray-500">No signatures found.</p>
        ) : (
          <div className="space-y-3">
            {signatures.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded border p-3 bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={item.signature}
                    alt={`${item.owner}'s signature`}
                    className="h-12 w-20 object-contain rounded border bg-white"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.owner || "Unnamed"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.is_active ? (
                        <span className="text-green-600 font-semibold">
                          Active
                        </span>
                      ) : (
                        "Inactive"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!item.is_active && (
                    <button
                      onClick={() => handleActivate(item.id)}
                      disabled={activatingId === item.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {activatingId === item.id
                        ? "Activating..."
                        : "Make Active"}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
