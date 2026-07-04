import { StudentType } from "@/app/lib/types";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

export default function StudentsSection({
	students,
	next,
	previous,
	count,
	onNext,
	onPrevious,
	handleDelete,
	setStudents,
}: {
	students: StudentType[];
	next: string | null;
	previous: string | null;
	count: number;
	onNext: () => void;
	onPrevious: () => void;
	handleDelete: (
		route_base: string,
		route_name: string,
		id: number,
		item_name: string,
	) => void;
	setStudents: Dispatch<SetStateAction<StudentType[]>>;
}) {
	const router = useRouter();
    
	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-lg font-semibold">All Students</h2>

					<p className="text-sm text-gray-500">
						Total Students: {count}
					</p>
				</div>

				<Link
					href="/admin/administration/students/new"
					className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
				>
					Add Student
				</Link>
			</div>

			<div className="overflow-x-auto rounded-xl border border-gray-200">
				<table className="w-full text-sm text-left">
					<thead className="bg-gray-100">
						<tr>
							<th className="p-3">Photo</th>
							<th className="p-3">Username</th>
							<th className="p-3">Full Name</th>
							<th className="p-3">Gender</th>
							<th className="p-3">Class</th>
							<th className="p-3">Admission Number</th>
							<th className="p-3">Actions</th>
						</tr>
					</thead>

					<tbody>
						{students.length > 0 ? (
							students.map((student) => (
								<tr
									key={student.id}
									className="border-t hover:bg-gray-50 transition"
								>
									<td className="p-3">
										<img
											src={
												student.user.profile_picture ||
												"/avatar.png"
											}
											alt="Student"
											className="w-10 h-10 rounded-full object-cover"
										/>
									</td>

									<td className="p-3">
										{student.user.username}
									</td>

									<td className="p-3">
										{student.user.full_name}
									</td>

									<td className="p-3 capitalize">
										{student.user.gender}
									</td>

									<td className="p-3">
										{student.current_class?.name || "N/A"}
									</td>

									<td className="p-3">
										{student.admission_number}
									</td>

									<td className="p-3">
										<div className="flex gap-2">
											<Link
												href={`/admin/administration/students/${student.id}`}
												className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
											>
												View
											</Link>

											<Link
												href={`/admin/administration/students/${student.id}/edit`}
												className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
											>
												Edit
											</Link>
											<button
												onClick={async () => {
													handleDelete(
														"academics",
														"students",
														student.id,
														"student",
													);

													setStudents((prev) =>
														prev.filter(
															(student) =>
																student.id !==
																student.id,
														),
													);
													router.refresh();
												}}
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
									colSpan={7}
									className="text-center p-6 text-gray-500"
								>
									No students found
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* PAGINATION */}
			<div className="flex items-center justify-between mt-6">
				<button
					onClick={onPrevious}
					disabled={!previous}
					className={`px-4 py-2 rounded-lg text-white transition ${
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
					className={`px-4 py-2 rounded-lg text-white transition ${
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
