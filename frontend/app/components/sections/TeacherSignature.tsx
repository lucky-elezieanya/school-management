"use client";
import { toast } from "sonner";
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
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getCurrentClass = async (selectedClass: number) => {
    const res = await apiAction("academics", `classes`, selectedClass);
    if (res?.class_teacher?.id) {
      setClassTeacherId(res?.class_teacher?.id);
    } else {
      setClassTeacherId(null);
      alert(`No teacher assigned to this class yet!`);
    }
  };
  const getTeacherSignature = async (classId: number) => {
    const res = await getTeacherSignatures();

    if (res?.results) {
      const result = res.results.filter(
        (s: any) => Number(s.school_class) === Number(classId),
      );

      setTeacherSignature(result);
    } else {
      setTeacherSignature([]);
      alert(`No signatures set for this class yet!`);
      return;
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
        alert(`Signature deleted successfully, kindly reupload`);
        setTeacherSignature([]);
        return;
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  async function handleActivate(id: number) {
    if (!selectedClass) {
      toast.error("Please select a class first.");
      return;
    }

    try {
      setActivatingId(id);

      await apiAction(
        "results",
        `teacher-signatures/${id}/activate`,
        undefined,
        "POST",
      );

      toast.success(
        "Signature activated for all classes assigned to this teacher.",
      );

      // Reload signatures for the currently selected class
      await getTeacherSignature(selectedClass);
    } catch (error: any) {
      console.error("Failed to activate signature:", error);

      toast.error(error?.message || "Failed to activate signature.");
    } finally {
      setActivatingId(null);
    }
  }

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
              {schoolClass.name} {schoolClass.arm.name}
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                      Active
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        Inactive
                      </span>

                      <button
                        type="button"
                        onClick={() => handleActivate(sig.id)}
                        disabled={activatingId === sig.id}
                        className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-md
                        bg-green-700
                        px-3
                        py-1.5
                        text-xs
                        font-medium
                        text-white
                        shadow-sm
                        transition
                        hover:bg-green-800
                        focus:outline-none
                        focus:ring-2
                        focus:ring-green-500
                        focus:ring-offset-1
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                      >
                        {activatingId === sig.id
                          ? "Activating..."
                          : "Make active"}
                      </button>
                    </div>
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
