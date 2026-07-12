import { StudentType, TeacherType, UserType } from "@/app/lib/types";
import {
	Users,
	GraduationCap,
	UserCheck,
	BookOpen,
	FileBarChart2,
	School,
} from "lucide-react";

export default function DashboardCards({
	usersCount,
	studentsCount,
	teachersCount,
	subjectsCount,
	classesCount,
    resultsCount
}: {
	usersCount: number;
	studentsCount: number;
	teachersCount: number;
	subjectsCount: number;
	classesCount: number;
    resultsCount: number
}) {
	const cards = [
		{
			title: "Total Users",
			value: usersCount,
			icon: Users,
			color: "bg-blue-50 text-blue-600",
		},
		{
			title: "Students",
			value: studentsCount,
			icon: GraduationCap,
			color: "bg-green-50 text-green-600",
		},
		{
			title: "Teachers",
			value: teachersCount,
			icon: UserCheck,
			color: "bg-purple-50 text-purple-600",
		},
		{
			title: "Subjects",
			value: subjectsCount,
			icon: BookOpen,
			color: "bg-orange-50 text-orange-600",
		},
		{
			title: "Classes",
			value: classesCount,
			icon: School,
			color: "bg-orange-50 text-orange-600",
		},
		{
			title: "Results",
			value: resultsCount,
			icon: FileBarChart2,
			color: "bg-pink-50 text-pink-600",
		},
	];

	return (
		<div className="w-full flex justify-center mb-6">
			<div className="w-full max-w-7xl grid grid-cols-2 lg:grid-cols-4 gap-4">
				{cards.map((card, i) => {
					const Icon = card.icon;

					return (
						<div
							key={i}
							className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
						>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-500">
										{card.title}
									</p>
									<h3 className="text-2xl font-bold text-gray-800 mt-1">
										{card.value}
									</h3>
								</div>

								<div
									className={`p-3 rounded-xl ${card.color} group-hover:scale-110 transition-transform`}
								>
									<Icon size={36} />
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
