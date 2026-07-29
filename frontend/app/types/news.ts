export type NewsStatus = "draft" | "published";

export interface NewsFormData {
  title: string;
  summary: string;
  content: string;

  status: NewsStatus;

  featured: boolean;

  published_at?: string;
}

export interface NewsImage {
  id: number;
  news: number;
  image: string;
  caption: string;
  is_cover: boolean;
  order: number;
}

export interface NewsCoverImage {
  image: string;
  caption: string;
}

export interface NewsSummary {
  id: number;
  title: string;
  slug: string;
  summary: string;
  cover_image: NewsCoverImage | null;
  status: NewsStatus;
  published: boolean;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface News extends NewsSummary {
  content: string;
  images: NewsImage[];
}

export interface NewsPayload {
  title: string;
  summary: string;
  content: string;
  status: NewsStatus;
  featured: boolean;
  published_at?: string | null;
}


