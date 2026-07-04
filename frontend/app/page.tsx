"use client";

import Link from "next/link";
import {
	BookOpen,
	GraduationCap,
	Users,
	School,
	BadgeCheck,
	Phone,
	ChevronRight,
	Sparkles,
} from "lucide-react";

export default function HomePage() {
	return (
		<div className="min-h-screen bg-white text-gray-800 overflow-x-hidden">
			{/* ================= NAVBAR ================= */}
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
							className="hidden sm:flex px-4 py-2 text-sm font-medium text-emerald-800 hover:text-emerald-950 transition"
						>
							Login
						</Link>

						<Link
							href="/login"
							className="px-4 sm:px-5 py-2 text-sm font-semibold bg-emerald-800 text-white rounded-xl hover:bg-emerald-900 transition shadow-md"
						>
							Get Started
						</Link>
					</nav>
				</div>
			</header>

			{/* ================= HERO SECTION ================= */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-yellow-50"></div>

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-14 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
					{/* LEFT */}
					<div className="animate-in fade-in slide-in-from-left duration-700">
						<div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
							<Sparkles size={16} />
							Christian Excellence & Academic Growth
						</div>

						<h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-emerald-950 leading-tight">
							Raising Future
							<span className="text-emerald-700 block">
								Leaders With
							</span>
							Godly Values
						</h2>

						<p className="mt-6 text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl">
							Cozzi Schools provides a safe, inspiring and
							faith-driven learning environment where students
							excel academically, morally and socially.
						</p>

						<div className="mt-8 flex flex-wrap gap-4">
							<Link
								href="/login"
								className="inline-flex items-center gap-2 bg-emerald-800 text-white px-7 py-3 rounded-xl font-semibold hover:bg-emerald-900 transition shadow-lg"
							>
								Get Started
								<ChevronRight size={18} />
							</Link>

							<Link
								href="/login"
								className="inline-flex items-center gap-2 border-2 border-emerald-800 text-emerald-800 px-7 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition"
							>
								Portal Login
							</Link>
						</div>

						{/* STATS */}
						<div className="grid grid-cols-3 gap-4 mt-12">
							<div className="bg-white rounded-2xl p-4 shadow-sm border">
								<h3 className="text-2xl font-bold text-emerald-900">
									300+
								</h3>
								<p className="text-sm text-gray-500">
									Students
								</p>
							</div>

							<div className="bg-white rounded-2xl p-4 shadow-sm border">
								<h3 className="text-2xl font-bold text-emerald-900">
									30+
								</h3>
								<p className="text-sm text-gray-500">
									Teachers
								</p>
							</div>

							<div className="bg-white rounded-2xl p-4 shadow-sm border">
								<h3 className="text-2xl font-bold text-emerald-900">
									98%
								</h3>
								<p className="text-sm text-gray-500">
									Success Rate
								</p>
							</div>
						</div>
					</div>

					{/* RIGHT IMAGE */}
					<div className="relative animate-in fade-in slide-in-from-right duration-700">
						<div className="absolute -top-6 -right-6 w-40 h-40 bg-emerald-200 rounded-full blur-3xl opacity-40"></div>

						<div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
							<img
								src="/banner-image.jfif"
								alt="Students"
								className="w-full h-75 sm:h-112.5 object-cover"
							/>
						</div>

						{/* FLOATING CARD */}
						<div className="absolute bottom-6 left-4 sm:left-8 bg-white rounded-2xl shadow-xl p-4 w-64">
							<div className="flex items-center gap-3">
								<div className="bg-emerald-100 p-3 rounded-xl">
									<GraduationCap className="text-emerald-700" />
								</div>

								<div>
									<h4 className="font-bold text-emerald-900">
										Academic Excellence
									</h4>
									<p className="text-sm text-gray-500">
										Building bright futures daily.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ================= FEATURES ================= */}
			<section className="py-20 bg-gray-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
					<div className="text-center mb-14">
						<h3 className="text-3xl sm:text-4xl font-bold text-emerald-950">
							Why Choose Cozzi Schools?
						</h3>

						<p className="mt-4 text-gray-600 max-w-2xl mx-auto">
							We combine academic excellence, discipline and
							spiritual growth to prepare students for greatness.
						</p>
					</div>

					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{/* CARD */}
						<div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition duration-300 border">
							<div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5">
								<BookOpen className="text-emerald-700" />
							</div>

							<h4 className="font-bold text-lg text-emerald-900 mb-2">
								Result Checking
							</h4>

							<p className="text-sm text-gray-600 leading-relaxed">
								Students and parents can easily access academic
								results online anytime.
							</p>
						</div>

						{/* CARD */}
						<div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition duration-300 border">
							<div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-5">
								<Users className="text-blue-700" />
							</div>

							<h4 className="font-bold text-lg text-emerald-900 mb-2">
								Qualified Teachers
							</h4>

							<p className="text-sm text-gray-600 leading-relaxed">
								Experienced and passionate teachers dedicated to
								student success.
							</p>
						</div>

						{/* CARD */}
						<div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition duration-300 border">
							<div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center mb-5">
								<School className="text-yellow-700" />
							</div>

							<h4 className="font-bold text-lg text-emerald-900 mb-2">
								Modern Learning
							</h4>

							<p className="text-sm text-gray-600 leading-relaxed">
								Conducive classrooms and digital tools for
								enhanced learning experiences.
							</p>
						</div>

						{/* CARD */}
						<div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition duration-300 border">
							<div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-5">
								<BadgeCheck className="text-purple-700" />
							</div>

							<h4 className="font-bold text-lg text-emerald-900 mb-2">
								Moral Excellence
							</h4>

							<p className="text-sm text-gray-600 leading-relaxed">
								We nurture disciplined children with strong
								Christian values and integrity.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ================= ABOUT SECTION ================= */}
			<section className="py-20">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-2 gap-14 items-center">
					<div>
						<img
							src="/classroom-image.jpg"
							alt="Classroom"
							className="rounded-[2rem] shadow-xl object-cover h-112.5 w-full"
						/>
					</div>

					<div>
						<h3 className="text-3xl sm:text-4xl font-bold text-emerald-950 leading-tight">
							A Place Where Students Grow Spiritually &
							Academically
						</h3>

						<p className="mt-6 text-gray-600 leading-relaxed">
							At Cozzi Schools, every child is valued and guided
							towards academic excellence while building strong
							character and leadership skills.
						</p>

						<div className="space-y-5 mt-8">
							<div className="flex gap-4">
								<div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
									<GraduationCap className="text-emerald-700" />
								</div>

								<div>
									<h4 className="font-semibold text-emerald-900">
										Excellent Curriculum
									</h4>
									<p className="text-sm text-gray-600">
										Comprehensive learning programs for all
										levels.
									</p>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
									<Phone className="text-blue-700" />
								</div>

								<div>
									<h4 className="font-semibold text-emerald-900">
										Parent Communication
									</h4>
									<p className="text-sm text-gray-600">
										Parents stay connected with teachers and
										student progress.
									</p>
								</div>
							</div>
						</div>

						<Link
							href="/login"
							className="inline-flex items-center gap-2 mt-8 bg-emerald-800 text-white px-7 py-3 rounded-xl font-semibold hover:bg-emerald-900 transition"
						>
							Access School Portal
							<ChevronRight size={18} />
						</Link>
					</div>
				</div>
			</section>

			{/* ================= CTA ================= */}
			<section className="py-20 bg-gradient-to-r from-emerald-900 to-emerald-700 text-white">
				<div className="max-w-4xl mx-auto text-center px-4">
					<h3 className="text-3xl sm:text-5xl font-bold leading-tight">
						Begin Your Child's Journey To Excellence
					</h3>

					<p className="mt-5 text-emerald-100 text-lg">
						Join Cozzi Schools today and experience quality
						education built on Christian values.
					</p>

					<div className="mt-8 flex flex-wrap justify-center gap-4">
						<Link
							href="/login"
							className="bg-white text-emerald-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition"
						>
							Login To Portal
						</Link>

						<Link
							href="/login"
							className="border border-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition"
						>
							Get Started
						</Link>
					</div>
				</div>
			</section>

			{/* ================= FOOTER ================= */}
			<footer className="bg-gray-950 text-gray-400 py-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
					<div className="flex flex-col md:flex-row justify-between gap-8">
						<div>
							<div className="flex items-center gap-3">
								<img
									src="/logo.jpg"
									alt="Logo"
									className="w-12 h-12 rounded-full object-cover"
								/>

								<div>
									<h4 className="text-white font-bold text-xl">
										Cozzi Schools
									</h4>

									<p className="text-sm text-gray-500">
										Excellence • Discipline • Godliness
									</p>
								</div>
							</div>

							<p className="mt-4 text-sm max-w-md leading-relaxed">
								Empowering children with knowledge, leadership,
								character and Christian values for a brighter
								future.
							</p>
						</div>

						<div>
							<h5 className="text-white font-semibold mb-4">
								Quick Links
							</h5>

							<div className="flex flex-col gap-2 text-sm">
								<Link href="/" className="hover:text-white">
									Home
								</Link>

								<Link
									href="/login"
									className="hover:text-white"
								>
									Portal Login
								</Link>

								<Link
									href="/login"
									className="hover:text-white"
								>
									Get Started
								</Link>
							</div>
						</div>
					</div>

					<div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm">
						© {new Date().getFullYear()} Cozzi Schools. All rights
						reserved.
					</div>
				</div>
			</footer>
		</div>
	);
}
