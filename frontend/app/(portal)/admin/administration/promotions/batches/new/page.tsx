"use client";

import { useEffect, useState } from "react";
import {
	getPromotionBatches,
} from "@/app/services/promotions";

import Link from "next/link";
import { Eye, Plus } from "lucide-react";

export default function BatchesPage() {
	const [batches, setBatches] = useState([]);

	useEffect(() => {
		const load = async () => {
			const res = await getPromotionBatches();
			setBatches(res.results || []);
		};

		load();
	}, []);

	return (
		<div className="p-4 md:p-6 space-y-4">
			<div className="flex justify-between">
				<h1 className="font-bold text-xl">
					Promotion Batches
				</h1>

				<Link
					href="/admin/administration/promotions/batches/new"
					className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
				>
					<Plus size={16} />
					New Batch
				</Link>
			</div>

			<div className="bg-white rounded-xl shadow overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-gray-100">
						<tr>
							<th className="p-3">From</th>
							<th className="p-3">To</th>
							<th className="p-3">Status</th>
							<th className="p-3 text-center">
								Action
							</th>
						</tr>
					</thead>

					<tbody>
						{batches.map((b: any) => (
							<tr key={b.id} className="border-t">
								<td className="p-3">
									{b.from_session.name}
								</td>
								<td className="p-3">
									{b.to_session.name}
								</td>
								<td className="p-3">
									{b.completed
										? "Completed"
										: "Pending"}
								</td>

								<td className="p-3 text-center">
									<Link
										href={`/admin/administration/promotions/batches/${b.id}`}
										className="text-blue-600"
									>
										<Eye size={16} />
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}