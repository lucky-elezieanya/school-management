"use client";

import Link from "next/link";
import { logout } from "@/app/lib/auth";
import { useRoleGuard } from "@/app/lib/hooks/useRoleGuard";
import { useEffect, useState } from "react";
import {
 
  UserType,
} from "@/app/lib/types";
import {
  apiAction,
  apiHeaders,
  BASE_URL,
  createAction,
  handleUserDelete,
} from "@/app/lib/api";
import {
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
/* =========================
    ADD THESE IMPORTS
========================== */
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import DashboardCards from "@/app/components/sections/DashboardCards";
import { useAuth } from "@/app/lib/hooks/useAuth";
import UsersSection from "@/app/components/sections/UsersSection";
import { useRouter } from "next/navigation";
import AddSessionForm from "@/app/components/forms/AddSession";
import SessionTermSwitcher from "@/app/components/forms/SessionTermSwitcher";
import {toast} from "sonner"


export default function AdminPage() {
  useRoleGuard(["admin"]);
  const router = useRouter();
  const { user, currentTerm, termMessage } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersNext, setUsersNext] = useState<string | null>(null);
  const [usersPrevious, setUsersPrevious] = useState<string | null>(null);
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState(0);
  const [classesCount, setClassesCount] = useState(0);
  // subjects
  const [subjectsCount, setSubjectsCount] = useState(0);
const [teachersCount, setTeachersCount] = useState(0)
const [resultsCount, setResultsCount] = useState(0)

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [toggleSessionModal, setToggleSessionModal] = useState(false);
  const [addSession, setAddSession] = useState(false);
  const isLoggedInState = !!user;

  const fetchStudents = async (url?: string) => {
    try {
      const data = url
        ? await fetch(url, {
            headers: apiHeaders(),
          }).then((res) => res.json())
        : await apiAction("academics", "students");

    
      setStudentsCount(data.count || 0);
    } catch (error:any) {
      toast.error("Failed to fetch students:", error);
    }
  };

  const fetchTeachers = async (url?: string) => {
    try {
      const data = url
        ? await fetch(url, {
            headers: apiHeaders(),
          }).then((res) => res.json())
        : await apiAction("academics", "teachers");


      setTeachersCount(data.count || 0);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

const fetchResults = async (url?: string) => {
    try {
      const data = url
        ? await fetch(url, {
            headers: apiHeaders(),
          }).then((res) => res.json())
        : await apiAction("results", "results");

      setResultsCount(data.count || 0);
    } catch (error) {
      console.error("Failed to fetch results:", error);
    }
  };

  const fetchClasses = async (url?: string) => {
    try {
      const data = url
        ? await fetch(url, {
            headers: apiHeaders(),
          }).then((res) => res.json())
        : await apiAction("academics", "classes");

      setClassesCount(data.count || 0);
    } catch (error:any) {
      toast.error("Failed to fetch students:", error);
    }
  };
  const fetchUsers = async (url?: string) => {
    try {
      const data = url
        ? await fetch(url, {
            headers: apiHeaders(),
          }).then((res) => res.json())
        : await apiAction("accounts", "users");

      setUsers(data.results || []);
      setUsersNext(data.next);
      setUsersPrevious(data.previous);
      setUsersCount(data.count || 0);
    } catch (error) {
      console.log("Failed to fetch Users:", error);
      toast.error(`Failed to fetch Users: ${error}`);
    }
  };
  const fetchSubjects = async (url?: string) => {
    try {
      const data = url
        ? await fetch(url, {
            headers: apiHeaders(),
          }).then((res) => res.json())
        : await apiAction("academics", "subjects");

      setSubjectsCount(data.count || 0);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const handleSessionCreation = async (data: {
    name: string;
    is_active: boolean;
  }) => {
    try {
      const payload = {
        name: data.name.trim().toUpperCase(),
        is_active: data.is_active,
      };

      const res = await createAction("academics", "sessions", payload, "POST");

      if (res) {
        toast.success(`Session: {data.name} created successfully!`);
      }
    } catch (error: any) {
        toast.error(`Error: ${error.name}`)
    }
  };

  useEffect(() => {
    if (!isLoggedInState) return;

    const initializeDashboard = async () => {
      try {
        await Promise.all([
          fetchStudents(`${BASE_URL}/academics/students/`),
          fetchTeachers(`${BASE_URL}/academics/teachers/`),
          fetchClasses(`${BASE_URL}/academics/classes/`),
          fetchSubjects(`${BASE_URL}/academics/subjects/`),
          fetchUsers(`${BASE_URL}/accounts/users/`),
          fetchResults(`${BASE_URL}/results/results/`),
        ]);

        //
      } catch (error) {
        console.error("Dashboard init error:", error);
      }
    };
    initializeDashboard();
  }, [isLoggedInState]);

  const [activeTab, setActiveTab] = useState("dashboard");
  const hiddenLinks = ["dashboard"];

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={34} />,
    },
  ];
  return (
    <div className="min-h-screen bg-transparent flex relative overflow-x-hidden w-full">
      {/* Sidebar */}
      {/* ================= MOBILE MENU ====================== */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="bg-white shadow-lg rounded-xl p-3 border border-gray-200">
              <Menu className="w-6 h-6 text-gray-800" />
            </button>
          </SheetTrigger>

          <SheetContent side="left" className="w-[70%] p-0">
            <SheetTitle className="sr-only">Admin Panel</SheetTitle>
            <div className="h-full flex flex-col bg-white">
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
                <p className="text-xs text-slate-500 mt-0.5">{user?.username}</p>
                {currentTerm && (
                  <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/10 text-emerald-700 rounded-lg text-xs font-bold">
                    <ClipboardList size={12} />
                    <span>
                      {currentTerm.name} — {currentTerm.session?.name}
                    </span>
                  </div>
                )}
              </div>

              <nav className="flex-1 p-4 space-y-2">
                {tabs.map((tab) => (
                  <SheetClose asChild key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left inline-flex gap-3 px-4 py-2 rounded-lg transition ${
                        activeTab === tab.id
                          ? "bg-emerald-600 text-white"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  </SheetClose>
                ))}
                <Link
                  className="w-full text-left inline-flex gap-3 px-4 py-2 rounded-lg transition text-gray-700 hover:bg-gray-200"
                  href={"/admin/administration"}
                >
                  <span>
                    <ShieldCheck size={34} />
                  </span>

                  <span>Administrative Duties</span>
                </Link>
                <Link
                  className="w-full text-left inline-flex gap-3 px-4 py-2 rounded-lg transition text-gray-700 hover:bg-gray-200"
                  href={"/admin/users/new"}
                >
                  <span>
                    <UserPlus size={34} />
                  </span>

                  <span>Add an Admin User</span>
                </Link>
              </nav>
              <div className="cover flex flex-col gap-4 items-center justify-center p-2 border-t-gray-400 border-t-[0.5px] shrink-0">
                {user ? (
                  <div className="logout w-3/4 items-center justify-center p-2 border-gray-400">
                    <button
                      type="button"
                      onClick={logout}
                      className="py-2 px-4 rounded-lg mx-auto flex bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="logout w-3/4 items-center justify-center p-2 border-gray-400">
                    <Link
                      href="/login"
                      className="py-2 px-4 rounded-lg mx-auto flex bg-emerald-600 text-white hover:bg-red-700 transition"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="wrapper grid grid-cols-12">
          {/* ======== DESKTOP SIDEBAR ============== */}
        <div className="col-span-3">
          <aside className="w-64 fixed top-0 left-0 bg-white shadow-md hidden md:flex flex-col h-screen overflow-y-auto stick top-">
            <div className="bg-gradient-to-br hidden md:flex md:flex-col from-emerald-50 to-teal-50 border border-emerald-100/60 p-4 rounded-2xl mb-7">
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
              <p className="text-xs text-slate-500 mt-0.5">{user?.username}</p>
              {currentTerm && (
                <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/10 text-emerald-700 rounded-lg text-xs font-bold">
                  <ClipboardList size={12} />
                  <span>
                    {currentTerm.name} — {currentTerm.session?.name}
                  </span>
                </div>
              )}
            </div>
            {/* emerald */}

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left inline-flex gap-3 px-4 py-2 rounded-lg transition ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}

              <Link
                className="w-full text-left inline-flex gap-3 px-4 py-2 rounded-lg transition text-gray-700 hover:bg-gray-200"
                href={"/admin/administration"}
              >
                <span>
                  <ShieldCheck size={34} />
                </span>

                <span>Administrative Duties</span>
              </Link>
              <Link
                className="w-full text-left inline-flex gap-3 px-4 py-2 rounded-lg transition text-gray-700 hover:bg-gray-200"
                href={"/admin/users/new"}
              >
                <span>
                  <UserPlus size={34} />
                </span>

                <span>Add an Admin User</span>
              </Link>
            </nav>

            <div className="cover flex flex-col gap-4 items-center justify-center p-2 border-t-gray-400 border-t-[0.5px] shrink-0">
              {user ? (
                <div className="logout w-3/4 items-center justify-center p-2 border-gray-400">
                  <button
                    type="button"
                    onClick={logout}
                    className="py-2 px-4 rounded-lg mx-auto flex bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="logout w-3/4 items-center justify-center p-2 border-gray-400">
                  <Link
                    href="/login"
                    className="py-2 px-4 rounded-lg mx-auto flex bg-emerald-600 text-white hover:bg-red-700 transition"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
          {/* Main Content */}
        <div className="col-span-9">
          <main className="flex-1 p-4 pt-10 md:pt-6 overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto">
              {/* Header */}
              <div className="w-full mb-6">
                <div className="flex flex-wrap w-full items-center justify-between gap-4">
                  {/* PAGE TITLE */}
                  <div className="shrink- w-1/2 gap-4 flex flex-col lg:flex-row justify-between">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 capitalize">
                      {activeTab}
                    </h1>
                    {currentTerm ? (
                      <h1 className="px-3 w-fit sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap">
                        {currentTerm.session.name} • {currentTerm.name}
                      </h1>
                    ) : (
                      <button
                        className="px-3 w-fit sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
                        onClick={() => {
                          setShowSessionModal(!showSessionModal);
                          setAddSession(false);
                          setToggleSessionModal(false);
                        }}
                      >
                        {termMessage ? (
                          <p className="w-fit p-2">{termMessage}</p>
                        ) : (
                          "No created session"
                        )}
                      </button>
                    )}
                    <button
                      className="px-3 w-fit sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
                      onClick={() => {
                        setToggleSessionModal(!toggleSessionModal);
                        setAddSession(false);
                      }}
                    >
                      Switch session
                    </button>
                    <button
                      className="px-3 w-fit sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
                      onClick={() => {
                        setAddSession(!addSession);
                        setToggleSessionModal(false);
                      }}
                    >
                      Add new session
                    </button>
                  </div>

                  {/* ACTION BUTTONS */}
                  {!hiddenLinks.includes(activeTab) && (
                    <div className="flex flex-col gap-4 items-center lg:flex-row">
                      <Link
                        href={`/admin/administration/${activeTab}/`}
                        className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
                      >
                        View{" "}
                        {activeTab.slice(0, 1).toUpperCase() +
                          activeTab.slice(1, -1)}
                        s
                      </Link>

                      <Link
                        href={`/admin/administration/${activeTab}/new`}
                        className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
                      >
                        {`+ Add New ${
                          activeTab.slice(0, 1).toUpperCase() +
                          activeTab.slice(1, -1)
                        }`}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="wrapper my-10">
                <div className="toggle">
                  {toggleSessionModal && (
                    <SessionTermSwitcher
          
                      setToggleSessionModal={setToggleSessionModal}
                    />
                  )}
                </div>
                <div className="create">
                  {addSession && (
                    <AddSessionForm
                      onCreate={handleSessionCreation}
                      setAddSession={setAddSession}
                    />
                  )}
                </div>
              </div>
              {/* Dashboard Cards */}
              <DashboardCards
                usersCount={usersCount}
                studentsCount={studentsCount}
                teachersCount={teachersCount}
                subjectsCount={subjectsCount}
                classesCount={classesCount}
                resultsCount={resultsCount}
              />
              {/* Dynamic Section */}
              <div className="bg-transparent rounded-xl shadow p-6 w-full">
                {activeTab === "dashboard" && (
                  <UsersSection
                    users={users}
                    setUsers={setUsers}
                    count={usersCount}
                    next={usersNext}
                    previous={usersPrevious}
                    handleDelete={handleUserDelete}
                    onNext={() => fetchUsers(usersNext || undefined)}
                    onPrevious={() => fetchUsers(usersPrevious || undefined)}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
