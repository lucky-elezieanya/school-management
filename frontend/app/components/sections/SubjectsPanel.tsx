// components/SubjectsPanel.tsx
"use client";

import { useAuth } from "@/app/lib/hooks/useAuth";
import { fetchSubjects } from "@/app/services/results";
import { useEffect, useState } from "react";

export default function SubjectsPanel({
	selectedClass,
	setSelectedSubject,
    selectedSubject
}: any) {
	const { currentTerm } = useAuth();
	const [subjects, setSubjects] = useState<any[]>([]);

	const getSubjects = async () => {
		currentTerm &&
			(await fetchSubjects(selectedClass.id, currentTerm.id).then(
				(res: any) => {
					setSubjects(res.subjects);
				},
			));
	};

	useEffect(() => {
		if (!selectedClass) return;
		currentTerm && getSubjects();
	}, [selectedClass, currentTerm]);

	return (
		<div className="flex flex-row flex-wrap gap-3  p-4">
			{subjects.length > 0 ? (
				subjects.map((sub) => (
					<div
						key={sub.id}
						onClick={() => setSelectedSubject(sub)}
						className={`p-3 border rounded cursor-pointer ${selectedSubject === sub && "bg-blue-500 text-white"}`}
					>
						{sub.subject.name}
					</div>
				))
			) : (
				<p className=" bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-xl">
					You have not registered any subjects for{" "}
					{selectedClass.name} {currentTerm?.name}. Go back and
					register your class subjects for this term
				</p>
			)}
		</div>
	);
}
