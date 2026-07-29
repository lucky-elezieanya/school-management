import { BASE_URL, apiHeaders, handleResponse } from "../lib/api";
import type { News, NewsImage, NewsPayload, NewsSummary } from "../types/news";

const publicFetchOptions = { next: { revalidate: 300 } } as const;

export async function getPublishedNews(): Promise<NewsSummary[]> {
  return handleResponse(await fetch(`${BASE_URL}/news/`, publicFetchOptions));
}

export async function getNews(slug: string): Promise<News> {
  return handleResponse(await fetch(`${BASE_URL}/news/${slug}/`, publicFetchOptions));
}

export async function getAdminNews(): Promise<NewsSummary[]> {
  return handleResponse(await fetch(`${BASE_URL}/news/admin/news/`, { headers: apiHeaders() }));
}

export async function getAdminNewsItem(id: number): Promise<News> {
  return handleResponse(await fetch(`${BASE_URL}/news/admin/news/${id}/`, { headers: apiHeaders() }));
}

async function mutateNews(url: string, method: "POST" | "PATCH", payload: NewsPayload): Promise<News> {
  return handleResponse(await fetch(url, {
    method,
    headers: { ...apiHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
}

export function createNews(payload: NewsPayload): Promise<News> {
  return mutateNews(`${BASE_URL}/news/admin/news/`, "POST", payload);
}

export function updateNews(id: number, payload: NewsPayload): Promise<News> {
  return mutateNews(`${BASE_URL}/news/admin/news/${id}/`, "PATCH", payload);
}

export async function deleteNews(id: number): Promise<void> {
  await handleResponse(await fetch(`${BASE_URL}/news/admin/news/${id}/`, {
    method: "DELETE",
    headers: apiHeaders(),
  }));
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
