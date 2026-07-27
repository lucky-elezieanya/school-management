"use client";

import { useState, useEffect } from "react";
import {
  uploadFile,
  apiAction,
  createAction,
  apiHeaders,
  BASE_URL,
} from "@/app/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArmsType, ClassType } from "@/app/lib/types";
import { toast } from "sonner";
import { Loader2, PlayCircle, Terminal } from "lucide-react";

type Status = "idle" | "queued" | "processing" | "done" | "failed";

export default function NewStudentPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"form" | "upload">("form");
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [arms, setArms] = useState<ArmsType[]>([]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    date_of_birth: "",
    class_id: "" as string,
    admission_number: "",
    gender: "",
    profile_picture: null as File | null,
    middle_name: "",
    parent_email: "",
    parent_phone: "",
    parent_first_name: "",
    parent_last_name: "",
    parent_address: "",
    password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "class_id" ? (value === "" ? "" : Number(value)) : value,
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
        CREATE STUDENT
    ========================== */
  const handleFormSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await createAction("academics", "students", formData);

      if (res) {
        toast.success("Student created successfully");
        router.push("/admin/administration/students");
      }
    } catch (error) {
      console.log(error);

      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
        UPLOAD STUDENTS
    ========================== */
  const handleUploadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a spreadsheet.");
      return;
    }

    setLoading(true);

    try {
      const res = await uploadFile(file);

      toast.success(res.message);

      alert(
        `Student import completed.
      
      Created: ${res.created_count}
      Skipped: ${res.skipped_count}
      Completed at: ${new Date(res.completed_at).toLocaleString()}`,
      );

      setFile(null);
    } catch (error: any) {
      toast.error(
        error?.error ?? error?.detail ?? "Something went wrong during upload.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch classes from backend when component mounts
    apiAction("academics", "classes").then((data) => {
      setClasses(data.results || []);
    });
    apiAction("academics", "arms").then((data) => {
      setArms(data.results || []);
    });
  }, []);

  return (
    <div className="min-h-screen bg-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="top flex items-center justify-between mb-4 relative">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-emerald-900">
              Add New Students
            </h1>

            <p className="text-gray-600 mt-2">
              Create students manually or upload an Excel spreadsheet.
            </p>
          </div>
          <Link
            href="/admin/administration"
            className="flex items-center gap-4"
          >
            <button className="px-4 py-2 bg-red-700 text-gray-100 rounded-lg hover:bg-red-400 transition">
              Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => setMode("form")}
            className={`px-5 py-3 rounded-xl font-medium transition ${
              mode === "form"
                ? "bg-emerald-800 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            Manual Entry
          </button>

          <button
            onClick={() => setMode("upload")}
            className={`px-5 py-3 rounded-xl font-medium transition ${
              mode === "upload"
                ? "bg-emerald-800 text-white"
                : "bg-white text-gray-700 border"
            }`}
          >
            Upload Spreadsheet
          </button>
        </div>

        {/* =========================
                    FORM MODE
                ========================== */}
        {mode === "form" && (
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
                      placeholder="Enter first name"
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
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
                    {classes.length > 0 ? (
                      <select
                        name="class_id"
                        value={formData.class_id ?? ""}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      >
                        <option value="">Select class</option>
                        {classes.map((cls: ClassType) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} - {cls.arm.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <a
                        href="/admin/classes"
                        className="outline-none font-bold text-gray-600 p-4 rounded-lg"
                      >
                        Go back and add classes to continue
                      </a>
                    )}
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
                  {loading ? "Creating Student..." : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================
                    UPLOAD MODE
                ========================== */}
        {mode === "upload" && (
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10">
            <h2 className="text-2xl font-semibold text-emerald-900 mb-4">
              Upload Spreadsheet
            </h2>

            <p className="text-gray-600 mb-8">
              Upload an Excel or CSV file containing student records.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-6">
              <div className="border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-3xl p-10 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="block mx-auto"
                />

                {file && (
                  <p className="mt-4 text-emerald-800 font-medium text-sm">
                    Selected File: {file.name}
                  </p>
                )}
              </div>
              {/* ================= SAMPLE SPREADSHEET ================= */}
              <div className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-900">
                      Spreadsheet Format Guide
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      Ensure your Excel or CSV file follows this exact
                      structure.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-emerald-100 shadow-sm">
                  <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="bg-emerald-800 text-white">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">
                          first_name
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          middle_name
                        </th>

                        <th className="px-4 py-3 whitespace-nowrap">
                          last_name
                        </th>

                        <th className="px-4 py-3 whitespace-nowrap">
                          username
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          current_class
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">arm</th>

                        <th className="px-4 py-3 whitespace-nowrap">gender</th>

                        <th className="px-4 py-3 whitespace-nowrap">
                          admission_number
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          password
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          date_of_birth
                        </th>

                        <th className="px-4 py-3 whitespace-nowrap">
                          parent_first_name
                        </th>

                        <th className="px-4 py-3 whitespace-nowrap">
                          parent_last_name
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">
                          parent_email
                        </th>

                        <th className="px-4 py-3 whitespace-nowrap">
                          parent_phone
                        </th>

                        <th className="px-4 py-3 whitespace-nowrap">
                          parent_address
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      <tr className="border-b border-gray-100 hover:bg-pink-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap">John</td>
                        <td className="px-4 py-3 whitespace-nowrap">Ivy</td>

                        <td className="px-4 py-3 whitespace-nowrap">Doe</td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          cozss001
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">JSS1</td>
                        <td className="px-4 py-3 whitespace-nowrap">A</td>

                        <td className="px-4 py-3 whitespace-nowrap">male</td>

                        <td className="px-4 py-3 whitespace-nowrap">ADM001</td>
                        <td className="px-4 py-3 whitespace-nowrap">1234</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          2012-05-14
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">Jane</td>

                        <td className="px-4 py-3 whitespace-nowrap">Doe</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          parent@example.com
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          08012345678
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          12 Aba Road, Port Harcourt
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tips */}
                <div className="mt-4 bg-pink-50 border border-pink-100 rounded-2xl p-4">
                  <h4 className="font-semibold text-emerald-900 mb-2">
                    Important Notes
                  </h4>

                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>The column names must match exactly as shown above.</li>

                    <li>
                      Date format should be:
                      <span className="font-medium"> YYYY-MM-DD</span>
                    </li>

                    <li>
                      Accepted file types:
                      <span className="font-medium"> .xlsx, .xls, .csv</span>
                    </li>

                    <li>Do not leave required fields empty.</li>

                    <li>Each row represents one student record.</li>
                  </ul>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-800 transition text-white py-4 text-center justify-center flex items-center rounded-xl font-semibold disabled:opacity-50 my-4"
              >
                {status === "processing" ? (
                  <span className="flex gap-2 justify-center items-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  <span className="flex gap-2 justify-center items-center">
                    <PlayCircle className="w-4 h-4" />
                    Upload Students data
                  </span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
