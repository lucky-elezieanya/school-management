"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Download, Eye, Loader2, RefreshCw } from "lucide-react";
import { StudentResultSnapshot } from "@/app/types/result-snapshot";
import { ResultSnapshot } from "./ResultBroadsheet";
import { BASE_URL } from "@/app/lib/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PdfContainer } from "@/src/components/results/pdf";
import { getBackendBaseUrl } from "@/app/services/results";
import { downloadPdf } from "@/src/components/results/pdf/downloadPdf";

interface Props {
  snapshots: any[];

  subjects: ResultSnapshot["data"]["subjects"];

  customization: ResultSnapshot["data"]["customization"];

  onPreview: (snapshot: ResultSnapshot) => void;
}

interface ScoreField {
  key: string;

  label: string;
}

export function renderPosition(position?: string) {
  if (!position) return "-";

  const match = position.match(/^(\d+)(st|nd|rd|th)$/i);

  if (!match) {
    return position;
  }

  const [, number, suffix] = match;

  return (
    <>
      {number}
      <sup className="ml-[1px] text-[0.65em] font-semibold">{suffix}</sup>
    </>
  );
}

const formatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

function numericPosition(position: string) {
  return parseInt(position.replace(/\D/g, "") || "999");
}

const skippedValuesList = [
  "firstTest",
  "secondTest",
  "examScore",
  "grade",
  "subjectAverage",
  "subjectPosition",
  "cumulativeAverage",
  "totalObtainableScore",
  "averageScore",
];

function gradeColor(grade: string) {
  switch (grade) {
    case "A":
      return "bg-emerald-100 text-emerald-700";

    case "B":
      return "bg-blue-100 text-blue-700";

    case "C":
      return "bg-yellow-100 text-yellow-700";

    case "D":
      return "bg-orange-100 text-orange-700";

    default:
      return "bg-red-100 text-red-700";
  }
}

