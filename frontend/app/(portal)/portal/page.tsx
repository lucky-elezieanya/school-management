import Footer from "@/app/components/sections/Footer";
import {
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Clock3,
  FileText,
  CreditCard,
  CalendarDays,
  Bell,
  BookOpen,
  Users,
  ClipboardCheck,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: FileText,
    title: "Results",
    description:
      "View, download and print examination results securely from anywhere.",
  },
  //   {
  //     icon: CreditCard,
  //     title: "School Fees",
  //     description:
  //       "Track fee payments, balances and print payment receipts instantly.",
  //   },
  {
    icon: CalendarDays,
    title: "Attendance",
    description:
      "Parents and students can monitor attendance records throughout the term.",
  },
  //   {
  //     icon: BookOpen,
  //     title: "Assignments",
  //     description:
  //       "Receive assignments, learning materials and classroom resources.",
  //   },
  {
    icon: Bell,
    title: "Announcements",
    description: "Stay informed with important notices and school updates.",
  },
  {
    icon: ClipboardCheck,
    title: "Teacher Workspace",
    description:
      "Teachers can upload scores, manage assessments and submit results.",
  },
  {
    icon: Users,
    title: "Student Records",
    description:
      "Securely access academic and personal information whenever required.",
  },
  {
    icon: BarChart3,
    title: "Administration",
    description:
      "Powerful tools for managing classes, reports, admissions and more.",
  },
];

export default function CozziPortal() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="School Logo"
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-700 shadow-sm"
            />

            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-extrabold text-emerald-900 leading-tight">
                Cozzi Schools
              </h1>

              <small className="text-[10px] sm:text-xs italic text-gray-500">
                ...children are the heritage of the Lord
              </small>
            </div>
          </div>

          {/* NAV LINKS */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="px-4 sm:px-5 py-2 text-sm font-semibold bg-emerald-800 text-white rounded-xl hover:bg-emerald-900 transition shadow-md"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}

      <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700 pt-16 md:pt-24 text-white">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-12 items-end">
          {/* Left Column: Text & CTA */}
          <div className="text-center md:text-left z-10 pb-16 md:pb-24">
            <div className="mb-6 inline-flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/10">
              <GraduationCap className="mr-2" size={18} />
              <span className="text-sm font-medium">
                Student • Parent • Teacher • Administration
              </span>
            </div>

            <h1 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Welcome to the
              <br />
              Cozzi School Portal
            </h1>

            <p className="mx-auto md:mx-0 mb-10 max-w-xl text-lg text-green-100/90 leading-relaxed">
              A secure digital platform designed to connect students, parents,
              teachers and administrators. Access academic records, school
              services and important information anytime, anywhere.
            </p>

            <Link
              href={"/login"}
              className="inline-flex items-center gap-2 rounded-xl bg-pink-500 px-8 py-4 text-lg font-semibold transition hover:bg-pink-600 shadow-lg shadow-pink-500/25"
            >
              Login to Portal
              <ArrowRight size={20} />
            </Link>
          </div>

          {/* Right Column: Student with New Theme-Matching Design */}
          <div className="relative hidden md:flex justify-center items-end self-end">
            {/* 1. Large, Deep Green Radial Mask (Base Layer) */}
            <div className="absolute size-[550px] lg:size-[600px] rounded-full bg-green-950 opacity-40 blur-2xl -bottom-10" />

            {/* 2. Abstract, Thematic Patterned Circles (Static) */}
            <div className="absolute size-[480px] lg:size-[520px] rounded-full border border-green-600 opacity-20 -bottom-5" />
            <div className="absolute size-[440px] lg:size-[480px] rounded-full border-dashed border-green-500 opacity-15 -bottom-5" />
            <div className="absolute size-[400px] lg:size-[440px] rounded-full border border-green-400 opacity-10 -bottom-5" />

            {/* 3. Subtle, Thematic Concentric Rotation (Animated Layer) */}
            <div className="absolute size-[350px] lg:size-[400px] rounded-full border-2 border-green-700 opacity-30 animate-spin-slow-reverse -bottom-5" />
            <div className="absolute size-[320px] lg:size-[370px] rounded-full border border-dashed border-green-600 opacity-25 animate-spin-slow -bottom-5" />

            {/* Student Image */}
            <img
              src="/student.png"
              alt="Student holding book"
              className="relative z-10 max-h-[500px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features */}

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-14 text-center">
          <h3 className="text-4xl font-bold text-green-900">
            Everything You Need in One Place
          </h3>

          <p className="mt-4 text-gray-600">
            The portal provides fast, secure and convenient access to important
            school services.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-5 inline-flex rounded-xl bg-green-100 p-3 text-green-700">
                  <Icon size={28} />
                </div>

                <h4 className="mb-3 text-xl font-bold">{feature.title}</h4>

                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits */}

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          <div className="text-center">
            <ShieldCheck className="mx-auto mb-4 text-green-700" size={40} />
            <h4 className="mb-2 text-xl font-bold">Secure</h4>
            <p className="text-gray-600">
              Your information is protected with secure authentication and
              controlled access.
            </p>
          </div>

          <div className="text-center">
            <Clock3 className="mx-auto mb-4 text-green-700" size={40} />
            <h4 className="mb-2 text-xl font-bold">Available 24/7</h4>
            <p className="text-gray-600">
              Access the portal anytime from your computer, tablet or mobile
              device.
            </p>
          </div>

          <div className="text-center">
            <GraduationCap className="mx-auto mb-4 text-green-700" size={40} />
            <h4 className="mb-2 text-xl font-bold">Better Learning</h4>
            <p className="text-gray-600">
              Bringing students, teachers and parents together through one
              connected platform.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}

      <section className="bg-green-900 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h3 className="text-4xl font-bold">Ready to Access Your Portal?</h3>

          <p className="mt-5 text-lg text-green-100">
            Sign in to view your dashboard and manage everything in one secure
            place.
          </p>

          <Link
            href={"/login"}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-pink-500 px-8 py-4 text-lg font-semibold transition hover:bg-pink-600"
          >
            Login Now
            <ArrowRight />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
