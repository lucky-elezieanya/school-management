import { StudentResultSnapshot } from "@/app/types/result-snapshot";
import { ResultColumn } from "./types";

export function getColumns(snapshot: StudentResultSnapshot): ResultColumn[] {
  const c = snapshot.customization;

  return [
    { id: "sn", title: "S/N" },
    { id: "subject", title: "Subject" },

    ...(c.testScores
      ? ([
          { id: "ca1", title: "1st CA" },
          { id: "ca2", title: "2nd CA" },
          { id: "exam", title: "Exam" },
        ] as ResultColumn[])
      : []),

    { id: "total", title: "Term Total" },

    ...(c.cumulativeAverage
      ? ([
          { id: "t1", title: "T1" },
          { id: "t2", title: "T2" },
          { id: "cum", title: "Cum" },
        ] as ResultColumn[])
      : []),

    ...(c.subjectAverage
      ? ([{ id: "average", title: "Class Avg" }] as ResultColumn[])
      : []),

    ...(c.subjectScore
      ? ([{ id: "score", title: "Score" }] as ResultColumn[])
      : []),

    { id: "grade", title: "Grade" },

    ...(c.subjectPosition
      ? ([{ id: "position", title: "Pos" }] as ResultColumn[])
      : []),

    { id: "remark", title: "Remark" },
  ];
}