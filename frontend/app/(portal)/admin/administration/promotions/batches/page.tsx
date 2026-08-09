"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Eye, Plus } from "lucide-react";

import {
  executePromotion,
  getPromotionBatches,
  getPromotionRecords,
  getPromotionRules,
} from "@/app/services/promotions";
import PromotionBatchForm from "@/app/components/forms/PromotionBatchForm";

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

export default function BatchesPage() {
  const router = useRouter();

  const [rulesCount, setRulesCount] = useState<number | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all necessary page data in a single coordinated request
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [rulesRes, batchesRes] = await Promise.all([
        getPromotionRules(),
        getPromotionBatches(),
      ]);

      setRulesCount(rulesRes.count ?? 0);
      setBatches(batchesRes.results ?? []);
    } catch (err) {
      setError("Failed to load promotion data.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Block promotion execution only if rules are missing
  const isBlocked = rulesCount === 0;

  const handleExecutePromotion = async (batchId: number) => {
    if (isBlocked) {
      setError("Promotion rules must be configured before proceeding.");
      return;
    }

    try {
      setExecutingId(batchId);
      setError(null);

      const res = await executePromotion(batchId);
      if (!res.ok) {
        setError(res.message || "Failed to execute promotion.");
      } else {
        // Refresh batches list after execution
        await loadData();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* WARNING WHEN BLOCKED (Hidden while loading) */}
      {!initialLoading && isBlocked && !error && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 p-3 rounded-lg">
          Promotion cannot run. Rules must be set before proceeding.
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="font-bold text-xl">Promotion Batches</h1>
        <div className="flex flex-row gap-4">
          <button
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <ArrowLeftIcon size={16} />
            Back
          </button>
          <button
            onClick={() => setShowBatchForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={16} />
            New Batch
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">From Session</th>
              <th className="p-3 text-left">To Session</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {initialLoading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Loading promotion batches...
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No promotion batches found.
                </td>
              </tr>
            ) : (
              batches.map((b) => {
                const isExecuting = executingId === b.id;
                const isDisabled = isBlocked || b.completed || isExecuting;

                return (
                  <tr key={b.id} className="border-t">
                    <td className="p-3">{b.from_session.name}</td>
                    <td className="p-3">{b.to_session.name}</td>
                    <td className="p-3">
                      {b.completed ? "Completed" : "Pending"}
                    </td>

                    <td className="p-3 flex flex-row gap-2 items-center">
                      <Link
                        href={`/admin/administration/promotions/batches/${b.id}`}
                        className="text-blue-600"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleExecutePromotion(b.id)}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 text-xs lg:text-sm rounded-lg font-bold transition ${
                          isDisabled
                            ? "bg-gray-400 text-gray-100 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {b.completed
                          ? "Already executed"
                          : isExecuting
                            ? "Executing..."
                            : "Execute promotion"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PromotionBatchForm
        open={showBatchForm}
        onClose={() => setShowBatchForm(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
