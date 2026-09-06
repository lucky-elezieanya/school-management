"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { apiAction, apiHeaders, BASE_URL, handleResponse } from "@/app/lib/api";

import {
  Save,
  RotateCcw,
  WalletCards,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type ClassType = {
  id: number;
  name: string;
  arm?: {
    id?: number;
    name: string;
    code?: string;
  } | null;
};

type SessionType = {
  id: number;
  name: string;
  is_active?: boolean;
};

type TermType = {
  id: number;
  name: string;
  is_active?: boolean;
  session?: {
    id: number;
    name: string;
  };
};

type ClassFeeType = {
  id: number;
  school_class: {
    id: number;
    name: string;
    arm?: {
      name: string;
      code?: string;
    } | null;
  };
  session: {
    id: number;
    name: string;
  };
  term: {
    id: number;
    name: string;
  };
  amount: string | number;
};

type FeeRow = {
  school_class_id: number;
  class_name: string;
  arm_name?: string;
  arm_code?: string;

  amount: string;

  configured: boolean;
};

type Props = {
  onSuccess?: () => void;
};

export default function ClassFees({ onSuccess }: Props) {
  // ============================================================
  // STATE
  // ============================================================

  const [classes, setClasses] = useState<ClassType[]>([]);

  const [sessions, setSessions] = useState<SessionType[]>([]);

  const [terms, setTerms] = useState<TermType[]>([]);

  const [fees, setFees] = useState<ClassFeeType[]>([]);

  const [rows, setRows] = useState<FeeRow[]>([]);

  const [sessionId, setSessionId] = useState("");

  const [termId, setTermId] = useState("");

  const [fetching, setFetching] = useState(true);

  const [loadingTerms, setLoadingTerms] = useState(false);

  const [saving, setSaving] = useState(false);

  // ============================================================
  // LOAD INITIAL DATA
  // ============================================================

  const loadInitialData = async () => {
    try {
      setFetching(true);

      const [classRes, sessionRes] = await Promise.all([
        apiAction("academics", "classes"),

        apiAction("academics", "sessions"),
      ]);

      const classData: ClassType[] = classRes?.results ?? classRes ?? [];

      const sessionData: SessionType[] =
        sessionRes?.results ?? sessionRes ?? [];

      setClasses(classData);

      setSessions(sessionData);

      // --------------------------------------------------------
      // Select active session automatically
      // --------------------------------------------------------

      const activeSession = sessionData.find((session) => session.is_active);

      if (activeSession) {
        setSessionId(String(activeSession.id));
      } else if (sessionData.length > 0) {
        setSessionId(String(sessionData[0].id));
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);

      toast.error("Failed to load classes and sessions.");
    } finally {
      setFetching(false);
    }
  };

  // ============================================================
  // LOAD TERMS
  // ============================================================

  const fetchTerms = async (selectedSessionId: string) => {
    if (!selectedSessionId) {
      setTerms([]);
      setTermId("");

      return;
    }

    try {
      setLoadingTerms(true);

      const response = await fetch(
        `${BASE_URL}/academics/sessions/${selectedSessionId}/terms/`,
        {
          headers: apiHeaders(),
        },
      );

      const data = await handleResponse(response);

      const termData: TermType[] = data?.terms ?? data?.results ?? data ?? [];

      setTerms(termData);

      // --------------------------------------------------------
      // Automatically select active term
      // --------------------------------------------------------

      const activeTerm = termData.find((term) => term.is_active);

      if (activeTerm) {
        setTermId(String(activeTerm.id));
      } else if (termData.length > 0) {
        setTermId(String(termData[0].id));
      } else {
        setTermId("");
      }
    } catch (error) {
      console.error("Failed to load terms:", error);

      setTerms([]);
      setTermId("");

      toast.error("Failed to load terms.");
    } finally {
      setLoadingTerms(false);
    }
  };

  // ============================================================
  // LOAD FEES FOR SELECTED SESSION + TERM
  // ============================================================

  const loadFees = async () => {
    if (!sessionId || !termId) {
      setFees([]);
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/results/classfees/?session=${sessionId}&term=${termId}`,
        {
          headers: apiHeaders(),
        },
      );

      const data = await handleResponse(response);

      const feeData: ClassFeeType[] = data?.results ?? data ?? [];

      setFees(feeData);
    } catch (error) {
      console.error("Failed to load class fees:", error);

      toast.error("Failed to load class fees.");
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  // ============================================================
  // SESSION CHANGED
  // ============================================================

  useEffect(() => {
    if (!sessionId) {
      setTerms([]);
      setTermId("");

      return;
    }

    fetchTerms(sessionId);
  }, [sessionId]);

  // ============================================================
  // SESSION + TERM CHANGED
  // ============================================================

  useEffect(() => {
    loadFees();
  }, [sessionId, termId]);

  // ============================================================
  // COMBINE CLASSES + FEES
  // ============================================================

  useEffect(() => {
    if (classes.length === 0 || !sessionId || !termId) {
      setRows([]);
      return;
    }

    const feeMap = new Map<number, ClassFeeType>();

    fees.forEach((fee) => {
      feeMap.set(fee.school_class.id, fee);
    });

    const combinedRows: FeeRow[] = classes.map((schoolClass) => {
      const existingFee = feeMap.get(schoolClass.id);

      return {
        school_class_id: schoolClass.id,

        class_name: schoolClass.name,

        arm_name: schoolClass.arm?.name,

        arm_code: schoolClass.arm?.code,

        amount: existingFee ? String(existingFee.amount) : "",

        configured: Boolean(existingFee),
      };
    });

    setRows(combinedRows);
  }, [classes, fees, sessionId, termId]);

  // ============================================================
  // CHANGE AMOUNT
  // ============================================================

  const handleAmountChange = (classId: number, value: string) => {
    // ----------------------------------------------------------
    // Allow blank
    // ----------------------------------------------------------

    if (value === "") {
      setRows((previous) =>
        previous.map((row) =>
          row.school_class_id === classId
            ? {
                ...row,
                amount: "",
              }
            : row,
        ),
      );

      return;
    }

    // ----------------------------------------------------------
    // Prevent negative numbers
    // ----------------------------------------------------------

    if (Number(value) < 0) {
      return;
    }

    setRows((previous) =>
      previous.map((row) =>
        row.school_class_id === classId
          ? {
              ...row,
              amount: value,
            }
          : row,
      ),
    );
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const invalidCount = useMemo(() => {
    return rows.filter((row) => !row.amount || Number(row.amount) < 0).length;
  }, [rows]);

  // ============================================================
  // CONFIGURED COUNT
  // ============================================================

  const configuredCount = useMemo(() => {
    return rows.filter((row) => row.configured).length;
  }, [rows]);

  // ============================================================
  // NEW COUNT
  // ============================================================

  const newCount = useMemo(() => {
    return rows.filter((row) => !row.configured).length;
  }, [rows]);

  // ============================================================
  // TOTAL FEES
  // ============================================================

  const totalConfiguredAmount = useMemo(() => {
    return rows.reduce((total, row) => total + Number(row.amount || 0), 0);
  }, [rows]);

  // ============================================================
  // SAVE ALL
  // ============================================================

  const handleSaveAll = async () => {
    // ----------------------------------------------------------
    // Require session
    // ----------------------------------------------------------

    if (!sessionId) {
      toast.error("Please select a session.");

      return;
    }

    // ----------------------------------------------------------
    // Require term
    // ----------------------------------------------------------

    if (!termId) {
      toast.error("Please select a term.");

      return;
    }

    // ----------------------------------------------------------
    // Don't allow empty fees
    // ----------------------------------------------------------

    const invalidRows = rows.filter(
      (row) => row.amount === "" || Number(row.amount) < 0,
    );

    if (invalidRows.length > 0) {
      toast.error(
        `${invalidRows.length} class${
          invalidRows.length > 1 ? "es" : ""
        } must have a valid fee amount.`,
      );

      return;
    }

    // ----------------------------------------------------------
    // Build payload
    // ----------------------------------------------------------

    const payload = rows.map((row) => ({
      school_class: row.school_class_id,

      session: Number(sessionId),

      term: Number(termId),

      amount: Number(row.amount),
    }));

    try {
      setSaving(true);

      const response = await fetch(
        `${BASE_URL}/results/classfees/bulk-upsert/`,
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

      toast.success("Class fees saved successfully.");

      // --------------------------------------------------------
      // Reload saved data
      // --------------------------------------------------------

      await loadFees();

      onSuccess?.();
    } catch (error) {
      console.error("Failed to save class fees:", error);

      toast.error("Failed to save class fees.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RESET
  // ============================================================

  const handleReset = async () => {
    await loadFees();

    toast.success("Changes discarded.");
  };

  // ============================================================
  // FORMAT MONEY
  // ============================================================

  const formatMoney = (value: number) => {
    return `₦${value.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (fetching) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading class fee configuration...
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              <WalletCards className="h-5 w-5 text-green-700" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Class Fees Management
              </h2>

              <p className="text-sm text-gray-500">
                Configure fees for all classes by session and term.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || !sessionId || !termId || rows.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />

            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {/* ======================================================
          SESSION + TERM
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:grid-cols-2">
        {/* SESSION */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Academic Session
          </label>

          <select
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);

              setTermId("");

              setRows([]);
            }}
            className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select Session</option>

            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}

                {session.is_active ? " (Active)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* TERM */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Term
          </label>

          <select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            disabled={!sessionId || loadingTerms}
            className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
          >
            <option value="">
              {loadingTerms ? "Loading terms..." : "Select Term"}
            </option>

            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}

                {term.is_active ? " (Active)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================================================
          STAT CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* TOTAL CLASSES */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Classes</p>

          <p className="mt-1 text-2xl font-bold text-gray-800">{rows.length}</p>
        </div>

        {/* CONFIGURED */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Configured</p>

          <p className="mt-1 text-2xl font-bold text-green-600">
            {configuredCount}
          </p>
        </div>

        {/* NEW */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Not Configured</p>

          <p className="mt-1 text-2xl font-bold text-orange-600">{newCount}</p>
        </div>

        {/* TOTAL */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Configured</p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {formatMoney(totalConfiguredAmount)}
          </p>
        </div>
      </div>

      {/* ======================================================
          WARNING
      ====================================================== */}

      {invalidCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">Some classes need attention.</p>

            <p className="text-sm">
              {invalidCount} class
              {invalidCount > 1 ? "es" : ""} have an invalid or empty fee
              amount.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-4 font-semibold text-gray-700">#</th>

                <th className="p-4 font-semibold text-gray-700">Class</th>

                <th className="p-4 font-semibold text-gray-700">Arm</th>

                <th className="p-4 font-semibold text-gray-700">
                  Next Term Fee
                </th>

                <th className="p-4 text-center font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((row, index) => {
                  const amount = Number(row.amount || 0);

                  const valid = row.amount !== "" && amount >= 0;

                  return (
                    <tr
                      key={row.school_class_id}
                      className={`border-t transition ${
                        !valid ? "bg-red-50" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* NUMBER */}

                      <td className="p-4 text-gray-500">{index + 1}</td>

                      {/* CLASS */}

                      <td className="p-4">
                        <div className="font-semibold text-gray-800">
                          {row.class_name}
                        </div>
                      </td>

                      {/* ARM */}

                      <td className="p-4 text-gray-600">
                        {row.arm_name ? (
                          <span>
                            {row.arm_name}

                            {row.arm_code && (
                              <span className="ml-1 text-gray-400">
                                ({row.arm_code})
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* AMOUNT */}

                      <td className="p-4">
                        <div className="relative max-w-xs">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            ₦
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.amount}
                            onChange={(e) =>
                              handleAmountChange(
                                row.school_class_id,
                                e.target.value,
                              )
                            }
                            placeholder="Enter fee"
                            className={`w-full rounded-xl border bg-white py-2.5 pl-8 pr-3 outline-none transition focus:ring-2 ${
                              valid
                                ? "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                : "border-red-300 focus:border-red-500 focus:ring-red-100"
                            }`}
                          />
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="p-4 text-center">
                        {valid ? (
                          row.configured ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                              New
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Invalid
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500">
                    {!sessionId
                      ? "Select a session to begin."
                      : !termId
                        ? "Select a term to view class fees."
                        : "No classes available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        {rows.length > 0 && (
          <div className="flex flex-col gap-3 border-t bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              {rows.length} class
              {rows.length !== 1 ? "es" : ""} • {configuredCount} configured
              {" • "}
              {newCount} new
            </div>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || invalidCount > 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />

              {saving ? "Saving..." : "Save All Fees"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
