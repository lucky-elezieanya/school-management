"use client";

import { useEffect, useState } from "react";
import { BASE_URL, apiHeaders, createAction } from "@/app/lib/api";
import { AcademicSession, Term } from "@/app/lib/types";
import { useAuth } from "@/app/lib/hooks/useAuth";

export default function SessionTermSwitcher({
	// setActiveView,
	setToggleSessionModal,
}: {
	setToggleSessionModal: React.Dispatch<React.SetStateAction<boolean>>;
	// setActiveView: React.Dispatch<
	// 	React.SetStateAction<"create" | "toggle" | null>
	// >;
}) {
	const { setCurrentTerm } = useAuth();
	const [sessions, setSessions] = useState<AcademicSession[]>([]);
	const [terms, setTerms] = useState<Term[]>([]);

	const [selectedSession, setSelectedSession] = useState<number | null>(null);
	const [selectedTerm, setSelectedTerm] = useState<number | null>(null);

	const [loading, setLoading] = useState(false);

	// =========================
	// FETCH ALL SESSIONS
	// =========================
	const fetchSessions = async () => {
		const res = await fetch(`${BASE_URL}/academics/sessions/`, {
			headers: apiHeaders(),
		});

		const data = await res.json();
		setSessions(data.results || data);
	};

	// =========================
	// FETCH TERMS FOR SESSION
	// =========================
	const fetchTerms = async (sessionId: number) => {
		const res = await fetch(
			`${BASE_URL}/academics/sessions/${sessionId}/terms/`,
			{ headers: apiHeaders() },
		);

		const data = await res.json();
		setTerms(data.terms || data);
	};

	// =========================
	// ON SESSION CHANGE
	// =========================
	const handleSessionChange = async (sessionId: number) => {
		setSelectedSession(sessionId);
		setSelectedTerm(null);
		await fetchTerms(sessionId);
	};

	// =========================
	// ACTIVATE SESSION + TERM
	// =========================
	const handleActivate = async () => {
		if (!selectedSession || !selectedTerm) {
			alert("Please select both session and term");
			return;
		}

		setLoading(true);

		try {
			const res = await createAction(
				"academics",
				"sessions/switch-active",
				{
					session_id: selectedSession,
					term_id: selectedTerm,
				},
			);

			if (res) {
				setCurrentTerm({
					id: res.term.id,
					name: res.term.name,
					is_active: res.term.is_active,

					session: {
						id: res.session.id,
						name: res.session.name,
						is_active: res.session.is_active,
					},
				});
				await fetchSessions();
				await fetchTerms(res.session.id);
				alert("Session and Term updated successfully");
				// setActiveView(null);
				setToggleSessionModal(false);
			}
		} catch (err) {
			console.error(err);
			alert("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSessions();
	}, []);

	return (
		<div className="bg-white p-6 rounded-xl shadow space-y-6">
			<h2 className="text-xl font-bold text-gray-800">
				Switch Academic Session & Term
			</h2>

			{/* =========================
			    SESSION SELECT
			========================= */}
			<div>
				<label className="block text-sm font-medium mb-2">
					Select Session
				</label>

				<select
					className="w-full border rounded-lg p-2"
					name="session_id"
					value={selectedSession ?? ""}
					onChange={(e) =>
						handleSessionChange(Number(e.target.value))
					}
				>
					<option value="">-- Select Session --</option>
					{sessions.map((session) => (
						<option key={session.id} value={session.id}>
							{session.name} {session.is_active ? "(Active)" : ""}
						</option>
					))}
				</select>
			</div>

			{/* =========================
			    TERM SELECT
			========================= */}
			{selectedSession && (
				<div>
					<label className="block text-sm font-medium mb-2">
						Select Term
					</label>

					<select
						className="w-full border rounded-lg p-2"
						name="term_id"
						value={selectedTerm ?? ""}
						onChange={(e) =>
							setSelectedTerm(Number(e.target.value))
						}
					>
						<option value="">-- Select Term --</option>
						{terms.map((term) => (
							<option key={term.id} value={term.id}>
								{term.name} {term.is_active ? "(Active)" : ""}
							</option>
						))}
					</select>
				</div>
			)}

			{/* =========================
			    ACTION BUTTON
			========================= */}
			<button
				onClick={handleActivate}
				disabled={loading}
				className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
			>
				{loading ? "Updating..." : "Set as Active"}
			</button>
		</div>
	);
}
