import {

  request,
  
  apiAction,
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
  const res = await apiAction("results", "grading-scales");
  return res;
};

export const fetchStudents = (classId: number, sessionId: number, page?: number) =>
  request(
    `/academics/enrollments/students/?school_class=${classId}&session=${sessionId}&is_current=True&page=${page}`,
  );


