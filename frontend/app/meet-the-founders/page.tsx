import React from "react";
import { Quote, Mail, Phone, MapPin, Heart, Sparkles } from "lucide-react";
import Footer from "../components/sections/Footer";
// Import your Footer component here:
// import Footer from '@/components/Footer';

export default function MeetFounders() {
  const founders = [
    {
      title: "Proprietress",
      name: "Mrs. Joy Akperi",
      email: "proprietress@cozzischools.com",
      phone: "+234 800 123 4567",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800", // Replace with real image
      bio: [
        "As the Proprietress of Cozzi Schools, she brings decades of educational vision, passion, and dedicated leadership. Her unwavering commitment to child development has been the driving force behind our school’s nurturing environment.",
        "She firmly believes that early guidance, strong foundational values, and academic excellence form the bedrock of a successful life. Under her stewardship, Cozzi Schools continues to set high standards in holistic education.",
      ],
      quote:
        "Every child is a unique seed capable of growing into a mighty tree if given the right care, values, and environment.",
    },
    {
      title: "Director",
      name: "Rev. Chris Akperi",
      email: "director@cozzischools.com",
      phone: "+234 800 765 4321",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800", // Replace with real image
      bio: [
        "Serving as the Director, he oversees strategic development, operational excellence, and modern educational technology integration across Cozzi Schools.",
        "With a strong background in administration and modern pedagogy, he focuses on equipping our facilities and curriculum to prepare students for the demands of the 21st century.",
      ],
      quote:
        "Education must bridge tradition and innovation—preparing our students not just for today's exams, but for tomorrow's challenges.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col justify-between">
      <div>
        {/* Hero Section matching About Us Banner style */}
        <section className="relative py-24 md:py-32 text-white overflow-hidden">
          {/* Background Cover Image */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=2000"
              alt="Cozzi Schools Campus"
              className="w-full h-full object-cover"
            />
            {/* Dark Emerald Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/85 to-emerald-950/90 backdrop-blur-[2px]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
          </div>

          {/* Hero Banner Content */}
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
              Leadership & Vision
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-sm">
              Meet Our Founders
            </h1>
            <p className="text-lg md:text-xl text-emerald-100 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
              The visionary leaders behind Cozzi Schools, dedicated to fostering
              educational excellence, strong character, and a bright future for
              every child.
            </p>
          </div>
        </section>

        {/* Main Content Area */}
        <div className="container mx-auto px-4 py-20 max-w-7xl">
          {/* 2-Column Grid with increased column spacing (gap-14 lg:gap-16) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {founders.map((founder, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image Header Section */}
                  <div className="relative h-88 sm:h-96 w-full overflow-hidden bg-gray-100 group">
                    <img
                      src={founder.image}
                      alt={founder.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-4 py-1.5 bg-emerald-800/90 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-md">
                        {founder.title}
                      </span>
                    </div>
                  </div>

                  {/* Founder Details & Bio */}
                  <div className="p-8 sm:p-10 space-y-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {founder.name}
                      </h2>
                      <p className="text-emerald-700 font-semibold text-sm mt-1">
                        {founder.title}, Cozzi Schools
                      </p>
                    </div>

                    <div className="space-y-4">
                      {founder.bio.map((paragraph, idx) => (
                        <p
                          key={idx}
                          className="text-gray-600 leading-relaxed text-sm sm:text-base"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Quote Box */}
                    <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-100/80 relative">
                      <Quote className="w-6 h-6 text-emerald-300 absolute top-3 right-3" />
                      <p className="text-xs sm:text-sm italic text-emerald-950 leading-relaxed relative z-10 pr-6">
                        "{founder.quote}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Contact Details Footer per Founder */}
                <div className="px-8 pb-8 sm:px-10 sm:pb-10 pt-2 border-t border-gray-100 bg-slate-50/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    Direct Enquiries
                  </p>
                  <div className="space-y-2">
                    <a
                      href={`mailto:${founder.email}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-emerald-700 transition-colors"
                    >
                      <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-lg">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span>{founder.email}</span>
                    </a>
                    <a
                      href={`tel:${founder.phone.replace(/\s+/g, "")}`}
                      className="flex items-center gap-3 text-sm text-gray-600 hover:text-emerald-700 transition-colors"
                    >
                      <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-lg">
                        <Phone className="w-4 h-4" />
                      </div>
                      <span>{founder.phone}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Component Placeholder */}
      <Footer />
    </div>
  );
}
