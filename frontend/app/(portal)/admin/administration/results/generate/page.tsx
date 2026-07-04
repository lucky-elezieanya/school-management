"use client";

import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useEffect, useState } from "react";

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  PlayCircle,
  Loader2,
  Activity,
  Terminal,
} from "lucide-react";

type Status = "idle" | "queued" | "processing" | "done" | "failed";

export default function GenerateResultsPage() {
  const { currentTerm } = useAuth();

  const [status, setStatus] = useState<Status>("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const [checks, setChecks] = useState({
    behaviours: false,
    attendance: false,
    schoolAssets: false,
    classFees: false,
    resumption: false,
    comments: false,
    grades: false,
    class_teacher_signatures: false,
    head_teacher_signature: false
  });

  // --------------------------------------------------
  // PRECHECK
  // --------------------------------------------------
  useEffect(() => {
    if (!currentTerm) return;

    const fetchChecks = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/results/result-pdfs/precheck/?term_id=${currentTerm.id}&session_id=${currentTerm.session.id}`,
          {
            headers: apiHeaders(),
          },
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
            head_teacher_signature: data.head_teacher_signature
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchChecks();
  }, [currentTerm]);

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

  // --------------------------------------------------
  // GENERATE
  // --------------------------------------------------
  const generate = async () => {
    setStatus("queued");
    setLogs((p) => [...p, "🚀 Starting PDF generation..."]);

    try {
      const payload = {
        term_id: currentTerm?.id,
        session_id: currentTerm?.session.id,
      };
      const res = await fetch(`${BASE_URL}/results/result-pdfs/generate/`, {
        method: "POST",
        headers: { ...apiHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setTaskId(data.task_id);

      setLogs((p) => [...p, `📦 Task queued: ${data.task_id}`]);
    } catch (err) {
      setStatus("failed");
      setLogs((p) => [...p, "❌ Failed to start task"]);
    }
  };

  // --------------------------------------------------
  // POLLING
  // --------------------------------------------------
  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/results/result-pdfs/status/?task_id=${taskId}`,
          {
            headers: apiHeaders(),
          },
        );

        const data = await res.json();

        setLogs((p) => [...p, `📡 ${data.state}`]);

        if (data.state === "PROGRESS") setStatus("processing");

        if (data.state === "SUCCESS") {
          setStatus("done");
          setLogs((p) => [...p, "✅ Completed"]);
          clearInterval(interval);
        }

        if (data.state === "FAILURE") {
          setStatus("failed");
          setLogs((p) => [...p, "❌ Failed"]);
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [taskId]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Generate Result PDFs</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Batch generation for all students (background processing)
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
          <Check label="Class Teacher Signatures" ok={checks.class_teacher_signatures} />
          <Check label="Head Teacher Signatures" ok={checks.head_teacher_signature} />


          {!allReady && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm mt-3">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              Some required setup data is missing. Generation is disabled.
            </div>
          )}
        </div>

        {/* BUTTON */}
        <button
          onClick={generate}
          disabled={!allReady || status === "processing"}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition
            ${
              !allReady || status === "processing"
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
        >
          {status === "processing" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" />
              Generate PDFs
            </>
          )}
        </button>

        {/* LOGS */}
        <div className="bg-gray-900 text-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <h3 className="font-medium">Task Logs</h3>
          </div>

          <div className="max-h-60 overflow-y-auto text-xs space-y-1">
            {logs.map((l, i) => (
              <div key={i} className="opacity-90">
                {l}
              </div>
            ))}
          </div>
        </div>
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
        <span className="flex items-center gap-1 text-green-600 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Ready
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-500 text-sm">
          <XCircle className="w-4 h-4" />
          Missing
        </span>
      )}
    </div>
  );
}
