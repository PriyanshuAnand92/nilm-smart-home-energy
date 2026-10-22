import React from 'react';
import {
  Home,
  Zap,
  PiggyBank,
  Cpu,
  Settings,
  Globe,
  Play,
  FileDown,
} from 'lucide-react';
import { IndianLanguage, SMART_TRANSLATIONS } from '../../i18n/languages';

export type SmartTab = 'home' | 'energy' | 'costs' | 'lab' | 'settings';

interface SmartThingsShellProps {
  activeTab: SmartTab;
  onTabChange: (tab: SmartTab) => void;
  language: IndianLanguage;
  onOpenLanguageModal: () => void;
  onQuickDemo: () => void;
  onOpenReportModal: () => void;
  children: React.ReactNode;
}

export const SmartThingsShell: React.FC<SmartThingsShellProps> = ({
  activeTab,
  onTabChange,
  language,
  onOpenLanguageModal,
  onQuickDemo,
  onOpenReportModal,
  children,
}) => {
  const t = SMART_TRANSLATIONS[language] || SMART_TRANSLATIONS.hi;

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-900 flex flex-col font-sans">
      {/* SmartThings Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-slate-900 block leading-tight">
                SmartThings
              </span>
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider block leading-none">
                Energy AI
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={onOpenLanguageModal}
              title="Change Language"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* AI Research Lab Pill (Accessible without cluttering primary nav) */}
            <button
              onClick={() => onTabChange(activeTab === 'lab' ? 'home' : 'lab')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeTab === 'lab'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
              title="NILM Research Benchmarks & CNN Model Evaluation"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{activeTab === 'lab' ? (language === 'hi' ? 'होम पर लौटें' : 'Back to Home') : 'AI Lab'}</span>
            </button>

            {/* Export Summary */}
            <button
              onClick={onOpenReportModal}
              title="Download report summary"
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.exportSummary}</span>
            </button>

            {/* Quick Demo */}
            <button
              onClick={onQuickDemo}
              title="Reset to benchmark demo data"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Play className="w-3 h-3 fill-white" />
              <span className="hidden sm:inline">{t.startDemo}</span>
              <span className="sm:hidden">Demo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5">
        {children}
      </main>

      {/* SmartThings Bottom Navigation Bar (4 Core Friendly Tabs: Home, Energy, Savings, Settings) */}
      <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
          {/* 1. Home / Devices */}
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'home'
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px] leading-none">{t.home}</span>
          </button>

          {/* 2. Energy Meter */}
          <button
            onClick={() => onTabChange('energy')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'energy'
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[11px] leading-none">{t.energy}</span>
          </button>

          {/* 3. Savings & Tips */}
          <button
            onClick={() => onTabChange('costs')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'costs'
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <PiggyBank className="w-5 h-5" />
            <span className="text-[11px] leading-none">{t.tips}</span>
          </button>

          {/* 4. Settings */}
          <button
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'settings'
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[11px] leading-none">{t.settings}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
