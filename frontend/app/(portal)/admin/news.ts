// import { apiHeaders, BASE_URL, handleResponse } from "@/app/lib/api";

// export async function getNews(search = "") {
//   const response = await fetch(
//     `${BASE_URL}/results/admin-news/?search=${encodeURIComponent(search)}`,
//     {
//       headers: apiHeaders(),
//       cache: "no-store",
//     },
//   );

//   return handleResponse(response);
// }

// export async function getNewsById(id: number) {
//   const response = await fetch(`${BASE_URL}/results/admin-news/${id}/`, {
//     headers: apiHeaders(),
//     cache: "no-store",
//   });

//   return handleResponse(response);
// }

// export async function createNews(data: FormData) {
//   const response = await fetch(`${BASE_URL}/news/admin/news/`, {
//     method: "POST",
//     headers: apiHeaders(),
//     body: data,
//   });

//   return handleResponse(response);
// }

// export async function updateNews(id: number, data: FormData) {
//   const response = await fetch(`${BASE_URL}/news/admin/news/${id}/`, {
//     method: "PATCH",
//     headers: apiHeaders(),
//     body: data,
//   });

//   return handleResponse(response);
// }

// export async function deleteNews(id: number) {
//   const response = await fetch(`${BASE_URL}/news/admin-news/${id}/`, {
//     method: "DELETE",
//     headers: apiHeaders(),
//   });

//   return handleResponse(response);
// }
import { apiHeaders, BASE_URL, handleResponse } from "@/app/lib/api";
import type { NewsFormData } from "@/app/types/news";

export async function getNews(search = "") {
  const response = await fetch(
    `${BASE_URL}/news/admin/news/?search=${encodeURIComponent(search)}`,
    {
      headers: apiHeaders(),
      cache: "no-store",
    },
  );

  return handleResponse(response);
}

export async function getNewsById(id: number) {
  const response = await fetch(`${BASE_URL}/news/admin/news/${id}/`, {
    headers: apiHeaders(),
    cache: "no-store",
  });

  return handleResponse(response);
}

export async function createNews(data: NewsFormData) {
  const response = await fetch(`${BASE_URL}/news/admin/news/`, {
    method: "POST",
    headers: {
      ...apiHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function updateNews(id: number, data: NewsFormData) {
  const response = await fetch(`${BASE_URL}/news/admin/news/${id}/`, {
    method: "PATCH",
    headers: {
      ...apiHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

export async function deleteNews(id: number) {
  const response = await fetch(`${BASE_URL}/news/admin/news/${id}/`, {
    method: "DELETE",
    headers: apiHeaders(),
  });

  return handleResponse(response);
}

export async function deleteNewsImage(imageId: number) {
  const response = await fetch(
    `${BASE_URL}/news/admin/news-images/${imageId}/`,
    {
      method: "DELETE",
      headers: apiHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to delete image.");
  }
}