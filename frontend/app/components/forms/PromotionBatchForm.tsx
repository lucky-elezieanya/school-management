"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { createPromotionBatch } from "@/app/services/promotions";
import { getSessions } from "@/app/services/academics";
import { useAuth } from "@/app/lib/hooks/useAuth";


interface Props {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export default function PromotionBatchForm({
	open,
	onClose,
	onSuccess,
}: Props) {
	const [loading, setLoading] = useState(false);
	const [sessions, setSessions] = useState<any[]>([]);
    const {user} = useAuth()

	const [formData, setFormData] = useState({
		from_session_id: "",
		to_session_id: "",
	});

	useEffect(() => {
		if (!open) return;

		const loadSessions = async () => {
			try {
				const res = await getSessions();
				setSessions(res.results || []);
			} catch (error) {
				console.error(error);
			}
		};

		loadSessions();
	}, [open]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (formData.from_session_id === formData.to_session_id) {
			alert("From Session and To Session cannot be the same.");

			return;
		}

		try {
			setLoading(true);

			await createPromotionBatch({
				from_session_id: Number(formData.from_session_id),
				to_session_id: Number(formData.to_session_id),
                promoted_by: user?.id
			});

			setFormData({
				from_session_id: "",
				to_session_id: "",
			});

			onSuccess();
			onClose();
		} catch (error: any) {
			console.error(error);

			alert(error?.message || "Failed to create promotion batch");
		} finally {
			setLoading(false);
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
			<div className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-2xl shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b p-5">
					<h2 className="text-lg md:text-xl font-bold">
						Create Promotion Batch
					</h2>

					<button
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-gray-100"
					>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="p-5 space-y-5">
					{/* From Session */}
					<div>
						<label className="block mb-2 text-sm font-medium text-gray-700">
							From Session
						</label>

						<select
							required
							value={formData.from_session_id}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									from_session_id: e.target.value,
								}))
							}
							className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
						>
							<option value="">Select Session</option>

							{sessions.map((session) => (
								<option key={session.id} value={session.id}>
									{session.name}{" "}
									{session.is_active && "(Active)"}
								</option>
							))}
						</select>
					</div>

					{/* To Session */}
					<div>
						<label className="block mb-2 text-sm font-medium text-gray-700">
							To Session
						</label>

						<select
							required
							value={formData.to_session_id}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									to_session_id: e.target.value,
								}))
							}
							className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:outline-none"
						>
							<option value="">Select Session</option>

							{sessions.map((session) => (
								<option key={session.id} value={session.id}>
									{session.name}{" "}
									{session.is_active && "(Active)"}
								</option>
							))}
						</select>
					</div>

					{/* Summary */}
					{formData.from_session_id && formData.to_session_id && (
						<div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
							<p className="text-sm text-blue-700">
								You are creating a promotion batch from one
								academic session to another.
							</p>
						</div>
					)}

					{/* Actions */}
					<div className="flex flex-col-reverse md:flex-row gap-3 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="w-full border border-gray-300 rounded-xl py-3 font-medium hover:bg-gray-50"
						>
							Cancel
						</button>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
						>
							{loading && (
								<Loader2 size={18} className="animate-spin" />
							)}
							Create Batch
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
