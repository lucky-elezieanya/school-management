"use client";

import { useEffect, useState } from "react";
import {
	getPromotionRules,
	deletePromotionRule,
	createPromotionRule,
} from "@/app/services/promotions";
import PromotionRuleForm from "@/app/components/forms/PromotionRuleForm";

import { Trash2, Plus, ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PromotionRulesPage() {
	const router = useRouter();
	const [rules, setRules] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);

	const load = async () => {
		setLoading(true);
		const res = await getPromotionRules();
		setRules(res.results || []);
		setLoading(false);
	};

	useEffect(() => {
		load();
	}, []);

	const handleDelete = async (id: number, promotionName: string) => {
		await deletePromotionRule(id, promotionName);
		load();
	};

	return (
		<div className="p-4 md:p-6 space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-xl font-bold">Promotion Rules</h1>
				<div className="flex justify-between gap-4">
					<button
						onClick={() => router.back()}
						className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
					>
						<ArrowLeftIcon size={16} />
						Back
					</button>{" "}
					<button
						onClick={() => setShowForm(!showForm)}
						className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
					>
						<Plus size={16} />
						Add Rule
					</button>
				</div>
			</div>

			{/* FORM */}
			{showForm && (
				<div className="bg-white p-4 rounded-xl shadow border">
					<PromotionRuleForm
						onSubmit={async (data: any) => {
							await createPromotionRule(data);

							setShowForm(false);
							load();
						}}
					/>
				</div>
			)}

			{/* TABLE */}
			<div className="bg-white rounded-xl shadow border overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-gray-100">
						<tr>
							<th className="p-3 text-left">From</th>
							<th className="p-3 text-left">To</th>
							<th className="p-3 text-left">Status</th>
							<th className="p-3 text-center">Action</th>
						</tr>
					</thead>

					<tbody>
						{rules.map((r) => (
							<tr key={r.id} className="border-t">
								<td className="p-3">{r.from_class.name} {r.from_class.arm.name}</td>

								<td className="p-3">{r.to_class.name} {r.to_class.arm.name}</td>

								<td className="p-3">
									{r.is_active ? (
										<span className="text-green-600">
											Active
										</span>
									) : (
										<span className="text-red-500">
											Inactive
										</span>
									)}
								</td>

								<td className="p-3 text-center">
									<button
										onClick={() =>
											handleDelete(
												r.id,
												`Promotion: ${r.from_class.name} to ${r.to_class.name}`,
											)
										}
										className="text-red-500"
									>
										<Trash2 size={16} />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{loading && <p className="text-gray-500">Loading rules...</p>}
		</div>
	);
}
