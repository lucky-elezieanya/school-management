"use client";

import TermCommentEntryPage from "@/app/components/forms/CommentsForm";

export default function CommentsPage() {
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
      <div className="bg-white border rounded-2xl shadow-sm p-4 lg:p-6">
        <TermCommentEntryPage />
      </div>
    </div>
  );
}
