"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deleteNewsImage,
  updateNewsImage,
  uploadNewsImage,
} from "@/app/services/news";
import type { NewsImage } from "@/app/types/news";

interface Props {
  newsId: number;
  initialImages: NewsImage[];
  onChange: (images: NewsImage[]) => void;
}

export default function NewsImageManager({
  newsId,
  initialImages,
  onChange,
}: Props) {
  const [images, setImages] = useState(initialImages);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => setImages(initialImages), [initialImages]);

  function commit(next: NewsImage[]) {
    setImages(next);
    onChange(next);
  }
  function pick(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  async function upload() {
    if (!files.length) return;
    try {
      setUploading(true);
      const created = await Promise.all(
        files.map((file, index) =>
          uploadNewsImage(newsId, file, {
            caption: "",
            is_cover: images.length === 0 && index === 0,
            order: images.length + index,
          }),
        ),
      );
      commit([...images, ...created]);
      setFiles([]);
      toast.success(
        `${created.length} image${created.length === 1 ? "" : "s"} uploaded.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function setCover(image: NewsImage) {
    try {
      const updated = await updateNewsImage(image.id, { is_cover: true });
      commit(
        images.map((item) =>
          item.id === image.id ? updated : { ...item, is_cover: false },
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to set cover image.",
      );
    }
  }

  async function saveCaption(image: NewsImage, caption: string) {
    try {
      const updated = await updateNewsImage(image.id, { caption });
      commit(images.map((item) => (item.id === image.id ? updated : item)));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save caption.",
      );
    }
  }

  async function remove(image: NewsImage) {
    // if (!window.confirm("Remove this image?")) return;
    try {
      await deleteNewsImage(image.id);
      commit(images.filter((item) => item.id !== image.id));
      toast.success("Image removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove image.",
      );
    }
  }

  return (
    <section className="max-w-4xl space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Images and gallery</h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload photos, choose the article cover, and add accessible captions.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4">
        <ImagePlus className="text-emerald-700" />
        <input
          aria-label="Choose images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={pick}
        />
        <button
          type="button"
          disabled={!files.length || uploading}
          onClick={() => void upload()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Upload size={16} />
          {uploading
            ? "Uploadinf��y��y�"
            : `Upload${files.length ? ` (${files.length})` : ""}`}
        </button>
      </div>
      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <article
              key={`${image.id}-${image.order}`}
              className="overflow-hidden rounded-xl border"
            >
              <div className="relative aspect-video bg-slate-100">
                <Image
                  src={image?.image}
                  alt={image.caption || "News gallery image"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-3 p-3">
                <label className="block text-sm font-medium">
                  Caption
                  <input
                    defaultValue={image.caption}
                    onBlur={(event) => {
                      if (event.target.value !== image.caption)
                        void saveCaption(image, event.target.value);
                    }}
                    className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                  />
                </label>
                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => void setCover(image)}
                    disabled={image.is_cover}
                    className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 disabled:text-slate-400"
                  >
                    <Star
                      size={16}
                      fill={image.is_cover ? "currentColor" : "none"}
                    />
                    {image.is_cover ? "Cover image" : "Set as cover"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(image)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-red-600"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
