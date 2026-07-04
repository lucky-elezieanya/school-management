"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRoleGuard } from "@/app/lib/hooks/useRoleGuard";
import { logout } from "@/app/lib/auth";
import { apiHeaders, BASE_URL } from "@/app/lib/api";
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Banknote,
  LogOut,
  Menu,
  BookOpen,
  Award,
  Calendar,
  Download,
  UserCheck,
  FileText,
  Clock,
  Clipboard,
  ShieldAlert,
  Loader2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  Info,
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrdinal } from "@/app/services/results";
import { AcademicSession, TermSession } from "@/app/lib/types";

export default function StudentDashboardPage() {
  useRoleGuard(["student"]);
  const { user } = useAuth();
  const router = useRouter();

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "results" | "profile" | "fees"
  >("dashboard");

  // Profile data
  const [studentData, setStudentData] = useState<any>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<TermSession[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Selected filters for results & fees
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");

  // Results & performance metrics state
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [behaviour, setBehaviour] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [comment, setComment] = useState<any>(null);
  const [schoolDays, setSchoolDays] = useState<any>(null);
  const [classFee, setClassFee] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Gating & loading states
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsReleased, setResultsReleased] = useState(false);
  

  // Fetch initial profile, sessions, and terms
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const headers = apiHeaders();

        // 1. Fetch Student Profile (filters to current student based on user relation)
        const studentRes = await fetch(`${BASE_URL}/academics/students/`, {
          headers,
        });
        const studentJson = await studentRes.json();

        if (studentJson.results && studentJson.results.length > 0) {
          const studentProfile = studentJson.results[0];
          setStudentData(studentProfile);

          // Set default selected session from current enrollment
          if (studentProfile.current_enrollment) {
            setSelectedSession(
              studentProfile.current_enrollment.session.id.toString(),
            );
          }
        }

        // 2. Fetch Sessions list
        const sessionsRes = await fetch(`${BASE_URL}/academics/sessions/`, {
          headers,
        });
        const sessionsJson = await sessionsRes.json();
        setSessions(sessionsJson.results || []);

        // 3. Fetch Terms list
        const termsRes = await fetch(`${BASE_URL}/academics/terms/`, {
          headers,
        });
        const termsJson = await termsRes.json();
        const termList = termsJson.results || [];
        setTerms(termList);

        // Find active term and set as default selected term
        const activeTerm = termList.find((t: any) => t.is_active);
        if (activeTerm) {
          setSelectedTerm(activeTerm.id.toString());
        } else if (termList.length > 0) {
          setSelectedTerm(termList[0].id.toString());
        }
      } catch (err) {
        console.error("Error fetching initial student dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleDownloadPdf = async () => {
    if (!pdfUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(pdfUrl, {
        headers: apiHeaders(), 
      });
      if (!response.ok) throw new Error("Failed to fetch file from server");
      const blob = await response.blob();
      const localUrl = window.URL.createObjectURL(blob);
      // Create a temporary hidden link element to force download
      const link = document.createElement("a");
      link.href = localUrl;
      link.setAttribute(
        "download",
        `Report_Sheet_${studentData?.id || "Student"}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      setIsDownloading(false)
      // Clean up memory and DOM
      link.remove();
      window.URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error("Secure download failed:", error);
      alert("Could not download the PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Fetch results and academic metrics when active session/term or studentData changes
  useEffect(() => {
    if (!studentData || !selectedSession || !selectedTerm) return;

    const fetchAcademicData = async () => {
      setResultsLoading(true);
      const headers = apiHeaders();

      const queryParams = `?student=${studentData.id}&term=${selectedTerm}&session=${selectedSession}`;

      try {
        // Fetch Subject Results, Summary, Comments, Behaviour, Attendance, School Days, Fees, and PDF
        const [
          resultsRes,
          summaryRes,
          behaviourRes,
          attendanceRes,
          commentRes,
          schoolDaysRes,
          feesRes,
          pdfRes,
        ] = await Promise.all([
          fetch(`${BASE_URL}/results/results/${queryParams}`, { headers }),
          fetch(`${BASE_URL}/results/result-summaries/${queryParams}`, {
            headers,
          }),
          fetch(`${BASE_URL}/results/behaviour/${queryParams}`, { headers }),
          fetch(`${BASE_URL}/results/attendance/${queryParams}`, { headers }),
          fetch(`${BASE_URL}/results/term-comments/${queryParams}`, {
            headers,
          }),
          fetch(
            `${BASE_URL}/results/school-days/?term=${selectedTerm}&session=${selectedSession}`,
            { headers },
          ),
          fetch(
            `${BASE_URL}/results/classfees/?term=${selectedTerm}&session=${selectedSession}`,
            { headers },
          ),
          fetch(
            `${BASE_URL}/results/result-pdfs/my-pdf/?term_id=${selectedTerm}&session_id=${selectedSession}`,
            { headers },
          ),
        ]);

        const resultsJson = await resultsRes.json();
        const summaryJson = await summaryRes.json();
        const behaviourJson = await behaviourRes.json();
        const attendanceJson = await attendanceRes.json();
        const commentJson = await commentRes.json();
        const schoolDaysJson = await schoolDaysRes.json();
        const feesJson = await feesRes.json();

        // 1. Set Results Details
        const fetchedResults = resultsJson.results || [];
        setResults(fetchedResults);

        // 2. Set Summary Details
        const fetchedSummary =
          summaryJson.results && summaryJson.results.length > 0
            ? summaryJson.results[0]
            : null;
        setSummary(fetchedSummary);

        // 3. Set Release Gating (we query empty sets if results are draft / unreleased)
        const isReleased = fetchedResults.length > 0 || fetchedSummary !== null;
        setResultsReleased(isReleased);

        // 4. Set other performance details (only populated fully if released)
        setBehaviour(
          behaviourJson.results && behaviourJson.results.length > 0
            ? behaviourJson.results[0]
            : null,
        );
        setAttendance(
          attendanceJson.results && attendanceJson.results.length > 0
            ? attendanceJson.results[0]
            : null,
        );
        setComment(
          commentJson.results && commentJson.results.length > 0
            ? commentJson.results[0]
            : null,
        );
        setSchoolDays(
          schoolDaysJson.results && schoolDaysJson.results.length > 0
            ? schoolDaysJson.results[0]
            : null,
        );
        setClassFee(
          feesJson.results && feesJson.results.length > 0
            ? feesJson.results[0]
            : null,
        );

        // 5. Handle PDF report response
        if (pdfRes.ok) {
          const pdfJson = await pdfRes.json();
          const cleanUrl = BASE_URL.replace(/\/api$/, "");
          const link = `${cleanUrl}${pdfJson.pdf_url}`;
          setPdfUrl(link);
        } else {
          setPdfUrl(null);
        }
      } catch (err) {
        console.error("Error loading student academic records:", err);
        setResultsReleased(false);
      } finally {
        setResultsLoading(false);
      }
    };

    fetchAcademicData();
  }, [studentData, selectedSession, selectedTerm]);

  // Handle Logout action
  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // Suffix formatting helper for position
  const formatPosition = (pos: number) => {
    return getOrdinal(pos);
  };

  // Nav menu items definition
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: "results",
      label: "Academic Results",
      icon: <GraduationCap size={20} />,
    },
    { id: "profile", label: "My Profile", icon: <User size={20} /> },
    { id: "fees", label: "Class Fees", icon: <Banknote size={20} /> },
  ];

  // Loading animation indicator
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-600">
            Loading student workspace...
          </p>
        </div>
      </div>
    );
  }

  // Handle default fallback in case no profile was loaded
  if (!studentData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center p-6 bg-white rounded-xl shadow border max-w-md mx-auto">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800">
            Student Profile Not Found
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            We couldn't retrieve your student profile credentials. Please
            contact the administrator.
          </p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const currentClass = studentData.current_enrollment?.school_class;
  const activeSessionName = studentData.current_enrollment?.session?.name;
  const currentClassTeacherName =
    currentClass?.class_teacher?.user?.full_name || "Unassigned";

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col md:flex-row relative">
      {/* MOBILE HEADER & NAVIGATION */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40 w-full shadow-sm">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-blue-600 w-7 h-7" />
          <span className="font-extrabold text-slate-800 tracking-tight">
            Cozzi Student
          </span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <button className="bg-slate-100 p-2 rounded-xl text-slate-700 hover:bg-slate-200 transition">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] p-0">
            <SheetTitle className="sr-only">
              Student Dashboard Portal
            </SheetTitle>
            <div className="h-full flex flex-col justify-between bg-white p-6">
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <GraduationCap className="text-blue-600 w-8 h-8" />
                  <span className="font-black text-slate-800 text-xl tracking-tight">
                    Cozzi Portal
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl mb-6">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {studentData.user?.full_name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {studentData.admission_number}
                  </p>
                  {currentClass && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-md">
                      {currentClass.name} {currentClass.arm?.name}
                    </div>
                  )}
                </div>

                <nav className="space-y-1.5">
                  {menuItems.map((item) => (
                    <SheetClose asChild key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id as any)}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                          activeTab === item.id
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    </SheetClose>
                  ))}
                </nav>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-red-100 text-red-600 hover:bg-red-50/50 transition font-semibold text-sm"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="w-80 bg-white border-r border-slate-100 hidden md:flex flex-col h-screen sticky top-0 justify-between shrink-0 shadow-sm p-8">
        <div>
          <div className="flex items-center gap-2.5 mb-10">
            <GraduationCap className="text-blue-600 w-8 h-8" />
            <span className="font-black text-slate-800 text-2xl tracking-tight">
              Cozzi Student
            </span>
          </div>

          <div className="bg-slate-50/75 border border-slate-100 p-5 rounded-2xl mb-8 flex flex-col items-center text-center">
            {studentData.user?.profile_picture ? (
              <img
                src={studentData.user.profile_picture}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md mb-3"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-extrabold text-xl mb-3 shadow-sm">
                {studentData.user?.first_name?.[0]}
                {studentData.user?.last_name?.[0]}
              </div>
            )}
            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">
              {studentData.user?.full_name}
            </h4>
            <span className="text-xs font-semibold text-slate-400 mt-0.5">
              {studentData.admission_number}
            </span>
            {currentClass && (
              <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-blue-600/10 text-blue-700 rounded-full">
                {currentClass.name} {currentClass.arm?.name}
              </span>
            )}
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3.5 px-4.5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15 scale-[1.02]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-red-50 text-red-500 hover:bg-red-50/50 hover:border-red-100 transition-all font-bold text-sm shrink-0"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* MAIN CONTENT SPACE */}
      <main className="flex-1 p-6 md:p-10 w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                Portal Workspace
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight capitalize mt-1">
                {activeTab} Overview
              </h1>
            </div>

            {activeSessionName && (
              <div className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white border border-slate-100 shadow-sm text-slate-700 font-bold rounded-2xl text-xs md:text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Active Year: {activeSessionName}</span>
              </div>
            )}
          </div>

          {/* TAB CONTENTS */}

          {/* 1. DASHBOARD OVERVIEW TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* WELCOME BANNER CARD */}
              <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-600/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="relative z-10 space-y-4 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Logged in as Student</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    Welcome back, {studentData.user?.first_name}!
                  </h2>
                  <p className="text-white/80 text-sm md:text-base font-medium leading-relaxed">
                    Check your grades, download performance sheets, track
                    current term attendance records, and coordinate fee
                    compliance effortlessly.
                  </p>
                </div>
              </div>

              {/* DASHBOARD STATISTICS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:scale-[1.01] transition-transform duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Assigned Class
                    </CardTitle>
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="text-2xl font-black text-slate-800">
                      {currentClass
                        ? `${currentClass.name} ${currentClass.arm?.name}`
                        : "Not Enrolled"}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Class arm: {currentClass?.arm?.code || "N/A"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:scale-[1.01] transition-transform duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Class Teacher
                    </CardTitle>
                    <UserCheck className="w-5 h-5 text-indigo-500" />
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="text-lg font-extrabold text-slate-800 line-clamp-1">
                      {currentClassTeacherName}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1.5">
                      Assigned Teacher
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:scale-[1.01] transition-transform duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Term Results Status
                    </CardTitle>
                    <Award className="w-5 h-5 text-emerald-500" />
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    {resultsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : resultsReleased ? (
                      <div className="inline-flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span>Released</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-amber-600 font-bold text-sm bg-amber-50 px-2.5 py-1 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        <span>Not Released</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 font-medium mt-2">
                      Active selected term results
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden hover:scale-[1.01] transition-transform duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-6">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Attendance Rate
                    </CardTitle>
                    <Clock className="w-5 h-5 text-teal-500" />
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <div className="text-2xl font-black text-slate-800">
                      {attendance &&
                      schoolDays &&
                      schoolDays.days_school_opened > 0
                        ? `${((attendance.attendance / schoolDays.days_school_opened) * 100).toFixed(0)}%`
                        : "N/A"}
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      {attendance && schoolDays
                        ? `${attendance.attendance} / ${schoolDays.days_school_opened} school days`
                        : "No session active"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* QUICK NAV BLOCKS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SHORT PROFILE CARD */}
                <Card className="border-0 shadow-sm bg-white rounded-3xl p-6 space-y-4 lg:col-span-2">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base font-bold text-slate-800">
                      Academic Placement
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Your current enrollment credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Admission Number
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {studentData.admission_number}
                      </p>
                    </div>
                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Admission Date
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {studentData.date_admitted
                          ? new Date(
                              studentData.date_admitted,
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Current Class Arm
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {currentClass
                          ? `${currentClass.name} - ${currentClass.arm?.name}`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Current Academic Session
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {activeSessionName || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* HELP CARD */}
                <Card className="border-0 shadow-sm bg-white rounded-3xl p-6 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Info size={20} />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-800 mt-2">
                      Need Assistance?
                    </CardTitle>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      If you notice discrepancies in your profile biodata,
                      grades history, attendance inputs, or fees billing
                      records, please contact your class teacher or the portal
                      administrator.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 mt-4">
                    <a
                      href={`mailto:${currentClass?.class_teacher?.user?.email || "admin@school.com"}`}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                    >
                      <Mail size={13} />
                      <span>Email class teacher</span>
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 2. ACADEMIC RESULTS TAB */}
          {activeTab === "results" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* FILTERS PANEL */}
              <div className="bg-white p-6 rounded-3xl border-0 shadow-sm flex flex-col sm:flex-row items-end gap-4">
                <div className="w-full sm:w-1/2 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Academic Session
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-100 hover:border-slate-200 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-2xl text-slate-800 text-sm font-semibold transition"
                  >
                    <option value="" disabled>
                      Choose Year
                    </option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.is_active && "(Active)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-1/2 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Term
                  </label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-100 hover:border-slate-200 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-2xl text-slate-800 text-sm font-semibold transition"
                  >
                    <option value="" disabled>
                      Choose Term
                    </option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.session.name} {t.is_active && "(Active)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RESULTS AREA */}
              {resultsLoading ? (
                <div className="flex py-20 items-center justify-center bg-white rounded-3xl shadow-sm border-0">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm font-semibold text-slate-600">
                      Retrieving academic sheet details...
                    </p>
                  </div>
                </div>
              ) : resultsReleased ? (
                <div className="space-y-6">
                  {/* SUMMARY CARDS GRID */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Total Score
                      </span>
                      <p className="text-xl font-black text-slate-800 mt-2">
                        {summary?.total_score || "N/A"}
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        GPA Average
                      </span>
                      <p className="text-xl font-black text-slate-800 mt-2">
                        {summary?.average_score || "N/A"}
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Class Average
                      </span>
                      <p className="text-xl font-black text-slate-800 mt-2">
                        {summary?.class_average || "N/A"}
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Class Position
                      </span>
                      <p className="text-xl font-black text-indigo-600 mt-2">
                        {summary?.position
                          ? formatPosition(summary.position)
                          : "N/A"}
                      </p>
                    </div>

                    <div className="col-span-2 md:col-span-1 bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-semibold">
                        Total Subjects
                      </span>
                      <p className="text-xl font-black text-slate-800 mt-2">
                        {summary?.total_subjects || results.length}
                      </p>
                    </div>
                  </div>

                  {/* PDF DOWNLOAD BAR */}
                  <div className="bg-white px-6 py-4.5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-50 bg-gradient-to-r from-blue-50/20 to-indigo-50/25">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="text-center sm:text-left">
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          Download PDF Report Sheet
                        </h4>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Generate a print-ready version of this term results
                        </p>
                      </div>
                    </div>

                    {pdfUrl ? (
                      <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        <Download size={14} />
                        <span>View / Download PDF</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                      >
                        <Clock size={14} />
                        <span>Report Sheet Generating...</span>
                      </button>
                    )}
                  </div>

                  {/* DETAILED GRADES TABLE */}
                  <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-800">
                          Subject Breakdown
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Detailed summary scores per subject
                        </CardDescription>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">Subject</th>
                            <th className="px-6 py-4 text-center">
                              First Test
                            </th>
                            <th className="px-6 py-4 text-center">
                              Second Test
                            </th>
                            <th className="px-6 py-4 text-center">
                              Exam Score
                            </th>
                            <th className="px-6 py-4 text-center">
                              Total Score
                            </th>
                            <th className="px-6 py-4 text-center">Grade</th>
                            <th className="px-6 py-4">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {results.map((res) => (
                            <tr
                              key={res.id}
                              className="hover:bg-slate-50/50 text-slate-700 transition"
                            >
                              <td className="px-6 py-4 font-bold text-slate-800">
                                {res.class_subject?.subject?.name || "Subject"}
                              </td>
                              <td className="px-6 py-4 text-center font-medium">
                                {res.first_test}
                              </td>
                              <td className="px-6 py-4 text-center font-medium">
                                {res.second_test}
                              </td>
                              <td className="px-6 py-4 text-center font-medium">
                                {res.exam_score}
                              </td>
                              <td className="px-6 py-4 text-center font-extrabold text-blue-600 bg-blue-50/20">
                                {res.total_score}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span
                                  className={`inline-flex items-center justify-center font-black w-7.5 h-7.5 rounded-lg text-xs 
                                  ${
                                    res.grade === "A" || res.grade === "B"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : res.grade === "C" || res.grade === "D"
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {res.grade}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                {res.remark}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* COGNITIVE & BEHAVIOURAL ASSESSMENTS GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* BEHAVIOURAL TRAITS */}
                    <Card className="border-0 shadow-sm bg-white rounded-3xl p-6 space-y-4">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-800">
                          Behavioural Assessment
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Evaluation of traits & behaviors for the term
                        </CardDescription>
                      </div>

                      {behaviour ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            {
                              label: "Skills & Manual Talents",
                              value: behaviour.skills,
                            },
                            {
                              label: "Politeness & Civility",
                              value: behaviour.politeness,
                            },
                            {
                              label: "Neatness & Care",
                              value: behaviour.neatness,
                            },
                            {
                              label: "Self Control & Temperament",
                              value: behaviour.self_control,
                            },
                            {
                              label: "Relationship with Peers",
                              value: behaviour.relationship,
                            },
                            {
                              label: "Class Attendance Record",
                              value: behaviour.attendance,
                            },
                            {
                              label: "Punctuality & Arrival",
                              value: behaviour.punctuality,
                            },
                            {
                              label: "Leadership & Initiative",
                              value: behaviour.leadership,
                            },
                          ].map((trait, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between border border-slate-100 px-4 py-3 rounded-2xl bg-slate-50/50"
                            >
                              <span className="text-xs text-slate-600 font-semibold">
                                {trait.label}
                              </span>
                              <span className="text-xs font-black text-blue-600 bg-blue-100/40 px-2.5 py-1 rounded-md">
                                {trait.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed text-slate-400 text-xs">
                          No behavior assessment records found for this term.
                        </div>
                      )}
                    </Card>

                    {/* TEACHER & PRINCIPAL REMARKS */}
                    <Card className="border-0 shadow-sm bg-white rounded-3xl p-6 space-y-6">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-800">
                          Term Feedback Remarks
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Comments from class teacher & management
                        </CardDescription>
                      </div>

                      <div className="space-y-4.5">
                        <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/30 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                            <Clipboard className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Class Teacher's Remark</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 italic leading-relaxed">
                            {comment?.class_teacher_comment
                              ? `"${comment.class_teacher_comment}"`
                              : '"No teacher remarks recorded yet."'}
                          </p>
                        </div>

                        <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/30 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>Principal's Remark</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 italic leading-relaxed">
                            {comment?.principal_comment
                              ? `"${comment.principal_comment}"`
                              : '"No management remarks recorded yet."'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col py-24 px-6 items-center justify-center bg-white rounded-3xl shadow-sm border-0 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-4.5">
                    <ShieldAlert size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Academic Sheet Not Released
                  </h3>
                  <p className="text-sm text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                    Results and grades assessments for this term are currently
                    locked. Results will be visible once they are compiled and
                    officially released by administration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 3. STUDENT PROFILE DETAILS TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* BIOMETRIC & BIODATA SHEET */}
                <Card className="border-0 shadow-sm bg-white rounded-3xl p-6 lg:col-span-2 space-y-6">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">
                      Student Profile Information
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Your biological & admissions credentials on record
                    </CardDescription>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        First Name
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {studentData.user?.first_name}
                      </p>
                    </div>

                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Middle Name
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {studentData.user?.middle_name || "—"}
                      </p>
                    </div>

                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Last Name
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {studentData.user?.last_name}
                      </p>
                    </div>

                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Username
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {studentData.user?.username}
                      </p>
                    </div>

                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Date of Birth
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {studentData.user?.date_of_birth
                          ? new Date(
                              studentData.user.date_of_birth,
                            ).toLocaleDateString(undefined, {
                              dateStyle: "long",
                            })
                          : "—"}
                      </p>
                    </div>

                    <div className="border border-slate-100 p-4.5 rounded-2xl bg-slate-50/50">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Gender
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1 capitalize">
                        {studentData.user?.gender}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* PARENT / GUARDIAN CONTACT DETAILS */}
                <Card className="border-0 shadow-sm bg-white rounded-3xl p-6 space-y-6">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">
                      Parent / Guardian Details
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Emergency & communications contact credentials
                    </CardDescription>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/30">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Full Name
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1">
                        {studentData.parent_first_name}{" "}
                        {studentData.parent_last_name}
                      </p>
                    </div>

                    <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/30 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Phone size={15} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Phone Number
                        </span>
                        <p className="font-extrabold text-slate-800 text-xs mt-0.5">
                          {studentData.parent_phone}
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/30 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <Mail size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Email Address
                        </span>
                        <p className="font-extrabold text-slate-800 text-xs mt-0.5 truncate">
                          {studentData.parent_email || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/30 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                        <MapPin size={15} />
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Contact Address
                        </span>
                        <p className="font-semibold text-slate-700 text-xs mt-1 leading-relaxed">
                          {studentData.parent_address || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 4. CLASS FEES TAB */}
          {activeTab === "fees" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* FILTERS PANEL */}
              <div className="bg-white p-6 rounded-3xl border-0 shadow-sm flex flex-col sm:flex-row items-end gap-4">
                <div className="w-full sm:w-1/2 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Academic Session
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-100 hover:border-slate-200 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-2xl text-slate-800 text-sm font-semibold transition"
                  >
                    <option value="" disabled>
                      Choose Year
                    </option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.is_active ? "(Active)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-1/2 flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Term
                  </label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-100 hover:border-slate-200 focus:border-blue-500 focus:outline-none px-4 py-3 rounded-2xl text-slate-800 text-sm font-semibold transition"
                  >
                    <option value="" disabled>
                      Choose Term
                    </option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.is_active ? "(Active)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DETAILS */}
              {resultsLoading ? (
                <div className="flex py-20 items-center justify-center bg-white rounded-3xl shadow-sm border-0">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : classFee ? (
                <div className="max-w-2xl">
                  <Card className="border-0 shadow-lg bg-white rounded-3xl overflow-hidden p-8 space-y-6">
                    <div className="text-center space-y-2 pb-6 border-b">
                      <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
                        <Banknote size={26} />
                      </div>
                      <CardTitle className="text-xl font-black text-slate-800">
                        Term School Fees Statement
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Assigned class arm fees billing statement
                      </CardDescription>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-sm text-slate-500 font-medium">
                          Billed Class:
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {currentClass
                            ? `${currentClass.name} - ${currentClass.arm?.name}`
                            : "Not Enrolled"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2.5 border-t border-slate-100">
                        <span className="text-sm text-slate-500 font-medium">
                          Term / Year:
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {
                            terms.find((t) => t.id.toString() === selectedTerm)
                              ?.name
                          }{" "}
                          (
                          {
                            sessions.find(
                              (s) => s.id.toString() === selectedSession,
                            )?.name
                          }
                          )
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-4.5 border-t border-slate-100 bg-blue-50/20 px-4 rounded-2xl mt-4">
                        <span className="text-sm font-bold text-blue-700">
                          Total Billed Amount:
                        </span>
                        <span className="text-lg font-black text-blue-600">
                          ₦
                          {parseFloat(classFee.amount).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 text-center">
                      <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                        Payments should be made directly to the school's bank
                        account. Kindly present payment slips at the bursary
                        desk for receipt collection.
                      </p>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col py-24 px-6 items-center justify-center bg-white rounded-3xl shadow-sm border-0 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4.5">
                    <Banknote size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    No Billed Fees Configured
                  </h3>
                  <p className="text-sm text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                    No active fee schedule billing has been configured for this
                    class, session, and term.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
