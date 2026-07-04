"use client";

import { useEffect, useState } from "react";
import {
	executePromotion,
	getPromotionBatches,
	getPromotionRecords,
	getPromotionRules,
} from "@/app/services/promotions";
import PromotionBatchForm from "@/app/components/forms/PromotionBatchForm";

import Link from "next/link";
import { ArrowLeftIcon, Eye, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BatchesPage() {
    const router = useRouter()
	const [rulesCount, setRulesCount] = useState(0);
	const [batchesCount, setBatchesCount] = useState(0);
	const [recordsCount, setRecordsCount] = useState(0);
	const [batches, setBatches] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showBatchForm, setShowBatchForm] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isBlocked = rulesCount === 0 || batchesCount === 0;

	const load = async () => {
		try {
			const [rules, batches, records] = await Promise.all([
				getPromotionRules(),
				getPromotionBatches(),
				getPromotionRecords(),
			]);

			setRulesCount(rules.count || 0);
			setBatchesCount(batches.count || 0);
			setRecordsCount(records.count || 0);
		} catch (err) {
			setError("Failed to load promotion data");
		}
	};

	useEffect(() => {
		load();
	}, []);

	const loadBatches = async () => {
		const res = await getPromotionBatches();
		setBatches(res.results || []);
	};

	useEffect(() => {
		loadBatches();
	}, []);

	const handleExecutePromotion = async (batchId: number) => {
		if (isBlocked) {
			setError(
				"Rules and promotion batches must be set before proceeding.",
			);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			const res = await executePromotion(batchId);
			if (!res.ok) {
				setError(res.message || "Something went wrong");
			}
			// optional: reload data after execution
			await load();
		} catch (err: any) {
			setError(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const load = async () => {
			const res = await getPromotionBatches();
			setBatches(res.results || []);
		};

		load();
	}, []);

	return (
		<div className="p-4 md:p-6 space-y-4">
			{/* ERROR MESSAGE */}
			{error && (
				<div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg">
					{error}
				</div>
			)}

			{/* WARNING WHEN BLOCKED */}
			{isBlocked && !error && (
				<div className="bg-yellow-100 border border-yellow-300 text-yellow-700 p-3 rounded-lg">
					Promotion cannot run. Rules and batches must be set before
					proceeding.
				</div>
			)}
			<div className="flex justify-between">
				<h1 className="font-bold text-xl">Promotion Batches</h1>
                <div className="flex flex-row gap-4">

				<button
					onClick={() => router.back()}
					className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
				>
					<ArrowLeftIcon size={16} />
					 Back
				</button>{" "}
				<button
					onClick={() => setShowBatchForm(true)}
					className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
				>
					<Plus size={16} />
					New Batch
				</button>{" "}
                </div>
			</div>

			<div className="bg-white rounded-xl shadow overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-gray-100">
						<tr>
							<th className="p-3 text-left">From Session</th>
							<th className="p-3 text-left">To Session</th>
							<th className="p-3 text-left">Status</th>
							<th className="p-3  text-left">Action</th>
						</tr>
					</thead>

					<tbody>
						{batches.map((b: any) => (
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
										onClick={() =>
											handleExecutePromotion(b.id)
										}
										disabled={
											isBlocked || loading || b.completed
										}
										className={`px-2 py-2 text-[12px] lg:text-[14px] rounded-lg font-bold transition ${
											isBlocked || loading || b.completed
												? "bg-gray-400 text-gray-100 cursor-not-allowed"
												: "bg-green-600 text-white hover:bg-green-700"
										}`}
									>
										{b.completed
											? "Already executed"
											: loading
												? "Executing..."
												: "Execute promotion"}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<PromotionBatchForm
				open={showBatchForm}
				onClose={() => setShowBatchForm(false)}
				onSuccess={loadBatches}
			/>
		</div>
	);
}
