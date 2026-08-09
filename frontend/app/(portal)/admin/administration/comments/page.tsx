"use client";

import TermCommentEntryPage from "@/app/components/forms/CommentsForm";
import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useEffect, useState } from "react";

export default function CommentsPage() {
    const {currentTerm} = useAuth()
      const [portal, setPortal] = useState<any>(null);
      const [loading, setLoading] = useState(true);
    
      useEffect(() => {
        if (!currentTerm?.id || !currentTerm?.session?.id) {
          setLoading(false);
          return;
        }
    
        const getActivatedPortal = async () => {
          try {
            setLoading(true);
            const url = `${BASE_URL}/results/activate-portal/?term=${currentTerm.id}`;
    
            const resp = await fetch(url, {
              headers: apiHeaders(),
            });
            const res = await resp.json();
            if (resp.ok) {
              setPortal(res?.results[0] ?? null);
            }
          } catch (error) {
            console.error("Portal fetch error:", error);
            setPortal(null);
          } finally {
            setLoading(false);
          }
        };
    
        getActivatedPortal();
      }, [currentTerm]);
      if (loading) {
        return (
          <div className="p-6">
            <h1 className="text-xl font-semibold">Checking portal status...</h1>
          </div>
        );
      }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Term Comments, attendance and behavioural skills
          </h1>

          <p className="mt-2 text-gray-600">
            Enter term comments, attendance and behavioural skills for students.
          </p>
        </div>
      </div>
      {/* FORM CONTAINER */}
      {portal?.open ? (
        <div className="bg-white border rounded-2xl shadow-sm p-4 lg:p-6">
          <TermCommentEntryPage />
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
          <h2 className="font-semibold">Result Portal Not Open</h2>
          <p className="mt-1 text-sm">
            The result entry portal has not been activated for{" "}
            {currentTerm?.name}. Contact the administrator if you believe this
            is an error.
          </p>
        </div>
      )}
    </div>
  );
}
