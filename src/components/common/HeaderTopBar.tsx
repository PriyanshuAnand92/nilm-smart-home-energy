import { Zap, Play, Globe, FileDown } from 'lucide-react';
import { Language, TRANSLATIONS } from '../../i18n/translations';

export type ActiveTab = 'dashboard' | 'appliances' | 'analytics' | 'costs' | 'lab' | 'settings';

interface HeaderTopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onQuickDemo: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onOpenReportModal: () => void;
}

export const HeaderTopBar: React.FC<HeaderTopBarProps> = ({
  activeTab,
  onTabChange,
  onQuickDemo,
  language,
  onToggleLanguage,
  onOpenReportModal,
}) => {
  const t = TRANSLATIONS[language];
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Single text element wordmark (Display face, 1 line) */}
        <div
          onClick={() => onTabChange('dashboard')}
          className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            VoltDisagg NILM
          </span>
        </div>

        {/* Zone 2: 6 concise single-line nav links with hover states */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'dashboard'
                ? 'text-slate-950 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.dashboard}
          </button>
          <button
            onClick={() => onTabChange('appliances')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'appliances'
                ? 'text-slate-950 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.appliances}
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'analytics'
                ? 'text-slate-950 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.analytics}
          </button>
          <button
            onClick={() => onTabChange('costs')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'costs'
                ? 'text-slate-950 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.costsAndBudget}
          </button>
          <button
            onClick={() => onTabChange('lab')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'lab'
                ? 'text-slate-950 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.modelLab}
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              activeTab === 'settings'
                ? 'text-slate-950 border-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.settingsAndUpload}
          </button>
        </nav>

        {/* Zone 3: Language Switch, Report Export, & Primary Demo Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Language Toggle: English / Hindi */}
          <button
            onClick={onToggleLanguage}
            title="Switch Language (English / हिंदी)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Export Report Modal */}
          <button
            onClick={onOpenReportModal}
            title="Download PDF or CSV usage summary"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.exportReport}</span>
          </button>

          {/* Start Demo Mode */}
          <button
            onClick={onQuickDemo}
            title="Reset to default benchmark demo slice (UK-DALE H1)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">{t.demoMode}</span>
            <span className="sm:hidden">Demo</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden border-t border-slate-100 overflow-x-auto px-4 py-2 gap-4 text-xs font-medium text-slate-600">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`whitespace-nowrap ${activeTab === 'dashboard' ? 'text-slate-900 font-bold' : ''}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onTabChange('appliances')}
          className={`whitespace-nowrap ${activeTab === 'appliances' ? 'text-slate-900 font-bold' : ''}`}
        >
          Appliances
        </button>
        <button
          onClick={() => onTabChange('analytics')}
          className={`whitespace-nowrap ${activeTab === 'analytics' ? 'text-slate-900 font-bold' : ''}`}
        >
          Analytics
        </button>
        <button
          onClick={() => onTabChange('costs')}
          className={`whitespace-nowrap ${activeTab === 'costs' ? 'text-slate-900 font-bold' : ''}`}
        >
          Costs
        </button>
        <button
          onClick={() => onTabChange('lab')}
          className={`whitespace-nowrap ${activeTab === 'lab' ? 'text-slate-900 font-bold' : ''}`}
        >
          Model Lab
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`whitespace-nowrap ${activeTab === 'settings' ? 'text-slate-900 font-bold' : ''}`}
        >
          Settings
        </button>
      </div>
    </header>
  );
};
