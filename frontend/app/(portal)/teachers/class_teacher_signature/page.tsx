"use client";

import TeacherSignatureUploadComponent from "@/app/components/sections/TeacherSignatureUploadComponent";
import { apiAction, fetchClasses, handleUserDelete } from "@/app/lib/api";
import { ClassType } from "@/app/lib/types";
import { getTeacherSignatures } from "@/app/services/results";
import { useEffect, useState } from "react";

export default function TeacherSignaturePage() {
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [classTeacherId, setClassTeacherId] = useState<number | null>(null);
  const [teacherSignature, setTeacherSignature] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getCurrentClass = async (selectedClass: number) => {
    const res = await apiAction("academics", `classes`, selectedClass);
    if (res) {
      setClassTeacherId(res.class_teacher.id);
    }
  };
  const getTeacherSignature = async (classId: number) => {
    const res = await getTeacherSignatures();

    if (res?.results) {
      const result = res.results.filter(
        (s: any) => Number(s.school_class) === Number(classId),
      );

      setTeacherSignature(result);
    }
  };

  const deleteSignature = async (id: number) => {
    try {
      const deleted = await handleUserDelete(
        "results",
        "teacher-signatures",
        id,
        "Signature",
      );

      if (deleted) {
        selectedClass && getTeacherSignature(selectedClass);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  useEffect(() => {
    getClasses();
    if (selectedClass) {
      getCurrentClass(selectedClass);
      getTeacherSignature(selectedClass);
    }
  }, [selectedClass]);

  async function getClasses() {
    try {
      setLoading(true);

      const response = await fetchClasses();

      setClasses(response.results || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load classes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Class Teacher Signature</h1>

        <p className="mt-1 text-sm text-gray-500">
          Select a class and upload the teacher's signature.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <label className="mb-2 block text-sm font-medium">Select Class</label>

        <select
          value={selectedClass ?? ""}
          onChange={(e) =>
            setSelectedClass(e.target.value ? Number(e.target.value) : null)
          }
          className="w-full rounded-lg border p-3 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">-- Select Class --</option>

          {classes.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>
              {schoolClass.name}
            </option>
          ))}
        </select>

        {loading && (
          <p className="mt-3 text-sm text-gray-500">Loading classes...</p>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
      {selectedClass && teacherSignature?.length > 0 && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold mb-3">Available Signatures</h2>

          <div className="space-y-3">
            {teacherSignature.map((sig: any) => (
              <div
                key={sig.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                {/* IMAGE */}
                <div className="flex items-center gap-3">
                  <img
                    src={sig.signature}
                    alt="signature"
                    className="h-12 w-24 object-contain border rounded"
                  />

                  {/* ACTIVE BADGE */}
                  {sig.is_active ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>

                {/* DELETE */}
                <button
                  onClick={() => deleteSignature(sig.id)}
                  className="text-xs px-3 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedClass && classTeacherId && (
        <TeacherSignatureUploadComponent
          schoolClassId={selectedClass}
          classTeacherId={classTeacherId}
        />
      )}
    </div>
  );
}
