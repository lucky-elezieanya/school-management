import React from "react";
import Link from "next/link";
import {
  Target,
  Compass,
  Award,
  MapPin,
  Heart,
  Shield,
  Sparkles,
  BookOpen,
  ArrowRight,
  Users,
  Phone,
  Mail,
  Clock,
  Send,
} from "lucide-react";
import Footer from "../components/sections/Footer";

export default function AboutUs() {
  const coreValues = [
    {
      title: "Excellence",
      desc: "Striving for the highest standards in academics, character development, and co-curricular achievements.",
      icon: Award,
    },
    {
      title: "Integrity",
      desc: "Nurturing honest, respectful, and responsible future leaders with strong moral principles.",
      icon: Shield,
    },
    {
      title: "Innovation",
      desc: "Blending modern teaching methodologies with proven educational traditions to inspire curiosity.",
      icon: Sparkles,
    },
    {
      title: "Nurturing Environment",
      desc: "Creating a safe, inclusive, and supportive space where every child is heard, valued, and encouraged.",
      icon: Heart,
    },
  ];
  const ourStatements = [
    {
      title: "Our Vision",
      desc: "To be most preferred Christian School, To raise Children who will be joy to their parents. To raise Children of Integrity, vast in knowledge and skill for positive influence of the society",
      icon: Compass,
    },
    {
      title: "Our Mision",
      desc: "To empower students through high-quality education, modern learning techniques, strong moral values, and a supportive environment that unlocks their full potential.",
      icon: Target,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col justify-between">
      <div>
        {/* Hero Section with Banner & Centered Logo */}
        <section className="relative py-24 md:py-36 text-white overflow-hidden">
          {/* Background Cover Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="/classroom-image.jpg"
              alt="Cozzi Schools Campus Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/85 to-emerald-950/90 backdrop-blur-[2px]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
          </div>

          {/* Hero Content */}
          <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl flex flex-col items-center">
            {/* Centered School Logo */}
            <div className="mb-6 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <img
                src="/logo.jpg"
                alt="Cozzi Schools Logo"
                className="h-16 w-auto sm:h-20 object-contain drop-shadow-md rounded-xl"
              />
            </div>

            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider text-emerald-200 uppercase bg-emerald-800/80 rounded-full border border-emerald-600/50 shadow-sm backdrop-blur-md">
              Welcome to Cozzi Schools
            </span>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-sm">
              Nurturing Minds, Building Character & Shaping the Future
            </h1>
            <p className="text-xl text-emerald-100 font-light leading-relaxed max-w-xl mx-auto drop-shadow-sm px-8">
              At Cozzi Schools, we provide a holistic educational experience
              that equips young learners with the knowledge, values, and
              confidence to thrive in a global world.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16 max-w-6xl space-y-24">
          {/* Story Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-emerald-700 font-bold tracking-wider text-sm uppercase">
                Our Story
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-snug">
                A Legacy of Academic Excellence and Nurture
              </h2>
              <p className="text-gray-600 leading-relaxed text-xl">
                Founded with a passion for educational distinction, Cozzi
                Schools has grown into a vibrant academic community. We believe
                that true education goes beyond textbooks—it is about inspiring
                critical thinking, fostering creativity, and building
                unshakeable character.
              </p>
              <p className="text-gray-600 text-xl leading-relaxed">
                Our state-of-the-art facilities and dedicated faculties ensure
                that every student receives personalized attention in an
                atmosphere designed to spark curiosity and growth.
              </p>
            </div>

            <div className="relative">
              <div className="relative h-96 md:h-[450px] w-full rounded-3xl overflow-hidden shadow-xl border-4 border-white group">
                <img
                  src="/classroom-image.jpg"
                  alt="Students in classroom"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 hidden sm:flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">100%</p>
                  <p className="text-xs text-gray-500 font-medium">
                    Dedication to Student Growth
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Vision & Mission */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {ourStatements.map((val, idx) => (
              <div
                key={idx}
                className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-md"
              >
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-6">
                  <val.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {val.title}
                </h3>
                <p className="text-gray-600 text-xl leading-relaxed">
                  {val.desc}
                </p>
              </div>
            ))}
          </section>

          {/* Core Values */}
          <section className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-emerald-700 font-bold tracking-wider text-sm uppercase">
                Guiding Principles
              </span>
              <h2 className="text-3xl font-bold text-gray-900">
                Our Core Values
              </h2>
              <p className="text-gray-600 text-xl">
                The pillars that define our school culture and drive our
                educational approach every day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreValues.map((val, idx) => {
                const IconComponent = val.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center mb-4">
                      <IconComponent className="w-10 h-10" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      {val.title}
                    </h4>
                    <p className="text-xl text-gray-600 leading-relaxed">
                      {val.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* NEW: Contact & Enquiries Section */}
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 space-y-10">
            <div className="max-w-2xl space-y-3">
              <span className="text-emerald-700 font-bold tracking-wider text-sm uppercase">
                Reach Out To Us
              </span>
              <h2 className="text-3xl font-bold text-gray-900">
                Enquiries & Contact Details
              </h2>
              <p className="text-gray-600 leading-relaxed text-xl">
                Have questions regarding admissions, school visits, or academic
                programs? We are always here to help.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Campus Location */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-gray-100 space-y-4">
                <div className="w-11 h-11 bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xl">
                    School Address
                  </h4>
                  <p className="text-lg text-gray-600 mt-2 leading-relaxed">
                    Cozzi Schools, Lakeview Ubeji, Warri South, Delta State,
                    Nigeria
                  </p>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-gray-100 space-y-4">
                <div className="w-11 h-11 bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xl">
                    Phone & Email
                  </h4>
                  <p className="text-lg text-gray-600 mt-2">
                    <strong className="text-gray-800">Phone:</strong> +234 802
                    862 8797, +234 814 889 3742
                  </p>
                  <p className="text-lg text-gray-600 mt-1">
                    <strong className="text-gray-800">Email:</strong>{" "}
                    chrisakperi@gmail.com
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-gray-100 space-y-4">
                <div className="w-11 h-11 bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-xl">
                    Office Hours
                  </h4>
                  <p className="text-lg text-gray-600 mt-2">
                    <strong className="text-gray-800">Mon - Fri:</strong> 7:30
                    AM - 4:00 PM
                  </p>
                  <p className="text-lg text-gray-600 mt-1">
                    <strong className="text-gray-800">Saturday:</strong> By
                    Appointment
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Meet the Founders Banner Link */}
          <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl">
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10 pointer-events-none">
              <Users className="w-96 h-96" />
            </div>

            <div className="relative z-10 max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-lg font-semibold bg-emerald-700/80 text-emerald-100 border border-emerald-600/50">
                <Users className="w-8 h-8" /> School Leadership
              </span>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Meet the Visionaries Behind Cozzi Schools
              </h3>
              <p className="text-emerald-100 text-base text-lg font-light leading-relaxed">
                Discover the story, vision, and guiding philosophies of our
                Proprietress and Director who steer our commitment to
                educational excellence.
              </p>
              <div className="pt-2">
                <Link
                  href="/meet-the-founders"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <span className="text-lg">Meet Our Founders</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer Component Placeholder */}
      <Footer />
    </div>
  );
}
