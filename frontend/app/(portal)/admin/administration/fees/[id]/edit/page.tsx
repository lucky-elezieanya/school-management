"use client";

import { useEffect, useState } from "react";
import { apiAction, apiHeaders, BASE_URL, updateAction } from "@/app/lib/api";

import { ArrowLeft } from "lucide-react";

import { useParams, useRouter } from "next/navigation";

export default function EditClassFeePage() {
	const params = useParams<{ id: string }>();

	const router = useRouter();

	const feeId = Number(params.id);

	const [loading, setLoading] = useState(false);

	const [fetching, setFetching] = useState(true);

	const [classes, setClasses] = useState<any[]>([]);

	const [sessions, setSessions] = useState<any[]>([]);

	const [terms, setTerms] = useState<any[]>([]);

	const [form, setForm] = useState({
		school_class_id: "",
		session_id: "",
		term_id: "",
		amount: "",
	});

	// =========================
	// FETCH TERMS
	// =========================
	const fetchTerms = async (sessionId: string) => {
		if (!sessionId) {
			setTerms([]);
			return;
		}

		try {
			const res = await fetch(
				`${BASE_URL}/academics/sessions/${sessionId}/terms/`,
				{
					headers: apiHeaders(),
				},
			);

			const data = await res.json();

			setTerms(data.terms || data);
		} catch (err) {
			console.log(err);
		}
	};

	// =========================
	// LOAD DATA
	// =========================
	const loadData = async () => {
		try {
			setFetching(true);

			const [cls, ses, fee] = await Promise.all([
				apiAction("academics", "classes"),
				apiAction("academics", "sessions"),
				apiAction("results", "classfees", feeId, "GET"),
			]);

			setClasses(cls.results || []);

			setSessions(ses.results || []);

			if (fee.session?.id) {
				await fetchTerms(String(fee.session.id));
			}

			setForm({
				school_class_id: String(fee.school_class?.id || ""),
				session_id: String(fee.session?.id || ""),
				term_id: String(fee.term?.id || ""),
				amount: String(fee.amount || ""),
			});
		} catch (err) {
			console.log(err);
		} finally {
			setFetching(false);
		}
	};

	useEffect(() => {
		if (feeId) {
			loadData();
		}
	}, [feeId]);

	// =========================
	// HANDLE CHANGE
	// =========================
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;

		setForm((prev) => ({
			...prev,
			[name]: value,
		}));

		if (name === "session_id") {
			setForm((prev) => ({
				...prev,
				session_id: value,
				term_id: "",
			}));

			fetchTerms(value);
		}
	};

	// =========================
	// UPDATE
	// =========================
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			setLoading(true);

			const payload = {
				...form,
				amount: Number(form.amount),
			};

			const res = await updateAction(
				"results",
				"classfees",
				feeId,
				payload,
				"PATCH",
			);

			if (res) {
				alert("Fee updated successfully");

				router.push("/admin/administration/fees");
			}
		} catch (err) {
			console.log(err);

			alert("Failed to update fee");
		} finally {
			setLoading(false);
		}
	};

	if (fetching) {
		return (
			<div className="p-10 text-center text-gray-500">Loading fee...</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-4 md:p-8">
			<div className="max-w-3xl mx-auto">
				{/* HEADER */}
				<div className="flex items-center gap-4 mb-8">
					<button
						onClick={() => router.back()}
						className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition"
					>
						<ArrowLeft size={20} />
					</button>

					<div>
						<h1 className="text-3xl font-bold text-gray-800">
							Edit Class Fee
						</h1>

						<p className="text-gray-500 mt-1">
							Update class fee details
						</p>
					</div>
				</div>

				{/* FORM */}
				<div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm">
					<form onSubmit={handleSubmit} className="space-y-5">
						{/* CLASS */}
						<div>
							<label className="block mb-2 text-sm font-semibold text-gray-700">
								Class
							</label>

							<select
								name="school_class_id"
								value={form.school_class_id}
								onChange={handleChange}
								className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Select Class</option>

								{classes.map((c) => (
									<option key={c.id} value={c.id}>
										{c.name} - {c.arm?.name}
									</option>
								))}
							</select>
						</div>

						{/* SESSION */}
						<div>
							<label className="block mb-2 text-sm font-semibold text-gray-700">
								Session
							</label>

							<select
								name="session_id"
								value={form.session_id}
								onChange={handleChange}
								className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Select Session</option>

								{sessions.map((s) => (
									<option key={s.id} value={s.id}>
										{s.name}
									</option>
								))}
							</select>
						</div>

						{/* TERM */}
						<div>
							<label className="block mb-2 text-sm font-semibold text-gray-700">
								Term
							</label>

							<select
								name="term_id"
								value={form.term_id}
								onChange={handleChange}
								disabled={!form.session_id}
								className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Select Term</option>

								{terms.map((t) => (
									<option key={t.id} value={t.id}>
										{t.name}
									</option>
								))}
							</select>
						</div>

						{/* AMOUNT */}
						<div>
							<label className="block mb-2 text-sm font-semibold text-gray-700">
								Amount
							</label>

							<input
								type="number"
								name="amount"
								value={form.amount}
								onChange={handleChange}
								placeholder="Enter amount"
								className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						{/* BUTTONS */}
						<div className="flex items-center justify-end gap-3 pt-4">
							<button
								type="button"
								onClick={() => router.back()}
								className="px-5 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
							>
								Cancel
							</button>

							<button
								type="submit"
								disabled={loading}
								className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
							>
								{loading ? "Updating..." : "Update Fee"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
