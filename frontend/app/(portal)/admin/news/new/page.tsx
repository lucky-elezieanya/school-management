"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import NewsForm from "../components/NewsForm";
import { createNews } from "@/app/services/news";
import type { NewsPayload } from "@/app/types/news";

export default function CreateNewsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(payload: NewsPayload) {
    try {
      setIsSubmitting(true);
      const article = await createNews(payload);
      toast.success("Article saved.");
      router.push(`/admin/news/${article.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the article.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-slate-900">Create article</h1><p className="mt-1 text-slate-600">Draft your update, then publish when it is ready.</p></div><NewsForm onSubmit={handleSubmit} isSubmitting={isSubmitting} /></div>;
}
