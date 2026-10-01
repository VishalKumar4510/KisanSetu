import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import {
  Users,
  Building2,
  Shield,
  Calendar,
  QrCode,
  Scale,
  Award,
  Calculator,
  Banknote,
  Globe,
  Bell,
  Sliders,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function FeaturesPage() {
  const { language } = useLanguage();

  const farmerFeatures = [
    { title: 'Produce Registration', desc: 'Pre-register crops (Wheat, Paddy, Mustard, etc.) with acreage and estimated quintals.', icon: Calendar },
    { title: 'Capacity-Aware Slot Booking', desc: 'Pick your preferred date and hour based on live weighing capacity at your nearest Mandi.', icon: Calendar },
    { title: 'Encrypted Digital Token', desc: 'Unique QR token carrying authenticated farmer ID, bay assignment, and queue serial.', icon: QrCode },
    { title: 'Live Queue Tracking', desc: 'Track current token served, queue length, and minute-by-minute ETA on mobile.', icon: Users },
    { title: 'Step-by-Step Procurement Timeline', desc: 'Visual timeline updates from Gate Entry, Weighing, and Inspection to Payment Completed.', icon: Sliders },
    { title: 'DBT Payment Verification', desc: 'Direct-to-bank settlement tracking with 12-digit Banking UTR and masked account details.', icon: Banknote },
    { title: 'Multi-Lingual Support', desc: 'Native bilingual toggle between English and हिन्दी for accessibility across farming communities.', icon: Globe },
    { title: 'In-App Operational Alerts', desc: 'Instant notifications when your token is called to the weighing bay or when funds disburse.', icon: Bell },
  ];

  const officerFeatures = [
    { title: 'Live FIFO Queue Console', desc: 'Call tokens, advance queue sequences, and assign farmers to designated unloading bays.', icon: Users },
    { title: 'Digital Weighbridge Entry', desc: 'Direct electronic gross and tare logging computing verified net kilograms automatically.', icon: Scale },
    { title: 'Agmarknet Quality Lab', desc: 'Record moisture %, foreign matter, and damaged grains to certify Grade A, B, or C.', icon: Award },
    { title: 'Automated MSP Math Engine', desc: 'Pure statutory calculation module applying government support rates and standard cess.', icon: Calculator },
    { title: 'DBT Review & Settlement', desc: 'Audit calculated gross/net amounts and trigger electronic DBT transfer with bank UTR.', icon: Banknote },
    { title: 'Persistent Queue Pause', desc: 'Schema-backed queue pause/resume controls for weather contingencies or maintenance.', icon: Sliders },
    { title: 'Scale Equipment Monitor', desc: 'Track weighbridge hardware calibration dates and operational status.', icon: Building2 },
    { title: 'Daily Mandi Reconciliation', desc: 'One-click summaries of total lots processed, quintals procured, and disbursements made.', icon: FileSpreadsheet },
  ];

  const adminFeatures = [
    { title: 'Cross-Centre Monitoring', desc: 'Real-time overview of all mandi centres, active intake bays, and current congestion levels.', icon: Building2 },
    { title: 'Operational Analytics & KPIs', desc: 'Aggregate metrics for farmers served, total quintals, wait times, and total funds disbursed.', icon: BarChart3 },
    { title: 'Congestion Color Indicators', desc: 'Automated Green, Yellow, and Red congestion indicators based on active queue utilization.', icon: Bell },
    { title: 'Auditable Reporting Exports', desc: 'Downloadable compliance and procurement reports for state agricultural ministry oversight.', icon: FileSpreadsheet },
  ];

  return (
    <PublicLayout
      title="Platform Features — KisanSetu Smart Mandi Procurement"
      description="Explore the comprehensive feature set built into KisanSetu for Farmers, Mandi Officers, and State Agricultural Administrators."
    >
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#F0FDF4] to-[#F7F9F5] py-16 sm:py-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-xs font-semibold text-green-800 border border-green-200">
            <Sliders className="w-3.5 h-3.5 text-green-700" />
            <span>Comprehensive GovTech Feature Set</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#17201A] tracking-tight">
            Features Built for Every Stakeholder
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl mx-auto leading-relaxed">
            From grassroots farmers scheduling their harvest arrival to state administrators monitoring regional procurement pace, KisanSetu delivers dedicated, unified tools.
          </p>
        </div>
      </section>

      {/* 1. Farmer Features */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-10 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-green-800 tracking-wider">Farmer Portal</span>
              <h2 className="text-2xl font-bold text-gray-900">Capabilities for the Farmer (Kisan)</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {farmerFeatures.map((f) => (
              <div key={f.title} className="card p-5 bg-[#F7F9F5] border border-gray-200/80 rounded-2xl space-y-2">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-green-700 flex items-center justify-center">
                  <f.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{f.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Officer Features */}
      <section className="py-16 sm:py-20 bg-[#F7F9F5] border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-10 pb-4 border-b border-gray-200">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-blue-800 tracking-wider">Mandi Console</span>
              <h2 className="text-2xl font-bold text-gray-900">Capabilities for Mandi Officers & Scale Personnel</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {officerFeatures.map((f) => (
              <div key={f.title} className="card p-5 bg-white border border-gray-200/80 rounded-2xl space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
                  <f.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{f.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Admin Features */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-10 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase text-purple-800 tracking-wider">State Oversight</span>
              <h2 className="text-2xl font-bold text-gray-900">Capabilities for State Agricultural Administrators</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminFeatures.map((f) => (
              <div key={f.title} className="card p-5 bg-[#F7F9F5] border border-gray-200/80 rounded-2xl space-y-2">
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-purple-700 flex items-center justify-center">
                  <f.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{f.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 bg-[#14532D] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <h2 className="text-2xl font-bold">Experience All Features in Action</h2>
          <p className="text-sm text-green-100 max-w-xl mx-auto">
            Log in to test our live interactive demo credentials or register for an account.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link to="/login" className="btn-primary text-sm py-2.5 px-6 rounded-xl bg-white text-[#14532D] hover:bg-green-50">
              Sign In to Experience Demo
            </Link>
            <Link to="/register" className="btn-secondary text-sm py-2.5 px-6 rounded-xl bg-transparent border-white text-white hover:bg-white/10">
              Register as Farmer
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
