"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {  PdfPreview } from "@/app/components/results/pdf";
import { apiHeaders, BASE_URL } from "@/app/lib/api";



interface ResultSnapshot {
  id: string;
  data: any;
}

export default function ResultPreviewPage() {
  const { id } = useParams<{ id: string }>();

  const [snapshot, setSnapshot] = useState<ResultSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const loadSnapshot = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${BASE_URL}/results/result-snapshots/${id}/`,
          {
           headers: apiHeaders(),
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch result snapshot.");
        }

        const data = await response.json();
        setSnapshot(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load result.");
      } finally {
        setLoading(false);
      }
    };

    loadSnapshot();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading result...
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return <div className="flex flex-col justify-center mx-auto">
      <PdfPreview snapshot={snapshot.data} />;
    </div>
}
