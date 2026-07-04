"use client";
import {
	apiAction,
	apiHeaders,
	BASE_URL,
	createAction,
	handleUserDelete,
} from "@/app/lib/api";

import {
	ArmsType,
	ClassType,
	CreateClassFormType,
	TeacherType,
} from "@/app/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {useEffect, useState } from "react";

export default function ClassesPage() {
	const router = useRouter();
	const [arms, setArms] = useState<ArmsType[]>([]);

	const [errors, setErrors] = useState<Record<string, string[]>>({});
	const [loading, setLoading] = useState(false);
	const [teachers, setTeachers] = useState<TeacherType[]>([]);
	const [armForm, setArmForm] = useState({
		name: "",
		code: "",
	});
	const [classes, setClasses] = useState<any[]>([]);

	const [armLoading, setArmLoading] = useState(false);
	const [classForm, setClassForm] = useState<CreateClassFormType>({
		name: "",
		arm: undefined,
		description: "",
		class_teacher: undefined,
	});
	const [classStudents, setClassStudents] = useState<
		{ class: ClassType; students: number }[]
	>([]);

	// ##################### handlers  ############### ///////
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
			setErrors({}); // CLEAR OLD ERRORS

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
                fetchClasses();
				setClasses((prev) => [...prev, res]);

				setClassForm({
					name: "",
					arm: undefined,
					description: "",
					class_teacher: undefined,
				});
              
			}
		} catch (err: any) {
			console.log(err);
			setErrors(err || {});
		} finally {
			setLoading(false);
		}
	};

	const fetchClasses = async () => {
		try {
			const res = await fetch(`${BASE_URL}/academics/classes/`, {
				headers: apiHeaders(),
				method: "GET",
			});

			const response = await res.json();

			if (!res.ok) {
				throw response;
			}

			const classesData = response.results || [];

			setClasses(classesData);

			// FETCH STUDENT COUNTS FOR ALL CLASSES
			const classesWithStudents = await Promise.all(
				classesData.map(async (cls: ClassType) => {
					try {
						const studentRes = await apiAction(
							"academics",
							`classes/${cls.id}/students`,
							undefined,
							"GET",
						);

						return {
							class: studentRes.class,
							students: studentRes.students_count,
						};
					} catch (error) {
						console.error(
							`Failed to fetch students for class ${cls.id}`,
							error,
						);

						return {
							class: cls,
							students: 0,
						};
					}
				}),
			);

			setClassStudents(classesWithStudents);
		} catch (error) {
			console.error(error);
		}
	};
	useEffect(() => {
		fetchTeachers();
		fetchArms();
		fetchClasses();
	}, [classes.length, arms.length]);

	const handleClassDelete = async (cls: any) => {
		const res = await handleUserDelete(
			"academics",
			"classes",
			cls.class.id,
			`Class: ${cls.class.name}`,
		);
		if (res) {
			setClassStudents((prev) =>
				prev.filter((c) => c.class.id !== cls.class.id),
			);
		}
		return;
	};
	const handleArmDelete = async (arm: ArmsType) => {
		const res = await handleUserDelete(
			"academics",
			"arms",
			arm.id,
			`Arm: ${arm.code}`,
		);
		if (res) {
			setArms((prev) => prev.filter((a) => a.id !== arm.id));
		}
	};

	return (
		<div className="min-h-screen bg-transparent p-4 md:p-8">
			<div className="max-w-7xl mx-auto space-y-8">
				{/* HEADER */}

				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div className="flex items-center gap-4">
						{/*  */}
						<div className="">
							<h1 className="text-3xl font-bold text-gray-900">
								Classes Management
							</h1>
							<p className="text-gray-500 mt-1">
								Manage school classes and class arms.
							</p>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* CREATE CLASS */}
					<div className="bg-transparent rounded-3xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
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
										className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 transition ${
											errors.non_field_errors
												? "border-red-500 focus:ring-red-500"
												: "border-gray-300 focus:ring-emerald-500"
										}`}
									/>

									{errors.non_field_errors && (
										<p className="mt-2 text-sm text-red-600">
											{errors.non_field_errors[0]}
										</p>
									)}
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
										className="w-full rounded-2xl border border-gray-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
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
									className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
								/>
							</div>
							{/* CLASS TEACHER */}
							{teachers && teachers.length > 0 && (
								<div>
									<label className="text-sm font-medium text-gray-700">
										Class Teacher
									</label>

									<select
										name="class_teacher"
										value={classForm.class_teacher}
										onChange={handleClassChange}
										className="w-full mt-2 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
									>
										<option value="">
											No Teacher Selected
										</option>

										{teachers.length > 0 &&
											teachers.map((t) => (
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
							)}

							{/* BUTTON */}
							<div className="pt-2 gap-4 flex-col flex md:flex-row">
								<button
									disabled={loading}
									type="submit"
									className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-semibold transition"
								>
									{loading
										? "Creating class..."
										: "Create Class"}
								</button>
								<button
									onClick={()=> router.push("/admin/administration/classes/upload")}
									type="button"
									className="w-full md:mx-4 md:w-auto bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-2xl font-semibold transition"
								>
									Upload
								</button>
							</div>
						</form>
					</div>

					{/* CREATE ARM */}
					<div className="bg-transparent rounded-3xl shadow-sm border border-gray-200 p-6 h-fit">
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
									className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
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
									className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
								/>
							</div>

							<button
								disabled={loading}
								type="submit"
								className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-semibold transition"
							>
								{armLoading ? "Creating arm..." : "Create Arm"}
							</button>
						</form>
					</div>
				</div>

				{/* CLASSES TABLE */}
				<div className="bg-transparent rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
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
								className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
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
								{classStudents.length > 0 ? (
									classStudents.map((cls) => (
										<tr
											key={cls.class.id}
											className="hover:bg-gray-50 transition"
										>
											<td className="px-6 py-4 text-gray-800 font-medium">
												{cls.class.name}
											</td>

											<td className="px-6 py-4">
												<span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
													{cls.class.arm.name}
												</span>
											</td>

											<td className="px-6 py-4 text-gray-600">
												{cls.students} Students
											</td>

											<td className="px-6 py-4">
												<div className="flex items-center gap-3">
													<Link
														href={`/admin/administration/classes/${cls.class.id}`}
														className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-sm"
													>
														View
													</Link>
													<button
														onClick={() =>
															router.push(
																`/admin/administration/classes/${cls.class.id}/edit`,
															)
														}
														className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition text-sm"
													>
														Edit
													</button>

													<button
														onClick={() =>
															handleClassDelete(
																cls,
															)
														}
														className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-sm"
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan={4}
											className="px-6 py-4 text-center text-gray-500"
										>
											No classes found.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* ARMS SECTION */}
				<div className="bg-transparent rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
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
										<button
											onClick={() => handleArmDelete(arm)}
											className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition text-sm font-medium"
										>
											Delete
										</button>
									</div>
								</div>
							))
						) : (
							<p className="text-center text-gray-500 col-span-4">
								No arms found.
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
