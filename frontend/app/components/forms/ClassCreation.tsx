"use client";
import { apiAction, createAction } from "@/app/lib/api";

import { ArmsType, CreateClassFormType, TeacherType } from "@/app/lib/types";
import { form, p } from "framer-motion/client";
import { Loader2Icon } from "lucide-react";
import { use, useEffect, useState } from "react";

export default function ClassesPage() {
	const [arms, setArms] = useState<ArmsType[]>([]);
	const [errors, setErrors] = useState();
	const [loading, setLoading] = useState(false);
	const [teachers, setTeachers] = useState<TeacherType[]>([]);
	const [armForm, setArmForm] = useState({
		name: "",
		code: "",
	});

	const [armLoading, setArmLoading] = useState(false);
	const [classForm, setClassForm] = useState<CreateClassFormType>({
		name: "",
		arm: undefined,
		description: "",
		class_teacher: undefined,
	});

	const fetchTeachers = async () => {
		try {
			setLoading(true);
			const res = await apiAction("academics", "teachers");

			setTeachers(res.results || res);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

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

	// arms handlers

	const handleArmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		setArmForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleArmSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			setArmLoading(true);

			if (!armForm.name || !armForm.code) {
				alert("Arm name and code are required");
				return;
			}

			const payload = {
				name: armForm.name.toUpperCase(),
				code: armForm.code.toUpperCase(),
			};

			const res = await createAction(
				"academics",
				"arms",
				payload,
				"POST",
			);

			if (res) {
				alert("Arm created successfully");

				setArms((prev) => [...prev, res]);

				setArmForm({
					name: "",
					code: "",
				});
			}
		} catch (error) {
			console.log(error);
			alert("Failed to create arm");
		} finally {
			setArmLoading(false);
		}
	};

	// class handlers
	const handleClassChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		setClassForm({
			...classForm,
			[e.target.name]: e.target.value,
		});
	};

	const handleClassSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			setLoading(true);
			setErrors(undefined);

			if (!classForm.name || !classForm.arm) {
				alert("Class name and arm are required");
				return;
			}

			const payload = {
				name: classForm.name.toUpperCase(),
				arm_id: Number(classForm.arm),
				description: classForm.description?.toUpperCase() || "",
				class_teacher_id: classForm.class_teacher
					? Number(classForm.class_teacher)
					: null,
			};

			const res = await createAction(
				"academics",
				"classes",
				payload,
				"POST",
			);

			if (res) {
				alert("Class created successfully");

				setClassForm({
					name: "",
					arm: undefined,
					description: "",
					class_teacher: undefined,
				});
			}
		} catch (err: any) {
			console.log(err);
			setErrors(err);
			alert("Failed to create class");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTeachers();
		fetchArms();
	}, []);
	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-8">
			<div className="max-w-7xl mx-auto space-y-8">
				{/* HEADER */}
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Classes Management
						</h1>
						<p className="text-gray-500 mt-1">
							Manage school classes and class arms.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* CREATE CLASS */}
					<div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-gray-800">
								Create New Class
							</h2>
							<p className="text-sm text-gray-500 mt-1">
								Add a new class and assign an arm.
							</p>
						</div>

						<form
							onSubmit={handleClassSubmit}
							className="space-y-5"
						>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								{/* CLASS NAME */}
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Class Name
									</label>

									<input
										name="name"
										onChange={handleClassChange}
										value={classForm.name}
										type="text"
										placeholder="e.g. JSS1"
										className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
									/>
								</div>

								{/* ARM */}
								<div>
									<label className="block text-sm font-semibold text-gray-700 mb-2">
										Select Arm
									</label>

									<select
										onChange={handleClassChange}
										name="arm"
										value={classForm.arm}
										className="w-full rounded-2xl border border-gray-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
									>
										<option value="">
											Select class arm
										</option>
										{arms?.length > 0 &&
											arms.map((arm) => (
												<option
													key={arm.id}
													value={arm.id}
												>
													{arm.code}
												</option>
											))}
									</select>
								</div>
							</div>

							{/* CLASS DESCRIPTION */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Description
								</label>

								<textarea
									name="description"
									onChange={handleClassChange}
									value={classForm.description}
									rows={4}
									placeholder="Optional description"
									className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
								/>
							</div>
							{/* CLASS TEACHER */}
							{teachers && (
								<div>
									<label className="text-sm font-medium text-gray-700">
										Class Teacher
									</label>

									<select
										name="class_teacher"
										value={classForm.class_teacher}
										onChange={handleClassChange}
										className="w-full mt-2 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="">
											No Teacher Selected
										</option>

										{teachers.map((t) => (
											<option key={t.id} value={t.id}>
												{t.user.full_name}
											</option>
										))}
									</select>
									{/* {errors.class_teacher_id && (
										<p className="mt-2 text-sm text-red-600">
											{errors.class_teacher_id[0]}
										</p>
									)} */}
								</div>
							)}

							{/* BUTTON */}
							<div className="pt-2">
								<button
									disabled={loading}
									type="submit"
									className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold transition"
								>
									{loading ? (
										<>
											<Loader2Icon size={24} />{" "}
											<span>Creating class...</span>{" "}
										</>
									) : (
										"Create Class"
									)}
								</button>
							</div>
						</form>
					</div>

					{/* CREATE ARM */}
					<div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 h-fit">
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-gray-800">
								Create Class Arm
							</h2>

							<p className="text-sm text-gray-500 mt-1">
								Add new arms for classes.
							</p>
						</div>

						<form className="space-y-5" onSubmit={handleArmSubmit}>
							{/* ARM NAME */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Arm Name
								</label>

								<input
									name="name"
									value={armForm.name}
									onChange={handleArmChange}
									type="text"
									placeholder="e.g. Gold"
									className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
								/>
							</div>

							{/* ARM CODE */}
							<div>
								<label className="block text-sm font-semibold text-gray-700 mb-2">
									Arm Code
								</label>

								<input
									name="code"
									value={armForm.code}
									onChange={handleArmChange}
									type="text"
									placeholder="e.g. ARM GOLD"
									className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
								/>
							</div>

							<button
								disabled={loading}
								type="submit"
								className="w-full bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-semibold transition"
							>
								{armLoading ? (
									<>
										<Loader2Icon size={24} />{" "}
										<span>Creating arm...</span>{" "}
									</>
								) : (
									"Create Arm"
								)}
							</button>
						</form>
					</div>
				</div>

				{/* CLASSES TABLE */}
				<div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
					<div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h2 className="text-xl font-semibold text-gray-800">
								Existing Classes
							</h2>

							<p className="text-sm text-gray-500 mt-1">
								View all classes in the school.
							</p>
						</div>

						<div className="w-full md:w-80">
							<input
								type="text"
								placeholder="Search classes..."
								className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
							/>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
										Class
									</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
										Arm
									</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
										Students
									</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
										Actions
									</th>
								</tr>
							</thead>

							<tbody className="divide-y divide-gray-100">
								{[1, 2, 3, 4].map((item) => (
									<tr
										key={item}
										className="hover:bg-gray-50 transition"
									>
										<td className="px-6 py-4 text-gray-800 font-medium">
											JSS 1
										</td>

										<td className="px-6 py-4">
											<span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
												Gold
											</span>
										</td>

										<td className="px-6 py-4 text-gray-600">
											35 Students
										</td>

										<td className="px-6 py-4">
											<div className="flex items-center gap-3">
												<button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm">
													Edit
												</button>

												<button className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-sm">
													Delete
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* ARMS SECTION */}
				<div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
					<div className="p-6 border-b border-gray-100">
						<h2 className="text-xl font-semibold text-gray-800">
							Class Arms
						</h2>

						<p className="text-sm text-gray-500 mt-1">
							Available arms in the school.
						</p>
					</div>

					<div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{arms.length > 0 ? (
							arms.map((arm, index) => (
								<div
									key={index}
									className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition"
								>
									<div className="flex items-start justify-between">
										<div>
											<h3 className="font-semibold text-lg text-gray-800">
												{arm.name}
											</h3>

											<p className="text-sm text-gray-500 mt-1">
												{arm.code}
											</p>
										</div>
									</div>

									<div className="mt-5 flex items-center gap-3">
										<button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition text-sm font-medium">
											Edit
										</button>

										<button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition text-sm font-medium">
											Delete
										</button>
									</div>
								</div>
							))
						) : (
							<p> Loading arms...</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
