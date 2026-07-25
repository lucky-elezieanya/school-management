"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, RefreshCcw } from "lucide-react";

import { apiHeaders, BASE_URL } from "@/app/lib/api";
import BroadsheetTable from "./BroadsheetTable";
import { StudentResultSnapshot } from "@/app/types/result-snapshot";

interface SubjectSnapshot {
  subjectId: number;
  subjectCode: string;
  subjectName: string;

  firstTest: string | null;
  secondTest: string | null;
  examScore: string | null;

  totalScore: string;
  subjectAverage: string;
  cumulativeAverage: string;
  subjectPosition: string;
  grade: string;
}

interface StudentSummary {
  totalScore: string;
  averageScore: string;
  overallGrade: string;
  classPosition: string;
  totalSubjects: number;
  totalObtainableScore: number;
}

interface StudentData {
  id: number;
  fullName: string;
  admissionNumber: string;
  profilePicture: string | null;
  gender: string;
}

interface Customization {
  testScores: boolean;
  subjectAverage: boolean;
  subjectPosition: boolean;
  cumulativeAverage: boolean;
}

export interface ResultSnapshot {
  id: number;

  student: number;
  school_class: number;
  session: number;
  term: number;

  status: string;

  data: {
    student: StudentData;

    summary: StudentSummary;

    customization: Customization;

    subjects: SubjectSnapshot[];
  };
}

interface ApiResponse {
  count: number;

  next: string | null;

  previous: string | null;

  results: ResultSnapshot[];
}

interface Props {
  schoolClass: number;

  session: number;

  term: number;
}

export default function ResultBroadsheet({
  schoolClass,

  session,

  term,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [snapshots, setSnapshots] = useState<any[]>([]);

  const fetchSnapshots = async () => {
    if (!schoolClass || !session || !term) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BASE_URL}/results/result-snapshots/?school_class=${schoolClass}&session=${session}&term=${term}`,
        {
          method: "GET",
          headers: apiHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Unable to load broadsheet.");
      }

      const data: any = await response.json();

      // sort by class position
      const sorted = [...data.results].sort((a, b) => {
        const aPos = parseInt(
          a.data.summary.classPosition.replace(/\D/g, "") || "999",
        );

        const bPos = parseInt(
          b.data.summary.classPosition.replace(/\D/g, "") || "999",
        );

        return aPos - bPos;
      });

      setSnapshots(sorted);
    } catch (err) {
      console.error(err);

      setError("Unable to fetch result snapshots.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [schoolClass, session, term]);

  const subjects = useMemo(() => {
    if (!snapshots.length) return [];

    return snapshots[0].data.subjects;
  }, [snapshots]);

  /**
   * Customization
   */

  const customization = useMemo(() => {
    if (!snapshots.length)
      return {
        testScores: true,
        subjectAverage: true,
        subjectPosition: true,
        cumulativeAverage: true,
      };

    return snapshots[0].data.customization;
  }, [snapshots]);

  /**
   * Preview Result
   */

  const previewStudent = (snapshot: ResultSnapshot) => {
    router.push(`/results/preview/${snapshot.id}`);
  };


  const retry = () => {
    fetchSnapshots();
  };

  /**
   * Loading
   */

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />

          <p className="text-sm text-slate-500">Loading Broadsheet...</p>
        </div>
      </div>
    );
  }

  /**
   * Error
   */

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-red-600" />

          <h2 className="text-lg font-bold text-red-700">
            Something went wrong
          </h2>

          <p className="text-sm text-red-500">{error}</p>

          <button
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }
  /**
   * Empty State
   */

  if (!snapshots.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-900">
            No Results Found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            There are no approved result snapshots for this class, session and
            term.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Render
   */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Class Broadsheet
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing results generated from Result Snapshots.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Students
              </p>

              <p className="text-lg font-bold text-emerald-700">
                {snapshots.length}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Subjects
              </p>

              <p className="text-lg font-bold text-blue-700">
                {subjects.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full">
        {/* Broadsheet */}
        <BroadsheetTable
          snapshots={snapshots}
          subjects={subjects}
          customization={customization}
          onPreview={previewStudent}
        />
      </div>
    </div>
  );
}
