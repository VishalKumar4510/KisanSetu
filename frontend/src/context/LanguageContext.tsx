import React, { createContext, useContext, useState, ReactNode } from 'react';

const translations: Record<string, Record<string, string>> = {
  en: {
    appName: 'KisanSetu', tagline: 'Smart Procurement. Less Waiting. Complete Transparency.',
    dashboard: 'Dashboard', bookSlot: 'Book Slot', liveQueue: 'Live Queue', myToken: 'My Token',
    procurementStatus: 'Procurement Status', payment: 'Payment', profile: 'Profile',
    notifications: 'Notifications', selectCentre: 'Select Centre', registerProduce: 'Register Produce',
    queuePosition: 'Queue Position', estimatedWait: 'Estimated Wait', paymentStatus: 'Payment Status',
    welcome: 'Welcome', farmer: 'Farmer', centre: 'Centre', slot: 'Slot', weight: 'Weight',
    quality: 'Quality', amount: 'Amount', status: 'Status', search: 'Search',
    cancel: 'Cancel', confirm: 'Confirm', submit: 'Submit', back: 'Back',
    noData: 'No data available', loading: 'Loading...', error: 'Error',
    login: 'Login', logout: 'Logout', phone: 'Phone Number', password: 'Password',
    name: 'Name', village: 'Village', district: 'District', state: 'State',
    landArea: 'Land Area', crops: 'Crops', produceType: 'Produce Type', quantity: 'Quantity',
    unit: 'Unit', grade: 'Grade', mspRate: 'MSP Rate', grossAmount: 'Gross Amount',
    deductions: 'Deductions', netAmount: 'Net Amount', dbtReference: 'DBT Reference',
    tokenNumber: 'Token Number', slotTime: 'Slot Time', date: 'Date',
    available: 'Available', full: 'Full', active: 'Active', completed: 'Completed',
    pending: 'Pending', processing: 'Processing', queueLength: 'Queue Length',
    avgWaitTime: 'Avg Wait Time', utilization: 'Utilization', congestion: 'Congestion',
    lowCongestion: 'Low', moderateCongestion: 'Moderate', highCongestion: 'High',
    farmersRegistered: 'Farmers Registered', todaysBookings: "Today's Bookings",
    activeQueue: 'Active Queue', completedProcurement: 'Completed Procurement',
    paymentsProcessed: 'Payments Processed', startDemo: 'Start Live Demo', stopDemo: 'Stop Demo',
    recommended: 'Recommended', reason: 'Reason', book: 'Book', view: 'View',
    markRead: 'Mark as Read', markAllRead: 'Mark All Read', send: 'Send',
    analytics: 'Analytics', reports: 'Reports', centreMonitoring: 'Centre Monitoring',
    slotManagement: 'Slot Management', paymentMonitoring: 'Payment Monitoring',
    officerDashboard: 'Officer Dashboard', adminDashboard: 'Admin Dashboard',
    procurementManagement: 'Procurement Management', farmerManagement: 'Farmer Management',
    queueManagement: 'Queue Management', callNext: 'Call Next', process: 'Process',
    today: 'Today', last7Days: 'Last 7 Days', last30Days: 'Last 30 Days',
    askAI: 'Ask KisanSetu AI', typeQuestion: 'Type your question...',
    impactMetrics: 'Impact Metrics', prototypeTargets: 'Prototype Targets — Not Measured Results',
    home: 'Home',
  },
  hi: {
    appName: 'किसानसेतु', tagline: 'स्मार्ट खरीद। कम प्रतीक्षा। पूर्ण पारदर्शिता।',
    dashboard: 'डैशबोर्ड', bookSlot: 'स्लॉट बुक करें', liveQueue: 'लाइव कतार', myToken: 'मेरा टोकन',
    procurementStatus: 'खरीद स्थिति', payment: 'भुगतान', profile: 'प्रोफ़ाइल',
    notifications: 'सूचनाएं', selectCentre: 'केंद्र चुनें', registerProduce: 'उपज दर्ज करें',
    queuePosition: 'कतार स्थिति', estimatedWait: 'अनुमानित प्रतीक्षा', paymentStatus: 'भुगतान स्थिति',
    welcome: 'स्वागत है', farmer: 'किसान', centre: 'केंद्र', slot: 'स्लॉट', weight: 'वज़न',
    quality: 'गुणवत्ता', amount: 'राशि', status: 'स्थिति', search: 'खोजें',
    cancel: 'रद्द करें', confirm: 'पुष्टि करें', submit: 'जमा करें', back: 'वापस',
    noData: 'कोई डेटा नहीं', loading: 'लोड हो रहा है...', error: 'त्रुटि',
    login: 'लॉगिन', logout: 'लॉगआउट', phone: 'फ़ोन नंबर', password: 'पासवर्ड',
    name: 'नाम', village: 'गाँव', district: 'जिला', state: 'राज्य',
    landArea: 'भूमि क्षेत्र', crops: 'फसलें', produceType: 'उपज प्रकार', quantity: 'मात्रा',
    unit: 'इकाई', grade: 'ग्रेड', mspRate: 'MSP दर', grossAmount: 'कुल राशि',
    deductions: 'कटौती', netAmount: 'शुद्ध राशि', dbtReference: 'DBT संदर्भ',
    tokenNumber: 'टोकन नंबर', slotTime: 'स्लॉट समय', date: 'तारीख',
    available: 'उपलब्ध', full: 'भरा', active: 'सक्रिय', completed: 'पूर्ण',
    pending: 'लंबित', processing: 'प्रक्रिया में', queueLength: 'कतार लंबाई',
    avgWaitTime: 'औसत प्रतीक्षा', utilization: 'उपयोग', congestion: 'भीड़',
    lowCongestion: 'कम', moderateCongestion: 'मध्यम', highCongestion: 'अधिक',
    farmersRegistered: 'पंजीकृत किसान', todaysBookings: 'आज की बुकिंग',
    activeQueue: 'सक्रिय कतार', completedProcurement: 'पूर्ण खरीद',
    paymentsProcessed: 'प्रसंस्कृत भुगतान', startDemo: 'लाइव डेमो शुरू करें', stopDemo: 'डेमो बंद करें',
    recommended: 'अनुशंसित', reason: 'कारण', book: 'बुक करें', view: 'देखें',
    markRead: 'पढ़ा हुआ', markAllRead: 'सभी पढ़ा हुआ', send: 'भेजें',
    analytics: 'विश्लेषण', reports: 'रिपोर्ट', centreMonitoring: 'केंद्र निगरानी',
    slotManagement: 'स्लॉट प्रबंधन', paymentMonitoring: 'भुगतान निगरानी',
    officerDashboard: 'अधिकारी डैशबोर्ड', adminDashboard: 'एडमिन डैशबोर्ड',
    procurementManagement: 'खरीद प्रबंधन', farmerManagement: 'किसान प्रबंधन',
    queueManagement: 'कतार प्रबंधन', callNext: 'अगला बुलाएं', process: 'प्रक्रिया',
    today: 'आज', last7Days: 'पिछले 7 दिन', last30Days: 'पिछले 30 दिन',
    askAI: 'किसानसेतु AI से पूछें', typeQuestion: 'अपना प्रश्न लिखें...',
    impactMetrics: 'प्रभाव मैट्रिक्स', prototypeTargets: 'प्रोटोटाइप लक्ष्य — वास्तविक परिणाम नहीं',
    home: 'होम',
  },
};

interface LanguageContextType {
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en', setLanguage: () => {}, t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'hi'>(() => {
    return (localStorage.getItem('kisansetu_lang') as 'en' | 'hi') || 'en';
  });

  const handleSetLanguage = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    localStorage.setItem('kisansetu_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
