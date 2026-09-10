import { StudentResultSnapshot } from "@/app/types/result-snapshot";

import SchoolLogo from "./SchoolLogo";
import StudentMetric from "./StudentMetric";
import StudentPhoto from "./StudentPhoto";
import { renderPosition } from "@/app/components/sections/Broadsheet/BroadsheetTable";
import { toMultiSentenceCase } from "@/app/services/results";

interface Props {
  snapshot: StudentResultSnapshot;
}

export default function StudentInformation({ snapshot }: Props) {
  const { student, school, summary, attendance, fees, assets, customization } =
    snapshot;

  return (
    <table
      className="
        w-full   border-[0.5px]
        border-gray-400      
        border-collapse
        text-[10px]
      
      "
    >
      <tbody>
        <tr>
          <td
            rowSpan={7}
            className="  border-[0.5px]
            border-gray-400
        "
          >
            <SchoolLogo logo={assets.logo} fallback={"/logo.png"} />
          </td>
          <td
            colSpan={4}
            className="  border-[0.5px]
            border-gray-400
            p-1"
          >
            <StudentMetric
              label="Name:"
              value={student.fullName}
              className="uppercase"
            />
          </td>
          <td
            rowSpan={7}
            className="border-[0.5px]
            border-gray-400"
          >
            <StudentPhoto
              image={
                student?.profilePicture ? student.profilePicture : "/avatar.png"
              }
              gender={student.gender}
              fallback={"/avatar.png"}
            />
          </td>
        </tr>

        <tr>
          <td
            className="  border-[0.5px]
            border-gray-400
            p-1"
          >
            <StudentMetric
              label="Class:"
              value={
                school.schoolClass.description ||
                `${school.schoolClass.name} ${school.schoolClass.arm}`
              }
              className="capitalize italic"
            />
          </td> 

          <td className="border-[0.5px] p-1">
            <StudentMetric
              label="Session:"
              value={school.session.name}
              className="uppercase"
            />
          </td>

          <td
            colSpan={2}
            className="border-[0.5px]
        border-gray-400
        p-1"
          >
            <StudentMetric
              label="Term:"
              value={school.term.name}
              className="capitalize"
            />
          </td>
        </tr>

        <tr>
          <td
            className="  border-[0.5px]
        border-gray-400
        p-1"
          >
            <StudentMetric
              label="Total:"
              value={`${summary.totalScore}/${summary.totalObtainableScore}`}
            />
          </td>

          {customization.classPosition && (
            <td
              className="border-[0.5px]
            border-gray-400
            p-1"
            >
              <StudentMetric
                label="Position:"
                value={renderPosition(summary.classPosition)}
              />
            </td>
          )}

          {customization.classSize && (
            <td
              colSpan={2}
              className="border-[0.5px]
            border-gray-400
            p-1"
            >
              <StudentMetric label="Class Size:" value={summary.classSize} />
            </td>
          )}
        </tr>

        <tr>
          <td
            className="border-[0.5px]
            border-gray-400
            p-1"
          >
            <StudentMetric label="Average:" value={summary.averageScore} />
          </td>

          {customization.classAverage && (
            <td
              className="border-[0.5px]
            border-gray-400
            p-1"
            >
              <StudentMetric label="Class Avg:" value={summary.classAverage} />
            </td>
          )}

          {customization.overallGrade && (
            <td
              colSpan={2}
              className="border-[0.5px]
                border-gray-400
                p-1"
            >
              <StudentMetric
                label="Grade:"
                value={`${toMultiSentenceCase(summary.overallGrade ?? "")}, ${toMultiSentenceCase(summary.overallRemark ?? "")}`}
                className="italic"
              />
            </td>
          )}
        </tr>

        <tr>
          {customization.highestLowestScores && (
            <>
              <td
                className="border-[0.5px]
                border-gray-400
                p-1"
              >
                <StudentMetric label="Highest:" value={summary.highestScore} />
              </td>

              <td
                className="border-[0.5px]
                border-gray-400
                p-1"
              >
                <StudentMetric label="Lowest:" value={summary.lowestScore} />
              </td>
            </>
          )}

          <td
            colSpan={2}
            className="border-[0.5px]
            border-gray-400
            p-1"
          >
            <StudentMetric label="Subjects:" value={summary.totalSubjects} />
          </td>
        </tr>

        <tr>
          <td
            colSpan={2}
            className="border-[0.5px]
            border-gray-400
            p-1"
          >
            <StudentMetric label="Attendance:" value={attendance.attendance} />
          </td>

          <td
            colSpan={2}
            className="border-[0.5px]
            border-gray-400
            p-1"
          >
            <StudentMetric
              label="Days Open:"
              value={attendance.daysSchoolOpened}
            />
          </td>
        </tr>

        <tr>
          <td colSpan={2} className="     border-gray-400 p-1">
            <StudentMetric label="Resumption:" value={summary.resumptionDate} />
          </td>

          <td colSpan={2} className="p-1">
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
