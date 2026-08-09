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
  Pencil,
  Trash2,
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiAction, handleUserDelete } from "@/app/lib/api";
import { TeacherType } from "@/app/lib/types";
import { InfoCard } from "@/app/components/Cards";

export default function Teacher() {
  const params = useParams();
  const router = useRouter();
  const teacherId = Number(params.id);
  const [teacher, setTeacher] = useState<TeacherType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ======================================
       FETCH teacher
    ====================================== */
  useEffect(() => {
    if (!teacherId) return;

    const fetchTeacher = async () => {
      try {
        setLoading(true);

        const data = await apiAction("academics", "teachers", teacherId);
        data && setTeacher(data);
      } catch (err) {
        console.error(err);

        setError("Failed to load teacher");
      } finally {
        setLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacher();
    }
    if (teacher) {
      setLoading(false);
    }
  }, [teacherId]);

  /* ======================================
       LOADING STATE
    ====================================== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg font-medium text-gray-600">
          Loading teacher details...
        </p>
      </div>
    );
  }

  /* ======================================
       ERROR STATE
    ====================================== */
  if (error || !teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-600 font-medium">
            {error || "teacher not found"}
          </p>

          <Link
            href="/admin/administration/teachers"
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
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/teachers"
              className="bg-white/10 hover:bg-white/20 transition p-3 rounded-xl"
            >
              <ArrowLeft size={22} />
            </Link>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Teacher Profile
              </h1>

              <p className="text-emerald-100 mt-1">
                View and manage teacher details
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/admin/administration/teachers/${teacherId}/edit`)}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 transition px-5 py-3 rounded-xl font-medium shadow"
            >
              <Pencil size={18} />
              Edit teacher
            </button>
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
                    src={teacher?.user?.profile_picture || "/avatar.png"}
                    alt="teacher"
                    fill
                    className="object-cover"
                  />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mt-5 text-center">
                  {teacher.user.full_name}{" "}
                </h2>

                <p className="text-gray-500 mt-1">@{teacher.user.username}</p>

                <div className="mt-4 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
                  teacher
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-emerald-700" size={20} />

                  <div>
                    <p className="text-sm text-gray-500">Qualifications</p>

                    <p className="font-semibold text-gray-800">
                      {teacher.qualification}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-emerald-700" size={20} />

                  <div>
                    <p className="text-sm text-gray-500">Date Employed</p>

                    <p className="font-semibold text-gray-800">
                      {teacher.date_employed}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays className="text-emerald-700" size={20} />

                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>

                    <p className="font-semibold text-gray-800 inline-flex gap-3">
                      <span>{teacher.user.date_of_birth}</span>

                      <span>{teacher.user.age} years old</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="text-emerald-700" size={20} />

                  <div>
                    <p className="text-sm text-gray-500">Gender</p>

                    <p className="font-semibold text-gray-800">
                      {teacher.user.gender[0].toUpperCase() +
                        teacher.user.gender.slice(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            {/* teacher INFO */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-emerald-900 mb-8">
                Teacher's Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  icon={<User size={18} />}
                  label="First Name"
                  value={teacher.user.first_name}
                />
                <InfoCard
                  icon={<User size={18} />}
                  label="Middle Name"
                  value={teacher.user.middle_name}
                />
                <InfoCard
                  icon={<User size={18} />}
                  label="Last Name"
                  value={teacher.user.last_name}
                />
                <InfoCard
                  icon={<Users size={18} />}
                  label="Username"
                  value={teacher.user.username}
                />
                {teacher.assigned_classes?.length ? (
                  teacher.assigned_classes.map((cls, index) => (
                    <InfoCard
                      key={cls.id}
                      icon={<BookOpen size={18} />}
                      label={index === 0 ? "Classes Assigned" : ""}
                      value={`${cls.name}${cls.arm?.name ? ` - ${cls.arm.name}` : ""}`}
                    />
                  ))
                ) : (
                  <InfoCard
                    icon={<BookOpen size={18} />}
                    label="Classes Assigned"
                    value="N/A"
                  />
                )}{" "}
              </div>
            </div>

            {/* PARENT INFO */}
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-emerald-900 mb-8">
                Teacher Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  icon={<User size={18} />}
                  label="First Name"
                  value={teacher.user.first_name}
                />

                <InfoCard
                  icon={<User size={18} />}
                  label="Last Name"
                  value={teacher.user.last_name}
                />

                <InfoCard
                  icon={<Mail size={18} />}
                  label="Parent Email"
                  value={teacher?.user?.email}
                />

                <InfoCard
                  icon={<Phone size={18} />}
                  label="Phone Number"
                  value={teacher.phone_number}
                />

                <div className="md:col-span-2">
                  <InfoCard
                    icon={<MapPin size={18} />}
                    label="Address"
                    value={teacher.address}
                  />
                </div>
              </div>
            </div>

        
          </div>
        </div>
      </div>
    </div>
  );
}
