// app/admin/classes/[id]/subjects/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SubjectSelector from "@/app/components/forms/SubjectSelector";
import {
	apiAction,
	apiHeaders,
	BASE_URL,
} from "@/app/lib/api";
import { BookOpen, CheckCircle2, GraduationCap, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { fetchSubjects } from "@/app/services/results";

interface Subject {
	id: number;
	name: string;
	code: string;
}

interface ClassSubject {
	id: number;
	school_class: {
		id: number;
		name: string;
		arm?: {
			id: number;
			name: string;
			code: string;
		};
	};
	subject: Subject;
}

interface SchoolClass {
	id: number;
	name: string;
	arm?: {
		id: number;
		name: string;
		code: string;
	};
	description?: string;
}

export default function ClassSubjectsPage() {
	const params = useParams();
	const classId = Number(params.id);
	const { currentTerm } = useAuth();
	const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
	const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
	const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
	const [loading, setLoading] = useState(false);

	const fetchData = async () => {
		try {
			const [classData, subjectsData, classSubjectsData] =
				await Promise.all([
					apiAction("academics", "classes", classId),
					apiAction("academics", "subjects"),
					currentTerm?.id && fetchSubjects(classId, currentTerm.id),
				]);

			console.log("Fresh subjects:", classSubjectsData);

			setSchoolClass(classData);
			setAllSubjects(subjectsData.results || subjectsData);
			setClassSubjects(classSubjectsData.subjects || []);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleAssignSubjects = async (selectedIds: number[]) => {
		try {
			setLoading(true);

			const existingIds = classSubjects.map((item) => item.subject.id);

			const newIds = selectedIds.filter(
				(id) => !existingIds.includes(id),
			);

			const removedIds = existingIds.filter(
				(id) => !selectedIds.includes(id),
			);

			// Create new
			await fetch(`${BASE_URL}/academics/class-subjects/bulk-create/`, {
				method: "POST",
				headers: {
					...apiHeaders(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					class_id: classId,
					term_id: currentTerm?.id,
					subject_ids: newIds,
				}),
			});

			// Delete removed
			await Promise.all(
				removedIds.map(async (subjectId) => {
					const classSubject = classSubjects.find(
						(item) => item.subject.id === subjectId,
					);

					if (!classSubject) return;
				}),
			);
			await fetch(
				`${BASE_URL}/academics/class-subjects/bulk-delete-by-composite/?class=${classId}&term=${currentTerm?.id}&subjects=${removedIds.join(",")}`,
				{
					method: "DELETE",
					headers: apiHeaders(),
				},
			);

			// Force reload fresh data
			await fetchData();
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 p-4 md:p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* HEADER */}
				<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
									<GraduationCap className="text-blue-700" />
								</div>

								<div>
									<h1 className="text-2xl font-bold text-gray-800">
										{schoolClass?.name}
										{schoolClass?.arm &&
											` - ${schoolClass.arm.name}`}
									</h1>

									<p className="text-gray-500 text-sm">
										Manage class subjects
									</p>
								</div>
							</div>

							{schoolClass?.description && (
								<p className="text-gray-600 max-w-3xl">
									{schoolClass.description}
								</p>
							)}
						</div>

						<div className="flex gap-3">
							<Link
								href={`/admin/administration/classes/${classId}`}
								className="px-5 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition"
							>
								View Class
							</Link>
						</div>
					</div>
				</div>

				{/* STATS */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-500">
									Assigned Subjects
								</p>
								<h2 className="text-3xl font-bold text-gray-800 mt-2">
									{classSubjects.length}
								</h2>
							</div>

							<div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
								<CheckCircle2 className="text-green-700" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-500">
									Available Subjects
								</p>
								<h2 className="text-3xl font-bold text-gray-800 mt-2">
									{allSubjects.length}
								</h2>
							</div>

							<div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
								<BookOpen className="text-blue-700" />
							</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-gray-500">
									Unassigned Subjects
								</p>
								<h2 className="text-3xl font-bold text-gray-800 mt-2">
									{allSubjects.length - classSubjects.length}
								</h2>
							</div>

							<div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center">
								<Plus className="text-yellow-700" />
							</div>
						</div>
					</div>
				</div>

				{/* CURRENT CLASS SUBJECTS */}
				<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
					<div className="mb-6">
						<h2 className="text-xl font-bold text-gray-800">
							Current Class Subjects
						</h2>
						<p className="text-sm text-gray-500 mt-1">
							Subjects currently assigned to this class.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{classSubjects.length > 0 ? (
							classSubjects.map((item) => (
								<div
									key={item.id}
									className="border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:bg-blue-50/30 transition"
								>
									<div className="flex items-center justify-between">
										<div>
											<h3 className="font-bold text-gray-800 text-lg">
												{item.subject.name}
											</h3>

											<p className="text-sm text-gray-500 mt-1">
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
							<div className="col-span-full text-center py-12 text-gray-500">
								No subjects assigned yet.
							</div>
						)}
					</div>
				</div>

				{/* ASSIGN SUBJECTS */}
				<SubjectSelector
					allSubjects={allSubjects}
					existingSubjects={classSubjects}
					onSubmit={handleAssignSubjects}
					loading={loading}
					title="Assign Subjects To Class"
					buttonText="Save Subjects"
				/>
			</div>
		</div>
	);
}
