"use client";

import { useEffect, useState } from "react";
import { getPortalStatus, savePortalStatus } from "@/app/services/results";
import { getSessions, sessionTerms } from "@/app/services/academics";
import { createAction } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";

export default function ActivatePortal() {
	const router = useRouter();
	const { currentTerm } = useAuth();
	const [loading, setLoading] = useState(false);

	const [sessions, setSessions] = useState<any[]>([]);
	const [terms, setTerms] = useState<any[]>([]);

	const [record, setRecord] = useState<any>(null);

	const [form, setForm] = useState({
		open: false,
		session_id: "",
		term_id: "",
	});

	// =========================
	// LOAD INITIAL DATA
	// =========================
	useEffect(() => {
		const load = async () => {
			const [sess, portal] = await Promise.all([
				getSessions(),
				currentTerm && getPortalStatus(currentTerm?.id),
			]);

			setSessions(sess?.results || []);

			if (portal?.results?.length > 0) {
				const data = portal.results[0];

				setRecord(data);

				setForm({
					open: data.open,
					session_id: data.session?.id || "",
					term_id: data.term?.id || "",
				});
			}
		};

		load();
	}, []);

	// =========================
	// LOAD TERMS WHEN SESSION CHANGES
	// =========================
	useEffect(() => {
		const loadTerms = async () => {
			if (!form.session_id) {
				setTerms([]);
				return;
			}

			const res = await sessionTerms(Number(form.session_id));

			setTerms(res?.terms || []);
		};

		loadTerms();
	}, [form.session_id]);

	// =========================
	// HANDLE INPUT CHANGE
	// =========================
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value, type } = e.target;

		setForm((prev) => ({
			...prev,
			[name]:
				type === "checkbox"
					? (e.target as HTMLInputElement).checked
					: value,
		}));
	};

	// =========================
	// SUBMIT
	// =========================
	const handleSubmit = async () => {
		setLoading(true);

		const payload = {
			open: form.open,
			session_id: Number(form.session_id),
			term_id: Number(form.term_id),
		};
		try {
			const res = await createAction(
				"results",
				"activate-portal",
				payload,
			);
			if (res) {
				setLoading(false);
				alert("Portal updated successfully");
				router.push("/admin/administration");
			}
		} catch (error) {
			alert("An error occurred ");
		}
	};
	// UI
	// =========================
	return (
		<div className="min-h-screen bg-gray-50 p-6 flex justify-center">
			<div className="w-full max-w-xl bg-white shadow-md rounded-xl p-6 space-y-6">
				<h1 className="text-2xl font-bold text-gray-800">
					Result Portal Control
				</h1>

				{/* OPEN TOGGLE */}
				<label className="flex flex-col items-left text-left gap-2 cursor-pointer">
					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							name="open"
							checked={form.open}
							onChange={handleChange}
							className="w-4 h-4"
						/>
						<span className="text-gray-700 font-medium">
							Open Result Portal
						</span>
					</div>
					<p className="text-gray-400 italic text-xs">
						Uncheck this box and submit to close portal
					</p>
				</label>

				{/* SESSION */}
				<div>
					<label className="text-sm text-gray-600">Session</label>
					<select
						name="session_id"
						value={form.session_id}
						onChange={handleChange}
						className="mt-1 border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">Select Session</option>
						{sessions.map((s: any) => (
							<option key={s.id} value={s.id}>
								{s.name} {s.is_active && "(Active)"}
							</option>
						))}
					</select>
				</div>

				{/* TERM */}
				<div>
					<label className="text-sm text-gray-600">Term</label>
					<select
						name="term_id"
						value={form.term_id}
						onChange={handleChange}
						className="mt-1 border rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={!form.session_id}
					>
						<option value="">Select Term</option>
						{terms.map((t: any) => (
							<option key={t.id} value={t.id}>
								{t.name} {t.is_active && "(Active)"}
							</option>
						))}
					</select>
				</div>

				{/* BUTTON */}
				<button
					onClick={handleSubmit}
					disabled={loading}
					className={`w-full py-3 rounded-lg font-semibold transition ${
						loading
							? "bg-gray-400 cursor-not-allowed"
							: "bg-green-600 hover:bg-green-700"
					} text-white`}
				>
					{loading ? "Saving..." : "Update Portal"}
				</button>
			</div>
		</div>
	);
}
