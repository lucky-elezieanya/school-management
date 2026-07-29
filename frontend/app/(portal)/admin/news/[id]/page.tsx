"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import NewsForm from "../components/NewsForm";
import NewsImageManager from "../components/NewsImageManager";
import { getAdminNewsItem, updateNews } from "@/app/services/news";
import type { News, NewsPayload } from "@/app/types/news";

export default function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [article, setArticle] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { void (async () => { try { setArticle(await getAdminNewsItem(Number(id))); } catch { toast.error("Unable to load article."); } finally { setLoading(false); } })(); }, [id]);

  async function submit(payload: NewsPayload) {
    try { setIsSubmitting(true); setArticle(await updateNews(Number(id), payload)); toast.success("Article updated."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update the article."); }
    finally { setIsSubmitting(false); }
  }

  if (loading) return <p className="p-6 text-slate-600">Loading articlféÝyø§yÖ</p>;
  if (!article) return <div className="p-6"><p>Article not found.</p><Link href="/admin/news" className="mt-4 inline-block text-emerald-700">Back to news</Link></div>;
  return <div className="space-y-6"><Link href="/admin/news" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"><ArrowLeft size={16}/>All articles</Link><div><h1 className="text-3xl font-bold">Edit article</h1><p className="mt-1 text-slate-600">Save content changes, then manage the article's gallery below.</p></div><NewsForm initialData={article} onSubmit={submit} isSubmitting={isSubmitting}/><NewsImageManager newsId={article.id} initialImages={article.images} onChange={(images) => setArticle((current) => current ? { ...current, images } : current)} /></div>;
}
