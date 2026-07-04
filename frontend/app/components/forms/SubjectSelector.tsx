"use client";

import { useEffect, useState } from "react";

interface Subject {
	id: number;
	name: string;
	code: string;
}

interface ExistingSubject {
	id: number;
	subject: Subject;
}

interface SubjectSelectorProps {
	allSubjects: Subject[];
	existingSubjects?: ExistingSubject[];
	onSubmit: (selectedIds: number[]) => Promise<void> | void;
	title?: string;
	buttonText?: string;
	loading?: boolean;
}

export default function SubjectSelector({
	allSubjects,
	existingSubjects = [],
	onSubmit,
	title = "Assign Subjects",
	buttonText = "Add Subjects",
	loading = false,
}: SubjectSelectorProps) {
	const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);

	useEffect(() => {
		setSelectedSubjects(
			existingSubjects.map((item) => item.subject.id),
		);
	}, [existingSubjects]);

	const toggleSubject = (subjectId: number) => {
		setSelectedSubjects((prev) =>
			prev.includes(subjectId)
				? prev.filter((id) => id !== subjectId)
				: [...prev, subjectId],
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await onSubmit(selectedSubjects);
	};

	return (
		<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
			<div className="mb-6">
				<h2 className="text-xl font-bold text-gray-800">
					{title}
				</h2>

				<p className="text-sm text-gray-500 mt-1">
					Select subjects to assign.
				</p>
			</div>

			<form onSubmit={handleSubmit}>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{allSubjects.map((subject) => {
						const checked = selectedSubjects.includes(
							subject.id,
						);

						return (
							<label
								key={subject.id}
								className={`flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition ${
									checked
										? "border-blue-500 bg-blue-50"
										: "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
								}`}
							>
								<input
									type="checkbox"
									checked={checked}
									onChange={() =>
										toggleSubject(subject.id)
									}
									className="w-4 h-4"
								/>

								<div>
									<p className="font-semibold text-gray-800">
										{subject.name}
									</p>

									<p className="text-sm text-gray-500">
										{subject.code}
									</p>
								</div>
							</label>
						);
					})}
				</div>

				<div className="mt-6 flex justify-end">
					<button
						type="submit"
						disabled={loading}
						className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
					>
						{loading ? "Saving..." : buttonText}
					</button>
				</div>
			</form>
		</div>
	);
}