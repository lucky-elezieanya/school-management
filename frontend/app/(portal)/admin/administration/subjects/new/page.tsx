"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, BookOpen, Loader2, Pencil, Trash2, X } from "lucide-react";

import {
	apiAction,
	createAction,
	updateAction,
	handleUserDelete,
} from "@/app/lib/api";

/* =========================
   TYPES
========================= */
interface SubjectType {
	id: number;
	name: string;
	code: string;
}

/* =========================
   PAGE
========================= */
export default function NewSubjectPage() {
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);

	const [subjects, setSubjects] = useState<SubjectType[]>([]);
	const [errors, setErrors] = useState<Record<string, string[]>>({});

	/* EDIT MODAL */
	const [editOpen, setEditOpen] = useState(false);
	const [editSubject, setEditSubject] = useState<SubjectType | null>(null);

	/* DELETE STATE */
	const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

	const [formData, setFormData] = useState({
		name: "",
		code: "",
	});

	/* =========================
	   FETCH SUBJECTS
	========================= */
	const fetchSubjects = async () => {
		try {
			const res = await apiAction(
				"academics",
				"subjects",
				undefined,
				"GET",
			);
			setSubjects(res.results || res);
		} catch (err) {
			console.error(err);
		} finally {
			setFetching(false);
		}
	};

	useEffect(() => {
		fetchSubjects();
	}, []);

	/* =========================
	   HANDLE INPUT
	========================= */
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	/* =========================
	   CREATE SUBJECT
	========================= */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrors({});

		const SubmittedData = {
			name: formData.name.toUpperCase(),
			code: formData.code.toUpperCase(),
		};

		try {
			const res = await createAction(
				"academics",
				"subjects",
				SubmittedData,
			);

			if (res) {
				setFormData({ name: "", code: "" });
				await fetchSubjects(); // 🔥 live update
			}
		} catch (error: any) {
			setErrors(error);
		} finally {
			setLoading(false);
		}
	};

	/* =========================
	   DELETE SUBJECT
	========================= */
	const handleDelete = async (id: number) => {
		setDeleteLoadingId(id);

		try {
			await handleUserDelete("academics", "subjects", id, "Subject");
			setSubjects((prev) => prev.filter((s) => s.id !== id));
		} catch (err) {
			console.error(err);
		} finally {
			setDeleteLoadingId(null);
		}
	};

	/* =========================
	   OPEN EDIT
	========================= */
	const openEdit = (subject: SubjectType) => {
		setEditSubject(subject);
		setEditOpen(true);
	};

	/* =========================
	   UPDATE SUBJECT
	========================= */
	const handleUpdate = async () => {
		if (!editSubject) return;

		try {
			const res = await updateAction(
				"academics",
				"subjects",
				editSubject.id,
				{
					name: editSubject.name.toUpperCase(),
					code: editSubject.code.toUpperCase(),
				},
			);

			if (res) {
				setEditOpen(false);
				setEditSubject(null);
				await fetchSubjects();
			}
		} catch (err) {
			console.error(err);
		}
	};

	/* =========================
	   UI
	========================= */
	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-8">
			<div className="max-w-5xl mx-auto space-y-8">
				{/* HEADER */}
				<Link
					href="/admin/administration"
					className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to dashboard
				</Link>

				{/* FORM */}
				<div className="bg-white p-6 rounded-3xl shadow-sm border">
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<BookOpen className="w-6 h-6 text-purple-600" />
						Create Subject
					</h1>

					<form
						onSubmit={handleSubmit}
						className="mt-6 space-y-4 w-3/4"
					>
						<input
							name="name"
							value={formData.name}
							onChange={handleChange}
							placeholder="Subject Name e.g MATHEMATICS"
							className="w-full border p-3 rounded-xl"
						/>

						<input
							name="code"
							value={formData.code}
							onChange={handleChange}
							placeholder="Subject Code e.g MTH"
							className="w-full border p-3 rounded-xl"
						/>

						<button
							disabled={loading}
							className="bg-purple-600 text-white px-6 py-3 rounded-xl"
						>
							{loading ? "Creating..." : "Create"}
						</button>

						<button
							type="button"
                            onClick={()=> router.push('/admin/administration/subjects/upload')}
							className="bg-gray-600 text-white px-6 py-3 mx-4 rounded-xl"
						>
							Upload
						</button>
					</form>
				</div>
				{/* SUBJECT LIST */}
				<div className="bg-white p-6 rounded-3xl shadow-sm border">
					<h2 className="text-xl font-bold mb-5 text-gray-800">
						All Subjects
					</h2>

					{fetching ? (
						<div className="flex justify-center py-10">
							<Loader2 className="animate-spin text-purple-600 w-6 h-6" />
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								{/* HEADER */}
								<thead>
									<tr className="border-b bg-gray-50 text-gray-600">
										<th className="text-left py-3 px-4 font-medium">
											Name
										</th>

										<th className="text-left py-3 px-4 font-medium">
											Code
										</th>

										<th className="text-center py-3 px-4 font-medium">
											Actions
										</th>
									</tr>
								</thead>

								{/* BODY */}
								<tbody>
									{subjects.map((sub) => (
										<tr
											key={sub.id}
											className="border-b hover:bg-gray-50 transition"
										>
											{/* NAME */}
											<td className="py-3 px-4 font-medium text-gray-800">
												{sub.name}
											</td>

											{/* CODE */}
											<td className="py-3 px-4 text-gray-600 uppercase">
												{sub.code}
											</td>

											{/* ACTIONS */}
											<td className="py-3 px-4">
												<div className="flex justify-center items-center gap-3">
													{/* EDIT */}
													<button
														onClick={() =>
															openEdit(sub)
														}
														className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
														title="Edit subject"
													>
														<Pencil className="w-4 h-4" />
													</button>

													{/* DELETE */}
													<button
														onClick={() =>
															handleDelete(sub.id)
														}
														disabled={
															deleteLoadingId ===
															sub.id
														}
														className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"
														title="Delete subject"
													>
														{deleteLoadingId ===
														sub.id ? (
															<Loader2 className="w-4 h-4 animate-spin" />
														) : (
															<Trash2 className="w-4 h-4" />
														)}
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{/* =========================
			   EDIT MODAL
			========================= */}
			{editOpen && editSubject && (
				<div className="fixed inset-0 bg-black/40 flex items-center justify-center">
					<div className="bg-white p-6 rounded-2xl w-100 space-y-4">
						<div className="flex justify-between">
							<h2 className="font-bold">Edit Subject</h2>
							<button onClick={() => setEditOpen(false)}>
								<X />
							</button>
						</div>

						<input
							value={editSubject.name}
							onChange={(e) =>
								setEditSubject({
									...editSubject,
									name: e.target.value,
								})
							}
							className="w-full border p-2 rounded"
						/>

						<input
							value={editSubject.code}
							onChange={(e) =>
								setEditSubject({
									...editSubject,
									code: e.target.value,
								})
							}
							className="w-full border p-2 rounded"
						/>

						<button
							onClick={handleUpdate}
							className="bg-green-600 text-white w-full py-2 rounded"
						>
							Update
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
