export type ResultColumnId =
  | "sn"
  | "subject"
  | "ca1"
  | "ca2"
  | "exam"
  | "total"
  | "t1"
  | "t2"
  | "t3"
  | "cum"
  | "average"
  | "score"
  | "grade"
  | "position"
  | "remark";

export interface ResultColumn {
  id: ResultColumnId;
  title: string;
}

export interface SubjectResult {
  subjectId: number;
  subjectName: string;

  firstTest?: number;
  secondTest?: number;
  examScore?: number;

  totalScore: number;

  firstTermTotal?: number;
  secondTermTotal?: number;
  thirdTermTotal?: number;
  cumulativeAverage?: number;

  subjectAverage?: number;
  subjectScore?: number;

  grade: string;

  subjectPosition?: string;

  remark: string;
}
