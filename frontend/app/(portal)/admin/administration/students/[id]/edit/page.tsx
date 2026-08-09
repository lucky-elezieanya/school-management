"use client";

import EditStudent from "@/app/components/EditStudent";
import { useRouter, useParams } from "next/navigation";

export default function EditStudentPage() {
  const router = useRouter();

  const params = useParams<{ id: string }>();

  const studentId = Number(params.id);

  return <EditStudent studentId={studentId} />;
}
