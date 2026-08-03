"use client";

import { useEffect, useState } from "react";
import { getPublishedNews } from "@/app/services/news";
import type { NewsSummary } from "@/app/types/news";

export function useNewsFeed() {
  const [news, setNews] = useState<NewsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const publishedNews = async () => {
      setLoading(true);
      try {
        const res = await getPublishedNews();
        const data = res.results;
        setNews(data);
      } catch (error) {
        setLoading(false);
        console.log(error);
        return;
      } finally {
        setLoading(false);
        return;
      }
    };
    publishedNews();
  }, []);

  return { news, loading, error };
}
