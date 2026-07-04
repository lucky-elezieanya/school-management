"use client";

import ResultsComponent from "@/app/components/sections/ResultsComponent";
import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useEffect, useState } from "react";

export default function ResultsPage() {
	const { currentTerm } = useAuth();

	const [portal, setPortal] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!currentTerm?.id || !currentTerm?.session?.id) {
			setLoading(false);
			return;
		}

		const getActivatedPortal = async () => {
			try {
				setLoading(true);
				const url = `${BASE_URL}/results/activate-portal/?term=${currentTerm.id}`;

				const resp = await fetch(url, {
					headers: apiHeaders(),
				});
				const res = await resp.json();
				if (resp.ok) {
					setPortal(res?.results[0] ?? null);
				}
			} catch (error) {
				console.error("Portal fetch error:", error);
				setPortal(null);
			} finally {
				setLoading(false);
			}
		};

		getActivatedPortal();
	}, [currentTerm]);
	if (loading) {
		return (
			<div className="p-6">
				<h1 className="text-xl font-semibold">
					Checking portal status...
				</h1>
			</div>
		);
	}

	return (
		<div className="p-6">
			<h1 className="text-2xl font-bold mb-6">
				Enter Results for {currentTerm?.name}
			</h1>

			{portal?.open ? (
				<ResultsComponent />
			) : (
				<div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
					<h2 className="font-semibold">Result Portal Not Open</h2>
					<p className="mt-1 text-sm">
						The result entry portal has not been activated for{" "}
						{currentTerm?.name}. Contact the administrator if you
						believe this is an error.
					</p>
				</div>
			)}
		</div>
	);
}
