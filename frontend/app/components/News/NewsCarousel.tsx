"use client";

import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useCallback } from "react";
import { useNewsFeed } from "@/app/lib/hooks/useNewsFeed";

export default function NewsCarousel() {
  const { news, loading } = useNewsFeed();


  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: news.length < 3 ? "center" : "start",
      loop: news.length > 3,
      slidesToScroll: 1,
    },
    [
      Autoplay({
        delay: 6000,
        stopOnInteraction: false,
      }),
    ],
  );

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 w-60 rounded bg-gray-200 animate-pulse" />
            <div className="h-10 w-24 rounded bg-gray-200 animate-pulse" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl overflow-hidden border shadow-sm"
              >
                <div className="h-56 bg-gray-200 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!news.length) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div
          className={`mb-8 flex items-center ${
            news.length > 1
              ? "justify-between px-15"
              : "justify-center text-center"
          }`}
        >
          <div
            className={`${
              news.length > 1 ? "max-w-lg pl-2" : "max-w-xl mx-auto px-6"
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950">
              Latest News
            </h2>

            <p className="mt-3 text-gray-500 leading-relaxed">
              Stay updated with events, achievements, school activities and
              important announcements from our community.
            </p>
          </div>

          {news.length > 1 && (
            <div className="hidden md:flex gap-3">
              <button
                onClick={scrollPrev}
                className="h-11 w-11 rounded-full border flex items-center justify-center hover:bg-emerald-50 transition"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={scrollNext}
                className="h-11 w-11 rounded-full border flex items-center justify-center hover:bg-emerald-50 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        <div
          ref={news.length > 1 ? emblaRef : undefined}
          className={news.length > 1 ? "overflow-hidden" : ""}
        >
          <div className={`flex ${news.length < 3 ? "justify-center" : ""}`}>
            {news &&
              news.length > 0 &&
              news.map((item) => (
                <div
                  key={item.id}
                  className={`
                    min-w-0
                    ${
                      news.length === 1
                        ? "flex-[0_0_90%] md:flex-[0_0_65%] xl:flex-[0_0_45%]"
                        : news.length === 2
                          ? "flex-[0_0_90%] md:flex-[0_0_45%]"
                          : "flex-[0_0_100%] sm:flex-[0_0_50%] xl:flex-[0_0_33.3333%]"
                    }
                    px-3
                  `}
                >
                  <Link
                    href={`/news/${item.slug}`}
                    className="group block h-full"
                  >
                    <div className="rounded-3xl overflow-hidden border bg-white shadow-sm hover:shadow-xl transition-all duration-300 h-full">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={item.cover_image?.image ?? ""}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <CalendarDays size={15} />

                          {item.published_at &&
                            new Date(item.published_at).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                        </div>

                        <h3 className="font-bold text-xl text-emerald-950 group-hover:text-emerald-700 transition line-clamp-2">
                          {item.title[0].toLocaleUpperCase() +
                            item.title.slice(1)}
                        </h3>

                        <p className="text-gray-600 mt-3 line-clamp-3">
                          {item.summary[0].toLocaleUpperCase() +
                            item.summary.slice(1)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
