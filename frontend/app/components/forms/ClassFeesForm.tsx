"use client";

import { useEffect, useState } from "react";
import {
  apiAction,
  apiHeaders,
  BASE_URL,
  createAction,
  handleResponse,
  handleUserDelete,
  updateAction,
} from "@/app/lib/api";

type Props = {
  onSuccess?: () => void;
};

export default function ClassFeesForm({ onSuccess }: Props) {
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    school_class_id: "",
    session_id: "",
    term_id: "",
    amount: "",
  });

  // =========================
  // FETCH INITIAL DATA
  // =========================
  const loadData = async () => {
    try {
      setFetching(true);

      const [cls, ses, feeRes] = await Promise.all([
        apiAction("academics", "classes"),
        apiAction("academics", "sessions"),
        apiAction("results", "classfees"),
      ]);

      setClasses(cls.results || []);
      setSessions(ses.results || []);
      setFees(feeRes.results || []);
    } catch (err) {
      console.log(err);
    } finally {
      setFetching(false);
    }
  };

  // =========================
  // FETCH TERMS BY SESSION
  // =========================
  const fetchTerms = async (sessionId: string) => {
    if (!sessionId) {
      setTerms([]);
      return;
    }

    try {
      const res = await fetch(
        `${BASE_URL}/academics/sessions/${sessionId}/terms/`,
        { headers: apiHeaders() },
      );

      const data = await res.json();
      setTerms(data.terms || data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // HANDLE INPUT CHANGE
  // =========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 🔥 IF SESSION CHANGES → RESET TERM + LOAD TERMS
    if (name === "session_id") {
      setForm((prev) => ({ ...prev, term_id: "" }));
      fetchTerms(value);
    }
  };

  // =========================
  // SUBMIT FEE
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      let res: any;
      const payload = {
        ...form,
        amount: Number(form.amount),
      };
      const url = `${BASE_URL}/results/classfees/?school_class=${form.school_class_id}&term=${form.term_id}&session=${form.session_id}`;
      const existingFeesRes = await fetch(url, { headers: apiHeaders() });
      const existingFees = await handleResponse(existingFeesRes).then(
        (results) => results.results[0],
      );

      if (existingFees) {
        res = await updateAction(
          "results",
          "classfees",
          existingFees.id,
          payload,
        );
        loadData();
        onSuccess?.()
        setTerms([])
        setForm({
          school_class_id: "",
          session_id: "",
          term_id: "",
          amount: "",
        });
        setShowModal(false);
        alert(
          `Class fee for ${existingFees.school_class.name} updated successfully`,
        );
      } else {
        res = await createAction("results", "classfees", payload, "POST");
        setFees((prev) => [...prev, res]);

        setForm({
          school_class_id: "",
          session_id: "",
          term_id: "",
          amount: "",
        });

        setTerms([]);
        setShowModal(false);

        onSuccess?.()
        alert("Class fee created successfully")}
      
    } catch (err) {
      console.log(err);
      alert("Failed to create fee");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOADING STATE
  // =========================
  if (fetching) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading class fees...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Class Fees Management
          </h2>
          <p className="text-gray-500 text-sm">
            View and manage all class fees across sessions
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
        >
          + Add Fee
        </button>
      </div>

      {/* TABLE */}
      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-x-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-200">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-4">Class</th>
                <th className="p-4">Current Session</th>
                <th className="p-4">Current Term</th>
                <th className="p-4">Next Term Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {fees.length > 0 ? (
                fees.map((fee) => (
                  <tr key={fee.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium">
                      {fee.school_class?.name} - {fee.school_class?.arm.code}
                    </td>

                    <td className="p-4 text-gray-600">{fee.session?.name}</td>

                    <td className="p-4 text-gray-600">{fee.term?.name}</td>

                    <td className="p-4 font-semibold text-green-700">
                      ₦{Number(fee.amount).toLocaleString()}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() =>
                            (window.location.href = `/admin/administration/fees/${fee.id}/edit`)
                          }
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleUserDelete(
                              "results",
                              "classfees",
                              fee.id,
                              "Class Fees",
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-gray-500">
                    No class fees available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-bold">Add Class Fee for Next Term</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* CLASS */}
              <label htmlFor="">Class</label>
              <select
                name="school_class_id"
                value={form.school_class_id}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.arm.name}
                  </option>
                ))}
              </select>

              {/* SESSION */}
              <label htmlFor="">Current Session</label>
              <select
                name="session_id"
                value={form.session_id}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl"
              >
                <option value="">Select Session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_active && "(Active)"}
                  </option>
                ))}
              </select>

              {/* TERM (FILTERED BY SESSION) */}
              <label htmlFor="">Current Term</label>
              <select
                name="term_id"
                value={form.term_id}
                onChange={handleChange}
                className="w-full p-3 border rounded-xl"
                disabled={!form.session_id}
              >
                <option value="">Select Term</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} - {t.session?.name} {t.is_active && "(Active)"}
                  </option>
                ))}
              </select>

              {/* AMOUNT */}
              <label htmlFor="">Next Term Fees</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="Enter Next Term Fee Amount"
                className="w-full p-3 border rounded-xl"
              />

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  {loading ? "Saving..." : "Save Fee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
