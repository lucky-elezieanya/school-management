"use client";

import { useEffect, useMemo, useState } from "react";
import { getPromotionRecords } from "@/app/services/promotions";

import {
	Search,
	Filter,
	ArrowUpRight,
	RotateCcw,
	GraduationCap,
	ArrowLeftRight,
    ArrowLeftIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PromotionRecordsPage() {
    const router = useRouter()
	const [records, setRecords] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");

	/* =========================
	   LOAD RECORDS
	========================= */
	const load = async () => {
		setLoading(true);
		const res = await getPromotionRecords();
		setRecords(res.results || []);
		setLoading(false);
	};

	useEffect(() => {
		load();
	}, []);

	/* =========================
	   FILTER LOGIC
	========================= */
	const filtered = useMemo(() => {
		return records.filter((r) => {
			const matchesSearch = r.student_name
				.toLowerCase()
				.includes(search.toLowerCase());

			const matchesStatus =
				statusFilter === "ALL" || r.status === statusFilter;

			return matchesSearch && matchesStatus;
		});
	}, [records, search, statusFilter]);

	/* =========================
	   STATUS BADGE
	========================= */
	const statusBadge = (status: string) => {
		switch (status) {
			case "PROMOTED":
				return "bg-green-100 text-green-700";
			case "REPEATED":
				return "bg-yellow-100 text-yellow-700";
			case "GRADUATED":
				return "bg-blue-100 text-blue-700";
			case "TRANSFERRED":
				return "bg-purple-100 text-purple-700";
			default:
				return "bg-gray-100 text-gray-600";
		}
	};

	const statusIcon = (status: string) => {
		switch (status) {
			case "PROMOTED":
				return <ArrowUpRight size={14} />;
			case "REPEATED":
				return <RotateCcw size={14} />;
			case "GRADUATED":
				return <GraduationCap size={14} />;
			case "TRANSFERRED":
				return <ArrowLeftRight size={14} />;
			default:
				return null;
		}
	};

	/* =========================
	   UI
	========================= */
	return (
		<div className="p-4 md:p-6 space-y-4">
            <div className="flex justify-between">

			<h1 className="text-xl font-bold">
				Promotion Records (Audit Trail)
			</h1>
			<button
				onClick={() => router.back()}
				className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
			>
				<ArrowLeftIcon size={16} />
				Back
			</button>{" "}
            </div>
			{/* =========================
			   FILTER BAR
			========================= */}
			<div className="bg-white p-3 rounded-xl shadow border flex flex-col md:flex-row gap-3 md:items-center justify-between">
				{/* SEARCH */}
				<div className="flex items-center gap-2 border px-3 py-2 rounded-lg w-full md:w-1/2">
					<Search size={16} />
					<input
						className="w-full outline-none"
						placeholder="Search student..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				{/* FILTER */}
				<div className="flex items-center gap-2">
					<Filter size={16} />

					<select
						className="border px-3 py-2 rounded-lg"
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="ALL">All Status</option>
						<option value="PROMOTED">Promoted</option>
						<option value="REPEATED">Repeated</option>
						<option value="GRADUATED">Graduated</option>
						<option value="TRANSFERRED">Transferred</option>
					</select>
				</div>
			</div>
			{/* =========================
			   DESKTOP TABLE
			========================= */}
			<div className="hidden md:block bg-white rounded-xl shadow border overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-gray-100">
						<tr>
							<th className="p-3 text-left">Student</th>
							<th className="p-3 text-left">Batch</th>
							<th className="p-3 text-left">From</th>
							<th className="p-3 text-left">To</th>
							<th className="p-3 text-center">Status</th>
							<th className="p-3 text-left">Date</th>
						</tr>
					</thead>

					<tbody>
						{filtered.map((r) => (
							<tr
								key={r.id}
								className="border-t hover:bg-gray-50"
							>
								<td className="p-3 font-medium">
									{r.student_name}
								</td>
								<td className="p-3 font-medium">{r.batch}</td>

								<td className="p-3">{r.from_class && r.from_class.name || r.status}</td>

								<td className="p-3">
									{r.to_class && r.to_class.name || r.status}
								</td>

								<td className="p-3 text-center">
									<span
										className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(
											r.status,
										)}`}
									>
										{statusIcon(r.status)}
										{r.status}
									</span>
								</td>

								<td className="p-3 text-gray-500">
									{new Date(
										r.created_at,
									).toLocaleDateString()}
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{filtered.length === 0 && (
					<p className="p-4 text-gray-500">No records found</p>
				)}
			</div>
			{/* =========================
			   MOBILE CARDS
			========================= */}
			<div className="md:hidden space-y-3">
				{filtered.map((r) => (
					<div
						key={r.id}
						className="bg-white p-4 rounded-xl shadow border space-y-2"
					>
						<div className="flex justify-between">
							<p className="font-semibold">{r.student_name}</p>

							<span
								className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(
									r.status,
								)}`}
							>
								{statusIcon(r.status)}
								{r.status}
							</span>
						</div>

						<p className="text-sm text-gray-600">
							From: {r.from_class && r.from_class.name || "-"}
						</p>

						<p className="text-sm text-gray-600">
							To: {r.to_class && r.to_class.name || r.status}
						</p>
						<p className="text-sm text-gray-600">
							Batch: {r.batch || "—"}
						</p>

						<p className="text-xs text-gray-400">
							{new Date(r.created_at).toLocaleString()}
						</p>
					</div>
				))}

				{filtered.length === 0 && (
					<p className="text-gray-500 text-center">
						No records found
					</p>
				)}
			</div>
			{/* =========================
			   LOADING STATE
			========================= */}
			{loading && <p className="text-gray-500">Loading records...</p>}
		</div>
	);
}
