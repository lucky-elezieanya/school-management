"use client";

import { useEffect, useState } from "react";

import { apiAction, apiHeaders, BASE_URL, createAction } from "@/app/lib/api";

import { useAuth } from "@/app/lib/hooks/useAuth";
import { fetchClassEntryData } from "@/app/services/results";

export default function ResultsPreview() {
  const { currentTerm } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [results, setResults] = useState<any[]>([]);

  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  const [workflow, setWorkflow] = useState<any>(null);

  const [loadingResults, setLoadingResults] = useState(false);

  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSubjects(selectedClass);
      loadWorkflow(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadResults();
    }
  }, [selectedClass, selectedSubject]);

  const loadClasses = async () => {
    try {
      const res = await apiAction("academics", "classes");

      setClasses(res?.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubjects = async (classId: number) => {
    try {
      setLoadingSubjects(true);
      const url = `${BASE_URL}/academics/class-subjects/?school_class=${classId}&term=${currentTerm?.id}`;
      const resp = await fetch(url, {
        headers: apiHeaders(),
      });
      const res = await resp.json();
      setSubjects(res?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadResults = async () => {
    try {
      setLoadingResults(true);

      const res =
        selectedClass &&
        currentTerm &&
        selectedSubject &&
        (await fetchClassEntryData(
          selectedClass,
          selectedSubject,
          currentTerm?.id,
        ));

      setResults(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

  const loadWorkflow = async (classId: number) => {
    try {
      const url = `${BASE_URL}/results/workflow/?school_class=${classId}&term=${currentTerm?.id}&session=${currentTerm?.session?.id}`;
      const resp = await fetch(url, {
        headers: apiHeaders(),
      });
      const res = await resp.json();

      setWorkflow(res?.results?.[0] || null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    if (!currentTerm) return;
    try {
      await createAction("results", "workflow/approve", {
        school_class_id: selectedClass,
        term_id: currentTerm?.id,
        session_id: currentTerm?.session.id,
      });

      alert("Results approved successfully");

      loadWorkflow(selectedClass!);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAll = async () => {
    if (!currentTerm) return;

    try {
      await createAction("results", "workflow/approve-all", {
        term_id: currentTerm?.id,
        session_id: currentTerm?.session?.id,
      });

      alert("All class results approved successfully");

      if (selectedClass) {
        loadWorkflow(selectedClass);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRelease = async () => {
    try {
      await createAction("results", "workflow/release", {
        school_class_id: selectedClass,
        term_id: currentTerm?.id,
        session_id: currentTerm?.session.id,
      });

      alert("Results released successfully");

      loadWorkflow(selectedClass!);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseAll = async () => {
    try {
      await createAction("results", "workflow/release-all", {
       
        term_id: currentTerm?.id,
        session_id: currentTerm?.session.id,
      });

      alert("All results released successfully"); 

      loadWorkflow(selectedClass!);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* CLASSES */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-bold text-emerald-700 mb-4">Classes</h2>

          <div className="space-y-2">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClass(cls.id);
                  setSelectedSubject(null);
                  setResults([]);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                  selectedClass === cls.id
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-emerald-50"
                }`}
              >
                {cls.name} {cls.arm.code}
              </button>
            ))}
          </div>
        </div>

        {/* SUBJECTS */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-bold text-emerald-700 mb-4">Subjects</h2>

          {loadingSubjects ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-2">
              {subjects.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border ${
                    selectedSubject === sub.id
                      ? "bg-emerald-600 text-white"
                      : "hover:bg-emerald-50"
                  }`}
                >
                  {sub.subject?.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RESULTS */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="font-bold text-emerald-700">Results Preview</h2>

            {workflow && (
              <div className="mt-2 md:mt-0">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  {workflow.status}
                </span>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={handleApprove}
              disabled={
                workflow?.status === "Approved" ||
                workflow?.status === "Released"
              }
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
            >
              Approve
            </button>

            {/* ✅ NEW APPROVE ALL BUTTON */}
            <button
              onClick={handleApproveAll}
              disabled={
                workflow?.status === "Approved" ||
                workflow?.status === "Released"
              }
              className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-semibold shadow-sm"
            >
              Approve All Results
            </button>

            <button
              onClick={handleRelease}
              disabled={workflow?.status !== "Approved"}
              className="bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
            >
              Release
            </button>

            <button
              onClick={handleReleaseAll}
              disabled={workflow?.status !== "Approved"}
              className="bg-emerald-800 hover:bg-emerald-900 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
            >
              Release All Results
            </button>
          </div>

          {loadingResults ? (
            <div>Loading results...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Student</th>
                    <th>1st</th>
                    <th>2nd</th>
                    <th>Exam</th>
                    <th>Total</th>
                    <th>Grade</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((r: any) => (
                    <tr key={r.result_id} className="border-b">
                      <td className="py-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.profile_picture || "/avatar.png"}
                            alt={r.student_name}
                            className="w-10 h-10 rounded-full object-cover border shadow-sm"
                          />

                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              {r.student_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {r.admission_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{r.first_test}</td>
                      <td>{r.second_test}</td>
                      <td>{r.exam_score}</td>
                      <td>{r.total_score}</td>
                      <td>{r.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
