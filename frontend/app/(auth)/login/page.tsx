"use client";

import { useAuth } from "@/app/lib/hooks/useAuth";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function Login() {
  const { loginUser, loading, error } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4">
      <div className="w-full max-w-md bg-transparent rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Login to your account
        </h2>

        <form onSubmit={loginUser} className="space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-slate-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              name="username"
              required
              autoComplete="username"
              placeholder="Enter your username"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition
                 hover:border-slate-300
                 focus:border-blue-500 focus:bg-white focus:outline-none
                 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            {/* IMPORTANT: relative wrapper */}
            <div className="relative">
              <input
                id="password"
                type={showCurrentPassword ? "text" : "password"}
                name="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={loading}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70
                   px-4 py-3 pr-12
                   text-sm font-medium text-slate-800
                   placeholder:text-slate-400
                   transition
                   hover:border-slate-300
                   focus:border-blue-500
                   focus:bg-white
                   focus:outline-none
                   focus:ring-2 focus:ring-blue-500/10
                   disabled:cursor-not-allowed
                   disabled:opacity-60"
              />

              {/* Eye button */}
              <button
                type="button"
                onClick={() => setShowCurrentPassword((current) => !current)}
                disabled={loading}
                aria-label={
                  showCurrentPassword ? "Hide password" : "Show password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2
                   rounded-xl p-2
                   text-slate-400
                   transition
                   hover:bg-slate-100
                   hover:text-slate-600
                   focus:outline-none
                   focus:ring-2
                   focus:ring-blue-500/20
                   disabled:cursor-not-allowed
                   disabled:opacity-50"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2
               rounded-2xl bg-blue-600 px-4 py-3
               text-sm font-bold text-white
               shadow-lg shadow-blue-600/10
               transition
               hover:bg-blue-700
               focus:outline-none
               focus:ring-2
               focus:ring-blue-500/20
               disabled:cursor-not-allowed
               disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