export default function BroadsheetTable({
  snapshots,
  subjects,
  customization,
  onPreview,
}: Props) {
  const scoreFields: ScoreField[] = [];
  const pdfRef = useRef<HTMLDivElement>(null);


  const [currentSnapshot, setCurrentSnapshot] =
    useState<StudentResultSnapshot | null>(null);
const [downloading, setDownloading] = useState(false)

  const orderedSnapshots = [...snapshots].sort(
    (a, b) =>
      numericPosition(a.data.summary.classPosition) -
      numericPosition(b.data.summary.classPosition),
  );

  const snapshotMap = useMemo(() => {
    return new Map(
      orderedSnapshots.map((snapshot) => [
        snapshot.data.student.id,
        snapshot.data,
      ]),
    );
  }, [orderedSnapshots]);

  if (customization.testScores) {
    scoreFields.push(
      {
        key: "firstTest",
        label: "T1",
      },
      {
        key: "secondTest",
        label: "T2",
      },
      {
        key: "examScore",
        label: "Exam",
      },
    );
  }

  scoreFields.push({
    key: "totalScore",
    label: "Total",
  });

  if (customization.subjectAverage) {
    scoreFields.push({
      key: "subjectAverage",
      label: "Avg",
    });
  }

  if (customization.subjectPosition) {
    scoreFields.push({
      key: "subjectPosition",
      label: "Pos",
    });
  }

  scoreFields.push({
    key: "grade",
    label: "Grade",
  });

  if (customization.cumulativeAverage) {
    scoreFields.push({
      key: "cumulativeAverage",
      label: "Cum",
    });
  }

  const handleDownload = useCallback(
    async (studentId: number) => {
      const snapshot = snapshotMap.get(studentId);


      if (!snapshot) return;

      try {
        setDownloading(true);

        setCurrentSnapshot(snapshot);

        // Wait for React to render the new snapshot
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);

        if (!pdfRef.current) return;

        await downloadPdf(pdfRef.current, snapshot);
      } finally {
        setDownloading(false);
      }
    },
    [snapshotMap],
  );



  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-whit shadow-sm ">
      <table className="min-w-max border-separate border-spacing-0 text-sm w-full">
        <thead>
          <tr className="bg-emerald-700 text-white w-full">
            {/* S/N */}
            <th
              className="
        sticky left-0 z-30
        min-w-10
        border-r border-emerald-600
        px-3 py-3
        text-center
      "
            >
              S/N
            </th>

            {/* Student */}
            <th
              className="
        sticky left-16 z-30
        min-w-64
        border-r border-emerald-600
        px-4 py-3
        text-left
      "
            >
              Student
            </th>

            {/* Subject Score Columns */}

            {subjects.flatMap((subject) =>
              scoreFields.map(
                (field) =>
                  !skippedValuesList.includes(field.key) && (
                    <th
                      key={`${subject.subjectId}-${field.key}`}
                      className="
                min-w-[70px]
                border-r border-emerald-600
                px-2 py-2
                text-center
              "
                    >
                      <div className="flex flex-col leading-tight">
                        <span className="text-[11px] font-bold tracking-wide">
                          {subject.subjectCode}
                        </span>

                        <span className="mt-1 text-[10px] font-medium text-emerald-100">
                          {field.label}
                        </span>
                      </div>
                    </th>
                  ),
              ),
            )}

            {!skippedValuesList.includes("averageScore") && (
              <th
                className="
          min-w-24
          border-r border-emerald-600
          px-3 py-3
          text-center
        "
              >
                Average
              </th>
            )}

            {!skippedValuesList.includes("overallGrade") && (
              <th
                className="
          min-w-20
          border-r border-emerald-600
          px-3 py-3
          text-center
        "
              >
                Grade
              </th>
            )}

            {!skippedValuesList.includes("classPosition") && (
              <th
                className="
          min-w-24
          border-r border-emerald-600
          px-3 py-3
          text-center
        "
              >
                Position
              </th>
            )}
    
            <th
              className="
        min-w-32
        px-3 py-3
        text-center
        items-center flex flex-row gap-2
      "
            >
              <span>
                {" "}
                <Download size={18} className="w-5 h-5" />
              </span>
              <span>Print</span>
            </th>
          </tr>
        </thead>

        <tbody className="w-full">
          {orderedSnapshots.length > 0 ? (
            orderedSnapshots.map((snapshot, index) => (
              <tr
                key={snapshot.id}
                className={
                  index % 2 === 0
                    ? "bg-white hover:bg-slate-50"
                    : "bg-slate-50 hover:bg-slate-100"
                }
              >
                {/* S/N */}

                <td className="sticky left-0 z-20 border-b border-r border-slate-200 bg-inherit px-3 py-3 text-center font-semibold">
                  {index + 1}
                </td>

                {/* Student */}

                <td className="sticky left-16 z-20 border-b border-r border-slate-200 bg-inherit px-4 py-3">
                  <Link
                    href={`/results/preview/${snapshot.id}`}
                    className="flex items-center gap-3"
                  >
                    <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-emerald-100">
                      <Image
                        src={
                          snapshot.data.student.profilePicture
                            ? snapshot.data.student.profilePicture.startsWith(
                                "http",
                              )
                              ? snapshot.data.student.profilePicture
                              : `${getBackendBaseUrl(`${BASE_URL}`)}/${snapshot.data.student.profilePicture}`
                            : "/avatar.png"
                        }
                        alt={snapshot.data.student.fullName}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">
                        {snapshot.data.student.fullName}
                      </span>

                      <span className="text-xs text-slate-500">
                        {snapshot.data.student.admissionNumber}
                      </span>
                    </div>
                  </Link>
                </td>

                {/* Subjects */}

                {subjects.flatMap((masterSubject) => {
                  const studentSubject = snapshot.data.subjects.find(
                    (s: any) => s.subjectId === masterSubject.subjectId,
                  );

                  return scoreFields.map((field) => {
                    if (!studentSubject) {
                      return (
                        <td
                          key={`${snapshot.id}-${masterSubject.subjectId}-${field.key}`}
                          className="border-b border-r border-slate-200 px-2 py-3 text-center text-slate-400"
                        >
                          -
                        </td>
                      );
                    }

                    const value = (studentSubject as any)[field.key];

                    if (!skippedValuesList.includes(field.key)) {
                      return (
                        <td
                          key={`${field.key}-${studentSubject.subjectId}`}
                          className="
                          border-b
                          border-r
                          border-slate-200
                          px-2
                          py-2
                          text-center
                        "
                        >
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[10px] font-semibold text-slate-500">
                              {masterSubject.subjectCode}
                            </span>

                            <span className="mt-1 text-sm font-bold text-blue-700">
                              {formatValue(value)}
                            </span>
                          </div>
                        </td>
                      );
                    }
                  });
                })}

                {!skippedValuesList.includes("averageScore") && (
                  <td className="border-b border-r border-slate-200 px-3 py-3 text-center font-semibold">
                    {snapshot.data.summary.averageScore}%
                  </td>
                )}
                {!skippedValuesList.includes("overallGrade") && (
                  <td className="border-b border-r border-slate-200 px-3 py-3 text-center">
                    {/* Overall Grade */}
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${gradeColor(
                        snapshot.data.summary.overallGrade,
                      )}`}
                    >
                      {snapshot.data.summary.overallGrade}
                    </span>
                  </td>
                )}

                {/* Position */}

                <td className="border-b border-r border-slate-200 px-3 py-3 text-center font-semibold text-purple-700">
                  {renderPosition(snapshot.data.summary.classPosition)}
                </td>

                {/* Actions */}

                <td className="border-b border-slate-200 px-3 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onPreview(snapshot)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                      title="Preview Result"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                    disabled={downloading}
                      onClick={() => handleDownload(snapshot.data.student.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-0.4"
                      title="Download Result"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={6 + subjects.length * scoreFields.length}
                className="px-6 py-16 text-center text-slate-500"
              >
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
  

      <div className="hidden">
        {currentSnapshot && (
          <PdfContainer ref={pdfRef} snapshot={currentSnapshot} />
        )}
      </div>
    </div>
  );
}
