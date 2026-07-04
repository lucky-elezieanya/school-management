"use client";

import { useState } from "react";
import { Users, GraduationCap } from "lucide-react";
import BulkEnrollments from "@/app/components/forms/BulkEnrollments";

export default function EnrollmentPage() {
	const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
				<div className="mb-8">
					<h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
						Student Enrollment
					</h1>

					<p className="mt-2 text-gray-600">
						Enroll multiple students into an academic session and
						class at once.
					</p>
				</div>

				{!showEnrollmentForm ? (
					<div className="grid gap-6">
						<div className="bg-white rounded-2xl shadow-sm border p-6 lg:p-8">
							<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
								<div className="flex gap-4">
									<div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center">
										<GraduationCap size={28} />
									</div>

									<div>
										<h2 className="text-xl font-semibold">
											Bulk Enrollment
										</h2>

										<p className="text-gray-600 mt-2">
											Select a session, select a class,
											then choose one or many students to
											enroll.
										</p>
									</div>
								</div>

								<button
									type="button"
									onClick={() => setShowEnrollmentForm(true)}
									className="w-full lg:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
								>
									Start Enrollment
								</button>
							</div>
						</div>

						<div className="grid md:grid-cols-2 gap-4">
							<div className="bg-white rounded-xl border p-5">
								<div className="flex items-center gap-3 mb-3">
									<Users size={22} />
									<h3 className="font-semibold">
										Bulk Selection
									</h3>
								</div>

								<p className="text-sm text-gray-600">
									Select individual students or use "Select
									All" to enroll an entire group at once.
								</p>
							</div>

							<div className="bg-white rounded-xl border p-5">
								<div className="flex items-center gap-3 mb-3">
									<GraduationCap size={22} />
									<h3 className="font-semibold">
										Fast Processing
									</h3>
								</div>

								<p className="text-sm text-gray-600">
									Uses a bulk API endpoint to enroll all
									selected students in a single request.
								</p>
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div>
								<h2 className="text-xl font-semibold">
									Bulk Enrollment Form
								</h2>

								<p className="text-sm text-gray-600">
									Choose session, class and students.
								</p>
							</div>

							<button
								type="button"
								onClick={() => setShowEnrollmentForm(false)}
								className="px-4 py-2 border rounded-lg hover:bg-gray-100"
							>
								Close Form
							</button>
						</div>

						<div className="bg-white rounded-2xl border shadow-sm p-4 lg:p-6">
							<BulkEnrollments />
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
