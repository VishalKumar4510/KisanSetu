import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Minus,
  Maximize2,
  ChevronRight,
  ExternalLink,
  Info,
  Clock,
  Ticket,
  Users,
  Wheat,
  CreditCard,
  Calendar,
  AlertCircle,
  Loader2,
  Globe,
  CornerDownLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { aiAPI, AiQueryResponseData } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  textEn: string;
  textHi: string;
  timestamp: string;
  data?: any;
  isError?: boolean;
}

interface SuggestedPrompt {
  id: string;
  labelEn: string;
  labelHi: string;
  queryEn: string;
  queryHi: string;
  icon: React.ReactNode;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'msp',
    labelEn: "Today's MSP Rates",
    labelHi: 'आज का एमएसपी भाव',
    queryEn: "What is today's MSP?",
    queryHi: 'आज का एमएसपी क्या है?',
    icon: <Wheat className="w-3.5 h-3.5 text-amber-600" />,
  },
  {
    id: 'token',
    labelEn: 'My Token Status',
    labelHi: 'मेरे टोकन की स्थिति',
    queryEn: 'What is my token status?',
    queryHi: 'मेरे टोकन की स्थिति क्या है?',
    icon: <Ticket className="w-3.5 h-3.5 text-blue-600" />,
  },
  {
    id: 'waiting',
    labelEn: 'Waiting Farmers in Queue',
    labelHi: 'कतार में प्रतीक्षारत किसान',
    queryEn: 'How many farmers are waiting?',
    queryHi: 'कितने किसान प्रतीक्षा कर रहे हैं?',
    icon: <Users className="w-3.5 h-3.5 text-purple-600" />,
  },
  {
    id: 'earliest-slot',
    labelEn: 'Earliest Available Slot',
    labelHi: 'सबसे पहला उपलब्ध स्लॉट',
    queryEn: 'Which slot is available earliest?',
    queryHi: 'सबसे पहला स्लॉट कौन सा है?',
    icon: <Calendar className="w-3.5 h-3.5 text-emerald-600" />,
  },
  {
    id: 'longest-queue',
    labelEn: 'Longest Queue Centre',
    labelHi: 'सबसे लंबी कतार वाला केंद्र',
    queryEn: 'Which centre has the longest queue?',
    queryHi: 'किस केंद्र में सबसे लंबी कतार है?',
    icon: <Clock className="w-3.5 h-3.5 text-orange-600" />,
  },
  {
    id: 'lowest-wait',
    labelEn: 'Shortest Wait Centre',
    labelHi: 'सबसे कम प्रतीक्षा वाला केंद्र',
    queryEn: 'Which centre has the lowest waiting time?',
    queryHi: 'सबसे कम प्रतीक्षा किस केंद्र में है?',
    icon: <Clock className="w-3.5 h-3.5 text-teal-600" />,
  },
  {
    id: 'payment',
    labelEn: 'My Payment Status',
    labelHi: 'मेरे भुगतान की स्थिति',
    queryEn: 'What is my payment status?',
    queryHi: 'मेरे भुगतान की स्थिति क्या है?',
    icon: <CreditCard className="w-3.5 h-3.5 text-green-600" />,
  },
];

