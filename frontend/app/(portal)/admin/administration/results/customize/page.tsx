"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { toast } from "sonner";
import {
  getClasses,
  getSessions,
  sessionTerms,
} from "@/app/services/academics";
import { AcademicSession, Term } from "@/app/lib/types";

type CustomOption = {
  id: keyof ResultCustomization;
  name: string;
  description: string;
};

type ResultCustomization = {
  subject_average: boolean;
  class_average: boolean;
  subject_position: boolean;
  class_size: boolean;
  subject_score: boolean;
  cumulative_average: boolean;
  class_position: boolean;
  highest_lowest_scores: boolean;
  overall_grade: boolean;
  test_scores: boolean;
  show_teacher_comment: boolean;
  show_principal_comment: boolean;
  show_behaviour: boolean;
  show_attendance: boolean;
  show_school_days: boolean;
  show_class_fees: boolean;
  show_grading_scale: boolean;
  show_performance_chart: boolean;
};

type ResultCustomizationResponse = ResultCustomization & {
  session: number;
  term: number;
  updated_at: string;
};

const ACTIONS: CustomOption[] = [
  {
    id: "subject_average",
    name: "Subject Average",
    description: "Display the average score for each subject.",
  },
  {
    id: "class_average",
    name: "Class Average",
    description: "Display the average score for the entire class.",
  },
  {
    id: "subject_position",
    name: "Subject Position",
    description: "Display the student's position in each subject.",
  },
  {
    id: "class_size",
    name: "Class Size",
    description: "Display the total number of students in the class.",
  },
  {
    id: "subject_score",
    name: "Subject Score",
    description: "Display the student's score for each subject.",
  },
  {
    id: "cumulative_average",
    name: "Cumulative Average",
    description:
      "Display cumulative averages across previous terms where applicable.",
  },
  {
    id: "class_position",
    name: "Class Position",
    description: "Display the student's overall class position.",
  },
  {
    id: "highest_lowest_scores",
    name: "Highest & Lowest Scores",
    description:
      "Display the highest and lowest scores obtained in each subject.",
  },
  {
    id: "overall_grade",
    name: "Overall Grade",
    description: "Display the student's overall grade.",
  },
  {
    id: "test_scores",
    name: "Show Test Scores",
    description: "Display Continuous Assessment/Test scores.",
  },
  {
    id: "show_teacher_comment",
    name: "Show Teacher Comment",
    description: "Display the teacher's comment for each subject.",
  },
  {
    id: "show_principal_comment",
    name: "Show Principal Comment",
    description: "Display the principal's comment for each subject.",
  },
  {
    id: "show_behaviour",
    name: "Show Behaviour",
    description: "Display the student's behavioural assessment.",
  },
  {
    id: "show_attendance",
    name: "Show Attendance",
    description: "Display the student's attendance record.",
  },
  {
    id: "show_school_days",
    name: "Show School Days",
    description: "Display the number of school days.",
  },
  {
    id: "show_class_fees",
    name: "Show Class Fees",
    description: "Display the class fees information.",
  },
  {
    id: "show_grading_scale",
    name: "Show Grading Scale",
    description: "Display the grading scale used.",
  },
  {
    id: "show_performance_chart",
    name: "Show Performance Chart",
    description: "Display a chart showing the student's performance.",
  },
];

export default function Customize() {
  const { currentTerm } = useAuth();

  const defaultSettings = useMemo<ResultCustomization>(
    () => ({
      subject_average: true,
      class_average: true,
      subject_position: true,
      class_size: true,
      subject_score: true,
      cumulative_average: true,
      class_position: true,
      highest_lowest_scores: true,
      overall_grade: true,
      test_scores: true,
      show_teacher_comment: true,
      show_principal_comment: true,
      show_behaviour: true,
      show_attendance: true,
      show_school_days: true,
      show_class_fees: true,
      show_grading_scale: false,
      show_performance_chart: true,
    }),
    [],
  );

  const [settings, setSettings] =
    useState<ResultCustomization>(defaultSettings);

  const [originalSettings, setOriginalSettings] =
    useState<ResultCustomization>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);

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

  useEffect(() => {
    const fetchSessions = async () => {
      const res = await getSessions();

      if (res) {
        setSessions(res.results);
      }
    };

    fetchSessions();
  }, []);

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

  // =========================
  // LOAD CLASSES (UNCHANGED)
  // =========================
  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await getClasses();
      setClasses(res?.results || res || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingClasses(false);
    }
  };
  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (!sessionId || !termId) {
      setLoading(false);
      return;
    }

    fetchSettings();
  }, [sessionId, termId, selectedClass]);

