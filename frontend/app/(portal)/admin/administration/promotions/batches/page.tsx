"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Play,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import {
  executePromotion,
  getPromotionBatches,
  getPromotionRules,
} from "@/app/services/promotions";

import PromotionBatchForm from "@/app/components/forms/PromotionBatchForm";

// ============================================================
// TYPES
// ============================================================

interface Session {
  id: number;
  name: string;
}

interface Batch {
  id: number;
  from_session: Session;
  to_session: Session;
  completed: boolean;
}

interface PromotionExecutionError {
  detail?: string;

  students_without_rule?: Array<{
    student_id: number;
    from_class_id: number;
  }>;

  target_conflicts?: Array<{
    student_id: number;
    existing_enrollment_id: number;
    existing_class_id: number;
  }>;
}

type FeedbackType = "success" | "error" | "warning" | null;

interface Feedback {
  type: FeedbackType;
  title: string;
  message: string;
  details?: string[];
}

// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;

    if (typeof value.detail === "string") {
      return value.detail;
    }

    if (typeof value.message === "string") {
      return value.message;
    }

    if (typeof value.error === "string") {
      return value.error;
    }
  }

  return "Something went wrong while processing the request.";
}

function parseExecutionError(error: unknown): Feedback {
  // ----------------------------------------------------------
  // Standard Error
  // ----------------------------------------------------------

  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);

      return buildExecutionFeedback(parsed);
    } catch {
      return {
        type: "error",
        title: "Promotion failed",
        message: error.message || "The promotion batch could not be executed.",
      };
    }
  }

  return buildExecutionFeedback(error);
}

function buildExecutionFeedback(error: unknown): Feedback {
  if (!error || typeof error !== "object") {
    return {
      type: "error",
      title: "Promotion failed",
      message: "The promotion batch could not be executed.",
    };
  }

  const data = error as PromotionExecutionError;

  const details: string[] = [];

  // ----------------------------------------------------------
  // Students without rules
  // ----------------------------------------------------------

  if (data.students_without_rule && data.students_without_rule.length > 0) {
    details.push(
      `${data.students_without_rule.length} student${
        data.students_without_rule.length === 1 ? "" : "s"
      } belong to classes without a configured promotion rule.`,
    );
  }

  // ----------------------------------------------------------
  // Target conflicts
  // ----------------------------------------------------------

  if (data.target_conflicts && data.target_conflicts.length > 0) {
    details.push(
      `${data.target_conflicts.length} student${
        data.target_conflicts.length === 1 ? "" : "s"
      } already have an enrollment in the target session.`,
    );
  }

  // ----------------------------------------------------------
  // Detail
  // ----------------------------------------------------------

  const message =
    data.detail ||
    "The promotion batch could not be executed because some students require attention.";

  return {
    type: "error",
    title: "Promotion cannot be executed",
    message,
    details: details.length > 0 ? details : undefined,
  };
}

// ============================================================
// FEEDBACK COMPONENT
// ============================================================

