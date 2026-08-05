"use client";

import { useEffect, useState } from "react";

import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  GraduationCap,
  Loader2,
  School,
  Send,
  Users,
} from "lucide-react";

import { apiAction, apiHeaders, BASE_URL, createAction } from "@/app/lib/api";

import { toast } from "sonner";

import { useAuth } from "@/app/lib/hooks/useAuth";

import { fetchClassEntryData } from "@/app/services/results";

import { ClassType } from "@/app/lib/types";

export default function ResultsPreview() {
  const { currentTerm } = useAuth();
  const [currentClass, setCurrentClass] = useState<ClassType | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [results, setResults] = useState<any[]>([]);

  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  const [workflow, setWorkflow] = useState<any>(null);

  const [loadingResults, setLoadingResults] = useState(false);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [allResultsSubmitted, setAllResultsSubmitted] = useState(false);
  const approved = workflow?.status === "Approved";

  const released = workflow?.status === "Released";

  const selectedClassName = currentClass
    ? `${currentClass.name} ${currentClass.arm?.code ?? ""}`
    : "No Class Selected";

  const loadAllResultsSubmitted = async () => {
    if (!currentTerm) return;
    const url = `${BASE_URL}/results/results/all-results-submitted/?term_id=${currentTerm?.id}`;
    fetch(url, {
      headers: apiHeaders(),
    })
      .then((resp) => resp.json())
      .then((res) => {
        setAllResultsSubmitted(res.all_results_submitted);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    loadAllResultsSubmitted();
  }, [currentTerm]);

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
      setSelectedClass(res?.results[0].id);
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
      if (res && res.results.length > 0) {
      setSubjects(res?.results || []);
      setSelectedSubject(res?.results[0]?.id || null)}
      else {
        toast.error("No subjects registered for this class in the current term. Please ensure subjects are assigned to the class before proceeding.");
      }
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

      toast.success("Results approved successfully");

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

      toast.success("All class results approved successfully");

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

      toast.success("Results released successfully");

      loadWorkflow(selectedClass!);
    } catch (err) {
      console.error(err);
    }
  };
  const handleUnlockEdit = async () => {
    try {
      await createAction("results", "workflow/unlock", {
        school_class_id: selectedClass,
        term_id: currentTerm?.id,
        session_id: currentTerm?.session.id,
      });

      toast.success("Results edit unlocked successfully");

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

      toast.success("All results released successfully");

      loadWorkflow(selectedClass!);
    } catch (err) {
      console.error(err);
    }
  };
  const handleUnlockEditAll = async () => {
    try {
      await createAction("results", "workflow/unlock-all", {
        term_id: currentTerm?.id,
        session_id: currentTerm?.session.id,
      });

      toast.success("All results edit unlocked successfully");

      loadWorkflow(selectedClass!);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* ====================================================== */}
        {/* PAGE HEADER */}
        {/* ====================================================== */}
        <div className="rounded-2xl border bg-white p-7 shadow-sm ">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="md:w-1/2">
              <h1 className="text-3xl font-bold text-slate-900">
                Results Approval & Release
              </h1>

              <p className="mt-2 text-slate-500 max-w-2xl">
                Preview submitted student results before approving and releasing
                them to the student portal.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl border bg-slate-50 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Current Term
                </p>

                <p className="font-semibold text-slate-800">
                  {currentTerm?.name}
                </p>
              </div>

              <div className="rounded-xl border bg-slate-50 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Selected Class
                </p>

                <p className="font-semibold text-slate-800">
                  {selectedClassName}
                </p>
              </div>

              <div className="rounded-xl border bg-slate-50 px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Status
                </p>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold
                  ${
                    released
                      ? "bg-blue-100 text-blue-700"
                      : approved
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {workflow?.status || "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* ====================================================== */}
        {/* DASHBOARD CARDS */}
        {/* ====================================================== */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Classes</p>

                <p className="mt-2 text-3xl font-bold">{classes.length}</p>
              </div>

              <div className="rounded-xl bg-emerald-100 p-3">
                <School className="h-7 w-7 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Subjects</p>

                <p className="mt-2 text-3xl font-bold">{subjects.length}</p>
              </div>

              <div className="rounded-xl bg-indigo-100 p-3">
                <GraduationCap className="h-7 w-7 text-indigo-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Students</p>

                <p className="mt-2 text-3xl font-bold">{results.length}</p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3">
                <Users className="h-7 w-7 text-orange-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Status</p>

                <p className="mt-2 text-lg font-bold">
                  {workflow?.status || "Pending"}
                </p>
              </div>

              <div className="rounded-xl bg-blue-100 p-3">
                <ClipboardCheck className="h-7 w-7 text-blue-700" />
              </div>
            </div>
          </div>
        </div>
        {/* =========================================== */}
        {/* ACTIONS */}
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
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleApprove}
              disabled={
                workflow?.status === "Approved" ||
                workflow?.status === "Released" ||
                !allResultsSubmitted
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white transition hover:bg-emerald-700 disabled:bg-gray-300"
            >
              <CheckCircle2 size={18} />
              Approve Class
            </button>

            <button
              onClick={handleApproveAll}
              disabled={
                workflow?.status === "Approved" ||
                workflow?.status === "Released" ||
                !allResultsSubmitted
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-white hover:bg-emerald-800 disabled:bg-gray-300"
            >
              <ClipboardCheck size={18} />
              Approve All
            </button>

            <button
              onClick={handleRelease}
              disabled={workflow?.status !== "Approved" || !allResultsSubmitted}
              className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-white hover:bg-blue-800 disabled:bg-gray-300"
            >
              <Send size={18} />
              Release Class
            </button>

            <button
              onClick={handleReleaseAll}
              disabled={workflow?.status !== "Approved" || !allResultsSubmitted}
              className="flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-white hover:bg-indigo-800 disabled:bg-gray-300"
            >
              <Send size={18} />
              Release All
            </button>
            <button
              onClick={handleUnlockEdit}
              className="flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-white hover:bg-indigo-800 disabled:bg-gray-300"
            >
              <Send size={18} />
              Unlock Results Edit
            </button>
            <button
              onClick={handleUnlockEditAll}
              //   disabled={!allResultsSubmitted}
              className="flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-white hover:bg-indigo-800 disabled:bg-gray-300"
            >
              <Send size={18} />
              Unlock All Results Edit
            </button>
          </div>
        </div>
        {/* ====================================== */}
        {/* MAIN CONTENT */}
        {/* =================================== */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* ==================== CLASSES ==================== */}
          <div className="col-span-12 lg:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-slate-50 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Classes</h2>

              <p className="mt-1 text-sm text-slate-500">Select a class</p>
            </div>

            <div className="p-4 space-y-2 max-h-[650px] overflow-y-auto">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClass(cls.id);
                    setSelectedSubject(null);
                    setCurrentClass(cls);
                    setResults([]);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                    selectedClass === cls.id
                      ? "border-emerald-600 bg-emerald-600 text-white shadow"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  <p className="font-semibold text-sm">{cls.name}</p>

                  <p
                    className={`text-xs ${
                      selectedClass === cls.id
                        ? "text-emerald-100"
                        : "text-slate-500"
                    }`}
                  >
                    {cls.arm.code}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ==================== SUBJECTS ==================== */}
          <div className="col-span-12 lg:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-slate-50 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Subjects</h2>

              <p className="mt-1 text-sm text-slate-500">Select a subject</p>
            </div>

            <div className="p-4 max-h-[650px] overflow-y-auto">
              {loadingSubjects ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : subjects.length > 0 ? (
                <div className="space-y-2">
                  {subjects.map((sub: any) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                        selectedSubject === sub.id
                          ? "border-emerald-600 bg-emerald-600 text-white shadow"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      {sub.subject?.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-center text-sm text-slate-500">
                  Select a class to view its subjects.
                </div>
              )}
            </div>
          </div>

          {/* ==================== RESULTS ==================== */}
          <div className="col-span-12 lg:col-span-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-slate-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Results Preview
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Student scores for the selected subject.
                  </p>
                </div>

                {workflow && (
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      workflow.status === "Released"
                        ? "bg-blue-100 text-blue-700"
                        : workflow.status === "Approved"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {workflow.status}
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingResults ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b">
                      <th className="px-5 py-3 text-left font-semibold text-slate-700">
                        Student
                      </th>

                      <th className="px-3 py-3 text-center font-semibold">
                        1st
                      </th>

                      <th className="px-3 py-3 text-center font-semibold">
                        2nd
                      </th>

                      <th className="px-3 py-3 text-center font-semibold">
                        Exam
                      </th>

                      <th className="px-3 py-3 text-center font-semibold">
                        Total
                      </th>

                      <th className="px-3 py-3 text-center font-semibold">
                        Grade
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {results.length > 0 ? (
                      results.map((r: any) => (
                        <tr
                          key={r.result_id}
                          className="border-b transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={r.profile_picture || "/avatar.png"}
                                alt={r.student_name}
                                className="h-10 w-10 rounded-full border object-cover"
                              />

                              <div>
                                <p className="font-medium text-slate-800">
                                  {r.student_name}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {r.admission_number}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="text-center">{r.first_test}</td>
                          <td className="text-center">{r.second_test}</td>
                          <td className="text-center">{r.exam_score}</td>

                          <td className="text-center font-semibold">
                            {r.total_score}
                          </td>

                          <td className="text-center font-semibold">
                            {r.grade}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-20 text-center text-slate-500"
                        >
                          No results available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
