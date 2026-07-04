import { TeacherType } from "@/app/lib/types";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

export default function TeachersSection({
	teachers,
	next,
	previous,
	count,
	onNext,
	onPrevious,
	handleDelete,
	setTeachers,
}: {
	teachers: TeacherType[];
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
	setTeachers: Dispatch<SetStateAction<TeacherType[]>>;
}) {
	const router = useRouter();
	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<div>
					<h2 className="text-lg font-semibold">All Students</h2>

					<p className="text-sm text-gray-500">
						Total teachers: {count}
					</p>
				</div>

				<Link
					href="/admin/administration/teachers/new"
					className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
				>
					Add Teacher
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
							<th className="p-3">Qualification</th>
							<th className="p-3">Phone Number</th>
							<th className="p-3">Email</th>
							<th className="p-3">Actions</th>
						</tr>
					</thead>

					<tbody>
						{teachers.length > 0 ? (
							teachers.map((teacher: TeacherType) => (
								<tr
									key={teacher.id}
									className="border-t hover:bg-gray-50 transition"
								>
									<td className="p-3">
										<img
											src={
												teacher.user.profile_picture ||
												"/avatar.png"
											}
											alt="Student"
											className="w-10 h-10 rounded-full object-cover"
										/>
									</td>

									<td className="p-3">
										{teacher.user.username}
									</td>

									<td className="p-3">
										{teacher.user.first_name}{" "}
										{teacher.user.middle_name}
										{teacher.user.last_name}
									</td>

									<td className="p-3 capitalize">
										{teacher.user.gender}
									</td>

									<td className="p-3">
										{teacher.qualification}
									</td>
									<td className="p-3">
										{teacher.phone_number}
									</td>
									<td className="p-3">
										{teacher.user.email}
									</td>

									<td className="p-3">
										<div className="flex gap-2">
											<Link
												href={`/admin/administration/teachers/${teacher.id}`}
												className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
											>
												View
											</Link>

											<Link
												href={`/admin/administration/teachers/${teacher.id}/edit`}
												className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
											>
												Edit
											</Link>
											<button
												onClick={() => {
													handleDelete(
														"academics",
														"teachers",
														teacher.id,
														"Teacher",
													);
													setTeachers((prev) =>
														prev.filter(
															(teacher) =>
																teacher.id !==
																teacher.id,
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
									No teachers found
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
					className={`px-4 py-2 rounded-lg text-white inline-flex gap-2 transition ${
						previous
							? "bg-gray-700 hover:bg-gray-800"
							: "bg-gray-300 cursor-not-allowed"
					}`}
				>
					<ArrowLeft /> <span>Previous</span>
				</button>

				<button
					onClick={onNext}
					disabled={!next}
					className={`px-4 py-2 rounded-lg text-white inline-flex gap-2 transition ${
						next
							? "bg-blue-600 hover:bg-blue-700"
							: "bg-gray-300 cursor-not-allowed"
					}`}
				>
					<span>Next </span>
					<ArrowRight size={24} />
				</button>
			</div>
		</div>
	);
}
