"use client";

import { useEffect, useState } from "react";
import {
  computeAllResults,
  recomputeAllResults,
  getTaskStatus,
} from "@/app/services/results";

import { useAuth } from "@/app/lib/hooks/useAuth";
import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { apiHeaders, BASE_URL } from "@/app/lib/api";

type TaskState = "PENDING" | "PROGRESS" | "SUCCESS" | "FAILURE";

interface ClassTask {
  class_id: number;
  class_name: string;
  task_id?: string;
  status: TaskState;
  progress: number;
  message?: string;
}

export default function ComputeResultsPage() {
  const { currentTerm } = useAuth();

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassTask[]>([]);
  const [globalMessage, setGlobalMessage] = useState("");
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
  /**
   * FIRE COMPUTE TASK
   */
  const handleComputeAll = async () => {
    setLoading(true);
    setGlobalMessage("Starting computation for all classes...");

    try {
      const res =
        currentTerm &&
        (await computeAllResults({
          term_id: currentTerm.id,
          session_id: currentTerm.session.id,
        }));

      /**
       * expected backend:
       * [{class_id, task_id}]
       */

      const updated = classes.map((c) => {
        const match = res.find((r: any) => r.class_id === c.class_id);

        if (match) {
          return {
            ...c,
            task_id: match.task_id,
            status: "PROGRESS" as TaskState,
            progress: 5,
            message: "Queued...",
          };
        }

        return c;
      });

      setClasses(updated);

      setGlobalMessage("Computation started successfully");

      pollTasks(updated);
    } catch (err) {
      console.error(err);
      setGlobalMessage("Failed to start computation");
    } finally {
      setLoading(false);
    }
  };

  /**
   * RECOMPUTE
   */
  const handleRecomputeAll = async () => {
    setLoading(true);
    setGlobalMessage("Recomputing all results...");

    try {
      const res =
        currentTerm &&
        (await recomputeAllResults({
          term_id: currentTerm.id,
          session_id: currentTerm.session.id,
        }));

      const updated = classes.map((c) => {
        const match = res.find((r: any) => r.class_id === c.class_id);

        if (match) {
          return {
            ...c,
            task_id: match.task_id,
            status: "PROGRESS" as TaskState,
            progress: 5,
            message: "Recomputing...",
          };
        }

        return c;
      });

      setClasses(updated);

      pollTasks(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
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
            head_teacher_signature: data.head_teacher_signature,
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

  useEffect(() => {
    allReady && handleComputeAll();
  }, [allReady]);

  /**
   * POLLING TASK STATUS
   */
  const pollTasks = (taskList: ClassTask[]) => {
    const interval = setInterval(async () => {
      let stillRunning = false;

      const updated = await Promise.all(
        taskList.map(async (task) => {
          if (!task.task_id) return task;

          const res = await getTaskStatus(task.task_id);

          if (res.state === "PROGRESS") {
            stillRunning = true;

            return {
              ...task,
              status: "PROGRESS" as TaskState,
              progress: res.percent || 10,
              message: res.message,
            };
          }

          if (res.state === "SUCCESS") {
            return {
              ...task,
              status: "SUCCESS" as TaskState,
              progress: 100,
              message: "Completed",
            };
          }

          if (res.state === "FAILURE") {
            return {
              ...task,
              status: "FAILURE" as TaskState,
              progress: 0,
              message: "Failed",
            };
          }

          stillRunning = true;
          return task;
        }),
      );

      setClasses(updated);

      if (!stillRunning) {
        clearInterval(interval);
        setGlobalMessage("All computations completed");
      }
    }, 2000);
  };

  /**
   * UI STATUS COLOR
   */
  const getStatusColor = (status: TaskState) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-700";
      case "PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "FAILURE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-6 space-y-6">
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
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            Some required setup data is missing. Computation is disabled.
          </div>
        )}
      </div>

      {/* HEADER */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <h1 className="text-xl font-bold text-gray-800">
          Results Computation Dashboard
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Term: {currentTerm?.name} • Session: {currentTerm?.session?.name}
        </p>

        {globalMessage && (
          <div className="mt-3 text-sm text-blue-600">{globalMessage}</div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleComputeAll}
            disabled={loading || !allReady}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            Compute All Results
          </button>

          <button
            onClick={handleRecomputeAll}
            disabled={loading || !allReady}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300"
          >
            Recompute Results
          </button>
        </div>
      </div>

      {/* CLASS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => (
          <div
            key={c.class_id}
            className="bg-white border rounded-xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">{c.class_name}</h2>

              <span
                className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                  c.status,
                )}`}
              >
                {c.status}
              </span>
            </div>

            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${c.progress}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {c.message || "Waiting..."}
              </p>
            </div>
          </div>
        ))}
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
