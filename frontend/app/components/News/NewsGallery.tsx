"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { NewsImage } from "@/app/types/news";
import { Camera, Maximize2, Images } from "lucide-react";

interface Props {
  images: NewsImage[];
}

export default function NewsGallery({ images }: Props) {
  const [index, setIndex] = useState(-1);

  if (!images || images.length === 0) {
    return null;
  }

  const hasMultiple = images.length > 1;

  return (
    <>
      <section className="mt-14 space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/10">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl">
                Photo Gallery
              </h2>
            </div>
          </div>

          {/* Image Count Badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-950/5 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-950/10">
            <Images className="h-3.5 w-3.5 text-emerald-700" />
            <span>
              {images.length} {images.length === 1 ? "Photo" : "Photos"}
            </span>
          </div>
        </div>

        {/* Gallery Layout Grid */}
        <div
          className={`grid gap-4 sm:gap-5 ${
            hasMultiple
              ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1"
          }`}
        >
          {images.map((image, i) => {
            const isFeatured = hasMultiple && i === 0;

            return (
              <button
                key={image.id || i}
                type="button"
                onClick={() => setIndex(i)}
                className={`group relative overflow-hidden rounded-2xl bg-gray-100 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
                  isFeatured
                    ? "aspect-[16/10] md:col-span-2 md:row-span-2 md:aspect-square lg:aspect-[4/3]"
                    : "aspect-square"
                }`}
              >
                {/* Image */}
                <Image
                  src={image.image}
                  alt={image.caption || "News media illustration"}
                  fill
                  sizes={
                    isFeatured
                      ? "(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                      : "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  }
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* Subtle Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

                {/* Hover Zoom Icon Badge */}
                <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-emerald-600 group-hover:scale-110">
                  <Maximize2 className="h-4 w-4" />
                </div>

                {/* Caption Banner */}
                {image.caption && (
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p
                      className={`font-medium leading-snug text-white/90 drop-shadow-sm ${
                        isFeatured
                          ? "text-sm sm:text-base line-clamp-2"
                          : "text-xs line-clamp-2"
                      }`}
                    >
                      {image.caption}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Lightbox Modal Viewer */}
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={images.map((image) => ({
          src: image.image,
          title: image.caption,
        }))}
      />
    </>
  );
}
