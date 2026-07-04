// components/ClassesSidebar.tsx
"use client";

import { fetchClasses } from "@/app/services/results";
import { useEffect, useState } from "react";

export default function ClassesSidebar({
	selectedClass,
	setSelectedClass,
	setSelectedSubject,
}: any) {
	const [classes, setClasses] = useState<any[]>([]);

	useEffect(() => {
		fetchClasses().then((res: any) => setClasses(res.results)
     
        );

	}, []);

	return (
		<div className=" border-r flex flex-row flex-wrap gap-3 sticky top-0  p-4 ">
			{classes.map((cls) => (
				<div key={cls.id}>
					<button
						onClick={() => {
							setSelectedClass(cls);
							setSelectedSubject(null);
						}}
						className={`w-full text-left p-2 ${
							selectedClass?.id === cls.id
								? "bg-blue-500 text-white"
								: ""
						}`}
					>
						{cls.name} {cls.arm.code}
					</button>
				</div>
			))}
		</div>
	);
}
