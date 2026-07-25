"use client";
import "../../../globals.css";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AwardIcon,
  Banknote,
  BookAIcon,
  Brain,
  FileBarChart,
  FileLock2Icon,
  GraduationCap,
  HousePlus,
  School,
  UserCheck2,
  UserCog,
  ArrowUpCircle,
  CalendarClock,
  PenBox,
  UserPlus2,
  BookCopyIcon,
  Calculator,
  FileOutput,
  FilePlus,
  FileSearch,
  LayoutDashboard,
  ClipboardList,
  X,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { logout } from "@/app/lib/auth";
import { useAuth } from "@/app/lib/hooks/useAuth";

const navLinks = [
  {
    name: "Dashboard",
    href: "/admin/administration",
    icon: LayoutDashboard,
  },
  {
    name: "Classes and Arms",
    href: "/admin/administration/classes",
    icon: School,
  },
  {
    name: "Sessions and Terms",
    href: "/admin/administration/sessions",
    icon: BookCopyIcon,
  },
  {
    name: "Students",
    href: "/admin/administration/students",
    icon: GraduationCap,
  },
  {
    name: "Create New Students",
    href: "/admin/administration/students/new",
    icon: UserPlus2,
  },
  {
    name: "Add Students to Class",
    href: "/admin/administration/enrollments",
    icon: UserPlus2,
  },
  {
    name: "Teachers",
    href: "/admin/administration/teachers",
    icon: UserCog,
  },
  {
    name: "Subjects",
    href: "/admin/administration/subjects/new",
    icon: BookAIcon,
  },
  {
    name: "Set Grading",
    href: "/admin/administration/grades",
    icon: AwardIcon,
  },

  {
    name: "Term Comments",
    href: "/admin/administration/comments",
    icon: PenBox,
  },

  {
    name: "School Open Days",
    href: "/admin/administration/attendance/days_school_opened",
    icon: CalendarClock,
  },

  {
    name: "Set Class Max scores",
    href: "/admin/administration/classScores",
    icon: FileBarChart,
  },
  {
    name: "Upload Results",
    href: "/admin/administration/results",
    icon: FileBarChart,
  },
  {
    name: "Preview/Approve Results",
    href: "/admin/administration/results/preview",
    icon: FileOutput,
  },
  {
    name: "View Results",
    href: "/admin/administration/results/view",
    icon: FileSearch,
  },
  {
    name: "Results Checklist",
    href: "/admin/administration/results/generate",
    icon: FilePlus,
  },
  {
    name: "Customize Results",
    href: "/admin/administration/results/customize",
    icon: BookAIcon,
  },
  {
    name: "Open/Close Results Portal",
    href: "/admin/administration/resultsAccess",
    icon: FileLock2Icon,
  },

  {
    name: "Resumption Date",
    href: "/admin/administration/resumption-dates",
    icon: CalendarClock,
  },

  {
    name: "Set Term Fees",
    href: "/admin/administration/fees",
    icon: Banknote,
  },
  {
    name: "Promotions",
    href: "/admin/administration/promotions",
    icon: ArrowUpCircle,
  },
  {
    name: "Class Teacher Signature",
    href: "/admin/administration/class_teacher_signature",
    icon: PenBox,
  },
  {
    name: "Header Teacher Signature",
    href: "/admin/administration/head_teacher_signature",
    icon: PenBox,
  },
  {
    name: "School Logo",
    href: "/admin/administration/schoolHeader",
    icon: HousePlus,
  },
];
export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authLoading, currentTerm } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);
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

  if (!user) return null;

  return (
    <div className="">
      <div className="min-h-screen bg-gray-10 lg:grid lg:grid-cols-12 gap-0">
        {/* =========================
                        MOBILE OVERLAY
                    ========================== */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />
        )}
        <div className="sidebar lg:col-span-2 ">
          {/* =========================
                        SIDEBAR
                    ========================== */}
          <aside
            className={`
                            fixed top-0 left-0 z-100 h-screen w-64 bg-emerald-600 text-white
                            transform transition-transform duration-300 ease-in-out
                            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                            lg:translate-x-0 lg:fixed lg:left-0 lg:top-0 lg:flex-shrink-0
                        	`}
          >
            <div className="flex flex-col h-full">
              {/* LOGO */}
              <div className="flex flex-col relative items-center justify-between px-6 py-6 border-b border-emerald-800">
              {/* CLOSE BUTTON MOBILE */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden mr-0 mt-0 "
                >
                  <X size={28} />
                </button>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/60 p-4 rounded-2xl mb-7">
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
                  <p className="text-xs text-slate-500 mt-0.5">{user.username}</p>
                  {currentTerm && (
                    <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/10 text-emerald-700 rounded-lg text-xs font-bold">
                      <ClipboardList size={12} />
                      <span>
                        {currentTerm.name} — {currentTerm.session?.name}
                      </span>
                    </div>
                  )}
                </div>
              
              </div>

              {/* NAVIGATION */}
              <nav className="flex-1 px-4 py-6 space-y- overflow-y-auto">
                {navLinks.map((link) => {
                  const Icon = link.icon;

                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                                                flex items-center gap-3 px-4 py-3 rounded-2xl transition
                                                ${
                                                  isActive
                                                    ? "bg-white text-emerald-900 font-semibold"
                                                    : "hover:bg-emerald-700 text-emerald-100"
                                                }
                                            `}
                    >
                      <Icon size={32} />

                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* FOOTER */}
              <div className="p-4 border-t border-emerald-800">
                <div className="img"></div>
                <div className="bg-emerald-800 rounded-2xl p-4">
                  <p className="text-sm text-emerald-100">
                    Cozzi Schools Administration System
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
        <div className="main lg:col-span-10">
          {/* =========================
                        MAIN CONTENT
                    ========================== */}
          <div className="flex-1 flex flex-col min-h-screen w-full px-10">
            {/* TOPBAR */}
            <header className="sticky top-0 z-10 ml-5 ml-4 w-full bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm">
              {/* LEFT SIDE */}
              <div className="flex items-center gap-4">
                {/* MOBILE MENU BUTTON */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-100 transition"
                >
                  <Menu size={24} />
                </button>

                <div>
                  <h2 className="text-md font-bold text-gray-800">
                    Admin Dashboard
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
                  onClick={() => router.push("/admin")}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                >
                  <ArrowLeft size={24} /> Back
                </button>
              </div>
            </header>

            {/* PAGE CONTENT */}
            <main className="flex-1 p-4 relative z-10 bg-transparent  overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
