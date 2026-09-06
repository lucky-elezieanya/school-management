"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiAction, apiHeaders, BASE_URL } from "@/app/lib/api";



// ============================================================
// TYPES
// ============================================================

type GradingType = "subject" | "overall";

type GradingScale = {
  id?: number;

  grade: string;
  grading_type: GradingType;

  lower_limit: string;
  upper_limit: string;

  remark: string;

  // Only used by the frontend.
  // It tells us whether the row came from the database.
  isNew?: boolean;
};


// ============================================================
// PAGE
// ============================================================

export default function GradingConfigurationPage() {
  const [gradingType, setGradingType] =
    useState<GradingType>("subject");

  const [grades, setGrades] = useState<GradingScale[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  // ==========================================================
  // FETCH GRADING SCALES
  // ==========================================================

  const fetchGrades = async () => {
    try {
      setLoading(true);

      const response = await apiAction(
        "results",
        "grading-scales"
      );

      const data = Array.isArray(response)
        ? response
        : response?.results ?? [];

      setGrades(
        data
          .filter(
            (grade: GradingScale) =>
              grade.grading_type === gradingType
          )
          .map((grade: GradingScale) => ({
            ...grade,
            lower_limit: String(grade.lower_limit ?? ""),
            upper_limit: String(grade.upper_limit ?? ""),
            remark: grade.remark ?? "",
            grade: grade.grade ?? "",
            isNew: false,
          }))
      );
    } catch (error) {
      console.error("Failed to fetch grading scales:", error);

      toast.error(
        "Failed to load grading configuration."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // LOAD WHEN GRADING TYPE CHANGES
  // ==========================================================

  useEffect(() => {
    fetchGrades();
  }, [gradingType]);


  // ==========================================================
  // UPDATE ROW
  // ==========================================================

  const updateGrade = (
    index: number,
    field: keyof GradingScale,
    value: string
  ) => {
    setGrades((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        return {
          ...row,
          [field]: value,
        };
      })
    );
  };


  // ==========================================================
  // ADD NEW ROW
  // ==========================================================

  const addGrade = () => {
    setGrades((current) => [
      ...current,
      {
        grade: "",
        grading_type: gradingType,
        lower_limit: "",
        upper_limit: "",
        remark: "",
        isNew: true,
      },
    ]);
  };


  // ==========================================================
  // REMOVE ROW
  // ==========================================================

  const removeGrade = (index: number) => {
    setGrades((current) =>
      current.filter((_, rowIndex) => rowIndex !== index)
    );
  };


  // ==========================================================
  // VALIDATE GRADES
  // ==========================================================

  const validateGrades = (): boolean => {
    if (grades.length === 0) {
      toast.error(
        "Add at least one grading scale before saving."
      );

      return false;
    }


    // --------------------------------------------------------
    // Check individual rows
    // --------------------------------------------------------

    for (let index = 0; index < grades.length; index++) {
      const row = grades[index];

      const rowNumber = index + 1;

      const grade = row.grade.trim();

      const remark = row.remark.trim();

      if (!grade) {
        toast.error(
          `Grade name is required on row ${rowNumber}.`
        );

        return false;
      }

      if (!remark) {
        toast.error(
          `Remark is required for "${grade}".`
        );

        return false;
      }

      if (
        row.lower_limit === "" ||
        row.upper_limit === ""
      ) {
        toast.error(
          `Both lower and upper limits are required for "${grade}".`
        );

        return false;
      }

      const lower = Number(row.lower_limit);
      const upper = Number(row.upper_limit);

      if (
        !Number.isFinite(lower) ||
        !Number.isFinite(upper)
      ) {
        toast.error(
          `Invalid grading limits for "${grade}".`
        );

        return false;
      }

      if (lower < 0 || upper < 0) {
        toast.error(
          `Grading limits cannot be negative for "${grade}".`
        );

        return false;
      }

      if (lower > upper) {
        toast.error(
          `Lower limit cannot be greater than upper limit for "${grade}".`
        );

        return false;
      }
    }


    // --------------------------------------------------------
    // Check duplicate grade names
    // --------------------------------------------------------

    const gradeNames = new Set<string>();

    for (const row of grades) {
      const normalizedGrade =
        row.grade.trim().toLowerCase();

      if (gradeNames.has(normalizedGrade)) {
        toast.error(
          `Duplicate grade "${row.grade}".`
        );

        return false;
      }

      gradeNames.add(normalizedGrade);
    }


    // --------------------------------------------------------
    // Check overlapping ranges
    // --------------------------------------------------------

    for (let i = 0; i < grades.length; i++) {
      const first = grades[i];

      const firstLower = Number(first.lower_limit);
      const firstUpper = Number(first.upper_limit);

      for (let j = i + 1; j < grades.length; j++) {
        const second = grades[j];

        const secondLower = Number(
          second.lower_limit
        );

        const secondUpper = Number(
          second.upper_limit
        );

        const overlaps =
          firstLower <= secondUpper &&
          firstUpper >= secondLower;

        if (overlaps) {
          toast.error(
            `The ranges for "${first.grade}" and "${second.grade}" overlap.`
          );

          return false;
        }
      }
    }


    return true;
  };


  // ==========================================================
  // SAVE ALL
  // ==========================================================

  const handleSaveAll = async () => {
    if (!validateGrades()) {
      return;
    }

    try {
      setSaving(true);

      // ------------------------------------------------------
      // Prepare payload
      // ------------------------------------------------------

      const payload = grades.map((row) => {
        const item: {
          id?: number;
          grade: string;
          grading_type: GradingType;
          lower_limit: number;
          upper_limit: number;
          remark: string;
        } = {
          grade: row.grade.trim(),
          grading_type: gradingType,
          lower_limit: Number(row.lower_limit),
          upper_limit: Number(row.upper_limit),
          remark: row.remark.trim(),
        };

        // Only existing database records have IDs.
        // New rows intentionally omit id.
        if (row.id !== undefined) {
          item.id = row.id;
        }

        return item;
      });


      // ------------------------------------------------------
      // Bulk upsert
      // ------------------------------------------------------

      const response = await fetch(
        `${BASE_URL}/results/grading-scales/bulk-upsert/`,
        {
          method: "POST",

          headers: {
            ...apiHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      // ------------------------------------------------------
      // Handle response
      // ------------------------------------------------------

      if (!response.ok) {
        let errorMessage =
          "Failed to save grading configuration.";

        try {
          const errorData = await response.json();

          if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.detail) {
            errorMessage = errorData.detail;
          }
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(errorMessage);
      }


      toast.success(
        "Grading configuration saved successfully."
      );


      // ------------------------------------------------------
      // Reload from backend
      // ------------------------------------------------------

      await fetchGrades();

    } catch (error) {
      console.error(
        "Failed to save grading configuration:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save grading configuration."
      );
    } finally {
      setSaving(false);
    }
  };


  // ==========================================================
  // RESET
  // ==========================================================

  const handleReset = async () => {
    await fetchGrades();

    toast.success(
      "Changes have been discarded."
    );
  };


  // ==========================================================
  // SUMMARY
  // ==========================================================

  const configuredCount = useMemo(() => {
    return grades.filter(
      (grade) => grade.grade.trim() !== ""
    ).length;
  }, [grades]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6 p-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Grading Configuration
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure grade names, score ranges, and remarks.
          </p>
        </div>


        {/* Grading type */}

        <div className="flex items-center gap-3">

          <label
            htmlFor="grading-type"
            className="text-sm font-medium"
          >
            Grading Type
          </label>

          <select
            id="grading-type"
            value={gradingType}
            onChange={(event) =>
              setGradingType(
                event.target.value as GradingType
              )
            }
            disabled={saving}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="subject">
              Subject Grade
            </option>

            <option value="overall">
              Overall Grade
            </option>
          </select>

        </div>

      </div>


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="rounded-lg border bg-card p-4">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <p className="text-sm font-medium">
              {gradingType === "subject"
                ? "Subject Grading"
                : "Overall Grading"}
            </p>

            <p className="text-sm text-muted-foreground">
              {configuredCount} grading scale
              {configuredCount === 1 ? "" : "s"} configured
            </p>
          </div>


          <button
            type="button"
            onClick={addGrade}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />

            Add Grade
          </button>

        </div>

      </div>


      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="rounded-lg border bg-card">

        {loading ? (

          <div className="flex min-h-[300px] items-center justify-center">

            <div className="flex items-center gap-2 text-sm text-muted-foreground">

              <RefreshCw className="h-4 w-4 animate-spin" />

              Loading grading configuration...

            </div>

          </div>

        ) : grades.length === 0 ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 px-6 text-center">

            <div>
              <h3 className="font-semibold">
                No grading scales configured
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Add your first grading scale to get started.
              </p>
            </div>

            <button
              type="button"
              onClick={addGrade}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />

              Add Grade
            </button>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px] border-collapse">

              <thead>

                <tr className="border-b bg-muted/40">

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Grade
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Remark
                  </th>

                  <th className="w-[150px] px-4 py-3 text-left text-sm font-semibold">
                    Lower Limit
                  </th>

                  <th className="w-[150px] px-4 py-3 text-left text-sm font-semibold">
                    Upper Limit
                  </th>

                  <th className="w-[100px] px-4 py-3 text-center text-sm font-semibold">
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {grades.map((row, index) => (

                  <tr
                    key={
                      row.id ??
                      `new-${index}`
                    }
                    className="border-b last:border-b-0"
                  >

                    {/* ========================================
                        GRADE
                    ======================================== */}

                    <td className="px-4 py-3">

                      <input
                        type="text"
                        value={row.grade}
                        onChange={(event) =>
                          updateGrade(
                            index,
                            "grade",
                            event.target.value
                          )
                        }
                        placeholder="e.g. A"
                        disabled={saving}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />

                    </td>


                    {/* ========================================
                        REMARK
                    ======================================== */}

                    <td className="px-4 py-3">

                      <input
                        type="text"
                        value={row.remark}
                        onChange={(event) =>
                          updateGrade(
                            index,
                            "remark",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Excellent"
                        disabled={saving}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />

                    </td>


                    {/* ========================================
                        LOWER LIMIT
                    ======================================== */}

                    <td className="px-4 py-3">

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.lower_limit}
                        onChange={(event) =>
                          updateGrade(
                            index,
                            "lower_limit",
                            event.target.value
                          )
                        }
                        placeholder="0"
                        disabled={saving}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />

                    </td>


                    {/* ========================================
                        UPPER LIMIT
                    ======================================== */}

                    <td className="px-4 py-3">

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.upper_limit}
                        onChange={(event) =>
                          updateGrade(
                            index,
                            "upper_limit",
                            event.target.value
                          )
                        }
                        placeholder="100"
                        disabled={saving}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      />

                    </td>


                    {/* ========================================
                        DELETE
                    ======================================== */}

                    <td className="px-4 py-3 text-center">

                      <button
                        type="button"
                        onClick={() =>
                          removeGrade(index)
                        }
                        disabled={saving}
                        title="Remove row"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ======================================================
          ACTIONS
      ====================================================== */}

      {!loading && grades.length > 0 && (

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />

            Reset Changes
          </button>


          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >

            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />

                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />

                Save All
              </>
            )}

          </button>

        </div>

      )}

    </div>
  );
}

