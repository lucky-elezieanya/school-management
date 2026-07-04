// "use client";

// import { useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { motion } from "framer-motion";

// export default function StudentEditPage() {
// 	const [form, setForm] = useState({
// 		first_name: "",
// 		middle_name: "",
// 		last_name: "",
// 		email: "",
// 		phone: "",
// 		class_name: "",
// 		admission_no: "",
// 	});

// 	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// 		setForm({ ...form, [e.target.name]: e.target.value });
// 	};

// 	const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
// 		e.preventDefault();
// 		console.log("Updated student:", form);
// 	};

// 	return (
// 		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
// 			<motion.div
// 				initial={{ opacity: 0, y: 20 }}
// 				animate={{ opacity: 1, y: 0 }}
// 				className="w-full max-w-3xl"
// 			>
// 				<Card className="shadow-xl rounded-2xl">
// 					<CardContent className="p-6 md:p-10">
// 						<h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
// 							Edit Student Information
// 						</h1>

// 						<form
// 							onSubmit={handleSubmit}
// 							className="grid grid-cols-1 md:grid-cols-2 gap-5"
// 						>
// 							<div>
// 								<Label>First Name</Label>
// 								<Input
// 									name="first_name"
// 									value={form.first_name}
// 									onChange={handleChange}
// 									placeholder="First name"
// 								/>
// 							</div>

// 							<div>
// 								<Label>Middle Name</Label>
// 								<Input
// 									name="middle_name"
// 									value={form.middle_name}
// 									onChange={handleChange}
// 									placeholder="Middle name"
// 								/>
// 							</div>

// 							<div>
// 								<Label>Last Name</Label>
// 								<Input
// 									name="last_name"
// 									value={form.last_name}
// 									onChange={handleChange}
// 									placeholder="Last name"
// 								/>
// 							</div>

// 							<div>
// 								<Label>Email</Label>
// 								<Input
// 									name="email"
// 									type="email"
// 									value={form.email}
// 									onChange={handleChange}
// 									placeholder="Email address"
// 								/>
// 							</div>

// 							<div>
// 								<Label>Phone</Label>
// 								<Input
// 									name="phone"
// 									value={form.phone}
// 									onChange={handleChange}
// 									placeholder="Phone number"
// 								/>
// 							</div>

// 							<div>
// 								<Label>Class</Label>
// 								<Input
// 									name="class_name"
// 									value={form.class_name}
// 									onChange={handleChange}
// 									placeholder="e.g JSS3"
// 								/>
// 							</div>

// 							<div className="md:col-span-2">
// 								<Label>Admission Number</Label>
// 								<Input
// 									name="admission_no"
// 									value={form.admission_no}
// 									onChange={handleChange}
// 									placeholder="Admission number"
// 								/>
// 							</div>

// 							<div className="md:col-span-2 flex justify-end gap-3 mt-4">
// 								<Button type="button" variant="outline">
// 									Cancel
// 								</Button>
// 								<Button
// 									type="submit"
// 									className="bg-blue-600 hover:bg-blue-700"
// 								>
// 									Save Changes
// 								</Button>
// 							</div>
// 						</form>
// 					</CardContent>
// 				</Card>
// 			</motion.div>
// 		</div>
// 	);
// }

"use client";

import { useState, useEffect } from "react";
import { createStudent as updateStudent, apiAction } from "@/app/lib/api";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ClassType, formDataType, StudentType } from "@/app/lib/types";
import { ArrowLeft } from "lucide-react";

