"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    apiHeaders,
    BASE_URL,
    createAction,
    updateAction,
} from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { getClasses } from "@/app/services/academics";

export default function CommentsBox() {
    const router = useRouter();
    const { currentTerm } = useAuth();

    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    const [selectedClass, setSelectedClass] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");

    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingComment, setLoadingComment] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [existingCommentId, setExistingCommentId] = useState<number | null>(
        null,
    );

    const initialFormState = {
        class_teacher_comment: "",
        principal_comment: "",
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        loadClasses();
    }, []);

    // =========================
    // LOAD CLASSES (UNCHANGED)
    // =========================
    const loadClasses = async () => {
        try {
            setLoadingClasses(true);
            const res = await getClasses();
            setClasses(res?.results || res || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingClasses(false);
        }
    };

    // =========================
    // LOAD STUDENTS (UNCHANGED)
    // =========================
    const loadStudents = async (classId: number) => {
        try {
            setLoadingStudents(true);

            const url = `${BASE_URL}/academics/enrollments/?school_class=${classId}&session=${currentTerm?.session.id}`;

            const resp = await fetch(url, {
                headers: apiHeaders(),
            });

            const res = await resp.json();
            setStudents(res?.results || res || []);
        } catch (error) {
            console.error(error);
            setStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

    // =========================
    // LOAD COMMENT (UNCHANGED)
    // =========================
    const loadExistingComment = async (studentId: number) => {
        if (!currentTerm?.id) return;

        try {
            setLoadingComment(true);

            setExistingCommentId(null);
            setFormData(initialFormState);

            const url = `${BASE_URL}/results/term-comments/?student=${studentId}&term=${currentTerm.id}`;

            const resp = await fetch(url, {
                headers: apiHeaders(),
            });

            const res = await resp.json();

            const comment =
                (res && res?.results?.[0]) || res?.data?.[0] || res?.[0];

            if (!comment) return;

            setExistingCommentId(comment.id);

            setFormData({
                class_teacher_comment: comment.class_teacher_comment || "",
                principal_comment: comment.principal_comment || "",
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingComment(false);
        }
    };

    // =========================
    // CLASS SELECT (checkbox UI)
    // =========================
    const handleClassSelect = async (classId: string) => {
        const newClass = selectedClass === classId ? "" : classId;

        setSelectedClass(newClass);
        setSelectedStudent("");
        setStudents([]);
        setFormData(initialFormState);
        setExistingCommentId(null);

        if (newClass) {
            await loadStudents(Number(newClass));
        }
    };

    // =========================
    // STUDENT SELECT (checkbox UI)
    // =========================
    const handleStudentSelect = async (studentId: string) => {
        setSelectedStudent(studentId);

        if (studentId) {
            await loadExistingComment(Number(studentId));
        }
    };

    // =========================
    // SUBMIT (UNCHANGED)
    // =========================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentTerm?.id) {
            alert("Current term not found");
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                student_id: Number(selectedStudent),
                school_class_id: Number(selectedClass),
                term_id: currentTerm.id,
                session_id: currentTerm.session.id,

                class_teacher_comment: formData.class_teacher_comment
                    ? formData.class_teacher_comment[0].toUpperCase() +
                        formData.class_teacher_comment.slice(1).toLowerCase()
                    : "",

                principal_comment: formData.principal_comment
                    ? formData.principal_comment[0].toUpperCase() +
                        formData.principal_comment.slice(1).toLowerCase()
                    : "",
            };

            if (existingCommentId) {
                await updateAction(
                    "results",
                    `term-comments`,
                    existingCommentId,
                    payload,
                );
            } else {
                await createAction("results", "term-comments", payload);
            }

            alert(
                existingCommentId
                    ? "Comment updated successfully"
                    : "Comment saved successfully",
            );

            return;
        } catch (error: any) {
            console.error(error);
            alert(error?.message || "Unable to save comment");
        } finally {
            setSubmitting(false);
        }
    };

    // =========================
    // FILTER STUDENTS (optional search-ready)
    // =========================
    const visibleStudents = students;

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Term Comment Entry</h1>

            {/* ===================== CLASSES ===================== */}
            <div className="bg-white border rounded-xl p-6 mb-6">
                <h2 className="font-semibold mb-3">Select Class</h2>

                {loadingClasses && (
                    <p className="text-sm text-gray-500 mb-2">
                        Loading classes...
                    </p>
                )}

                <div className="space-y-2 grid grid-cols-2 md:grid-cols-3">
                    {classes.map((cls: any) => (
                        <label
                            key={cls.id}
                            className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                checked={selectedClass === String(cls.id)}
                                onChange={() =>
                                    handleClassSelect(String(cls.id))
                                }
                                className="h-4 w-4 text-green-600"
                            />

                            <span>
                                {cls.name} {cls.arm?.code}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* ===================== STUDENTS ===================== */}
            {selectedClass && (
                <div className="bg-white border rounded-xl p-6 mb-6">
                    <h2 className="font-semibold mb-3">Select Student</h2>

                    {loadingStudents && (
                        <p className="text-sm text-gray-500 mb-2">
                            Loading students...
                        </p>
                    )}

                    <div className="max-h-75 overflow-y-auto space-y-2 grid grid-cols-1 md:grid-cols-2">
                        {visibleStudents.map((student: any) => (
                            <label
                                key={student.student}
                                className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50"
                            >
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedStudent ===
                                        String(student.student)
                                    }
                                    onChange={() =>
                                        handleStudentSelect(
                                            String(student.student),
                                        )
                                    }
                                    className="h-4 w-4 text-green-600"
                                />

                                <div>
                                    <div className="font-medium">
                                        {student.student_name}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* ===================== FORM ===================== */}
            {selectedStudent && !loadingComment && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white border rounded-xl p-6 space-y-4"
                >
                    {existingCommentId && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700">
                            Existing comment found. Updating will overwrite it.
                        </div>
                    )}

                    <div>
                        <label className="block mb-2 font-medium">
                            Class Teacher Comment
                        </label>

                        <textarea
                            rows={4}
                            value={formData.class_teacher_comment}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    class_teacher_comment: e.target.value,
                                })
                            }
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">
                            Principal Comment
                        </label>

                        <textarea
                            rows={4}
                            value={formData.principal_comment}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    principal_comment: e.target.value,
                                })
                            }
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                    >
                        {submitting
                            ? "Saving..."
                            : existingCommentId
                                ? "Update Comment"
                                : "Save Comment"}
                    </button>
                </form>
            )}

            {loadingComment && (
                <div className="mt-4 text-sm text-gray-500">
                    Loading existing comment...
                </div>
            )}
        </div>
    );
}

