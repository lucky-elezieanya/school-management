"use client";

import { useState, useEffect } from "react";
import { apiAction, updateAction } from "@/app/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ClassType, TeacherFormDataType } from "@/app/lib/types";
import { ArrowLeft } from "lucide-react";

export default function EditTeacherPage() {
	const router = useRouter();

	const params = useParams<{ id: string }>();
	const teacherId = Number(params.id);
	const [mode, setMode] = useState<"form" | "upload">("form");
	const [loading, setLoading] = useState(false);
	const [classes, setClasses] = useState<ClassType[]>([]);
	const [file, setFile] = useState<File | null>(null);

	const [formData, setFormData] = useState<TeacherFormDataType>({
		first_name: "",
		last_name: "",
		username: "",
		date_of_birth: "",
		gender: "",
		profile_picture: "",
		middle_name: "",
		password: "",
		qualification: "",
		address: "",
		phone_number: "",
		date_employed: "",
		assigned_class: "",
		email: "",
	});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0];

			setFile(selectedFile);

			setFormData((prev) => ({
				...prev,
				profile_picture: selectedFile,
			}));
		}
	};
	/* =========================
        update teacher
    ========================== */
	const handleFormSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		setLoading(true);

		try {
			const submittedData = { ...formData };
			if (!(formData.profile_picture instanceof File)) {
				submittedData.profile_picture = undefined;
			}
			const res = await updateAction(
				"academics",
				"teachers",
				teacherId,
				submittedData,
				"PATCH",
			);
			if (res) {
				alert(
					`Teacher ${submittedData.first_name} with id:${teacherId} has been updated successfully`,
				);
				router.push(`/admin/administration/teachers/${teacherId}`);
			}
		} catch (error) {
			alert("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		// Fetch classes from backend when component mounts
		apiAction("academics", "classes").then((data) => {
			setClasses(data.results || []);
		});
		const fetchTeacher = async () => {
			try {
				const res = await apiAction(
					"academics",
					"teachers",
					teacherId,
					"GET",
				);

				setFormData({
					first_name: res?.user?.first_name || "",
					last_name: res?.user?.last_name || "",
					username: res?.user?.username || "",
					date_of_birth: res?.user?.date_of_birth || "",
					assigned_class: String(res.assigned_class?.id || "N/A"),
					gender: res?.user?.gender || "",
					profile_picture: res?.user?.profile_picture || "",
					middle_name: res?.user?.middle_name || "",
					email: res?.user?.email || "",
					phone_number: res?.phone_number || "",
					password: "1234",
					qualification: res?.qualification || "",
					address: res?.address || "",
					date_employed: res?.date_employed || "",
				});
			} catch (error) {
				console.error("Failed to fetch student:", error);
			}
		};

		if (teacherId) {
			fetchTeacher();
		}
	}, [teacherId]);

	return (
		<div className="min-h-screen bg-pink-50 py-8 px-4">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="top flex items-center justify-between mb-4 relative">
					<div className="mb-8 ml-2">
						<h1 className="text-3xl font-bold text-green-900">
							Update{" "}
							{formData.first_name
								? formData.first_name + "'s"
								: "this teacher's"}{" "}
							Account
						</h1>

						<p className="text-gray-600 ml-4 mt-2 text-xl">
							Change any field you wish to update
						</p>
					</div>
					<Link href="/admin/administration" className="flex items-center gap-4">
						<button className="px-4 py-2 bg-red-700 text-gray-100 inline-flex gap-2 rounded-lg hover:bg-red-400 transition">
							<ArrowLeft size={24} />
							<span>Back to Dashboard</span>
						</button>
					</Link>
				</div>

				{/* =========================
                    FORM MODE
                ========================== */}
				{mode === "form" && (
					<div className="bg-white rounded-3xl shadow-lg p-6 md:p-10">
						<form
							onSubmit={handleFormSubmit}
							className="space-y-10"
						>
							{/* ================= teacher INFO ================= */}
							<div>
								<h2 className="text-xl font-semibold text-green-900 mb-6">
									Edit{" "}
									{formData.first_name
										? formData.first_name + "'s"
										: "this teacher's"}{" "}
									Information
								</h2>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* First Name */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											First Name
										</label>

										<input
											type="text"
											name="first_name"
											value={formData.first_name}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter first name"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Middle Name
										</label>

										<input
											type="text"
											name="middle_name"
											value={formData.middle_name}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter middle name"
										/>
									</div>

									{/* Last Name */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Last Name
										</label>

										<input
											type="text"
											name="last_name"
											value={formData.last_name}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter last name"
										/>
									</div>

									{/* Username */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Username
										</label>

										<input
											type="text"
											name="username"
											value={formData.username}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter username"
										/>
									</div>

									{/* Password */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Password
										</label>

										<input
											type="text"
											name="password"
											value={formData.password}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter password"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Qualification
										</label>

										<input
											type="text"
											name="qualification"
											value={formData.qualification}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter qualification number"
										/>
									</div>

									{/* Class */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Change Assigned Class
										</label>
										<select
											name="assigned_class"
											value={formData.assigned_class}
											onChange={handleChange}
											// required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
										>
											<option value="">
												Select class
											</option>
											{classes.map((cls: ClassType) => (
												<option
													key={cls.id}
													value={cls.id}
												>
													{cls.name}
												</option>
											))}
										</select>
									</div>

									{/* Gender */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Gender
										</label>

										<select
											name="gender"
											value={formData.gender}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
										>
											<option value="">
												Select gender
											</option>
											<option value="male">Male</option>
											<option value="female">
												Female
											</option>
										</select>
									</div>

									{/* Date of Birth */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Date of Birth
										</label>

										<input
											type="date"
											name="date_of_birth"
											value={formData.date_of_birth}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
										/>
									</div>
									{/* Date Employed */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Date of Employment
										</label>

										<input
											type="date"
											name="date_employed"
											value={formData.date_employed}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
										/>
									</div>
									{/*Profile picture */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Teacher's Passport (optional)
										</label>
										<img
											src={
												formData.profile_picture instanceof
												File
													? URL.createObjectURL(
															formData.profile_picture,
														)
													: formData.profile_picture ||
														"/avatar.png"
											}
											alt="profile"
											className="w-20 h-20 rounded-full object-cover"
										/>
										<input
											type="file"
											name="profile_picture"
											onChange={handleFileChange}
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
										/>
									</div>
								</div>
							</div>
							{/* contact information */}
							<div className="border-t pt-8">
								<h2 className="text-xl font-semibold text-green-900 mb-6">
									Contact Information
								</h2>
								{/* Teacher's Email */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Teacher's Email
									</label>

									<input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
										placeholder="Enter email"
									/>
								</div>

								{/* Parent Phone */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Teacher's Phone Number
									</label>

									<input
										type="tel"
										name="phone_number"
										value={formData.phone_number}
										onChange={handleChange}
										required
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
										placeholder="Enter phone number"
									/>
								</div>
								{/*Address */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Teacher's Address
									</label>

									<input
										type="text"
										name="address"
										value={formData.address}
										onChange={handleChange}
										required
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
										placeholder="Enter teacher's address"
									/>
								</div>
							</div>
							{/* submit */}
							<div>
								<button
									type="submit"
									disabled={loading}
									className="w-full bg-green-800 hover:bg-green-900 transition text-white py-4 rounded-xl font-semibold disabled:opacity-50"
								>
									{loading
										? "Updating teacher..."
										: "Update teacher"}
								</button>
							</div>
						</form>
					</div>
				)}
			</div>
		</div>
	);
}
