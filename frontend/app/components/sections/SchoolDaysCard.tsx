"use client";
import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useEffect, useState } from "react";

export default function SchoolDaysCard() {
  const { currentTerm } = useAuth();

  const [record, setRecord] = useState<any>(null);
  const [days, setDays] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch existing record
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${BASE_URL}/results/school-days/?term=${currentTerm?.id}&session=${currentTerm?.session.id}`,
          {
            headers: apiHeaders(),
          },
        );
        const data = await res.json();

        if (data.count > 0) {
          setRecord(data.results);
          setDays(data.results[0].days_school_opened);
        }
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!currentTerm?.id || !currentTerm?.session?.id) {
      setError("Current term or session is not available");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      days_school_opened: Number(days),
      term_id: currentTerm?.id,
      session_id: currentTerm?.session.id,
    };

    try {
      let res;

      if (record) {
        // UPDATE
        res = await fetch(`${BASE_URL}/results/school-days/${record.id}/`, {
          method: "PUT",
          headers: {
            ...apiHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE
        res = await fetch(`${BASE_URL}/results/school-days/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...apiHeaders(),
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Request failed");
      alert("Successs!");
      const result = await res.json();

      setRecord(result);
    } catch (err) {
      setError("Failed to save school days");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center p-4">
      <div className="w-full max-w-m bg-white rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-100">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            School Days Tracker
          </h2>
          <p className="text-sm text-gray-500">
            {currentTerm?.name} • {currentTerm?.session.name}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Days School Opened
          </label>

          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter number of days"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Saving..." : record ? "Update Record" : "Save Record"}
        </button>

        {/* Footer hint */}
        <p className="text-xs text-gray-400 mt-3 text-center">
          This value is shared across all students in this term.
        </p>
      </div>
    </div>
  );
}