async function fetchSettings() {
  if (!sessionId || !termId) return;

  try {
    setLoading(true);

    const url = new URL(`${BASE_URL}/results/customize/`);

    url.searchParams.set("session", String(sessionId));
    url.searchParams.set("term", String(termId));

    if (selectedClass) {
      url.searchParams.set("school_class_id", String(selectedClass));
    }

    const response = await fetch(url.toString(), {
      headers: apiHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch customization.");
    }

    const data: ResultCustomizationResponse = await response.json();

    const { session, term, updated_at, ...customization } = data;

    setSettings(customization);
    setOriginalSettings(customization);
  } catch (error) {
    console.error(error);
    toast.error("Unable to load customization.");
  } finally {
    setLoading(false);
  }
}

  function toggleSetting(key: keyof ResultCustomization) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function resetSettings() {
    setSettings(originalSettings);
  }

  async function saveSettings() {
    if (!termId || !sessionId) return;
    let payload;
    if (selectedClass) {
      payload = {
        session: sessionId,
        term: termId,
        school_class_id: selectedClass,
        ...settings,
      };
    } else {
      payload = {
        session: sessionId,
        term: termId,
        ...settings,
      };
    }
    try {
      setSaving(true);
      const response = await fetch(`${BASE_URL}/results/customize/`, {
        method: "POST",
        headers: { ...apiHeaders(), "Content-Type": "application/json" },

        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save customization.");
      }

      const dataResponse = await response.json();
      const { session, term, updated_at, ...customization } = dataResponse;

      setOriginalSettings(customization);
      setSettings(customization);
      fetchSettings()

      toast.success("Customization updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save customization.");
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // CLASS SELECT (checkbox UI)
  // =========================
  const handleClassSelect = async (classId: string) => {
    const newClass = selectedClass === classId ? "" : classId;

    setSelectedClass(newClass);
  };

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (!currentTerm) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-500">
          No active academic term has been configured.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto pb-10">
      <div className="mx-5 mb-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Customize Result Sheet
        </h1>

        <p className="text-gray-600 mt-2">
          Select the information that should appear on generated student report
          cards for the current academic term.
        </p>

        <div className="mt-4 inline-flex items-center rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          <span className="font-semibold mr-2">Current Term:</span>
          {currentTerm.name}
        </div>
      </div>
      {/* =========================== session and term selection ============================= */}
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
            <p className="mt-4 text-sm text-slate-500">No sessions available</p>
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
      <div className="mx-5 overflow-hidden flex gap-4 rounded-xl border border-gray-200 bg-white shadow-sm w-full">
        {/* ===================== CLASSES ===================== */}
        <div className="bg-white border w-20 rounded-xl border-r-0 p-0 md:w-1/4">
          <h2 className="font-semibold  bg-gray-50 py-4 px-2 w-full text-sm">
            Class
          </h2>

          {loadingClasses && (
            <p className="text-sm text-gray-500 mb-2">Loading classes...</p>
          )}

          <div className="space-y-2 text-sm text-center mt-4">
            {classes.map((cls: any) => (
              <label
                key={cls.id}
                className="flex flex-row gap-2 w-fit items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedClass === String(cls.id)}
                  onChange={() => handleClassSelect(String(cls.id))}
                  className="h-4 w-4 text-emerald-600"
                />

                <span className="text-sm">
                  {cls.name} {cls.arm?.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/*========= CUSTOMIZATIONS ==============*/}
        <table className="w-3/4">
          <thead className="bg-gray-50 w-full">
            <tr>
              <th className="px-1 py-4 text-center text-sm font-semibold text-gray-700">
                #
              </th>
              <th className=" px-6 py-4 text-center text-sm font-semibold text-gray-700">
                Enable
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Feature
              </th>

              <th className="px-2 py-4 text-center text-sm font-semibold text-gray-700">
                Description
              </th>
            </tr>
          </thead>

          <tbody>
            {ACTIONS.map((action, index) => (
              <tr
                key={action.id}
                className="border-t border-gray-100 transition items-center hover:bg-gray-50"
              >
                <td className="px-2 py-2 text-center justify-center fle text-sm text-gray-500">
                  <span>{index + 1}</span>
                </td>
                <td className="px-2 py-6 text-center fle justify-center">
                  <input
                    type="checkbox"
                    checked={Boolean(settings[action.id])}
                    onChange={() => toggleSetting(action.id)}
                    className="h-5 w-5 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>

                <td className="px-6 py-5 font-medium text-gray-800">
                  {action.name}
                </td>

                <td className="px-6 py-5 text-sm text-gray-500">
                  {action.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mx-5 mt-8 flex justify-end gap-4">
        <button
          type="button"
          onClick={resetSettings}
          disabled={!hasChanges}
          className="rounded-lg border border-gray-300 px-5 py-2.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={saveSettings}
          disabled={!hasChanges || saving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
