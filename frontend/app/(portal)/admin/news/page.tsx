"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Newspaper, Plus } from "lucide-react";
import type { News} from "@/app/types/news";
import NewsTable from "./components/NewsTable";
import { apiHeaders, BASE_URL } from "@/app/lib/api";

export default function NewsAdminPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminNews();
      const data = res.results;
      setNews(data);
    }catch(error){
        setNews([])
        
        return
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  return (
    <div className="space-y-8 p-10 overflow-hidden">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between overflow-hidden">
        <div className="space-y-3">
          <Link
            href="/admin/administration"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>

          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <Newspaper className="h-7 w-7 text-emerald-700" />
              <span>News</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Create, publish, and manage school news.
            </p>
          </div>
        </div>

        <Link
          href="/admin/news/new"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 active:bg-emerald-900"
        >
          <Plus size={18} />
          <span>New article</span>
        </Link>
      </div>
      <NewsTable news={news} loading={loading} refresh={loadNews} />
    </div>
  );
}

async function getAdminNews() {
  const response = await fetch(`${BASE_URL}/news/admin/news/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...apiHeaders(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load admin news");
  }

  return await response.json();
}
