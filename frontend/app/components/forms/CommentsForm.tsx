"use client";

import { useEffect, useState } from "react";
import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { getClasses } from "@/app/services/academics";
import { toast } from "sonner";
import { getWorkFlowApprovedStatus } from "@/app/services/results";

type BehaviourGrades = "A" | "B" | "C" | "D" | "E" | "F";

type BehaviourRecord = {
  student: number;
  school_class: number;

  term: number;
  session: number;

  skills: BehaviourGrades;
  politeness: BehaviourGrades;
  neatness: BehaviourGrades;
  self_control: BehaviourGrades;
  relationship: BehaviourGrades;
  attendance: BehaviourGrades;
  punctuality: BehaviourGrades;
  leadership: BehaviourGrades;
};

const behaviourItems = [
  {
    key: "relationship",
    label: "R",
    full: "Relationship",
  },
  {
    key: "skills",
    label: "SK",
    full: "Skills",
  },
  {
    key: "politeness",
    label: "P",
    full: "Politeness",
  },
  {
    key: "neatness",
    label: "N",
    full: "Neatness",
  },
  {
    key: "self_control",
    label: "SC",
    full: "Self Control",
  },
  {
    key: "attendance",
    label: "AT",
    full: "Attendance",
  },
  {
    key: "punctuality",
    label: "PU",
    full: "Punctuality",
  },
  {
    key: "leadership",
    label: "L",
    full: "Leadership",
  },
] as const;

const behaviourLegend = [
  "R = Relationship",
  "SK = Skills",
  "P = Politeness",
  "N = Neatness",
  "SC = Self Control",
  "AT = Attendance",
  "PU = Punctuality",
  "L = Leadership",
];

