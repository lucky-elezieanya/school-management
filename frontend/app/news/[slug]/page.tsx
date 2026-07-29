import { getNews } from "@/app/services/news";
import NewsDetails from "@/app/components/News/NewsDetails";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function NewsPage({ params }: Props) {
  try {
    return <NewsDetails article={await getNews((await params).slug)} />;
  } catch {
    notFound();
  }
}
