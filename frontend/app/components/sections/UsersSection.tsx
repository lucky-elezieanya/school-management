"use client";

import { Dispatch, SetStateAction, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Users,
} from "lucide-react";

import { UserType } from "@/app/lib/types";
interface UsersSectionProps {
  users: UserType[];
  count: number;
  next: string | null;
  previous: string | null;

  onNext: () => void;
  onPrevious: () => void;

  handleDelete: (
    route_base: string,
    route_name: string,
    id: number,
    item_name: string,
  ) => Promise<boolean>;

  setUsers: Dispatch<SetStateAction<UserType[]>>;
}

export default function UsersSection({
  users,
  count,
  next,
  previous,
  onNext,
  onPrevious,
  handleDelete,
  setUsers,
}: UsersSectionProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((user) => {
    return (
      user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.role?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const displayedUsers = filteredUsers;
  const deleteUser = async (id: number) => {
    try {
      setDeletingId(id);

      const res = await handleDelete("accounts", "users", id, "User");
      if (res) {
        // Remove instantly from UI
        setUsers((prev) => prev.filter((user) => user.id !== id));

        router.refresh();
      } else return;
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-700" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">All Users</h2>

              <p className="text-gray-500 text-sm mt-1">
                Manage platform users and account access
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold w-fit">
          Total Users: {count}
        </div>
      </div>
      {/* SEARCH */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-sm text-gray-500">
          Showing {displayedUsers.length} of {users.length} users
        </div>
      </div>
      {/* TABLE */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-transparent shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-transparent border-b border-gray-200">
              <tr>
                <th
                  className="text-center px-2 py-4 text-sm font-semibold  text-gray-700"
                  colSpan={3}
                >
                  User
                </th>

                <th
                  className="text-center px-2 py-4 text-sm font-semibold  text-gray-700"
                  colSpan={1}
                >
                  Username
                </th>

                <th
                  className="text-center px-6 py-4 text-sm font-semibold  text-gray-700"
                  colSpan={1}
                >
                  Email
                </th>

                <th
                  className="text-center px-6 py-4 text-sm font-semibold  text-gray-700"
                  colSpan={1}
                >
                  Gender
                </th>

                <th
                  className="text-center px-6 py-4 text-sm font-semibold  text-gray-700"
                  colSpan={1}
                >
                  Role
                </th>

                <th
                  className="text-center px-6 py-4 text-sm font-semibold text-gray-700"
                  colSpan={2}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {users.length > 0 ? (
                displayedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    {/* USER */}
                    <td className="px-2 py-5 text-center " colSpan={3}>
                      <div className="flex gap-3">
                        <img
                          src={user.profile_picture || "/avatar.png"}
                          alt={user.full_name}
                          className="w-11 h-11 rounded-full object-cover border"
                        />

                        <div className="text-left">
                          <p className="font-semibold text-gray-800">
                            {user.full_name}
                          </p>

                          <p className="text-sm text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* USERNAME */}
                    <td className="px-2 py-5 text-center" colSpan={1}>
                      <p className="text-gray-700">@{user.username}</p>
                    </td>

                    {/* EMAIL */}
                    <td className="px-2 py-5 text-center" colSpan={1}>
                      <p className="text-gray-700">
                        {user.email ? user.email : "N/A"}
                      </p>
                    </td>

                    {/* GENDER */}
                    <td className="px-2 py-5 text-center" colSpan={1}>
                      <span className="capitalize bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                        {user.gender || "N/A"}
                      </span>
                    </td>

                    {/* ROLE */}
                    <td className="px-2 py-5" colSpan={1}>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 flex rounded-full text-xs font-semibold capitalize">
                        {user.role}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-2 py-5" colSpan={2}>
                      <div className="flex gap-2">
                        <Link
                          href={
                            user.role === "student"
                              ? `/admin/administration/students/${user.id}`
                              : user.role === "teacher"
                                ? `/admin/administration/teachers/${user.id}`
                                : "/admin"
                          }
                          className="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                        >
                          View
                        </Link>

                        <Link
                          href={
                            user.role === "student"
                              ? `/admin/administration/students/${user.id}/edit`
                              : user.role === "teacher"
                                ? `/admin/administration/teachers/${user.id}/edit`
                                : "/admin"
                          }
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition text-sm"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={deletingId === user.id}
                          className="w-10 h-10  rounded-xl bg-red-100 hover:bg-red-200 disabled:bg-red-50 flex items-center justify-center text-red-700 transition"
                        >
                          {deletingId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrevious}
          disabled={!previous}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition ${
            previous
              ? "bg-gray-700 hover:bg-gray-800"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="text-sm text-gray-500">
          Showing max 10 users per page
        </div>

        <button
          onClick={onNext}
          disabled={!next}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white transition ${
            next
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
