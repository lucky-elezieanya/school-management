"use client";

import { useState } from "react";
import { FileText, Users, BookOpen } from "lucide-react";
import TermCommentEntryPage from "@/app/components/forms/CommentsForm";
import { useRouter } from "next/navigation";

export default function CommentsPage() {
	const router = useRouter();
	const [showForm, setShowForm] = useState(false);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
				{/* HEADER */}
				<div className="mb-8">
					<h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
						Term Comments
					</h1>

					<p className="mt-2 text-gray-600">
						Enter class teacher and principal comments for students
						at the end of each term.
					</p>
				</div>

				{/* LANDING VIEW */}
				{!showForm ? (
					<div className="space-y-6">
						{/* MAIN ACTION CARD */}
						<div className="bg-white border rounded-2xl shadow-sm p-6 lg:p-8">
							<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
								<div className="flex gap-4">
									<div className="h-14 w-14 rounded-xl bg-green-100 flex items-center justify-center">
										<FileText size={28} />
									</div>

									<div>
										<h2 className="text-xl font-semibold">
											Student Term Comments
										</h2>

										<p className="text-gray-600 mt-2">
											Select class, student, then enter
											academic performance comments.
										</p>
									</div>
								</div>

								<button
									onClick={() => setShowForm(true)}
									className="w-full lg:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition"
								>
									Start Comment Entry
								</button>
							</div>
						</div>

						{/* INFO CARDS */}
						<div className="grid md:grid-cols-3 gap-4">
							<div className="bg-white border rounded-xl p-5">
								<div className="flex items-center gap-3 mb-3">
									<Users size={20} />
									<h3 className="font-semibold">
										Student Selection
									</h3>
								</div>

								<p className="text-sm text-gray-600">
									Filter by class and pick students
									individually for accurate comments.
								</p>
							</div>

							<div className="bg-white border rounded-xl p-5">
								<div className="flex items-center gap-3 mb-3">
									<BookOpen size={20} />
									<h3 className="font-semibold">
										Academic Evaluation
									</h3>
								</div>

								<p className="text-sm text-gray-600">
									Record teacher and principal remarks with
									performance metrics.
								</p>
							</div>

							<div className="bg-white border rounded-xl p-5">
								<div className="flex items-center gap-3 mb-3">
									<FileText size={20} />
									<h3 className="font-semibold">
										Term Reports
									</h3>
								</div>

								<p className="text-sm text-gray-600">
									Comments are saved per student per term for
									report generation.
								</p>
							</div>
						</div>
					</div>
				) : (
					/* FORM VIEW */
					<div className="space-y-4">
						{/* TOP BAR */}
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div>
								<h2 className="text-xl font-semibold">
									Enter Term Comments
								</h2>

								<p className="text-sm text-gray-600">
									Fill student academic remarks for the
									current term.
								</p>
							</div>

							<button
								onClick={() => setShowForm(false)}
								className="px-4 py-2 border rounded-lg hover:bg-gray-100"
							>
								Close Form
							</button>
							<button
								onClick={() => router.back()}
								className="px-4 py-2 border bg-red-600 text-gray-50 font-bold rounded-lg hover:bg-red-500"
							>
								Exit this page
							</button>
						</div>

						{/* FORM CONTAINER */}
						<div className="bg-white border rounded-2xl shadow-sm p-4 lg:p-6">
							<TermCommentEntryPage />
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
