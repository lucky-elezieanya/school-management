"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ArrowLeft, BookOpen, Loader2, Save } from "lucide-react";

import { apiAction, updateAction } from "@/app/lib/api";

interface TeacherType {
	id: number;
	user?: {
		first_name?: string;
		last_name?: string;
	};
}

interface ClassType {
	id: number;
	name: string;
	arm?: string;
}

export default function EditSubjectPage() {
	const router = useRouter();
	const params = useParams();

	const subjectId = Number(params.id);

	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);

	const [teachers, setTeachers] = useState<TeacherType[]>([]);
	const [classes, setClasses] = useState<ClassType[]>([]);

	const [errors, setErrors] = useState<string[]>([]);

	const [formData, setFormData] = useState({
		name: "",
		code: "",
	});

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [subjectRes, teachersRes, classesRes] = await Promise.all(
					[
						apiAction("academics", "subjects", subjectId, "GET"),

						apiAction("academics", "teachers", undefined, "GET"),

						apiAction("academics", "classes", undefined, "GET"),
					],
				);

				setTeachers(teachersRes.results || teachersRes);

				setClasses(classesRes.results || classesRes);

				setFormData({
					name: subjectRes.name || "",
					code: subjectRes.code || "",
				});
			} catch (error) {
				console.error(error);
			} finally {
				setFetching(false);
			}
		};

		if (subjectId) {
			fetchData();
		}
	}, [subjectId]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setLoading(true);
		setErrors([]);

		try {
			await updateAction(
				"academics",
				"subjects",
				subjectId,
				formData,
				"PATCH",
			);
			alert("Subject updated successfully!");
			router.push("/admin/administration");

			router.refresh();
		} catch (error: any) {
			console.error(error);

			if (error?.response?.data) {
				const backendErrors = error.response.data;

				const formattedErrors = Object.entries(backendErrors).flatMap(
					([field, messages]: any) =>
						messages.map(
							(message: string) => `${field}: ${message}`,
						),
				);

				setErrors(formattedErrors);
			} else {
				setErrors(["Something went wrong"]);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-8">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* BACK */}
				<Link
					href="/admin/administration"
					className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to dashboard
				</Link>

				{/* HEADER */}
				<div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm">
					<div className="flex items-center gap-4">
						<div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
							<BookOpen className="w-7 h-7 text-purple-700" />
						</div>

						<div>
							<h1 className="text-3xl font-bold text-gray-800">
								Edit Subject
							</h1>

							<p className="text-gray-500 mt-1">
								Update subject details, class assignment and
								teacher
							</p>
						</div>
					</div>
				</div>

				{/* FORM */}
				<div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
					<div className="border-b border-gray-100 px-6 py-5">
						<h2 className="text-lg font-semibold text-gray-800">
							Subject Information
						</h2>
					</div>

					{fetching ? (
						<div className="p-12 flex justify-center">
							<Loader2 className="w-8 h-8 animate-spin text-purple-600" />
						</div>
					) : (
						<form
							onSubmit={handleSubmit}
							className="p-6 md:p-8 space-y-6"
						>
							{/* ERRORS */}
							{errors.length > 0 && (
								<div className="bg-red-50 border border-red-200 rounded-2xl p-4">
									<ul className="space-y-1">
										{errors.map((error, index) => (
											<li
												key={index}
												className="text-sm text-red-600"
											>
												•{error}
											</li>
										))}
									</ul>
								</div>
							)}

							{/* NAME + CODE */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<label className="text-sm font-medium text-gray-700">
										Subject Name
									</label>

									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleChange}
										required
										className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
									/>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium text-gray-700">
										Subject Code
									</label>

									<input
										type="text"
										name="code"
										value={formData.code}
										onChange={handleChange}
										className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
									/>
								</div>
							</div>

							{/* ACTIONS */}
							<div className="flex flex-col sm:flex-row gap-3 pt-4">
								<button
									type="submit"
									disabled={loading}
									className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-6 py-3 rounded-2xl transition font-medium"
								>
									{loading ? (
										<>
											<Loader2 className="w-5 h-5 animate-spin" />
											Updating subject...
										</>
									) : (
										<>
											<Save className="w-5 h-5" />
											Update Subject
										</>
									)}
								</button>

								<Link
									href="/admin/administration"
									className="px-6 py-3 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-center font-medium"
								>
									Cancel
								</Link>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
