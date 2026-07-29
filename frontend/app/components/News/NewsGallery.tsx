"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { NewsImage } from "@/app/types/news";



interface Props {
  images: NewsImage[];
}

export default function NewsGallery({ images }: Props) {
  const [index, setIndex] = useState(-1);

  if (!images.length) {
    return null;
  }

  return (
    <>
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-emerald-950 mb-6">Gallery</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setIndex(i)}
              className="group relative aspect-square overflow-hidden rounded-2xl border bg-gray-100"
            >
              <Image
                src={image.image}
                alt={image.caption || "News image"}
                fill
                sizes="(max-width:768px) 50vw,
									   (max-width:1024px) 33vw,
									   25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />

              {image.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-xs text-white line-clamp-2">
                  {image.caption}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

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
