"use client";

import { useEffect, useState } from "react";
import {
  apiAction,
  createAction,
  updateAction,
  handleUserDelete,
} from "@/app/lib/api";

import { Pencil, Trash2, Plus, X, GraduationCap } from "lucide-react";
import { toast } from "sonner";

type GradeType = {
  id: number;
  grade: string;
  lower_limit: number;
  upper_limit: number;
  remark: string;
  grading_type: string;
};

export default function GradesPage() {
  const [grades, setGrades] = useState<GradeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState("");

  const [selectedGrade, setSelectedGrade] = useState<GradeType | null>(null);

  const [form, setForm] = useState({
    grade: "",
    lower_limit: "",
    upper_limit: "",
    remark: "",
    grading_type: "subject",
  });

  // ============================
  // FETCH GRADES
  // ============================
  const fetchGrades = async () => {
    try {
      setFetching(true);

      const res = await apiAction("results", "grading-scales");

      setGrades(res.results || res);
    } catch (error) {
      console.log(error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [grades.length]);

  // ============================
  // HANDLE CHANGE
  // ============================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // ============================
  // RESET FORM
  // ============================
  const resetForm = () => {
    setForm({
      grade: "",
      lower_limit: "",
      upper_limit: "",
      remark: "",
      grading_type: "subject",
    });
  };
  function toSentenceCase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  // ============================
  // CREATE GRADE
  // ============================
  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = {
        grade: form.grade.toUpperCase(),
        lower_limit: Number(form.lower_limit),
        upper_limit: Number(form.upper_limit),
        remark: toSentenceCase(form.remark),
        grading_type: form.grading_type,
      };

      const res = await createAction(
        "results",
        "grading-scales",
        payload,
        "POST",
      );

      if (res) {
        setGrades((prev) => [...prev, res]);

        resetForm();
        setShowCreateModal(false);

        toast.success(`Grade ${payload.grade} created successfully`);
      }
    } catch (error:any) {
      console.log(error);
      toast.error(error?.message || "Failed to create grade");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // OPEN EDIT
  // ============================
  const openEditModal = (grade: GradeType) => {
    setSelectedGrade(grade);

    setForm({
      grade: grade.grade,
      lower_limit: String(grade.lower_limit),
      upper_limit: String(grade.upper_limit),
      remark: grade.remark,
      grading_type: grade.grading_type,
    });

    setShowEditModal(true);
  };

  // ============================
  // UPDATE GRADE
  // ============================
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedGrade) return;

    try {
      setLoading(true);

      const payload = {
        grade: form.grade.toUpperCase(),
        lower_limit: Number(form.lower_limit),
        upper_limit: Number(form.upper_limit),
        remark: toSentenceCase(form.remark),
        grading_type: form.grading_type,
      };

      const res = await updateAction(
        "results",
        "grading-scales",
        Number(editingId),
        payload,
        "PUT",
      );

      if (res) {
        setGrades((prev) =>
          prev.map((g) => (g.id === selectedGrade.id ? res : g)),
        );

        setShowEditModal(false);
        setSelectedGrade(null);

        resetForm();

        toast.success(`Grade ${payload.grade} updated successfully`);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update grade");
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // DELETE GRADE
  // ============================
  const handleDelete = async (grade: GradeType) => {
    try {
      await handleUserDelete(
        "results",
        "grades",
        grade.id,
        `grade ${grade.grade}`,
      );

      setGrades((prev) => prev.filter((g) => g.id !== grade.id));
    } catch (error) {
      toast.error("Failed to delete grade");
      console.log(error);
    }
  };

  // ============================
  // LOADING
  // ============================
  if (fetching) {
    return (
      <div className="p-10 text-center text-gray-500">Loading grades...</div>
    );
  }

  return (
    <div className="space-y-6 px-6">
      {/* HEADER */}
      <div className="flex flex-col text-left md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-left">
          <h1 className="text-3xl font-bold text-gray-900">
            Grades Management
          </h1>

          <p className="text-gray-500 mt-1">
            Manage grading system and score ranges
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex max-w-fit items-center gap-2  bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl transition"
        >
          <Plus size={18} />
          Add Grade
        </button>
      </div>
      {/* GRID → TABLE */}
      <div className="bg-white border w-full border-gray-200 rounded-3xl shadow-sm">
        {grades.length > 0 ? (
          <div className="flex mx-auto w-full overflow-x-auto px-4">
            <table className="w-full mx-auto overflow-x-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Grade</th>
                  <th className="p-2 text-left">Remark</th>
                  <th className="p-2 text-left">Grading Type</th>
                  <th className="p-2 text-left">Lower Limit</th>
                  <th className="p-2 text-left">Upper Limit</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {grades.map((grade) => (
                  <tr
                    key={grade.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    {/* GRADE */}
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                          <GraduationCap size={20} />
                        </div>

                        <span className="text-lg font-bold text-gray-800">
                          {grade.grade}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 text-sm text-gray-500">
                      {grade.remark}
                    </td>
                    {/* GRADING TYPE */}
                    <td className="p-2 text-sm text-gray-500">
                      {grade.grading_type.toUpperCase()}
                    </td>

                    {/* LOWER */}
                    <td className="p-2">
                      <span className="inline-flex bg-gray-50 px-4 py-2 rounded-2xl font-semibold text-gray-800">
                        {grade.lower_limit}
                      </span>
                    </td>

                    {/* UPPER */}
                    <td className="p-2">
                      <span className="inline-flex bg-gray-50 px-4 py-2 rounded-2xl font-semibold text-gray-800">
                        {grade.upper_limit}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            openEditModal(grade);
                            setEditingId(String(grade.id));
                          }}
                          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl transition"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(grade)}
                          className="w-10 h-10 rounded-2xl bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <h3 className="text-xl font-semibold text-gray-800">
              No grades found
            </h3>

            <p className="text-gray-500 mt-2">
              Start by creating your grading structure
            </p>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Grade</h2>

                <p className="text-sm text-gray-500 mt-1">
                  Create a new grading range
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <h2 className="font-bold text-md">Grading Type</h2>
              <select
                name="grading_type"
                id="grading_type"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                onChange={handleChange}
                value={form.grading_type}
              >
                <option value="">Select Grading Type</option>
                <option value="subject">SUBJECT</option>
                <option value="overall">OVERALL GRADE</option>
              </select>
              <h2 className="font-bold text-md">Grade</h2>

              <input
                type="text"
                name="grade"
                value={form.grade}
                onChange={handleChange}
                placeholder="Grade (e.g A1)"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="lower_limit"
                  value={form.lower_limit}
                  onChange={handleChange}
                  placeholder="Lower Limit"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input
                  type="number"
                  name="upper_limit"
                  value={form.upper_limit}
                  onChange={handleChange}
                  placeholder="Upper Limit"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <input
                type="text"
                name="remark"
                value={form.remark}
                onChange={handleChange}
                placeholder="Remark"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-3 rounded-2xl bg-gray-200 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>

                <button
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition"
                >
                  {loading ? "Saving..." : "Save Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Grade</h2>

                <p className="text-sm text-gray-500 mt-1">
                  Update grading information
                </p>
              </div>

              <button
                onClick={() => setShowEditModal(false)}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <input
                type="text"
                name="grade"
                value={form.grade}
                onChange={handleChange}
                placeholder="Grade"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="lower_limit"
                  value={form.lower_limit}
                  onChange={handleChange}
                  placeholder="Lower Limit"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input
                  type="number"
                  name="upper_limit"
                  value={form.upper_limit}
                  onChange={handleChange}
                  placeholder="Upper Limit"
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <input
                type="text"
                name="remark"
                value={form.remark}
                onChange={handleChange}
                placeholder="Remark"
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-3 rounded-2xl bg-gray-200 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>

                <button
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition"
                >
                  {loading ? "Updating..." : "Update Grade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
