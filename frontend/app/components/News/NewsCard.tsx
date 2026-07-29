import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ArrowRight } from "lucide-react";
import { NewsSummary } from "@/app/types/news";


interface Props {
  news: NewsSummary;
}

export default function NewsCard({ news }: Props) {
  return (
    <Link
      href={`/news/${news.slug}`}
      className="group block overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-72 overflow-hidden">
        <Image
          src={news.cover_image?.image ?? "/images/news-placeholder.jpg"}
          alt={news.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px)100vw,33vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-white text-xl font-bold line-clamp-2">
            {news.title}
          </h3>

          <p className="mt-2 text-white/90 text-sm line-clamp-2">
            {news.summary}
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <CalendarDays size={15} />

              {news.published_at &&
                new Date(news.published_at).toLocaleDateString()}
            </div>

            <span className="flex items-center gap-2 text-white font-medium">
              Read Story
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition"
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
