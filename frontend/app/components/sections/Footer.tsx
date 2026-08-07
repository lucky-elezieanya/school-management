import Link from "next/link";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-400 py-12 w-full border-t border-slate-800/80 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-emerald-900/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Motto */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Cozzi Schools Logo"
                className="w-12 h-12 rounded-xl object-contain border border-slate-800 bg-white/5 p-1"
              />
              <div>
                <h4 className="text-white font-bold text-xl tracking-tight">
                  Cozzi Schools
                </h4>
                <p className="text-xs text-emerald-400 font-medium tracking-wide">
                  Excellence • Discipline • Godliness
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed">
              Empowering children with knowledge, leadership, character, and
              strong foundational values for a brighter future.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-white font-semibold text-base mb-4 tracking-wide border-l-2 border-emerald-500 pl-2.5">
              Quick Links
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ›
                  </span>
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/aboutUs"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ›
                  </span>
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/meet-the-founders"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ›
                  </span>
                  Meet the Founders
                </Link>
              </li>
            </ul>
          </div>

          {/* Portal & Admissions */}
          <div>
            <h5 className="text-white font-semibold text-base mb-4 tracking-wide border-l-2 border-emerald-500 pl-2.5">
              Portal & Access
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/portal"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"
                >
                  <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ›
                  </span>
                  Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h5 className="text-white font-semibold text-base mb-4 tracking-wide border-l-2 border-emerald-500 pl-2.5">
              Contact Us
            </h5>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-gray-400">
                  Cozzi Schools, Lakeview Ubeji, Warri South, Delta State,
                  Nigeria
                </span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href="tel:+2348028628797"
                  className="hover:text-emerald-400 transition-colors"
                >
                  +2348028628797
                </a>
                <a
                  href="tel:+2348148893742"
                  className="hover:text-emerald-400 transition-colors"
                >
                  +2348148893742
                </a>
                <a
                  href="tel:+2348102930441"
                  className="hover:text-emerald-400 transition-colors"
                >
                  +2348102930441
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href="mailto:info@chrisakperi@gmail.com"
                  className="hover:text-emerald-400 transition-colors"
                >
                  chrisakperi@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Divider & Bottom Bar */}
        <div className="border-t border-slate-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-sm gap-4">
          <p>
            © {new Date().getFullYear()} Cozzi Schools. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link
              href="/aboutUs"
              className="hover:text-gray-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/aboutUs"
              className="hover:text-gray-400 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
