import {
  BASE_URL,
  apiHeaders,
  request,
  handleUserDelete,
  apiAction,
  createAction,
  updateAction,
} from "@/app/lib/api";

export const getSessions = async () => {
  const res = await apiAction("academics", "sessions");
  return res;
};
export const sessionTerms = async (sessionId: number) => {
  const res = await apiAction("academics", `sessions/${sessionId}/terms`);
  return res;
};

export const getClasses = async () => {
  const res = await apiAction("academics", "classes");
  return res;
};

export const getMaxScores = async () => {
  const res = await apiAction("results", "maxscores");
  return res;
};
export const getGrades = async () => {
  const res = await apiAction("results", "grades");
  return res;
};

export const fetchStudents = (classId: number, sessionId: number) =>
  request(
    `/academics/enrollments/students/?school_class=${classId}&session=${sessionId}`,
  );

// export const getSchoolLogo = async () => {
//   const res = await fetch(
//     `${BASE_URL}/academics/school-assets/?asset_type=logo&is_active=true`,
//     {
//       headers: apiHeaders(),
//     },
//   );
//   const asset = await res.json();
//   return asset;
// };