export default function TermCommentEntryPage() {
  const { currentTerm } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [selectedClass, setSelectedClass] = useState("");

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [approvedStatus, setApprovedStatus] = useState<string>("");

  const getWorkFlowStatus = async (
    school_class: number,
    term: number,
    session: number,
  ) => {
    try {
      const res = await getWorkFlowApprovedStatus(school_class, term, session);
      if (res?.results?.length) {
        setApprovedStatus(res.results[0].status);
      } else {
        setApprovedStatus("");
      }
    } catch (error) {
      console.log(error);
      alert(error);
    }
  };

  useEffect(() => {
    currentTerm &&
      selectedClass &&
      getWorkFlowStatus(
        Number(selectedClass),
        currentTerm?.id,
        currentTerm?.session.id,
      );
  }, [selectedClass]);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    loadStudents(Number(selectedClass));
  }, [selectedClass]);

  // =====================================================
  // LOAD CLASSES
  // =====================================================

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);

      const res = await getClasses();

      setClasses(res?.results || res || []);
      setSelectedClass(String(res.results[0].id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  };

  // =====================================================
  // LOAD STUDENTS + EXISTING COMMENTS
  const loadStudents = async (classId: number) => {
    if (!currentTerm) return;

    try {
      setLoadingStudents(true);

      const [studentRes, commentRes, attendanceRes, behaviourRes] =
        await Promise.all([
          fetch(
            `${BASE_URL}/academics/enrollments/?school_class=${classId}&session=${currentTerm.session.id}&is_current=true`,
            {
              headers: apiHeaders(),
            },
          ),

          fetch(
            `${BASE_URL}/results/term-comments/?school_class=${classId}&term=${currentTerm.id}&session=${currentTerm.session.id}`,
            {
              headers: apiHeaders(),
            },
          ),

          fetch(
            `${BASE_URL}/results/attendance/?school_class=${classId}&term=${currentTerm.id}&session=${currentTerm.session.id}`,
            {
              headers: apiHeaders(),
            },
          ),

          fetch(
            `${BASE_URL}/results/behaviour/?school_class=${classId}&term=${currentTerm.id}&session=${currentTerm.session.id}`,
            {
              headers: apiHeaders(),
            },
          ),
        ]);

      const studentJson = await studentRes.json();
      const commentJson = await commentRes.json();
      const attendanceJson = await attendanceRes.json();
      const behaviourJson = await behaviourRes.json();

      const studentList = studentJson.results || [];
      const commentList = commentJson.results || [];
      const attendanceList = attendanceJson.results || [];
      const behaviourList = behaviourJson.results || [];

      // ==========================================
      // Attendance Map
      // ==========================================

      const attendanceMap: Record<number, any> = {};

      attendanceList.forEach((attendance: any) => {
        const studentId =
          typeof attendance.student === "object"
            ? attendance.student.id
            : attendance.student;

        attendanceMap[studentId] = attendance;
      });

      // ==========================================
      // Comment Map
      // ==========================================

      const commentMap: Record<number, any> = {};

      commentList.forEach((comment: any) => {
        const studentId =
          typeof comment.student === "object"
            ? comment.student.id
            : comment.student;

        commentMap[studentId] = comment;
      });

      // ==========================================
      // Behaviour Map
      // ==========================================

      const behaviourMap: Record<number, BehaviourRecord> = {};

      behaviourList.forEach((behaviour: any) => {
        const studentId =
          typeof behaviour.student === "object"
            ? behaviour.student.id
            : behaviour.student;

        const normalize = (value?: string): BehaviourGrades =>
          (value?.toUpperCase() as BehaviourGrades) || "A";

        behaviourMap[studentId] = {
          student: studentId,

          school_class:
            typeof behaviour.school_class === "object"
              ? behaviour.school_class.id
              : behaviour.school_class,

          term:
            typeof behaviour.term === "object"
              ? behaviour.term.id
              : behaviour.term,

          session:
            typeof behaviour.session === "object"
              ? behaviour.session.id
              : behaviour.session,

          skills: normalize(behaviour.skills),
          politeness: normalize(behaviour.politeness),
          neatness: normalize(behaviour.neatness),
          self_control: normalize(behaviour.self_control),
          relationship: normalize(behaviour.relationship),
          attendance: normalize(behaviour.attendance),
          punctuality: normalize(behaviour.punctuality),
          leadership: normalize(behaviour.leadership),
        };
      });
      // ==========================================
      // Merge Student Data
      // ==========================================

      const merged =
        studentList && studentList.length > 0
          ? studentList.map((student: any) => {
              const studentId =
                typeof student.student === "object"
                  ? student.student.id
                  : student.student;

              const existingComment = commentMap[studentId];
              const existingAttendance = attendanceMap[studentId];
              const existingBehaviour = behaviourMap[studentId];

              return {
                ...student,

                attendance: existingAttendance?.attendance ?? 0,

                class_teacher_comment:
                  existingComment?.class_teacher_comment ?? "",

                principal_comment: existingComment?.principal_comment ?? "",

                behaviour: existingBehaviour ?? {
                  student: studentId,
                  school_class: classId,
                  term: currentTerm.id,
                  session: currentTerm.session.id,

                  skills: "A",
                  politeness: "A",
                  neatness: "A",
                  self_control: "A",
                  relationship: "A",
                  attendance: "A",
                  punctuality: "A",
                  leadership: "A",
                },
              };
            })
          : [];

      setStudents(merged);
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };
  // =====================================================
  // CLASS SELECT
  // =====================================================

  const handleClassSelect = async (classId: string) => {
    const next = selectedClass === classId ? "" : classId;

    setSelectedClass(next);
    setStudents([]);

    if (next) {
      await loadStudents(Number(next));
    }
  };

  const updateStudent = (studentId: number, field: string, value: any) => {
    setStudents((prev) =>
      prev.map((student) => {
        const id =
          typeof student.student === "object"
            ? student.student.id
            : student.student;

        if (id !== studentId) return student;

        return {
          ...student,
          [field]: value,
        };
      }),
    );
  };

  // Check if all student fields are filled before enabling submission
  const isFormComplete =
    students.length > 0 &&
    students.every((student) => {
      const hasAttendance =
        student.attendance !== "" &&
        student.attendance !== null &&
        student.attendance !== undefined &&
        !isNaN(Number(student.attendance));

      const hasTeacherComment =
        typeof student.class_teacher_comment === "string" &&
        student.class_teacher_comment.trim() !== "";

      const hasPrincipalComment =
        typeof student.principal_comment === "string" &&
        student.principal_comment.trim() !== "";

      const hasAllBehaviours = behaviourItems.every(
        (item) => !!student.behaviour?.[item.key],
      );

      return (
        hasAttendance &&
        hasTeacherComment &&
        hasPrincipalComment &&
        hasAllBehaviours
      );
    });

  // =====================================================
  // SAVE
  // =====================================================
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!selectedClass || !currentTerm || !isFormComplete) return;

    try {
      setSubmitting(true);

      const attendancePayload = {
        term_id: currentTerm.id,

        session_id: currentTerm.session.id,

        school_class_id: Number(selectedClass),

        records: students.map((student) => ({
          student: student.student,

          attendance: student.attendance,
        })),
      };

      const commentPayload = {
        term_id: currentTerm.id,

        session_id: currentTerm.session.id,

        school_class_id: Number(selectedClass),

        comments: students.map((student) => ({
          student: student.student,

          class_teacher_comment: student.class_teacher_comment,

          principal_comment: student.principal_comment,
        })),
      };

      const behaviourPayload = {
        term_id: currentTerm.id,
        session_id: currentTerm.session.id,
        school_class_id: Number(selectedClass),

        records: students.map((student) => ({
          student:
            typeof student.student === "object"
              ? student.student.id
              : student.student,

          skills: student.behaviour.skills,
          politeness: student.behaviour.politeness,
          neatness: student.behaviour.neatness,
          self_control: student.behaviour.self_control,
          relationship: student.behaviour.relationship,
          attendance: student.behaviour.attendance,
          punctuality: student.behaviour.punctuality,
          leadership: student.behaviour.leadership,
        })),
      };
      const [attendanceResponse, commentResponse, behaviourResponse] =
        await Promise.all([
          fetch(`${BASE_URL}/results/attendance/bulk_upsert/`, {
            method: "POST",
            headers: {
              ...apiHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(attendancePayload),
          }),

          fetch(`${BASE_URL}/results/term-comments/bulk-save/`, {
            method: "POST",
            headers: {
              ...apiHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(commentPayload),
          }),
          fetch(`${BASE_URL}/results/behaviour/bulk-upsert/`, {
            method: "POST",

            headers: {
              ...apiHeaders(),
              "Content-Type": "application/json",
            },

            body: JSON.stringify(behaviourPayload),
          }),
        ]);
      console.log(attendancePayload, commentPayload, behaviourPayload);
      console.log(attendanceResponse, commentResponse, behaviourResponse);

      if (
        !attendanceResponse ||
        !commentResponse ||
        !behaviourResponse
      ) {
        toast.error("Unable to save records.");
        return;
      }

      toast.success("Attendance, comments and behaviour saved successfully.");
    } catch (err: any) {
      toast.error(err.message || "Unable to save.");
      console.log(err.message || err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Term Comment Entry
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter or update teacher and principal comments for an entire class at
          once.
        </p>
      </div>

      {/* ===================== CLASS SELECTION ===================== */}

      <div className="mb-6 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Select Class
        </h2>

        {loadingClasses ? (
          <p className="text-sm text-slate-500">Loading classes...</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {classes.map((cls: any) => (
              <label
                key={cls.id}
                className={`cursor-pointer rounded-xl border p-3 transition ${
                  selectedClass === String(cls.id)
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="class"
                  className="hidden"
                  checked={selectedClass === String(cls.id)}
                  onChange={() => handleClassSelect(String(cls.id))}
                />

                <div className="font-semibold text-slate-800">
                  {cls.name} {cls.arm?.code}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* ===================== TABLE ===================== */}

      {selectedClass && (
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-xl border bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-800">Student Comments</h2>

              <p className="text-sm text-slate-500">
                {students.length} students
              </p>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                !isFormComplete ||
                approvedStatus === "Approved" ||
                approvedStatus === "Released"
              }
              className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Saving..." : "Save All"}
            </button>
          </div>

          {loadingStudents ? (
            <div className="p-10 text-center text-slate-500">
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No students found.
            </div>
          ) : (
            <div>
              <div className="mb-4 rounded-lg border bg-gray-50 p-3">
                <h3 className="mb-2 font-semibold text-sm">Behaviour Keys</h3>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
                  {behaviourLegend.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <div
                className="
                overflow-x-auto
                overscroll-x-contain
                rounded-lg
                border
                border-slate-200
                scrollbar-thin
                "
              >
                <table className="w-full min-w-[750px] table-fixed">
                  <thead className="sticky top-0 z-10 bg-slate-100">
                    <tr>
                      <th className="w-[200px] px-3 py-2 text-left text-sm font-semibold text-slate-700">
                        Student
                      </th>

                      <th className="w-[90px] px-2 py-2 text-center text-sm font-semibold text-slate-700">
                        Attendance
                      </th>

                      <th className="w-[220px] px-3 py-2 text-left text-sm font-semibold text-slate-700">
                        Comments
                      </th>
                      <th className="w-[290px] px-3 py-2 text-left text-sm font-semibold text-slate-700">
                        Behaviour
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students && students.length > 0 ? (
                      students.map((student: any) => (
                        <tr
                          key={student.student}
                          className="border-t align-top transition hover:bg-slate-50"
                        >
                          {/* STUDENT */}
                          <td className="px-3 py-4">
                            <div className="flex items-start gap-3">
                              <img
                                src={student.profile_picture || "/avatar.png"}
                                alt={student.student_name}
                                className="h-10 w-10 rounded-full border object-cover flex-shrink-0"
                              />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {student.student_name}
                                </p>

                                <p className="truncate text-xs text-slate-500">
                                  {student.admission_number}
                                </p>

                                {student.existing && (
                                  <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                    Existing
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* ATTENDANCE */}
                          <td className="px-3 py-4 text-center">
                            <input
                              type="number"
                              min={0}
                              value={student.attendance ?? ""}
                              onChange={(e) =>
                                updateStudent(
                                  student.student,
                                  "attendance",
                                  Number(e.target.value),
                                )
                              }
                              className="h-10 w-20 rounded-lg border border-slate-300 text-center text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                            />
                          </td>

                          {/* COMMENTS */}
                          <td className="px-4 py-4">
                            <div className="space-y-3">
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Teacher Comment
                                </label>

                                <textarea
                                  rows={2}
                                  value={student.class_teacher_comment}
                                  onChange={(e) =>
                                    updateStudent(
                                      student.student,
                                      "class_teacher_comment",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Teacher's comment..."
                                  className="w-full resize-none rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Principal Comment
                                </label>

                                <textarea
                                  rows={2}
                                  value={student.principal_comment}
                                  onChange={(e) =>
                                    updateStudent(
                                      student.student,
                                      "principal_comment",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Principal's comment..."
                                  className="w-full resize-none rounded-lg border border-slate-300 p-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                                />
                              </div>
                            </div>
                          </td>

                          {/* BEHAVIOUR */}
                          <td className="px-3 py-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <div className="space-y-3">
                                {behaviourItems.map((item) => (
                                  <div
                                    key={item.key}
                                    className="grid grid-cols-[20px_1fr] items-center gap-3"
                                  >
                                    <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                      {item.label}
                                    </span>

                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                      {(
                                        ["A", "B", "C", "D", "E", "F"] as const
                                      ).map((grade) => (
                                        <label
                                          key={grade}
                                          className="flex items-center gap-1 cursor-pointer"
                                        >
                                          <input
                                            type="radio"
                                            name={`${student.student}-${item.key}`}
                                            value={grade}
                                            checked={
                                              (student.behaviour?.[
                                                item.key as keyof typeof student.behaviour
                                              ] ?? "A") === grade
                                            }
                                            onChange={(e) =>
                                              updateStudent(
                                                student.student,
                                                "behaviour",
                                                {
                                                  ...student.behaviour,
                                                  [item.key]: e.target
                                                    .value as BehaviourGrades,
                                                },
                                              )
                                            }
                                            className="h-4 w-4 accent-emerald-600"
                                          />

                                          <span className="text-[11px] font-semibold text-slate-600">
                                            {grade}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <div className="mx-auto flex justify-center">
                        <h1>No students found for this term and session</h1>
                      </div>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loadingStudents && students.length > 0 && (
            <div className="border-t bg-slate-50 px-6 py-4">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !isFormComplete ||
                    approvedStatus === "Approved" ||
                    approvedStatus === "Released"
                  }
                  className="rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {submitting ? "Saving..." : "Save All Records"}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
