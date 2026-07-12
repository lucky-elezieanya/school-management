"use client";

import { useEffect, useState } from "react";
import { apiAction, BASE_URL, apiHeaders } from "@/app/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { ClassType, StudentType } from "@/app/lib/types";

type AttendanceRow = {
  student: number;
  attendance: number;
  id?: number;
};

/* =========================
   COMPONENT
========================= */
export default function BulkAttendanceComponent() {
  const { currentTerm } = useAuth();
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [classId, setClassId] = useState<number | null>(null);

  const [students, setStudents] = useState<StudentType[]>([]);
  const [rows, setRows] = useState<Record<number, AttendanceRow>>({});

  const [daysOpen, setDaysOpen] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* =========================
	   LOAD CLASSES
	========================= */
  const loadClasses = async () => {
    try {
      setLoading(true);

      const res = await apiAction("academics", "classes");
      setClasses(res.results || res);
    } catch {
      setError("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  /* =========================
	   FETCH SCHOOL DAYS
	========================= */
  const fetchSchoolDays = async () => {
    const res = await fetch(
      `${BASE_URL}/results/school-days/?term_id=currentTerm?.id`,
      {
        headers: apiHeaders(),
      },
    );

    const data = await res.json();

    if (data.days_school_opened) {
      setDaysOpen(data.results[0].days_school_opened || 0);
    }
  };

  /* =========================
	   FETCH STUDENTS (YOUR ORIGINAL FLOW)
	========================= */
  const fetchStudents = async (id: number) => {
    if (!id) return;

    const res = await fetch(`${BASE_URL}/academics/classes/${id}/students/`, {
      headers: apiHeaders(),
    });

    const data = await res.json();

    setStudents(data.students || []);
  };

  /* =========================
	   FETCH ATTENDANCE + MAP
	========================= */
  const fetchAttendance = async () => {
    const attRes = await apiAction("results", "attendance");
    const attendanceList = attRes.results || [];

    const map: Record<number, AttendanceRow> = {};

    attendanceList.forEach((a: any) => {
      map[a.student.id] = {
        student: a.student.id,
        attendance: a.attendance,
        id: a.id,
      };
    });

    setRows(map);
  };

  /* =========================
	   WHEN CLASS IS SELECTED
	========================= */
  useEffect(() => {
    if (!classId) return;

    const run = async () => {
      setError("");

      await Promise.all([
        fetchStudents(classId),
        fetchSchoolDays(),
        fetchAttendance(),
      ]);
    };

    run();
  }, [classId]);

  /* =========================
	   HANDLE CHANGE (INLINE EDIT)
	========================= */
  const handleChange = (studentId: number, value: string) => {
    const num = Number(value);

    // frontend validation
    // if (num > daysOpen) {
    //   setError(`Max allowed is ${daysOpen}`);
    //   return;
    // }

    setError("");

    setRows((prev) => ({
      ...prev,
      [studentId]: {
        student: studentId,
        attendance: num,
      },
    }));
  };

  /* =========================
	   BULK SUBMIT (UPSERT)
	========================= */
  const handleSubmit = async () => {
    if (!classId) return;

    setSaving(true);
    setError("");

    try {
      const payload = {
        term_id: currentTerm?.id,
        session_id: currentTerm?.session?.id,
        school_class_id: classId,
        records: students.map((s) => ({
          student: s.id,
          attendance: rows[s.id]?.attendance || 0,
        })),
      };

      const res = await fetch(`${BASE_URL}/results/attendance/bulk_upsert/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      if (res.ok) {
        toast.success("Attendance saved successfully!");
        console.log(data);
        
      }
    } catch {
      setError("Bulk save failed");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
	   UI
	========================= */
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-emerald-700 text-white p-6 rounded-2xl">
        <h1 className="text-2xl font-bold">Bulk Attendance Entry</h1>
        <p className="text-sm opacity-80">Select a class to begin</p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</div>
      )}

      {/* CLASS LIST */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-bold mb-3">Select Class</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setClassId(cls.id)}
              className={`p-3 rounded-xl border ${
                classId === cls.id ? "bg-emerald-600 text-white" : "bg-gray-50"
              }`}
            >
              {cls.name} {cls.arm.name}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      {classId && (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Attendance (Max {daysOpen})</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 flex gap-2 items-center">
                    <img
                      src={s.user.profile_picture || "/avatar.png"}
                      alt=""
                      className="object-cover w-12 h-12 rounded-full"
                    />
                    <span>{s.user.full_name}</span>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={rows[s.id]?.attendance ?? ""}
                      //   max={daysOpen}
                      onChange={(e) => handleChange(s.id, e.target.value)}
                      className="border p-2 rounded w-24"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBMIT */}
      {classId && (
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-emerald-600 text-white p-3 rounded-xl"
        >
          {saving ? "Saving..." : "Save All Attendance"}
        </button>
      )}
    </div>
  );
}
