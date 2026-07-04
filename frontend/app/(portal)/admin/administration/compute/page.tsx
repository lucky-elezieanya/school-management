"use client";

import { useEffect, useState } from "react";
import {
	computeAllResults,
	recomputeAllResults,
	getTaskStatus,
} from "@/app/services/results";

import { useAuth } from "@/app/lib/hooks/useAuth";

type TaskState = "PENDING" | "PROGRESS" | "SUCCESS" | "FAILURE";

interface ClassTask {
	class_id: number;
	class_name: string;
	task_id?: string;
	status: TaskState;
	progress: number;
	message?: string;
}

export default function ComputeResultsPage() {
	const { currentTerm } = useAuth();

	const [loading, setLoading] = useState(false);
	const [classes, setClasses] = useState<ClassTask[]>([]);
	const [globalMessage, setGlobalMessage] = useState("");

	/**
	 * FIRE COMPUTE TASK
	 */
	const handleComputeAll = async () => {
		setLoading(true);
		setGlobalMessage("Starting computation for all classes...");

		try {
			const res =
				currentTerm &&
				(await computeAllResults({
					term_id: currentTerm.id,
					session_id: currentTerm.session.id,
				}));

			/**
			 * expected backend:
			 * [{class_id, task_id}]
			 */

			const updated = classes.map((c) => {
				const match = res.find((r: any) => r.class_id === c.class_id);

				if (match) {
					return {
						...c,
						task_id: match.task_id,
						status: "PROGRESS" as TaskState,
						progress: 5,
						message: "Queued...",
					};
				}

				return c;
			});

			setClasses(updated);

			setGlobalMessage("Computation started successfully");

			pollTasks(updated);
		} catch (err) {
			console.error(err);
			setGlobalMessage("Failed to start computation");
		} finally {
			setLoading(false);
		}
	};

	/**
	 * RECOMPUTE
	 */
	const handleRecomputeAll = async () => {
		setLoading(true);
		setGlobalMessage("Recomputing all results...");

		try {
			const res =
				currentTerm &&
				(await recomputeAllResults({
					term_id: currentTerm.id,
					session_id: currentTerm.session.id,
				}));

			const updated = classes.map((c) => {
				const match = res.find((r: any) => r.class_id === c.class_id);

				if (match) {
					return {
						...c,
						task_id: match.task_id,
						status: "PROGRESS" as TaskState,
						progress: 5,
						message: "Recomputing...",
					};
				}

				return c;
			});

			setClasses(updated);

			pollTasks(updated);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * POLLING TASK STATUS
	 */
	const pollTasks = (taskList: ClassTask[]) => {
		const interval = setInterval(async () => {
			let stillRunning = false;

			const updated = await Promise.all(
				taskList.map(async (task) => {
					if (!task.task_id) return task;

					const res = await getTaskStatus(task.task_id);

					if (res.state === "PROGRESS") {
						stillRunning = true;

						return {
							...task,
							status: "PROGRESS" as TaskState,
							progress: res.percent || 10,
							message: res.message,
						};
					}

					if (res.state === "SUCCESS") {
						return {
							...task,
							status: "SUCCESS" as TaskState,
							progress: 100,
							message: "Completed",
						};
					}

					if (res.state === "FAILURE") {
						return {
							...task,
							status: "FAILURE" as TaskState,
							progress: 0,
							message: "Failed",
						};
					}

					stillRunning = true;
					return task;
				}),
			);

			setClasses(updated);

			if (!stillRunning) {
				clearInterval(interval);
				setGlobalMessage("All computations completed");
			}
		}, 2000);
	};

	/**
	 * UI STATUS COLOR
	 */
	const getStatusColor = (status: TaskState) => {
		switch (status) {
			case "SUCCESS":
				return "bg-green-100 text-green-700";
			case "PROGRESS":
				return "bg-blue-100 text-blue-700";
			case "FAILURE":
				return "bg-red-100 text-red-700";
			default:
				return "bg-gray-100 text-gray-600";
		}
	};

	return (
		<div className="p-6 space-y-6">
			{/* HEADER */}
			<div className="bg-white p-4 rounded-xl shadow-sm border">
				<h1 className="text-xl font-bold text-gray-800">
					Results Computation Dashboard
				</h1>

				<p className="text-sm text-gray-500 mt-1">
					Term: {currentTerm?.name} • Session:{" "}
					{currentTerm?.session?.name}
				</p>

				{globalMessage && (
					<div className="mt-3 text-sm text-blue-600">
						{globalMessage}
					</div>
				)}

				<div className="flex gap-3 mt-4">
					<button
						onClick={handleComputeAll}
						disabled={loading}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
					>
						Compute All Results
					</button>

					<button
						onClick={handleRecomputeAll}
						disabled={loading}
						className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300"
					>
						Recompute Results
					</button>
				</div>
			</div>

			{/* CLASS GRID */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{classes.map((c) => (
					<div
						key={c.class_id}
						className="bg-white border rounded-xl p-4 shadow-sm"
					>
						<div className="flex justify-between items-center">
							<h2 className="font-semibold text-gray-800">
								{c.class_name}
							</h2>

							<span
								className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
									c.status,
								)}`}
							>
								{c.status}
							</span>
						</div>

						<div className="mt-3">
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-blue-500 h-2 rounded-full transition-all"
									style={{ width: `${c.progress}%` }}
								/>
							</div>

							<p className="text-xs text-gray-500 mt-2">
								{c.message || "Waiting..."}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
