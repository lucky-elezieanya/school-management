"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Edit, ExternalLink, Search, Star, Trash2, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { deleteNews } from "@/app/services/news";
import type { NewsSummary } from "@/app/types/news";
import NewsStatusBadge from "./NewsStatusBadge";

interface Props { news: NewsSummary[]; loading: boolean; refresh: () => Promise<void>; }

export default function NewsTable({ news, loading, refresh }: Props) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const filteredNews = useMemo(() => news.filter((item) => `${item.title} ${item.summary}`.toLowerCase().includes(search.toLowerCase())), [news, search]);

  async function remove(item: NewsSummary) {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try { setDeletingId(item.id); await deleteNews(item.id); toast.success("Article deleted."); await refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete the article."); }
    finally { setDeletingId(null); }
  }

  if (loading) return <div className="rounded-2xl border bg-white p-8">Loading newréÝyø§yÖ</div>;
  return <div className="space-y-6">
    <div className="relative max-w-md"><Search size={18} className="absolute left-4 top-3.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search articles" className="w-full rounded-xl border py-3 pl-11 pr-4 focus:border-emerald-500 focus:outline-none" /></div>
    {!filteredNews.length ? <div className="rounded-2xl border bg-white p-16 text-center"><Newspaper size={52} className="mx-auto text-slate-300" /><h2 className="mt-4 text-xl font-semibold">No articles found</h2><p className="mt-1 text-slate-500">Create a news article to get started.</p></div> :
    <div className="overflow-x-auto rounded-2xl border bg-white"><table className="min-w-full"><thead className="bg-slate-50"><tr className="text-left text-sm text-slate-600"><th className="px-5 py-4">Article</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Published</th><th className="px-5 py-4"><span className="sr-only">Actions</span></th></tr></thead><tbody>{filteredNews.map((item) => <tr key={item.id} className="border-t"><td className="px-5 py-4"><div className="flex min-w-72 items-center gap-4"><div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.cover_image ? <Image src={item.cover_image.image} alt="" fill className="object-cover" /> : null}</div><div><p className="font-semibold">{item.title}</p><p className="line-clamp-1 text-sm text-slate-500">{item.summary}</p>{item.featured && <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700"><Star size={13} fill="currentColor" />Featured</span>}</div></div></td><td className="px-5 py-4"><NewsStatusBadge status={item.status} /></td><td className="px-5 py-4 text-sm text-slate-600"><span className="flex items-center gap-2"><Calendar size={15}/>{item.published_at ? new Date(item.published_at).toLocaleDateString() : "éÝyø§yÔ"}</span></td><td className="px-5 py-4"><div className="flex gap-2"><Link aria-label="View article" href={`/news/${item.slug}`} target="_blank" className="rounded-lg border p-2"><ExternalLink size={17}/></Link><Link aria-label="Edit article" href={`/admin/news/${item.id}`} className="rounded-lg border p-2"><Edit size={17}/></Link><button aria-label="Delete article" disabled={deletingId === item.id} onClick={() => void remove(item)} className="rounded-lg border p-2 text-red-600 disabled:opacity-50"><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div>}
  </div>;
}
