import React from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  QrCode,
  Users,
  Scale,
  Award,
  Calculator,
  Banknote,
  FileCheck2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

export default function LandingPage() {
  const { language } = useLanguage();

  const workflowSteps = [
    {
      num: '01',
      title: 'Book Slot',
      titleHi: 'स्लॉट बुक करें',
      desc: 'Reserve a guaranteed delivery time slot at your chosen Mandi centre based on real-time intake capacity.',
      descHi: 'वास्तविक क्षमता के आधार पर अपने निकटतम मंडी केंद्र में अपनी सुविधानुसार समय स्लॉट आरक्षित करें।',
      icon: Calendar,
    },
    {
      num: '02',
      title: 'Get Token',
      titleHi: 'डिजिटल टोकन प्राप्त करें',
      desc: 'Receive an encrypted digital token with an authenticated QR code, token serial number, and assigned intake bay.',
      descHi: 'क्यूआर कोड, टोकन क्रमांक और आवंटित प्रवेश बे के साथ सुरक्षित डिजिटल टोकन प्राप्त करें।',
      icon: QrCode,
    },
    {
      num: '03',
      title: 'Join Queue',
      titleHi: 'लाइव कतार में जुड़ें',
      desc: 'Track live queue status and estimated wait time from your phone. Receive alerts as your turn approaches.',
      descHi: 'अपने मोबाइल से वास्तविक कतार स्थिति और प्रतीक्षा समय देखें। अपनी बारी आने पर सूचना प्राप्त करें।',
      icon: Users,
    },
    {
      num: '04',
      title: 'Weigh Produce',
      titleHi: 'उत्पाद तुलाई',
      desc: 'Direct digital weighbridge logging captures gross and tare weight automatically with zero manual slip tampering.',
      descHi: 'डिजिटल वे-ब्रिज से सकल और खाली वजन का स्वचालित अंकन, बिना किसी मानवीय हेरफेर के।',
      icon: Scale,
    },
    {
      num: '05',
      title: 'Quality Assessment',
      titleHi: 'गुणवत्ता परीक्षण',
      desc: 'Certified inspection testing moisture content, foreign matter, and damaged grain against Agmarknet Grade A/B/C standards.',
      descHi: 'नमी, विजातीय पदार्थ और क्षतिग्रस्त दानों की जांच कर एग्मार्कनेट मानकों के तहत ग्रेड प्रमाणन।',
      icon: Award,
    },
    {
      num: '06',
      title: 'MSP Calculation',
      titleHi: 'एमएसपी गणना',
      desc: 'Statutory Minimum Support Price automatically multiplied by certified net weight with clear statutory deductions.',
      descHi: 'सरकारी न्यूनतम समर्थन मूल्य (MSP) और प्रमाणित शुद्ध वजन के आधार पर पारदर्शी देय राशि की गणना।',
      icon: Calculator,
    },
    {
      num: '07',
      title: 'DBT Payment',
      titleHi: 'डीबीटी भुगतान',
      desc: 'Direct Benefit Transfer electronically routed to the farmer verified bank account with unique UTR tracking.',
      descHi: 'सत्यापित बैंक खाते में इलेक्ट्रॉनिक रूप से प्रत्यक्ष लाभ हस्तांतरण (DBT) और यूटीआर ट्रैकिंग।',
      icon: Banknote,
    },
    {
      num: '08',
      title: 'Digital Receipt',
      titleHi: 'आधिकारिक रसीद',
      desc: 'Download or print an official audit-ready procurement receipt containing timestamps, weights, grades, and payment reference.',
      descHi: 'समय, वजन, गुणवत्ता ग्रेड और बैंक भुगतान संदर्भ संख्या सहित डिजिटल रसीद डाउनलोड करें।',
      icon: FileCheck2,
    },
  ];

  const farmerBenefits = [
    {
      title: 'Guaranteed Arrival Slots',
      desc: 'No more arriving before dawn or waiting overnight in tractor queues outside mandi gates. Reserve your schedule in advance.',
      icon: Calendar,
    },
    {
      title: 'Live Queue ETA on Mobile',
      desc: 'Monitor real-time queue position and bay arrival estimates from your smartphone, reducing idle yard wait times.',
      icon: Clock,
    },
    {
      title: 'Tamper-Evident Weighment',
      desc: 'Digital weighbridge scales record net weight directly to the system database, eliminating hand-written slip disputes.',
      icon: Scale,
    },
    {
      title: 'Direct Bank Settlement (DBT)',
      desc: 'Procurement proceeds are credited directly into your verified bank account with government UTR transaction tracking.',
      icon: Banknote,
    },
  ];

  const officerBenefits = [
    {
      title: 'Regulated Gate Intake',
      desc: 'Capacity caps balance daily vehicle flow across active bays, preventing gridlock on arterial roads during peak harvest.',
      icon: Building2,
    },
    {
      title: 'Standardized Agmarknet Records',
      desc: 'Mandatory moisture and foreign matter parameter capture creates verifiable quality audit trails for every lot.',
      icon: ShieldCheck,
    },
    {
      title: 'Queue Pause & Safety Controls',
      desc: 'Instant emergency queue pause mechanisms in case of severe weather, scale calibration, or technical bay maintenance.',
      icon: Clock,
    },
    {
      title: 'Automated Daily Reconciliation',
      desc: 'One-click daily procurement logs, total quintals, gross disbursements, and hardware calibration summaries.',
      icon: Calculator,
    },
  ];

  const faqs = [
    {
      q: 'How does KisanSetu prevent long waiting lines at the Mandi?',
      a: 'KisanSetu assigns finite hourly booking slots based on each mandi active bay count and daily weighing capacity. Farmers arrive at their designated slot with a digital token, eliminating chaotic unscheduled vehicle bottlenecks.',
    },
    {
      q: 'How is the final payment calculated for my produce?',
      a: 'The system multiplies your certified net weight (Gross weight minus Tare weight from the digital weighbridge) by the official government Minimum Support Price (MSP) for your crop. Standard moisture or grade adjustments are applied transparently according to statutory Agmarknet tables.',
    },
    {
      q: 'Can another farmer use or cancel my digital token?',
      a: 'No. Every token is cryptographically tied to the authenticated farmer account and contains a signed QR code. The platform enforces strict authorization boundaries preventing unauthorized viewing or cancellation of another farmer token.',
    },
    {
      q: 'What happens if a scale needs re-calibration or weather halts operations?',
      a: 'Mandi Officers have a built-in persistent Queue Pause control. When paused, current farmer bookings remain safe, queue positions freeze, and arriving farmers are kept informed until operations resume safely.',
    },
    {
      q: 'How do I track when my payment has been disbursed?',
      a: 'You can check the Payment Status tab on your Farmer Dashboard at any time. Once processed, the exact Banking UTR (Unique Transaction Reference) and DBT Reference ID are displayed alongside a downloadable receipt.',
    },
    {
      q: 'Can I use KisanSetu if I only have a mobile phone without a computer?',
      a: 'Yes. KisanSetu is fully responsive and optimized for mobile browsers. You can book slots, present your digital QR token, track queue status, and verify payments directly on any modern smartphone.',
    },
  ];

  return (
    <PublicLayout
      title="KisanSetu — Smart Mandi Procurement Platform | SIH 2026"
      description="Modernizing agricultural mandi procurement: capacity-aware slot booking, live digital queue tokens, automated weighbridge integration, Agmarknet quality certification, and direct DBT payments."
    >
      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F0FDF4] via-white to-[#F7F9F5] pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* SIH GovTech Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-100/80 border border-green-200 text-xs font-semibold text-green-900 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                <span>Smart India Hackathon 2026 • Digital Agricultural Public Good</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold text-[#17201A] tracking-tight leading-[1.15]">
                Transparent Mandi Procurement{' '}
                <span className="text-[#16A34A] block sm:inline">from Gate Entry to Direct Bank Transfer</span>
              </h1>

              {/* Supporting Subheading */}
              <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto lg:mx-0">
                A purpose-built GovTech platform modernizing agricultural mandi operations. Eliminate physical queue congestion, ensure transparent digital weighbridge capture, certify Agmarknet quality grades, and receive guaranteed statutory MSP payments via Direct Benefit Transfer.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/register"
                  className="btn-primary w-full sm:w-auto text-base py-3 px-6 rounded-xl shadow-sm flex items-center justify-center gap-2"
                >
                  <span>{language === 'en' ? 'Register as Farmer' : 'किसान पंजीकरण करें'}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="btn-secondary w-full sm:w-auto text-base py-3 px-6 rounded-xl flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-gray-600" />
                  <span>{language === 'en' ? 'Sign In to Portal' : 'पोर्टल में प्रवेश करें'}</span>
                </Link>
                <a
                  href="#workflow"
                  className="text-sm font-semibold text-[#16A34A] hover:text-[#15803D] flex items-center gap-1 py-2 px-3"
                >
                  <span>{language === 'en' ? 'Explore 8-Step Flow' : '8-चरणीय प्रक्रिया देखें'}</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Factual Value Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-gray-200/80 text-left">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span className="text-xs font-medium text-gray-700">Capacity-Based Slots</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span className="text-xs font-medium text-gray-700">Digital Weighbridge</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span className="text-xs font-medium text-gray-700">PFMS / DBT Settlement</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Digital Token & Queue Specimen */}
            <div className="lg:col-span-5">
              <div className="card-elevated border-2 border-green-200/70 p-6 relative bg-white shadow-lg rounded-3xl">
                {/* Header Strip */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-green-800">
                      Live Mandi Digital Token
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700">
                    STATUS: ACTIVE
                  </span>
                </div>

                {/* Token Specimen Body */}
                <div className="py-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-[#64748B] uppercase font-semibold">Token Number</span>
                      <p className="text-2xl font-extrabold text-[#17201A] font-mono tracking-tight mt-0.5">
                        T-2026-0042
                      </p>
                      <span className="text-xs text-gray-500">Mandi Centre: Lucknow APMC Main Yard</span>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center p-2 text-center shadow-xs">
                      <QrCode className="w-10 h-10 text-gray-800" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div className="p-3 rounded-xl bg-[#F0FDF4] border border-green-100">
                      <span className="text-[11px] text-green-800 font-semibold uppercase">Queue Position</span>
                      <p className="text-xl font-bold text-green-900 mt-0.5">#3 in Bay 2</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <span className="text-[11px] text-blue-800 font-semibold uppercase">Estimated Wait</span>
                      <p className="text-xl font-bold text-blue-900 mt-0.5">~18 mins</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Registered Crop:</span>
                      <span className="font-semibold text-gray-800">Wheat (Sharbati) • 50 Quintals</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Scheduled Window:</span>
                      <span className="font-semibold text-gray-800">Today, 10:00 AM – 11:00 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">MSP Base Rate:</span>
                      <span className="font-semibold text-green-700">₹2,275 / Quintal</span>
                    </div>
                  </div>
                </div>

                {/* Footer Notice */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Cryptographically Verified QR</span>
                  <span className="font-mono">KisanSetu Gateway v2.4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PROBLEM STATEMENT */}
      <section className="py-16 sm:py-24 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Operational Challenges Addressed
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17201A] tracking-tight">
              The Real Bottlenecks in Traditional Agricultural Mandis
            </h2>
            <p className="text-base text-[#64748B]">
              Every harvest season, physical APMC yards face structural friction that costs farmers time, money, and certainty. KisanSetu targets these operational failure points with verified engineering solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bottleneck 1 */}
            <div className="card border border-red-100 p-6 bg-red-50/30 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Unscheduled Traffic & Overnight Gridlock</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Without arrival scheduling, hundreds of tractor-trolleys converge at the mandi gate simultaneously, causing severe road congestion and forcing farmers to wait in unorganized queues for 12 to 24 hours.
              </p>
            </div>

            {/* Bottleneck 2 */}
            <div className="card border border-amber-100 p-6 bg-amber-50/30 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Manual Slip Errors & Subjective Grading</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hand-written weighing receipts and uncalibrated analog scales lead to disputes over tare deductions. Subjective visual grain inspection creates mistrust regarding applied quality grade discounts.
              </p>
            </div>

            {/* Bottleneck 3 */}
            <div className="card border border-blue-100 p-6 bg-blue-50/30 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Payment Delays & Commission Erosion</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Paper-based ledgers take days or weeks to reconcile across intermediary commission agents. Farmers lack real-time visibility into when government funds will actually arrive in their bank accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW KISANSETU WORKS (THE 8-STEP WORKFLOW) */}
      <section id="workflow" className="py-16 sm:py-24 bg-[#F7F9F5] border-b border-gray-200/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100 px-3 py-1 rounded-full border border-green-200">
              End-to-End Digital Procurement Journey
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17201A] tracking-tight">
              From Pre-Arrival Slot to Direct Bank Settlement
            </h2>
            <p className="text-base text-[#64748B]">
              KisanSetu transforms disjointed manual procedures into an unbroken digital pipeline governed by strict state machine transitions and audit verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step) => (
              <div
                key={step.num}
                className="card-elevated hover:shadow-md transition-shadow duration-200 p-6 bg-white rounded-2xl relative flex flex-col justify-between border border-gray-200/90"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-green-700 font-mono tracking-tight">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                      <step.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#17201A] mb-1">
                    {language === 'en' ? step.title : step.titleHi}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {language === 'en' ? step.desc : step.descHi}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                  <span>Digitized Phase</span>
                  <span className="text-green-700 font-semibold">Active In Platform</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 & 5: STAKEHOLDER BENEFITS */}
      <section className="py-16 sm:py-24 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Farmer Column */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-bold text-green-800 uppercase tracking-wide">
                <Users className="w-4 h-4 text-green-600" />
                For Farmers (Kisan)
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201A] tracking-tight">
                Dignified, Transparent, and Guaranteed Mandi Access
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Farmers deserve certainty when bringing their harvest to market. KisanSetu eliminates physical queue struggles and secures every kilogram weighed.
              </p>

              <div className="space-y-4 pt-2">
                {farmerBenefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-3.5 p-4 rounded-xl bg-[#F7F9F5] border border-gray-200/70">
                    <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                      <b.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{b.title}</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandi Officer & Admin Column */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-800 uppercase tracking-wide">
                <Building2 className="w-4 h-4 text-blue-600" />
                For Mandi Officers & State APMCs
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201A] tracking-tight">
                Streamlined Operations & Flawless Audit Accountability
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Provide mandi superintendents and procurement nodal officers with real-time operational telemetry, gate pacing controls, and tamper-resistant audit logs.
              </p>

              <div className="space-y-4 pt-2">
                {officerBenefits.map((b) => (
                  <div key={b.title} className="flex items-start gap-3.5 p-4 rounded-xl bg-[#F7F9F5] border border-gray-200/70">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <b.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{b.title}</h4>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: TRANSPARENT PROCUREMENT COMPARISON */}
      <section className="py-16 sm:py-24 bg-[#F7F9F5] border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100 px-3 py-1 rounded-full border border-green-200">
              Systemic Comparison
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17201A] tracking-tight">
              Traditional Mandi vs. KisanSetu Digital Assurance
            </h2>
            <p className="text-base text-[#64748B]">
              A structural side-by-side comparison of procedural steps and how our platform enforces integrity.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <th className="py-4 px-6">Operational Stage</th>
                  <th className="py-4 px-6 text-red-900 bg-red-50/50">Traditional Physical APMC</th>
                  <th className="py-4 px-6 text-green-900 bg-green-50/50">KisanSetu Digital Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Mandi Arrival</td>
                  <td className="py-4 px-6 text-gray-600 bg-red-50/20">Unannounced, tractor lines blocking roads</td>
                  <td className="py-4 px-6 text-gray-900 font-medium bg-green-50/20">
                    <span className="inline-flex items-center text-green-700 font-semibold gap-1.5">
                      <Check className="w-4 h-4 text-green-600" />
                      Capacity-aware time slot booking
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Queue Management</td>
                  <td className="py-4 px-6 text-gray-600 bg-red-50/20">Physical crowd pushing, arbitrary line jumps</td>
                  <td className="py-4 px-6 text-gray-900 font-medium bg-green-50/20">
                    <span className="inline-flex items-center text-green-700 font-semibold gap-1.5">
                      <Check className="w-4 h-4 text-green-600" />
                      Digital FIFO token with real-time ETA
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Weighment Process</td>
                  <td className="py-4 px-6 text-gray-600 bg-red-50/20">Manual hand-written slips, rounding disputes</td>
                  <td className="py-4 px-6 text-gray-900 font-medium bg-green-50/20">
                    <span className="inline-flex items-center text-green-700 font-semibold gap-1.5">
                      <Check className="w-4 h-4 text-green-600" />
                      Direct digital weighbridge gross & tare capture
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Quality Inspection</td>
                  <td className="py-4 px-6 text-gray-600 bg-red-50/20">Subjective visual inspection, opaque deductions</td>
                  <td className="py-4 px-6 text-gray-900 font-medium bg-green-50/20">
                    <span className="inline-flex items-center text-green-700 font-semibold gap-1.5">
                      <Check className="w-4 h-4 text-green-600" />
                      Standardized Agmarknet moisture & grain grading
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Procurement Settlement</td>
                  <td className="py-4 px-6 text-gray-600 bg-red-50/20">Delayed checks or commission cuts over weeks</td>
                  <td className="py-4 px-6 text-gray-900 font-medium bg-green-50/20">
                    <span className="inline-flex items-center text-green-700 font-semibold gap-1.5">
                      <Check className="w-4 h-4 text-green-600" />
                      Direct Benefit Transfer (DBT) with bank UTR
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Transaction Proof</td>
                  <td className="py-4 px-6 text-gray-600 bg-red-50/20">Easily lost paper slips with minimal traceability</td>
                  <td className="py-4 px-6 text-gray-900 font-medium bg-green-50/20">
                    <span className="inline-flex items-center text-green-700 font-semibold gap-1.5">
                      <Check className="w-4 h-4 text-green-600" />
                      Audit-verified downloadable digital receipt
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 7 & 8: QUEUE, CAPACITY & PAYMENT TRANSPARENCY DEEP DIVE */}
      <section className="py-16 sm:py-24 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Queue & Capacity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Intelligent Intake Management
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201A] tracking-tight">
                Capacity-Aware Slot Engine & Bay Optimization
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Rather than treating all mandis uniformly, KisanSetu indexes each centre active weighbridges, total bays, and hourly throughput. When slots fill, the engine prevents over-subscription and guides farmers to less congested neighbouring centers or alternate times.
              </p>
              <ul className="space-y-2 text-xs text-gray-700 pt-2 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Real-time queue length tracking with bay-specific load balancing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Persistent Queue Pause controls for weather contingencies or maintenance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>Approaching turn alerts sent directly to registered farmer devices</span>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6">
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <span className="text-xs font-bold uppercase text-gray-700">Mandi Intake Load Monitor</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 font-semibold">Active Bays: 4 / 4</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Bay 1 (Heavy Vehicle Weighbridge)</span>
                      <span className="font-semibold text-gray-800">Operating • 3 Waiting</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Bay 2 (Electronic Platform Scale)</span>
                      <span className="font-semibold text-gray-800">Operating • 2 Waiting</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                      <span>Bay 3 (Quality Inspection Lab)</span>
                      <span className="font-semibold text-gray-800">Operating • 4 In Testing</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 italic pt-1">
                  Queue throughput dynamically calculated from timestamped weighbridge logs.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Transparency */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-8 border-t border-gray-100">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="p-6 rounded-2xl bg-[#F0FDF4] border border-green-200 space-y-4">
                <div className="flex items-center justify-between border-b border-green-200 pb-3">
                  <span className="text-xs font-bold uppercase text-green-900">Procurement Ledger Formula</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-200 text-green-900 font-semibold">Zero Commission Cuts</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Net Quantity (Certified Weighment):</span>
                    <span className="font-bold text-gray-900">50.00 Quintals</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Statutory Base Rate (Wheat MSP 2026):</span>
                    <span className="font-bold text-gray-900">₹2,275.00 / Quintal</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Calculated Gross Procurement Value:</span>
                    <span className="font-bold text-gray-900">₹1,13,750.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-green-100">
                    <span className="text-gray-600">Statutory Mandi Cess (2.0%):</span>
                    <span className="font-semibold text-red-600">- ₹2,275.00</span>
                  </div>
                  <div className="flex justify-between py-2 pt-2 text-sm font-extrabold text-green-900 bg-green-100/70 px-2 rounded-lg">
                    <span>Direct Payable Amount (DBT):</span>
                    <span>₹1,11,475.00</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-green-800">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>Settlement linked to Aadhaar/Bank account with unique Bank UTR reference.</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Statutory Financial Assurance
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17201A] tracking-tight">
                Direct Benefit Transfer with Real Bank UTRs
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                By removing cash intermediaries and manual commission deductions, KisanSetu routes funds directly through Public Financial Management System (PFMS) protocols. Farmers receive their exact calculated entitlement with timestamped transaction audit trails.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-gray-200 bg-white">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">Settlement Mechanism</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">Direct to Bank (DBT)</p>
                </div>
                <div className="p-3 rounded-xl border border-gray-200 bg-white">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">Audit Trail</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">12-Digit Banking UTR</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: FAQ */}
      <section className="py-16 sm:py-24 bg-[#F7F9F5] border-b border-gray-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100 px-3 py-1 rounded-full border border-green-200">
              Clear & Factual Guidance
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#17201A] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-[#64748B]">
              Real operational queries answered with direct facts about platform behavior.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="card p-6 bg-white rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{faq.q}</h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/faq"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#16A34A] hover:text-[#15803D]"
            >
              <span>View full categorized FAQ knowledge base</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 10: CALL TO ACTION */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#14532D] to-[#166534] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-green-200">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Digital Public Infrastructure • Ready for Harvest</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Start Your Digital Mandi Journey Today
          </h2>

          <p className="text-base sm:text-lg text-green-100 max-w-2xl mx-auto leading-relaxed">
            Whether you are a farmer scheduling your lot delivery or an officer managing intake operations, KisanSetu gives you the transparent tools you need.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#14532D] font-bold text-base hover:bg-green-50 shadow-md transition-all duration-200"
            >
              Register as a Farmer
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-transparent border-2 border-white/80 text-white font-bold text-base hover:bg-white/10 transition-all duration-200"
            >
              Sign In to Your Account
            </Link>
            <Link
              to="/how-it-works"
              className="w-full sm:w-auto px-6 py-3.5 text-green-200 hover:text-white text-sm font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <span>Learn How It Works</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
