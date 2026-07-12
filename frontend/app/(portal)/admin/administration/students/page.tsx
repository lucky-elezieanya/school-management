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
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Filter,
} from "lucide-react";
import {
  apiAction,
  apiHeaders,
  BASE_URL,
  fetchClasses,
  handleResponse,
  handleUserDelete,
} from "@/app/lib/api";
import { ClassType, StudentType } from "@/app/lib/types";
import { useRoleGuard } from "@/app/lib/hooks/useRoleGuard";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";

type StudentsResponseType = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentType[];
};

export default function AdminStudentsPage() {
  useRoleGuard(["admin"]);
  const {currentTerm, user} = useAuth()

  const router = useRouter();

  const [students, setStudents] = useState<StudentType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilterItems, setShowFilterItems] = useState(false);
  // =========================
  // PAGINATION STATES
  // =========================
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [selectedFilterItem, setSelectedFilterItem] = useState("");
  
  const filterItems = [{ name: "class" }, { name: "Active Status" }];
  const [filterForm, setFilterForm] = useState({
    school_class_id: "",
    is_active: "",
  });

  const activeStatus = [
    { name: "Active", value: "true" },
    { name: "Inactive", value: "false" },
  ];
  // =========================
  // FETCH STUDENTS
  // =========================
  const loadStudents = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
      });

      if (filterForm.school_class_id) {
        params.append("school_class_id", filterForm.school_class_id);
      }

      if (filterForm.is_active !== "") {
        params.append("is_active", filterForm.is_active);
      }

      const url = `${BASE_URL}/academics/students/?${params.toString()}`;
      const res = await fetch(url, {
        headers: apiHeaders(),
      });
      const data: StudentsResponseType = await res.json();
      setStudents(data.results || []);
      setTotalStudents(data.count || 0);
      setNextPage(data.next);
      setPreviousPage(data.previous);
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await fetchClasses();
      setClasses(res.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadClasses();
    console.log("classes: ", classes);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [filterForm]);


  // =========================
  // SEARCH FILTER
  // =========================
  const filteredStudents = students.filter((student) =>
    `${student.user.first_name} ${student.user.middle_name || ""} ${
      student.user.last_name} ${student.admission_number} ${student.user.gender}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  // =========================
  // TOTAL PAGES
  // =========================
  const pageSize = 10;
  const totalPages = Math.ceil(totalStudents / pageSize);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-linear-to-r from-emerald-700 to-emerald-500 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link
            href={"/admin/administration"}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 transition px-5 py-3 rounded-xl font-semibold shadow-md"
          >
            <ArrowLeft size={24} />
            <span>Back to dashboard</span>
          </Link>

          <div className="md:mx-auto">
            <h1 className="text-3xl font-bold">Students Management</h1>

            <p className="text-emerald-100 mt-2">
              View, manage and monitor students
            </p>
          </div>

          <div className="flex gap-4">
            <div
              onClick={() => router.back()}
              className="inline-flex cursor-pointer items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-4 py-2 transition rounded-xl font-semibold shadow-md"
            >
              <ArrowLeft size={18} />
              Go Back
            </div>

            <Link
              href="/admin/administration/students/new"
              className="inline-flex items-center gap-2 bg-pink-400 hover:bg-pink-500 transition px-5 py-3 rounded-xl font-semibold shadow-md"
            >
              <Plus size={18} />
              Add Student
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Students</p>

                <h2 className="text-3xl font-bold text-emerald-900 mt-2">
                  {totalStudents}
                </h2>
              </div>

              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users className="text-emerald-800" />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          {/* Top Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search students by name and admission numbers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilterItems(!showFilterItems)}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl border transition
      ${
        showFilterItems
          ? "bg-emerald-600 text-white border-emerald-600"
          : "border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
            >
              <Filter size={18} />
              Filters
            </button>
          </div>

          {/* FILTER PANEL */}
          {showFilterItems && (
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-5">
              {/* Filter Categories */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Filter By
                </p>

                <div className="flex flex-wrap gap-3">
                  {filterItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => setSelectedFilterItem(item.name)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition
              ${
                selectedFilterItem === item.name
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white border-gray-200 text-gray-700 hover:border-emerald-600 hover:text-emerald-700"
              }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Status Options */}
              {selectedFilterItem === "Active Status" && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-3">
                    Select Status
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {activeStatus.map((status) => (
                      <button
                        key={status.name}
                        onClick={() =>
                          setFilterForm((prev) => ({
                            ...prev,
                            is_active: status.value.toString(),
                          }))
                        }
                        className={`rounded-lg border p-3 text-sm transition
                ${
                  filterForm.is_active === status.value.toString()
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-gray-200 hover:border-emerald-600 hover:bg-emerald-50"
                }`}
                      >
                        {status.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Class Options */}
              {selectedFilterItem === "class" &&
                !loading &&
                classes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-3">
                      Select Class
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {classes.map((cls) => (
                        <button
                          key={cls.id}
                          onClick={() =>{
                            setFilterForm((prev) => ({
                              ...prev,
                              school_class_id: cls.id.toString(),
                            }))
                        }
                          }
                          className={`rounded-lg border p-3 text-sm transition
                ${
                  filterForm.school_class_id === cls.id.toString()
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-gray-200 hover:border-emerald-600 hover:bg-emerald-50"
                }`}
                        >
                          {cls.name} {cls.arm.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Selected Filters */}
              {(filterForm.school_class_id || filterForm.is_active) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {filterForm.school_class_id && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm">
                      Class Selected
                    </span>
                  )}

                  {filterForm.is_active && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm">
                      {filterForm.is_active === "true"
                        ? "Active Students"
                        : "Inactive Students"}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setFilterForm({
                      school_class_id: "",
                      is_active: "",
                    });

                    setSelectedFilterItem("");
                    setShowFilterItems(false);
                  }}
                  className="px-5 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STUDENTS TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-237.5">
              <thead className="bg-emerald-600 text-white">
                <tr>
                  <th className="text-left px-2 py-4">Student</th>

                  <th className="text-left px-2 py-4">Username</th>

                  <th className="text-left px-2 py-4">Class</th>

                  <th className="text-left px-2 py-4">ADM No.</th>

                  <th className="text-left px-2 py-4">Gender</th>

                  <th className="text-center px-2 py-4">Active status</th>
                  <th className="text-center px-2 py-4">Actions</th>
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
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-2 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={student.user.profile_picture || "/avatar.png"}
                            alt="profile"
                            className="w-12 h-12 rounded-full object-cover border"
                          />

                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {student.user.full_name}
                            </h3>
                          </div>
                        </div>
                      </td>

                      <td className="px-2 py-5 text-gray-700">
                        {student.user.username}
                      </td>

                      <td className="px-2 py-5 text-gray-700">
                        {student.current_enrollment?.school_class
                          ? `${student.current_enrollment.school_class.name} ${student.current_enrollment.school_class.arm?.name}`
                          : "Not enrolled"}
                      </td>

                      <td className="px-2 py-5 text-gray-700">
                        {student.admission_number}
                      </td>

                      <td className="px-2 py-5">
                        <span className="px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700 capitalize">
                          {student.user.gender}
                        </span>
                      </td>
                      <td className="px-2 py-5">
                        {student.is_active ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700 font-medium">
                            <Check size={16} />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 font-medium">
                            <X size={16} />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/admin/administration/students/${student.id}`}
                            className="w-10 h-10 rounded-xl bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-800 transition"
                          >
                            <Eye size={18} />
                          </Link>

                          <Link
                            href={`/admin/administration/students/${student.id}/edit`}
                            className="w-10 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-800 transition"
                          >
                            <Pencil size={18} />
                          </Link>

                          {/* <button
                            onClick={() => handleDelete(student.id)}
                            className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-700 transition"
                          >
                            <Trash2 size={18} />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-5 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{currentPage}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={!previousPage}
                  onClick={() => {
                    if (previousPage) {
                      loadStudents(currentPage - 1);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <button
                  disabled={!nextPage}
                  onClick={() => {
                    if (nextPage) loadStudents(currentPage + 1);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
