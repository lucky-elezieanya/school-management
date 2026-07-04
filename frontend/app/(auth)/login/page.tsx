"use client";

import { useAuth } from "@/app/lib/hooks/useAuth";


export default function Login() {
	const { loginUser, loading, error } = useAuth();

	return (
		<div className="min-h-screen flex items-center justify-center bg-transparent px-4">
			<div className="w-full max-w-md bg-transparent rounded-2xl shadow-lg p-8">
				<h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
					Login to your account
				</h2>

				<form onSubmit={loginUser} className="space-y-4">
					{/* Username */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Username
						</label>

						<input
							type="text"
							name="username"
							required
							className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder="Enter your username"
						/>
					</div>

					{/* Password */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Password
						</label>

						<input
							type="password"
							name="password"
							required
							className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
							placeholder="Enter your password"
						/>
					</div>

					{/* Error */}
					{error && (
						<div className="text-sm text-red-600 bg-red-100 p-2 rounded-lg">
							{error}
						</div>
					)}

					{/* Button */}
					<button
						type="submit"
						disabled={loading}
						className="w-full flex items-center justify-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
					>
						{loading ? (
							<div className="flex items-center gap-2">
								<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
								Logging in...
							</div>
						) : (
							"Login"
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
