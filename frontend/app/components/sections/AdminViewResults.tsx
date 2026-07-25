"use client";
import { toast } from "sonner";

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

import { useRouter } from "next/navigation";
import { getSessions, sessionTerms } from "@/app/services/academics";
import ResultBroadsheet from "./Broadsheet/ResultBroadsheet";
import { StudentResultSnapshot } from "@/app/types/result-snapshot";
import { getWorkFlowApprovedStatus } from "@/app/services/results";

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
  const [snapshot, setSnapshot] = useState<StudentResultSnapshot | null>(null);
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
  const [classApprovalStatus, setClassApprovalStatus] = useState("Pending");

  const [broadsheet, setBroadsheet] = useState<BroadsheetData | null>(null);

  const getApprovalStatus = async () => {
    if (!selectedClass || !session || !term) return;
    const res = await getWorkFlowApprovedStatus(
      selectedClass?.id!,
      term.id!,
      session.id!,
    );
    console.log("Approval: ", res);
    setClassApprovalStatus(res.results.status);
  };

  useEffect(() => {
    if (!selectedClass || !session || !term) return;
    getApprovalStatus();
  }, [selectedClass, term, session]);

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
        loadSnapshot(data?.results[0]);
        loadBroadsheet(data?.results[0]);
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

  const loadSnapshot = async (schoolClass: ClassType) => {
    if (!termId || !sessionId) {
      setError("No active term and session is available.");
      return;
    }

    try {
      setSelectedClass(schoolClass);
      setSnapshot(null);
      setError("");
      setLoadingResults(true);

      const url = `${BASE_URL}/results/result-snapshots/?school_class=${schoolClass.id}&session=${session.id}&term=${term.id}`;
      const res = await fetch(url, { headers: apiHeaders() });
      const data = await handleResponse(res);
      setSnapshot(data);
      loadBroadsheet(schoolClass);
    } catch (err: any) {
      setError(err?.message || "Unable to load class results.");
    } finally {
      setLoadingResults(false);
    }
  };

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
        toast.error(data?.detail || "Unable to download class result sheet.");
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
        <div className="flex flex-col gap-4">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h2 className="text-base font-bold text-slate-900">Classes</h2>

              <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search classes"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 p-4">
              {filteredClasses.map((schoolClass) => {
                const selected = selectedClass?.id === schoolClass.id;

                return (
                  <button
                    key={schoolClass.id}
                    onClick={() => loadSnapshot(schoolClass)}
                    className={`rounded-lg border px-4 py-3 transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-200 hover:bg-emerald-50"
                    }`}
                  >
                    <div className="font-semibold">
                      {schoolClass.name} {schoolClass.arm?.code}
                    </div>

                    <div
                      className={`text-xs ${
                        selected ? "text-emerald-50" : "text-slate-500"
                      }`}
                    >
                      {schoolClass.arm?.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {selectedClass
                    ? `${selectedClass.name} ${selectedClass.arm?.code || ""}`
                    : "Select a class"}
                </h2>
              </div>

              {snapshot && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  {classApprovalStatus}
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
            ) : snapshot ? (
              selectedClass &&
              session &&
              term && (
                <ResultBroadsheet
                  schoolClass={selectedClass.id}
                  session={session.id!}
                  term={term.id!}
                />
              )
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
          </section>
        </div>
      </div>
    </section>
  );
}
