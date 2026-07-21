// services/results.ts

import { request, BASE_URL, apiHeaders } from "../lib/api";

export function getOrdinal(position: any) {
  const n = Number(position);

  if (n % 100 >= 11 && n % 100 <= 13) {
    return `${n}th`;
  }

  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}



const handleResponse = async (res: Response) => {
  let data: any = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.message ||
      Object.values(data || {})
        .flat()
        .join(", ") ||
      `Request failed with status ${res.status}`;

    throw new Error(message);
  }

  return data;
};

export const getTaskStatus = async (taskId: string) => {
  const res = await fetch(`${BASE_URL}/results/tasks/${taskId}/`, {
    method: "GET",
    headers: apiHeaders(),
  });

  return handleResponse(res);
};

export const computeAllResults = async (payload: {
  term_id: number;
  session_id: number;
}) => {
  const res = await fetch(`${BASE_URL}/results/computation/compute/`, {
    method: "POST",
    headers: {
      ...apiHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
};

export const recomputeAllResults = async (payload: {
  term_id: number;
  session_id: number;
}) => {
  const res = await fetch(`${BASE_URL}/results/computation/recompute/`, {
    method: "POST",
    headers: {
      ...apiHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
};

export const fetchClasses = () => request("/academics/classes/");

export const fetchSubjects = (classId: number, termId: number) =>
  request(`/academics/classes/${classId}/subjects/?term=${termId}`);

export const fetchStudents = (classId: number) =>
  request(`/academics/classes/${classId}/students/`);

export const fetchClassEntryData = async (
  classId: number,
  subjectId: number,
  term: number,
) => {
  const url = `${BASE_URL}/results/results/subject-results/?term=${term}&class_id=${classId}&class_subject_id=${subjectId}`;
  const res = await fetch(url, { headers: apiHeaders() });
  return handleResponse(res);
};
export const submitBulkResults = (payload: any) =>
  request("/results/results/bulk-create/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchGrades = () => request("/results/grading-scales/");

export const fetchMaxScores = (classId: number) =>
  request(`/results/maxscores/?school_class=${classId}`);

export const toggleStudentActiveStatus = async (
  studentId: number,
  actionName: string,
) => {
  const res = await fetch(
    `${BASE_URL}/academics/students/${studentId}/${actionName}/`,
    {
      method: "PATCH",
      headers: apiHeaders(),
    },
  );
  const response = await res.json();
  if (!res.ok) {
    alert(response?.message || `Failed to ${actionName} student`);
    return null;
  }

  return response;
};
// =========================
// ACTIVATE RESULT PORTAL
// =========================

export const getPortalStatus = async (termId: number) => {
  const res = await fetch(
    `${BASE_URL}/results/activate-portal/?term=${termId}`,
    {
      headers: apiHeaders(),
    },
  );

  return handleResponse(res);
};

export const savePortalStatus = async (payload: any, id?: number) => {
  const url = id
    ? `${BASE_URL}/results/activate-portal/${id}/`
    : `${BASE_URL}/results/activate-portal/`;

  const res = await fetch(url, {
    method: id ? "PATCH" : "POST",
    headers: { ...apiHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
};

// =========================
// RESUMPTION DATE
// =========================

export const getResumptionDate = async () => {
  const res = await fetch(`${BASE_URL}/results/resumption-date/`, {
    headers: apiHeaders(),
  });

  return handleResponse(res);
};

export const updateResumptionDate = async (payload: any, id?: number) => {
  const url = id
    ? `${BASE_URL}/results/resumption-date/${id}/`
    : `${BASE_URL}/results/resumption-date/`;

  const res = await fetch(url, {
    method: id ? "PATCH" : "POST",
    headers: { ...apiHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
};

export const getWorkFlowApprovedStatus = async (
  school_class: number,
  term: number,
  session: number,
) => {
  const url = `${BASE_URL}/results/workflow/?school_class=${school_class}&term=${term}&session=${session}`;
  const res = await fetch(url, {
    headers: apiHeaders(),
  });
  return handleResponse(res);
};

export async function uploadTeacherSignature(
  file: File,
  schoolClassId: number,
  classTeacherId: number,
  is_active: boolean,
) {
  const formData = new FormData();

  formData.append("signature", file);
  formData.append("school_class", schoolClassId.toString());
  formData.append("teacher", classTeacherId.toString());
  formData.append("is_active", is_active.toString());

  const response = await fetch(`${BASE_URL}/results/teacher-signatures/`, {
    method: "POST",
    headers: apiHeaders(),
    body: formData,
  });

  return handleResponse(response);
}

export async function getTeacherSignatures() {
  const response = await fetch(`${BASE_URL}/results/teacher-signatures/`, {
    headers: apiHeaders(),
  });

  return handleResponse(response);
}

export async function uploadHeadTeacherSignature(owner: string, file: File) {
  const formData = new FormData();

  formData.append("owner", owner);
  formData.append("signature", file);

  const response = await fetch(`${BASE_URL}/results/headteacher-signatures/`, {
    method: "POST",
    headers: apiHeaders(),
    body: formData,
  });
  return handleResponse(response);
}

export async function getHeadTeacherSignatures(token: string) {
  const response = await fetch(`${BASE_URL}/results/headteacher-signatures/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}