export function FarmerAIAssistant() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadPulse, setHasUnreadPulse] = useState(true);

  const initialWelcomeMessage: ChatMessage = {
    id: 'welcome-1',
    sender: 'assistant',
    textEn:
      'Namaste! I am your KisanSetu Mandi Assistant. Ask me about current MSP rates, earliest slot openings, live queue congestion, or your active token pass.',
    textHi:
      'नमस्ते! मैं आपका किसानसेतु मंडी सहायक हूँ। आप मुझसे न्यूनतम समर्थन मूल्य (MSP), सबसे पहले उपलब्ध स्लॉट, मंडी कतार की स्थिति या अपने टोकन पास के बारे में पूछ सकते हैं।',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialWelcomeMessage]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasUnreadPulse(false);
    }
  }, [isOpen, isMinimized]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      textEn: textToSend,
      textHi: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await aiAPI.query(textToSend, user?.id);

      if (response.data?.success && response.data.data) {
        const payload: AiQueryResponseData = response.data.data;
        const assistantMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          textEn: payload.answer || payload.answerHi || 'Information received.',
          textHi: payload.answerHi || payload.answer || 'जानकारी प्राप्त हुई।',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          data: payload.data,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Could not retrieve assistant response');
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        textEn:
          'Unable to reach the KisanSetu mandi service. Please check your internet connection or try again.',
        textHi:
          'किसानसेतु मंडी सेवा से संपर्क नहीं हो सका। कृपया अपना इंटरनेट कनेक्शन जांचें या पुनः प्रयास करें।',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        textEn: 'Chat refreshed. How can I help you with mandi operations today?',
        textHi: 'वार्तालाप रीफ्रेश किया गया। आज मैं मंडी संचालन में आपकी क्या सहायता कर सकता हूँ?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderStructuredData = (data: any) => {
    if (!data) return null;

    // MSP Rates Card
    if (data.mspRates) {
      const rates = data.mspRates;
      return (
        <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-amber-900 border-b border-amber-200/70 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Wheat className="w-3.5 h-3.5 text-amber-700" />
              {language === 'hi' ? 'समर्थन मूल्य (रु/क्विंटल)' : 'Government MSP Rates (₹/Qtl)'}
            </span>
            <Badge variant="outline" size="sm" className="bg-white text-amber-800 border-amber-300">
              2025–26
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {rates.WHEAT && (
              <div className="p-1.5 bg-white rounded-lg border border-amber-100 flex items-center justify-between">
                <span className="text-gray-700">🌾 {language === 'hi' ? 'गेहूं' : 'Wheat'}</span>
                <span className="font-bold text-[#14532D]">₹{rates.WHEAT}</span>
              </div>
            )}
            {rates.PADDY && (
              <div className="p-1.5 bg-white rounded-lg border border-amber-100 flex items-center justify-between">
                <span className="text-gray-700">🍚 {language === 'hi' ? 'धान' : 'Paddy'}</span>
                <span className="font-bold text-[#14532D]">₹{rates.PADDY}</span>
              </div>
            )}
            {rates.MAIZE && (
              <div className="p-1.5 bg-white rounded-lg border border-amber-100 flex items-center justify-between">
                <span className="text-gray-700">🌽 {language === 'hi' ? 'मक्का' : 'Maize'}</span>
                <span className="font-bold text-[#14532D]">₹{rates.MAIZE}</span>
              </div>
            )}
            {rates.PULSES && (
              <div className="p-1.5 bg-white rounded-lg border border-amber-100 flex items-center justify-between">
                <span className="text-gray-700">🫘 {language === 'hi' ? 'दालें' : 'Pulses'}</span>
                <span className="font-bold text-[#14532D]">₹{rates.PULSES}</span>
              </div>
            )}
            {rates.ONION && (
              <div className="p-1.5 bg-white rounded-lg border border-amber-100 flex items-center justify-between col-span-2">
                <span className="text-gray-700">🧅 {language === 'hi' ? 'प्याज' : 'Onion'}</span>
                <span className="font-bold text-[#14532D]">₹{rates.ONION}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/farmer/centres');
            }}
            className="w-full mt-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 text-[11px] transition-colors shadow-2xs"
          >
            <span>{language === 'hi' ? 'स्लॉट बुक करने के लिए केंद्र चुनें' : 'Select Centre & Book Slot'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // Active Token Card
    if (data.tokenNumber) {
      return (
        <div className="mt-2.5 p-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-200/70 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-emerald-700" />
              {language === 'hi' ? 'सक्रिय डिजिटल टोकन' : 'Active Digital Token'}
            </span>
            <Badge variant="primary" size="sm">
              {data.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-emerald-100">
            <div>
              <span className="text-gray-500 block text-[10px]">{language === 'hi' ? 'टोकन संख्या' : 'Token No'}</span>
              <span className="font-bold text-sm text-[#14532D]">{data.tokenNumber}</span>
            </div>
            {data.queuePosition !== undefined && (
              <div className="text-right">
                <span className="text-gray-500 block text-[10px]">{language === 'hi' ? 'कतार स्थिति' : 'Position'}</span>
                <span className="font-bold text-sm text-purple-700">#{data.queuePosition}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/farmer/token');
            }}
            className="w-full py-1.5 px-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 text-[11px] transition-colors shadow-2xs"
          >
            <span>{language === 'hi' ? 'डिजिटल टोकन पास देखें' : 'View Digital Token Pass'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // Earliest Available Slot Card
    if (data.date && data.timeStart) {
      return (
        <div className="mt-2.5 p-2.5 bg-blue-50/80 border border-blue-200/90 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-blue-900 border-b border-blue-200/70 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-700" />
              {language === 'hi' ? 'उपलब्ध स्लॉट विवरण' : 'Available Slot Details'}
            </span>
            <Badge variant="outline" size="sm" className="bg-white text-blue-800 border-blue-300">
              {data.capacity ? `${data.capacity} spots` : 'Open'}
            </Badge>
          </div>
          <div className="bg-white p-2 rounded-lg border border-blue-100 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">{language === 'hi' ? 'तारीख' : 'Date'}:</span>
              <span className="font-semibold text-gray-800">{data.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{language === 'hi' ? 'समय' : 'Time'}:</span>
              <span className="font-semibold text-blue-700">{data.timeStart} – {data.timeEnd || ''}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/farmer/centres');
            }}
            className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 text-[11px] transition-colors shadow-2xs"
          >
            <span>{language === 'hi' ? 'यह स्लॉट बुक करें' : 'Book This Slot'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // Waiting Farmers Count Card
    if (data.totalWaiting !== undefined) {
      return (
        <div className="mt-2.5 p-2.5 bg-purple-50/80 border border-purple-200/90 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-purple-900">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-700" />
              {language === 'hi' ? 'लाइव कतार लोड' : 'Live Queue Concurrency'}
            </span>
            <span className="text-base font-extrabold text-purple-800">{data.totalWaiting} {language === 'hi' ? 'किसान' : 'Farmers'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/farmer/queue');
            }}
            className="w-full py-1 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 text-[11px] transition-colors"
          >
            <span>{language === 'hi' ? 'लाइव कतार बोर्ड देखें' : 'View Live Queue Board'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // Payment Card
    if (data.netAmount !== undefined && data.status) {
      return (
        <div className="mt-2.5 p-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-emerald-900 border-b border-emerald-200/70 pb-1.5">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
              {language === 'hi' ? 'डीबीटी भुगतान विवरण' : 'DBT Payment Details'}
            </span>
            <Badge variant="primary" size="sm">
              {data.status}
            </Badge>
          </div>
          <div className="bg-white p-2 rounded-lg border border-emerald-100 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">{language === 'hi' ? 'शुद्ध राशि' : 'Net Amount'}:</span>
              <span className="font-extrabold text-sm text-[#14532D]">₹{Number(data.netAmount).toLocaleString()}</span>
            </div>
            {data.dbtReferenceId && (
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500">{language === 'hi' ? 'संदर्भ आईडी' : 'DBT Ref'}:</span>
                <span className="font-mono text-gray-700">{data.dbtReferenceId}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/farmer/payment');
            }}
            className="w-full py-1.5 px-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 text-[11px] transition-colors"
          >
            <span>{language === 'hi' ? 'भुगतान विवरण देखें' : 'View Payment Statement'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Floating Assistant Button (FAB) */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40">
          <button
            type="button"
            id="farmer-ai-assistant-toggle"
            aria-label={language === 'hi' ? 'किसानसेतु मंडी सहायक खोलें' : 'Open KisanSetu Mandi Assistant'}
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#15803D] to-[#14532D] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#16A34A]/40"
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 text-white transition-transform group-hover:rotate-6" />
              <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>

            <div className="text-left hidden sm:block">
              <span className="block text-xs font-bold leading-none tracking-tight">
                {language === 'hi' ? 'मंडी सहायक' : 'Mandi Assistant'}
              </span>
              <span className="block text-[10px] text-green-100 font-medium leading-tight">
                {language === 'hi' ? 'MSP व कतार सहायता' : 'MSP & Queue Help'}
              </span>
            </div>

            {hasUnreadPulse && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white" />
              </span>
            )}
          </button>
        </div>
      )}

      {/* Assistant Modal / Drawer Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={language === 'hi' ? 'किसानसेतु मंडी सहायक' : 'KisanSetu Mandi Assistant'}
          className={cn(
            'fixed z-50 transition-all duration-200 flex flex-col bg-white border border-gray-200/90 shadow-2xl overflow-hidden',
            // Mobile full bottom sheet, Desktop anchored window
            'max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[88vh] max-sm:rounded-t-3xl max-sm:border-b-0',
            'sm:bottom-6 sm:right-6 sm:w-[430px] sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl',
            isMinimized ? 'sm:h-14' : 'sm:h-[620px] sm:max-h-[86vh]'
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#15803D] via-[#16A34A] to-[#14532D] text-white px-4 py-3 flex items-center justify-between shrink-0 select-none shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold truncate leading-none text-white">
                    {language === 'hi' ? 'किसानसेतु मंडी सहायक' : 'KisanSetu Mandi Assistant'}
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" title="Online" />
                </div>
                <p className="text-[10px] text-green-100 truncate mt-0.5">
                  {language === 'hi' ? 'नियम-आधारित संचालन सहायक (सत्यवादी डेटा)' : 'Operational Mandi Query Assistant'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Language Switch */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                title="Switch Language / भाषा बदलें"
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors border border-white/15"
              >
                <Globe className="w-3 h-3" />
                <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
              </button>

              {/* Clear Chat */}
              <button
                type="button"
                onClick={handleClearHistory}
                title={language === 'hi' ? 'वार्तालाप साफ़ करें' : 'Clear Chat'}
                aria-label="Clear chat history"
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Minimize (Desktop) */}
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Maximize' : 'Minimize'}
                aria-label={isMinimized ? 'Maximize assistant' : 'Minimize assistant'}
                className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title={language === 'hi' ? 'बंद करें' : 'Close'}
                aria-label="Close assistant"
                className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Assistant Body (hidden if minimized on desktop) */}
          {!isMinimized && (
            <div className="flex flex-col flex-1 min-h-0 bg-[#F8FAF6]">
              {/* System Transparency Disclosure */}
              <div className="px-3 py-1.5 bg-emerald-50/90 border-b border-emerald-100 flex items-center gap-2 text-[10px] text-emerald-900 shrink-0">
                <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate">
                  {language === 'hi'
                    ? 'सटीक मंडी सहायता: एमएसपी, टोकन स्थिति, कतार प्रतीक्षा व निकटतम स्लॉट।'
                    : 'Mandi Assistant: Instant answers for MSP rates, tokens, queues & slots.'}
                </span>
              </div>

              {/* Chat Messages Scroll Area */}
              <div
                ref={chatContainerRef}
                tabIndex={0}
                aria-label="Conversation messages"
                aria-live="polite"
                aria-atomic="false"
                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 focus:outline-none"
              >
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const displayText = language === 'hi' ? msg.textHi || msg.textEn : msg.textEn || msg.textHi;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex flex-col max-w-[86%] sm:max-w-[82%]',
                        isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                      )}
                    >
                      <div
                        className={cn(
                          'p-3 rounded-2xl text-xs leading-relaxed shadow-2xs',
                          isUser
                            ? 'bg-[#15803D] text-white rounded-br-xs'
                            : msg.isError
                            ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-xs'
                            : 'bg-white text-gray-800 border border-gray-200/90 rounded-bl-xs'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{displayText}</p>
                        {!isUser && renderStructuredData(msg.data)}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}

                {/* Loading typing bubble */}
                {isLoading && (
                  <div className="mr-auto items-start max-w-[80%] flex flex-col">
                    <div className="bg-white border border-gray-200/90 p-3 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-2 text-xs text-gray-600">
                      <Loader2 className="w-3.5 h-3.5 text-[#16A34A] animate-spin" />
                      <span>{language === 'hi' ? 'मंडी डेटा जांच रहे हैं...' : 'Checking mandi records...'}</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions Pills */}
              <div className="p-2 border-t border-gray-200/70 bg-white/70 backdrop-blur-sm shrink-0">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1 mb-1.5">
                  {language === 'hi' ? 'सुझाए गए प्रश्न' : 'Suggested Questions'}
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSend(language === 'hi' ? prompt.queryHi : prompt.queryEn)}
                      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-[#15803D] hover:border-emerald-200 border border-gray-200 text-gray-700 rounded-xl text-[11px] font-medium transition-all duration-150 disabled:opacity-50"
                    >
                      {prompt.icon}
                      <span>{language === 'hi' ? prompt.labelHi : prompt.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-2.5 bg-white border-t border-gray-200 shrink-0 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id="mandi-ai-input"
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={
                      language === 'hi'
                        ? 'अपना प्रश्न यहाँ लिखें (उदा. आज का एमएसपी)...'
                        : 'Ask about MSP, token, queue or slots...'
                    }
                    disabled={isLoading}
                    className="w-full pl-3 pr-8 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] focus:bg-white text-gray-900 placeholder-gray-400 disabled:bg-gray-100"
                  />
                  {inputQuery && (
                    <button
                      type="button"
                      onClick={() => setInputQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  aria-label={language === 'hi' ? 'संदेश भेजें' : 'Send message'}
                  className="px-3.5 py-2 bg-[#15803D] hover:bg-[#14532D] disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl font-semibold text-xs flex items-center justify-center transition-all duration-150 shadow-2xs disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default FarmerAIAssistant;
