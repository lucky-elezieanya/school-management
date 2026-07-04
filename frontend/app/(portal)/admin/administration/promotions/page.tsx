"use client";

import Link from "next/link";
import { ArrowUpCircle, FileText, Users } from "lucide-react";
import { useEffect, useState } from "react";

import {
	getPromotionBatches,
	getPromotionRules,
	getPromotionRecords,
} from "@/app/services/promotions";

export default function PromotionDashboard() {
	const [rulesCount, setRulesCount] = useState(0);
	const [batchesCount, setBatchesCount] = useState(0);
	const [recordsCount, setRecordsCount] = useState(0);

	const [error, setError] = useState<string | null>(null);

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

	return (
		<div className="p-6 space-y-6">
			{/* ERROR MESSAGE */}
			{error && (
				<div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg">
					{error}
				</div>
			)}

			{/* HEADER */}
			<div className="flex justify-between w-full items-center p-2">
				<h1 className="text-xl lg:text-2xl font-bold text-gray-800">
					Student Promotions
				</h1>
			</div>

			{/* STATS */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* RULES */}
				<div className="bg-white p-5 rounded-xl shadow border">
					<FileText className="text-blue-600" />
					<p className="text-gray-500 mt-2">Promotion Rules</p>
					<h2 className="text-2xl font-bold">{rulesCount}</h2>

					<Link
						href="/admin/administration/promotions/rules"
						className="text-blue-600 text-sm"
					>
						Manage Rules →
					</Link>
				</div>

				{/* BATCHES */}
				<div className="bg-white p-5 rounded-xl shadow border">
					<ArrowUpCircle className="text-green-600" />
					<p className="text-gray-500 mt-2">Promotion Batches</p>
					<h2 className="text-2xl font-bold">{batchesCount}</h2>

					<Link
						href="/admin/administration/promotions/batches"
						className="text-green-600 text-sm"
					>
						View Batches →
					</Link>
				</div>

				{/* RECORDS */}
				<div className="bg-white p-5 rounded-xl shadow border">
					<Users className="text-purple-600" />
					<p className="text-gray-500 mt-2">Promotion Records</p>
					<h2 className="text-2xl font-bold">{recordsCount}</h2>

					<Link
						href="/admin/administration/promotions/records"
						className="text-purple-600 text-sm"
					>
						View History →
					</Link>
				</div>
			</div>
		</div>
	);
}
