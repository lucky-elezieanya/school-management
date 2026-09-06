"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  getPromotionClasses,
  getPromotionRules,
  bulkSavePromotionRules,
} from "@/app/services/promotions";

// ============================================================
// TYPES
// ============================================================

type SchoolClass = {
  id: number;
  name: string;
  arm?: {
    id: number;
    name: string;
  };
};

type PromotionRule = {
  id: number;
  from_class: SchoolClass;
  to_class: SchoolClass | null;
  outcome: "PROMOTE" | "GRADUATE";
  is_active: boolean;
};

type PromotionRow = {
  id?: number;

  from_class_id: number;

  to_class_id: number | null;

  outcome: "PROMOTE" | "GRADUATE";

  is_active: boolean;
};

// ============================================================
// PAGE
// ============================================================

export default function PromotionRulesPage() {
  const router = useRouter();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [rules, setRules] = useState<PromotionRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ========================================================
  // CLASS LABEL
  // ========================================================

  const classLabel = (schoolClass: SchoolClass) => {
    if (schoolClass.arm?.name) {
      return `${schoolClass.name} ${schoolClass.arm.name}`;
    }

    return schoolClass.name;
  };

  // ========================================================
  // LOAD DATA
  // ========================================================

  const load = async () => {
    try {
      setLoading(true);

      const [classesResponse, rulesResponse] = await Promise.all([
        getPromotionClasses(),
        getPromotionRules(),
      ]);

      // ------------------------------------------------
      // Handle pagination
      // ------------------------------------------------

      const classList = Array.isArray(classesResponse)
        ? classesResponse
        : classesResponse?.results || [];

      const ruleList = Array.isArray(rulesResponse)
        ? rulesResponse
        : rulesResponse?.results || [];

      setClasses(classList);

      // ------------------------------------------------
      // Build rule map
      // ------------------------------------------------

      const ruleMap = new Map<number, PromotionRule>();

      ruleList.forEach((rule: PromotionRule) => {
        ruleMap.set(rule.from_class.id, rule);
      });

      // ------------------------------------------------
      // Every class becomes a row
      // ------------------------------------------------

      const rows: PromotionRow[] = classList.map((schoolClass: SchoolClass) => {
        const existingRule = ruleMap.get(schoolClass.id);

        if (existingRule) {
          return {
            id: existingRule.id,

            from_class_id: schoolClass.id,

            to_class_id: existingRule.to_class?.id ?? null,

            outcome: existingRule.outcome,

            is_active: existingRule.is_active,
          };
        }

        // --------------------------------------
        // No rule yet
        //
        // IMPORTANT:
        // This is different from GRADUATE.
        // --------------------------------------

        return {
          from_class_id: schoolClass.id,

          to_class_id: null,

          outcome: "PROMOTE",

          is_active: false,
        };
      });

      setRules(rows);
    } catch (error) {
      console.error("Failed to load promotion configuration:", error);

      toast.error("Failed to load promotion configuration.");
    } finally {
      setLoading(false);
    }
  };

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    load();
  }, []);

  // ========================================================
  // UPDATE OUTCOME
  // ========================================================

  const updateOutcome = (
    fromClassId: number,
    outcome: "PROMOTE" | "GRADUATE",
  ) => {
    setRules((current) =>
      current.map((rule) => {
        if (rule.from_class_id !== fromClassId) {
          return rule;
        }

        if (outcome === "GRADUATE") {
          return {
            ...rule,

            outcome: "GRADUATE",

            to_class_id: null,

            is_active: true,
          };
        }

        return {
          ...rule,

          outcome: "PROMOTE",

          is_active: rule.to_class_id !== null,
        };
      }),
    );
  };

  // ========================================================
  // UPDATE DESTINATION
  // ========================================================

  const updateDestination = (fromClassId: number, toClassId: number | null) => {
    setRules((current) =>
      current.map((rule) => {
        if (rule.from_class_id !== fromClassId) {
          return rule;
        }

        return {
          ...rule,

          to_class_id: toClassId,

          outcome: "PROMOTE",

          is_active: toClassId !== null,
        };
      }),
    );
  };

  // ========================================================
  // UPDATE ACTIVE
  // ========================================================

  const updateActive = (fromClassId: number, active: boolean) => {
    setRules((current) =>
      current.map((rule) => {
        if (rule.from_class_id !== fromClassId) {
          return rule;
        }

        return {
          ...rule,

          is_active: active,
        };
      }),
    );
  };

  // ========================================================
  // CLASS LOOKUP
  // ========================================================

  const classMap = useMemo(() => {
    return new Map(classes.map((schoolClass) => [schoolClass.id, schoolClass]));
  }, [classes]);

  // ========================================================
  // VALIDATION
  // ========================================================

  const validate = () => {
    for (const rule of rules) {
      const fromClass = classMap.get(rule.from_class_id);

      // ------------------------------------------------
      // GRADUATE
      // ------------------------------------------------

      if (rule.outcome === "GRADUATE") {
        if (rule.to_class_id !== null) {
          toast.error(
            `${fromClass ? classLabel(fromClass) : "This class"} cannot have a target class when the outcome is Graduate.`,
          );

          return false;
        }

        continue;
      }

      // ------------------------------------------------
      // PROMOTE requires target
      // ------------------------------------------------

      if (rule.to_class_id === null) {
        toast.error(
          `${fromClass ? classLabel(fromClass) : "This class"} must have a target class or be set to Graduate.`,
        );

        return false;
      }

      // ------------------------------------------------
      // Cannot promote to itself
      // ------------------------------------------------

      if (rule.from_class_id === rule.to_class_id) {
        toast.error(
          `${fromClass ? classLabel(fromClass) : "This class"} cannot promote to itself.`,
        );

        return false;
      }
    }

    return true;
  };

  // ========================================================
  // SAVE ALL
  // ========================================================

  const handleSaveAll = async () => {
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const payload = rules.map((rule) => {
        return {
          ...(rule.id !== undefined
            ? {
                id: rule.id,
              }
            : {}),

          from_class_id: rule.from_class_id,

          to_class_id: rule.outcome === "GRADUATE" ? null : rule.to_class_id,

          outcome: rule.outcome,

          is_active: rule.is_active,
        };
      });

      await bulkSavePromotionRules(payload);

      toast.success("Promotion rules saved successfully.");

      // ------------------------------------------------
      // Reload authoritative backend state
      // ------------------------------------------------

      await load();
    } catch (error) {
      console.error("Failed to save promotion rules:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save promotion rules.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================================
  // RESET
  // ========================================================

  const handleReset = async () => {
    await load();

    toast.success("Changes discarded.");
  };

  // ========================================================
  // CONFIGURED COUNT
  // ========================================================

  const configuredCount = rules.filter(
    (rule) =>
      rule.outcome === "GRADUATE" ||
      (rule.outcome === "PROMOTE" && rule.to_class_id !== null),
  ).length;

  const notConfiguredCount = Math.max(classes.length - configuredCount, 0);

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ==================================================
                    HEADER
                ================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
              Promotion Rules
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Configure what happens to students from each class during
              promotion.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-lg
                                border
                                bg-white
                                px-4
                                py-2
                                text-sm
                                font-medium
                                text-gray-700
                                shadow-sm
                                transition
                                hover:bg-gray-50
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
            >
              <ArrowLeft size={16} />

              <span className="hidden sm:inline">Back</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading || saving}
              className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-lg
                                border
                                bg-white
                                px-4
                                py-2
                                text-sm
                                font-medium
                                text-gray-700
                                shadow-sm
                                transition
                                hover:bg-gray-50
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />

              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* ==================================================
                    SUMMARY
                ================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Classes</p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {classes.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Configured</p>

            <p className="mt-1 text-2xl font-bold text-green-600">
              {configuredCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Not Configured</p>

            <p className="mt-1 text-2xl font-bold text-gray-500">
              {notConfiguredCount}
            </p>
          </div>
        </div>

        {/* ==================================================
                    TABLE
                ================================================== */}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw size={18} className="animate-spin" />
                Loading promotion rules...
              </div>
            </div>
          ) : classes.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center p-6 text-center">
              <div>
                <h3 className="font-semibold text-gray-900">
                  No classes found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Create classes before configuring promotion rules.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      From Class
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Outcome
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Promote To
                    </th>

                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                      Active
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {classes.map((schoolClass) => {
                    const rule = rules.find(
                      (item) => item.from_class_id === schoolClass.id,
                    );

                    if (!rule) {
                      return null;
                    }

                    const isGraduate = rule.outcome === "GRADUATE";

                    return (
                      <tr
                        key={schoolClass.id}
                        className="
                                                        border-b
                                                        last:border-b-0
                                                        hover:bg-gray-50
                                                    "
                      >
                        {/* ======================================
                                                        FROM CLASS
                                                    ====================================== */}

                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {classLabel(schoolClass)}
                          </div>
                        </td>

                        {/* ======================================
                                                        OUTCOME
                                                    ====================================== */}

                        <td className="px-4 py-3">
                          <select
                            value={rule.outcome}
                            onChange={(event) =>
                              updateOutcome(
                                schoolClass.id,
                                event.target.value as "PROMOTE" | "GRADUATE",
                              )
                            }
                            disabled={saving}
                            className="
                                                                h-10
                                                                w-full
                                                                rounded-lg
                                                                border
                                                                border-gray-300
                                                                bg-white
                                                                px-3
                                                                text-sm
                                                                text-gray-900
                                                                outline-none
                                                                transition
                                                                focus:border-green-500
                                                                focus:ring-2
                                                                focus:ring-green-100
                                                                disabled:cursor-not-allowed
                                                                disabled:bg-gray-100
                                                            "
                          >
                            <option value="PROMOTE">Promote</option>

                            <option value="GRADUATE">Graduate</option>
                          </select>
                        </td>

                        {/* ======================================
                                                        TARGET CLASS
                                                    ====================================== */}

                        <td className="px-4 py-3">
                          {isGraduate ? (
                            <div
                              className="
                                                                flex
                                                                h-10
                                                                items-center
                                                                rounded-lg
                                                                border
                                                                border-gray-200
                                                                bg-gray-50
                                                                px-3
                                                                text-sm
                                                                font-medium
                                                                text-gray-500
                                                            "
                            >
                              No target class — student graduates
                            </div>
                          ) : (
                            <select
                              value={rule.to_class_id ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;

                                updateDestination(
                                  schoolClass.id,
                                  value ? Number(value) : null,
                                );
                              }}
                              disabled={saving}
                              className="
                                                                    h-10
                                                                    w-full
                                                                    rounded-lg
                                                                    border
                                                                    border-gray-300
                                                                    bg-white
                                                                    px-3
                                                                    text-sm
                                                                    text-gray-900
                                                                    outline-none
                                                                    transition
                                                                    focus:border-green-500
                                                                    focus:ring-2
                                                                    focus:ring-green-100
                                                                    disabled:cursor-not-allowed
                                                                    disabled:bg-gray-100
                                                                "
                            >
                              <option value="">Select target class</option>

                              {classes
                                .filter(
                                  (targetClass) =>
                                    targetClass.id !== schoolClass.id,
                                )
                                .map((targetClass) => (
                                  <option
                                    key={targetClass.id}
                                    value={targetClass.id}
                                  >
                                    {classLabel(targetClass)}
                                  </option>
                                ))}
                            </select>
                          )}
                        </td>

                        {/* ======================================
                                                        ACTIVE
                                                    ====================================== */}

                        <td className="px-4 py-3 text-center">
                          <label className="inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={rule.is_active}
                              onChange={(event) =>
                                updateActive(
                                  schoolClass.id,
                                  event.target.checked,
                                )
                              }
                              disabled={
                                saving ||
                                (rule.outcome === "PROMOTE" &&
                                  rule.to_class_id === null)
                              }
                              className="
                                                                    h-4
                                                                    w-4
                                                                    rounded
                                                                    border-gray-300
                                                                    text-green-600
                                                                    focus:ring-green-500
                                                                "
                            />

                            <span className="ml-2 text-xs text-gray-500">
                              {!rule.is_active
                                ? "Inactive"
                                : rule.outcome === "GRADUATE"
                                  ? "Graduate"
                                  : "Active"}
                            </span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ==================================================
                    INFORMATION
                ================================================== */}

        {!loading && classes.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              How promotion rules work
            </p>

            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-800">
              <li>
                <strong>Promote</strong> moves the student into the selected
                target class in the new academic session.
              </li>

              <li>
                <strong>Graduate</strong> ends the student's current enrollment
                and does not create an enrollment in the new session.
              </li>

              <li>
                A class with no configured rule will prevent the promotion batch
                from executing.
              </li>
            </ul>
          </div>
        )}

        {/* ==================================================
                    SAVE BAR
                ================================================== */}

        {!loading && classes.length > 0 && (
          <div
            className="
                            sticky
                            bottom-4
                            flex
                            flex-col
                            gap-3
                            rounded-xl
                            border
                            bg-white/95
                            p-4
                            shadow-lg
                            backdrop-blur
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                        "
          >
            <div className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">
                {configuredCount}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {classes.length}
              </span>{" "}
              classes configured.
            </div>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="
                                    inline-flex
                                    h-10
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-lg
                                    bg-green-600
                                    px-6
                                    text-sm
                                    font-semibold
                                    text-white
                                    shadow-sm
                                    transition
                                    hover:bg-green-700
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                "
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save All
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
