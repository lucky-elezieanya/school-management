import { ClassType } from "@/app/lib/types";
import Link from "next/link";

export default function ClassesSection({
	classes,
	count,
	next,
	previous,
	onNext,
	onPrevious,
}: {
	classes: ClassType[];
	count: number;
	next: string | null;
	previous: string | null;
	onNext: () => void;
	onPrevious: () => void;
}) {
	return (
		<div className="space-y-6">
			{/* HEADER */}
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold text-gray-800">
						All Classes
					</h2>

					<p className="text-gray-500 text-sm mt-1">
						Manage classes, assigned teachers and students
					</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">
						Total Classes: {count}
					</div>

					<Link
						href="/admin/administration/classes/new"
						className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl transition font-medium"
					>
						+ Add Class
					</Link>
				</div>
			</div>

			{/* MOBILE CARDS */}
			<div className="grid grid-cols-1 gap-5 lg:hidden">
				{classes.length > 0 ? (
					classes.map((cls) => (
						<div
							key={cls.id}
							className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
						>
							{/* TOP */}
							<div className="flex items-start justify-between mb-4">
								<div>
									<h3 className="text-xl font-bold text-gray-800">
										{cls.name}
									</h3>

									<p className="text-sm text-gray-500">
										{cls.arm?.name || "No arm"}
									</p>
								</div>

								<div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
									Class
								</div>
							</div>

							{/* DESCRIPTION */}
							<div className="mb-4">
								<p className="text-sm text-gray-600 line-clamp-3">
									{cls.description ||
										"No description available"}
								</p>
							</div>

							{/* CLASS TEACHER */}
							<div className="mb-4">
								<p className="text-xs uppercase text-gray-400 mb-1">
									Class Teacher
								</p>

								<div className="bg-gray-50 rounded-xl p-3">
									{cls.class_teacher ? (
										<div>
											<p className="font-semibold text-gray-800">
												Teacher ID:{" "}
												{cls.class_teacher.id}
											</p>

											<p className="text-sm text-gray-500">
												Employed:{" "}
												{cls.class_teacher
													.date_employed || "N/A"}
											</p>
										</div>
									) : (
										<p className="text-sm text-red-500">
											No teacher assigned
										</p>
									)}
								</div>
							</div>

							{/* ACTIONS */}
							<div className="flex gap-2 mt-5">
								<Link
									href={`/admin/administration/classes/${cls.id}`}
									className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-xl transition text-sm font-medium"
								>
									View
								</Link>

								<Link
									href={`/admin/administration/classes/${cls.id}/edit`}
									className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-center py-2 rounded-xl transition text-sm font-medium"
								>
									Edit
								</Link>
							</div>
						</div>
					))
				) : (
					<div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
						<p className="text-gray-500">No classes found</p>
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
									Class Name
								</th>

								<th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
									Arm
								</th>

								<th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
									Class Teacher
								</th>

								<th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
									Description
								</th>

								<th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
									Actions
								</th>
							</tr>
						</thead>

						<tbody>
							{classes.length > 0 ? (
								classes.map((cls) => (
									<tr
										key={cls.id}
										className="border-b border-gray-100 hover:bg-gray-50 transition"
									>
										<td className="px-6 py-5">
											<div>
												<p className="font-semibold text-gray-800">
													{cls.name}
												</p>
											</div>
										</td>

										<td className="px-6 py-5">
											<span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
												{cls.arm.name || "N/A"}
											</span>
										</td>

										<td className="px-6 py-5">
											{cls.class_teacher ? (
												<div>
													<p className="font-medium text-gray-800">
														Teacher ID:{" "}
														{cls.class_teacher.id}
													</p>

													<p className="text-sm text-gray-500">
														{
															cls.class_teacher
																.date_employed
														}
													</p>
												</div>
											) : (
												<p className="text-red-500 text-sm">
													No teacher assigned
												</p>
											)}
										</td>

										<td className="px-6 py-5 max-w-sm">
											<p className="text-sm text-gray-600 line-clamp-2">
												{cls.description ||
													"No description"}
											</p>
										</td>

										<td className="px-6 py-5">
											<div className="flex gap-2">
												<Link
													href={`/admin/administration/classes/${cls.id}`}
													className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
												>
													View
												</Link>

												<Link
													href={`/admin/administration/classes/${cls.id}/edit`}
													className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition text-sm"
												>
													Edit
												</Link>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={5}
										className="text-center py-12 text-gray-500"
									>
										No classes found
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
							? "bg-blue-600 hover:bg-blue-700"
							: "bg-gray-300 cursor-not-allowed"
					}`}
				>
					Next →
				</button>
			</div>
		</div>
	);
}
