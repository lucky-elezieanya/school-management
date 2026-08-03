import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { getPublishedNews } from "@/app/services/news";
import Footer from "../components/sections/Footer";

export const revalidate = 300;

export default async function NewsPage() {
  const response = await getPublishedNews();
  const news = response.results ?? response ?? [];

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Hero Section matching  */}
      <section className="relative py-24 md:py-32 text-white overflow-hidden">
        {/* Background Cover Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=2000"
            alt="Cozzi Schools Campus"
            className="w-full h-full object-cover"
          />
          {/* Dark Emerald Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/85 to-emerald-950/90 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
        </div>

        {/* Hero Banner Content */}
        <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl flex flex-col items-center">
          {/* Centered School Logo */}
          <div className="mb-6 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
            <img
              src="/logo.jpg"
              alt="Cozzi Schools Logo"
              className="h-16 w-auto sm:h-20 object-contain drop-shadow-md rounded-xl"
            />
          </div>

     

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-sm">
           School News
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
            Stay informed about school activities, achievements, announcements,
            competitions and important events.
          </p>
        </div>
      </section>

      {/* Main News Content */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {news.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-xs">
            <h2 className="text-2xl font-semibold text-slate-700">
              No News Available
            </h2>

            <p className="mt-3 text-slate-500">
              There are currently no published news articles.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {news.map((article: any) => (
              <article
                key={article.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="grid lg:grid-cols-[360px_1fr]">
                  {/* Image */}
                  <div className="relative h-64 lg:h-full min-h-[260px]">
                    {article.cover_image ? (
                      <Image
                        src={article.cover_image.image}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400 font-medium">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-between p-6 md:p-8">
                    <div>
                      {article.published_at && (
                        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                          <CalendarDays
                            size={17}
                            className="text-emerald-700"
                          />

                          {new Date(article.published_at).toLocaleDateString(
                            undefined,
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </div>
                      )}

                      <h2 className="text-2xl font-bold leading-tight text-emerald-950 md:text-3xl">
                        {article.title[0].toLocaleUpperCase() +
                          article.title.slice(1)}
                      </h2>

                      <p className="mt-5 leading-8 text-slate-600 line-clamp-4">
                        {article.summary[0].toLocaleUpperCase() +
                          article.summary.slice(1)}
                      </p>
                    </div>

                    <div className="mt-8">
                      <Link
                        href={`/news/${article.slug}`}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white shadow-xs transition hover:bg-emerald-800"
                      >
                        Read Full Story
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Footer Component */}
      <Footer />
    </main>
  );
}
