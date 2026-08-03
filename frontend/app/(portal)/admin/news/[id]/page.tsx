"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import NewsForm from "../components/NewsForm";
import { getAdminNewsItem, saveNews } from "@/app/services/news";
import type { News, NewsFormData } from "@/app/types/news";
import { useRouter } from "next/navigation";

export default function EditNewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
const router = useRouter();
  const [article, setArticle] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const news = await getAdminNewsItem(Number(id));
        setArticle(news);
      } catch {
        toast.error("Unable to load article.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSubmit(
    data: NewsFormData,
    images: File[],
    coverIndex: number | null,
    coverImageId: number | null,
    removedImages: number[],
  ) {
    try {
      setIsSubmitting(true);
  
      const updated = await saveNews(
        data,
        images,
        coverIndex,
        coverImageId,
        removedImages,
        Number(id),
      );
  
      setArticle(updated);
  
      toast.success("Article updated successfully.");
      router.push("/admin/news");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update article.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <p className="p-6 text-slate-600">Loading article...</p>;
  }

  if (!article) {
    return (
      <div className="p-6">
        <p>Article not found.</p>

        <Link href="/admin/news" className="mt-4 inline-block text-emerald-700">
          Back to news
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/news"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        <ArrowLeft size={16} />
        Back to News
      </Link>

      <NewsForm
        initialData={article}
        loading={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
