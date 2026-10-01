import React, { useState } from 'react';
import PublicLayout from '../../components/public/PublicLayout';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ContactPage() {
  const { language } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    mandi: '',
    category: 'SLOT_BOOKING',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <PublicLayout
      title="Contact & Helpdesk — KisanSetu Mandi Assistance"
      description="Get in touch with KisanSetu operational support, report a weighbridge discrepancy, or seek help with slot bookings and DBT settlements."
    >
      {/* Header */}
      <section className="bg-gradient-to-b from-[#F0FDF4] to-[#F7F9F5] py-16 sm:py-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-xs font-semibold text-green-800 border border-green-200">
            <PhoneCall className="w-3.5 h-3.5 text-green-700" />
            <span>Mandi Support & Grievance Redressal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#17201A] tracking-tight">
            Contact & Operational Assistance
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Need help with a slot reservation, weighbridge verification, or DBT payment tracking? Our mandi support team is here to assist you.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <section className="py-16 sm:py-20 bg-white border-b border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Contact Channels */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  Direct Assistance
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mt-2">
                  Official Communication Channels
                </h2>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Connect with the central procurement operations helpline or visit an on-site mandi assistance desk.
                </p>
              </div>

              <div className="space-y-4">
                <div className="card p-5 bg-[#F7F9F5] border border-gray-200/80 rounded-2xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Toll-Free Helpline</span>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">1800-180-1551</p>
                    <p className="text-xs text-gray-500">Toll-free across all participating Indian states</p>
                  </div>
                </div>

                <div className="card p-5 bg-[#F7F9F5] border border-gray-200/80 rounded-2xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Email Support</span>
                    <p className="text-base font-bold text-gray-900 mt-0.5">support@kisansetu.gov.in</p>
                    <p className="text-xs text-gray-500">Typical response within 24 business hours</p>
                  </div>
                </div>

                <div className="card p-5 bg-[#F7F9F5] border border-gray-200/80 rounded-2xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Operating Hours</span>
                    <p className="text-base font-bold text-gray-900 mt-0.5">08:00 AM – 06:00 PM IST</p>
                    <p className="text-xs text-gray-500">Monday through Saturday (APMC Working Days)</p>
                  </div>
                </div>

                <div className="card p-5 bg-[#F7F9F5] border border-gray-200/80 rounded-2xl flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Physical Assistance Desks</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">Kisan Sahayata Kendras</p>
                    <p className="text-xs text-gray-500">Available at the entrance of all registered APMC mandi centers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Contact / Grievance Form */}
            <div className="lg:col-span-7">
              <div className="card-elevated p-8 bg-white border border-gray-200 rounded-3xl shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Submit an Inquiry or Grievance
                </h3>
                <p className="text-xs text-gray-500 mb-6">
                  Provide your booking or token details for prompt resolution by the regional Mandi Nodal Officer.
                </p>

                {submitted ? (
                  <div className="p-6 rounded-2xl bg-green-50 border border-green-200 text-center space-y-3 animate-fadeIn">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="text-lg font-bold text-green-900">Inquiry Received</h4>
                    <p className="text-sm text-green-800 max-w-md mx-auto leading-relaxed">
                      Thank you. Your request has been logged. An operational officer will review your ticket within 24 hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="btn-secondary text-xs py-2 px-4 rounded-xl mt-2"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="input-field"
                          placeholder="e.g. Ramesh Singh"
                        />
                      </div>
                      <div>
                        <label className="label">Registered Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="input-field"
                          placeholder="e.g. 9876543210"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Mandi Centre</label>
                        <input
                          type="text"
                          value={formData.mandi}
                          onChange={(e) => setFormData({ ...formData, mandi: e.target.value })}
                          className="input-field"
                          placeholder="e.g. Lucknow APMC Main Yard"
                        />
                      </div>
                      <div>
                        <label className="label">Inquiry Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="input-field"
                        >
                          <option value="SLOT_BOOKING">Slot Reservation & Timing</option>
                          <option value="TOKEN_QUEUE">Token & Queue Inquiry</option>
                          <option value="WEIGHMENT">Weighbridge Measurement Inquiry</option>
                          <option value="QUALITY_CHECK">Quality Grade & Agmarknet</option>
                          <option value="DBT_PAYMENT">DBT & Payment Status</option>
                          <option value="TECHNICAL">Technical / Portal Issue</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="label">Description / Grievance Details</label>
                      <textarea
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="input-field py-3 resize-none"
                        placeholder="Please include your Token Number (e.g. T-2026-0042) or Slot Date if applicable..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary w-full py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Grievance to Mandi Desk</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
