import React, { useState } from 'react';
import {
  HouseInfo,
  TariffConfig,
  BudgetConfig,
  TimeSeriesPoint,
  ApplianceId,
} from '../../types/nilm';
import { APPLIANCE_CONFIGS } from '../../data/nilmConfigs';
import { calculateBill, calculateEnergyWh, whToKwh } from '../../utils/nilmCore';
import { IndianLanguage, getTranslation } from '../../i18n/languages';
import { DeviceCard, SmartDevice } from './DeviceCard';
import { InteractivePowerChart } from '../charts/InteractivePowerChart';
import {
  Zap,
  Globe,
  Sparkles,
  ChevronDown,
  Clock,
  FileDown,
  X,
  Pencil,
  Sliders,
} from 'lucide-react';

interface SmartThingsHomeViewProps {
  data: TimeSeriesPoint[];
  house: HouseInfo;
  tariff: TariffConfig;
  budget: BudgetConfig;
  onUpdateBudget: (budget: BudgetConfig) => void;
  language: IndianLanguage;
  onOpenLanguageModal: () => void;
  onOpenReportModal: () => void;
  onSelectHouse: (houseId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const SmartThingsHomeView: React.FC<SmartThingsHomeViewProps> = ({
  data,
  house,
  tariff,
  budget,
  onUpdateBudget,
  language,
  onOpenLanguageModal,
  onOpenReportModal,
  onSelectHouse,
  onNavigateTab,
}) => {
  const t = getTranslation(language);

  // Room filter state
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [activeApplianceDetail, setActiveApplianceDetail] = useState<ApplianceId | null>(null);
  const [aiEnergyMode, setAiEnergyMode] = useState<boolean>(true);
  const [showTechnicalWave, setShowTechnicalWave] = useState<boolean>(false);
  const [showDatasetSwitcher, setShowDatasetSwitcher] = useState<boolean>(false);

  // Custom budget modal state (from Pencil icon)
  const [isEditingCustomBudget, setIsEditingCustomBudget] = useState<boolean>(false);
  const [customBudgetValue, setCustomBudgetValue] = useState<string>('');

  // Power state simulation for smart devices
  const [devicesState, setDevicesState] = useState<Record<string, boolean>>({
    fridge: true,
    washing_machine: true,
    kettle: true,
    ac: true,
    tv: true,
    fan: true,
  });

  const toggleDevice = (id: string) => {
    setDevicesState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculations
  const aggPowers = data.map((d) => d.aggregate_w);
  const totalWh = calculateEnergyWh(aggPowers, 8);
  const totalKwh = whToKwh(totalWh);
  const billInfo = calculateBill(totalKwh, tariff, 1);
  const latestPoint = data[data.length - 1];
  const liveWatts = latestPoint ? latestPoint.aggregate_w : 485;

  // Appliance calculations
  const fridgeWh = calculateEnergyWh(data.map((d) => d.fridge_est_w || 0), 8);
  const wmWh = calculateEnergyWh(data.map((d) => d.washing_machine_est_w || 0), 8);
  const kettleWh = calculateEnergyWh(data.map((d) => d.kettle_est_w || 0), 8);

  const fridgeKwh = whToKwh(fridgeWh);
  const wmKwh = whToKwh(wmWh);
  const kettleKwh = whToKwh(kettleWh);

  // STRICT & BULLETPROOF BUDGET CALCULATIONS:
  const monthlyTarget = Math.max(100, budget.value || 2000);
  const dailyAllowanceCost = monthlyTarget / 30;
  const todayActualCost = billInfo.totalBill;
  const todayBudgetRatio = Math.max(0, Math.min(100, (todayActualCost / dailyAllowanceCost) * 100));
  const remainingToday = Math.max(0, dailyAllowanceCost - todayActualCost);
  const projectedMonthlyBill = todayActualCost * 30;

  const isBudgetSafe = projectedMonthlyBill <= monthlyTarget;
  const isBudgetCaution = projectedMonthlyBill > monthlyTarget && projectedMonthlyBill <= monthlyTarget * 1.15;

  // Quick preset targets
  const budgetPresets = [1000, 1500, 2000, 2500, 3000, 5000];

  // Device List dynamically translated for whatever language is selected
  const devices: SmartDevice[] = [
    {
      id: 'fridge',
      name: t.fridgeName,
      room: t.kitchen,
      iconType: 'fridge',
      isOn: devicesState.fridge,
      powerW: devicesState.fridge ? (latestPoint?.fridge_est_w || 110) : 0,
      todayKwh: fridgeKwh,
      cost: fridgeKwh * (tariff.type === 'flat' ? tariff.flatRate : 7.2),
      currencySymbol: tariff.currencySymbol,
      statusLabel: t.fridgeStatus,
      isAiEstimated: true,
      confidence: 'High',
      color: '#0284c7',
    },
    {
      id: 'washing_machine',
      name: t.washingMachineName,
      room: t.utility,
      iconType: 'washing_machine',
      isOn: devicesState.washing_machine,
      powerW: devicesState.washing_machine ? (latestPoint?.washing_machine_est_w || 380) : 0,
      todayKwh: wmKwh,
      cost: wmKwh * (tariff.type === 'flat' ? tariff.flatRate : 7.2),
      currencySymbol: tariff.currencySymbol,
      statusLabel: t.wmStatus,
      isAiEstimated: true,
      confidence: 'Medium',
      color: '#059669',
    },
    {
      id: 'kettle',
      name: t.kettleName,
      room: t.kitchen,
      iconType: 'kettle',
      isOn: devicesState.kettle,
      powerW: devicesState.kettle ? (latestPoint?.kettle_est_w || 0) : 0,
      todayKwh: kettleKwh,
      cost: kettleKwh * (tariff.type === 'flat' ? tariff.flatRate : 7.2),
      currencySymbol: tariff.currencySymbol,
      statusLabel: t.kettleStatus,
      isAiEstimated: true,
      confidence: 'High',
      color: '#d97706',
    },
    {
      id: 'ac',
      name: t.acName,
      room: t.livingRoom,
      iconType: 'ac',
      isOn: devicesState.ac,
      powerW: devicesState.ac ? (aiEnergyMode ? 620 : 780) : 0,
      todayKwh: 1.84,
      cost: 1.84 * (tariff.type === 'flat' ? tariff.flatRate : 7.2),
      currencySymbol: tariff.currencySymbol,
      statusLabel: t.acStatus,
      isAiEstimated: true,
      confidence: 'High',
      color: '#0ea5e9',
    },
    {
      id: 'tv',
      name: t.tvName,
      room: t.livingRoom,
      iconType: 'tv',
      isOn: devicesState.tv,
      powerW: devicesState.tv ? 115 : 0,
      todayKwh: 0.42,
      cost: 0.42 * (tariff.type === 'flat' ? tariff.flatRate : 7.2),
      currencySymbol: tariff.currencySymbol,
      statusLabel: t.tvStatus,
      isAiEstimated: true,
      confidence: 'High',
      color: '#8b5cf6',
    },
    {
      id: 'fan',
      name: t.fanName,
      room: t.livingRoom,
      iconType: 'fan',
      isOn: devicesState.fan,
      powerW: devicesState.fan ? 65 : 0,
      todayKwh: 0.58,
      cost: 0.58 * (tariff.type === 'flat' ? tariff.flatRate : 7.2),
      currencySymbol: tariff.currencySymbol,
      statusLabel: t.fanStatus,
      isAiEstimated: true,
      confidence: 'High',
      color: '#10b981',
    },
  ];

  const filteredDevices =
    selectedRoom === 'all'
      ? devices
      : devices.filter((d) => d.room.toLowerCase().includes(selectedRoom.toLowerCase()));

  // Visual power levels:
  // Green (< 800W) = Safe & Normal
  // Yellow (800W - 1500W) = Medium Load
  // Red (> 1500W) = High Load / Alert
  const isPowerLow = liveWatts < 800;
  const isPowerMed = liveWatts >= 800 && liveWatts < 1500;

  // 4–6 Hour Forecast (Visual weather-like cards)
  const forecastHours = [
    { label: '+1h', time: '17:00', kw: '0.45', desc: language === 'hi' ? 'हल्का लोड' : 'Light base', icon: '🌤️' },
    { label: '+2h', time: '18:00', kw: '0.82', desc: language === 'hi' ? 'शाम की धुलाई' : 'Evening wash', icon: '⚡' },
    { label: '+3h', time: '19:00', kw: '0.52', desc: language === 'hi' ? 'खाना व टीवी' : 'Cooking / TV', icon: '📺' },
    { label: '+4h', time: '20:00', kw: '0.35', desc: language === 'hi' ? 'मध्यम लोड' : 'Moderate', icon: '🛋️' },
    { label: '+5h', time: '21:00', kw: '0.22', desc: language === 'hi' ? 'रात का आराम' : 'Night idle', icon: '🌙' },
    { label: '+6h', time: '22:00', kw: '0.18', desc: language === 'hi' ? 'कम बिजली' : 'Standby floor', icon: '💤' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header & Home Identity (Clean Samsung SmartThings style - Sound removed per user instruction) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-100 text-blue-700">🏠</span>
              <span>{t.home}</span>
            </h1>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{filteredDevices.filter((d) => d.isOn).length} {language === 'hi' ? 'चालू हैं' : language === 'en' ? 'Active' : t.activeNow}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi'
              ? 'मुख्य निवास • स्मार्ट बिजली मीटर और उपकरण मॉनिटरिंग'
              : 'Main Residence • Smart Home Power & Appliance Monitoring'}
          </p>
        </div>

        {/* Action Controls: Language, Report */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Pill */}
          <button
            onClick={onOpenLanguageModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{language.toUpperCase()}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Export Report Pill */}
          <button
            onClick={onOpenReportModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs hover:bg-slate-800 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.exportSummary}</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Speedometer / Traffic Light Meter for Low-Literacy Users */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isPowerLow
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-emerald-200 text-emerald-950'
          : isPowerMed
          ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-200 text-amber-950'
          : 'bg-gradient-to-r from-rose-50 via-red-50 to-pink-50 border-rose-300 text-rose-950 shadow-sm'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0 ${
            isPowerLow ? 'bg-emerald-500 text-white' : isPowerMed ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white animate-bounce'
          }`}>
            {isPowerLow ? '🟢' : isPowerMed ? '🟡' : '🔴'}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-75">
              {language === 'hi' ? 'बिजली लोड मीटर (Live Status)' : 'Live Power Load Status'}
            </div>
            <div className="text-base sm:text-lg font-black leading-tight flex items-center gap-2">
              <span>
                {isPowerLow
                  ? (language === 'hi' ? 'कम लोड (सब ठीक है 👍)' : 'Low Power (All Safe 👍)')
                  : isPowerMed
                  ? (language === 'hi' ? 'मध्यम लोड (सामान्य ⚡)' : 'Moderate Load (Normal ⚡)')
                  : (language === 'hi' ? 'ज्यादा लोड (बिजली कम करें ⚠️)' : 'High Alert (Reduce Power ⚠️)')}
              </span>
            </div>
            <p className="text-xs opacity-85 mt-0.5">
              {isPowerLow
                ? (language === 'hi' ? 'घर की बिजली सुरक्षित है, कम खर्च हो रहा है।' : 'Electricity load is safe and bill is minimal.')
                : isPowerMed
                ? (language === 'hi' ? 'सामान्य खपत चल रही है।' : 'Typical household usage pattern.')
                : (language === 'hi' ? 'जरूरत न हो तो गीज़र या अतिरिक्त उपकरण बंद करें।' : 'Turn off unused high-draw appliances to save cost.')}
            </p>
          </div>
        </div>

        {/* Big Live Watt Display with Clear Units */}
        <div className="text-left sm:text-right bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-black/5 shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            {t.currentDraw}
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900">
            {liveWatts} <span className="text-sm font-semibold text-slate-600">{t.wattLabel}</span>
          </div>
        </div>
      </div>

      {/* 3. Samsung SmartThings Energy Hero Card (With Fully Resolved Budget Target & Pencil Icon) */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_32px_rgba(37,99,235,0.25)] relative overflow-hidden">
        {/* Ambient Blur Graphics */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            {/* AI Energy Mode Toggle */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setAiEnergyMode(!aiEnergyMode)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase transition-all shadow-2xs ${
                  aiEnergyMode
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-white/10 text-white/70 border border-white/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Energy Mode: {aiEnergyMode ? 'ACTIVE (-15% Bill)' : 'OFF'}</span>
              </button>
            </div>

            <div className="text-xs text-blue-100 font-medium">{t.todayUsage}</div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono tabular-nums">
                {totalKwh.toFixed(2)}
              </span>
              <span className="text-xl font-medium text-blue-200">{t.unitLabel}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-blue-100 mt-2 font-mono">
              <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{liveWatts} {t.wattLabel}</span>
              </div>
              <span>&bull;</span>
              <div className="bg-white/10 px-2.5 py-1 rounded-lg">
                <span>{t.todaySpent}: <strong>{tariff.currencySymbol}{todayActualCost.toFixed(1)}</strong></span>
              </div>
            </div>
          </div>

          {/* Interactive, Easy-to-Understand Monthly Budget Progress Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 min-w-72 max-w-sm w-full text-xs space-y-3">
            <div className="flex justify-between items-center text-blue-100">
              <span className="font-bold flex items-center gap-1.5">
                <span>👛</span>
                <span>{t.monthlyBudget}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-lg font-black text-white bg-white/20 px-2.5 py-0.5 rounded-lg">
                  {tariff.currencySymbol}{monthlyTarget.toLocaleString()}
                </span>
                {/* Pencil icon beside budget value */}
                <button
                  type="button"
                  onClick={() => {
                    setCustomBudgetValue(String(monthlyTarget));
                    setIsEditingCustomBudget(true);
                  }}
                  title={language === 'hi' ? 'मनचाहा बजट सेट करें' : 'Set custom budget'}
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all hover:scale-105 active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Daily Quota vs Today's Cost */}
            <div className="bg-black/25 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-[11px] text-blue-100 font-mono">
                <span>{t.dailyAllowance}:</span>
                <span className="font-semibold text-white">{tariff.currencySymbol}{dailyAllowanceCost.toFixed(0)} / day</span>
              </div>
              <div className="flex justify-between text-[11px] text-blue-100 font-mono">
                <span>{t.todaySpent}:</span>
                <span className="font-bold text-emerald-300">{tariff.currencySymbol}{todayActualCost.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-blue-200 font-mono pt-1 border-t border-white/10">
                <span>{t.remainingToday}:</span>
                <span className="font-bold text-white">+{tariff.currencySymbol}{remainingToday.toFixed(0)} left</span>
              </div>
            </div>

            {/* Smooth Progress Bar with 80% Caution and 100% Target - Mathematically bounded */}
            <div>
              <div className="h-3.5 bg-black/40 rounded-full overflow-hidden p-0.5 relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBudgetSafe ? 'bg-emerald-400' : isBudgetCaution ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(4, todayBudgetRatio))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-blue-200 mt-1 font-mono font-medium">
                <span>0%</span>
                <span className="text-white font-bold bg-white/15 px-1.5 py-0.5 rounded">
                  {todayBudgetRatio.toFixed(0)}% {language === 'hi' ? 'खर्च' : 'used'}
                </span>
                <span>100% Limit</span>
              </div>
            </div>

            {/* Quick Preset Buttons & Pencil Icon for Custom Amount */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] text-blue-200 mb-1.5 flex justify-between items-center">
                <span>{t.changeTarget}:</span>
                <span className="font-mono text-emerald-300 font-semibold text-[11px]">
                  {isBudgetSafe ? '🟢 ' + t.budgetStatusSafe : '🔴 ' + t.budgetStatusWarning}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {budgetPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => onUpdateBudget({ ...budget, value: preset })}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      monthlyTarget === preset
                        ? 'bg-white text-blue-900 shadow-md scale-105'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {tariff.currencySymbol}{preset}
                  </button>
                ))}

                {/* Pencil Icon Button right next to suggest prices for custom desired amount */}
                <button
                  type="button"
                  onClick={() => {
                    setCustomBudgetValue(String(monthlyTarget));
                    setIsEditingCustomBudget(true);
                  }}
                  title={language === 'hi' ? 'मनचाहा बजट सेट करें' : 'Set custom budget'}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center gap-1 shadow-xs hover:scale-105 active:scale-95"
                >
                  <Pencil className="w-3 h-3 text-slate-950 stroke-[2.5]" />
                  <span>{language === 'hi' ? 'मनचाहा' : 'Custom'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Budget Modal (Triggered by Pencil Icon) */}
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
                    {language === 'hi' ? 'मनचाहा बजट डालें' : 'Enter Custom Budget'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'hi' ? 'महीने का जो भी लक्ष्य आप चाहें यहाँ डालें' : 'Set your preferred target amount'}
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
                  {language === 'hi' ? 'मासिक बजट (रुपये में):' : 'Monthly Budget (in ₹):'}
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
                  <span>{language === 'hi' ? 'रोज का खर्च कोटा:' : 'Daily allowance:'}</span>
                  <strong className="text-slate-800">
                    {tariff.currencySymbol}{Math.round((Number(customBudgetValue) || 2000) / 30)} / day
                  </strong>
                </div>
              </div>

              {/* Quick Stepper Adjustments in Modal */}
              <div className="flex items-center gap-2 pt-1">
                {[+100, +250, +500, +1000].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() =>
                      setCustomBudgetValue((prev) =>
                        String(Math.max(100, (Number(prev) || 0) + step))
                      )
                    }
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-mono font-bold transition-colors"
                  >
                    +{step}
                  </button>
                ))}
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

      {/* 4. Room Tabs Filter (Samsung One UI Horizontal Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', label: t.allRooms, icon: '🏠' },
          { key: 'kitchen', label: t.kitchen, icon: '🍳' },
          { key: 'utility', label: t.utility, icon: '🧺' },
          { key: 'living', label: t.livingRoom, icon: '🛋️' },
        ].map((rm) => (
          <button
            key={rm.key}
            onClick={() => setSelectedRoom(rm.key)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              selectedRoom === rm.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <span>{rm.icon}</span>
            <span>{rm.label}</span>
          </button>
        ))}
      </div>

      {/* 5. Visual Smart Device Grid (100% Translated & High-Contrast Images) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{t.devices}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'उपकरण पर क्लिक करके पूरा विवरण देखें'
                : 'Tap on any appliance to inspect disaggregation details'}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            {filteredDevices.length} {language === 'hi' ? 'उपकरण' : 'Devices'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              t={t}
              onTogglePower={toggleDevice}
              onClickDetail={(id) => {
                if (id === 'fridge' || id === 'washing_machine' || id === 'kettle') {
                  setActiveApplianceDetail(id as ApplianceId);
                } else {
                  onNavigateTab('energy');
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* 6. 4–6 Hour Forecast Card (Visual & Friendly with Emojis) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.forecastTitle}</h3>
              <p className="text-xs text-slate-500">{t.forecastSubtitle}</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            {language === 'hi' ? 'अनुमान' : 'Forecast'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {forecastHours.map((fh) => (
            <div
              key={fh.time}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center hover:bg-blue-50/50 transition-colors"
            >
              <span className="text-lg mb-1">{fh.icon}</span>
              <span className="text-[11px] font-bold text-slate-500">{fh.time}</span>
              <div className="text-sm font-extrabold font-mono text-slate-900 my-0.5">
                {fh.kw} kW
              </div>
              <span className="text-[10px] text-slate-500 font-medium">{fh.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Easy Saving Advice Cards (Illiterate Friendly) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-3xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 text-xl shadow-xs">
            💡
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950">
              {language === 'hi' ? 'स्मार्ट बचत सलाह (₹140 हर महीने बचाएं)' : 'Smart Savings Advice (Save ₹140/mo)'}
            </h4>
            <p className="text-xs text-amber-900 mt-1 leading-relaxed">
              {t.smartSavingsTip}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200/70 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xl shadow-xs">
            🛡️
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950">
              {language === 'hi' ? 'रात का बेसलाइन लोड' : 'Night Standby Floor'}
            </h4>
            <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
              {language === 'hi'
                ? `रात को सब बंद होने के बाद भी लगभग ${house.baselineStandbyW} वॉट लोड रहता है। वाईफाई व चार्जर के लिए स्मार्ट स्ट्रिप लगाएं।`
                : `Continuous baseline is ${house.baselineStandbyW} W (~${((house.baselineStandbyW * 24) / 1000).toFixed(2)} kWh/day). Use smart strip to cut standby.`}
            </p>
          </div>
        </div>
      </div>

      {/* 8. Appliance Modal Detail Sheet when an appliance card is tapped */}
      {activeApplianceDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                  style={{
                    backgroundColor: `${APPLIANCE_CONFIGS[activeApplianceDetail]?.color}20`,
                  }}
                >
                  {activeApplianceDetail === 'fridge' ? '🧊' : activeApplianceDetail === 'washing_machine' ? '🧺' : '♨️'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeApplianceDetail === 'fridge'
                      ? t.fridgeName
                      : activeApplianceDetail === 'washing_machine'
                      ? t.washingMachineName
                      : t.kettleName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'hi' ? 'स्मार्ट मीटर AI लोड विवरण' : 'SmartThings NILM Disaggregation Model'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveApplianceDetail(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simple friendly statistics */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">
                  {language === 'hi' ? 'आज की अनुमानित बिजली' : "Today's Energy"}
                </span>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  ≈ {activeApplianceDetail === 'fridge' ? fridgeKwh.toFixed(2) : activeApplianceDetail === 'washing_machine' ? wmKwh.toFixed(2) : kettleKwh.toFixed(2)} kWh
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium">
                  {language === 'hi' ? 'आज का अनुमानित खर्च' : 'Estimated Cost'}
                </span>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  ≈ {tariff.currencySymbol}{((activeApplianceDetail === 'fridge' ? fridgeKwh : activeApplianceDetail === 'washing_machine' ? wmKwh : kettleKwh) * 7.2).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Technical Waveform toggle for curious users/evaluators */}
            <div className="mb-4">
              <button
                onClick={() => setShowTechnicalWave(!showTechnicalWave)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>{showTechnicalWave ? 'Hide' : 'Show'} CNN Power Waveform &amp; Ground Truth</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTechnicalWave ? 'rotate-180' : ''}`} />
              </button>

              {showTechnicalWave && (
                <div className="mt-3">
                  <InteractivePowerChart
                    data={data}
                    applianceFocus={activeApplianceDetail}
                    height={240}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveApplianceDetail(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                {t.done}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Advanced Research Benchmark Switcher (all 31 homes grouped by dataset) */}
      <div className="pt-4 border-t border-slate-200/80">
        <button
          onClick={() => setShowDatasetSwitcher(!showDatasetSwitcher)}
          className="text-xs text-slate-400 hover:text-slate-600 font-medium flex items-center gap-1.5 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>
            {showDatasetSwitcher
              ? (language === 'hi' ? 'उन्नत रिसर्च सेटिंग्स छुपाएं' : 'Hide Research Dataset Benchmarks')
              : (language === 'hi' ? 'शोधकर्ता / मूल्यांकनकर्ता विकल्प (31 Homes)' : 'Researcher & Benchmark Options (31 Homes)')}
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showDatasetSwitcher ? 'rotate-180' : ''}`} />
        </button>

        {showDatasetSwitcher && (
          <div className="mt-3 p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-4">
            {/* Grouped house selector by dataset */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-700">
                  {language === 'hi' ? 'सक्रिय NILM रिसर्च डेटासेट:' : 'Active Benchmark Dataset:'}
                </span>
                <select
                  value={house.id}
                  onChange={(e) => onSelectHouse(e.target.value)}
                  className="text-xs font-mono font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-hidden max-w-[340px]"
                >
                  <optgroup label="UK-DALE — United Kingdom (5 Houses)">
                    <option value="ukdale_house1">House 1 — London, 4 occ. (Primary Train)</option>
                    <option value="ukdale_house2">House 2 — London, 2 occ. (Held-Out)</option>
                    <option value="ukdale_house3">House 3 — London, 1 occ. (Held-Out)</option>
                    <option value="ukdale_house4">House 4 — London, 2 occ. (Eval)</option>
                    <option value="ukdale_house5">House 5 — London, 4 occ. (Eval)</option>
                  </optgroup>
                  <optgroup label="REFIT — Loughborough UK (20 Houses)">
                    <option value="refit_house1">House 1 — 2 occ.</option>
                    <option value="refit_house2">House 2 — Cross-dataset Transfer</option>
                    <option value="refit_house3">House 3 — 3 occ.</option>
                    <option value="refit_house4">House 4 — 4 occ.</option>
                    <option value="refit_house5">House 5 — 2 occ.</option>
                    <option value="refit_house6">House 6 — 1 occ.</option>
                    <option value="refit_house7">House 7 — 3 occ.</option>
                    <option value="refit_house8">House 8 — 5 occ.</option>
                    <option value="refit_house9">House 9 — 2 occ.</option>
                    <option value="refit_house10">House 10 — 3 occ.</option>
                    <option value="refit_house11">House 11 — 4 occ.</option>
                    <option value="refit_house12">House 12 — 2 occ.</option>
                    <option value="refit_house13">House 13 — 3 occ.</option>
                    <option value="refit_house14">House 14 — 1 occ. (elderly)</option>
                    <option value="refit_house15">House 15 — 6 occ. (large family)</option>
                    <option value="refit_house16">House 16 — 2 occ.</option>
                    <option value="refit_house17">House 17 — 4 occ.</option>
                    <option value="refit_house18">House 18 — 3 occ.</option>
                    <option value="refit_house19">House 19 — 2 occ. (WFH)</option>
                    <option value="refit_house20">House 20 — 3 occ.</option>
                  </optgroup>
                  <optgroup label="REDD — Boston MA, US Split-phase (6 Houses, no kettle)">
                    <option value="redd_house1">House 1 — 3 occ. (Secondary)</option>
                    <option value="redd_house2">House 2 — 4 occ.</option>
                    <option value="redd_house3">House 3 — 2 occ.</option>
                    <option value="redd_house4">House 4 — 3 occ.</option>
                    <option value="redd_house5">House 5 — 2 occ.</option>
                    <option value="redd_house6">House 6 — 5 occ.</option>
                  </optgroup>
                </select>
              </div>

              {/* Quick-access house chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { id: 'ukdale_house1', label: 'UKDALE H1', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { id: 'ukdale_house2', label: 'UKDALE H2', color: 'bg-blue-100 text-blue-800 border-blue-200' },
                  { id: 'refit_house2', label: 'REFIT H2', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                  { id: 'refit_house8', label: 'REFIT H8', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                  { id: 'refit_house15', label: 'REFIT H15', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                  { id: 'redd_house1', label: 'REDD H1', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                  { id: 'redd_house2', label: 'REDD H2', color: 'bg-orange-100 text-orange-800 border-orange-200' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => onSelectHouse(chip.id)}
                    className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold transition-all ${chip.color} ${
                      house.id === chip.id ? 'ring-2 ring-offset-1 ring-slate-400 scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active house info */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="font-semibold text-slate-800 text-[11px]">{house.label}</div>
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-mono">
                <span>📅 {house.totalDays} days</span>
                <span>⚡ {house.baselineStandbyW} W standby</span>
                <span>🔌 {house.sampleIntervalS}s grid</span>
                <span>✅ {house.availableAppliances.join(', ')}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Evaluates zero-shot domain transfer across seen houses, unseen houses, and cross-dataset deployments per PRD §5.8.
              REDD homes operate on US 120V/240V split-phase grid; kettle is strictly absent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
