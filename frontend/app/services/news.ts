import { BASE_URL, apiHeaders, handleResponse, handleUserDelete } from "../lib/api";
import type { News, NewsFormData, NewsImage, NewsPayload, NewsSummary } from "../types/news";

const publicFetchOptions = { next: { revalidate: 300 } } as const;

export async function getPublishedNews() {
  return handleResponse(await fetch(`${BASE_URL}/news/news/`, publicFetchOptions));
}

export async function getNews(slug: string): Promise<News> {
  return handleResponse(await fetch(`${BASE_URL}/news/news/${slug}/`, publicFetchOptions));
}

export async function getAdminNews(): Promise<NewsSummary[]> {
  return handleResponse(await fetch(`${BASE_URL}/news/admin/news/`, { headers: apiHeaders() }));
}

export async function getAdminNewsItem(id: number): Promise<News> {
  return handleResponse(await fetch(`${BASE_URL}/news/admin/news/${id}/`, { headers: apiHeaders() }));
}


export async function saveNews(
  data: NewsFormData,
  images: File[],
  coverIndex: number | null,
  coverImageId: number | null,
  removedImages: number[],
  id?: number,
): Promise<News> {
  const formData = new FormData();

  formData.append("title", data.title);
  formData.append("summary", data.summary);
  formData.append("content", data.content);
  formData.append("status", data.status);
  formData.append("featured", String(data.featured));

  if (data.published_at) {
    formData.append("published_at", data.published_at);
  }

  images.forEach((image) => {
    formData.append("images", image);
  });

  removedImages.forEach((imageId) => {
    formData.append("removedImages", String(imageId));
  });

  if (coverIndex !== null) {
    formData.append("coverIndex", String(coverIndex));
  }

  if (coverImageId !== null) {
    formData.append("coverImageId", String(coverImageId));
  }

  const response = await fetch(
    id ? `${BASE_URL}/news/admin/news/${id}/` : `${BASE_URL}/news/admin/news/`,
    {
      method: id ? "PATCH" : "POST",
      headers: apiHeaders(),
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(error?.detail ?? "Unable to save article.");
  }

  return response.json();
}

export async function deleteNews(id:number): Promise<void> {
    const response = await handleUserDelete("news", "admin/news", id, "News");
    if (response) {
       alert("News deleted successfully.");
    }
}

export async function uploadNewsImage(
  news: number,
  file: File,
  metadata: Pick<NewsImage, "caption" | "is_cover" | "order">,
): Promise<NewsImage> {
  const body = new FormData();
  body.append("news", String(news));
  body.append("image", file);
  body.append("caption", metadata.caption);
  body.append("is_cover", String(metadata.is_cover));
  body.append("order", String(metadata.order));

  return handleResponse(await fetch(`${BASE_URL}/news/admin/news-images/`, {
    method: "POST",
    headers: apiHeaders(),
    body,
  }));
}

export async function deleteNewsImage(id: number): Promise<void> {
  await handleResponse(await fetch(`${BASE_URL}/news/admin/news-images/${id}/`, {
    method: "DELETE",
    headers: apiHeaders(),
  }));
}

export async function updateNewsImage(
  id: number,
  metadata: Partial<Pick<NewsImage, "caption" | "is_cover" | "order">>,
): Promise<NewsImage> {
  return handleResponse(await fetch(`${BASE_URL}/news/admin/news-images/${id}/`, {
    method: "PATCH",
    headers: { ...apiHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  }));
}
