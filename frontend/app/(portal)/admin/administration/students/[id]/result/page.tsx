"use client";

import StudentResultPreview from "@/app/components/StudentResultPreview";
import { useParams, useSearchParams } from "next/navigation";

export default function StudentResultPage() {
  const params = useParams();
  const search = useSearchParams();

  return (
    <StudentResultPreview
      studentId={Number(params.id)}
      classId={Number(search.get("class_id"))}
      termId={Number(search.get("term_id"))}
      sessionId={Number(search.get("session_id"))}
    />
  );
}
