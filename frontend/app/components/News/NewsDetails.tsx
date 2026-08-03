"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  Share2,
  Bookmark,
  Newspaper,
} from "lucide-react";
import type { News } from "@/app/types/news";
import NewsGallery from "./NewsGallery";
import Footer from "../sections/Footer";

// Helper function to safely capitalize strings without throwing index errors
const capitalize = (str?: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function NewsDetails({ article }: { article: News }) {
  const publishedDate = article.published_at
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
        new Date(article.published_at),
      )
    : null;

  // Estimate reading time based on content length
  const readTimeMinutes = article.content
    ? Math.max(
        1,
        Math.ceil(
          article.content.replace(/<[^>]+>/g, "").split(" ").length / 200,
        ),
      )
    : 1;

  return (
    <main className="min-h-screen bg-slate-50/70 text-slate-800">
      {/* Editorial Cover / Hero Section */}
      <section className="relative flex min-h-[380px] w-full items-end overflow-hidden bg-emerald-950 md:min-h-[480px] lg:min-h-[520px]">
        {/* Background Cover Image */}
        {article.cover_image && (
          <Image
            src={article.cover_image.image}
            alt={article.title || "News cover image"}
            fill
            priority
            className="object-cover transition-transform duration-1000 ease-out hover:scale-105"
            sizes="100vw"
          />
        )}

        {/* Multi-stage Editorial Gradient for Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />

        {/* Hero Content Container */}
        <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 pb-10 pt-28 text-white md:pb-14">
          {/* Top Bar: Back Link & Category Badge */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to News</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-300 uppercase ring-1 ring-emerald-400/30 backdrop-blur-md">
              <Newspaper className="h-3.5 w-3.5" />
              Latest Story
            </span>
          </div>

          {/* Main Article Title */}
          <h1 className="max-w-4xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:leading-[1.15]">
            {capitalize(article.title)}
          </h1>

          {/* Meta Details Row */}
          <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-300 sm:text-sm">
            {publishedDate && (
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-400" />
                {publishedDate}
              </span>
            )}

            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              {readTimeMinutes} min read
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 mb-10">


        {/* Body Content Container */}
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Main Article Body */}
          <section className="lg:col-span-12">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10 md:p-12">
              {/* Floating Action Controls */}
              <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Article Content
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-800 transition"
                    title="Bookmark"
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100 hover:text-slate-800 transition"
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Prose Rich Text Display */}
              <article
                className="prose prose-slate prose-lg max-w-none 
                  prose-headings:font-serif prose-headings:font-bold prose-headings:text-emerald-950 
                  prose-p:leading-relaxed prose-p:text-slate-700 
                  prose-a:font-medium prose-a:text-emerald-700 prose-a:underline-offset-4 hover:prose-a:text-emerald-800
                  prose-blockquote:border-l-emerald-600 prose-blockquote:bg-emerald-50/50 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:not-italic prose-blockquote:text-slate-700
                  prose-img:rounded-xl prose-img:shadow-md"
                dangerouslySetInnerHTML={{
                  __html: capitalize(article.content),
                }}
              />
            </div>

            {/* Attached Photo Gallery */}
            {article.images && article.images.length > 0 && (
              <NewsGallery images={article.images} />
            )}
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
