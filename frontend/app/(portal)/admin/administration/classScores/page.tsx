"use client";

import { useEffect, useMemo, useState } from "react";
import { apiAction, BASE_URL, apiHeaders, handleResponse } from "@/app/lib/api";
import { toast } from "sonner";

import {
  ClipboardList,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type MaxScoreType = {
  id: number;
  first_test: string | number;
  second_test: string | number;
  exam: string | number;

  school_class: {
    id: number;
    name: string;
    arm?: {
      name: string;
      code: string;
    } | null;
  };
};

type ClassType = {
  id: number;
  name: string;
  arm?: {
    name: string;
    code: string;
  } | null;
};

type ScoreRow = {
  school_class_id: number;
  class_name: string;
  arm_name?: string;
  arm_code?: string;

  first_test: string;
  second_test: string;
  exam: string;

  // Whether a MaxScores record existed when the
  // page was loaded.
  configured: boolean;
};

// ============================================================
// DEFAULTS
// ============================================================

const DEFAULT_FIRST_TEST = 20;
const DEFAULT_SECOND_TEST = 20;
const DEFAULT_EXAM = 60;

const EXPECTED_TOTAL = 100;

// ============================================================
// COMPONENT
// ============================================================

export default function MaxScoresComponent() {
  const [rows, setRows] = useState<ScoreRow[]>([]);

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData = async () => {
    try {
      setFetching(true);

      const [classRes, scoreRes] = await Promise.all([
        apiAction("academics", "classes"),
        apiAction("results", "maxscores"),
      ]);

      const classes: ClassType[] = classRes?.results ?? classRes ?? [];

      const scores: MaxScoreType[] = scoreRes?.results ?? scoreRes ?? [];

      // ------------------------------------------------------
      // Map existing MaxScores by class ID
      // ------------------------------------------------------

      const scoreMap = new Map<number, MaxScoreType>();

      scores.forEach((score) => {
        scoreMap.set(score.school_class.id, score);
      });

      // ------------------------------------------------------
      // Merge classes + configurations
      // ------------------------------------------------------

      const combinedRows: ScoreRow[] = classes.map((cls) => {
        const configured = scoreMap.get(cls.id);

        return {
          school_class_id: cls.id,

          class_name: cls.name,

          arm_name: cls.arm?.name,
          arm_code: cls.arm?.code,

          first_test: configured
            ? String(configured.first_test)
            : String(DEFAULT_FIRST_TEST),

          second_test: configured
            ? String(configured.second_test)
            : String(DEFAULT_SECOND_TEST),

          exam: configured ? String(configured.exam) : String(DEFAULT_EXAM),

          configured: Boolean(configured),
        };
      });

      setRows(combinedRows);
    } catch (error) {
      console.error("Failed to load max scores:", error);

      toast.error("Failed to load classes and max scores.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================================
  // HANDLE SCORE CHANGE
  // ==========================================================

  const handleScoreChange = (
    classId: number,
    field: "first_test" | "second_test" | "exam",
    value: string,
  ) => {
    // Prevent negative values.
    if (value !== "" && Number(value) < 0) {
      return;
    }

    setRows((prev) =>
      prev.map((row) =>
        row.school_class_id === classId
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

  // ==========================================================
  // CALCULATE TOTAL
  // ==========================================================

  const calculateTotal = (first: string, second: string, exam: string) => {
    return Number(first || 0) + Number(second || 0) + Number(exam || 0);
  };

  // ==========================================================
  // CHECK WHETHER ROW IS VALID
  // ==========================================================

  const isRowValid = (row: ScoreRow) => {
    return (
      calculateTotal(row.first_test, row.second_test, row.exam) ===
      EXPECTED_TOTAL
    );
  };

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const configuredCount = useMemo(() => {
    return rows.filter((row) => row.configured).length;
  }, [rows]);

  const unconfiguredCount = useMemo(() => {
    return rows.filter((row) => !row.configured).length;
  }, [rows]);

  const invalidCount = useMemo(() => {
    return rows.filter((row) => !isRowValid(row)).length;
  }, [rows]);

  const highestTotal = useMemo(() => {
    if (rows.length === 0) {
      return 0;
    }

    return Math.max(
      ...rows.map((row) =>
        calculateTotal(row.first_test, row.second_test, row.exam),
      ),
    );
  }, [rows]);

  // ==========================================================
  // SAVE ALL
  // ==========================================================

  const handleSaveAll = async () => {
    // --------------------------------------------------------
    // Make sure every row totals 100
    // --------------------------------------------------------

    const invalidRows = rows.filter((row) => !isRowValid(row));

    if (invalidRows.length > 0) {
      toast.error(
        `${invalidRows.length} class${
          invalidRows.length > 1 ? "es" : ""
        } must have maximum scores totaling 100.`,
      );

      return;
    }

    // --------------------------------------------------------
    // Build payload
    // --------------------------------------------------------
 
    const payload = rows.map((row) => ({
      school_class: row.school_class_id,
      first_test: Number(row.first_test),
      second_test: Number(row.second_test),
      exam: Number(row.exam),
    }));

    try {
      setSaving(true);

      const response = await fetch(
        `${BASE_URL}/results/maxscores/bulk-upsert/`,
        {
          method: "POST",

          headers: {
            ...apiHeaders(),
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        },
      );

      await handleResponse(response);

      toast.success("Maximum scores saved successfully.");

      // ------------------------------------------------------
      // Reload from server.
      //
      // This is important because the newly-created rows
      // are now persisted configurations.
      // ------------------------------------------------------

      await loadData();
    } catch (error) {
      console.error("Failed to save max scores:", error);

      toast.error("Failed to save maximum scores.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // RESET / RELOAD
  // ==========================================================

  const handleReset = async () => {
    await loadData();

    toast.success("Changes discarded.");
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (fetching) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading maximum scores...
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Max Scores Management
          </h1>

          <p className="mt-1 text-gray-500">
            Configure the maximum scores for tests and examinations for each
            class.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={18} />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || rows.length === 0 || invalidCount > 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />

            {saving ? "Saving..." : "Save All Scores"}
          </button>
        </div>
      </div>

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Configured */}

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Configured Classes</p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {configuredCount}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* Available */}

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available Classes</p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {rows.length}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <ClipboardList size={22} />
            </div>
          </div>
        </div>

        {/* Pending */}

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Configuration</p>

              <h2 className="mt-2 text-3xl font-bold text-orange-600">
                {unconfiguredCount}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <AlertCircle size={22} />
            </div>
          </div>
        </div>

        {/* Highest total */}

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Highest Total Score</p>

              <h2 className="mt-2 text-3xl font-bold text-green-700">
                {highestTotal}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <span className="text-lg font-bold">100</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          VALIDATION WARNING
      ====================================================== */}

      {invalidCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <div>
            <p className="font-semibold">Invalid score configuration</p>

            <p className="mt-1 text-sm">
              {invalidCount} class
              {invalidCount > 1 ? "es have" : " has"} a total maximum score
              different from 100. Correct the highlighted rows before saving.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        {/* Table Header */}

        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <ClipboardList size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Class Maximum Scores
              </h2>

              <p className="text-sm text-gray-500">
                Edit the score limits directly in the table.
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            All scores must total{" "}
            <span className="font-bold text-gray-800">100</span>
          </div>
        </div>

        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Class
                </th>

                <th className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  1st Test
                </th>

                <th className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  2nd Test
                </th>

                <th className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Exam
                </th>

                <th className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Total
                </th>

                <th className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {rows.length > 0 ? (
                rows.map((row) => {
                  const total = calculateTotal(
                    row.first_test,
                    row.second_test,
                    row.exam,
                  );

                  const valid = total === EXPECTED_TOTAL;

                  return (
                    <tr
                      key={row.school_class_id}
                      className={`transition ${
                        valid
                          ? "hover:bg-gray-50"
                          : "bg-red-50/50 hover:bg-red-50"
                      }`}
                    >
                      {/* ==================================
                          CLASS
                      ================================== */}

                      <td className="px-6 py-5">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {row.class_name}
                          </p>

                          {(row.arm_name || row.arm_code) && (
                            <p className="mt-1 text-sm text-gray-500">
                              {row.arm_name}

                              {row.arm_name && row.arm_code && " • "}

                              {row.arm_code}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* ==================================
                          FIRST TEST
                      ================================== */}

                      <td className="px-6 py-5">
                        <input
                          type="number"
                          min="0"
                          value={row.first_test}
                          onChange={(e) =>
                            handleScoreChange(
                              row.school_class_id,
                              "first_test",
                              e.target.value,
                            )
                          }
                          className={`mx-auto block w-24 rounded-xl border px-3 py-2 text-center font-medium focus:outline-none focus:ring-2 ${
                            valid
                              ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                              : "border-red-300 bg-white focus:border-red-500 focus:ring-red-500/20"
                          }`}
                        />
                      </td>

                      {/* ==================================
                          SECOND TEST
                      ================================== */}

                      <td className="px-6 py-5">
                        <input
                          type="number"
                          min="0"
                          value={row.second_test}
                          onChange={(e) =>
                            handleScoreChange(
                              row.school_class_id,
                              "second_test",
                              e.target.value,
                            )
                          }
                          className={`mx-auto block w-24 rounded-xl border px-3 py-2 text-center font-medium focus:outline-none focus:ring-2 ${
                            valid
                              ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                              : "border-red-300 bg-white focus:border-red-500 focus:ring-red-500/20"
                          }`}
                        />
                      </td>

                      {/* ==================================
                          EXAM
                      ================================== */}

                      <td className="px-6 py-5">
                        <input
                          type="number"
                          min="0"
                          value={row.exam}
                          onChange={(e) =>
                            handleScoreChange(
                              row.school_class_id,
                              "exam",
                              e.target.value,
                            )
                          }
                          className={`mx-auto block w-24 rounded-xl border px-3 py-2 text-center font-medium focus:outline-none focus:ring-2 ${
                            valid
                              ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                              : "border-red-300 bg-white focus:border-red-500 focus:ring-red-500/20"
                          }`}
                        />
                      </td>

                      {/* ==================================
                          TOTAL
                      ================================== */}

                      <td className="px-6 py-5 text-center">
                        <span
                          className={`inline-flex min-w-20 justify-center rounded-full px-4 py-2 font-bold ${
                            valid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {total}
                        </span>
                      </td>

                      {/* ==================================
                          STATUS
                      ================================== */}

                      <td className="px-6 py-5 text-center">
                        {valid ? (
                          row.configured ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                              <CheckCircle2 size={14} />
                              Configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
                              <AlertCircle size={14} />
                              New
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
                            <AlertCircle size={14} />
                            Must equal 100
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No classes are available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================================
            TABLE FOOTER
        ================================================== */}

        {rows.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-800">{rows.length}</span>{" "}
              class
              {rows.length !== 1 ? "es" : ""}
            </div>

            <div className="flex items-center gap-3">
              {invalidCount > 0 && (
                <span className="text-sm font-medium text-red-600">
                  {invalidCount} invalid
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving || rows.length === 0 || invalidCount > 0}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={18} />

                {saving ? "Saving..." : "Save All Scores"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
