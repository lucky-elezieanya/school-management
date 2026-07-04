"use client";

import { useState } from "react";
import { PlusCircle, Loader2, CalendarRange } from "lucide-react";
import { AcademicSession } from "@/app/lib/types";

export default function SessionsForm({
	onCreate,
	session,
}: {
	onCreate: (data: {
		name: string;
		is_active: boolean;
		term: string;
	}) => Promise<void>;
	session?: AcademicSession;
}) {
	const [form, setForm] = useState({
		name: "",
		is_active: true,
		term: "",
	});

	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState("");
	const [error, setError] = useState("");

	const termsList = [
		{ name: "First Term" },
		{ name: "Second Term" },
		{ name: "Third Term" },
	];

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const target = e.target;

		setForm((prev) => ({
			...prev,
			[target.name]:
				target instanceof HTMLInputElement && target.type === "checkbox"
					? target.checked
					: target.value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		setLoading(true);
		setError("");
		setSuccess("");

		try {
			await onCreate(form);

			setSuccess("Session created successfully");

			setForm({
				name: "",
				is_active: true,
				term: "",
			});
		} catch (err: any) {
			setError(err?.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-lg mx-auto">
			{/* CARD */}
			<div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
				{/* HEADER (compact) */}
				<div className="flex items-center gap-3 bg-blue-600 text-white px-5 py-4">
					<div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
						<CalendarRange size={20} />
					</div>

					<div>
						<h2 className="text-base font-semibold">
							Academic Session
						</h2>
						<p className="text-xs text-blue-100">
							Create or activate session
						</p>
					</div>
				</div>

				{/* CURRENT SESSION (compact) */}
				{session && (
					<div className="px-5 pt-4">
						<div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
							<div>
								<p className="text-xs text-green-700">
									Active Session
								</p>
								<p className="font-semibold text-green-900">
									{session.name}
								</p>
							</div>

							<span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full">
								ACTIVE
							</span>
						</div>
					</div>
				)}

				{/* FORM */}
				<form onSubmit={handleSubmit} className="p-5 space-y-4">
					{/* SESSION NAME */}
					<div>
						<label className="text-sm font-medium text-gray-700">
							Session Name
						</label>

						<input
							type="text"
							name="name"
							value={form.name}
							onChange={handleChange}
							placeholder="2026/2027"
							className="mt-1 w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
						/>
					</div>

					{/* TERM */}
					<div>
						<label className="text-sm font-medium text-gray-700">
							Term
						</label>

						<select
							name="term"
							value={form.term}
							onChange={handleChange}
							className="mt-1 w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
						>
							<option value="">Select term</option>
							{termsList.map((t) => (
								<option key={t.name} value={t.name}>
									{t.name}
								</option>
							))}
						</select>
					</div>

					{/* TOGGLE */}
					<div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border">
						<div>
							<p className="text-sm font-medium">Make Active</p>
							<p className="text-xs text-gray-500">
								Set as current session
							</p>
						</div>

						<label className="relative inline-flex items-center cursor-pointer">
							<input
								type="checkbox"
								name="is_active"
								checked={form.is_active}
								onChange={handleChange}
								className="sr-only peer"
							/>
							<div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-6" />
						</label>
					</div>

					{/* ERROR / SUCCESS */}
					{error && (
						<p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
							{error}
						</p>
					)}

					{success && (
						<p className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">
							{success}
						</p>
					)}

					{/* BUTTON */}
					<button
						type="submit"
						disabled={loading}
						className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition"
					>
						{loading ? (
							<>
								<Loader2 className="animate-spin" size={18} />
								Creating...
							</>
						) : (
							<>
								<PlusCircle size={18} />
								Create Session
							</>
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
