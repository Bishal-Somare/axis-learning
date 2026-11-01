import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, CheckCircle, GraduationCap, MapPin, 
  Phone, Mail, ArrowRight, ShieldCheck, Users, 
  Clock, Award, Calendar 
} from 'lucide-react';

export const PublicWebsiteView: React.FC = () => {
  const { setPublicViewMode, switchAccount, availableAccounts } = useAuth();

  const programs = [
    {
      title: 'Class 10 (SEE Target)',
      level: 'Secondary Education Examination',
      badge: 'Morning & Evening Batches',
      subjects: ['Compulsory Mathematics', 'Optional Mathematics', 'Science & Tech', 'English'],
      features: ['Weekly CDC model question paper solving', 'Dedicated theorem workshop', 'Target 3.6+ GPA guidance']
    },
    {
      title: '+2 Science Coaching',
      level: 'Grades 11 & 12 (NEB)',
      badge: 'Morning Shift (06:15 AM)',
      subjects: ['Physics', 'Chemistry', 'Higher Mathematics', 'Computer Science'],
      features: ['IOE Engineering & CEE Medical entrance foundation', 'Numerical problem practice sets', 'Lab conceptual sessions']
    },
    {
      title: '+2 Management Coaching',
      level: 'Grades 11 & 12 (NEB)',
      badge: 'Morning Shift (06:45 AM)',
      subjects: ['Principles of Accounting', 'Economics', 'Business Math / English'],
      features: ['CA Foundation & CMAT exam preparation', 'Practical ledger & financial case studies', 'Focus on 100% board pass rates']
    },
    {
      title: 'Classes 1–9 Foundation',
      level: 'Primary & Lower Secondary (BLE)',
      badge: 'Afternoon & Evening Shifts',
      subjects: ['Mathematics', 'Science', 'English Grammar & Writing'],
      features: ['Strong conceptual roots before board level', 'BLE Grade 8 special revision series', 'Individual pace and homework clinic']
    }
  ];

  const founders = [
    {
      name: 'Ramesh Adhikari',
      role: 'Founding Director & Head of Mathematics',
      experience: '16+ Years Experience in Butwal Shitalnagar',
      subjects: 'Compulsory Math, Optional Math, Business Math',
      bio: 'Renowned mathematics mentor in the Butwal Shitalnagar valley, dedicated to demystifying calculus, trigonometry, and CDC board problem-solving.'
    },
    {
      name: 'Sunita Sharma',
      role: 'Founding Faculty - Chemistry & Science',
      experience: '14+ Years Teaching Experience',
      subjects: 'Science (Class 9-10), Chemistry (+2 Science)',
      bio: 'Passionate about experimental chemistry, organic reaction mechanisms, and making foundational science intuitive for secondary students.'
    },
    {
      name: 'Pradeep Thapa',
      role: 'Founding Faculty - Physics & CS',
      experience: '12+ Years Teaching Experience',
      subjects: 'Physics (+2 NEB), Computer Science',
      bio: 'Specialist in Newtonian mechanics, thermodynamics, and electromagnetism with a strong record in IOE engineering entrance prep.'
    },
    {
      name: 'Gita Pokhrel',
      role: 'Founding Faculty - English & Social',
      experience: '15+ Years Teaching Experience',
      subjects: 'Compulsory English, Social Studies',
      bio: 'Empowering students with strong analytical essay writing, critical comprehension, and high-scoring board presentation techniques.'
    },
    {
      name: 'Bikash Shrestha',
      role: 'Founding Faculty - Accounts & Economics',
      experience: '11+ Years Teaching Experience',
      subjects: 'Principles of Accounting, Economics',
      bio: 'Expert accountant and educator helping commerce students master trial balance, company accounts, and macroeconomic fundamentals.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Notification Announcement */}
      <div className="bg-indigo-950 text-indigo-100 text-xs px-4 py-2 border-b border-indigo-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-300">New Academic Session 2081/82:</span>
            <span>Admissions open for Class 10 SEE & +2 Science/Management batches. Limited seats per batch.</span>
          </div>
          <button 
            onClick={() => setPublicViewMode(false)}
            className="text-xs text-white underline hover:text-indigo-200 font-semibold cursor-pointer shrink-0"
          >
            Staff Portal Login →
          </button>
        </div>
      </div>

      {/* Main Public Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
              AL
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                Axis Learning
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Tuition & Coaching Centre · Shankhamul, Butwal Shitalnagar
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#programs" className="hover:text-indigo-900 transition-colors">Programs</a>
            <a href="#faculty" className="hover:text-indigo-900 transition-colors">Founding Faculty</a>
            <a href="#features" className="hover:text-indigo-900 transition-colors">Why Axis</a>
            <a href="#contact" className="hover:text-indigo-900 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPublicViewMode(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-300" />
              <span>Management Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                <span>Tuition & Board Exam Coaching</span>
                <span>·</span>
                <span className="font-semibold text-indigo-900">5 Founding Educators</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Dedicated Academic Coaching for Classes 1–10 and +2.
              </h1>

              <p className="text-base text-slate-600 max-w-xl leading-relaxed">
                Founded and operated directly by five subject-matter educators in Butwal Shitalnagar. 
                We combine conceptual clarity, small batch discipline, session-by-session attendance tracking, and regular board model testing.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setPublicViewMode(false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <span>Access Management Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#programs"
                  className="px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Explore Course Batches
                </a>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-100 text-xs">
                <div>
                  <div className="font-mono text-xl font-bold text-indigo-900 tabular-nums">100%</div>
                  <div className="text-slate-500 text-[11px]">Educator-Taught Batches</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-indigo-900 tabular-nums">35 Max</div>
                  <div className="text-slate-500 text-[11px]">Students per Batch</div>
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-indigo-900 tabular-nums">Daily</div>
                  <div className="text-slate-500 text-[11px]">Guardian Absence Alerts</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md aspect-16/9 lg:aspect-4/3 bg-slate-100">
                <img
                  src="/src/assets/images/axis_learning_hero_1793532287595.jpg"
                  alt="Axis Learning Tuition Class in Butwal Shitalnagar Nepal"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback container
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs bg-slate-900/70 backdrop-blur-xs p-2.5 rounded-lg">
                  <div className="font-semibold">Axis Learning Butwal Shitalnagar Campus</div>
                  <div className="text-[11px] text-slate-200">Shankhamul Road · Modern study halls & science annex</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-14 border-b border-slate-200 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Curriculum & Coaching</div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Programs for Every Stage
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Structured around Nepal National Curriculum Framework (CDC & NEB) with comprehensive test series.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((prog, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{prog.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{prog.level}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                    {prog.badge}
                  </span>
                </div>

                <div className="mt-4 mb-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Coached Subjects
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {prog.subjects.map((sub, sIdx) => (
                      <span key={sIdx} className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  {prog.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Admissions Ongoing</span>
                <button
                  onClick={() => setPublicViewMode(false)}
                  className="font-semibold text-indigo-900 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Portal details</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Five Founding Faculty Section */}
      <section id="faculty" className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">Founders & Faculty</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Taught Directly by the 5 Founding Teachers
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Unlike corporate franchises that outsource teaching to temporary tutors, Axis Learning classes are personally conducted by our five founding subject heads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {founders.map((teacher, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{teacher.name}</h3>
                      <p className="text-[11px] text-indigo-900 font-semibold">{teacher.role}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {teacher.bio}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 space-y-1 text-[11px]">
                  <div className="text-slate-500 flex items-center justify-between">
                    <span>Expertise:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[170px]">{teacher.subjects}</span>
                  </div>
                  <div className="text-slate-500 flex items-center justify-between">
                    <span>Experience:</span>
                    <span className="font-semibold text-slate-800">{teacher.experience}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact and Location */}
      <section id="contact" className="py-12 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Visit Axis Learning or Inquire About Batch Timing
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                We are conveniently located near Shankhamul Bridge with dedicated parking and safe transport connectivity for morning and evening students.
              </p>
              
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Shankhamul Road, Butwal Shitalnagar 44600, Nepal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>+977-1-4412345 / +977-9841234567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>contact@axislearning.edu.np</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Office: Sun–Fri, 6:00 AM – 7:00 PM</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center">
              <button
                onClick={() => setPublicViewMode(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              >
                Authorized Portal Login →
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                For Administrators, Founding Teachers & Staff
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>© 2026 Axis Learning Tuition & Coaching Centre. All Rights Reserved. Shankhamul, Butwal Shitalnagar, Nepal.</p>
      </footer>
    </div>
  );
};