function FeedbackAlert({
  feedback,
  onClose,
}: {
  feedback: Feedback | null;
  onClose: () => void;
}) {
  if (!feedback) {
    return null;
  }

  const styles = {
    success: {
      wrapper: "border-green-200 bg-green-50 text-green-900",
      icon: "text-green-600",
      title: "text-green-900",
      text: "text-green-800",
      close: "text-green-600 hover:bg-green-100",
    },

    error: {
      wrapper: "border-red-200 bg-red-50 text-red-900",
      icon: "text-red-600",
      title: "text-red-900",
      text: "text-red-800",
      close: "text-red-600 hover:bg-red-100",
    },

    warning: {
      wrapper: "border-yellow-200 bg-yellow-50 text-yellow-900",
      icon: "text-yellow-600",
      title: "text-yellow-900",
      text: "text-yellow-800",
      close: "text-yellow-600 hover:bg-yellow-100",
    },
  }[feedback.type || "error"];

  const Icon =
    feedback.type === "success"
      ? CheckCircle2
      : feedback.type === "warning"
        ? AlertCircle
        : XCircle;

  return (
    <div
      className={`
        relative
        rounded-xl
        border
        p-4
        shadow-sm
        ${styles.wrapper}
      `}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon size={21} className={`mt-0.5 shrink-0 ${styles.icon}`} />

        <div className="min-w-0 flex-1">
          <h3
            className={`
              font-semibold
              ${styles.title}
            `}
          >
            {feedback.title}
          </h3>

          <p
            className={`
              mt-1
              text-sm
              leading-6
              ${styles.text}
            `}
          >
            {feedback.message}
          </p>

          {feedback.details && feedback.details.length > 0 && (
            <ul
              className={`
                  mt-3
                  list-disc
                  space-y-1
                  pl-5
                  text-sm
                  ${styles.text}
                `}
            >
              {feedback.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`
            shrink-0
            rounded-lg
            p-1.5
            transition
            ${styles.close}
          `}
          aria-label="Dismiss message"
        >
          <XCircle size={18} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function BatchesPage() {
  const router = useRouter();

  // ==========================================================
  // STATE
  // ==========================================================

  const [rulesCount, setRulesCount] = useState<number | null>(null);

  const [batches, setBatches] = useState<Batch[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [executingId, setExecutingId] = useState<number | null>(null);

  const [showBatchForm, setShowBatchForm] = useState(false);

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [confirmBatch, setConfirmBatch] = useState<Batch | null>(null);

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setInitialLoading(true);
      } else {
        setRefreshing(true);
      }

      const [rulesRes, batchesRes] = await Promise.all([
        getPromotionRules(),
        getPromotionBatches(),
      ]);

      const rules = Array.isArray(rulesRes)
        ? rulesRes
        : rulesRes?.results || [];

      const loadedBatches = Array.isArray(batchesRes)
        ? batchesRes
        : batchesRes?.results || [];

      setRulesCount(rules.length);

      setBatches(loadedBatches);
    } catch (error) {
      console.error("Failed to load promotion data:", error);

      setFeedback({
        type: "error",
        title: "Unable to load promotion data",
        message: getErrorMessage(error),
      });
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================================
  // RULE STATUS
  // ==========================================================

  const isBlocked = rulesCount === 0;

  // ==========================================================
  // REQUEST EXECUTION
  // ==========================================================

  const requestExecute = (batch: Batch) => {
    if (isBlocked) {
      setFeedback({
        type: "warning",
        title: "Promotion rules are required",
        message:
          "Configure at least one promotion rule before executing a promotion batch.",
      });

      return;
    }

    if (batch.completed) {
      setFeedback({
        type: "warning",
        title: "Batch already completed",
        message:
          "This promotion batch has already been executed and cannot be executed again.",
      });

      return;
    }

    setConfirmBatch(batch);
  };

  // ==========================================================
  // EXECUTE PROMOTION
  // ==========================================================

  const handleExecutePromotion = async () => {
    if (!confirmBatch) {
      return;
    }

    const batch = confirmBatch;

    try {
      setExecutingId(batch.id);

      setConfirmBatch(null);

      setFeedback(null);

      const response = await executePromotion(batch.id);

      // ----------------------------------------------------
      // apiAction may return the response directly
      // ----------------------------------------------------

      if (response && typeof response === "object") {
        const data = response as Record<string, unknown>;

        if (data.ok === false) {
          throw new Error(JSON.stringify(response));
        }

        // --------------------------------------------------
        // Successful execution
        // --------------------------------------------------

        const promoted =
          typeof data.students_promoted === "number"
            ? data.students_promoted
            : 0;

        const graduated =
          typeof data.students_graduated === "number"
            ? data.students_graduated
            : 0;

        const processed =
          typeof data.students_processed === "number"
            ? data.students_processed
            : promoted + graduated;

        setFeedback({
          type: "success",
          title: "Promotion batch completed",
          message:
            typeof data.message === "string"
              ? data.message
              : `The batch was executed successfully. ${processed} student${
                  processed === 1 ? "" : "s"
                } processed.`,
          details: [
            `${promoted} student${promoted === 1 ? "" : "s"} promoted.`,
            ...(graduated > 0
              ? [`${graduated} student${graduated === 1 ? "" : "s"} graduated.`]
              : []),
          ],
        });
      } else {
        setFeedback({
          type: "success",
          title: "Promotion batch completed",
          message: "The promotion batch was executed successfully.",
        });
      }

      // ----------------------------------------------------
      // Refresh authoritative data
      // ----------------------------------------------------

      await loadData(false);

      toast.success("Promotion batch executed successfully.");
    } catch (error) {
      console.error("Failed to execute promotion:", error);

      const parsedFeedback = parseExecutionError(error);

      setFeedback(parsedFeedback);

      toast.error(parsedFeedback.title);
    } finally {
      setExecutingId(null);
    }
  };

  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  const handleBatchFormSuccess = async () => {
    setShowBatchForm(false);

    await loadData(false);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        bg-gray-50
        p-4
        sm:p-5
        md:p-6
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-7xl
          space-y-5
          md:space-y-6
        "
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="min-w-0">
            <h1
              className="
                text-xl
                font-bold
                text-gray-900
                sm:text-2xl
              "
            >
              Promotion Batches
            </h1>

            <p
              className="
                mt-1
                max-w-2xl
                text-sm
                leading-5
                text-gray-500
              "
            >
              Review and execute student promotion batches between academic
              sessions.
            </p>
          </div>

          <div
            className="
              flex
              w-full
              gap-2
              sm:w-auto
            "
          >
            <button
              type="button"
              onClick={() => router.back()}
              disabled={executingId !== null}
              className="
                inline-flex
                min-h-10
                flex-1
                items-center
                justify-center
                gap-2
                rounded-lg
                border
                bg-white
                px-3
                py-2
                text-sm
                font-medium
                text-gray-700
                shadow-sm
                transition
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:flex-none
                sm:px-4
              "
            >
              <ArrowLeft size={16} />

              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setShowBatchForm(true)}
              disabled={executingId !== null}
              className="
                inline-flex
                min-h-10
                flex-1
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-green-600
                px-3
                py-2
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-green-700
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:flex-none
                sm:px-4
              "
            >
              <Plus size={16} />

              <span>New Batch</span>
            </button>
          </div>
        </div>

        {/* ==================================================
            FEEDBACK
        ================================================== */}

        <FeedbackAlert feedback={feedback} onClose={() => setFeedback(null)} />

        {/* ==================================================
            RULE WARNING
        ================================================== */}

        {!initialLoading && isBlocked && (
          <div
            className="
                flex
                items-start
                gap-3
                rounded-xl
                border
                border-yellow-200
                bg-yellow-50
                p-4
                text-yellow-900
              "
          >
            <AlertCircle
              size={20}
              className="
                  mt-0.5
                  shrink-0
                  text-yellow-600
                "
            />

            <div className="min-w-0">
              <p className="font-semibold">
                Promotion rules are not configured
              </p>

              <p
                className="
                    mt-1
                    text-sm
                    leading-5
                    text-yellow-800
                  "
              >
                Configure the promotion outcome for each class before executing
                a batch. Classes can either be promoted to another class or
                marked for graduation.
              </p>

              <Link
                href="/admin/administration/promotions/rules"
                className="
                    mt-3
                    inline-flex
                    text-sm
                    font-semibold
                    text-yellow-900
                    underline
                    underline-offset-2
                    hover:no-underline
                  "
              >
                Configure promotion rules →
              </Link>
            </div>
          </div>
        )}

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-3
          "
        >
          <div
            className="
              rounded-xl
              border
              bg-white
              p-4
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-gray-500
                  "
                >
                  Promotion Rules
                </p>

                <p
                  className="
                    mt-1
                    text-2xl
                    font-bold
                    text-gray-900
                  "
                >
                  {rulesCount ?? "—"}
                </p>
              </div>

              <div
                className="
                  rounded-lg
                  bg-green-50
                  p-2
                "
              >
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
            </div>
          </div>

          <div
            className="
              rounded-xl
              border
              bg-white
              p-4
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-gray-500
                  "
                >
                  Total Batches
                </p>

                <p
                  className="
                    mt-1
                    text-2xl
                    font-bold
                    text-gray-900
                  "
                >
                  {batches.length}
                </p>
              </div>

              <div
                className="
                  rounded-lg
                  bg-blue-50
                  p-2
                "
              >
                <Play size={20} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div
            className="
              rounded-xl
              border
              bg-white
              p-4
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-gray-500
                  "
                >
                  Pending
                </p>

                <p
                  className="
                    mt-1
                    text-2xl
                    font-bold
                    text-orange-600
                  "
                >
                  {batches.filter((batch) => !batch.completed).length}
                </p>
              </div>

              <div
                className="
                  rounded-lg
                  bg-orange-50
                  p-2
                "
              >
                <AlertCircle size={20} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            TABLE / MOBILE LIST
        ================================================== */}

        <div
          className="
            overflow-hidden
            rounded-xl
            border
            bg-white
            shadow-sm
          "
        >
          {/* -----------------------------------------------
              DESKTOP TABLE
          ----------------------------------------------- */}

          <div className="hidden md:block">
            <table
              className="
                w-full
                text-sm
              "
            >
              <thead
                className="
                  border-b
                  bg-gray-50
                "
              >
                <tr>
                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      font-semibold
                      text-gray-700
                    "
                  >
                    From Session
                  </th>

                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      font-semibold
                      text-gray-700
                    "
                  >
                    To Session
                  </th>

                  <th
                    className="
                      px-4
                      py-3
                      text-left
                      font-semibold
                      text-gray-700
                    "
                  >
                    Status
                  </th>

                  <th
                    className="
                      px-4
                      py-3
                      text-right
                      font-semibold
                      text-gray-700
                    "
                  >
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {initialLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="
                        p-10
                        text-center
                        text-gray-500
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          justify-center
                          gap-2
                        "
                      >
                        <RefreshCw size={18} className="animate-spin" />
                        Loading promotion batches...
                      </div>
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10">
                      <div
                        className="
                          flex
                          flex-col
                          items-center
                          justify-center
                          text-center
                        "
                      >
                        <div
                          className="
                            rounded-full
                            bg-gray-100
                            p-3
                          "
                        >
                          <Info size={22} className="text-gray-500" />
                        </div>

                        <h3
                          className="
                            mt-3
                            font-semibold
                            text-gray-900
                          "
                        >
                          No promotion batches
                        </h3>

                        <p
                          className="
                            mt-1
                            max-w-md
                            text-sm
                            text-gray-500
                          "
                        >
                          Create a promotion batch to move students from one
                          academic session to another.
                        </p>

                        <button
                          type="button"
                          onClick={() => setShowBatchForm(true)}
                          className="
                            mt-4
                            inline-flex
                            items-center
                            gap-2
                            rounded-lg
                            bg-green-600
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            text-white
                            hover:bg-green-700
                          "
                        >
                          <Plus size={16} />
                          Create Batch
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => {
                    const isExecuting = executingId === batch.id;

                    const disabled =
                      isBlocked || batch.completed || executingId !== null;

                    return (
                      <tr
                        key={batch.id}
                        className="
                            border-b
                            last:border-b-0
                            hover:bg-gray-50
                          "
                      >
                        <td className="px-4 py-4">
                          <span className="font-medium text-gray-900">
                            {batch.from_session.name}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="font-medium text-gray-900">
                            {batch.to_session.name}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          {batch.completed ? (
                            <span
                              className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-full
                                  bg-green-100
                                  px-2.5
                                  py-1
                                  text-xs
                                  font-semibold
                                  text-green-700
                                "
                            >
                              <CheckCircle2 size={13} />
                              Completed
                            </span>
                          ) : (
                            <span
                              className="
                                  inline-flex
                                  items-center
                                  gap-1.5
                                  rounded-full
                                  bg-orange-100
                                  px-2.5
                                  py-1
                                  text-xs
                                  font-semibold
                                  text-orange-700
                                "
                            >
                              <AlertCircle size={13} />
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div
                            className="
                                flex
                                items-center
                                justify-end
                                gap-2
                              "
                          >
                            <Link
                              href={`/admin/administration/promotions/batches/${batch.id}`}
                              title="View batch"
                              className="
                                  inline-flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  border
                                  bg-white
                                  text-blue-600
                                  transition
                                  hover:bg-blue-50
                                "
                            >
                              <Eye size={17} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => requestExecute(batch)}
                              disabled={disabled}
                              title={
                                batch.completed
                                  ? "This batch has already been executed"
                                  : isBlocked
                                    ? "Configure promotion rules first"
                                    : "Execute promotion batch"
                              }
                              className="
                                  inline-flex
                                  min-h-9
                                  items-center
                                  justify-center
                                  gap-1.5
                                  rounded-lg
                                  bg-green-600
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-semibold
                                  text-white
                                  transition
                                  hover:bg-green-700
                                  disabled:cursor-not-allowed
                                  disabled:bg-gray-300
                                  disabled:text-gray-500
                                "
                            >
                              {isExecuting ? (
                                <>
                                  <RefreshCw
                                    size={14}
                                    className="animate-spin"
                                  />
                                  Executing...
                                </>
                              ) : batch.completed ? (
                                <>
                                  <CheckCircle2 size={14} />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <Play size={14} />
                                  Execute
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* -----------------------------------------------
              MOBILE CARDS
          ----------------------------------------------- */}

          <div
            className="
              divide-y
              md:hidden
            "
          >
            {initialLoading ? (
              <div
                className="
                  flex
                  min-h-[250px]
                  items-center
                  justify-center
                  p-6
                  text-sm
                  text-gray-500
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <RefreshCw size={18} className="animate-spin" />
                  Loading promotion batches...
                </div>
              </div>
            ) : batches.length === 0 ? (
              <div className="p-8 text-center">
                <div
                  className="
                    mx-auto
                    w-fit
                    rounded-full
                    bg-gray-100
                    p-3
                  "
                >
                  <Info size={22} className="text-gray-500" />
                </div>

                <h3
                  className="
                    mt-3
                    font-semibold
                    text-gray-900
                  "
                >
                  No promotion batches
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-5
                    text-gray-500
                  "
                >
                  Create a promotion batch to continue.
                </p>

                <button
                  type="button"
                  onClick={() => setShowBatchForm(true)}
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-green-600
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  <Plus size={16} />
                  Create Batch
                </button>
              </div>
            ) : (
              batches.map((batch) => {
                const isExecuting = executingId === batch.id;

                const disabled =
                  isBlocked || batch.completed || executingId !== null;

                return (
                  <div
                    key={batch.id}
                    className="
                        space-y-4
                        p-4
                      "
                  >
                    <div
                      className="
                          flex
                          items-start
                          justify-between
                          gap-3
                        "
                    >
                      <div
                        className="
                            min-w-0
                            flex-1
                          "
                      >
                        <p
                          className="
                              text-xs
                              font-medium
                              uppercase
                              tracking-wide
                              text-gray-500
                            "
                        >
                          Academic transition
                        </p>

                        <div
                          className="
                              mt-1
                              flex
                              flex-wrap
                              items-center
                              gap-2
                            "
                        >
                          <span
                            className="
                                font-semibold
                                text-gray-900
                              "
                          >
                            {batch.from_session.name}
                          </span>

                          <span className="text-gray-400">→</span>

                          <span
                            className="
                                font-semibold
                                text-gray-900
                              "
                          >
                            {batch.to_session.name}
                          </span>
                        </div>
                      </div>

                      {batch.completed ? (
                        <span
                          className="
                              inline-flex
                              shrink-0
                              items-center
                              gap-1
                              rounded-full
                              bg-green-100
                              px-2
                              py-1
                              text-[11px]
                              font-semibold
                              text-green-700
                            "
                        >
                          <CheckCircle2 size={12} />
                          Completed
                        </span>
                      ) : (
                        <span
                          className="
                              inline-flex
                              shrink-0
                              items-center
                              gap-1
                              rounded-full
                              bg-orange-100
                              px-2
                              py-1
                              text-[11px]
                              font-semibold
                              text-orange-700
                            "
                        >
                          <AlertCircle size={12} />
                          Pending
                        </span>
                      )}
                    </div>

                    <div
                      className="
                          grid
                          grid-cols-2
                          gap-2
                        "
                    >
                      <Link
                        href={`/admin/administration/promotions/batches/${batch.id}`}
                        className="
                            inline-flex
                            min-h-10
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            border
                            bg-white
                            px-3
                            py-2
                            text-sm
                            font-medium
                            text-blue-600
                            transition
                            hover:bg-blue-50
                          "
                      >
                        <Eye size={16} />
                        View
                      </Link>

                      <button
                        type="button"
                        onClick={() => requestExecute(batch)}
                        disabled={disabled}
                        className="
                            inline-flex
                            min-h-10
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            bg-green-600
                            px-3
                            py-2
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-green-700
                            disabled:cursor-not-allowed
                            disabled:bg-gray-300
                            disabled:text-gray-500
                          "
                      >
                        {isExecuting ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            Executing
                          </>
                        ) : batch.completed ? (
                          <>
                            <CheckCircle2 size={16} />
                            Completed
                          </>
                        ) : (
                          <>
                            <Play size={16} />
                            Execute
                          </>
                        )}
                      </button>
                    </div>

                    {isBlocked && !batch.completed && (
                      <p
                        className="
                              text-xs
                              leading-5
                              text-orange-600
                            "
                      >
                        Configure promotion rules before executing this batch.
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================================================
            REFRESH
        ================================================== */}

        {!initialLoading && batches.length > 0 && (
          <div
            className="
                flex
                justify-center
              "
          >
            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={refreshing || executingId !== null}
              className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-gray-600
                  shadow-sm
                  transition
                  hover:bg-gray-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        )}
      </div>

      {/* ======================================================
          CONFIRM EXECUTION MODAL
      ====================================================== */}

      {confirmBatch && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            p-4
            backdrop-blur-[2px]
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmBatch(null);
            }
          }}
        >
          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              bg-white
              p-5
              shadow-2xl
              sm:p-6
            "
          >
            <div
              className="
                flex
                items-start
                gap-3
              "
            >
              <div
                className="
                  shrink-0
                  rounded-full
                  bg-green-100
                  p-2.5
                "
              >
                <Play size={20} className="text-green-600" />
              </div>

              <div className="min-w-0">
                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-900
                  "
                >
                  Execute promotion batch?
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    leading-5
                    text-gray-500
                  "
                >
                  This action will process students from the source session
                  according to the configured promotion rules.
                </p>
              </div>
            </div>

            <div
              className="
                mt-5
                rounded-xl
                border
                bg-gray-50
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <p
                    className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    From session
                  </p>

                  <p
                    className="
                      mt-1
                      font-semibold
                      text-gray-900
                    "
                  >
                    {confirmBatch.from_session.name}
                  </p>
                </div>

                <div className="text-gray-400">→</div>

                <div className="text-right">
                  <p
                    className="
                      text-xs
                      font-medium
                      uppercase
                      tracking-wide
                      text-gray-500
                    "
                  >
                    To session
                  </p>

                  <p
                    className="
                      mt-1
                      font-semibold
                      text-gray-900
                    "
                  >
                    {confirmBatch.to_session.name}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="
                mt-4
                rounded-lg
                border
                border-yellow-200
                bg-yellow-50
                p-3
              "
            >
              <p
                className="
                  text-xs
                  leading-5
                  text-yellow-800
                "
              >
                <strong>Important:</strong> Once this batch is successfully
                executed, it cannot be executed again. Students configured for
                graduation will be graduated instead of receiving a
                target-session enrollment.
              </p>
            </div>

            <div
              className="
                mt-5
                flex
                flex-col-reverse
                gap-2
                sm:flex-row
                sm:justify-end
              "
            >
              <button
                type="button"
                onClick={() => setConfirmBatch(null)}
                className="
                  min-h-10
                  rounded-lg
                  border
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-gray-700
                  transition
                  hover:bg-gray-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecutePromotion}
                className="
                  inline-flex
                  min-h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-green-600
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-green-700
                "
              >
                <Play size={16} />
                Execute Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          BATCH FORM
      ====================================================== */}

      <PromotionBatchForm
        open={showBatchForm}
        onClose={() => setShowBatchForm(false)}
        onSuccess={handleBatchFormSuccess}
      />
    </div>
  );
}
