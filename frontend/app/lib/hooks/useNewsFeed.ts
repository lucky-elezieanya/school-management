"use client";

import { useEffect, useState } from "react";
import { getPublishedNews } from "@/app/services/news";
import type { NewsSummary } from "@/app/types/news";

export function useNewsFeed() {
  const [news, setNews] = useState<NewsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getPublishedNews().then((data) => active && setNews(data)).catch((err: unknown) => active && setError(err instanceof Error ? err.message : "Unable to load news.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return { news, loading, error };
}
