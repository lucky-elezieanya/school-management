"use client";

import { useEffect, useState } from "react";
import {
  apiAction,
  createAction,
  updateAction,
  handleUserDelete,
  BASE_URL,
  apiHeaders,
  handleResponse,
} from "@/app/lib/api";
import {toast} from "sonner"

import { Plus, Pencil, Trash2, X, ClipboardList, Save } from "lucide-react";

type MaxScoreType = {
  id: number;
  first_test: string;
  second_test: string;
  exam: string;
  school_class: {
    id: number;
    name: string;
    arm?: {
      name: string;
      code: string;
    };
  };
};

type ClassType = {
  id: number;
  name: string;
  arm?: {
    name: string;
    code: string;
  };
};

type FormType = {
  first_test: string;
  second_test: string;
  exam: string;
  school_class_id: string;
};

const initialForm: FormType = {
  first_test: "",
  second_test: "",
  exam: "",
  school_class_id: "",
};

export default function MaxScoresComponent() {
  const [scores, setScores] = useState<MaxScoreType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [form, setForm] = useState<FormType>(initialForm);

  const [editingScore, setEditingScore] = useState<MaxScoreType | null>(null);

  // =========================================
  // FETCH DATA
  // =========================================
  const loadData = async () => {
    try {
      setFetching(true);

      const [scoreRes, classRes] = await Promise.all([
        apiAction("results", "maxscores"),
        apiAction("academics", "classes"),
      ]);

      setScores(scoreRes.results || scoreRes);
      setClasses(classRes.results || classRes);
    } catch (error) {
      console.log(error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================
  // HANDLE CHANGE
  // =========================================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================================
  // RESET FORM
  // =========================================
  const resetForm = () => {
    setForm(initialForm);
    setEditingScore(null);
  };

  // =========================================
  // CREATE
  // =========================================
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    let res: any;
    const payload = {
      first_test: Number(form.first_test),
      second_test: Number(form.second_test),
      exam: Number(form.exam),
      school_class_id: Number(form.school_class_id),
    };
    try {
      setLoading(true);
      const url = `${BASE_URL}/results/maxscores/?school_class=${form.school_class_id}`;
      const existingRes = await fetch(url, {
        headers: apiHeaders(),
      });
      const response = await handleResponse(existingRes);
      const existing = response.results[0];

      if (existing) {
        res = await updateAction("results", "maxscores", existing.id, payload);
  
        loadData()

        resetForm();
        setShowCreateModal(false);
        toast.success(`Max scores for ${existing.school_class.name} updated successfully`);
      } else {
        res = await createAction("results", "maxscores", payload, "POST");
        setScores((prev) => [...prev, res]);

        resetForm();
        setShowCreateModal(false);

        toast.success("Max scores created successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to create max scores");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // OPEN EDIT
  // =========================================
  const openEditModal = (score: MaxScoreType) => {
    setEditingScore(score);

    setForm({
      first_test: String(score.first_test),
      second_test: String(score.second_test),
      exam: String(score.exam),
      school_class_id: String(score.school_class.id),
    });

    setShowEditModal(true);
  };

  // =========================================
  // UPDATE
  // =========================================
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingScore) return;

    try {
      setLoading(true);

      const payload = {
        first_test: Number(form.first_test),
        second_test: Number(form.second_test),
        exam: Number(form.exam),
        school_class_id: Number(form.school_class_id),
      };

      const res = await updateAction(
        "results",
        "maxscores",
        editingScore.id,
        payload,
        "PATCH",
      );

      if (res) {
        setScores((prev) =>
          prev.map((item) => (item.id === editingScore.id ? res : item)),
        );

        resetForm();
        setShowEditModal(false);

        toast.success(
          `Max scores for ${res.school_class.name} updated successfully`,
        );
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update max scores");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // DELETE
  // =========================================
  const deleteScore = async (id: number, itemName: string) => {
    const res = await handleUserDelete("results", "maxscores", id, itemName);
    if (res) {
      setScores((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // =========================================
  // TOTAL SCORE
  // =========================================
  const calculateTotal = (first: string, second: string, exam: string) => {
    return Number(first || 0) + Number(second || 0) + Number(exam || 0);
  };

  if (fetching) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading max scores...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Max Scores Management
          </h1>

          <p className="text-gray-500 mt-1">
            Configure maximum scores for tests and exams per class.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold transition"
        >
          <Plus size={18} />
          Add Max Scores
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Configured Classes</p>

          <h2 className="text-3xl font-bold mt-2 text-gray-900">
            {scores.length}
          </h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Highest Total Score</p>

          <h2 className="text-3xl font-bold mt-2 text-green-700">
            {Math.max(
              ...scores.map((s) =>
                calculateTotal(s.first_test, s.second_test, s.exam),
              ),
              0,
            )}
          </h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Default Exam Weight</p>

          <h2 className="text-3xl font-bold mt-2 text-blue-700">60</h2>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <ClipboardList size={22} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Class Maximum Scores
            </h2>

            <p className="text-sm text-gray-500">
              Manage score structure for all classes.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Class
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  1st Test
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  2nd Test
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Exam
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Total
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {scores.length > 0 ? (
                scores.map((score) => (
                  <tr
                    key={`score-${score.id}`}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {score.school_class.name}
                        </p>

                        <p className="text-sm text-gray-500">
                          {score.school_class.arm?.code}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5 font-medium text-gray-700">
                      {score.first_test}
                    </td>

                    <td className="px-6 py-5 font-medium text-gray-700">
                      {score.second_test}
                    </td>

                    <td className="px-6 py-5 font-medium text-gray-700">
                      {score.exam}
                    </td>

                    <td className="px-6 py-5">
                      <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold">
                        {calculateTotal(
                          score.first_test,
                          score.second_test,
                          score.exam,
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            openEditModal(score);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteScore(
                              score.id,
                              `Max Score for ${score.school_class.name}`,
                            )
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No max scores configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CREATE MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-9999 h-fit bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 py-2">
          <div className="bg-white w-full max-w-2xl h-fit rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Add Max Scores
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Set maximum score limits for a class.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Class
                </label>

                <select
                  name="school_class_id"
                  value={form.school_class_id}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose class</option>

                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.arm?.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    1st Test
                  </label>

                  <input
                    type="number"
                    name="first_test"
                    value={form.first_test}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    2nd Test
                  </label>

                  <input
                    type="number"
                    name="second_test"
                    value={form.second_test}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exam
                  </label>

                  <input
                    type="number"
                    name="exam"
                    value={form.exam}
                    onChange={handleChange}
                    placeholder="e.g. 60"
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <p className="text-sm text-gray-500">Total Maximum Score</p>

                <h2 className="text-4xl font-bold text-blue-700 mt-2">
                  {calculateTotal(form.first_test, form.second_test, form.exam)}
                </h2>
              </div>

              <div className="flex justify-end gap-3 pt-4 my-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-5 py-3 rounded-2xl bg-gray-200 hover:bg-gray-300 font-medium transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                  <Save size={18} />

                  {loading ? "Saving..." : "Save Scores"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {showEditModal && editingScore && (
        <div className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 py-6">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Max Scores
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Update score limits for this class.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5 my-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Class
                </label>

                <select
                  name="school_class_id"
                  value={form.school_class_id}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map((cls) => (
                    <option key={`class-${cls.id}`} value={cls.id}>
                      {cls.name} - {cls.arm?.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <input
                  type="number"
                  name="first_test"
                  value={form.first_test}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                />

                <input
                  type="number"
                  name="second_test"
                  value={form.second_test}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                />

                <input
                  type="number"
                  name="exam"
                  value={form.exam}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <p className="text-sm text-blue-600">Updated Total Score</p>

                <h2 className="text-4xl font-bold text-blue-700 mt-2">
                  {calculateTotal(form.first_test, form.second_test, form.exam)}
                </h2>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-5 py-3 rounded-2xl bg-gray-200 hover:bg-gray-300 font-medium transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                  <Save size={18} />

                  {loading ? "Updating..." : "Update Scores"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
