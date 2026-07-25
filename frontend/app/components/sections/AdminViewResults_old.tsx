"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileDown,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { apiHeaders, BASE_URL, handleResponse } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { AcademicSession, ClassType, Term } from "@/app/lib/types";
import { getOrdinal } from "@/app/services/results";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessions, sessionTerms } from "@/app/services/academics";

type ResultCell = {
  class_subject_id: number;
  subject_code: string;
  subject_name: string;
  total_score: string | number | null;
};

type BroadsheetSubject = {
  class_subject_id: number;
  subject_id: number;
  code: string;
  name: string;
};

export type BroadsheetRow = {
  student_id: number;
  student_name: string;
  admission_number: string;
  profile_picture: string;
  total_score: string | number | null;
  average_score: string | number | null;
  position: number | null;
  pdf_available: boolean;
  subjects: ResultCell[];
};

export type BroadsheetData = {
  class: {
    id: number;
    name: string;
    arm: string;
  };
  term: {
    id: number;
    name: string;
  };
  session: {
    id: number;
    name: string;
  };
  workflow: {
    id: number;
    status: string;
  };
  subjects: BroadsheetSubject[];
  rows: BroadsheetRow[];
};

const scoreFields = [{ key: "total_score", label: "Score" }] as const;

const formatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

