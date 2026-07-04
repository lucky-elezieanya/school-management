"use client";

import ActivatePortal from "@/app/components/sections/ActivatePortal";
import { fetchClasses } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { getGrades, getMaxScores } from "@/app/services/academics";
import { getPortalStatus } from "@/app/services/results";
import { useEffect, useState } from "react";

export default function ResultsAccess() {
	const { currentTerm, user } = useAuth();
	const [activatePortal, setActivatePortal] = useState(false);

	const [maxScoresCount, setMaxScoresCount] = useState(0);
	const [maxClassesCount, setClassesCount] = useState(0);
    const [gradesCount, setGradesCount] = useState(0)

	const [loading, setLoading] = useState(true);
	const [portalOpen, setPortalOpen] = useState(false);

	useEffect(() => {
		if (!user) return;
		const load = async () => {
			try {
				setLoading(true);

				const [scoresRes, classesRes, gradesRes] = await Promise.all([
					getMaxScores(),
					fetchClasses(),
                    getGrades()
				]);

				setMaxScoresCount(scoresRes?.count || 0);
				setClassesCount(classesRes?.count || 0);
                setGradesCount(gradesRes?.count || 0)

			} catch (error) {
				console.error("Failed to load dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};
		const checkPortal = async () => {
			try {
				const res =
					currentTerm && (await getPortalStatus(currentTerm?.id));
				setPortalOpen(res.results[0].open);
			} catch (error) {
				console.log(error);
			}
		};
		load();
		checkPortal();
	}, [gradesCount]);

	// =========================
	// VALIDATION LOGIC
	// =========================
	const canOpenPortal =
		maxClassesCount > 0 &&
        gradesCount > 0 &&
		maxScoresCount > 0 &&
		maxClassesCount === maxScoresCount;

	const showWarning = maxClassesCount === 0 || maxScoresCount === 0 || gradesCount === 0;

	const mismatchWarning =
		maxClassesCount > 0 &&
		maxScoresCount > 0 &&
		maxClassesCount !== maxScoresCount;

	return (
		<div className="min-h-screen bg-gray-50 flex justify-center p-6">
			<div className="w-full max-w-4xl space-y-8">
				{/* HEADER */}
				<div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<h1 className="text-2xl md:text-3xl font-bold text-gray-800">
								Result Portal Control
							</h1>
							<p className="text-gray-500 mt-1">
								Control when results are entered for each term
								and session.
							</p>
						</div>

						{/* STATUS */}
						<div>
							<span
								className={`px-3 py-1 rounded-full text-sm font-medium ${
									portalOpen
										? "bg-green-100 text-green-700"
										: "bg-red-100 text-red-600"
								}`}
							>
								{portalOpen ? "Portal Open" : "Portal Closed"}
							</span>
						</div>
					</div>

					{/* BUTTON */}
					<div className="mt-6 flex flex-col sm:flex-row gap-3">
						<button
							disabled={!canOpenPortal}
							onClick={() => setActivatePortal((prev) => !prev)}
							className={`px-5 py-3 rounded-xl font-semibold transition shadow-sm text-white ${
								!canOpenPortal
									? "bg-gray-400 cursor-not-allowed"
									: activatePortal
										? "bg-red-600 hover:bg-red-700"
										: "bg-green-600 hover:bg-green-700"
							}`}
						>
							{portalOpen
								? "Change Portal Settings"
								: "Open Portal"}
						</button>

						<p className="text-sm text-gray-500 flex items-center">
							Portal can only open when max scores and grades for all classes
							have been set.
						</p>
					</div>
				</div>

				{/* VALIDATION MESSAGES */}
				{!canOpenPortal && (
					<div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-xl">
						{loading
							? "Checking requirements..."
							: showWarning
								? "⚠️ You must create classes and set max scores before opening the portal."
								: mismatchWarning
									? "⚠️ Max scores for some classes have not been set. Please complete setup for all classes."
									: null}
					</div>
				)}

				{/* PORTAL SETTINGS */}
				{canOpenPortal && activatePortal && (
					<div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
						<ActivatePortal />
					</div>
				)}

				{/* INFO */}
				<div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-700">
					<strong>Tip:</strong> The result portal should only be
					opened when all academic setup is complete to avoid
					inconsistent result submissions.
				</div>
			</div>
		</div>
	);
}
