"use client";
import "../../../app/globals.css";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Menu,
  X,
  LayoutDashboard,
  ArrowLeft,
  PenLine,
  Users,
  BookPlus,
  Star,
  MessageSquare,
  BarChart2,
  Download,
  Activity,
  BookOpen,
  LogOut,
  ChevronRight,
  ClipboardList,
  PenBox,
} from "lucide-react";

import { logout } from "@/app/lib/auth";
import { useAuth } from "@/app/lib/hooks/useAuth";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { apiAction, apiHeaders, BASE_URL, handleResponse } from "@/app/lib/api";
import { TeacherType } from "@/app/lib/types";

const navLinks: {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    href: "/teachers",
  },
  {
    id: "results-entry",
    name: "Enter Results",
    icon: <PenLine size={18} />,
    href: "/teachers/results-entry",
  },
  {
    id: "students",
    name: "My Students",
    icon: <Users size={18} />,
    href: "/teachers/students",
  },
  {
    id: "classes",
    name: "Enter Class",
    icon: <BookPlus size={18} />,
    href: "/teachers/classes",
  },

  {
    id: "behaviour",
    name: "Behaviour Qualities",
    icon: <Star size={18} />,
    href: "/teachers/behaviour",
  },
  {
    id: "comments",
    name: "Attendance/Behavioural Comments",
    icon: <MessageSquare size={18} />,
    href: "/teachers/comments",
  },
  {
    id: "signature",
    name: "Upload your signature",
    icon: <PenBox size={18} />,
    href: "/teachers/class_teacher_signature",
  },
  {
    id: "view-results",
    name: "View Results",
    icon: <BarChart2 size={18} />,
    href: "/teachers/view-results",
  },
];

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { user, authLoading, currentTerm } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [teacher, setTeacher] = useState<TeacherType | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
    }
    if (user.role !== "teacher") {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const getTeacher = async () => {
      try {
        const url = `${BASE_URL}/academics/teachers/teacher/?user_id=${user.id}`;
        const resp = await fetch(url, { headers: apiHeaders() });
        const res = await handleResponse(resp);
        if (res) {
          setTeacher(res);
        }
      } catch (error) {
        setTeacher(null);
        console.error(error);
      }
    };
    getTeacher();
  }, [user]);
  // ================================
  // LOADING UI (STYLED)
  // ================================
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>

          {/* Text */}
          <p className="text-sm font-medium text-gray-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (!user) return null;

  if (!user || user.role !== "teacher") return null;

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-12 lg:gap-2">
      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden w-full flex items-center justify-between bg-white border-b border-slate-100 px-5 py-4 sticky top-0 z-40 shadow-sm">
        <aside className="w-full m-0">
          <Sheet>
            <SheetTrigger asChild className="w-full">
              <div className="flex flex-row justify-between">
                <button className=" w-10 p-2 rounded-xl text-slate-700 hover:bg-slate-50 transition">
                  <Menu className="w-5 h-5" />
                </button>
                <header className="sticky md:hidden z-10 w-full border-b w-full py-2 px-2 flex flex-row items-center justify-between ">
                  {/* LEFT SIDE */}
                  <div className="">
                    <h2 className="text-sm font-bold text-gray-800">
                      Dashboard
                    </h2>
                  </div>

                  <div className="px-2 py-2 rounded-xl border border-gray-200 flex flex-row text-center justify-center gap-0">
                    <p className="text-xs font-semibold text-gray-700">
                      {currentTerm?.session.name}
                    </p>

                    <p className="text-gray-400">•</p>

                    <p className="text-xs text-gray-700">{currentTerm?.name}</p>
                  </div>
                  {/* RIGHT SIDE */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => logout()}
                      className="inline-flex text-xs items-center justify-center px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
                    >
                      Logout
                    </button>
                    <button
                      onClick={() => router.push("/teachers")}
                      className="bg-red-600 text-xs text-white px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  </div>
                </header>
              </div>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[80%] h-screen overflow-y-auto p-0"
            >
              <SheetTitle className="sr-only">
                Teacher Portal Navigation
              </SheetTitle>
              <div className="h-full flex flex-col bg-white p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-black text-slate-800 text-lg">
                    Teacher Portal
                  </span>
                </div>
                {/* Teacher info card */}

                <Link
                  href={
                    teacher?.id
                      ? `/teachers/profile/${teacher.id}`
                      : "/teachers"
                  }
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/60 p-5 rounded-2xl mb-7"
                >
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow mb-2.5"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-extrabold text-lg mb-2.5">
                      {user?.first_name?.[0]}
                      {user?.last_name?.[0]}
                    </div>
                  )}
                  <h4 className="font-extrabold text-slate-800 text-sm leading-snug">
                    {user?.full_name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">Class Teacher</p>
                  {currentTerm && (
                    <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/10 text-emerald-700 rounded-lg text-xs font-bold">
                      <ClipboardList size={12} />
                      <span>
                        {currentTerm.name} — {currentTerm.session?.name}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="nav">
                  <nav className="space-y-1 flex-1">
                    {navLinks.map((item) => (
                      <SheetClose asChild key={item.id}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            setActiveTab(item.id);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                            activeTab === item.id
                              ? "bg-emerald-600 text-white"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition text-sm font-semibold mt-4"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </aside>
      </div>
      {/* ===============SIDEBAR  ==================== */}

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="sidebar hidden lg:block lg:col-span-2">
        <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-slate-100 bg-white p-5 shadow-sm select-none">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-8 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>

            <span className="text-xl font-black tracking-tight text-slate-800">
              Teacher Portal
            </span>
          </div>

          {/* Profile Card */}
          <Link
            href={teacher?.id ? `/teachers/profile/${teacher.id}` : "/teachers"}
            className="mb-6 shrink-0 rounded-2xl border border-emerald-100/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-5"
          >
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt="Profile"
                className="mb-2.5 h-12 w-12 rounded-full border-2 border-white object-cover shadow"
              />
            ) : (
              <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-extrabold text-white">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </div>
            )}

            <h4 className="text-sm font-extrabold leading-snug text-slate-800">
              {user?.full_name}
            </h4>

            <p className="mt-0.5 text-xs text-slate-500">Class Teacher</p>

            {currentTerm && (
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-600/10 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                <ClipboardList size={12} />
                <span>
                  {currentTerm.name} — {currentTerm.session?.name}
                </span>
              </div>
            )}
          </Link>

          {/* Scrollable Menu */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <nav
              className="
        h-full
        overflow-y-auto
        overflow-x-hidden
        pr-2
        scrollbar-thin
      "
            >
              <div className="space-y-1 pb-4">
                {navLinks.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      activeTab === item.id
                        ? "scale-[1.02] bg-emerald-600 text-white shadow-lg shadow-emerald-600/15"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.icon}

                    <span>{item.name}</span>

                    {activeTab === item.id && (
                      <ChevronRight size={14} className="ml-auto" />
                    )}
                  </Link>
                ))}
              </div>
            </nav>
          </div>

          {/* Footer */}
          <div className="pt-4 shrink-0">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-red-50 py-3 text-sm font-bold text-red-500 transition hover:border-red-100 hover:bg-red-50"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>
      <div className="main w-full lg:col-span-10 flex flex-col gap-1 px-2">
        {/* ============= MAIN CONTENT============= */}

        <main className="relative z-10 flex w-full flex-col bg-transparent px-4 md:px-6 lg:px-8">
          <header className="sticky top-0 z-20 hidden w-full items-center justify-between border-b border-gray-200 bg-white py-4 md:flex">
            {/* LEFT SIDE */}
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Teacher's Dashboard
                </h2>

                <p className="text-sm text-gray-500">
                  Manage school activities
                </p>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
                <p className="text-sm font-semibold text-gray-700">
                  {currentTerm?.session.name}
                </p>

                <span className="text-gray-400">•</span>

                <p className="text-sm text-gray-500">{currentTerm?.name}</p>
              </div>

              <button
                onClick={() => logout()}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
              >
                Logout
              </button>
              <button
                onClick={() => router.push("/teachers")}
                className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <ArrowLeft size={24} /> Back
              </button>
            </div>
          </header>
          <div className="children w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
