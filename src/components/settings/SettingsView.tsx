import React, { useState, useEffect } from 'react';
import {
  BudgetConfig,
  TariffConfig,
  ValidationReport,
} from '../../types/nilm';
import {
  generateSampleCsvTemplate,
  validateNilmCsv,
} from '../../utils/nilmCore';
import {
  IndianLanguage,
  INDIAN_LANGUAGES,
  getTranslation,
  SmartThingsTranslation,
} from '../../i18n/languages';
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  Globe,
  Coins,
  Check,
  Volume2,
  VolumeX,
  Pencil,
  X,
} from 'lucide-react';

interface SettingsViewProps {
  tariff: TariffConfig;
  onUpdateTariff: (tariff: TariffConfig) => void;
  budget: BudgetConfig;
  onUpdateBudget: (budget: BudgetConfig) => void;
  emissionFactor: number;
  onUpdateEmissionFactor: (val: number) => void;
  emissionFactorSource: string;
  onUpdateEmissionSource: (src: string) => void;
  onLoadCustomData?: (csvContent: string, fileName: string) => void;
  language?: IndianLanguage;
  onSelectLanguage?: (lang: IndianLanguage) => void;
  t?: SmartThingsTranslation;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  tariff,
  onUpdateTariff,
  budget,
  onUpdateBudget,
  emissionFactor,
  onUpdateEmissionFactor,
  emissionFactorSource,
  onUpdateEmissionSource,
  onLoadCustomData,
  language = 'hi',
  onSelectLanguage,
  t: propT,
}) => {
  const t = propT || getTranslation(language);
  const [activeTab, setActiveTab] = useState<'language' | 'budget' | 'voice' | 'tariff' | 'upload'>('language');

  // Budget steppers & custom edit modal
  const budgetValue = budget.value || 2000;
  const [isEditingCustomBudget, setIsEditingCustomBudget] = useState(false);
  const [customBudgetValue, setCustomBudgetValue] = useState('');

  const adjustBudget = (delta: number) => {
    onUpdateBudget({ ...budget, value: Math.max(100, Math.min(50000, budgetValue + delta)) });
  };

  // Voice Assistant Audio State (Relocated here cleanly from Home screen)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Friendly conversational summary in selected Indian language
    let speechText = '';
    const dailyAllow = Math.round(budgetValue / 30);
    if (language === 'hi' || language === 'hinglish') {
      speechText = `नमस्ते! यह आपका स्मार्ट बिजली सहायक है। आपका मासिक बिजली बजट ${budgetValue} रुपये तय है, यानी रोज का खर्च लगभग ${dailyAllow} रुपये होना चाहिए। घर के सभी उपकरण सामान्य और सुरक्षित गति से चल रहे हैं।`;
    } else if (language === 'mr') {
      speechText = `नमस्कार! हा आपला स्मार्ट वीज सहाय्यक आहे. आपले महिन्याचे वीज बजेट ${budgetValue} रुपये आहे. दररोजचा खर्च सुमारे ${dailyAllow} रुपये असावा. आपले वीज बजेट सुरक्षित आहे.`;
    } else if (language === 'gu') {
      speechText = `નમસ્તે! આ તમારો સ્માર્ટ વીજળી સહાયક છે. તમારું માસિક બજેટ ${budgetValue} રૂપિયા છે. રોજીંદો ખર્ચ લગભગ ${dailyAllow} રૂપિયા હોવો જોઈએ.`;
    } else if (language === 'bn') {
      speechText = `নমস্কার! এটি আপনার স্মার্ট বিদ্যুৎ সহকারী। আপনার মাসিক বিদ্যুৎ বাজেট ${budgetValue} টাকা নির্ধারিত আছে। প্রতিদিনের বাজেট প্রায় ${dailyAllow} টাকা।`;
    } else if (language === 'ta') {
      speechText = `வணக்கம்! இது உங்கள் ஸ்மார்ட் மின்சார உதவியாளர். உங்கள் மாதாந்திர பட்ஜெட் ${budgetValue} ரூபாய். தினசரி செலவு சுமார் ${dailyAllow} ரூபாய் ஆகும்.`;
    } else if (language === 'te') {
      speechText = `నమస్కారం! ఇది మీ స్మార్ట్ విద్యుత్ అసిస్టెంట్. మీ నెలవారీ బడ్జెట్ ${budgetValue} రూపాయలు. రోజువారీ ఖర్చు సుమారు ${dailyAllow} రూపాయలు.`;
    } else {
      speechText = `Hello! This is your SmartThings Energy Voice Assistant. Your monthly target budget is set to ${tariff.currencySymbol}${budgetValue}, with a daily allowance of approximately ${tariff.currencySymbol}${dailyAllow}. All monitored appliances are operating safely.`;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = speechRate;

    const voices = window.speechSynthesis.getVoices();
    const targetLangCode = language === 'hi' ? 'hi' : language === 'ta' ? 'ta' : language === 'te' ? 'te' : language === 'bn' ? 'bn' : language === 'mr' ? 'mr' : 'en';
    const matchingVoice = voices.find((v) => v.lang.toLowerCase().includes(targetLangCode));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Upload state
  const [dragOver, setDragOver] = useState(false);
  const [currentReport, setCurrentReport] = useState<ValidationReport | null>(null);
  const powerUnit = 'W';
  const tz = 'UTC';

  const handleDownloadTemplate = () => {
    const content = generateSampleCsvTemplate();
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nilm_smart_meter_template.csv';
    a.click();
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const report = validateNilmCsv(text, file.name, powerUnit, tz);
      setCurrentReport(report);
      if (report.status !== 'rejected') {
        if (onLoadCustomData) {
          onLoadCustomData(text, file.name);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>{t.settingsTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.settingsSubtitle}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 pt-3">
          <button
            onClick={() => setActiveTab('language')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'language'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{t.selectLanguageTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'budget'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>👛</span>
            <span>{t.monthlyBudgetSetting}</span>
          </button>

          {/* Voice Audio Tab (Preserves voice assistant without cluttering home screen) */}
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-500" />
            <span>{t.voiceAssistant}</span>
          </button>

          <button
            onClick={() => setActiveTab('tariff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tariff'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{t.tariffSlabs}</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'hi' ? 'मीटर डेटा CSV अपलोड' : 'CSV Upload'}</span>
          </button>
        </div>
      </div>

      {/* 1. Language Selection Tab (100% Native & Touch Friendly) */}
      {activeTab === 'language' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>{t.selectLanguageTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t.chooseLanguageDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {INDIAN_LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onSelectLanguage && onSelectLanguage(lang.code)}
                  className={`p-4 rounded-2xl flex items-center justify-between transition-all text-left border ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-xs ring-1 ring-blue-500/30'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="text-base font-bold">{lang.nativeName}</div>
                    <div className="text-xs text-slate-500">{lang.name}</div>
                  </div>

                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Monthly Budget Setter (Touch Steppers, Presets, and Custom Pencil Edit) */}
      {activeTab === 'budget' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>👛</span>
                <span>{t.monthlyBudgetSetting}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hi'
                  ? 'अपने पूरे महीने के बिजली बिल का अधिकतम लक्ष्य तय करें'
                  : 'Set your maximum monthly electricity spend target'}
              </p>
            </div>
          </div>

          {/* Big Visual Target Banner with Pencil Icon */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 text-center shadow-md relative">
            <span className="text-xs uppercase font-bold text-blue-200 tracking-wider">
              {t.monthlyBudget}
            </span>
            <div className="flex items-center justify-center gap-3 my-2">
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums">
                {tariff.currencySymbol}{budgetValue.toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomBudgetValue(String(budgetValue));
                  setIsEditingCustomBudget(true);
                }}
                title={language === 'hi' ? 'मनचाहा बजट सेट करें' : 'Edit custom budget'}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-105 active:scale-95 shadow-xs"
              >
                <Pencil className="w-4 h-4 text-amber-300 stroke-[2.5]" />
              </button>
            </div>
            <div className="text-xs text-blue-100 flex items-center justify-center gap-2 font-mono">
              <span>{t.dailyAllowance}:</span>
              <strong>{tariff.currencySymbol}{(budgetValue / 30).toFixed(0)} / day</strong>
            </div>
          </div>

          {/* Quick Preset Buttons + Custom Pencil Button */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">{t.quickPresets}:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[1000, 1500, 2000, 2500, 3000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onUpdateBudget({ ...budget, value: preset })}
                  className={`py-3 rounded-xl text-xs font-mono font-bold transition-all shadow-2xs ${
                    budgetValue === preset
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tariff.currencySymbol}{preset}
                </button>
              ))}

              {/* Custom Pencil Button */}
              <button
                type="button"
                onClick={() => {
                  setCustomBudgetValue(String(budgetValue));
                  setIsEditingCustomBudget(true);
                }}
                className="py-3 px-3 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" />
                <span>{t.customBudget}</span>
              </button>
            </div>
          </div>

          {/* Stepper Buttons for Fine Tuning */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs font-semibold text-slate-700">
              {language === 'hi' ? 'कम या ज्यादा करें:' : 'Adjust Step:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustBudget(-500)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold hover:bg-slate-100 shadow-2xs"
              >
                - ₹500
              </button>
              <button
                type="button"
                onClick={() => adjustBudget(-100)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold hover:bg-slate-100 shadow-2xs"
              >
                - ₹100
              </button>
              <button
                type="button"
                onClick={() => adjustBudget(+100)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold hover:bg-slate-100 shadow-2xs"
              >
                + ₹100
              </button>
              <button
                type="button"
                onClick={() => adjustBudget(+500)}
                className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold hover:bg-slate-100 shadow-2xs"
              >
                + ₹500
              </button>
            </div>
          </div>

          {/* Custom Budget Modal inside Settings */}
          {isEditingCustomBudget && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl">
                      ✏️
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {language === 'hi' ? 'मनचाहा बजट डालें' : 'Set Custom Budget'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {language === 'hi' ? 'अपनी मर्जी का बजट लक्ष्य भरें' : 'Enter your custom monthly target'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomBudget(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const num = Number(customBudgetValue);
                    if (!isNaN(num) && num >= 100) {
                      onUpdateBudget({ ...budget, value: num });
                      setIsEditingCustomBudget(false);
                    }
                  }}
                  className="mt-4 space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {language === 'hi' ? 'मासिक बजट (रुपये में):' : 'Monthly Budget (₹):'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-500">
                        {tariff.currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="100"
                        max="50000"
                        step="50"
                        value={customBudgetValue}
                        onChange={(e) => setCustomBudgetValue(e.target.value)}
                        placeholder="उदा. 2200"
                        autoFocus
                        className="w-full pl-9 pr-4 py-3 text-2xl font-black font-mono text-slate-900 bg-slate-50 border-2 border-blue-500 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-mono">
                      <span>{language === 'hi' ? 'प्रति दिन का कोटा:' : 'Daily allowance:'}</span>
                      <strong className="text-slate-800">
                        {tariff.currencySymbol}{Math.round((Number(customBudgetValue) || 2000) / 30)} / day
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingCustomBudget(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                      {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      {language === 'hi' ? 'बजट सेव करें' : 'Save Budget'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Voice Audio Assistant Tab (Moved cleanly here per user request) */}
      {activeTab === 'voice' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-emerald-600" />
                <span>{t.voiceAssistant}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t.voiceAssistantDesc}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0 ${
                isSpeaking ? 'bg-amber-500 text-white animate-pulse ring-4 ring-amber-200' : 'bg-emerald-600 text-white'
              }`}>
                {isSpeaking ? '📢' : '🔊'}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {isSpeaking ? (language === 'hi' ? 'आवाज बोली जा रही है...' : 'Speaking now...') : (language === 'hi' ? 'आवाज सहायक तैयार है' : 'Voice Assistant Ready')}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {language === 'hi'
                    ? 'अपनी भाषा में पूरे घर की बिजली और मासिक बिल की स्थिति सुनें।'
                    : 'Hear spoken overview of your home power consumption and bill in your language.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
                isSpeaking
                  ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>{t.stopAudio}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>{t.listenAudio}</span>
                </>
              )}
            </button>
          </div>

          {/* Voice Speed Controls */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              {language === 'hi' ? 'बोलने की गति (Speech Speed):' : 'Speech Speed:'}
            </span>
            <div className="flex gap-2">
              {[
                { label: language === 'hi' ? 'धीमी गति (0.8x - बुजुर्गों के लिए)' : 'Slow (0.8x)', rate: 0.8 },
                { label: language === 'hi' ? 'सामान्य गति (1.0x)' : 'Normal (1.0x)', rate: 1.0 },
                { label: language === 'hi' ? 'तेज गति (1.2x)' : 'Fast (1.2x)', rate: 1.2 },
              ].map((sp) => (
                <button
                  key={sp.rate}
                  type="button"
                  onClick={() => setSpeechRate(sp.rate)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    speechRate === sp.rate
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Tariff Slabs Tab */}
      {activeTab === 'tariff' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>{t.tariffSlabs}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'hi'
                ? 'भारत घरेलू स्लैब दरें (Domestic Telescopic Tariff 2026)'
                : 'Active residential utility rate structure'}
            </p>
          </div>

          <div className="space-y-3">
            {tariff.slabs.map((slab, i) => (
              <div
                key={i}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {slab.toKwh ? `${slab.fromKwh} – ${slab.toKwh} kWh` : `> ${slab.fromKwh} kWh`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {slab.toKwh ? (language === 'hi' ? 'कम बिजली खपत स्लैब' : 'Lower tier consumption') : (language === 'hi' ? 'उच्चतम दर स्लैब' : 'Peak marginal tier')}
                  </div>
                </div>
                <div className="font-mono text-base font-bold text-slate-900">
                  {tariff.currencySymbol}{slab.ratePerKwh.toFixed(2)} / kWh
                </div>
              </div>
            ))}

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs flex justify-between items-center text-blue-900">
              <span className="font-medium">{language === 'hi' ? 'दैनिक स्थायी शुल्क (Fixed Charge):' : 'Fixed Daily Charge:'}</span>
              <span className="font-mono font-bold">{tariff.currencySymbol}{tariff.fixedDailyCharge} / day</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. CSV Ingestion & Quality Audit Tab */}
      {activeTab === 'upload' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'hi' ? 'स्मार्ट मीटर CSV डेटा अपलोड' : 'Smart Meter CSV Upload'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi'
                  ? 'अपनी स्मार्ट मीटर CSV फ़ाइल अपलोड करके NILM मॉडल से टेस्ट करें'
                  : 'Ingest residential 8s time-series data for AI appliance disaggregation'}
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'सैंपल CSV डाउनलोड करें' : 'Download Sample CSV'}</span>
            </button>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragOver
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-800">
              {language === 'hi'
                ? 'अपनी मीटर CSV फ़ाइल यहाँ ड्रैग करें या चुनें'
                : 'Drag and drop your smart meter CSV here'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
              Columns: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">timestamp</code>,{' '}
              <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">aggregate_w</code>
            </p>

            <label className="mt-4 inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer transition-colors shadow-xs">
              {language === 'hi' ? 'फ़ाइल चुनें' : 'Browse Files'}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {currentReport && (
            <div className={`p-4 rounded-2xl border text-xs ${
              currentReport.status !== 'rejected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {currentReport.status !== 'rejected' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                <span>{currentReport.status !== 'rejected' ? 'CSV मान्य है (Loaded Successfully)' : 'CSV में त्रुटि (Validation Error)'}</span>
              </div>
              <p className="text-[11px] opacity-90">
                {currentReport.filename}: {currentReport.validRows} / {currentReport.rowCount} rows processed ({currentReport.medianIntervalS}s interval).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
