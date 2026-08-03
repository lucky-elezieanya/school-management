"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  X,
  Star,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  BarChart2,
  ImageIcon,
} from "lucide-react";
import { News, NewsFormData } from "@/app/types/news";

export interface ExistingImage {
  id: number;
  image: string;
  caption: string;
  is_cover: boolean;
  order: number;
}


interface Props {
  initialData?: News;
  onSubmit: (
    data: NewsFormData,
    images: File[],
    coverIndex: number | null,
    coverImageId: number | null,
    removedImages: number[],
  ) => Promise<void>;
  loading?: boolean;
}

export default function NewsForm({
  initialData,
  onSubmit,
  loading = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    initialData?.status ?? "draft",
  );
  const [featured, setFeatured] = useState(initialData?.featured ?? false);

  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    initialData?.images ?? [],
  );
  const [removedImages, setRemovedImages] = useState<number[]>([]);

  const [coverIndex, setCoverIndex] = useState<number | null>(null);

  const [coverImageId, setCoverImageId] =
  useState<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const previews = useMemo(() => {
    return newImages.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [newImages]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function handleSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setNewImages((prev) => [...prev, ...files]);
    setValidationError(null);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length > 0) {
      setNewImages((prev) => [...prev, ...files]);
      setValidationError(null);
    }
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    if (coverIndex === index) {
      setCoverIndex(null);
    } else if (coverIndex !== null && coverIndex > index) {
      setCoverIndex((prev) => prev && prev - 1);
    }
  }

  function removeExisting(id: number) {
    setRemovedImages((prev) => [...prev, id]);
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
  }

  // --- COVER SELECTION HANDLERS ---

  // 1. Set an existing gallery image as the cover
  function setExistingAsCover(imageId: number) {
    setCoverImageId(imageId);

    setCoverIndex(null);
    setExistingImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_cover: img.id === imageId,
      })),
    );

  }

  // 2. Set a newly uploaded image as the cover
  function setNewAsCover(index: number) {
    setCoverIndex(index);

    setCoverImageId(null);

    setExistingImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_cover: false,
      })),
    );
  }

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);

    const hasExistingCover = existingImages.some((img) => img.is_cover);

    if (newImages.length > 0 && coverIndex === null && !hasExistingCover) {
      setValidationError("Please select a cover image before saving.");
      alert("Please select a cover image before saving.");
      return;
    }

    const effectiveCoverIndex = coverIndex ?? 0;

    await onSubmit(
      {
        title,
        summary,
        content,
        status,
        featured,
      },
      newImages,
      effectiveCoverIndex,
      coverImageId,
      removedImages,
    );
  }

  const isEditing = Boolean(initialData);
  const totalImagesCount = existingImages.length + newImages.length;

  const submitButtonText = useMemo(() => {
    if (loading) return "Saving Article...";
    if (isEditing) return "Update Article";
    if (status === "published") return "Publish Article";
    return "Save Draft";
  }, [loading, isEditing, status]);

  return (
    <form onSubmit={submit} className="mx-auto max-w-7xl pb-24 text-slate-800">
      {/* Sticky Action Header */}
      <div className="sticky top-0 z-30 -mx-4 mb-8 border-b border-slate-200/80 bg-slate-50/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-800 ring-1 ring-emerald-600/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                {isEditing ? "Edit Article" : "Create New Article"}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium capitalize">
                  {status === "published" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  {status}
                </span>
                {featured && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      Featured
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/10 transition-all duration-200 hover:bg-emerald-800 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Article...</span>
              </>
            ) : (
              <span>{submitButtonText}</span>
            )}
          </button>
        </div>
      </div>

      {validationError && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Main Section */}
        <div className="space-y-8 xl:col-span-2">
          {/* Article Information Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs md:p-8">
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Article Information
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Title <span className="text-emerald-600">*</span>
                  </label>
                  <span className="font-mono text-xs text-slate-400">
                    {title.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
               
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Enter a clear, engaging news headline"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 font-medium text-slate-900 placeholder-slate-400 shadow-2xs outline-hidden transition-all duration-200 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Summary
                  </label>
                  <span className="font-mono text-xs text-slate-400">
                    {summary.length}/300
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={summary}
                  maxLength={300}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summarize this article in one or two sentences."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 placeholder-slate-400 shadow-2xs outline-hidden transition-all duration-200 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  News Content <span className="text-emerald-600">*</span>
                </label>
                <textarea
                  rows={14}
                  value={content}
                  spellCheck
                  autoComplete="off"
                  onChange={(e) => setContent(e.target.value)}
                  required
                  placeholder="Write the full article here..."
                  className="min-h-[350px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-slate-800 placeholder-slate-400 shadow-2xs outline-hidden transition-all duration-200 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
            </div>
          </div>

          {/* Media & Upload Section */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs md:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Media & Gallery
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Upload images to attach to this article. Click on any image
                  badge to choose it as your cover.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleSelectFiles}
            />

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group cursor-pointer rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
                isDragging
                  ? "border-emerald-600 bg-emerald-100/50 scale-[1.01]"
                  : "border-emerald-300/80 bg-emerald-50/30 hover:border-emerald-600 hover:bg-emerald-50/60"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-800 ring-1 ring-emerald-600/10 transition-transform duration-300 group-hover:scale-110">
                <Upload className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-800">
                Drag & Drop Images Here
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                OR{" "}
                <span className="font-semibold text-emerald-700 underline underline-offset-2">
                  Browse Files
                </span>
              </p>
              {newImages.length > 0 && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <Check className="h-3.5 w-3.5" />
                  <span>
                    {newImages.length}{" "}
                    {newImages.length === 1 ? "image" : "images"} selected
                  </span>
                </div>
              )}
            </div>

            {/* Empty State */}
            {totalImagesCount === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-sm font-semibold text-slate-700">
                  No images uploaded yet.
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Upload your first image to begin building the article gallery.
                </p>
              </div>
            )}

            {/* Existing Images Gallery */}
            {existingImages.length > 0 && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Current Gallery ({existingImages.length})
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {existingImages.map((image) => (
                    <div
                      key={image.id}
                      className={`group relative aspect-4/3 overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md ${
                        image.is_cover
                          ? "border-amber-500 ring-2 ring-amber-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Image
                        src={image.image}
                        alt="Article Gallery Image"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeExisting(image.id)}
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/60 text-white transition-all hover:bg-red-600 focus:outline-hidden"
                        title="Remove Image"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      {/* Cover Badge / Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setExistingAsCover(image.id)}
                        className={`absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs backdrop-blur-md transition-all ${
                          image.is_cover
                            ? "bg-amber-500 text-white"
                            : "bg-slate-900/70 text-white hover:bg-slate-900/90"
                        }`}
                      >
                        {image.is_cover ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>✓ Cover</span>
                          </>
                        ) : (
                          <>
                            <Star className="h-3 w-3" />
                            <span>Set as Cover</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Upload Previews */}
            {previews.length > 0 && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                  New Uploads ({previews.length})
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {previews.map((preview, index) => {
                    const isCover = coverIndex === index;
                    return (
                      <div
                        key={index}
                        className={`group relative aspect-4/3 overflow-hidden rounded-2xl border transition-all duration-200 hover:shadow-md ${
                          isCover
                            ? "border-amber-500 ring-2 ring-amber-500"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Image
                          src={preview.url}
                          alt="New Upload Preview"
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/60 text-white transition-all hover:bg-red-600 focus:outline-hidden"
                          title="Remove Image"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        {/* Cover Badge / Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setNewAsCover(index)}
                          className={`absolute bottom-2 left-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs backdrop-blur-md transition-all ${
                            isCover
                              ? "bg-amber-500 text-white"
                              : "bg-slate-900/70 text-white hover:bg-slate-900/90"
                          }`}
                        >
                          {isCover ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>✓ Cover</span>
                            </>
                          ) : (
                            <>
                              <Star className="h-3 w-3" />
                              <span>Set as Cover</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="self-start space-y-6 xl:sticky xl:top-24">
          {/* Publish Settings Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <h2 className="border-b border-slate-100 pb-3 text-lg font-bold text-slate-900">
              Publish Settings
            </h2>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "draft" | "published")
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 outline-hidden transition-all duration-200 focus:border-emerald-600 focus:bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-bold text-slate-900">
                      Featured Article
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFeatured((prev) => !prev)}
                    className={`relative inline-flex h-7 w-12 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 ${
                      featured ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-2xs transition duration-200 ease-in-out ${
                        featured ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-700 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-emerald-800 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Article...
                  </span>
                ) : (
                  submitButtonText
                )}
              </button>
            </div>
          </div>

          {/* Article Overview Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BarChart2 className="h-4 w-4 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">
                Article Overview
              </h2>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="font-medium text-slate-500">Title Length</span>
                <span className="font-mono font-bold text-slate-800">
                  {title.length} / 120 chars
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="font-medium text-slate-500">
                  Summary Length
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {summary.length} / 300 chars
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="font-medium text-slate-500">
                  Content Length
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {content.length} chars
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="font-medium text-slate-500">Total Images</span>
                <span className="font-bold text-slate-800">
                  {totalImagesCount}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="font-medium text-slate-500">Status</span>
                <span className="font-bold capitalize text-slate-800">
                  {status}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="font-medium text-slate-500">Featured</span>
                <span
                  className={`font-bold ${
                    featured ? "text-amber-600" : "text-slate-400"
                  }`}
                >
                  {featured ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
