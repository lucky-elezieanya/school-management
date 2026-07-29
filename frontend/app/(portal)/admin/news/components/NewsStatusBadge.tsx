"use client";

interface Props {
  status: "draft" | "published";
}

export default function NewsStatusBadge({ status }: Props) {
  const published = status === "published";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        published
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
