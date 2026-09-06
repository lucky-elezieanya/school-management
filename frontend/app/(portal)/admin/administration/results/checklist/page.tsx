"use client";

import { toast } from "sonner";
import { apiHeaders, BASE_URL, handleResponse } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  PlayCircle,
  Loader2,
  Activity,
  X,
} from "lucide-react";
import { getSessions, sessionTerms } from "@/app/services/academics";
import { AcademicSession, ClassType, Term } from "@/app/lib/types";

type Status = "Computing" | "Done" | "Failed" | "idle";

export default function GenerateResultsPage() {
  const { currentTerm } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<Status>("idle");
  const [sessionId, setSessionId] = useState<number | undefined>(
    currentTerm?.session?.id
  );
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [session, setSession] = useState<{
    id?: number;
    name?: string;
    is_active?: boolean;
  }>({
    id: currentTerm?.session?.id,
    name: currentTerm?.session?.name,
    is_active: currentTerm?.session?.is_active,
  });

  const [termId, setTermId] = useState<number | undefined>(currentTerm?.id);
  const [terms, setTerms] = useState<Term[]>([]);
  const [term, setTerm] = useState<{
    id?: number;
    name?: string;
    is_active?: boolean;
  }>({
    id: currentTerm?.id,
    name: currentTerm?.name,
    is_active: currentTerm?.is_active,
  });

  const [query, setQuery] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [error, setError] = useState("");
  const [checks, setChecks] = useState({
    behaviours: false,
    attendance: false,
    schoolAssets: false,
    classFees: false,
    resumption: false,
    comments: false,
    grades: false,
    class_teacher_signatures: false,
    head_teacher_signature: false,
  });

  // Sync initial term/session if user context populates later
  useEffect(() => {
    if (currentTerm && !sessionId) {
      setSessionId(currentTerm.session?.id);
      setSession(currentTerm.session);
    }
    if (currentTerm && !termId) {
      setTermId(currentTerm.id);
      setTerm(currentTerm);
    }
  }, [currentTerm]);

  // Fetch terms when session changes
  useEffect(() => {
    if (!sessionId) return;
    fetchTerms(sessionId);
  }, [sessionId]);

  // Precheck execution
  const fetchChecks = async () => {
    if (!sessionId || !termId) return;

    try {
      const params = new URLSearchParams({
        term_id: String(termId),
        session_id: String(sessionId),
      });

      if (selectedClass?.id) {
        params.set("class_id", String(selectedClass.id));
      }

      const res = await fetch(
        `${BASE_URL}/results/results/precheck/?${params.toString()}`,
        {
          headers: apiHeaders(),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setChecks({
          behaviours: data.behaviours,
          attendance: data.attendance,
          schoolAssets: data.school_assets,
          classFees: data.class_fees,
          resumption: data.resumption_date,
          comments: data.comments,
          grades: data.grades,
          class_teacher_signatures: data.class_teacher_signatures,
          head_teacher_signature: data.head_teacher_signature,
        });
      }
    } catch (err) {
      console.error("Failed to run prechecks:", err);
    }
  };

  useEffect(() => {
    fetchChecks();
  }, [sessionId, termId, selectedClass]);

  const allReady =
    checks.behaviours &&
    checks.attendance &&
    checks.schoolAssets &&
    checks.classFees &&
    checks.resumption &&
    checks.comments &&
    checks.grades &&
    checks.class_teacher_signatures &&
    checks.head_teacher_signature;

  // Fetch academic sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await getSessions();
        if (res?.results) {
          setSessions(res.results);
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    };

    fetchSessions();
  }, []);

  // Fetch terms for selected session
  const fetchTerms = async (sId: number) => {
    if (!sId) return;
    setTerms([]);

    try {
      const res = await sessionTerms(sId);
      if (res?.terms) {
        setTerms(res.terms);
      }
    } catch (err) {
      console.error("Failed to load terms:", err);
    }
  };

  // Fetch classes
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true);
        const res = await fetch(`${BASE_URL}/academics/classes/`, {
          headers: apiHeaders(),
        });
        const data = await handleResponse(res);
        setClasses(data?.results || data || []);
      } catch (err: any) {
        setError(err?.message || "Unable to load classes.");
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClasses();
  }, []);

  // URL sync for selected class
  useEffect(() => {
    if (!classes.length) return;

    const classId = searchParams.get("class_id");
    if (!classId) {
      setSelectedClass(null);
      return;
    }

    const found = classes.find((c) => c.id === Number(classId));
    if (found) {
      setSelectedClass(found);
    }
  }, [classes, searchParams]);

  const filteredClasses = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return classes;

    return classes.filter((schoolClass) => {
      const classLabel = `${schoolClass.name} ${schoolClass.arm?.code || ""} ${
        schoolClass.arm?.name || ""
      }`;
      return classLabel.toLowerCase().includes(search);
    });
  }, [classes, query]);

  const handleClassSelect = (schoolClass: ClassType) => {
    const params = new URLSearchParams(searchParams.toString());

    // Toggle off if already selected
    if (selectedClass?.id === schoolClass.id) {
      setSelectedClass(null);
      params.delete("class_id");
    } else {
      setSelectedClass(schoolClass);
      params.set("class_id", String(schoolClass.id));
    }

    setError("");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearClassSelection = () => {
    setSelectedClass(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("class_id");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const compute = async () => {
    if (!termId || !sessionId) {
      toast.error("Please select a session and term first.");
      return;
    }

    setStatus("Computing");

    try {
      const payload = {
        term_id: termId,
        session_id: sessionId,
        school_class_id: selectedClass?.id || null,
      };

      const res = await fetch(`${BASE_URL}/results/results/compute/`, {
        method: "POST",
        headers: { ...apiHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("Done");
        toast.success(
          data.message ||
            `Computed results for ${data.classes?.length || 0} class(es).`
        );
      } else {
        setStatus("Failed");
        toast.error(data.detail || "Failed to compute results.");
      }
    } catch (err: any) {
      setStatus("Failed");
      toast.error("Network error: Could not trigger result calculation.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
                    (s: AcademicSession) => s.id === Number(event.target.value)
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
              {session?.name
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
                    (t: Term) => t.id === Number(event.target.value)
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
              {term?.name
                ? `${term.name} - ${session?.name ?? ""}`
                : "No term selected"}
            </p>
          </div>
        </div>

        {/* Class Selection */}
        <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Class Target
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Select a Class
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose a specific class to compute. Deselect or leave unselected to calculate for <strong>all classes</strong>.
            </p>
          </div>

          {/* Search */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search class..."
            className="mb-4 h-11 w-full rounded-lg border border-slate-300 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Loading */}
          {loadingClasses ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No matching classes found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filteredClasses.map((schoolClass) => {
                const active = selectedClass?.id === schoolClass.id;

                return (
                  <button
                    key={schoolClass.id}
                    type="button"
                    onClick={() => handleClassSelect(schoolClass)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      active
                        ? "border-blue-600 bg-blue-600 text-white shadow-md"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-semibold">{schoolClass.name}</div>

                    {schoolClass.arm && (
                      <div
                        className={`mt-1 text-xs ${
                          active ? "text-blue-100" : "text-slate-500"
                        }`}
                      >
                        {schoolClass.arm.name}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Class Indicator */}
          {selectedClass && (
            <div className="mt-5 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div>
                <p className="text-xs text-blue-700 uppercase font-semibold">Targeting Class</p>
                <h3 className="mt-0.5 font-semibold text-slate-800">
                  {selectedClass.name}
                  {selectedClass.arm && ` ${selectedClass.arm.code}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={clearClassSelection}
                className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-md font-medium transition"
              >
                <X className="w-3.5 h-3.5" /> Clear (Compute All)
              </button>
            </div>
          )}
        </div>

        {/* HEADER */}
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Compute Results</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Compute results for {selectedClass ? selectedClass.name : "all classes"} (re-calculates grading, comments, and positions).
          </p>
        </div>

        {/* PRECHECK CARD */}
        <div className="bg-white p-5 rounded-xl shadow-sm space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            System Checks
          </h3>

          <Check label="Behaviour Records" ok={checks.behaviours} />
          <Check label="Attendance Records" ok={checks.attendance} />
          <Check label="School Assets (Logo/Header)" ok={checks.schoolAssets} />
          <Check label="Class Fees" ok={checks.classFees} />
          <Check label="Resumption Date" ok={checks.resumption} />
          <Check label="Term Comment" ok={checks.comments} />
          <Check label="Grades" ok={checks.grades} />
          <Check
            label="Class Teacher Signatures"
            ok={checks.class_teacher_signatures}
          />
          <Check
            label="Head Teacher Signatures"
            ok={checks.head_teacher_signature}
          />

          {!allReady && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm mt-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Some required setup data is missing for the selected term/class. You can still force computation if needed.</span>
            </div>
          )}
        </div>

        {/* ACTION BUTTON */}
        <button
          type="button"
          onClick={compute}
          disabled={status === "Computing"}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition text-white ${
            status === "Computing"
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {status === "Computing" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Computing Results...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" />
              Compute {selectedClass ? selectedClass.name : "All Results"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// --------------------------------------------------
// CHECK COMPONENT
// --------------------------------------------------
function Check({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-gray-700">{label}</span>

      {ok ? (
        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Ready
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
          <XCircle className="w-4 h-4" />
          Missing
        </span>
      )}
    </div>
  );
}