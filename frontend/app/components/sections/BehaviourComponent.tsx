"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { apiAction, apiHeaders, BASE_URL, createAction, handleUserDelete } from "@/app/lib/api";

import { ClassType, StudentType } from "@/app/lib/types";
import { Users, Trash2 } from "lucide-react";

/* =========================
   TYPES
========================= */
type BehaviourForm = {
	skills: string;
	politeness: string;
	neatness: string;
	self_control: string;
	relationship: string;
	attendance: string;
	punctuality: string;
	leadership: string;
};

const defaultForm: BehaviourForm = {
	skills: "A",
	politeness: "A",
	neatness: "A",
	self_control: "A",
	relationship: "A",
	attendance: "A",
	punctuality: "A",
	leadership: "A",
};

type StudentWithNullableBehaviour = Omit<StudentType, "behaviour_id"> & {
	behaviour_id: number | null;
};

const grades = ["A", "B", "C", "D", "E", "F"];

/* =========================
   COMPONENT
========================= */
export default function BehaviourComponent() {
	const { user, currentTerm } = useAuth();

	const [classes, setClasses] = useState<ClassType[]>([]);
	const [students, setStudents] = useState<StudentWithNullableBehaviour[]>([]);

	const [classId, setClassId] = useState<number | null>(null);

	const [selectedStudent, setSelectedStudent] = useState<StudentWithNullableBehaviour | null>(
		null,
	);

	const [loading, setLoading] = useState(false);
	const [form, setForm] = useState<BehaviourForm>(defaultForm);

	const [behaviourMap, setBehaviourMap] = useState<Record<number, any>>({});

	/* =========================
	   LOAD CLASSES
	========================= */
	const loadClasses = async () => {
		const res = await apiAction("academics", "classes");
		setClasses(res.results || res);
	};

	useEffect(() => {
		if (user) loadClasses();
	}, [user]);

	/* =========================
	   LOAD STUDENTS + BEHAVIOUR (PERSISTENCE FIX)
	========================= */
	const loadStudents = async (id: number) => {
		const res = await fetch(
			`${BASE_URL}/academics/classes/${id}/students/`,
			{ headers: apiHeaders() },
		);

		const data = await res.json();

		const studentsList = data.students || [];
		setStudents(studentsList);
		setSelectedStudent(null);

		// build behaviour map from backend
		const map: Record<number, any> = {};
		studentsList.forEach((s: any) => {
			if (s.behaviour_exists && s.behaviour_id) {
				map[s.id] = {
					id: s.behaviour_id,
					exists: true,
				};
			}
		});

		setBehaviourMap(map);
	};

	useEffect(() => {
		if (classId) loadStudents(classId);
	}, [classId]);

	/* =========================
	   PROGRESS
	========================= */
	const completedCount = useMemo(
		() => students.filter((s) => s.behaviour_exists).length,
		[students],
	);

	const pendingCount = useMemo(
		() => students.filter((s) => !s.behaviour_exists).length,
		[students],
	);

	const completionRate = useMemo(() => {
		if (!students.length) return 0;
		return Math.round((completedCount / students.length) * 100);
	}, [students, completedCount]);

	/* =========================
	   LOAD EXISTING BEHAVIOUR
	========================= */
	const loadBehaviour = async (student: StudentWithNullableBehaviour) => {
		if (!student.behaviour_id) {
			setForm(defaultForm);
			return;
		}

		const res = await fetch(
			`${BASE_URL}/results/behaviour/${student.behaviour_id}/`,
			{ headers: apiHeaders() },
		);

		const data = await res.json();

		setForm({
			skills: data.skills,
			politeness: data.politeness,
			neatness: data.neatness,
			self_control: data.self_control,
			relationship: data.relationship,
			attendance: data.attendance,
			punctuality: data.punctuality,
			leadership: data.leadership,
		});
	};

	/* =========================
	   SELECT STUDENT
	========================= */
	const selectStudent = async (student: StudentWithNullableBehaviour) => {
		setSelectedStudent(student);
		await loadBehaviour(student);
	};

	/* =========================
	   CLOSE MODAL
	========================= */
	const closeModal = () => {
		setSelectedStudent(null);
		setForm(defaultForm);
	};

	/* =========================
	   DELETE BEHAVIOUR
	========================= */
	const handleDelete = async (student: StudentWithNullableBehaviour) => {
		if (!student.behaviour_id) return;

		await handleUserDelete(
            "results",
            "behaviour",
            student.behaviour_id,
            `${student.user.full_name}'s behaviour record`
        );

		setStudents((prev) =>
			prev.map((s) =>
				s.id === student.id
					? {
							...s,
							behaviour_exists: false,
							behaviour_id: null,
						}
					: s
			)
		);
	};

	/* =========================
	   SUBMIT
	========================= */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedStudent || !currentTerm) return;

		setLoading(true);
        let res: any;
		try {
			const payload = {
				student: selectedStudent.id,
				term: currentTerm.id,
				session: currentTerm.session.id,
                school_class_id: classId && classId,
				...form,
			};

			let res: any;

			if (selectedStudent.behaviour_exists) {
				res = await fetch(
					`${BASE_URL}/results/behaviour/${selectedStudent.behaviour_id}/`,
					{
						method: "PUT",
						headers: {
							...apiHeaders(),
							"Content-Type": "application/json",
						},
						body: JSON.stringify(payload),
					},
				).then((r) => r.json());
			} else {
				res = await createAction(
					"results",
					"behaviour",
					payload,
					"POST",
				);
			}

			// update UI instantly (PERSISTENCE FIX)
			setStudents((prev) =>
				prev.map((s) =>
					s.id === selectedStudent.id
						? {
								...s,
								behaviour_exists: true,
								behaviour_id: res.behaviour_id || res.id,
							}
						: s,
				),
			);

			closeModal();
		} catch(error) {
            alert(`Something went wrong! ${res}`)
            return
        } finally {
			setLoading(false);
		}
	};

	return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="bg-linear-to-r from-emerald-500 to-emerald-700 rounded-3xl p-6 text-white">
        <h1 className="text-3xl font-bold">Behavioural Assessment</h1>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* CLASSES */}
        <div className="bg-white border rounded-3xl overflow-hidden">
          <div className="p-4 border-b bg-emerald-50 flex items-center gap-2">
            <Users />
            <h2 className="font-bold">Classes</h2>
          </div>

          <table className="w-full">
            <tbody>
              {classes.map((c) => (
                <tr
                  key={c.id}
                  className={`border-t cursor-pointer flex ${
                    classId === c.id ? "bg-emerald-100" : "hover:bg-emerald-50"
                  }`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={classId === c.id}
                      onChange={() => setClassId(c.id)}
                    />
                  </td>
                  <td className="p-4 w-full">
                    {c.name} {c.arm.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* STUDENTS */}
        <div className="bg-white border rounded-3xl overflow-hidden">
          <div className="p-4 border-b bg-emerald-50">
            <h2 className="font-bold">Students</h2>
          </div>

          <div className="p-3 text-sm">
            Completed: {completedCount} | Pending: {pendingCount} |{" "}
            {completionRate}%
          </div>

          <table className="w-full">
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.id}
                  className={`border-t ${
                    s.behaviour_exists ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  <td className="p-3 flex gap-2 items-center">
                    <img
                      src={s.user.profile_picture || "/avatar.png"}
                      alt=""
                      className="object-cover w-11 h-11 rounded-full"
                    />
                    <span>{s.user.full_name}</span>
                  </td>

                  <td className="p-3 gap-2 items-center">
                    {s.behaviour_exists ? "Completed" : "Pending"}
                  </td>

                  <td className="p-3  flex gap-2 items-center ">
                    {!s.behaviour_exists ? (
                      <button
                        onClick={() => selectStudent(s)}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg"
                      >
                        Assess
                      </button>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => selectStudent(s)}
                          className="px-3 py-1 bg-amber-500 text-white rounded-lg flex items-center gap-2"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(s)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-3xl w-125"
          >
            <h2 className="text-xl font-bold mb-4">
              {selectedStudent.user.full_name}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {Object.keys(form).map((key) => (
                <div key={key}>
                  <label className="text-sm capitalize">{key}</label>
                  <select
                    value={(form as any)[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded-lg"
                  >
                    {grades.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-2 rounded-xl"
                disabled={loading}
              >
                Save
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="flex-1 bg-gray-300 py-2 rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
