import {
  AwardIcon,
  Banknote,
  BookAIcon,
  Brain,
  FileBarChart,
  FileLock2Icon,
  GraduationCap,
  HousePlus,
  School,
  UserCheck2,
  UserCog,
  ArrowUpCircle,
  CalendarClock,
  PenBox,
  UserPlus2,
  BookCopyIcon,
  Calculator,
  FileOutput,
  FilePlus,
  FileSearch,
} from "lucide-react";
import Link from "next/link";

export default function AdministrationPage() {
  const navLinks = [
    {
      name: "Classes and Arms",
      href: "/admin/administration/classes",
      icon: School,
    },
    {
      name: "Sessions and Terms",
      href: "/admin/administration/sessions",
      icon: BookCopyIcon,
    },
    {
      name: "Students",
      href: "/admin/administration/students",
      icon: GraduationCap,
    },
    {
      name: "Enroll Students",
      href: "/admin/administration/enrollments",
      icon: UserPlus2,
    },
    {
      name: "Teachers",
      href: "/admin/administration/teachers",
      icon: UserCog,
    },
    {
      name: "Subjects",
      href: "/admin/administration/subjects/new",
      icon: BookAIcon,
    },
    {
      name: "Grades",
      href: "/admin/administration/grades",
      icon: AwardIcon,
    },
    {
      name: "Behavioural qualities",
      href: "/admin/administration/behaviour",
      icon: Brain,
    },
    {
      name: "Student Attendance",
      href: "/admin/administration/attendance",
      icon: UserCheck2,
    },
    {
      name: "School Open Days",
      href: "/admin/administration/attendance/days_school_opened",
      icon: CalendarClock,
    },
    {
      name: "Term Comments",
      href: "/admin/administration/comments",
      icon: PenBox,
    },
    {
      name: "Set Max scores",
      href: "/admin/administration/classScores",
      icon: FileBarChart,
    },
    {
      name: "Results Entry",
      href: "/admin/administration/results",
      icon: FileBarChart,
    },
    {
      name: "Preview/Approve Results",
      href: "/admin/administration/results/preview",
      icon: FileOutput,
    },
    {
      name: "View Results",
      href: "/admin/administration/results/view",
      icon: FileSearch,
    },
    {
      name: "Customize Results",
      href: "/admin/administration/results/customize",
      icon: BookAIcon,
    },
    {
      name: "Generate Results PDFs",
      href: "/admin/administration/results/generate",
      icon: FilePlus,
    },
    {
      name: "Results Access",
      href: "/admin/administration/resultsAccess",
      icon: FileLock2Icon,
    },
    {
      name: "Compute Results",
      href: "/admin/administration/compute",
      icon: Calculator,
    },
    {
      name: "Resumption Date",
      href: "/admin/administration/resumption-dates",
      icon: CalendarClock,
    },

    {
      name: "Fees",
      href: "/admin/administration/fees",
      icon: Banknote,
    },
    {
      name: "Promotions",
      href: "/admin/administration/promotions",
      icon: ArrowUpCircle,
    },
    {
      name: "Class Teacher Signature",
      href: "/admin/administration/class_teacher_signature",
      icon: PenBox,
    },
    {
      name: "Header Teacher Signature",
      href: "/admin/administration/head_teacher_signature",
      icon: PenBox,
    },
    {
      name: "School Logo",
      href: "/admin/administration/schoolHeader",
      icon: HousePlus,
    },
  ];
  return (
    <div className="grid lg:grid-cols-4 grid-cols-2 md:grid-cols-2 gap-6">
      {navLinks.map((link, index) => (
        <div className="col-span-1 m-10" key={link.name}>
          <Link
            href={`${link.href}`}
            className="p-6 w-40 h-40 items-center justify-center rounded-lg bg-gray-100 flex flex-col gap-3 text-center border-emerald-400 border-2 "
          >
            <link.icon size={64} className="text-emerald-400" />

            <span>
              {index + 1}. {link.name}
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}
