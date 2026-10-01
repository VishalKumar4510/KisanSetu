import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import { Sprout, ShieldCheck, Scale, Database, Server, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function AboutPage() {
  const { language } = useLanguage();

  return (
    <PublicLayout
      title="About KisanSetu — Digital Public Infrastructure for Agricultural Mandis"
      description="Learn about the KisanSetu architecture, operational mission, and technical foundations ensuring transparent procurement across agricultural market yards."
    >
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#F0FDF4] to-[#F7F9F5] py-16 sm:py-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-xs font-semibold text-green-800 border border-green-200">
            <Sprout className="w-3.5 h-3.5 text-green-700" />
            <span>Digital Public Good • SIH 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#17201A] tracking-tight">
            About KisanSetu
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl mx-auto leading-relaxed">
            KisanSetu (किसानसेतु) is a modern agricultural market infrastructure platform created to solve structural logistics, queue bottlenecks, and payment reconciliation delays in Indian APMC mandis.
          </p>
        </div>
      </section>

      {/* Mission & Purpose */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Core Mission
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201A] tracking-tight">
                Restoring Certainty & Transparency to Agricultural Trade
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                For decades, the physical journey of a farmer bringing grain to a government procurement centre has been plagued by unpredictability: unorganized lines, arbitrary weighbridge slips, subjective quality downgrades, and delayed check disbursements.
              </p>
              <p className="text-sm text-[#64748B] leading-relaxed">
                KisanSetu replaces guesswork with deterministic engineering. By booking slots according to real yard capacity, tracking live digital tokens, enforcing automated net weighbridge calculations, and routing statutory MSP directly through Direct Benefit Transfer (DBT), we empower farmers with dignity and speed.
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  Zero Manual Intermediaries
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  Statutory MSP Guarantee
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  Tamper-Resistant Auditing
                </span>
              </div>
            </div>

            <div className="bg-[#F7F9F5] p-8 rounded-3xl border border-gray-200/80 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3">
                Key Operating Tenets
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">1. Capacity-Aware Scheduling</h4>
                  <p className="text-gray-600 mt-0.5">
                    Mandi slots are strictly tied to physical weighbridge and inspection bay limits, mathematically preventing yard overflow.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">2. Objective Agmarknet Certification</h4>
                  <p className="text-gray-600 mt-0.5">
                    Quality grades (A, B, C) are assigned based on standardized moisture, foreign matter, and damaged grain parameters rather than arbitrary personal discretion.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">3. Transparent Financial Pipeline</h4>
                  <p className="text-gray-600 mt-0.5">
                    Every rupee paid is traceable through a verified Banking UTR, leaving no room for commission diversion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-16 sm:py-20 bg-[#F7F9F5] border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100 px-3 py-1 rounded-full border border-green-200">
              Technical Foundations
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201A] tracking-tight">
              Enterprise GovTech Engineering Standards
            </h2>
            <p className="text-sm text-[#64748B]">
              Built with industry-standard relational persistence, transactional safety, and responsive accessible frontends.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 bg-white rounded-2xl border border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">PostgreSQL Relational Core</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Persistent database architecture utilizing Prisma ORM with strict foreign key constraints, connection pooling, and automated schema migrations.
              </p>
            </div>

            <div className="card p-6 bg-white rounded-2xl border border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Atomic Booking Transactions</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Slot booking and payment settlements execute within atomic database transactions, preventing double-booking and concurrency race conditions.
              </p>
            </div>

            <div className="card p-6 bg-white rounded-2xl border border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Role-Based Access Control (RBAC)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Cryptographic JWT authentication and Broken Object Level Authorization (BOLA) protections ensure farmers only access their own lots and payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="py-12 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Experience KisanSetu Today</h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Get started by registering your farm produce or explore the platform workflows.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link to="/register" className="btn-primary text-sm py-2.5 px-6 rounded-xl">
              Register as Farmer
            </Link>
            <Link to="/how-it-works" className="btn-secondary text-sm py-2.5 px-6 rounded-xl">
              Read How It Works
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
