"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronLeft } from "lucide-react";
import type { News } from "@/app/types/news";
import NewsGallery from "./NewsGallery";

export default function NewsDetails({ article }: { article: News }) {
  const publishedDate = article.published_at ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(article.published_at)) : null;
  return <main className="min-h-screen bg-slate-50">
    <section className="relative flex min-h-72 items-end overflow-hidden bg-emerald-950 md:min-h-105">
      {article.cover_image && <Image src={article.cover_image.image} alt="" fill priority className="object-cover" sizes="100vw" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
      <div className="relative mx-auto w-full max-w-5xl px-6 pb-12 pt-24 text-white"><Link href="/news" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"><ChevronLeft size={18}/>All news</Link><h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{article.title}</h1>{publishedDate && <p className="mt-4 flex items-center gap-2 text-white/85"><CalendarDays size={18}/>{publishedDate}</p>}</div>
    </section>
    <section className="mx-auto max-w-5xl px-6 py-12"><p className="max-w-3xl text-lg leading-8 text-slate-600">{article.summary}</p><div className="mt-10 rounded-2xl border bg-white p-6 shadow-sm md:p-10"><article className="prose prose-lg max-w-none prose-headings:text-emerald-950 prose-a:text-emerald-700" dangerouslySetInnerHTML={{ __html: article.content }} /></div><NewsGallery images={article.images} /></section>
  </main>;
}
