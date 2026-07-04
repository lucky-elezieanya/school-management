"use client";

import { useEffect, useState } from "react";
import {
	getResumptionDate,
	updateResumptionDate,
} from "@/app/services/results";
import { getSessions, sessionTerms } from "@/app/services/academics";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function ResumptionDatePage() {
	const router = useRouter();
	const { currentTerm } = useAuth();

	const [loading, setLoading] = useState(false);
	const [pageLoading, setPageLoading] = useState(true);

	const [sessions, setSessions] = useState<any[]>([]);
	const [terms, setTerms] = useState<any[]>([]);

	const [record, setRecord] = useState<any>(null);

	const [form, setForm] = useState({
		resumption_date: "",
		current_session_id: "",
		next_session_id: "",
		current_term_id: "",
		next_term_id: "",
	});

	// =========================
	// LOAD INITIAL DATA
	// =========================
	useEffect(() => {
		const load = async () => {
			try {
				setPageLoading(true);

				const [sessionsRes, resumptionRes] = await Promise.all([
					getSessions(),
					getResumptionDate(),
				]);

				setSessions(sessionsRes?.results || []);

				if (resumptionRes?.results?.length > 0) {
					const data = resumptionRes.results[0];

					setRecord(data);

					setForm({
						resumption_date: data.resumption_date || "",
						current_session_id: String(
							data.current_session?.id || "",
						),
						next_session_id: String(data.next_session?.id || ""),
						current_term_id: String(data.current_term?.id || ""),
						next_term_id: String(data.next_term?.id || ""),
					});
				}
			} catch (error) {
				console.error(error);
				alert("Failed to load resumption date information.");
			} finally {
				setPageLoading(false);
			}
		};

		load();
	}, []);

	// =========================
	// LOAD TERMS WHEN SESSION CHANGES
	// =========================
	useEffect(() => {
		const loadTerms = async () => {
			try {
				if (!form.current_session_id) {
					setTerms([]);
					return;
				}

				const res = await sessionTerms(Number(form.current_session_id));

				setTerms(res?.terms || []);
			} catch (error) {
				console.error(error);
				setTerms([]);
			}
		};

		loadTerms();
	}, [form.current_session_id]);

	// =========================
	// HANDLE INPUT CHANGE
	// =========================
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;

		setForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// =========================
	// SUBMIT
	// =========================
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			setLoading(true);

			const payload: any = {
				resumption_date: form.resumption_date,
				current_session_id: Number(form.current_session_id),
				current_term_id: Number(form.current_term_id),
				next_term_id: Number(form.next_term_id),
			};

			// Only send next session during third term
			if (currentTerm?.name?.toLowerCase().includes("third")) {
				payload.next_session_id = Number(form.next_session_id);
			}

			const response = await updateResumptionDate(payload, record?.id);

			// If created for first time
			if (!record && response?.id) {
				setRecord(response);
			}

			alert(
				record
					? "Resumption date updated successfully."
					: "Resumption date created successfully.",
			);
			setForm({
				resumption_date: "",
				current_session_id: "",
				next_session_id: "",
				current_term_id: "",
				next_term_id: "",
			});
			router.push("/admin/administration/");
		} catch (error: any) {
			console.error(error);

			alert(error?.message || "Failed to save resumption date.");
		} finally {
			setLoading(false);
		}
	};

	// =========================
	// LOADING UI
	// =========================
	if (pageLoading) {
		return (
			<div className="flex justify-center items-center min-h-100">
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	// =========================
	// PAGE UI
	// =========================
	return (
		<div className="min-h-screen bg-gray-50 p-4 sm:p-6">
			<div className="max-w-2xl mx-auto bg-white border rounded-2xl shadow-sm">
				<div className="border-b px-6 py-5">
					<h1 className="text-xl sm:text-2xl font-bold text-gray-800">
						Resumption Date Setup
					</h1>

					<p className="text-sm text-gray-500 mt-1">
						Configure the next resumption date, session and term.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-5">
					{/* DATE */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Resumption Date
						</label>

						<input
							type="date"
							name="resumption_date"
							value={form.resumption_date}
							onChange={handleChange}
							required
							className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					{/* CURRENT SESSION */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Current Session
						</label>

						<select
							name="current_session_id"
							value={form.current_session_id}
							onChange={handleChange}
							required
							className="w-full border rounded-lg p-3"
						>
							<option value="">Select Session</option>

							{sessions.map((s: any) => (
								<option key={s.id} value={s.id}>
									{s.name} {s.is_active ? "(Active)" : ""}
								</option>
							))}
						</select>
					</div>

					{/* NEXT SESSION */}
					{currentTerm?.name?.toLowerCase().includes("third") && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Next Session
							</label>

							<select
								name="next_session_id"
								value={form.next_session_id}
								onChange={handleChange}
								required
								className="w-full border rounded-lg p-3"
							>
								<option value="">Select Session</option>

								{sessions.map((s: any) => (
									<option key={s.id} value={s.id}>
										{s.name}
									</option>
								))}
							</select>
						</div>
					)}

					{/* CURRENT TERM */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Current Term
						</label>

						<select
							name="current_term_id"
							value={form.current_term_id}
							onChange={handleChange}
							required
							disabled={!form.current_session_id}
							className="w-full border rounded-lg p-3 disabled:bg-gray-100"
						>
							<option value="">Select Term</option>

							{terms.map((t: any) => (
								<option key={t.id} value={t.id}>
									{t.name} {t.is_active ? "(Active)" : ""}
								</option>
							))}
						</select>
					</div>

					{/* NEXT TERM */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Next Term
						</label>

						<select
							name="next_term_id"
							value={form.next_term_id}
							onChange={handleChange}
							required
							disabled={!form.current_session_id}
							className="w-full border rounded-lg p-3 disabled:bg-gray-100"
						>
							<option value="">Select Term</option>

							{terms.map((t: any) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>

					<button
						type="submit"
						disabled={loading}
						className={`w-full py-3 rounded-lg font-semibold text-white transition ${
							loading
								? "bg-gray-400 cursor-not-allowed"
								: "bg-blue-600 hover:bg-blue-700"
						}`}
					>
						{loading
							? "Saving..."
							: record
								? "Update Resumption Date"
								: "Create Resumption Date"}
					</button>
				</form>
			</div>
		</div>
	);
}
