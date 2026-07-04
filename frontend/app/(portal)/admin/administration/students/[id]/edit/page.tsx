"use client";

import { useState, useEffect } from "react";
import { updateAction, apiAction, fetchClasses } from "@/app/lib/api";

import { ClassType, StudentFormDataType, StudentType } from "@/app/lib/types";

import { ArrowLeft } from "lucide-react";

import { useRouter, useParams } from "next/navigation";

export default function EditStudentPage() {
	const router = useRouter();

	const params = useParams<{ id: string }>();

	const studentId = Number(params.id);

	const [loading, setLoading] = useState(false);

	const [student, setStudent] = useState<StudentType | null>(null);

	const [studentClasses, setStudentClasses] = useState<ClassType[]>([]);

	const [errors, setErrors] = useState<Record<string, string[]>>({});

	const [formData, setFormData] = useState<StudentFormDataType>({
		first_name: "",
		last_name: "",
		username: "",
		date_of_birth: "",
		admission_number: "",
		gender: "",
		profile_picture: "",
		middle_name: "",
		parent_email: "",
		parent_phone: "",
		parent_first_name: "",
		parent_last_name: "",
		parent_address: "",
		password: "",
	});

	/* =========================================
        HANDLE INPUT CHANGE
    ========================================= */
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	/* =========================================
        HANDLE FILE CHANGE
    ========================================= */
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0];

			setFormData((prev) => ({
				...prev,
				profile_picture: selectedFile,
			}));
		}
	};

	/* =========================================
        UPDATE STUDENT
    ========================================= */
	const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			setLoading(true);

			setErrors({});

			const submittedData: any = {
				first_name: formData.first_name,
				middle_name: formData.middle_name,
				last_name: formData.last_name,
				username: formData.username,
				gender: formData.gender,
				date_of_birth: formData.date_of_birth,
				admission_number: formData.admission_number,
				parent_first_name: formData.parent_first_name,
				parent_last_name: formData.parent_last_name,
				parent_email: formData.parent_email,
				parent_phone: formData.parent_phone,
				parent_address: formData.parent_address,
			};

			// SEND PASSWORD ONLY IF PROVIDED
			if (formData.password?.trim()) {
				submittedData.password = formData.password;
			}

			// SEND FILE ONLY IF NEW FILE EXISTS
			if (formData.profile_picture instanceof File) {
				submittedData.profile_picture = formData.profile_picture;
			}

			const res = await updateAction(
				"academics",
				"students",
				studentId,
				submittedData,
				"PATCH",
			);

			if (res) {
				alert("Student updated successfully");

				router.push(`/admin/administration/students/${studentId}`);
			}
		} catch (error: any) {
			console.log(error);

			setErrors(error);

			alert("Failed to update student");
		} finally {
			setLoading(false);
		}
	};

	/* =========================================
        FETCH DATA
    ========================================= */
	useEffect(() => {
		const fetchStudent = async () => {
			try {
				const res = await apiAction(
					"academics",
					"students",
					studentId,
					"GET",
				);

				setStudent(res);

				setFormData({
					first_name: res?.user?.first_name || "",
					last_name: res?.user?.last_name || "",
					username: res?.user?.username || "",
					date_of_birth: res?.user?.date_of_birth || "",
					admission_number: res?.admission_number || "",
					gender: res?.user?.gender || "",
					profile_picture: res?.user?.profile_picture || "",
					middle_name: res?.user?.middle_name || "",
					parent_email: res?.parent_email || "",
					parent_phone: res?.parent_phone || "",
					parent_first_name: res?.parent_first_name || "",
					parent_last_name: res?.parent_last_name || "",
					parent_address: res?.parent_address || "",
					password: res?.user.password || "",
				});
			} catch (error) {
				console.error("Failed to fetch student:", error);
			}
		};

		const getClasses = async () => {
			try {
				const res = await fetchClasses();

				setStudentClasses(res.results || res);
			} catch (error) {
				console.log(error);
			}
		};

		if (studentId) {
			fetchStudent();

			getClasses();
		}
	}, [studentId]);

	return (
		<div className="min-h-screen bg-pink-50 py-8 px-4">
			<div className="max-w-6xl mx-auto">
				{/* HEADER */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-green-900">
							Edit {formData.first_name}'s Account
						</h1>

						<p className="text-gray-600 mt-2">
							Update student record
						</p>
					</div>

					<button
						onClick={() => router.back()}
						className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-700 text-white hover:bg-red-800 transition"
					>
						<ArrowLeft size={20} />
						Back
					</button>
				</div>

				{/* FORM */}
				<div className="bg-white rounded-3xl shadow-lg p-6 md:p-10">
					<form onSubmit={handleFormSubmit} className="space-y-10">
						{/* STUDENT INFO */}
						<div>
							<h2 className="text-xl font-semibold text-green-900 mb-6">
								Student Information
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* FIRST NAME */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										First Name
									</label>

									<input
										type="text"
										name="first_name"
										value={formData.first_name}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
									/>

									{errors.first_name && (
										<p className="text-red-600 text-sm mt-1">
											{errors.first_name[0]}
										</p>
									)}
								</div>

								{/* MIDDLE NAME */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Middle Name
									</label>

									<input
										type="text"
										name="middle_name"
										value={formData.middle_name}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
									/>
								</div>

								{/* LAST NAME */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Last Name
									</label>

									<input
										type="text"
										name="last_name"
										value={formData.last_name}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
									/>
								</div>

								{/* USERNAME */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Username
									</label>

									<input
										type="text"
										name="username"
										value={formData.username}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
									/>

									{errors.username && (
										<p className="text-red-600 text-sm mt-1">
											{errors.username[0]}
										</p>
									)}
								</div>

								{/* PASSWORD */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										New Password
									</label>

									<input
										type="text"
										name="password"
										value={formData.password}
										onChange={handleChange}
										placeholder="Leave empty to keep old password"
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
									/>
								</div>

								{/* ADMISSION NUMBER */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Admission Number
									</label>

									<input
										type="text"
										name="admission_number"
										value={formData.admission_number}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
									/>

									{errors.admission_number && (
										<p className="text-red-600 text-sm mt-1">
											{errors.admission_number[0]}
										</p>
									)}
								</div>

								{/* CLASS */}
								<div>
									<h3 className="block text-sm font-medium text-gray-700 mb-2">
										Class
									</h3>

									<span className="w-full flex rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700">
										{
											student?.current_enrollment
												.school_class.name
										}
									</span>
								</div>

								{/* GENDER */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Gender
									</label>

									<select
										name="gender"
										value={formData.gender}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
									>
										<option value="">Select Gender</option>

										<option value="male">Male</option>

										<option value="female">Female</option>
									</select>
								</div>

								{/* DOB */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Date of Birth
									</label>

									<input
										type="date"
										name="date_of_birth"
										value={formData.date_of_birth}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
									/>
								</div>

								{/* PROFILE PICTURE */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Student Passport
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
										className="w-20 h-20 rounded-full object-cover mb-3"
									/>

									<input
										type="file"
										onChange={handleFileChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3"
									/>
								</div>
							</div>
						</div>

						{/* PARENT INFO */}
						<div className="border-t pt-8">
							<h2 className="text-xl font-semibold text-green-900 mb-6">
								Parent Information
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Parent First Name
									</label>

									<input
										type="text"
										name="parent_first_name"
										value={formData.parent_first_name}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Parent Last Name
									</label>

									<input
										type="text"
										name="parent_last_name"
										value={formData.parent_last_name}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Parent Email
									</label>

									<input
										type="email"
										name="parent_email"
										value={formData.parent_email}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Parent Phone
									</label>

									<input
										type="text"
										name="parent_phone"
										value={formData.parent_phone}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3"
									/>
								</div>

								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Parent Address
									</label>

									<input
										type="text"
										name="parent_address"
										value={formData.parent_address}
										onChange={handleChange}
										className="w-full rounded-xl border border-gray-300 px-4 py-3"
									/>
								</div>
							</div>
						</div>

						{/* SUBMIT */}
						<div>
							<button
								type="submit"
								disabled={loading}
								className="w-full bg-green-800 hover:bg-green-900 text-white py-4 rounded-xl font-semibold transition disabled:opacity-50"
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
