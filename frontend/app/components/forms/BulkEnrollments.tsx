"use client";

import { useEffect, useMemo, useState } from "react";
import { apiAction, apiHeaders, BASE_URL, createAction } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { fetchStudents } from "@/app/services/academics";

export default function BulkEnrollments() {
	const router = useRouter();
	const { currentTerm } = useAuth();
	const [students, setStudents] = useState<any[]>([]);
	const [classes, setClasses] = useState<any[]>([]);
	const [sessions, setSessions] = useState<any[]>([]);

	const [enrolledStudentIds, setEnrolledStudentIds] = useState<number[]>([]);

	const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
	const [selectedClass, setSelectedClass] = useState("");
	const [selectedSession, setSelectedSession] = useState("");

	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(false);
	const [loadingEnrolled, setLoadingEnrolled] = useState(false);

	useEffect(() => {
		loadData();
	}, []);

	useEffect(() => {
		if (selectedClass && selectedSession) {
			loadEnrolledStudents();
		}
	}, [selectedClass, selectedSession, currentTerm?.session]);

	const loadData = async () => {
		try {
			const [studentRes, classRes, sessionRes] = await Promise.all([
                
				apiAction("academics", "students"),
				apiAction("academics", "classes"),
				apiAction("academics", "sessions"),
			]);

			setStudents(studentRes.results || studentRes);
			setClasses(classRes.results || classRes);
			setSessions(sessionRes.results || sessionRes);
		} catch (err) {
			console.error(err);
		}
	};

	// 🔥 FETCH ALREADY ENROLLED STUDENTS
	const loadEnrolledStudents = async () => {
		try {
			setLoadingEnrolled(true);
			const url = `${BASE_URL}/academics/enrollments/?session=${selectedSession}&school_class=${selectedClass}`;
			const resp = await fetch(url, {
				headers: apiHeaders(),
			});
			const res = await resp.json();

			const enrolled = (res && res.results) || [];
			if (enrolled.length > 0) {
				setEnrolledStudentIds(
					enrolled.map((e: any) =>  e.student),
				);
			}
		} catch (err) {
			console.error(err);
			setEnrolledStudentIds([]);
		} finally {
			setLoadingEnrolled(false);
		}
	};

	const filteredStudents = useMemo(() => {
		return students.filter((student) => {
			const q = search.toLowerCase();

			return (
				student.user?.full_name?.toLowerCase().includes(q) ||
				student.admission_number?.toLowerCase().includes(q)
			);
		});
	}, [students, search]);

	const toggleStudent = (studentId: number) => {
		if (enrolledStudentIds.includes(studentId)) return;

		setSelectedStudents((prev) =>
			prev.includes(studentId)
				? prev.filter((id) => id !== studentId)
				: [...prev, studentId],
		);
	};

	const selectAll = () => {
		const ids = filteredStudents
			.filter((s) => !enrolledStudentIds.includes(s.id))
			.map((s) => s.id);

		setSelectedStudents(ids);
	};

	const clearAll = () => {
		setSelectedStudents([]);
	};

	const handleEnroll = async () => {
		if (!selectedSession) return alert("Select an academic session");
		if (!selectedClass) return alert("Select a class");
		if (selectedStudents.length === 0)
			return alert("Select at least one student");

		try {
			setLoading(true);

			const payload = {
				student_ids: selectedStudents,
				session_id: Number(selectedSession),
				school_class_id: Number(selectedClass),
				is_current: true,
			};

			const response = await createAction(
				"academics",
				"enrollments/bulk-enroll",
				payload,
			);
			function message(created: number, skipped: number) {
				if (created !== 0 || skipped !== 0) {
					return `${created} students enrolled and ${skipped} students were skipped`;
				} else if (created === 0 && skipped !== 0) {
					return `No student enrolled, ${skipped} students skipped`;
				} else {
					return "Could not enroll student(s)";
				}
			}

			alert(`${message(response.created, response.skipped)}`);
			router.push(`/admin/administration/classes/${selectedClass}`);

			setSelectedStudents([]);

			loadEnrolledStudents();
		} catch (error) {
			console.error(error);
			alert("Enrollment failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-6">
			{/* HEADER */}
			<div className="mb-6">
				<h1 className="text-2xl md:text-3xl font-bold text-gray-900">
					Bulk Student Enrollment
				</h1>
				<p className="text-gray-600 mt-1">
					Enroll students into classes quickly and efficiently
				</p>
			</div>

			{/* CONTROLS CARD */}
			<div className="bg-white rounded-xl border p-4 md:p-6 mb-6 shadow-sm">
				<div className="grid md:grid-cols-2 gap-4">
					<select
						value={selectedSession}
						onChange={(e) => setSelectedSession(e.target.value)}
						className="border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none"
					>
						<option value="">Select Session</option>
						{sessions.map((session: any) => (
							<option key={session.id} value={session.id}>
								{session.name} {session.is_active && "(Active)"}
							</option>
						))}
					</select>

					<select
						value={selectedClass}
						onChange={(e) => setSelectedClass(e.target.value)}
						className="border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none"
					>
						<option value="">Select Class</option>
						{classes.map((cls: any) => (
							<option key={cls.id} value={cls.id}>
								{cls.name} {cls.arm.code}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* SEARCH + ACTIONS */}
			<div className="bg-white rounded-xl border p-4 md:p-6 mb-4">
				<input
					type="text"
					placeholder="Search students..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-green-500 outline-none"
				/>

				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={selectAll}
						className="px-4 py-2 border rounded-lg hover:bg-gray-100"
					>
						Select All
					</button>

					<button
						type="button"
						onClick={clearAll}
						className="px-4 py-2 border rounded-lg hover:bg-gray-100"
					>
						Clear
					</button>

					{loadingEnrolled && (
						<span className="text-sm text-gray-500 self-center">
							Checking enrolled students...
						</span>
					)}
				</div>
			</div>

			{/* STUDENT LIST */}
			<div className="bg-white rounded-xl border overflow-hidden max-h-150 overflow-y-auto">
				{filteredStudents.map((student: any) => {
					const isEnrolled = enrolledStudentIds.includes(student.id);

					const isSelected = selectedStudents.includes(student.id);

					return (
						<label
							key={student.id}
							className={`flex items-center gap-3 p-4 border-b transition ${
								isEnrolled
									? "bg-green-50 opacity-70"
									: "hover:bg-gray-50 cursor-pointer"
							}`}
						>
							<input
								type="checkbox"
								checked={isEnrolled || isSelected}
								disabled={isEnrolled}
								onChange={() => toggleStudent(student.id)}
								className="h-4 w-4 text-green-600"
							/>

							<div className="flex-1">
								<div className="font-medium text-gray-900">
									{student.user?.full_name}
								</div>

								<div className="text-sm flex flex-col gap-2 text-gray-500">
									<span>
										ADM NO: {student.admission_number}
									</span>
									{student.current_enrollment &&
									student.current_enrollment.is_current ? (
										<span>
											{
												student.current_enrollment
													.school_class.name
											}
										</span>
									) : (
										<span>Not Active</span>
									)}
								</div>
							</div>

							{isEnrolled && (
								<span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
									Enrolled
								</span>
							)}
						</label>
					);
				})}
			</div>

			{/* FOOTER ACTION */}
			<div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div className="text-gray-700">
					Selected: <strong>{selectedStudents.length}</strong>
				</div>

				<button
					type="button"
					onClick={handleEnroll}
					disabled={loading}
					className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
				>
					{loading ? "Enrolling..." : "Enroll Students"}
				</button>
			</div>
		</div>
	);
}
