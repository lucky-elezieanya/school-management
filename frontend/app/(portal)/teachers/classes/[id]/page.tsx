"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { apiAction } from "@/app/lib/api";

import {
	ArrowLeft,
	Users,
	UserCog,
	BookOpen,
	CalendarDays,
	Mail,
	Phone,
} from "lucide-react";
import { useAuth } from "@/app/lib/hooks/useAuth";
import {
	fetchSubjects,
} from "@/app/services/results";

import { fetchStudents } from "@/app/services/academics";

import { ClassType, StudentType, SubjectType } from "@/app/lib/types";

export default function IndividualClassPage() {
	const params = useParams<{ id: string }>();
	const { currentTerm } = useAuth();
	const classId = params.id;

	const [loading, setLoading] = useState(true);

	const [classData, setClassData] = useState<ClassType | null>(null);

	const [students, setStudents] = useState<any[]>([]);

	const [subjects, setSubjects] = useState<SubjectType[]>([]);

	/* STUDENTS */
	const getStudents = async () => {
		const studentsData =
			currentTerm &&
			(await fetchStudents(Number(classId), currentTerm.session.id));

		setStudents(studentsData.students || studentsData);
	};

	const fetchClasses = async () => {
		/* CLASS DETAILS */
		const cls = await apiAction("academics", "classes", Number(classId));
		setClassData(cls);
	};
	const getSubjects = async () => {
		/* SUBJECTS */
		const subjectsData =
			currentTerm &&
			(await fetchSubjects(Number(classId), Number(currentTerm?.id)));

		setSubjects(subjectsData.subjects || subjectsData);
	};

	/* =========================
        FETCH CLASS DATA
    ========================== */

	const fetchData = async () => {
		try {
			setLoading(true);

			await fetchClasses();

			await getStudents();

			await getSubjects();
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (classId) {
			fetchData();
		}
	}, [classId]);

	/* =========================
        LOADING
    ========================== */

	// if (loading) {
	// 	return (
	// 		<div className="min-h-screen flex items-center justify-center bg-gray-100">
	// 			<div className="text-center">
	// 				<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>

	// 				<p className="mt-4 text-gray-600">Loading class data...</p>
	// 			</div>
	// 		</div>
	// 	);
	// }

	return (
		<div className="min-h-screen bg-gray-100 p-4 md:p-8">
			<div className="max-w-7xl mx-auto space-y-8">
				{/* =========================
                    HEADER
                ========================== */}

				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
					<div>
						<div className="flex items-center gap-3 mb-3">
							<Link
								href="/teachers"
								className="w-10 h-10 rounded-xl bg-white shadow flex items-center justify-center hover:bg-gray-100 transition"
							>
								<ArrowLeft size={20} />
							</Link>

							<div className="inline-flex gap-3">
								<h1 className="text-3xl font-bold text-gray-800">
									{classData?.name}
								</h1>

								<p className="text-gray-800 font-bold text-3xl">
									{classData?.arm?.name}
								</p>
							</div>
							<p className="text-gray-600 max-w-3xl">
								{classData?.description ||
									"No class description available"}
							</p>
						</div>
					</div>

					
				</div>

				{/* =========================
                    DASHBOARD CARDS
                ========================== */}

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
					<div className="bg-white rounded-2xl p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-500 text-sm">
									Students
								</p>

								<h2 className="text-3xl font-bold mt-2">
									{students.length}
								</h2>
							</div>

							<div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
								<Users className="text-blue-700" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-500 text-sm">
									Subjects
								</p>

								<h2 className="text-3xl font-bold mt-2">
									{subjects.length}
								</h2>
							</div>

							<div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
								<BookOpen className="text-green-700" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-500 text-sm">
									Class Teacher
								</p>

								<h2 className="text-lg font-bold mt-2">
									{classData?.class_teacher?.user.full_name ||
										"N/A"}
								</h2>
							</div>

							<div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
								<UserCog className="text-purple-700" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-500 text-sm">Session</p>

								<h2 className="text-lg font-bold mt-2">
									{currentTerm?.session.name} -{" "}
									{currentTerm?.name}
								</h2>
							</div>

							<div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
								<CalendarDays className="text-orange-700" />
							</div>
						</div>
					</div>
				</div>

				{/* =========================
                    CLASS TEACHER
                ========================== */}

				<div className="bg-white rounded-3xl shadow-sm p-6">
					<h2 className="text-2xl font-bold text-gray-800 mb-6">
						Class Teacher
					</h2>

					{classData?.class_teacher ? (
						<div className="flex flex-col md:flex-row gap-6 items-start">
							<img
								src={
									classData.class_teacher.user
										.profile_picture || "/avatar.png"
								}
								alt="Teacher"
								className="w-28 h-28 rounded-2xl object-cover"
							/>

							<div className="flex-1">
								<h3 className="text-2xl font-bold text-gray-800">
									{classData.class_teacher.user.full_name}
								</h3>

								<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center gap-3">
										<Mail
											size={18}
											className="text-gray-500"
										/>

										<span className="text-gray-700">
											{classData.class_teacher.user.email}
										</span>
									</div>

									<div className="flex items-center gap-3">
										<Phone
											size={18}
											className="text-gray-500"
										/>

										<span className="text-gray-700">
											{
												classData.class_teacher
													.phone_number
											}
										</span>
									</div>
								</div>

								<div className="mt-5">
									<Link
										href={`/teachers/profile/${classData.class_teacher.id}`}
										className="inline-flex bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition"
									>
										View Teacher
									</Link>
								</div>
							</div>
						</div>
					) : (
						<div className="bg-red-50 border border-red-200 rounded-2xl p-5">
							<p className="text-red-600">
								No class teacher assigned
							</p>
						</div>
					)}
				</div>

				{/* =========================
                    SUBJECTS
                ========================== */}

				<div className="bg-white rounded-3xl shadow-sm p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-gray-800">
							Subjects registered this term
						</h2>

						<Link
							href={`/teachers/classes/${classId}/subjects`}
							className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition"
						>
							Manage Subjects
						</Link>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
						{subjects.length > 0 ? (
							subjects.map((item: any) => (
								<div
									key={item.id}
									className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
								>
									<div className="flex items-center justify-between mb-4">
										<div>
											<h3 className="text-lg font-bold text-gray-800">
												{item.subject.name}
											</h3>

											<p className="text-sm text-gray-500">
												{item.subject.code}
											</p>
										</div>

										<div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
											<BookOpen className="text-blue-700" />
										</div>
									</div>
								</div>
							))
						) : (
							<div className="col-span-full text-center py-10 text-gray-500">
								No subjects assigned
							</div>
						)}
					</div>
				</div>

				{/* =========================
                    STUDENTS
                ========================== */}

				<div className="bg-white rounded-3xl shadow-sm p-6">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
						<div>
							<h2 className="text-2xl font-bold text-gray-800">
								Students
							</h2>

							<p className="text-gray-500 mt-1">
								Students currently enrolled in this class
							</p>
						</div>

					</div>
					{/* students */}
					<div className="overflow-x-auto">
						<table className="w-full min-w-225">
							<thead>
								<tr className="bg-gray-50 border-b border-gray-200">
									<th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
										Student
									</th>

									<th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
										Username
									</th>

									<th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
										Gender
									</th>

									<th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
										Admission No
									</th>

									<th className="text-left px-5 py-4 text-sm font-semibold text-gray-700">
										Action
									</th>
								</tr>
							</thead>

							<tbody className="">
								{students.length > 0 ? (
									students.map((student) => (
										<tr
											key={student.id}
											className="border-b border-gray-100 hover:bg-gray-50 transition"
										>
											<td className="px-5 py-4">
												<div className="flex items-center gap-3">
													<img
														src={
															student.user
																.profile_picture ||
															"/avatar.png"
														}
														alt="Student"
														className="w-12 h-12 rounded-full object-cover"
													/>

													<div>
														<p className="font-semibold text-gray-800">
															{
																student.user
																	.full_name
															}
														</p>

													</div>
												</div>
											</td>

											<td className="px-5 py-4">
												{student.user.username}
											</td>

											<td className="px-5 py-4 capitalize">
												{student.user.gender}
											</td>

											<td className="px-5 py-4">
												{student.admission_number}
											</td>

											<td className="px-2 py-2 flex flex-row gap-2 items-center">
												<Link
													href={`/teachers/students/${student.id}`}
													className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
												>
													View
												</Link>
												
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan={7}
											className="text-center py-10 text-gray-500"
										>
											No students found
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
