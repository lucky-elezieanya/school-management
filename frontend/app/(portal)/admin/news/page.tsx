"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, Plus } from "lucide-react";
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
    <div className="space-y-8 p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Newspaper className="text-emerald-700" />
            News
          </h1>
          <p className="mt-2 text-slate-600">
            Create, publish, and manage school news.
          </p>
        </div>
        <Link
          href="/admin/news/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
        >
          <Plus size={18} />
          New article
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
