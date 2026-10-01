import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import {
  Calendar,
  QrCode,
  Users,
  Scale,
  Award,
  Calculator,
  Banknote,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function HowItWorksPage() {
  const { language } = useLanguage();

  const steps = [
    {
      step: '01',
      title: 'Slot Reservation & Centre Selection',
      icon: Calendar,
      farmerAction: 'Farmer selects nearest Mandi centre, chooses harvest crop (Wheat, Paddy, Mustard, etc.), and picks an available date/time window.',
      systemAction: 'Platform checks real-time intake bay capacity and prevents overbooking. System executes an atomic slot reservation transaction.',
      safeguard: 'Zero risk of arrival gridlock; double-booking is rejected by database constraints.',
    },
    {
      step: '02',
      title: 'Digital Token Generation',
      icon: QrCode,
      farmerAction: 'Farmer receives a digital token on mobile containing an encrypted QR code, token serial number, and assigned intake bay.',
      systemAction: 'System generates unique token ID, assigns queue sequence, and calculates baseline estimated wait time.',
      safeguard: 'Tamper-resistant cryptographically signed QR code with verified farmer identity.',
    },
    {
      step: '03',
      title: 'Live Queue Tracking & Arrival',
      icon: Users,
      farmerAction: 'Farmer tracks queue progress from home or transit. Receives in-app alert when token is called to the Mandi Gate Entry.',
      systemAction: 'FIFO (First-In, First-Out) queue manager coordinates vehicle dispatching across active bays and tracks average service times.',
      safeguard: 'Persistent queue pause mechanism handles sudden scale maintenance or weather delays.',
    },
    {
      step: '04',
      title: 'Automated Weighbridge Capture',
      icon: Scale,
      farmerAction: 'Vehicle drives onto the calibrated electronic weighbridge. Gross weight and vehicle tare weight are logged.',
      systemAction: 'Direct IoT scale telemetry captures weights automatically: Net Weight = Gross Weight - Tare Weight.',
      safeguard: 'No handwritten paper slips; weighing data is permanently written to database records.',
    },
    {
      step: '05',
      title: 'Agmarknet Quality Assessment',
      icon: Award,
      farmerAction: 'Representative grain sample is inspected by certified Mandi quality personnel.',
      systemAction: 'Moisture content, foreign matter, and damaged grain percentage are tested and recorded. System assigns Grade A, B, or C.',
      safeguard: 'Objective statutory grading limits prevent arbitrary quality downgrades or deductions.',
    },
    {
      step: '06',
      title: 'Statutory MSP Calculation',
      icon: Calculator,
      farmerAction: 'Farmer reviews the transparent calculation sheet on the officer terminal or their mobile phone.',
      systemAction: 'System multiplies certified net weight by statutory government MSP rate. Standard quality adjustments and statutory cess are applied.',
      safeguard: 'Zero arbitrary commission cuts; full breakdown visible before finalization.',
    },
    {
      step: '07',
      title: 'Direct Benefit Transfer (DBT)',
      icon: Banknote,
      farmerAction: 'Farmer confirms bank details (Aadhaar-linked account). Payment is initiated electronically.',
      systemAction: 'Atomic settlement routes disbursement through PFMS banking gateway, generating an official 12-digit UTR transaction number.',
      safeguard: 'Direct bank credit ensures 100% of procurement proceeds reach the farmer.',
    },
    {
      step: '08',
      title: 'Official Procurement Receipt',
      icon: FileCheck2,
      farmerAction: 'Farmer downloads, saves, or prints an official verified procurement receipt.',
      systemAction: 'System produces a verifiable digital receipt with timestamped weighing logs, quality parameters, and bank UTR.',
      safeguard: 'Audit-ready legal documentation recognized for crop credit and agricultural subsidies.',
    },
  ];

  return (
    <PublicLayout
      title="How KisanSetu Works — The 8-Step Mandi Procurement Journey"
      description="Detailed procedural guide explaining how KisanSetu digitizes mandi operations from slot booking and live tokens to electronic weighbridge logging and DBT payment."
    >
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#F0FDF4] to-[#F7F9F5] py-16 sm:py-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-xs font-semibold text-green-800 border border-green-200">
            <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
            <span>Step-by-Step Procedural Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#17201A] tracking-tight">
            How KisanSetu Works
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl mx-auto leading-relaxed">
            Every step of the agricultural procurement journey has been redesigned to eliminate manual bottlenecks, prevent weight disputes, and guarantee statutory MSP payment.
          </p>
        </div>
      </section>

      {/* 8-Step Timeline */}
      <section className="py-16 sm:py-24 bg-white border-b border-gray-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {steps.map((s, idx) => (
              <div
                key={s.step}
                className="relative pl-8 sm:pl-12 border-l-2 border-green-200 pb-12 last:pb-0"
              >
                {/* Step Marker Dot */}
                <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#16A34A] text-white font-bold flex items-center justify-center text-xs shadow-sm ring-4 ring-white">
                  {s.step}
                </div>

                {/* Content Card */}
                <div className="card p-6 sm:p-8 bg-[#F7F9F5] border border-gray-200/90 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-green-700 flex items-center justify-center shadow-xs">
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-green-800 uppercase tracking-wider">
                        Stage {s.step}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900">{s.title}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="p-3.5 rounded-xl bg-white border border-gray-200/70 space-y-1">
                      <span className="font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        Farmer Experience
                      </span>
                      <p className="text-gray-600 leading-relaxed">{s.farmerAction}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-gray-200/70 space-y-1">
                      <span className="font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        System Execution
                      </span>
                      <p className="text-gray-600 leading-relaxed">{s.systemAction}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-green-50 border border-green-200/70 flex items-start gap-2 text-xs text-green-900">
                    <Info className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Security & Verification: </span>
                      <span>{s.safeguard}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA at Bottom of Workflow */}
          <div className="mt-16 text-center p-8 rounded-3xl bg-[#14532D] text-white space-y-4">
            <h2 className="text-2xl font-bold">Ready to Experience This Seamless Workflow?</h2>
            <p className="text-sm text-green-100 max-w-xl mx-auto">
              Join thousands of farmers booking their slots digitally with zero physical queue delays.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/register" className="btn-primary text-sm py-2.5 px-6 rounded-xl bg-white text-[#14532D] hover:bg-green-50">
                Register as Farmer
              </Link>
              <Link to="/login" className="btn-secondary text-sm py-2.5 px-6 rounded-xl bg-transparent border-white text-white hover:bg-white/10">
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
