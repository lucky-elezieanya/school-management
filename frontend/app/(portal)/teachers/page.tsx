"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRoleGuard } from "@/app/lib/hooks/useRoleGuard";
import { logout } from "@/app/lib/auth";
import { apiHeaders, BASE_URL } from "@/app/lib/api";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  BarChart2,
  Bell,
  LogOut,
  Menu,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  FileText,
  Star,
  Activity,
  UserCheck,
  MessageSquare,
  PenLine,
  ShieldAlert,
  Save,
  X,
  ChevronDown,
  RefreshCw,
  BookPlus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import ResultEntryTable from "@/app/components/sections/ResultsEntryTable";
import {
  fetchSubjects,
  fetchStudents,
  getWorkFlowApprovedStatus,
} from "@/app/services/results";
import CommentsBox from "@/app/components/sections/teachers/CommentsBox";
import BulkAttendanceComponent from "@/app/components/sections/AttendanceComponent";
import BehaviourComponent from "@/app/components/sections/BehaviourComponent";
import Link from "next/link";

// ============================================================
// TYPES
// ============================================================
type ClassItem = { id: number; name: string; arm: { name: string } };
type SubjectItem = {
  id: number;
  name: string;
  subject: { name: string; id: number };
};
type StudentItem = {
  id: number;
  user: { full_name: string; profile_picture?: string };
  admission_number: string;
  behaviour_exists?: boolean;
  behaviour_id?: number | null;
  is_active?: boolean;
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
// ============================================================
// MAIN PAGE
// ============================================================
export default function TeacherDashboardPage() {
  useRoleGuard(["teacher"]);
  const { user, currentTerm } = useAuth();
  const router = useRouter();

  // ── States ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [teacherData, setTeacherData] = useState<any>(null);
  const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  // results entry
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(
    null,
  );
  const [approvedStatus, setApprovedStatus] = useState<string>("");
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  // students tab
  const [classStudents, setClassStudents] = useState<StudentItem[]>([]);
  const [studentsClass, setStudentsClass] = useState<ClassItem | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  // view results tab
  const [viewResultsClass, setViewResultsClass] = useState<ClassItem | null>(
    null,
  );
  const [viewResults, setViewResults] = useState<any[]>([]);
  const [viewResultsLoading, setViewResultsLoading] = useState(false);
  const [viewSubject, setViewSubject] = useState<SubjectItem | null>(null);
  const [viewSubjects, setViewSubjects] = useState<SubjectItem[]>([]);

  // ── Load initial data ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setLoading(true);
        const headers = apiHeaders();
        const [teacherRes, classesRes] = await Promise.all([
          fetch(`${BASE_URL}/academics/teachers/`, { headers }),
          fetch(`${BASE_URL}/academics/classes/`, { headers }),
        ]);

        const teacherJson = await teacherRes.json();
        const classesJson = await classesRes.json();
        setTeacherData(teacherJson.results?.[0] || null);
        // Filter classes to only teacher's assigned class(es)
        const allClasses: ClassItem[] = classesJson.results || [];
        const teacherProfile = teacherJson.results?.[0];

        if (teacherProfile) {
          // The backend already filters by class_teacher for teacher role
          setMyClasses(allClasses);
        }
      } catch (e) {
        console.error("Error loading teacher dashboard:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // ── Load subjects when class & term selected ──────────────
  useEffect(() => {
    if (!selectedClass || !currentTerm) return;
    const load = async () => {
      setSubjectsLoading(true);

      try {
        const res = await fetchSubjects(selectedClass.id, currentTerm.id);
        setSubjects(
          res.subjects || res.results || (Array.isArray(res) ? res : []),
        );
        setSelectedSubject(null);
      } catch (e) {
        console.error(e);
      } finally {
        setSubjectsLoading(false);
      }
    };
    load();
  }, [selectedClass, currentTerm]);

  // ── Load workflow status ──────────────────────────────────
  useEffect(() => {
    if (!selectedClass || !selectedSubject || !currentTerm) return;
    const load = async () => {
      try {
        const res = await getWorkFlowApprovedStatus(
          selectedClass.id,
          currentTerm.id,
          currentTerm.session.id,
        );
        setApprovedStatus(res.results?.[0]?.status || "");
      } catch (e) {
        setApprovedStatus("");
      }
    };
    load();
  }, [selectedClass, selectedSubject, currentTerm]);

  // ── Fetch students for a tab ───────────────────────────────
  const loadStudentsForClass = useCallback(
    async (
      cls: ClassItem,
      setter: (s: StudentItem[]) => void,
      setLoading: (v: boolean) => void,
    ) => {
      setLoading(true);
      try {
        const res = await fetchStudents(cls.id);
        setter(
          (res.students || []).filter(
            (s: any) =>
              s.is_active !== false &&
              s.current_enrollment?.is_current !== false,
          ),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // ── Load students (Students tab) ──────────────────────────
  useEffect(() => {
    if (!studentsClass) return;
    loadStudentsForClass(studentsClass, setClassStudents, setStudentsLoading);
  }, [studentsClass]);

  // ── Load view-results subjects ─────────────────────────────
  useEffect(() => {
    if (!viewResultsClass || !currentTerm) return;
    const load = async () => {
      const res = await fetchSubjects(viewResultsClass.id, currentTerm.id);
      setViewSubjects(
        res.subjects || res.results || (Array.isArray(res) ? res : []),
      );
      setViewSubject(null);
      setViewResults([]);
    };
    load();
  }, [viewResultsClass, currentTerm]);

  // ── Load view-results ─────────────────────────────────────
  useEffect(() => {
    if (!viewResultsClass || !viewSubject || !currentTerm) return;
    const load = async () => {
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
        console.error(e);
      } finally {
        setViewResultsLoading(false);
      }
    };
    load();
  }, [viewResultsClass, viewSubject, currentTerm]);

  // ── Handlers ───────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // ── Download results ──────────────────────────────────────
  const handleDownload = async (cls: ClassItem) => {
    if (!currentTerm) return;
    const headers = apiHeaders();
    const res = await fetch(
      `${BASE_URL}/results/results/?school_class=${cls.id}&term=${currentTerm.id}&session=${currentTerm.session.id}`,
      { headers },
    );
    const data = await res.json();
    const results = data.results || [];
    if (!results.length) {
      alert("No results to download.");
      return;
    }
    const rows = [
      [
        "Student",
        "Admission No.",
        "Subject",
        "1st Test",
        "2nd Test",
        "Exam",
        "Total",
        "Grade",
        "Remark",
      ].join(","),
    ];
    results.forEach((r: any) => {
      rows.push(
        [
          `"${r.student?.user?.full_name || r.student_name || ""}"`,
          r.student?.admission_number || "",
          `"${r.class_subject?.subject?.name || ""}"`,
          r.first_test,
          r.second_test,
          r.exam_score,
          r.total_score,
          r.grade,
          r.remark,
        ].join(","),
      );
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results_${cls.name}_${cls.arm?.name}_term${currentTerm.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  // ── Nav items ─────────────────────────────────────────────
  const menuItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: "results-entry",
      label: "Enter Results",
      icon: <PenLine size={18} />,
    },
    { id: "students", label: "My Students", icon: <Users size={18} /> },
    {
      id: "register-subjects",
      label: "Class Subjects",
      icon: <BookPlus size={18} />,
    },
    { id: "behaviour", label: "Behaviour", icon: <Star size={18} /> },
    { id: "attendance", label: "Attendance", icon: <Activity size={18} /> },
    {
      id: "comments",
      label: "Term Comments",
      icon: <MessageSquare size={18} />,
    },
    {
      id: "view-results",
      label: "View Results",
      icon: <BarChart2 size={18} />,
    },
    { id: "download", label: "Download Results", icon: <Download size={18} /> },
  ];
  // ── Guards ────────────────────────────────────────────────
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
  // ── Shared class selector UI helper ───────────────────────
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
      {/* ── MOBILE HEADER ── */}

      {/* ── MAIN CONTENT ── */}
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

          {/* ║  1. DASHBOARD TAB                ║ */}

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
                      href={"/teachers/results-entry"}
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
                            href={"/teachers/results-entry"}
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

          {/* ║  7. VIEW RESULTS TAB             ║ */}
          {activeTab === "view-results" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ClassSelector
                value={viewResultsClass}
                onChange={(cls) => {
                  setViewResultsClass(cls);
                  setViewSubject(null);
                  setViewResults([]);
                }}
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

          {/* ║  8. DOWNLOAD TAB                 ║ */}

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
                            {currentTerm
                              ? `${currentTerm.name} — ${currentTerm.session?.name}`
                              : "No active term"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(cls)}
                        disabled={!currentTerm}
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
