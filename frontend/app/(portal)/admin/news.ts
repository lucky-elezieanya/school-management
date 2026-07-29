import { apiHeaders, BASE_URL, handleResponse } from "@/app/lib/api";


export async function getNews(search = "") {
  const response = await fetch(
    `${BASE_URL}/results/admin-news/?search=${encodeURIComponent(search)}`,
    {
      headers: apiHeaders(),
      cache: "no-store",
    },
  );

  return handleResponse(response);
}

export async function getNewsById(id: number) {
  const response = await fetch(`${BASE_URL}/results/admin-news/${id}/`, {
    headers: apiHeaders(),
    cache: "no-store",
  });

  return handleResponse(response);
}

export async function createNews(data: FormData) {
  const response = await fetch(`${BASE_URL}/results/admin-news/`, {
    method: "POST",
    headers: apiHeaders(),
    body: data,
  });

  return handleResponse(response);
}

export async function updateNews(id: number, data: FormData) {
  const response = await fetch(`${BASE_URL}/results/admin-news/${id}/`, {
    method: "PATCH",
    headers: apiHeaders(),
    body: data,
  });

  return handleResponse(response);
}

export async function deleteNews(id: number) {
  const response = await fetch(`${BASE_URL}/results/admin-news/${id}/`, {
    method: "DELETE",
    headers: apiHeaders(),
  });

  return handleResponse(response);
}
