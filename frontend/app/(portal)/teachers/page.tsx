"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRoleGuard } from "@/app/lib/hooks/useRoleGuard";
import { apiHeaders, BASE_URL } from "@/app/lib/api";
import { fetchSubjects } from "@/app/services/results";
import { getSessions, sessionTerms } from "@/app/services/academics";
import { AcademicSession, Term } from "@/app/lib/types";

import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart2,
  ChevronRight,
  AlertCircle,
  Loader2,
  Download,
  Star,
  Activity,
  UserCheck,
  MessageSquare,
  PenLine,
} from "lucide-react";
import ExcelJS from "exceljs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {toast} from "sonner"

// ============================================================
// TYPES
// ============================================================
type ClassItem = { id: number; name: string; arm: { name: string, code: string } };
type SubjectItem = {
  id: number;
  name: string;
  subject: { name: string; id: number };
};

type TabId =
  | "dashboard"
  | "results-entry"
  | "students"
  | "behaviour"
  | "attendance"
  | "comments"
  | "view-results"
  | "register-subjects"
  | "download";

  export const saveBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

// ============================================================
// MAIN PAGE
// ============================================================
export default function TeacherDashboardPage() {
  useRoleGuard(["teacher"]);
  const { user, currentTerm } = useAuth();

  // ── Primary Navigation & Class State ────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Academic Session & Term State ───────────────────────────
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<AcademicSession | null>(currentTerm?.session || null);

  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(
    currentTerm || null,
  );

  // ── View Results Tab State ─────────────────────────────────
  const [viewResultsClass, setViewResultsClass] = useState<ClassItem | null>(
    null,
  );
  const [viewSubjects, setViewSubjects] = useState<SubjectItem[]>([]);
  const [viewSubject, setViewSubject] = useState<SubjectItem | null>(null);
  const [viewResults, setViewResults] = useState<any[]>([]);
  const [viewResultsLoading, setViewResultsLoading] = useState(false);

  // ── Fetch Initial Data (Sessions & Teacher Classes) ────────
  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        const headers = apiHeaders();

        const [sessionsRes, classesRes] = await Promise.all([
          getSessions(),
          fetch(`${BASE_URL}/academics/classes/`, { headers }).then((r) =>
            r.json(),
          ),
        ]);

        if (sessionsRes?.results) {
          setSessions(sessionsRes.results);
        }

        setMyClasses(classesRes?.results || classesRes || []);
      } catch (err: any) {
        console.error("Error loading workspace data:", err);
        setError(err?.message || "Unable to load workspace data.");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // ── Fetch Terms on Session Change ──────────────────────────
  useEffect(() => {
    if (!selectedSession?.id) {
      setTerms([]);
      return;
    }

    const loadTerms = async () => {
      const res = await sessionTerms(selectedSession.id);
      if (res?.terms) {
        setTerms(res.terms);
      }
    };

    loadTerms();
  }, [selectedSession?.id]);

  // ── Load View-Results Subjects ────────────────────────────
  useEffect(() => {
    if (!viewResultsClass || !currentTerm) return;

    const loadSubjects = async () => {
      const res = await fetchSubjects(viewResultsClass.id, currentTerm.id);
      setViewSubjects(
        res.subjects || res.results || (Array.isArray(res) ? res : []),
      );
      setViewSubject(null);
      setViewResults([]);
    };

    loadSubjects();
  }, [viewResultsClass, currentTerm]);

  // ── Load View-Results Data ────────────────────────────────
  useEffect(() => {
    if (!viewResultsClass || !viewSubject || !currentTerm) return;

    const loadResults = async () => {
      setViewResultsLoading(true);
      try {
        const headers = apiHeaders();
        const res = await fetch(
          `${BASE_URL}/results/results/subject-results/?class_id=${viewResultsClass.id}&class_subject_id=${viewSubject.id}&term=${currentTerm.id}`,
          { headers },
        );
        const data = await res.json();
        setViewResults(data.results || []);
      } catch (e) {
        console.error("Error loading subject results:", e);
      } finally {
        setViewResultsLoading(false);
      }
    };

    loadResults();
  }, [viewResultsClass, viewSubject, currentTerm]);

  // ── Download Results CSV Handler ─────────────────────────
  
const handleDownload = async (cls: ClassItem) => {
  if (!cls || !selectedTerm?.id || !selectedSession?.id) return;

  try {
    setLoading(true);
    const url = `${BASE_URL}/results/results/class-broadsheet-csv/?class_id=${cls.id}&term_id=${selectedTerm.id}&session_id=${selectedSession.id}`;
    const res = await fetch(url, { headers: apiHeaders() });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.detail || "Unable to download class result sheet.");
      return; // Stop execution if request fails
    }

    const blob = await res.blob();
    // Updated file extension to .xlsx for styled Excel files
    const label = `${cls.name}_${cls.arm?.code || "class"}_${selectedTerm?.name || "term"}_results.xlsx`;
    saveBlob(blob, label.replace(/\s+/g, "_"));
  } catch (err: any) {
    setError(err?.message || "Unable to download class result sheet.");
  } finally {
    setLoading(false);
  }
};


  const handleDownload_old = async (cls: ClassItem) => {
    if (!selectedTerm?.id || !selectedSession?.id) return;

    try {
      const headers = apiHeaders();
      const res = await fetch(
        `${BASE_URL}/results/results/?school_class=${cls.id}&term=${selectedTerm.id}&session=${selectedSession.id}`,
        { headers },
      );
      const data = await res.json();
      const results: any[] = data.results || [];

      if (!results.length) {
        alert("No results to download.");
        return;
      }

      // 1. Group data by subjects and students
      const subjectsMap = new Map<string, string>();
      const studentsMap = new Map<
        string,
        { name: string; admNo: string; records: Record<string, any> }
      >();

      results.forEach((r: any) => {
        const studentId =
          r.student?.id || r.student?.admission_number || r.student_name;
        const studentName = r.student?.user?.full_name || r.student_name || "";
        const admNo = r.student?.admission_number || "";
        const subjectName = r.class_subject?.subject?.name || "Unknown Subject";
        const subjectId = r.class_subject?.subject?.id || subjectName;

        if (!subjectsMap.has(subjectId)) {
          subjectsMap.set(subjectId, subjectName);
        }

        if (!studentsMap.has(studentId)) {
          studentsMap.set(studentId, {
            name: studentName,
            admNo,
            records: {},
          });
        }

        studentsMap.get(studentId)!.records[subjectId] = r;
      });

      const subjects = Array.from(subjectsMap.entries());

      // 2. Initialize ExcelJS Workbook & Sheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Broadsheet");

      // 3. Build Header Row 1 (Subject Headers)
      const headerRow1 = ["Student", "Admission No."];
      subjects.forEach(([_, subjectName]) => {
        headerRow1.push(subjectName, "", "", "", "");
      });
      const row1 = worksheet.addRow(headerRow1);

      // 4. Build Header Row 2 (Sub-headers)
      const headerRow2 = ["", ""];
      subjects.forEach(() => {
        headerRow2.push("1st Test", "2nd Test", "Exam", "Total", "Grade");
      });
      const row2 = worksheet.addRow(headerRow2);

      // 5. Merge Subject Header Cells across their 5 sub-columns
      // Merge "Student" & "Admission No." vertically across rows 1 and 2
      worksheet.mergeCells("A1:A2");
      worksheet.mergeCells("B1:B2");

      let colIndex = 3; // Column C
      subjects.forEach(() => {
        const startCol = colIndex;
        const endCol = colIndex + 4;
        worksheet.mergeCells(1, startCol, 1, endCol);
        colIndex += 5;
      });

      // 6. Style Header Rows (Colors, Alignment, Fonts, Borders)
      const applyHeaderStyle = (
        row: ExcelJS.Row,
        bgColor: string,
        textColor: string = "FFFFFF",
      ) => {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: bgColor },
          };
          cell.font = {
            name: "Segoe UI",
            bold: true,
            color: { argb: textColor },
            size: 11,
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = {
            top: { style: "thin", color: { argb: "CCCCCC" } },
            left: { style: "thin", color: { argb: "CCCCCC" } },
            bottom: { style: "thin", color: { argb: "CCCCCC" } },
            right: { style: "thin", color: { argb: "CCCCCC" } },
          };
        });
      };

      // Dark Blue for main subject headers, Lighter Blue for sub-headers
      applyHeaderStyle(row1, "1E3A8A"); // Navy Blue
      applyHeaderStyle(row2, "3B82F6"); // Accent Blue

      // 7. Insert Student Data Rows & Zebra Striping
      let rowCount = 3;
      studentsMap.forEach((student) => {
        const rowData = [student.name, student.admNo];

        subjects.forEach(([subjectId]) => {
          const r = student.records[subjectId];
          if (r) {
            rowData.push(
              r.first_test ?? "",
              r.second_test ?? "",
              r.exam_score ?? "",
              r.total_score ?? "",
              r.grade ?? "",
            );
          } else {
            rowData.push("", "", "", "", "");
          }
        });

        const addedRow = worksheet.addRow(rowData);

        // Apply light zebra background every alternating row
        const isEven = rowCount % 2 === 0;
        addedRow.eachCell((cell, colNumber) => {
          cell.alignment = {
            vertical: "middle",
            horizontal: colNumber <= 2 ? "left" : "center",
          };
          cell.border = {
            top: { style: "thin", color: { argb: "E5E7EB" } },
            left: { style: "thin", color: { argb: "E5E7EB" } },
            bottom: { style: "thin", color: { argb: "E5E7EB" } },
            right: { style: "thin", color: { argb: "E5E7EB" } },
          };
          if (isEven) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F9FAFB" },
            };
          }
        });

        rowCount++;
      });

      // 8. Auto-fit column widths
      worksheet.columns.forEach((column) => {
        let maxLen = 12;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const len = cell.value ? String(cell.value).length : 0;
          if (len > maxLen) maxLen = len;
        });
        column.width = Math.min(maxLen + 4, 30);
      });

      // 9. Generate & Trigger Download (.xlsx)
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results_${cls.name}_${cls.arm?.name || ""}_term${selectedTerm.id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error generating Excel download:", e);
      alert("Failed to download results. Please try again.");
    }
  };


  // ── Navigation Metadata ────────────────────────────────────
  const menuItems: { id: TabId; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "results-entry", label: "Enter Results" },
    { id: "students", label: "My Students" },
    { id: "register-subjects", label: "Class Subjects" },
    { id: "behaviour", label: "Behaviour" },
    { id: "attendance", label: "Attendance" },
    { id: "comments", label: "Term Comments" },
    { id: "view-results", label: "View Results" },
    { id: "download", label: "Download Results" },
  ];

  // ── Loading Guard ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-slate-600">
            Loading teacher workspace...
          </p>
        </div>
      </div>
    );
  }

  // ── Reusable Selector Component ────────────────────────────
  const ClassSelector = ({
    value,
    onChange,
    label,
  }: {
    value: ClassItem | null;
    onChange: (c: ClassItem) => void;
    label?: string;
  }) => (
    <div className="bg-white p-5 rounded-3xl shadow-sm border-0">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
        {label || "Select Class"}
      </h3>
      <div className="flex flex-wrap gap-2">
        {myClasses.map((cls) => (
          <button
            key={cls.id}
            onClick={() => onChange(cls)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              value?.id === cls.id
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cls.name} {cls.arm?.name}
          </button>
        ))}
      </div>
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50/40 flex flex-col md:flex-row relative w-full">
      <main className="flex-1 p-5 md:p-9 w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-7">
          {/* PAGE HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                Teacher Workspace
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
                {menuItems.find((m) => m.id === activeTab)?.label ||
                  "Dashboard"}
              </h1>
            </div>
            {!currentTerm && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 font-semibold rounded-2xl text-xs">
                <AlertCircle size={14} />
                <span>No active term configured</span>
              </div>
            )}
          </div>

          {/* ║ 1. DASHBOARD TAB ║ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* WELCOME BANNER */}
              <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-7 text-white shadow-xl shadow-emerald-600/15">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white blur-3xl -translate-y-1/3 translate-x-1/3" />
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold mb-4">
                    <UserCheck size={12} />
                    <span>Logged in as Teacher</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    Welcome back, {user?.first_name}!
                  </h2>
                  <p className="text-white/75 text-sm mt-2 max-w-xl leading-relaxed">
                    Manage your class results, assess student behaviour, track
                    attendance, and write term feedback — all from one place.
                  </p>
                </div>
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <Card className="border-0 shadow-sm bg-white rounded-3xl hover:scale-[1.01] transition-transform duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-5 px-5 space-y-0">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Assigned Classes
                    </CardTitle>
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="text-3xl font-black text-slate-800">
                      {myClasses.length}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      This academic session
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white rounded-3xl hover:scale-[1.01] transition-transform duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-5 px-5 space-y-0">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Active Term
                    </CardTitle>
                    <ClipboardList className="w-4 h-4 text-teal-500" />
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="text-lg font-black text-slate-800">
                      {currentTerm?.name || "N/A"}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {currentTerm?.session?.name || "—"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white rounded-3xl hover:scale-[1.01] transition-transform duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-5 px-5 space-y-0">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Result Entry
                    </CardTitle>
                    <PenLine className="w-4 h-4 text-blue-500" />
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <Link
                      href="/teachers/results-entry"
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:underline"
                    >
                      Enter scores <ChevronRight size={14} />
                    </Link>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      For current term
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white rounded-3xl hover:scale-[1.01] transition-transform duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-1 pt-5 px-5 space-y-0">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Download
                    </CardTitle>
                    <Download className="w-4 h-4 text-indigo-500" />
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <button
                      onClick={() => setActiveTab("download")}
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:underline"
                    >
                      Get CSV <ChevronRight size={14} />
                    </button>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Export results
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* QUICK ACTIONS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="border-0 shadow-sm bg-white rounded-3xl p-6">
                  <CardTitle className="text-base font-bold text-slate-800 mb-4">
                    My Classes
                  </CardTitle>
                  {myClasses.length === 0 ? (
                    <div className="text-sm text-slate-400 py-6 text-center bg-slate-50 rounded-2xl">
                      No classes assigned
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myClasses.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                              {cls.name[0]}
                            </div>
                            <span className="font-bold text-sm text-slate-700">
                              {cls.name} {cls.arm?.name}
                            </span>
                          </div>
                          <Link
                            href="/teachers/results-entry"
                            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            Enter Results <ChevronRight size={12} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="border-0 shadow-sm bg-white rounded-3xl p-6">
                  <CardTitle className="text-base font-bold text-slate-800 mb-4">
                    Quick Actions
                  </CardTitle>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Enter Results",
                        tab: "results-entry" as TabId,
                        icon: <PenLine size={16} />,
                        color: "emerald",
                        href: "/teachers/results-entry",
                      },
                      {
                        label: "Behaviour",
                        tab: "behaviour" as TabId,
                        icon: <Star size={16} />,
                        color: "amber",
                        href: "/teachers/behaviour",
                      },
                      {
                        label: "Attendance",
                        tab: "attendance" as TabId,
                        icon: <Activity size={16} />,
                        color: "blue",
                        href: "/teachers/attendance",
                      },
                      {
                        label: "Term Comments",
                        tab: "comments" as TabId,
                        icon: <MessageSquare size={16} />,
                        color: "purple",
                        href: "/teachers/comments",
                      },
                    ].map(({ label, tab, icon, color, href }) => (
                      <Link
                        href={href}
                        key={tab}
                        className={`flex flex-col items-start gap-2 p-4 rounded-2xl bg-${color}-50 text-${color}-700 hover:bg-${color}-100 transition text-sm font-bold`}
                      >
                        {icon}
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ║ 2. VIEW RESULTS TAB ║ */}
          {activeTab === "view-results" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ClassSelector
                value={viewResultsClass}
                onChange={(cls) => setViewResultsClass(cls)}
                label="Step 1 — Select Class"
              />

              {viewResultsClass && viewSubjects.length > 0 && (
                <div className="bg-white p-5 rounded-3xl shadow-sm border-0">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Step 2 — Select Subject
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {viewSubjects.map((subj) => (
                      <button
                        key={subj.id}
                        onClick={() => setViewSubject(subj)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          viewSubject?.id === subj.id
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {subj.subject?.name || subj.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {viewResultsClass &&
                viewSubject &&
                (viewResultsLoading ? (
                  <div className="flex py-16 items-center justify-center bg-white rounded-3xl">
                    <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                  </div>
                ) : (
                  <Card className="border-0 shadow-sm rounded-3xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                      <CardTitle className="text-base font-bold text-slate-800">
                        Results —{" "}
                        {viewSubject.subject?.name || viewSubject.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {viewResults.length} student record(s)
                      </CardDescription>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-4">Student</th>
                            <th className="px-5 py-4 text-center">1st Test</th>
                            <th className="px-5 py-4 text-center">2nd Test</th>
                            <th className="px-5 py-4 text-center">Exam</th>
                            <th className="px-5 py-4 text-center">Total</th>
                            <th className="px-5 py-4 text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {viewResults.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-12 text-center text-slate-400 text-sm"
                              >
                                No results entered yet for this subject.
                              </td>
                            </tr>
                          ) : (
                            viewResults.map((r: any) => (
                              <tr
                                key={r.result_id || r.id}
                                className="hover:bg-slate-50/50 transition"
                              >
                                <td className="px-5 py-4 font-semibold text-slate-800">
                                  {r.student_name}
                                </td>
                                <td className="px-5 py-4 text-center font-medium">
                                  {r.first_test ?? "—"}
                                </td>
                                <td className="px-5 py-4 text-center font-medium">
                                  {r.second_test ?? "—"}
                                </td>
                                <td className="px-5 py-4 text-center font-medium">
                                  {r.exam_score ?? "—"}
                                </td>
                                <td className="px-5 py-4 text-center font-extrabold text-blue-600">
                                  {r.total_score ?? "—"}
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${
                                      r.grade === "A" || r.grade === "B"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : r.grade === "C" || r.grade === "D"
                                          ? "bg-blue-50 text-blue-700"
                                          : "bg-rose-50 text-rose-700"
                                    }`}
                                  >
                                    {r.grade || "—"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ))}

              {!viewResultsClass && (
                <div className="text-center py-14 bg-white rounded-3xl shadow-sm text-slate-400 text-sm font-medium">
                  Select a class and subject to view results.
                </div>
              )}
            </div>
          )}

          {/* ║ 3. DOWNLOAD TAB ║ */}
          {activeTab === "download" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center">
                    <Download size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800">
                      Download Results
                    </h3>
                    <p className="text-xs text-slate-500">
                      Export class results as a CSV file
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="m-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  <p>{error}</p>
                </div>
              )}

              {/* Select Session & Term */}
              <div className="grid grid-cols-1 gap-6 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm md:grid-cols-2 md:p-6 lg:p-8">
                {/* Session */}
                <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                    Session
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Select a Session
                  </h2>

                  {sessions.length > 0 ? (
                    <select
                      value={selectedSession?.id || ""}
                      onChange={(e) => {
                        const s = sessions.find(
                          (item) => item.id === Number(e.target.value),
                        );
                        setSelectedSession(s || null);
                        setSelectedTerm(null);
                      }}
                      className="mt-4 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select a Session</option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.is_active ? "(Active)" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      No sessions available
                    </p>
                  )}

                  <p className="mt-4 text-sm text-slate-500">
                    {selectedSession
                      ? `${selectedSession.name} / ${selectedTerm?.name ?? "No term selected"}`
                      : "Waiting for active session"}
                  </p>
                </div>

                {/* Term */}
                <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                    Term
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Select a Term
                  </h2>

                  {terms.length > 0 ? (
                    <select
                      value={selectedTerm?.id || ""}
                      onChange={(e) => {
                        const t = terms.find(
                          (item) => item.id === Number(e.target.value),
                        );
                        setSelectedTerm(t || null);
                      }}
                      className="mt-4 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select a Term</option>
                      {terms.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.is_active ? "(Active)" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      No terms available
                    </p>
                  )}

                  <p className="mt-4 text-sm text-slate-500">
                    {selectedTerm
                      ? `${selectedTerm.name} - ${selectedSession?.name ?? ""}`
                      : "No term selected"}
                  </p>
                </div>
              </div>

              {myClasses.length === 0 ? (
                <div className="text-center py-14 bg-white rounded-3xl shadow-sm text-slate-400 text-sm font-medium">
                  No classes assigned to you.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myClasses.map((cls) => (
                    <Card
                      key={cls.id}
                      className="border-0 shadow-sm rounded-3xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-black">
                          {cls.name[0]}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">
                            {cls.name} {cls.arm?.name}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {selectedTerm
                              ? `${selectedTerm.name} — ${selectedSession?.name}`
                              : "No active term"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(cls)}
                        disabled={!selectedTerm}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl transition text-sm shadow-sm"
                      >
                        <Download size={15} />
                        <span>Download CSV</span>
                      </button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
