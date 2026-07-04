"use client";
import { apiAction, apiHeaders, BASE_URL } from "@/app/lib/api";

import { ArmsType, ClassType, TeacherType } from "@/app/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClassesPage() {
  const router = useRouter();
  const [arms, setArms] = useState<ArmsType[]>([]);

  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherType[]>([]);

  const [classes, setClasses] = useState<any[]>([]);

  const [classStudents, setClassStudents] = useState<
    { class: ClassType; students: number }[]
  >([]);

  // ##################### handlers  ############### ///////
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await apiAction("academics", "teachers");

      setTeachers(res.results || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/academics/classes/`, {
        headers: apiHeaders(),
        method: "GET",
      });

      const response = await res.json();

      if (!res.ok) {
        throw response;
      }

      const classesData = response.results || [];

      setClasses(classesData);

      // FETCH STUDENT COUNTS FOR ALL CLASSES
      const classesWithStudents = await Promise.all(
        classesData.map(async (cls: ClassType) => {
          try {
            const studentRes = await apiAction(
              "academics",
              `classes/${cls.id}/students`,
              undefined,
              "GET",
            );

            return {
              class: studentRes.class,
              students: studentRes.students_count,
            };
          } catch (error) {
            console.error(
              `Failed to fetch students for class ${cls.id}`,
              error,
            );

            return {
              class: cls,
              students: 0,
            };
          }
        }),
      );

      setClassStudents(classesWithStudents);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchTeachers();

    fetchClasses();
  }, [classes.length, arms.length]);

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/*  */}
            <div className="">
              <h1 className="text-3xl font-bold text-gray-900">
                Assigned Classes
              </h1>
              <p className="text-gray-500 mt-1">Manage assigned classes</p>
            </div>
          </div>
        </div>

        {/* CLASSES TABLE */}
        <div className="bg-transparent rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                All Assigned Classes
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                View all your assigned classes in the school.
              </p>
            </div>

            <div className="w-full md:w-80">
              <input
                type="text"
                placeholder="Search classes..."
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Class
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Arm
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Students
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {classStudents.length > 0 ? (
                  classStudents.map((cls) => (
                    <tr
                      key={cls.class.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {cls.class.name}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                          {cls.class.arm.name}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {cls.students} Students
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/teachers/classes/${cls.class.id}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No classes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
