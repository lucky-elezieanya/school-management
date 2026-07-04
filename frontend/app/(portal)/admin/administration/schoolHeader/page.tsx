"use client";

import { useEffect, useState } from "react";
import {
  apiAction,
  apiHeaders,
  BASE_URL,
  handleUserDelete,
} from "@/app/lib/api";
import { Loader2, Trash2, UploadCloud, X } from "lucide-react";

interface AssetType {
  id: number;
  image: string;
  asset_type: "logo" | "header";
  is_active: boolean;
}

export default function SchoolHeaderImage() {
  const [assets, setAssets] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);

  /* =========================
	   FETCH ASSETS
	========================= */
  const fetchAssets = async () => {
    try {
      const res = await apiAction(
        "academics",
        "school-assets",
        undefined,
        "GET",
      );

      setAssets(res.results || res);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  /* =========================
	   UPLOAD
	========================= */
  const uploadAsset = async (type: "logo" | "header", file: File | null) => {
    if (!file) return;

    setLoading(true);

    try {
      const url = `${BASE_URL}/academics/school-assets/`;

      const formData = new FormData();
      formData.append("asset_type", type);
      formData.append("image", file);

      const res = await fetch(url, {
        method: "POST",
        headers: apiHeaders(),
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw data;

      await fetchAssets();

      if (type === "logo") {
        setLogoFile(null);
        setLogoPreview(null);
      } else {
        setHeaderFile(null);
        setHeaderPreview(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
	   DELETE
	========================= */
  const handleDelete = async (header: AssetType) => {
    const res = await handleUserDelete(
      "academics",
      "school-assets",
      header.id,
      `${header.asset_type}`,
    );
    if (res) {
      setAssets((prev) => prev.filter((a) => a.id !== header.id));
      await fetchAssets();
    }
  };

  /* =========================
	   PATCH: TOGGLE ACTIVE (NEW)
	========================= */
  const toggleActive = async (asset: AssetType) => {
    try {
      const url = `${BASE_URL}/academics/school-assets/${asset.id}/`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          ...apiHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !asset.is_active,
        }),
      });

      if (!res.ok) throw await res.json();

      // refresh so backend enforces "only one active"
      await fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
	   FILTER
	========================= */
  const logos = assets.filter((a) => a.asset_type === "logo");
  const headers = assets.filter((a) => a.asset_type === "header");

  /* =========================
	   UI
	========================= */
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold">School Branding</h1>

      {/* ================= LOGO ================= */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="font-semibold">School Logo</h2>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setLogoFile(file);

              if (file) {
                setLogoPreview(URL.createObjectURL(file));
              }
            }}
          />

          <button
            onClick={() => uploadAsset("logo", logoFile)}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Logo
          </button>
        </div>

        {/* LOGO PREVIEW */}
        {logoPreview && (
          <div className="mt-4 border rounded-xl p-3 bg-gray-50 flex items-center gap-4">
            <img
              src={logoPreview}
              className="h-20 w-20 object-contain border rounded-lg bg-white"
            />

            <button
              onClick={() => {
                setLogoPreview(null);
                setLogoFile(null);
              }}
              className="text-red-600 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          </div>
        )}

        {/* LOGO LIST */}
        <div className="grid grid-cols-3 gap-4">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className="border p-3 rounded-xl flex flex-col items-center gap-2"
            >
              <img src={logo.image} className="h-20 object-contain" />

              {/* ACTIVE BADGE */}
              {logo.is_active && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Active
                </span>
              )}

              <button
                onClick={() => toggleActive(logo)}
                className="text-blue-600 text-sm"
              >
                {logo.is_active ? "Deactivate" : "Make Active"}
              </button>

              <button
                onClick={() => handleDelete(logo)}
                className="text-red-600 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ================= HEADER ================= */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="font-semibold">School Header</h2>

        <p className="text-sm text-gray-500">
          Recommended size: A4 width proportion (wide banner)
        </p>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setHeaderFile(file);

              if (file) {
                setHeaderPreview(URL.createObjectURL(file));
              }
            }}
          />

          <button
            onClick={() => uploadAsset("header", headerFile)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Header
          </button>
        </div>

        {/* HEADER PREVIEW */}
        {headerPreview && (
          <div className="mt-4 border rounded-xl overflow-hidden bg-gray-50">
            <p className="text-sm text-gray-600 p-3">Preview</p>

            <img src={headerPreview} className="w-full max-h-40 object-cover" />

            <div className="p-3 flex justify-end">
              <button
                onClick={() => {
                  setHeaderPreview(null);
                  setHeaderFile(null);
                }}
                className="text-red-600 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        )}

        {/* HEADER LIST */}
        <div className="space-y-4">
          {headers.map((header) => (
            <div key={header.id} className="border rounded-xl overflow-hidden">
              <img
                src={header.image}
                className="w-full max-h-40 object-cover"
              />

              {/* ACTIVE BADGE */}
              {header.is_active && (
                <div className="p-2 text-green-600 text-sm">Active</div>
              )}

              <div className="p-3 flex justify-between">
                <button
                  onClick={() => toggleActive(header)}
                  className="text-blue-600 text-sm"
                >
                  {header.is_active ? "Deactivate" : "Make Active"}
                </button>

                <button
                  onClick={() => handleDelete(header)}
                  className="text-red-600 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
