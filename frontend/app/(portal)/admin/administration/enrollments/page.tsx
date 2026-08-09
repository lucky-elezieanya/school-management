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
						Add Returning students to class
					</h1>

					<p className="mt-2 text-gray-600">
						Manually Enroll multiple students into an academic session and
						class at once.
					</p>
				</div>


						<div className="bg-white rounded-2xl border shadow-sm p-4 lg:p-6">
							<BulkEnrollments />
						</div>
					</div>
			
			</div>

	);
}
