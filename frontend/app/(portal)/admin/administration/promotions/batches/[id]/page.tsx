"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	getPromotionPreview,
	getPromotionStudents,
	executePromotion,
	repeatStudent,
	graduateStudent,
	transferStudent,
} from "@/app/services/promotions";

import {
	ArrowUpCircle,
	GraduationCap,
	RotateCcw,
	ArrowLeftRight,
	CheckCircle2,
    ArrowLeftIcon,
} from "lucide-react";
import { getClasses } from "@/app/services/academics";

export default function BatchDetailPage() {
	const { id } = useParams();

	const batchId = Number(id);
    const router = useRouter()

	const [preview, setPreview] = useState<any>(null);
	const [students, setStudents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [executing, setExecuting] = useState(false);
	const [selectedStudent, setSelectedStudent] = useState<any>(null);
	const [newClassId, setNewClassId] = useState("");
	const [classes, setClasses] = useState<any[]>([]);

	const loadData = async () => {
		setLoading(true);

		try {
			const [p, s, c] = await Promise.all([
				getPromotionPreview(batchId),
				getPromotionStudents(batchId),
				getClasses(),
			]);

			setPreview(p);
			setStudents(s);
			setClasses(c.results);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (batchId) loadData();
	}, [batchId]);

	/* =========================
	   ACTION HANDLERS
	========================= */

	const handleExecute = async () => {
		setExecuting(true);

		try {
			await executePromotion(batchId);
			alert("Promotion executed successfully");
			loadData();
		} catch (err) {
			alert("Failed to execute promotion");
		} finally {
			setExecuting(false);
		}
	};

	const handleRepeat = async (studentId: number) => {
		await repeatStudent(batchId, studentId);
		loadData();
	};

	const handleGraduate = async (studentId: number) => {
		await graduateStudent(batchId, studentId);
		loadData();
	};

	const handleTransfer = async (studentId: number) => {
		if (!newClassId) return;

		await transferStudent(batchId, studentId, Number(newClassId));
		setSelectedStudent(null);
		loadData();
	};

	/* =========================
	   UI
	========================= */

	return (
		<div className="p-4 md:p-6 space-y-6">
            <div className="flex justify-between">

			<h1 className="text-xl font-bold">Promotion Batch Details</h1>
			<button
				onClick={() => router.back()}
				className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
			>
				<ArrowLeftIcon size={16} />
				Back
			</button>{" "}
            </div>
			{/* =========================
			   LOADING
			========================= */}
			{loading ? (
				<p className="text-gray-500">Loading batch data...</p>
			) : (
				<>
					{/* =========================
					   PREVIEW CARD
					========================= */}
					<div className="bg-white rounded-xl shadow border p-4 space-y-2">
						<h2 className="font-semibold">Promotion Summary</h2>

						<p className="text-sm text-gray-600">
							Total Students:{" "}
							<span className="font-bold">
								{preview?.total_students}
							</span>
						</p>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
							{preview?.promotions?.map((p: any, i: number) => (
								<div
									key={i}
									className="p-3 border rounded-lg bg-gray-50 text-sm"
								>
									<div className="inline-flex">
										<p className="font-medium">
											{p.from_class}
										</p>

										<p className="text-gray-600">
											→ {p.to_class}
										</p>
									</div>

									<p className="text-xs text-gray-500 mt-1">
										{p.students} students
									</p>
								</div>
							))}
						</div>

						<button
							onClick={handleExecute}
							disabled={executing}
							className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
								executing
									? "bg-gray-400"
									: "bg-green-600 hover:bg-green-700"
							}`}
						>
							<ArrowUpCircle size={18} />
							{executing ? "Processing..." : "Execute Promotion"}
						</button>
					</div>

					{/* =========================
					   STUDENT LIST
					========================= */}
					<div className="bg-white rounded-xl shadow border overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-100">
								<tr>
									<th className="p-3 text-left">Student</th>
									<th className="p-3 text-left">Class</th>
									<th className="p-3 text-center">Actions</th>
								</tr>
							</thead>

							<tbody>
								{students.map((s: any) => (
									<tr key={s.student_id} className="border-t">
										<td className="p-3">{s.name}</td>

										<td className="p-3">
											{s.current_class}
										</td>

										<td className="p-3">
											<div className="flex justify-center gap-3 flex-wrap">
												<button
													title="Repeat this student"
													onClick={() =>
														handleRepeat(
															s.student_id,
														)
													}
													className="text-yellow-600"
												>
													<RotateCcw size={16} />
												</button>

												<button
													title="Graduate this student"
													onClick={() =>
														handleGraduate(
															s.student_id,
														)
													}
													className="text-blue-600"
												>
													<GraduationCap size={16} />
												</button>

												<button
													title="Transfer this student"
													onClick={() =>
														setSelectedStudent(
															s.student_id,
														)
													}
													className="text-purple-600"
												>
													<ArrowLeftRight size={16} />
												</button>
											</div>

											{/* =========================
											   TRANSFER MODAL
											========================= */}
											{selectedStudent ===
												s.student_id && (
												<div className="mt-2 p-3 border rounded-lg bg-gray-50 space-y-2">
													<select
														className="w-full border p-2 rounded"
														onChange={(e) =>
															setNewClassId(
																e.target.value,
															)
														}
													>
														<option>
															Select new class
														</option>
														{classes &&
															classes.length >
																0 &&
															classes.map(
																(cls: any) => (
																	<option
																		key={
																			cls.id
																		}
																		value={
																			cls.id
																		}
																	>
																		{
																			cls.name
																		}{" "}
																		{
																			cls
																				.arm
																				.code
																		}
																	</option>
																),
															)}
													</select>

													<div className="flex gap-2">
														<button
															onClick={() =>
																handleTransfer(
																	s.student_id,
																)
															}
															className="bg-green-600 text-white px-3 py-1 rounded"
														>
															Transfer
														</button>

														<button
															onClick={() =>
																setSelectedStudent(
																	null,
																)
															}
															className="bg-gray-300 px-3 py-1 rounded"
														>
															Cancel
														</button>
													</div>
												</div>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>

						{students.length === 0 && (
							<p className="p-4 text-gray-500">
								No students found
							</p>
						)}
					</div>
				</>
			)}
		</div>
	);
}
