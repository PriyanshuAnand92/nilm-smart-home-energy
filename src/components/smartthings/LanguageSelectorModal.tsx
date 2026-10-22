import React from 'react';
import { IndianLanguage, INDIAN_LANGUAGES } from '../../i18n/languages';
import { Globe, Check, X } from 'lucide-react';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: IndianLanguage;
  onSelectLanguage: (lang: IndianLanguage) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Language / भाषा चुनें</h3>
              <p className="text-xs text-slate-500">Choose your preferred Indian language</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Grid */}
        <div className="space-y-1.5 mt-4">
          {INDIAN_LANGUAGES.map((lang) => {
            const isSelected = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  onSelectLanguage(lang.code);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  isSelected
                    ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200'
                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{lang.nativeName}</div>
                  <div className="text-xs text-slate-400">{lang.name}</div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
