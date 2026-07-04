import Link from "next/link";
import { useState } from "react";

export default function ResultsSection({
  resultsByClass,
}: {
  resultsByClass: {
    id: number;
    name: string;
    arm?: string;
    students: {
      id: number;
      full_name: string;
      admission_number: string;
      results: {
        id: number;
        subject: string;
        ca_score: number;
        exam_score: number;
        total_score: number;
        grade: string;
        remark: string;
      }[];
    }[];
  }[];
}) {
  const [expandedClass, setExpandedClass] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Student Results</h2>

          <p className="text-gray-500 mt-1">
            View, manage and edit students' academic results class by class
          </p>
        </div>

        <Link
          href="/admin/results/new"
          className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium shadow-sm"
        >
          + Upload Results
        </Link>
      </div>

      {/* Classes */}
      <div className="space-y-6">
        {resultsByClass.length > 0 ? (
          resultsByClass.map((classItem) => {
            const isExpanded = expandedClass === classItem.id;

            return (
              <div
                key={classItem.id}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* CLASS HEADER */}
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {classItem.name}
                        {classItem.arm && ` - ${classItem.arm}`}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {classItem.students.length} Students
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/admin/classes/${classItem.id}`}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition text-sm"
                      >
                        View Class
                      </Link>

                      <button
                        onClick={() =>
                          setExpandedClass(isExpanded ? null : classItem.id)
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        {isExpanded ? "Hide Results" : "View Results"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* RESULTS TABLE */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left p-4 font-semibold text-gray-700">
                            Student
                          </th>

                          <th className="text-left p-4 font-semibold text-gray-700">
                            Admission No.
                          </th>

                          <th className="text-left p-4 font-semibold text-gray-700">
                            Subjects & Results
                          </th>

                          <th className="text-left p-4 font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {classItem.students.length > 0 ? (
                          classItem.students.map((student) => (
                            <tr
                              key={student.id}
                              className="border-t hover:bg-gray-50 align-top"
                            >
                              {/* STUDENT */}
                              <td className="p-4">
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {student.full_name}
                                  </p>
                                </div>
                              </td>

                              {/* ADMISSION */}
                              <td className="p-4 text-gray-700">
                                {student.admission_number}
                              </td>

                              {/* SUBJECTS */}
                              <td className="p-4">
                                <div className="space-y-3 min-w-[500px]">
                                  {student.results.map((result) => (
                                    <div
                                      key={result.id}
                                      className="border rounded-xl p-3 bg-gray-50"
                                    >
                                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                        <div>
                                          <h4 className="font-semibold text-gray-800">
                                            {result.subject}
                                          </h4>

                                          <p className="text-sm text-gray-500">
                                            CA: {result.ca_score} | Exam:{" "}
                                            {result.exam_score}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div className="text-center">
                                            <p className="text-xs text-gray-500">
                                              Total
                                            </p>

                                            <p className="font-bold text-lg text-blue-700">
                                              {result.total_score}
                                            </p>
                                          </div>

                                          <div className="text-center">
                                            <p className="text-xs text-gray-500">
                                              Grade
                                            </p>

                                            <p className="font-bold text-green-700">
                                              {result.grade}
                                            </p>
                                          </div>

                                          <div className="text-center">
                                            <p className="text-xs text-gray-500">
                                              Remark
                                            </p>

                                            <p className="font-medium text-gray-700">
                                              {result.remark}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* ACTIONS */}
                              <td className="p-4">
                                <div className="flex flex-col gap-2 min-w-[140px]">
                                  <Link
                                    href={`/admin/students/${student.id}`}
                                    className="px-4 py-2 text-center bg-gray-800 text-white rounded-lg hover:bg-black transition"
                                  >
                                    View Student
                                  </Link>

                                  <Link
                                    href={`/admin/results/student/${student.id}`}
                                    className="px-4 py-2 text-center bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                                  >
                                    Edit Results
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center p-8 text-gray-500"
                            >
                              No results found for this class
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-700">
              No Results Available
            </h3>

            <p className="text-gray-500 mt-2">
              Results uploaded from the backend will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