export default function EditStudentPage({ studentId }: { studentId: number }) {
	const router = useRouter();

	const [loading, setLoading] = useState(false);
	const [student, setStudent] = useState<StudentType | null>(null);
	const [file, setFile] = useState<File | null>(null);

	const [formData, setFormData] = useState<formDataType>({
		first_name: "",
		last_name: "",
		username: "",
		date_of_birth: "",
		current_class: "",
		admission_number: "",
		gender: "",
		profile_picture: "",
		middle_name: "",
		parent_email: "",
		parent_phone: "",
		parent_first_name: "",
		parent_last_name: "",
		parent_address: "",
		password: "1234",
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
        update STUDENT
    ========================== */
	const handleFormSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();

		setLoading(true);

		try {
			const res = await updateStudent(formData, "PUT");
			const responseData = await res.json();
			if (!res.ok) {
				console.log("Create student response student:", responseData);
				throw new Error(
					JSON.stringify(responseData || "Failed to create student"),
				);
			}
			alert("Student updated successfully");
			router.push("/admin/students");
		} catch (error) {
			console.error(error);
			alert("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const fetchStudent = async () => {
			try {
				const res = await apiAction(
					"academics",
					"students",
					studentId,
					"GET",
				);
				console.log(res);

				setStudent(res);
				console.log(student);

				setFormData({
					first_name: res.user.first_name || "",
					last_name: res.user.last_name || "",
					username: res.user.username || "",
					date_of_birth: res.user.date_of_birth || "",
					current_class: String(res.current_class?.id || ""),
					admission_number: res.admission_number || "",
					gender: res.user.gender || "",
					profile_picture: res.user.profile_picture || "",
					middle_name: res.user.middle_name || "",
					parent_email: res.parent_email || "",
					parent_phone: res.parent_phone || "",
					parent_first_name: res.parent_first_name || "",
					parent_last_name: res.parent_last_name || "",
					parent_address: res.parent_address || "",
					password: "",
				});

				console.log("form data: ", formData);
			} catch (error) {
				console.error("Failed to fetch student:", error);
			}
		};

		if (studentId) {
			fetchStudent();
		}
	}, [studentId]);
	return (
		<div className="min-h-screen bg-pink-50 py-8 px-4">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="top flex items-center justify-between mb-4 relative">
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-green-900">
							Edit Student
						</h1>

						<p className="text-gray-600 mt-2">
							Update student record.
						</p>
					</div>
					<Link href="/admin" className="flex items-center gap-4">
						<button className="px-4 inline-flex gap-2 py-2 bg-red-700 text-gray-100 rounded-lg hover:bg-red-400 transition">
							<ArrowLeft size={24} />{" "}
							<span>Back to Dashboard</span>
						</button>
					</Link>
				</div>

				{/* =========================
                    FORM 
                ========================== */}

				<div className="bg-white rounded-3xl shadow-lg p-6 md:p-10">
					<form onSubmit={handleFormSubmit} className="space-y-10">
						{/* ================= STUDENT INFO ================= */}
						<div>
							<h2 className="text-xl font-semibold text-green-900 mb-6">
								Student Information
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
										placeholder="Edit first name"
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
										placeholder="Edit middle name"
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
										placeholder="Edit last name"
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
										placeholder="CHange username"
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

								{/* Admission Number */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Admission Number
									</label>

									<input
										type="text"
										name="admission_number"
										value={formData.admission_number}
										onChange={handleChange}
										required
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
										placeholder="Enter admission number"
									/>
								</div>

								{/* Class */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Class
									</label>
									<p className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700">
										{student?.current_class?.name}
									</p>
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
										<option value="">Select gender</option>
										<option value="male">Male</option>
										<option value="female">Female</option>
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
								{/*Profile picture */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Student Passport (optional)
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
										// value={formData.profile_picture}
										onChange={handleFileChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
									/>
								</div>
							</div>
						</div>

						{/* ================= PARENT INFO ================= */}
						<div>
							<div className="border-t pt-8">
								<h2 className="text-xl font-semibold text-green-900 mb-6">
									Parent Information
								</h2>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* Parent First Name */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Parent First Name
										</label>

										<input
											type="text"
											name="parent_first_name"
											value={formData.parent_first_name}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter parent first name"
										/>
									</div>

									{/* Parent Last Name */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Parent Last Name
										</label>

										<input
											type="text"
											name="parent_last_name"
											value={formData.parent_last_name}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter parent last name"
										/>
									</div>

									{/* Parent Email */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Parent Email
										</label>

										<input
											type="email"
											name="parent_email"
											value={formData.parent_email}
											onChange={handleChange}
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter parent email"
										/>
									</div>

									{/* Parent Phone */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Parent Phone
										</label>

										<input
											type="tel"
											name="parent_phone"
											value={formData.parent_phone}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter parent phone"
										/>
									</div>
									{/* Parent Address */}
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Parent Address
										</label>

										<input
											type="text"
											name="parent_address"
											value={formData.parent_address}
											onChange={handleChange}
											required
											className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
											placeholder="Enter parent address"
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Submit */}
						<div>
							<button
								type="submit"
								disabled={loading}
								className="w-full bg-green-800 hover:bg-green-900 transition text-white py-4 rounded-xl font-semibold disabled:opacity-50"
							>
								{loading
									? "Updating Student..."
									: "Update Student"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
