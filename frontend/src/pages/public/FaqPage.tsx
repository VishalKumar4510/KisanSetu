import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/public/PublicLayout';
import { HelpCircle, ChevronDown, ChevronUp, Search, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function FaqPage() {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'slots', name: 'Slots & Queuing' },
    { id: 'weighing', name: 'Weighing & Intake' },
    { id: 'quality', name: 'Quality & Agmarknet' },
    { id: 'payments', name: 'Payments & DBT' },
    { id: 'security', name: 'Security & Access' },
  ];

  const faqItems = [
    {
      cat: 'slots',
      q: 'How does the capacity-aware slot booking system work?',
      a: 'Each Mandi centre has a configured daily capacity determined by its operational intake bays and weighbridge hardware. When booking a slot, the system checks current reservations and allows booking only if the slot is not full. Once filled, that specific slot is marked FULL, preventing over-subscription.',
    },
    {
      cat: 'slots',
      q: 'Can I cancel or reschedule my booked mandi slot?',
      a: 'Yes. If you are unable to bring your produce on your scheduled date, you can cancel your active booking through the Farmer Dashboard. Cancelling immediately frees up that slot capacity for another farmer and updates your digital token status to CANCELLED.',
    },
    {
      cat: 'slots',
      q: 'What is the purpose of the Queue Pause control?',
      a: 'During unpredictable events such as severe rain, physical road blockages, scale re-calibration, or equipment breakdown, the Mandi Officer can trigger an emergency Queue Pause. This halts new token dispatches while preserving all existing farmer positions in the database.',
    },
    {
      cat: 'weighing',
      q: 'How does digital weighbridge integration prevent manual weighing errors?',
      a: 'Rather than relying on hand-written slips, electronic weighbridges transmit gross weight (vehicle plus grain) and tare weight (empty vehicle) directly to the application backend. The net produce weight is calculated automatically (Net = Gross - Tare) and stored with a timestamped record.',
    },
    {
      cat: 'weighing',
      q: 'What happens if there is a discrepancy in weighment?',
      a: 'The electronic weighment log records the scale ID, gross weight, tare weight, net kilograms, and operator timestamp. If a dispute arises, the vehicle can be re-weighed on an alternate calibrated scale, and the audit trail updates transparently.',
    },
    {
      cat: 'quality',
      q: 'What quality parameters are inspected before procurement?',
      a: 'Authorized Mandi inspectors assess representative grain samples for moisture content percentage, foreign matter, and damaged/discolored grains in accordance with official Agmarknet specifications. Based on measured numbers, the lot is certified as Grade A, B, or C.',
    },
    {
      cat: 'quality',
      q: 'Can my lot be rejected if it does not meet basic standards?',
      a: 'Yes. If moisture content or foreign matter exceeds statutory maximum threshold limits for human consumption or storage safety, the system flags the lot as rejected with an explicit rejection reason recorded in the timeline.',
    },
    {
      cat: 'payments',
      q: 'How is the payment amount determined?',
      a: 'The calculation engine takes certified net weight and multiplies it by the government Minimum Support Price (MSP) for the crop type. Any statutory deductions (such as standard Mandi cess) are itemized on the procurement sheet before final payment authorization.',
    },
    {
      cat: 'payments',
      q: 'How quickly is money credited to the farmer bank account?',
      a: 'Once the Mandi Officer audits the procurement sheet, the payment is dispatched via Direct Benefit Transfer (DBT). The transaction reference and official 12-digit Banking UTR are recorded in the system so the farmer can verify deposit directly with their bank.',
    },
    {
      cat: 'security',
      q: 'Is my personal information and bank account safe?',
      a: 'Yes. Bank account numbers are strictly masked on all client-facing screens (showing only the last 4 digits). All passwords are cryptographically hashed using bcrypt with high work factors, and API endpoints enforce strict Role-Based Access Control.',
    },
    {
      cat: 'security',
      q: 'Can another farmer access my digital token or procurement history?',
      a: 'No. KisanSetu enforces Broken Object Level Authorization (BOLA) protections. An authenticated farmer can only view, manage, and download receipts for their own registered produce and tokens.',
    },
  ];

  const filteredFaqs = faqItems.filter((item) => {
    const matchesCat = activeCategory === 'all' || item.cat === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <PublicLayout
      title="FAQ — Frequently Asked Questions | KisanSetu"
      description="Find answers to common questions about KisanSetu slot booking, digital tokens, electronic weighbridge logging, Agmarknet grading, and DBT payments."
    >
      {/* Header */}
      <section className="bg-gradient-to-b from-[#F0FDF4] to-[#F7F9F5] py-16 sm:py-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-xs font-semibold text-green-800 border border-green-200">
            <HelpCircle className="w-3.5 h-3.5 text-green-700" />
            <span>Knowledge Base & Guidance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#17201A] tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Direct, factual answers to common procedural and technical questions regarding the KisanSetu procurement platform.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g., slot, weighbridge, DBT, moisture)..."
                className="input-field pl-12 h-12 shadow-xs"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs & FAQ List */}
      <section className="py-12 sm:py-16 bg-white border-b border-gray-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-150 ${
                  activeCategory === cat.id
                    ? 'bg-[#16A34A] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          {filteredFaqs.length > 0 ? (
            <div className="space-y-4">
              {filteredFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="card p-6 bg-[#F7F9F5] border border-gray-200/80 rounded-2xl space-y-2 shadow-xs"
                >
                  <h3 className="text-base font-bold text-gray-900 flex items-start gap-2.5">
                    <span className="text-[#16A34A] font-extrabold text-sm shrink-0 mt-0.5">Q:</span>
                    <span>{faq.q}</span>
                  </h3>
                  <p className="text-sm text-gray-600 pl-6 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No questions matched your search query. Try searching with different keywords.</p>
            </div>
          )}

          {/* Still have questions? */}
          <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-[#F0FDF4] border border-green-200 text-center space-y-3">
            <h3 className="text-lg font-bold text-green-900">Still have questions?</h3>
            <p className="text-xs sm:text-sm text-green-800 max-w-lg mx-auto">
              Our dedicated Mandi operational desk is available to assist farmers and officers during APMC business hours.
            </p>
            <div className="pt-2">
              <Link to="/contact" className="btn-primary text-sm py-2 px-5 rounded-xl">
                Contact Support & Helpdesk
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
