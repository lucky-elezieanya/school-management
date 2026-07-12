export interface StudentReportParams {
  studentId: number;
  termId: number;
  sessionId: number;
}

export interface MergeClassPdfParams {
  schoolClassId: number;
  termId: number;
  sessionId: number;
}

import { BASE_URL, apiHeaders } from "@/app/lib/api";

export async function getStudentReport(
  params: StudentReportParams,
  accessToken: string,
) {
  const url = new URL(`${BASE_URL}/results/report-card/`);

  url.searchParams.append("student", String(params.studentId));
  url.searchParams.append("term", String(params.termId));
  url.searchParams.append("session", String(params.sessionId));

  const response = await fetch(url.toString(), {
    headers: apiHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load report.");
  }

  return response.json();
}

export async function uploadStudentPdf(
  file: Blob,
  params: StudentReportParams,
) {
  const formData = new FormData();

  formData.append("file", file, `student_${params.studentId}.pdf`);

  formData.append("student_id", String(params.studentId));

  formData.append("term_id", String(params.termId));

  formData.append("session_id", String(params.sessionId));

  const response = await fetch(
    `${BASE_URL}/results/result-pdfs/upload-student-pdf/`,
    {
      method: "POST",
      headers: apiHeaders(),
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Student PDF upload failed.");
  }

  return response.json();
}

export async function mergeClassPdf(params: MergeClassPdfParams) {
  const response = await fetch(
    `${BASE_URL}/results/result-pdfs/merge-class-pdf/`,
    {
      method: "POST",
      headers: apiHeaders(),
      body: JSON.stringify({
        school_class_id: params.schoolClassId,
        term_id: params.termId,
        session_id: params.sessionId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to merge class PDF.");
  }

  return response.json();
}

export async function getMergedClassPdf(
  schoolClassId: number,
  termId: number,
  sessionId: number,
) {
  const url = new URL(`${BASE_URL}/results/result-pdfs/class-pdf/`);

  url.searchParams.append("school_class", String(schoolClassId));

  url.searchParams.append("term", String(termId));

  url.searchParams.append("session", String(sessionId));

  const response = await fetch(url.toString(), {
    headers: apiHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getMyResultPdf() {
  const response = await fetch(`${BASE_URL}/results/result-pdfs/my-pdf/`, {
    headers: apiHeaders(),
    cache: "no-store",
  });

  if (response.status === 403) {
    return {
      released: false,
    };
  }

  if (!response.ok) {
    throw new Error("Unable to fetch result PDF.");
  }

  const data = await response.json();

  return {
    released: true,
    ...data,
  };
}