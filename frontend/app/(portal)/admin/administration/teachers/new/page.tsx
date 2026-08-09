"use client";

import { useState, useEffect } from "react";
import { apiAction, createAction } from "@/app/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClassType } from "@/app/lib/types";
import { ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";

export default function NewteacherPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    date_of_birth: new Date("2010-10-01").toISOString().split("T")[0],
    gender: "",
    profile_picture: null as File | null,
    middle_name: "",
    password: "",
    qualification: "",
    address: "",
    phone_number: "",
    date_employed: "",
    assigned_classes: [] as (number | string)[],
    email: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleClassToggle = (classId: number | string) => {
    const currentClasses = formData.assigned_classes || [];
    const exists = currentClasses.some((id) => String(id) === String(classId));

    const updatedClasses = exists
      ? currentClasses.filter((id) => String(id) !== String(classId))
      : [...currentClasses, classId];

    setFormData((prev) => ({
      ...prev,
      assigned_classes: updatedClasses,
    }));
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

  /* =========================
        CREATE teacher
    ========================== */
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      const payload = { ...formData };
      if (!payload.profile_picture) {
        delete (payload as any).profile_picture;
      }

      const res = await createAction("academics", "teachers", payload);

      if (res) {
        toast.success("Teacher created successfully");
        router.push("/admin/administration/teachers");
      }
    } catch (error) {
      toast.error("Failed to create teacher");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch classes from backend when component mounts
    apiAction("academics", "classes").then((data) => {
      setClasses(data.results || []);
    });
  }, []);

  return (
    <div className="min-h-screen bg-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="top flex items-center justify-between mb-4 relative">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-900">
              Add New Teachers
            </h1>

            <p className="text-gray-600 mt-2">Create teachers manually</p>
          </div>
          <Link
            href="/admin/administration"
            className="flex items-center gap-4"
          >
            <button className="px-4 py-2 bg-red-700 text-gray-100 inline-flex gap-2 rounded-lg hover:bg-red-400 transition">
              <ArrowLeft size={24} />
              <span>Back to Dashboard</span>
            </button>
          </Link>
        </div>

        {/* ================ FORM MODE ========== */}
        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10">
          <form onSubmit={handleFormSubmit} className="space-y-10">
            {/* ================= teacher INFO ================= */}
            <div>
              <h2 className="text-xl font-semibold text-green-900 mb-6">
                Teacher Information
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Enter first name"
                  />
                </div>

                {/* Middle Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>

                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Enter middle name"
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Enter last name"
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Enter username"
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Enter password"
                  />
                </div>

                {/* Qualification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification
                  </label>

                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Enter qualification details"
                  />
                </div>

                {/* Multiple Classes Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Classes
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-xl min-h-[50px] bg-gray-50">
                    {classes.map((cls: any) => {
                      const isSelected = formData.assigned_classes.some(
                        (id) => String(id) === String(cls.id),
                      );
                      const isAssigned = Boolean(
                        cls.class_teacher || cls.teacher,
                      );

                      return (
                        <button
                          key={cls.id}
                          type="button"
                          disabled={isAssigned}
                          title={
                            isAssigned
                              ? "Teacher already assigned to this class"
                              : ""
                          }
                          onClick={() => handleClassToggle(cls.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                            isAssigned
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                              : isSelected
                              ? "bg-green-800 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          <span>
                            {cls.name}{" "}
                            {cls.arm?.name ? `- ${cls.arm.name}` : ""}
                          </span>
                          {isSelected && <X size={14} />}
                        </button>
                      );
                    })}
                  </div>
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
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
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>

                {/* Date Employed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Employment
                  </label>

                  <input
                    type="date"
                    name="date_employed"
                    value={formData.date_employed}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>

                {/* Profile picture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture (optional)
                  </label>
                  <img
                    src={
                      formData.profile_picture instanceof File
                        ? URL.createObjectURL(formData.profile_picture)
                        : "/avatar.png"
                    }
                    alt="profile"
                    className="w-20 h-20 rounded-full object-cover mb-2"
                  />
                  <input
                    type="file"
                    name="profile_picture"
                    onChange={handleFileChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold text-green-900 mb-6">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher's Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Enter teacher email"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher's Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher's Address
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-700"
                    placeholder="Enter teacher's address"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-800 hover:bg-green-900 transition text-white py-4 rounded-xl font-semibold disabled:opacity-50"
              >
                {loading ? "Creating Teacher..." : "Create Teacher"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}