export const saveBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function AdminViewResults() {
  const { currentTerm, user } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [broadsheet, setBroadsheet] = useState<BroadsheetData | null>(null);
  const [query, setQuery] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(currentTerm?.session?.id);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [session, setSession] = useState({
    id: currentTerm?.session.id,
    name: currentTerm?.session?.name,
    is_active: currentTerm?.session?.is_active,
  });
  const [termId, setTermId] = useState(currentTerm?.id);
  const [terms, setTerms] = useState<Term[]>([]);
  const [term, setTerm] = useState({
    id: currentTerm && currentTerm.id,
    name: currentTerm && currentTerm.name,
    is_active: currentTerm && currentTerm.is_active,
  });
  const [resultExist, setResultExist] = useState(false);

  const checkResultSheetExists = async () => {
    const url = `${BASE_URL}/results/results/results-sheets-exist/?school_class_id=${selectedClass?.id}&term_id=${termId}`;
    const res = await fetch(url, {
      headers: apiHeaders(),
    });
    const data = await res.json();
    if (res && data.class_results_exists) {
      setResultExist(!resultExist);
    }
  };

  useEffect(() => {
    if (!termId || !selectedClass) return;
    checkResultSheetExists();
  }, [termId, selectedClass, sessionId]);
  //   sessions
  useEffect(() => {
    const fetchSessions = async () => {
      const res = await getSessions();

      if (res) {
        setSessions(res.results);
      }
    };

    fetchSessions();
  }, []);
  // terms
  const fetchTerms = async (sessionId: number) => {
    if (!sessionId) return;

    setTerms([]);

    const res = await sessionTerms(sessionId);

    if (res) {
      setTerms(res.terms);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    fetchTerms(sessionId);
  }, [sessionId]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true);
        const res = await fetch(`${BASE_URL}/academics/classes/`, {
          headers: apiHeaders(),
        });
        const data = await handleResponse(res);
        setClasses(data?.results || data || []);
        setSelectedClass(data?.results[0]);
        loadBroadsheet(data?.results[0])
      } catch (err: any) {
        setError(err?.message || "Unable to load classes.");
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClasses();
  }, []);

  const filteredClasses = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return classes;

    return classes.filter((schoolClass) => {
      const classLabel = `${schoolClass.name} ${schoolClass.arm?.code || ""} ${schoolClass.arm?.name || ""}`;
      return classLabel.toLowerCase().includes(search);
    });
  }, [classes, query]);

  const loadBroadsheet = async (schoolClass: ClassType) => {
    if (!termId || !sessionId) {
      setError("No active term and session is available.");
      return;
    }

    try {
      setSelectedClass(schoolClass);
      setBroadsheet(null);
      setError("");
      setLoadingResults(true);

      const url = `${BASE_URL}/results/results/class-broadsheet/?class_id=${schoolClass.id}&term_id=${termId}&session_id=${sessionId}`;
      const res = await fetch(url, { headers: apiHeaders() });
      const data = await handleResponse(res);
      setBroadsheet(data);
    } catch (err: any) {
      setError(err?.message || "Unable to load class results.");
    } finally {
      setLoadingResults(false);
    }
  };

  const downloadClassCsv = async () => {
    if (!selectedClass || !termId || !sessionId) return;

    try {
      setDownloading("csv");
      const url = `${BASE_URL}/results/results/class-broadsheet-csv/?class_id=${selectedClass.id}&term_id=${termId}&session_id=${sessionId}`;
      const res = await fetch(url, { headers: apiHeaders() });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.detail || "Unable to download class result sheet.",
        );
      }

      const blob = await res.blob();
      const label = `${selectedClass.name}_${selectedClass.arm?.code || "class"}_${currentTerm?.name || "term"}_results.csv`;
      saveBlob(blob, label.replace(/\s+/g, "_"));
    } catch (err: any) {
      setError(err?.message || "Unable to download class result sheet.");
    } finally {
      setDownloading(null);
    }
  };

  const downloadStudentPdf = async (row: BroadsheetRow) => {
    if (!selectedClass || !termId || !sessionId) return;

    try {
      setDownloading(`student-${row.student_id}`);
      const url = `${BASE_URL}/results/results/student-pdf/?student_id=${row.student_id}&class_id=${selectedClass.id}&term_id=${termId}&session_id=${sessionId}`;
      const res = await fetch(url, { headers: apiHeaders() });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Unable to download student PDF.");
      }

      const blob = await res.blob();
      const filename = `${row.admission_number || row.student_id}_${currentTerm?.name || "result"}.pdf`;
      saveBlob(blob, filename.replace(/\s+/g, "_"));
    } catch (err: any) {
      setError(err?.message || "Unable to download student PDF.");
    } finally {
      setDownloading(null);
    }
  };

  const previewClassPdf = () => {
    if (!selectedClass || !termId || !sessionId) return;

    router.push(
      `${
        user?.role === "admin"
          ? "/admin/administration/results/class-preview"
          : "/teachers/class-preview"
      }?class_id=${selectedClass.id}&term_id=${termId}&session_id=${sessionId}`,
    );
  };

  return (
    <section className="min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-col gap-4 rounded-lg border border-emerald-100 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {user?.role === "admin" && "Administration"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              View Results
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {currentTerm
                ? `${currentTerm.session.name} / ${currentTerm.name}`
                : "Waiting for active term and session"}
            </p>
          </div>

          <button
            type="button"
            onClick={downloadClassCsv}
            disabled={!broadsheet || downloading === "csv"}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {downloading === "csv" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Download Class CSV
          </button>
        </div>
        {/* Select Session & Term */}
        <div className="grid grid-cols-1 gap-6 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm md:grid-cols-2 md:p-6 lg:p-8">
          {/* Session */}
          <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Session
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Select a Session
            </h2>

            {sessions.length > 0 ? (
              <select
                value={session?.id || ""}
                onChange={(event) => {
                  const selectedSession = sessions.find(
                    (s: AcademicSession) => s.id === Number(event.target.value),
                  );

                  if (selectedSession) {
                    setSession(selectedSession);
                    setSessionId(selectedSession.id);
                  }
                }}
                className="mt-4 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a Session</option>

                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_active ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No sessions available
              </p>
            )}

            <p className="mt-4 text-sm text-slate-500">
              {session
                ? `${session.name} / ${term?.name ?? "No term selected"}`
                : "Waiting for active session"}
            </p>
          </div>

          {/* Term */}
          <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Term
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Select a Term
            </h2>

            {terms.length > 0 ? (
              <select
                value={term?.id || ""}
                onChange={(event) => {
                  const selectedTerm = terms.find(
                    (t: Term) => t.id === Number(event.target.value),
                  );

                  if (selectedTerm) {
                    setTerm(selectedTerm);
                    setTermId(selectedTerm.id);
                  }
                }}
                className="mt-4 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a Term</option>

                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_active ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No terms available</p>
            )}

            <p className="mt-4 text-sm text-slate-500">
              {term
                ? `${term.name} - ${session?.name ?? ""}`
                : "No term selected"}
            </p>
          </div>
        </div>
        {/* =============== classes ================== */}
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h2 className="text-base font-bold text-slate-900">Classes</h2>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search classes"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              {selectedClass && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={previewClassPdf}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white text-sm"
                  >
                    All PDFs
                  </button>

                  <button
                    onClick={downloadClassCsv}
                    className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white"
                  >
                    CSV
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-[520px] space-y-2 overflow-y-auto p-3">
              {loadingClasses ? (
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading classes
                </div>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((schoolClass) => {
                  const isSelected = selectedClass?.id === schoolClass.id;
                  return (
                    <button
                      key={schoolClass.id}
                      type="button"
                      onClick={() => loadBroadsheet(schoolClass)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      <span className="block text-sm font-bold">
                        {schoolClass.name} {schoolClass.arm?.code}
                      </span>
                      <span
                        className={`mt-1 block text-xs ${
                          isSelected ? "text-emerald-50" : "text-slate-500"
                        }`}
                      >
                        {schoolClass.arm?.name || "No arm"}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  No classes found.
                </p>
              )}
            </div>
          </aside>

          <div className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {selectedClass
                    ? `${selectedClass.name} ${selectedClass.arm?.code || ""}`
                    : "Select a class"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {broadsheet
                    ? `${broadsheet.rows.length} students, ${broadsheet.subjects.length} subjects`
                    : "Approved class results will appear here."}
                </p>
              </div>

              {broadsheet && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  {broadsheet.workflow.status}
                </span>
              )}
            </div>

            {error && (
              <div className="m-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <p>{error}</p>
              </div>
            )}

            {loadingResults ? (
              <div className="flex min-h-80 items-center justify-center gap-3 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                Loading class broadsheet
              </div>
            ) : broadsheet ? (
              <div className="overflow-x-auto">
                <table className="min-w-max border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="bg-emerald-700 text-white">
                      <th
                        rowSpan={2}
                        className="stick left-0 z-20 min-w-5 border-r border-emerald-600 bg-emerald-700 px-3 py-3 text-left align-middle"
                      >
                        S/N
                      </th>
                      <th
                        rowSpan={2}
                        className="stick left-0 z-20 min-w-56 border-r border-emerald-600 bg-emerald-700 px-3 py-3 text-left align-middle"
                      >
                        Student
                      </th>

                      {broadsheet.subjects.map((subject) => (
                        <th
                          key={subject.class_subject_id}
                          colSpan={scoreFields.length}
                          className="border-r border-emerald-600 px-3 py-3 text-center font-bold"
                        >
                          {subject.code}
                        </th>
                      ))}
                      <th
                        rowSpan={2}
                        className="min-w-24 border-r border-emerald-600 px-3 py-3 text-center align-middle"
                      >
                        Total
                      </th>

                      <th
                        rowSpan={2}
                        className="min-w-24 border-r border-emerald-600 px-3 py-3 text-center align-middle"
                      >
                        Score %
                      </th>
                      <th
                        rowSpan={2}
                        className="min-w-24 border-r border-emerald-600 px-3 py-3 text-center align-middle"
                      >
                        Position
                      </th>
                      <th
                        rowSpan={2}
                        className="min-w-32 px-3 py-3 text-center align-middle"
                      >
                        PDF
                      </th>
                    </tr>
                    <tr className="bg-emerald-50 text-emerald-950">
                      {broadsheet.subjects.flatMap((subject) =>
                        scoreFields.map((field) => (
                          <th
                            key={`${subject.class_subject_id}-${field.key}`}
                            className="border-b border-r border-emerald-100 px-2 py-2 text-center text-xs font-semibold"
                          >
                            {field.label}
                          </th>
                        )),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {broadsheet.rows.length > 0 ? (
                      broadsheet.rows.map((row, rowIndex) => (
                        <tr
                          key={row.student_id}
                          className={
                            rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }
                        >
                          <td className="stick left-0 z-10 border-b border-r border-slate-200 bg-inherit px-3 py-3 font-semibold text-slate-900 ">
                            <span>{rowIndex + 1}</span>
                          </td>
                          <td className="stick left-0 z-10 border-b border-r border-slate-200 bg-inherit px-3 py-3 font-semibold text-slate-900 flex flex-row gap-2">
                            <Link
                              className="flex flex-row gap-1 text-blue-600"
                              href={`${user?.role === "admin" ? `/admin/administration/students/${row.student_id}` : `/teachers/students/${row.student_id}`}`}
                            >
                              <div className="relative w-10 h-10 rounded-full overflow-hidden border-4 border-emerald-100 shadow-md">
                                <img
                                  src={
                                    row.profile_picture
                                      ? row.profile_picture.startsWith("http")
                                        ? row.profile_picture
                                        : `${BASE_URL}${row.profile_picture}`
                                      : "/avatar.png"
                                  }
                                  className="object-cover h-10 w-10"
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <span>{row.student_name}</span>
                                <span className="text-gray-400 italic">
                                  {row.admission_number}
                                </span>
                              </div>
                            </Link>
                          </td>

                          {row.subjects.flatMap((subject) =>
                            scoreFields.map((field) => (
                              <td
                                key={`${row.student_id}-${subject.class_subject_id}-${field.key}`}
                                className="border-b border-r border-slate-200 px-2 py-3 text-center text-blue-500 font-semibold"
                              >
                                {formatValue(subject[field.key])}
                              </td>
                            )),
                          )}
                          <td className="border-b border-r border-slate-200 px-3 py-3 text-center font-semibold text-blue-700">
                            {formatValue(row.total_score)}
                          </td>
                          <td className="border-b border-r border-slate-200 px-3 py-3 text-center text-blue-700">
                            {formatValue(row.average_score)}%
                          </td>

                          <td className="border-b border-r border-slate-200 px-3 py-3 text-center text-blue-700">
                            {getOrdinal(formatValue(row.position))}
                          </td>
                          <td className="border-b border-slate-200 px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => downloadStudentPdf(row)}
                              disabled={
                                !row.pdf_available ||
                                downloading === `student-${row.student_id}`
                              }
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {downloading === `student-${row.student_id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              {row.pdf_available ? "PDF" : "Not ready"}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={
                            4 + broadsheet.subjects.length * scoreFields.length
                          }
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No result records found for this class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-80 items-center justify-center p-6 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <FileDown className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-950">
                    Choose a class to view approved results
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    The broadsheet is locked until the result workflow for the
                    selected class has been approved.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
