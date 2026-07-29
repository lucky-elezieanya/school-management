"use client";

import { FormEvent, useState } from "react";
import { NewsEditor } from "@/app/components/News/NewsEditor";
import type { News, NewsPayload } from "@/app/types/news";

interface NewsFormProps {
  initialData?: News;
  isSubmitting?: boolean;
  onSubmit: (payload: NewsPayload) => Promise<void>;
}

export default function NewsForm({ initialData, isSubmitting = false, onSubmit }: NewsFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [status, setStatus] = useState<NewsPayload["status"]>(initialData?.status ?? "draft");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !summary.trim() || !content || content === "<p></p>") {
      setError("Title, summary, and article content are required.");
      return;
    }
    setError(null);
    await onSubmit({ title: title.trim(), summary: summary.trim(), content, status, featured });
  }

  return <form className="max-w-4xl space-y-6 rounded-2xl border bg-white p-6 shadow-sm" onSubmit={submit}>
    <div><label htmlFor="title" className="mb-2 block font-medium">Title</label><input id="title" required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border px-4 py-3 focus:border-emerald-600 focus:outline-none" /></div>
    <div><label htmlFor="summary" className="mb-2 block font-medium">Summary</label><textarea id="summary" required maxLength={500} rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} className="w-full rounded-xl border px-4 py-3 focus:border-emerald-600 focus:outline-none" /><p className="mt-1 text-right text-xs text-slate-500">{summary.length}/500</p></div>
    <div><label className="mb-2 block font-medium">Article content</label><NewsEditor value={content} onChange={setContent} error={error ?? undefined} /></div>
    <div className="flex flex-wrap gap-6"><label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} /> Feature on the news feed</label><label className="flex items-center gap-2">Status <select value={status} onChange={(event) => setStatus(event.target.value as NewsPayload["status"])} className="rounded-lg border px-3 py-2"><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label></div>
    <div className="flex justify-end"><button disabled={isSubmitting} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-60">{isSubmitting ? "Savingºw^~)Þv" : status === "published" ? "Publish article" : "Save draft"}</button></div>
  </form>;
}
