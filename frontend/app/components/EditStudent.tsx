"use client";

import { useState, useEffect } from "react";
import { updateAction as updateStudent, apiAction, apiHeaders, BASE_URL } from "@/app/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClassType, StudentFormDataType, StudentType } from "@/app/lib/types";
import { ArrowLeft } from "lucide-react";
import { getClasses } from "../services/academics";
import { useAuth } from "../lib/hooks/useAuth";

export default function EditStudent({ studentId }: { studentId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [classes, setClasses] = useState<ClassType[] | []>([]);

  const [formData, setFormData] = useState<StudentFormDataType>({
    first_name: "",
    last_name: "",
    username: "",
    date_of_birth: "",
    current_class: "",
    admission_number: "",
    gender: "",
    profile_picture: "",
    middle_name: "",
    parent_email: "",
    parent_phone: "",
    parent_first_name: "",
    parent_last_name: "",
    parent_address: "",
    password: "1234",
  });
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      setFile(selectedFile);

      setFormData((prev) => ({
        ...prev,
        profile_picture: selectedFile,
      }));
    }
  };

  useEffect(() => {
    const loadClasses = async () => {
      const res = await getClasses();
      if (res) {
        setClasses(res.results || []);
      }
    };
    loadClasses();
  }, []);

  /* =========================
        update STUDENT
    ========================== */
  const handleFormSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    const payload = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "current_class") {
        if (value && value !== "") {
          payload.append("current_class", String(Number(value))); // Ensures clean integer string like "5"
        }
      } else if (key === "profile_picture") {
        if (value instanceof File) {
          payload.append("profile_picture", value);
        }
      } else if (value !== null && value !== undefined && value !== "") {
        payload.append(key, value);
      }
    });
    try {
      const res  = await fetch(`${BASE_URL}/academics/students/${studentId}/`, {
		method: "PUT",
		headers: apiHeaders(),
		body: payload,
	})

      if (res.ok) {
        alert("Student updated successfully");
        router.push(`/admin/administration/students/${studentId}`);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await apiAction("academics", "students", studentId, "GET");
        console.log(res);

        setStudent(res);
        console.log(student);

        setFormData({
          first_name: res.user.first_name || "",
          last_name: res.user.last_name || "",
          username: res.user.username || "",
          date_of_birth: res.user.date_of_birth || "",
          current_class: String(res.current_class?.id || ""),
          admission_number: res.admission_number || "",
          gender: res.user.gender || "",
          profile_picture: res.user.profile_picture || "",
          middle_name: res.user.middle_name || "",
          parent_email: res.parent_email || "",
          parent_phone: res.parent_phone || "",
          parent_first_name: res.parent_first_name || "",
          parent_last_name: res.parent_last_name || "",
          parent_address: res.parent_address || "",
          password: res.user.password || "1234",
        });

        console.log("form data: ", formData);
      } catch (error) {
        console.error("Failed to fetch student:", error);
      }
    };

    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);
  return (
    <div className="min-h-screen bg-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="top flex items-center justify-between mb-4 relative">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-emerald-900">
              Edit Student
            </h1>

            <p className="text-gray-600 mt-2">Update student record.</p>
          </div>
          <Link href="/admin" className="flex items-center gap-4">
            <button className="px-4 inline-flex gap-2 py-2 bg-red-700 text-gray-100 rounded-lg hover:bg-red-400 transition">
              <ArrowLeft size={24} /> <span>Back to Dashboard</span>
            </button>
          </Link>
        </div>

        {/* =========================
                    FORM 
                ========================== */}

        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10">
          <form onSubmit={handleFormSubmit} className="space-y-10">
            {/* ================= STUDENT INFO ================= */}
            <div>
              <h2 className="text-xl font-semibold text-emerald-900 mb-6">
                Student Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>

                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="Edit first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>

                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="Edit middle name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="Edit last name"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>

                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="CHange username"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>

                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="Enter password"
                  />
                </div>

                {/* Admission Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admission Number
                  </label>

                  <input
                    type="text"
                    name="admission_number"
                    value={formData.admission_number}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    placeholder="Enter admission number"
                  />
                </div>

                {/* Class */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  {
                  user?.role === "admin" ? (
                    <select
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      value={formData.current_class}
                      onChange={handleChange}
                      name="current_class"
                    >
                      <option value="">Select Class</option>
                      {classes &&
                        classes.length > 0 &&
                        classes.map((cls) => {
                          return (
                            <option key={cls.id} value={cls.id}>
                              {cls.name} {cls.arm.name}
                            </option>
                          );
                        })}
                    </select>
                  ): (
                    <p className="py-2 px-4">{student?.current_enrollment.school_class.name}</p>
                  )
                  }
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                {/*Profile picture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Passport (optional)
                  </label>
                  <img
                    src={
                      formData.profile_picture instanceof File
                        ? URL.createObjectURL(formData.profile_picture)
                        : formData.profile_picture || "/avatar.png"
                    }
                    alt="profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <input
                    type="file"
                    name="profile_picture"
                    onChange={handleFileChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* ================= PARENT INFO ================= */}
            <div>
              <div className="border-t pt-8">
                <h2 className="text-xl font-semibold text-emerald-900 mb-6">
                  Parent Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Parent First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent First Name
                    </label>

                    <input
                      type="text"
                      name="parent_first_name"
                      value={formData.parent_first_name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="Enter parent first name"
                    />
                  </div>

                  {/* Parent Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Last Name
                    </label>

                    <input
                      type="text"
                      name="parent_last_name"
                      value={formData.parent_last_name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="Enter parent last name"
                    />
                  </div>

                  {/* Parent Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Email
                    </label>

                    <input
                      type="email"
                      name="parent_email"
                      value={formData.parent_email}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="Enter parent email"
                    />
                  </div>

                  {/* Parent Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Phone
                    </label>

                    <input
                      type="tel"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="Enter parent phone"
                    />
                  </div>
                  {/* Parent Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parent Address
                    </label>

                    <input
                      type="text"
                      name="parent_address"
                      value={formData.parent_address}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      placeholder="Enter parent address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 transition text-white py-4 rounded-xl font-semibold disabled:opacity-50"
              >
                {loading ? "Updating Student..." : "Update Student"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
