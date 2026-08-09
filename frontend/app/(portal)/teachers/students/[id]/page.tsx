"use client";

import {
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  BookOpen,
  ShieldCheck,
  Users,
  ArrowLeft,
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiAction, apiHeaders, BASE_URL } from "@/app/lib/api";
import { StudentType } from "@/app/lib/types";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { StudentResultSnapshot } from "@/app/types/result-snapshot";


export default function Student() {
  const params = useParams();
  const router = useRouter();
  const { currentTerm } = useAuth();
  const studentId = Number(params.id);
  const [student, setStudent] = useState<StudentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<StudentResultSnapshot | null>(null);

  const [error, setError] = useState("");

  /* ======================================
	   FETCH STUDENT
	====================================== */
  useEffect(() => {
    if (!studentId) return;

    const fetchStudent = async () => {
      try {
        setLoading(true);

        const data = await apiAction("academics", "students", studentId);
        setStudent(data);
      } catch (err) {
        console.error(err);

        setError("Failed to load student");
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    }
    if (student) {
      setLoading(false);
    }
  }, []);

  const fetchSnapshot = async () => {
    const url = `${BASE_URL}/results/result-snapshots/?student=${studentId}&session=${currentTerm?.session.id}&term=${currentTerm?.id}`;
    const res = await fetch(url, {
      headers: apiHeaders(),
    });

    if (res) {
      const response = await res.json();
      console.log("snapshot: ", response)

      if (response && response.results.length > 0) {
        const data = response.results[0];
        setSnapshot(data);
       
      } else return;
    } else {
      setSnapshot(null);
      alert("Results for student not available yet");
      return;
    }
  };
  useEffect(() => {
    fetchSnapshot();
  }, [currentTerm, studentId]);

  /* ======================================
	   LOADING STATE
	====================================== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg font-medium text-gray-600">
          Loading student details...
        </p>
      </div>
    );
  }

  /* ======================================
	   ERROR STATE
	====================================== */
  if (error || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-600 font-medium">
            {error || "Student not found"}
          </p>

          <Link
            href="/teachers/students"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            <ArrowLeft size={22} /> Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      {/* HEADER */}
      <div className="bg-linear-to-r from-emerald-700 to-emerald-500 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/teachers/students"
              className="bg-white/10 hover:bg-white/20 transition p-3 rounded-xl"
            >
              <ArrowLeft size={22} />
            </Link>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Student Profile
              </h1>

              <p className="text-emerald-100 mt-1">
                View and manage student details
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDEBAR */}
          <div className="space-y-6">
            {/* PROFILE CARD */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-emerald-100 shadow-md">
                  <Image
                    src={student?.user?.profile_picture || "/avatar.png"}
                    alt="Student"
                    fill
                    className="object-cover"
                  />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mt-5 text-center">
                  {student?.user?.full_name}{" "}
                </h2>

                <p className="text-gray-500 mt-1">@{student?.user?.username}</p>

                <div className="mt-4 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
                  Student
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-emerald-700" size={20} />

                  <div>
                    <p className="text-sm text-gray-500">Class</p>

                    <p className="font-semibold text-gray-800">
                      {student?.current_enrollment.school_class ? (
                        <>
                          {student.current_enrollment.school_class.name +
                            " - " +
                            student.current_enrollment.school_class.arm.name}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-emerald-700" size={20} />

                  <div>
                    <p className="text-sm text-gray-500">Admission No.</p>

                    <p className="font-semibold text-gray-800">
                      {student ? student.admission_number : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays className="text-emerald-700" size={20} />

                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>

                    <p className="font-semibold text-gray-800 inline-flex gap-3">
                      <span>
                        {student?.user ? student?.user?.date_of_birth : "N/A"}
                      </span>

                      <span>
                        {student?.user ? student.user.age + "years old" : "N/A"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="text-emerald-700" size={20} />

                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    {student?.user ? (
                      <p className="font-semibold text-gray-800">
                        {student?.user?.gender[0].toUpperCase() +
                          student?.user?.gender.slice(1)}
                      </p>
                    ) : (
                      <p className="font-semibold text-gray-800">N/A</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-5">
                Quick Actions
              </h3>

              <div className="space-y-4">
                <button
                  onClick={() =>
                    snapshot?.id
                      ? router.push(`/results/preview/${snapshot?.id}`)
                      : alert("No results yet")
                  }
                  className="w-full bg-emerald-700 hover:bg-emerald-800 transition text-white py-3 rounded-xl font-medium"
                >
                  View Results
                </button>

                <Link
                  href={`mailto:${student.parent_email || "parent@example.com"}`}
                  className="flex items-center justify-center w-full bg-gray-800 hover:bg-black text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 shadow-sm"
                >
                  Send Message
                </Link>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            {/* STUDENT INFO */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-emerald-900 mb-8">
                Student Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  icon={<User size={18} />}
                  label="First Name"
                  value={student?.user?.first_name || "N/A"}
                />

                <InfoCard
                  icon={<User size={18} />}
                  label="Middle Name"
                  value={student?.user?.middle_name || "N/A"}
                />
                {student?.user ? (
                  <InfoCard
                    icon={<User size={18} />}
                    label="Last Name"
                    value={student?.user?.last_name}
                  />
                ) : (
                  <InfoCard
                    icon={<User size={18} />}
                    label="Last Name"
                    value={"N/A"}
                  />
                )}

                {student?.user ? (
                  <InfoCard
                    icon={<Users size={18} />}
                    label="Username"
                    value={student?.user?.username || "N/A"}
                  />
                ) : (
                  <InfoCard
                    icon={<Users size={18} />}
                    label="Username"
                    value={"N/A"}
                  />
                )}

                {student.current_enrollment ? (
                  <InfoCard
                    icon={<BookOpen size={18} />}
                    label="Current Class"
                    value={`${student.current_enrollment.school_class.name} - ${student.current_enrollment.school_class.arm.name}`}
                  />
                ) : (
                  <InfoCard
                    icon={<BookOpen size={18} />}
                    label="Current Class"
                    value={"N/A"}
                  />
                )}
              </div>
            </div>

            {/* PARENT INFO */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-emerald-900 mb-8">
                Parent / Guardian Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  icon={<User size={18} />}
                  label="Parent First Name"
                  value={student.parent_first_name}
                />

                <InfoCard
                  icon={<User size={18} />}
                  label="Parent Last Name"
                  value={student.parent_last_name}
                />

                <InfoCard
                  icon={<Mail size={18} />}
                  label="Parent Email"
                  value={student.parent_email}
                />

                <InfoCard
                  icon={<Phone size={18} />}
                  label="Parent Phone"
                  value={student.parent_phone}
                />

                <div className="md:col-span-2">
                  <InfoCard
                    icon={<MapPin size={18} />}
                    label="Parent Address"
                    value={student.parent_address}
                  />
                </div>
              </div>
            </div>

            {/* ACTIVITY SECTION */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-emerald-900 mb-8">
                Academic Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Attendance" value="92%" />

                <StatCard title="Average Score" value="78%" />

                <StatCard title="Subjects" value="12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
	INFO CARD
========================================================= */
function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100">
      <div className="flex items-center gap-2 text-emerald-800 mb-2">
        {icon}

        <p className="text-sm font-medium">{label}</p>
      </div>

      <p className="text-gray-800 font-semibold text-lg wrap-break-word">
        {value || "N/A"}
      </p>
    </div>
  );
}

/* =========================================================
	STAT CARD
========================================================= */
function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-linear-to-br from-emerald-700 to-emerald-900 text-white rounded-3xl p-6 shadow-lg">
      <p className="text-emerald-100 text-sm">{title}</p>

      <h3 className="text-4xl font-bold mt-3">{value}</h3>
    </div>
  );
}
