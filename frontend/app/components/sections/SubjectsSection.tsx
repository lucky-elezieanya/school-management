import { apiAction, apiHeaders, BASE_URL } from "@/app/lib/api";
import { getAccessToken } from "@/app/lib/auth";
import { Subject } from "@/app/lib/types";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SubjectsSection({
	subjects,
	count,
	next,
	previous,
	onNext,
	onPrevious,
	handleDelete,
}: {
	subjects: Subject[];
	count: number;
	next: string | null;
	previous: string | null;
	onNext: () => void;
	onPrevious: () => void;
	handleDelete: (
		route_base: string,
		route_name: string,
		id: number,
		item_name: string,
	) => void;
}) {
	const router = useRouter();

	// =========================
	// SEARCH STATE (ADDED)
	// =========================
	const [search, setSearch] = useState("");

	const [filteredSubjects, setFilteredSubjects] =
		useState<Subject[]>(subjects);

	// =========================
	// BACKEND SEARCH FETCH
	// =========================
	const fetchSubjects = async (searchTerm: string) => {
		try {
			const url = `${BASE_URL}/academics/subjects/?search=${searchTerm}`;
			const res = await fetch(url, {
				headers: apiHeaders(),
			});
			const data = await res.json();

			setFilteredSubjects(data.results || []);
		} catch (error) {
			console.error(error);
		}
	};

	// =========================
	// DEBOUNCED SEARCH
	// =========================
	useEffect(() => {
		const timeout = setTimeout(() => {
			fetchSubjects(search);
		}, 400);

		return () => clearTimeout(timeout);
	}, [search]);

	// =========================
	// SYNC WHEN PROP UPDATES
	// =========================
	useEffect(() => {
		setFilteredSubjects(subjects);
	}, [subjects]);

	return (
		<div className="space-y-6">
			{/* HEADER */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold text-gray-800">
						All Subjects
					</h2>

					<p className="text-gray-500 text-sm mt-1">
						Manage school subjects, assigned teachers and class
						assignments
					</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-semibold">
						Total Subjects: {count}
					</div>

					<Link
						href="/admin/administration/subjects/new"
						className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl transition font-medium"
					>
						+ Add Subject
					</Link>
				</div>
			</div>

			{/* ========================= */}
			{/* SEARCH INPUT (ADDED) */}
			{/* ========================= */}
			<div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
				<input
					type="text"
					placeholder="Search subjects by name or code..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
				/>
			</div>

			{/* MOBILE CARDS */}
			<div className="grid grid-cols-1 gap-5 lg:hidden">
				{filteredSubjects.length > 0 ? (
					filteredSubjects.map((subject) => (
						<div
							key={subject.id}
							className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
						>
							<div className="flex items-start justify-between mb-4">
								<div>
									<h3 className="text-xl font-bold text-gray-800">
										{subject.name}
									</h3>

									<p className="text-sm text-gray-500">
										Code: {subject.code || "N/A"}
									</p>
								</div>

								<div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
									Subject
								</div>
							</div>

							<div className="flex gap-2 mt-5">
								<Link
									href={`/admin/administration/subjects/${subject.id}/edit`}
									className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-center py-2 rounded-xl transition text-sm font-medium"
								>
									Edit
								</Link>

								<button
									onClick={() =>
										handleDelete(
											"academics",
											"subjects",
											subject.id,
											"Subject",
										)
									}
									className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-700 transition"
								>
									<Trash2 size={18} />
								</button>
							</div>
						</div>
					))
				) : (
					<div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
						<p className="text-gray-500">No subjects found</p>
					</div>
				)}
			</div>

			{/* DESKTOP TABLE */}
			<div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 bg-white">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50 border-b border-gray-200">
							<tr>
								<th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
									Subject
								</th>

								<th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
									Code
								</th>

								<th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
									Actions
								</th>
							</tr>
						</thead>

						<tbody>
							{filteredSubjects.length > 0 ? (
								filteredSubjects.map((subject) => (
									<tr
										key={subject.id}
										className="border-b border-gray-100 hover:bg-gray-50 transition"
									>
										<td className="px-6 py-5">
											<p className="font-semibold text-gray-800">
												{subject.name}
											</p>
										</td>

										<td className="px-6 py-5">
											<span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
												{subject.code || "N/A"}
											</span>
										</td>

										<td className="px-6 py-5">
											<div className="flex gap-2">
												<Link
													href={`/admin/administration/subjects/${subject.id}/edit`}
													className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition text-sm"
												>
													Edit
												</Link>

												<button
													onClick={() =>
														handleDelete(
															"academics",
															"subjects",
															subject.id,
															"Subject",
														)
													}
													className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-700 transition"
												>
													<Trash2 size={18} />
												</button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={6}
										className="text-center py-12 text-gray-500"
									>
										No subjects found
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* PAGINATION */}
			<div className="flex items-center justify-between pt-2">
				<button
					onClick={onPrevious}
					disabled={!previous}
					className={`px-5 py-2.5 rounded-xl text-white transition ${
						previous
							? "bg-gray-700 hover:bg-gray-800"
							: "bg-gray-300 cursor-not-allowed"
					}`}
				>
					← Previous
				</button>

				<button
					onClick={onNext}
					disabled={!next}
					className={`px-5 py-2.5 rounded-xl text-white transition ${
						next
							? "bg-purple-600 hover:bg-purple-700"
							: "bg-gray-300 cursor-not-allowed"
					}`}
				>
					Next →
				</button>
			</div>
		</div>
	);
}
