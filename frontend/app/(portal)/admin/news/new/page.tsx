"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import NewsForm from "../components/NewsForm";
import AdminPageHeader from "../components/AdminPageHeader";
import { BASE_URL, apiHeaders } from "@/app/lib/api";
import { NewsFormData } from "@/app/types/news";
import { saveNews } from "@/app/services/news";

export default function CreateNewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    data: NewsFormData,
    images: File[],
    coverIndex: number | null,
    coverImageId: number | null,
    removedImages: number[],
  ) {
    try {
      setLoading(true);
  
      await saveNews(
        data,
        images,
        coverIndex,
        coverImageId,
        removedImages,
      );
  
      toast.success("News created successfully.");
  
      router.push("/admin/news");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create article.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Create News"
        description="Publish a news article for parents and students."
      />

      <NewsForm
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  );
}