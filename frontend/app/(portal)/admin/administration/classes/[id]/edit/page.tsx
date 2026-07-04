"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { apiAction, updateAction } from "@/app/lib/api";
import { ArrowLeft, Save } from "lucide-react";
import { ArmsType, ClassType } from "@/app/lib/types";

/* =========================
   TYPES
========================= */

type TeacherType = {
	id: number;
	user: {
		full_name: string;
	};
};

/* =========================
   PAGE
========================= */
type FormType = {
	name: string;
	arm: string | number;
	description: string;
	class_teacher?: number;
};

export default function EditClassPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();

	const classId = Number(params.id);

	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);

	const [teachers, setTeachers] = useState<TeacherType[]>([]);
	const [errors, setErrors] = useState<Record<string, string[]>>({});
	const [arms, setArms] = useState<ArmsType[]>([]);
	const [form, setForm] = useState<FormType>({
		name: "",
		arm: "",
		description: "",
		class_teacher: undefined,
	});

	const fetchArms = async () => {
		try {
			const res = await apiAction("academics", "arms", undefined, "GET");
			if (res) {
				setArms(res.results);
			}
		} catch (error) {
			console.log(error);
		}
	};
	/* =========================
	   FETCH CLASS + TEACHERS
	========================= */

	useEffect(() => {
		const fetchData = async () => {
			try {
				setFetching(true);

				/* CLASS */
				const cls: ClassType = await apiAction(
					"academics",
					"classes",
					classId,
				);

				/* TEACHERS */
				const teachersData = await apiAction("academics", "teachers");

				setTeachers(teachersData.results || teachersData);

				/* PREFILL FORM */
				setForm({
					name: cls.name || "",
					arm: cls.arm.code,
					description: cls.description || "",
					class_teacher: cls.class_teacher
						? cls.class_teacher.id
						: undefined,
				});
			} catch (err) {
				console.error(err);
			} finally {
				setFetching(false);
			}
		};

		if (classId) fetchData();
		fetchArms();
	}, [classId]);

	/* =========================
	   HANDLE CHANGE
	========================= */

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		setForm({
			...form,
			[e.target.name]: e.target.value,
		});
	};

	/* =========================
	   SUBMIT UPDATE
	========================= */

	const handleSubmit = async (e: React.SubmitEvent) => {
		e.preventDefault();

		try {
			setLoading(true);

			const data = {
				name: form.name.toUpperCase(),

				arm_id: form.arm,

				description: form.description.toUpperCase(),

				class_teacher_id: form.class_teacher
					? Number(form.class_teacher)
					: null,
			};
			const res = await updateAction(
				"academics",
				"classes",
				classId,
				data,
				"PUT",
			);
			if (res) {
				alert("Class updated successfully");
				router.push(`/admin/administration/classes/${classId}`);
			}
		} catch (err: any) {
			console.log(err);
			setErrors(err);
		} finally {
			setLoading(false);
		}
	};

	/* =========================
	   LOADING
	========================= */

	if (fetching) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-100">
				<div className="text-center">
					<div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading class...</p>
				</div>
			</div>
		);
	}

	/* =========================
	   UI
	========================= */

	return (
		<div className="min-h-screen bg-gray-100 p-6 md:p-10">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* HEADER */}
				<div className="flex items-center gap-4">
					<Link
						href={`/admin/administration/classes/${classId}`}
						className="w-10 h-10 bg-white shadow rounded-xl flex items-center justify-center hover:bg-gray-100 transition"
					>
						<ArrowLeft size={18} />
					</Link>

					<h1 className="text-3xl font-bold text-gray-800">
						Edit Class
					</h1>
				</div>

				{/* FORM CARD */}
				<div className="bg-white rounded-3xl shadow-sm p-6 md:p-8">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* CLASS NAME */}
						<div>
							<label className="text-sm font-medium text-gray-700">
								Class Name
							</label>

							<input
								type="text"
								name="name"
								value={form.name}
								onChange={handleChange}
								className="w-full mt-2 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
								required
							/>
							{errors.name && (
								<p className="mt-2 text-sm text-red-600">
									{errors.name[0]}
								</p>
							)}
						</div>

						{/* ARM */}
						<div>
							<label className="text-sm font-medium text-gray-700">
								Arm
							</label>

							<select
								onChange={handleChange}
								name="arm"
								value={form.arm}
								required
								className="w-full rounded-2xl border border-gray-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
							>
								<option value="">
									Active Arm ({form.arm})
								</option>
								{arms?.length > 0 &&
									arms.map((arm) => (
										<option key={arm.id} value={arm.id}>
											{arm.code}
										</option>
									))}
							</select>
						</div>

						{/* DESCRIPTION */}
						<div>
							<label className="text-sm font-medium text-gray-700">
								Description
							</label>

							<textarea
								name="description"
								value={form.description}
								onChange={handleChange}
								rows={4}
								className="w-full mt-2 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						{/* CLASS TEACHER */}
						<div>
							<label className="text-sm font-medium text-gray-700">
								Class Teacher
							</label>

							<select
								name="class_teacher"
								value={form.class_teacher}
								onChange={handleChange}
								className="w-full mt-2 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Unassigned</option>

								{teachers.map((t) => (
									<option key={t.id} value={t.id}>
										{t.user.full_name}
									</option>
								))}
							</select>
							{errors.class_teacher_id && (
								<p className="mt-2 text-sm text-red-600">
									{errors.class_teacher_id[0]}
								</p>
							)}
						</div>

						{/* ACTIONS */}
						<div className="flex justify-end gap-3 pt-4">
							<Link
								href={`/admin/classes/${classId}`}
								className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
							>
								Cancel
							</Link>

							<button
								type="submit"
								disabled={loading}
								className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition"
							>
								<Save size={18} />
								{loading ? "Updating..." : "Save Changes"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
