// components/ResultEntryTable.tsx
"use client";

import { useEffect, useState } from "react";
import {
  fetchClassEntryData,
  fetchGrades,
  fetchMaxScores,
  fetchStudents,
  getWorkFlowApprovedStatus,
  submitBulkResults,
} from "@/app/services/results";
import { useAuth } from "@/app/lib/hooks/useAuth";
import Link from "next/link";
import {toast} from "sonner"
import { useRouter } from "next/navigation";

export default function ResultEntryTable({
  subject,
  selectedClass,
  approvedStatus,
}: any) {
  const { currentTerm, user } = useAuth();
    const router = useRouter()
  const [students, setStudents] = useState<any[]>([]);
  const [maxScores, setMaxScores] = useState<any>({});
  const [grades, setGrades] = useState<any[]>([]);
  const [entries, setEntries] = useState<any>({});
  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getMaxScores = async () => {
    if (!selectedClass?.id) toast.error("selectedClass is undefined");
    const res = await fetchMaxScores(selectedClass.id);
    const maxScoresResponse = res?.results ?? null;
    maxScoresResponse &&
      maxScoresResponse.map((r: any) => {
        const maxScoresData = {
          first_test: r.first_test,
          second_test: r.second_test,
          exam: r.exam,
        };
        setMaxScores(maxScoresData);
      });
    return maxScoresResponse;
  };
  const getEntryData = async () => {
    try {
      const res =
        currentTerm &&
        (await fetchClassEntryData(
          selectedClass.id,
          subject.id,
          currentTerm.id,
        ));

      setResults(res.results || []);

      // Convert API results into entries state format
      const prefilledEntries: Record<number, any> = {};

      (res.results || []).forEach((result: any) => {
        prefilledEntries[result.student_id] = {
          first_test: Number(result.first_test),
          second_test: Number(result.second_test),
          exam_score: Number(result.exam_score),
        };
      });

      setEntries(prefilledEntries);
    } catch (error) {
      console.error("Failed to load existing results", error);
    }
  };
  useEffect(() => {
    if (!selectedClass || !subject) return;
    const loadData = async () => {
      try {
        const [studentsRes, gradesRes] = await Promise.all([
          fetchStudents(selectedClass.id),
          fetchGrades(),
        ]);
        const activeStudents = (studentsRes.students || []).filter(
          (student: any) => student.is_active === true,
        );
        setStudents(activeStudents);
        setGrades(gradesRes.results || []);
        await Promise.all([getMaxScores(), getEntryData()]);
      } catch (error) {
        console.error(error);
      }
    };

    loadData();
  }, [selectedClass?.id, subject?.id]);

  const updateEntry = (studentId: number, field: string, value: number) => {
    let maxValue = 0;

    if (field === "first_test") {
      maxValue = Number(maxScores.first_test || 0);
    }

    if (field === "second_test") {
      maxValue = Number(maxScores.second_test || 0);
    }

    if (field === "exam_score") {
      maxValue = Number(maxScores.exam || 0);
    }

    const errorKey = `${studentId}-${field}`;

    // Negative validation
    if (value < 0) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: "Score cannot be negative",
      }));

      return;
    }

    // Max score validation
    if (value > maxValue) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: `Maximum score is ${maxValue}`,
      }));

      return;
    }

    // Clear error
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[errorKey];
      return copy;
    });

    setEntries((prev: any) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const getTotal = (entry: any) =>
    Number(entry?.first_test || 0) +
    Number(entry?.second_test || 0) +
    Number(entry?.exam_score || 0);

  const incompleteStudents = students.filter((student) => {
    const entry = entries[student.id];

    return (
      !entry ||
      entry.first_test === undefined ||
      entry.second_test === undefined ||
      entry.exam_score === undefined
    );
  });

  const allStudentsCompleted =
    students.length > 0 && incompleteStudents.length === 0;
  const submit = async () => {
    if (approvedStatus === "Approved") {
      toast.error("Results have already been approved and cannot be modified.");
      return;
    }
    if (Object.keys(errors).length > 0) {
      toast.error("Please correct all errors before submitting.");
      return;
    }

    if (Object.keys(entries).length === 0) {
      toast.error("Please enter at least one result.");
      return;
    }

    if (!allStudentsCompleted) {
      toast.error(
        `Results are incomplete. ${incompleteStudents.length} student(s) still require score entry.`,
      );
      return;
    }

    const payload = {
      class_subject: subject.id,
      term: currentTerm?.id,
      session: currentTerm?.session.id,
      results: Object.entries(entries).map(([student, data]: any) => ({
        student: Number(student),
        ...data,
      })),
    };

    try {
      await submitBulkResults(payload);

      toast.success("Results saved successfully");
      getEntryData();

      setErrors({});
    } catch (error) {
      console.log(error);
      toast.error("Failed to save results");
    }
  };

  
  const isDisabled =
    Object.keys(errors).length > 0 ||
    !allStudentsCompleted ||
    approvedStatus === "Approved" || approvedStatus === "Released";



  return (
    <div className="p-2 m-0 bg-white rounded-xl shadow-md overflow-hidden w-full">
      {/* HEADER */}

      {Object.keys(errors).length > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-700">
            Please correct the highlighted scores before submitting.
          </p>

          <p className="text-sm text-red-600 mt-1">
            {Object.keys(errors).length} validation error(s) found.
          </p>
        </div>
      )}
      {!allStudentsCompleted && students.length > 0 && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-medium text-yellow-800">
            Results entry is incomplete.
          </p>

          <p className="text-sm text-yellow-700 mt-1">
            {incompleteStudents.length} student(s) still require scores.
          </p>
        </div>
      )}
      {/* No results */}
      {results.length === 0 && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-2">
          <p className="font-medium text-blue-800">
            No Existing results found.
          </p>

          <p className="text-sm text-blue-700 mt-1">Enter students results</p>
        </div>
      )}
      {/* existing results */}
      {results.length > 0 && approvedStatus !== "Approved" && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-2">
          <p className="font-medium text-blue-800">Existing results found.</p>

          <p className="text-sm text-blue-700 mt-1">
            {results.length} student result(s) were loaded and can be edited.
          </p>
        </div>
      )}
      {approvedStatus === "Approved" && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-2">
          <p className="font-medium text-blue-800">Existing results found.</p>

          <p className="text-sm text-blue-700 mt-1">
            Result have been approved and can not be edited.
          </p>
        </div>
      )}
      {errors && Object.keys(errors).length > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2">
          <p className="font-medium text-red-800">
            {errors[Object.keys(errors)[0]]}
          </p>
        </div>
      )}
      {/* TABLE WRAPPER */}
      <section className="w-full overflow-x-auto border rounded-lg">
        <table className="w-full min-w-150 border-collapse text-xs sm:text-sm">
          {/* HEADER */}
          <thead className="bg-gray-100 sticky  z-10">
            <tr className="text-left text-gray-700">
              <th className="p-2 border whitespace-nowrap">Student</th>
              <th className="p-2 border text-center whitespace-nowrap">
                1st Test
              </th>
              <th className="p-2 border text-center whitespace-nowrap">
                2nd Test
              </th>
              <th className="p-2 border text-center whitespace-nowrap">Exam</th>
              <th className="p-2 border text-center whitespace-nowrap">
                Total
              </th>
              <th className="p-2 border text-center whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="w-full">
            {students ? (
              students.map((s, index) => {
                const entry = entries[s.id] || {};
                const total = getTotal(entry);
                const isIncomplete =
                  !entry ||
                  entry.first_test === undefined ||
                  entry.second_test === undefined ||
                  entry.exam_score === undefined;

                return (
                  <tr
                    key={s.id}
                    className={`border-b transition text-xs sm:text-sm ${
                      isIncomplete
                        ? "bg-amber-50"
                        : index % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50"
                    } hover:bg-blue-50`}
                  >
                    {/* STUDENT */}

                    <td className="p-2 sp-3 border text-gray-800">
                      <Link
                        href={`${user?.role === "admin" ? `/admin/administration/students/${s.id}` : `/teachers/students/${s.id}`}`}
                        className="flex items-center gap-2 sm:gap-3"
                      >
                        <img
                          src={s.user.profile_picture || "/avatar.png"}
                          alt={s.user.full_name}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border"
                        />

                        <div className="flex flex-col leading-tight">
                          <span className="font-medium text-gray-800 text-xs sm:text-sm">
                            {s.user.full_name}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            {s.admission_number}
                          </span>
                        </div>
                      </Link>
                    </td>

                    {/* FIRST TEST */}
                    <td className="p-1 sm:p-2 border text-center">
                      <input
                        type="number"
                        min={0}
                        max={maxScores.first_test}
                        disabled={
                          approvedStatus === "Approved" ||
                          approvedStatus === "Released"
                        }
                        value={entry.first_test ?? ""}
                        className={`w-14 sm:w-20 px-1 sm:px-2 py-1 border rounded text-center text-xs sm:text-sm ${
                          errors[`${s.id}-first_test`]
                            ? "border-red-500 bg-red-50"
                            : ""
                        } 
                        ${
                          approvedStatus === "Approved"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }
                        `}
                        onChange={(e) =>
                          updateEntry(
                            s.id,
                            "first_test",
                            Number(e.target.value),
                          )
                        }
                      />
                    </td>

                    {/* SECOND TEST */}
                    <td className="p-1 sm:p-2 border text-center">
                      <input
                        type="number"
                        min={0}
                        max={maxScores.second_test}
                        disabled={
                          approvedStatus === "Approved" ||
                          approvedStatus === "Released"
                        }
                        value={entry.second_test ?? ""}
                        className={`w-14 sm:w-20 px-1 sm:px-2 py-1 border rounded text-center text-xs sm:text-sm ${
                          errors[`${s.id}-second_test`]
                            ? "border-red-500 bg-red-50"
                            : ""
                        } ${
                          approvedStatus === "Approved"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        onChange={(e) =>
                          updateEntry(
                            s.id,
                            "second_test",
                            Number(e.target.value),
                          )
                        }
                      />
                    </td>

                    {/* EXAM */}
                    <td className="p-1 sm:p-2 border text-center">
                      <input
                        type="number"
                        min={0}
                        max={maxScores.exam}
                        disabled={
                          approvedStatus === "Approved" ||
                          approvedStatus === "Released"
                        }
                        value={entry.exam_score ?? ""}
                        className={`w-14 sm:w-20 px-1 sm:px-2 py-1 border rounded text-center text-xs sm:text-sm ${
                          errors[`${s.id}-exam_score`]
                            ? "border-red-500 bg-red-50"
                            : ""
                        } ${
                          approvedStatus === "Approved"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                        onChange={(e) =>
                          updateEntry(
                            s.id,
                            "exam_score",
                            Number(e.target.value),
                          )
                        }
                      />
                    </td>

                    {/* TOTAL */}
                    <td className="p-2 border text-center font-semibold text-gray-700">
                      {total}
                    </td>

                    {/* STATUS */}
                    <td className="p-2 border text-center">
                      {isIncomplete ? (
                        <span className="text-[10px] sm:text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                          Incomplete
                        </span>
                      ) : (
                        <span className="text-[10px] sm:text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                          Done
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No students found for this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      {/* SUBMIT BUTTON */}
      <div className="mt-4 flex flex-col justify-end gap-3 p-2 sm:flex-row sm:items-center lg:p-1">
        <button
          onClick={() =>
            router.push(
              user?.role === "admin"
                ? "/admin/administration/comments"
                : "/teachers/comments",
            )
          }
          className="inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-white px-5 py-2 font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50 hover:border-emerald-700 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          Term Comments
        </button>

        <button
          onClick={submit}
          disabled={isDisabled}
          className={`inline-flex items-center justify-center rounded-lg px-6 py-2 font-medium text-white shadow transition sm:min-w-[180px] ${
            isDisabled
              ? "cursor-not-allowed bg-gray-400"
              : "bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          }`}
        >
          {approvedStatus === "Approved"
            ? "Results Approved"
            : "Submit Results"}
        </button>
      </div>
    </div>
  );
}
