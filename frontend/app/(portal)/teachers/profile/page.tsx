"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  Plus,
  Users,
  ArrowLeft,
} from "lucide-react";
import { apiAction, handleUserDelete } from "@/app/lib/api";
import { TeacherType } from "@/app/lib/types";
import { useRoleGuard } from "@/app/lib/hooks/useRoleGuard";
import { useRouter } from "next/navigation";

export default function AdminTeachersPage() {
  useRoleGuard(["teacher"]);
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadteachers = async () => {
      const data = await apiAction("academics", "teachers");
      setTeachers(data.results || []);
      setLoading(false);
    };
    loadteachers();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const success = await handleUserDelete(
        "academics",
        "teachers",
        id,
        "Teacher",
      );

      if (success) {
        setTeachers((prev) => prev.filter((teacher) => teacher.id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredteachers = teachers.filter((teacher) =>
    `${teacher.user.first_name} ${teacher.user.last_name}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-linear-to-r from-emerald-900 to-emerald-700 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Teachers Management</h1>
            <p className="text-emerald-100 mt-2">
              View, manage and monitor teachers
            </p>
          </div>
          {/* link */}
          <div className="link flex gap-3 md:gap-6 justify-center md:justify-start ">
            <Link
              href="/teachers"
              className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-500 px-4 py-2 transition rounded-xl font-semibold shadow-md"
            >
              <ArrowLeft size={18} />
              <span>Go Back</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* TOP STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total teachers</p>
                <h2 className="text-3xl font-bold text-emerald-900 mt-2">
                  {teachers.length}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users className="text-emerald-800" />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* teachers TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead className="bg-emerald-900 text-white">
                <tr>
                  <th className="text-left px-6 py-4">Teacher</th>

                  <th className="text-left px-6 py-4">Username</th>

                  <th className="text-left px-6 py-4">Gender</th>

                  <th className="text-center px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex justify-center">
                        <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredteachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-500">
                      No teachers found
                    </td>
                  </tr>
                ) : (
                  filteredteachers.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={teacher.user.profile_picture || "/avatar.png"}
                            alt="profile"
                            className="w-12 h-12 rounded-full object-cover border"
                          />

                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {teacher.user.first_name} {teacher.user.last_name}
                            </h3>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-gray-700">
                        {teacher.user.username}
                      </td>

                      <td className="px-6 py-5">
                        <span className="px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700 capitalize">
                          {teacher.user.gender}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/teachers/profile/${teacher.id}`}
                            className="w-10 h-10 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-800 transition"
                          >
                            <Eye size={18} />
                          </Link>

                          <Link
                            href={`/teachers/profile/${teacher.id}/edit`}
                            className="w-10 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-800 transition"
                          >
                            <Pencil size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
