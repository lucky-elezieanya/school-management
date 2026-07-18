import { StudentResultSnapshot } from "@/app/types/result-snapshot";

import SchoolLogo from "./SchoolLogo";
import StudentMetric from "./StudentMetric";
import StudentPhoto from "./StudentPhoto";

interface Props {
  snapshot: StudentResultSnapshot;
}

export default function StudentInformation({ snapshot }: Props) {
  const { student, school, summary, attendance, fees, assets, customization } =
    snapshot;

  return (
    <table
      className="
        w-full
        border
        border-[#555]
        border-collapse
        text-[10px]
        mt-2
      "
    >
      <tbody>
        <tr>
          <td rowSpan={7} className="border border-[#555]">
            <SchoolLogo logo={assets.logo } fallback={assets.defaultLogo} />
          </td>

          <td colSpan={4} className="border border-[#555] px-2 py-1">
            <StudentMetric label="Name:" value={student.fullName} />
          </td>

          <td rowSpan={7} className="border border-[#555]">
            <StudentPhoto
              image={student.profilePicture}
              gender={student.gender}
              fallback={assets.defaultAvatar}
            />
          </td>
        </tr>

        <tr>
          <td className="border border-[#555] px-2 py-1">
            <StudentMetric
              label="Class:"
              value={school.schoolClass.description}
            />
          </td>

          <td className="border border-[#555] px-2 py-1">
            <StudentMetric label="Session:" value={school.session.name} />
          </td>

          <td colSpan={2} className="border border-[#555] px-2 py-1">
            <StudentMetric label="Term:" value={school.term.name} />
          </td>
        </tr>

        <tr>
          <td className="border border-[#555] px-2 py-1">
            <StudentMetric
              label="Total:"
              value={`${summary.totalScore}/${summary.totalObtainableScore}`}
            />
          </td>

          {customization.classPosition && (
            <td className="border border-[#555] px-2 py-1">
              <StudentMetric label="Position:" value={summary.classPosition} />
            </td>
          )}

          {customization.classSize && (
            <td colSpan={2} className="border border-[#555] px-2 py-1">
              <StudentMetric label="Class Size:" value={summary.classSize} />
            </td>
          )}
        </tr>

        <tr>
          <td className="border border-[#555] px-2 py-1">
            <StudentMetric label="Average:" value={summary.averageScore} />
          </td>

          {customization.classAverage && (
            <td className="border border-[#555] px-2 py-1">
              <StudentMetric label="Class Avg:" value={summary.classAverage} />
            </td>
          )}

          {customization.overallGrade && (
            <td colSpan={2} className="border border-[#555] px-2 py-1">
              <StudentMetric
                label="Grade:"
                value={`${summary.overallGrade ?? ""} ${summary.overallRemark ?? ""}`}
              />
            </td>
          )}
        </tr>

        <tr>
          {customization.highestLowestScores && (
            <>
              <td className="border border-[#555] px-2 py-1">
                <StudentMetric label="Highest:" value={summary.highestScore} />
              </td>

              <td className="border border-[#555] px-2 py-1">
                <StudentMetric label="Lowest:" value={summary.lowestScore} />
              </td>
            </>
          )}

          <td colSpan={2} className="border border-[#555] px-2 py-1">
            <StudentMetric label="Subjects:" value={summary.totalSubjects} />
          </td>
        </tr>

        <tr>
          <td colSpan={2} className="border border-[#555] px-2 py-1">
            <StudentMetric label="Attendance:" value={attendance.attendance} />
          </td>

          <td colSpan={2} className="border border-[#555] px-2 py-1">
            <StudentMetric
              label="Days Open:"
              value={attendance.daysSchoolOpened}
            />
          </td>
        </tr>

        <tr>
          <td colSpan={2} className="border border-[#555] px-2 py-1">
            <StudentMetric label="Resumption:" value={summary.resumptionDate} />
          </td>

          <td colSpan={2} className="border border-[#555] px-2 py-1">
            <StudentMetric
              label="Next Fees:"
              value={`₦${fees.nextFees.toLocaleString()}`}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}
