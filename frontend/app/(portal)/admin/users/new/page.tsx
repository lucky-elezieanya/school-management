"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	apiAction,
	BASE_URL,
	apiHeaders,
	updateAction,
	handleUserDelete,
	createAction,
} from "@/app/lib/api";
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";

type UserType = {
	id: number;
	username: string;
	email: string;
	password?: string;
	first_name: string;
	middle_name?: string;
	last_name: string;
	full_name: string;
	role: "admin";
	gender?: "male" | "female";
	date_of_birth?: string;
	profile_picture?: string;
};

const initialForm = {
	username: "",
	email: "",
	first_name: "",
	middle_name: "",
	password: "1234",
	last_name: "",
	role: "admin",
	gender: "male",
	date_of_birth: new Date("2000-10-01").toISOString().split("T")[0],
	profile_picture: null as File | null | string,
};

export default function NewUserPage() {
	const router = useRouter();
	const [users, setUsers] = useState<UserType[]>([]);
	const [loading, setLoading] = useState(false);

	const [form, setForm] = useState(initialForm);
	const [editing, setEditing] = useState<UserType | null>(null);
	const [showForm, setShowForm] = useState(false);

	const [file, setFile] = useState<File | null>(null);

	/* =========================
	   FETCH USERS
	========================= */
	const loadUsers = async () => {
		try {
			const res = await fetch(`${BASE_URL}/accounts/users/?role=admin`, {
				headers: apiHeaders(),
			}).then((res) => res.json());

			setUsers(res.results || res);
			console.log("admin users: ", res);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		loadUsers();
	}, []);

	/* =========================
	   HANDLE CHANGE
	========================= */
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setForm({
			...form,
			[e.target.name]: e.target.value,
		});
	};

	/* =========================
	   OPEN CREATE
	========================= */
	const openCreate = () => {
		setForm(initialForm);
		setEditing(null);
		setShowForm(true);
	};

	/* =========================
	   OPEN EDIT
	========================= */
	const openEdit = (user: UserType) => {
		setEditing(user);
		setForm({
			username: user.username,
			email: user.email,
			password: "1234",
			first_name: user.first_name,
			middle_name: user.middle_name || "",
			last_name: user.last_name,
			role: user.role,
			gender: user.gender || "male",
			date_of_birth:
				user.date_of_birth ||
				new Date("2000-10-01").toISOString().split("T")[0],
			profile_picture: user.profile_picture || null,
		});
		setShowForm(true);
	};

	/* =========================
	   SUBMIT (CREATE / UPDATE)
	========================= */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			let res: any;
			const submittedData = { ...form };
			if (!(form.profile_picture instanceof File)) {
				submittedData.profile_picture = null;
			}

			if (editing) {
				res = await updateAction(
					"accounts",
					"users",
					editing.id,
					submittedData,
				);

				setUsers((prev) =>
					prev.map((u) => (u.id === editing.id ? res : u)),
				);
			} else {
				res = await createAction("accounts", "users", submittedData);

				setUsers((prev) => [res, ...prev]);
			}

			setShowForm(false);
			setEditing(null);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0];

			setFile(selectedFile);

			setForm((prev) => ({
				...prev,
				profile_picture: selectedFile,
			}));
		}
	};
	/* =========================
	   DELETE USER
	========================= */
	const handleDelete = async (u: UserType) => {
		const res = await handleUserDelete(
			"accounts",
			"users",
			u.id,
			`Admin User: ${u.first_name}`,
		);
        if (res) setUsers((prev) => prev.filter((user) => user.id !== u.id));
	};

	return (
		<div className="min-h-screen bg-transparent mx-auto lg:w-3/4 relative p-6">
			{/* HEADER */}
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Users</h1>
				<div className="flex gap-6">
					<button
						onClick={() => router.back()}
						className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
					>
						<ArrowLeft size={24} /> Back
					</button>
					<button
						onClick={openCreate}
						className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
					>
						<Plus size={24} />
						Add Admin User
					</button>
				</div>
			</div>

			{/* USERS TABLE */}
			<div className="bg-transparent rounded-2xl overflow-x-auto shadow">
				<table className="w-full mx-auto ">
					<thead className="bg-gray-50">
						<tr>
							<th className="p-3 text-left">Profile</th>
							<th className="p-3 text-left">Username</th>
							<th className="p-3 text-left">Name</th>
							<th className="p-3 text-left">Email</th>
							<th className="p-3 text-left">Role</th>
							<th className="p-3 text-left">Actions</th>
						</tr>
					</thead>

					<tbody>
						{users.map((u) => (
							<tr key={u.id} className="border-t">
								<td className="p-3">
									{u.profile_picture ? (
										<img
											src={u.profile_picture}
											alt="Profile"
											className="w-10 h-10 rounded-full"
										/>
									) : (
										<img
											src="/avatar.png"
											alt="Profile"
											className="w-10 h-10 rounded-full"
										/>
									)}
								</td>
								<td className="p-3">{u.username}</td>
								<td className="p-3">{u.full_name}</td>
								<td className="p-3">{u.email}</td>
								<td className="p-3 capitalize">{u.role}</td>

								<td className="p-3 flex gap-2">
									<button
										onClick={() => openEdit(u)}
										className="bg-amber-500 text-white p-2 rounded-lg"
									>
										<Pencil size={14} />
									</button>

									<button
										onClick={() => handleDelete(u)}
										className="bg-red-600 text-white p-2 rounded-lg"
									>
										<Trash2 size={14} />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* MODAL FORM */}
			{showForm && (
				<div className="fixed inset-0  bg-black/40 flex items-center justify-center overflow-auto p-4">
					<form
						onSubmit={handleSubmit}
						className="bg-white p-6 rounded-2xl w-112.5 space-y-3"
					>
						<h2 className="text-xl font-bold mt-4">
							{editing ? "Edit User" : "Create Admin User"}
						</h2>

						<div className="col flex flex-row gap-4">
							<div className="flex flex-col gap-1 flex-1  ">
								<label
									htmlFor="username"
									className="block text-sm font-medium text-gray-700"
								>
									Username
								</label>
								<input
									name="username"
									value={form.username}
									onChange={handleChange}
									placeholder="Username"
									className="w-full border p-2 rounded-lg"
								/>
							</div>
							<div className="flex flex-col gap-1 flex-1">
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700"
								>
									Email
								</label>
								<input
									name="email"
									value={form.email}
									onChange={handleChange}
									placeholder="Email"
									className="w-full border p-2 rounded-lg"
								/>
							</div>
						</div>
						<div className="col flex flex-row gap-4">
							<div className="flex flex-col gap-1 flex-1">
								<label
									htmlFor="first_name"
									className="block text-sm font-medium text-gray-700"
								>
									First Name
								</label>
								<input
									name="first_name"
									value={form.first_name}
									onChange={handleChange}
									placeholder="First Name"
									className="w-full border p-2 rounded-lg"
								/>
							</div>

							<div className="flex flex-col gap-1 flex-1">
								<label
									htmlFor="last_name"
									className="block text-sm font-medium text-gray-700"
								>
									Last Name
								</label>
								<input
									name="last_name"
									value={form.last_name}
									onChange={handleChange}
									placeholder="Last Name"
									className="w-full border p-2 rounded-lg"
								/>
							</div>
						</div>
						<div className="col flex flex-row gap-4">
							<div className="flex flex-col gap-1 flex-1">
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-700"
								>
									Password
								</label>
								<input
									name="password"
									value={form.password}
									onChange={handleChange}
									placeholder="Password"
									type="password"
									className="w-full border p-2 rounded-lg"
								/>
							</div>
							<div className="flex flex-col gap-1 flex-1">
								<label
									htmlFor="gender"
									className="block text-sm font-medium text-gray-700"
								>
									Gender
								</label>
								<select
									name="gender"
									value={form.gender}
									onChange={handleChange}
									className="w-full border p-2 rounded-lg"
								>
									<option value="male">Male</option>
									<option value="female">Female</option>
								</select>
							</div>
						</div>

						<div className="col flex flex-row gap-4">
							<div className="flex flex-col gap-1 flex-1">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									teacher Passport (optional)
								</label>

								<img
									src={
										form.profile_picture instanceof File
											? URL.createObjectURL(
													form.profile_picture,
												)
											: form.profile_picture ||
												"/avatar.png"
									}
									alt="profile"
									className="w-15 h-15 rounded-full object-cover"
								/>
								<input
									type="file"
									name="profile_picture"
									onChange={handleFileChange}
									className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
								/>
							</div>

							<div className="flex flex-col gap-1 flex-1">
								<label
									htmlFor="date_of_birth"
									className="block text-sm font-medium text-gray-700"
								>
									Date of birth
								</label>
								<input
									type="date"
									name="date_of_birth"
									value={form.date_of_birth}
									onChange={handleChange}
									className="w-full border p-2 rounded-lg"
								/>
							</div>
						</div>

						<div className="flex gap-2 pt-2">
							<button
								type="submit"
								disabled={loading}
								className="flex-1 bg-blue-600 text-white py-2 rounded-xl"
							>
								{loading
									? "Saving..."
									: editing
										? "Update"
										: "Create"}
							</button>

							<button
								type="button"
								onClick={() => setShowForm(false)}
								className="flex-1 bg-gray-300 py-2 rounded-xl"
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
