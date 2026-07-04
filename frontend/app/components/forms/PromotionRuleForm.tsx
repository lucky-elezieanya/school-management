"use client";

import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { useEffect, useState } from "react";

export default function PromotionRuleForm({
	onSubmit,
	initialData = null,
}: any) {
	const [classes, setClasses] = useState([]);

	const [formData, setFormData] = useState({
		from_class_id: "",
		to_class_id: "",
		is_active: true,
	});

	useEffect(() => {
		loadClasses();
	}, []);

	const loadClasses = async () => {
		const res = await fetch(
			`${BASE_URL}/academics/classes/`,
			{
				headers: apiHeaders(),
			}
		);

		const data = await res.json();

		setClasses(data.results || []);
	};

	const submit = (e: React.FormEvent) => {
		e.preventDefault();

		onSubmit(formData);
	};

	return (
		<form
			onSubmit={submit}
			className="space-y-4"
		>
			<div>
				<label>From Class</label>

				<select
					className="w-full border rounded-lg p-2"
					value={formData.from_class_id}
					onChange={(e) =>
						setFormData({
							...formData,
							from_class_id: e.target.value,
						})
					}
				>
					<option value="">
						Select class
					</option>

					{classes.map((c: any) => (
						<option
							key={c.id}
							value={c.id}
						>
							{c.name} {c.arm?.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<label>To Class</label>

				<select
					className="w-full border rounded-lg p-2"
					value={formData.to_class_id}
					onChange={(e) =>
						setFormData({
							...formData,
							to_class_id: e.target.value,
						})
					}
				>
					<option value="">
						Select class
					</option>

					{classes.map((c: any) => (
						<option
							key={c.id}
							value={c.id}
						>
							{c.name} {c.arm?.name}
						</option>
					))}
				</select>
			</div>

			<label className="flex gap-2">
				<input
					type="checkbox"
					checked={formData.is_active}
					onChange={(e) =>
						setFormData({
							...formData,
							is_active: e.target.checked,
						})
					}
				/>

				Active Rule
			</label>

			<button
				type="submit"
				className="bg-green-700 text-white px-4 py-2 rounded-lg"
			>
				Save Rule
			</button>
		</form>
	);
}