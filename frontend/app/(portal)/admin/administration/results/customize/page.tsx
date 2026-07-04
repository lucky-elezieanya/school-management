"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { toast } from "sonner";

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

  const termId = currentTerm?.id;
  const sessionId = currentTerm?.session?.id;

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

  useEffect(() => {
    if (!termId || !sessionId) {
      setLoading(false);
      return;
    }

    fetchSettings();
  }, [termId, sessionId]);

  async function fetchSettings() {
    try {
      setLoading(true);

      const response = await fetch(
        `${BASE_URL}/results/customize/?session=${sessionId}&term=${termId}`,
        {
          method: "GET",
          headers: apiHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customization settings.");
      }

      const data: ResultCustomizationResponse = await response.json();

      const { session, term, updated_at, ...customization } = data;

      setSettings(customization);
      setOriginalSettings(customization);
    } catch (err) {
      console.error(err);
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

    try {
      setSaving(true);
      const response = await fetch(`${BASE_URL}/results/customize/`, {
        method: "POST",
        headers: { ...apiHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sessionId,
          term: termId,
          ...settings,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save customization.");
      }

      const dataResponse = await response.json();
      const { session, term, updated_at, ...customization } = dataResponse;

      setOriginalSettings(customization);
      setSettings(customization);

      toast.success("Customization updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save customization.");
    } finally {
      setSaving(false);
    }
  }

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
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mx-5 mb-8">
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

      <div className="mx-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-4 text-left text-sm font-semibold text-gray-700">
                #
              </th>
              <th className="w-28 px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Enable
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Feature
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Description
              </th>
            </tr>
          </thead>

          <tbody>
            {ACTIONS.map((action, index) => (
              <tr
                key={action.id}
                className="border-t border-gray-100 transition hover:bg-gray-50"
              >
                <td className="px-2 py-2 text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-5">
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
