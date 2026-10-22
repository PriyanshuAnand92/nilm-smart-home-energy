import React, { useState } from 'react';
import {
  BudgetConfig,
  HouseInfo,
  TariffConfig,
  TimeSeriesPoint,
} from '../../types/nilm';
import { APPLIANCE_CONFIGS } from '../../data/nilmConfigs';
import { SourceChip } from '../common/SourceChip';
import {
  calculateBill,
  calculateEnergyWh,
  allocateApplianceCost,
  whToKwh,
} from '../../utils/nilmCore';
import { IndianLanguage, getTranslation, SmartThingsTranslation } from '../../i18n/languages';
import {
  Calculator,
  Coins,
  ShieldAlert,
  Sliders,
  Leaf,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Plus,
  Minus,
  Sparkles,
  PiggyBank,
  Pencil,
  X,
} from 'lucide-react';

interface CostsViewProps {
  data: TimeSeriesPoint[];
  house: HouseInfo;
  tariff: TariffConfig;
  budget: BudgetConfig;
  onUpdateBudget: (budget: BudgetConfig) => void;
  emissionFactorGPerKwh?: number | null;
  emissionFactorSource?: string;
  language?: IndianLanguage;
  t?: SmartThingsTranslation;
}

export const CostsView: React.FC<CostsViewProps> = ({
  data,
  house,
  tariff,
  budget,
  onUpdateBudget,
  emissionFactorGPerKwh = 710,
  emissionFactorSource = 'Central Electricity Authority (CEA) India (2024)',
  language = 'hi',
  t: propT,
}) => {
  const t = propT || getTranslation(language);

  // Custom budget modal state (from Pencil button)
  const [isEditingCustomBudget, setIsEditingCustomBudget] = useState(false);
  const [customBudgetValue, setCustomBudgetValue] = useState('');

  // Aggregate energy
  const aggPowers = data.map((d) => d.aggregate_w);
  const dayKwh = whToKwh(calculateEnergyWh(aggPowers, 8));

  // Projected 30-day month
  const monthKwh = dayKwh * 30;
  const weekKwh = dayKwh * 7;

  // Bills
  const dayBill = calculateBill(dayKwh, tariff, 1);
  const weekBill = calculateBill(weekKwh, tariff, 7);
  const monthBill = calculateBill(monthKwh, tariff, 30);

  // Modeled appliances kWh
  const appliances = house.availableAppliances;
  const applianceStats = appliances.map((id) => {
    const powers = data.map((d) => {
      if (id === 'fridge') return d.fridge_est_w || 0;
      if (id === 'washing_machine') return d.washing_machine_est_w || 0;
      if (id === 'kettle') return d.kettle_est_w || 0;
      return 0;
    });
    const dayAppKwh = whToKwh(calculateEnergyWh(powers, 8));
    return {
      id,
      config: APPLIANCE_CONFIGS[id],
      dayKwh: dayAppKwh,
      monthKwh: dayAppKwh * 30,
    };
  });

  const totalModeledDayKwh = applianceStats.reduce((sum, a) => sum + a.dayKwh, 0);

  // Budget comparison (Strict bounds so it never overflows)
  const budgetValue = budget.value || 2000;
  const budgetRatio = Math.max(0, Math.min(100, (monthBill.totalBill / budgetValue) * 100));
  const isCaution = budgetRatio >= 80 && budgetRatio < 100;
  const isExceeded = monthBill.totalBill > budgetValue;

  // What-If Simulator state
  const [kettleBoilReduction, setKettleBoilReduction] = useState(1);
  const [washShiftCycles, setWashShiftCycles] = useState(2);
  const [fridgeEfficiencyGain, setFridgeEfficiencyGain] = useState(10);

  const kettleSavedKwhPerMonth = kettleBoilReduction * 0.12 * 30;
  const washSavedKwhPerMonth = washShiftCycles * 0.35 * 4;
  const fridgeSavedKwhPerMonth = (fridgeEfficiencyGain / 100) * (applianceStats.find((a) => a.id === 'fridge')?.monthKwh || 25);
  const totalWhatIfSavedKwh = kettleSavedKwhPerMonth + washSavedKwhPerMonth + fridgeSavedKwhPerMonth;

  const marginalRate = tariff.type === 'flat' ? tariff.flatRate : tariff.slabs[tariff.slabs.length - 1].ratePerKwh;
  const totalWhatIfSavedCost = totalWhatIfSavedKwh * marginalRate;

  // Quick budget adjust functions (NO VIRTUAL KEYBOARD POPUP)
  const adjustBudget = (delta: number) => {
    onUpdateBudget({ ...budget, value: Math.max(500, Math.min(20000, budgetValue + delta)) });
  };

  const getTranslatedApplianceName = (id: string) => {
    if (id === 'fridge') return t.fridgeName;
    if (id === 'washing_machine') return t.washingMachineName;
    if (id === 'kettle') return t.kettleName;
    return id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <span>{t.costsTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.costsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span className="text-slate-500">{t.tariffSlabs}:</span>
          <span className="font-bold text-slate-900">{tariff.name}</span>
        </div>
      </div>

      {/* Bill Projections Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's bill */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>{t.todayBill}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">1 Day</span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {tariff.currencySymbol}
              {dayBill.totalBill.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {dayKwh.toFixed(2)} kWh ({tariff.currencySymbol}{dayBill.energyCharge.toFixed(2)}) + {tariff.currencySymbol}{dayBill.standingCharge.toFixed(1)} {language === 'hi' ? 'फिक्स्ड' : 'fixed'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 font-medium">
            {language === 'hi' ? `जीएसटी / टैक्स: ${tariff.taxPercent}% शामिल है` : `Includes ${tariff.taxPercent}% domestic tax`}
          </div>
        </div>

        {/* Weekly bill */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>{t.weekBill}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">7 Days</span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {tariff.currencySymbol}
              {weekBill.totalBill.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {weekKwh.toFixed(1)} kWh {language === 'hi' ? 'अनुमानित खपत' : 'projected usage'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100 font-medium">
            {language === 'hi' ? 'वर्तमान पैटर्न के आधार पर' : 'Based on daily trend'}
          </div>
        </div>

        {/* Monthly bill */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
              <span>{t.monthBill}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">30 Days</span>
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {tariff.currencySymbol}
              {monthBill.totalBill.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {monthKwh.toFixed(0)} kWh {language === 'hi' ? 'अनुमानित' : 'projected'}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 font-medium font-mono">
            {language === 'hi' ? `बजट लक्ष्य: ${tariff.currencySymbol}${budgetValue}` : `Target: ${tariff.currencySymbol}${budgetValue}`}
          </div>
        </div>
      </div>

      {/* Budget Monitor Card - Completely Touch-Friendly (NO ON-SCREEN KEYBOARD TRIGGERS) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>{t.monthlyBudgetSetting}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi'
                ? `तय सीमा: ${tariff.currencySymbol}${budgetValue} / महीना`
                : `Configured limit: ${tariff.currencySymbol}${budgetValue} / month`}
            </p>
          </div>

          {/* Touch-Friendly Steppers & Presets (No raw input that summons mobile keyboard!) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">{t.quickPresets}:</span>
            {[1000, 1500, 2000, 2500, 3000, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onUpdateBudget({ ...budget, value: preset })}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all shadow-2xs ${
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
              title={language === 'hi' ? 'मनचाहा बजट डालें' : 'Set custom budget'}
              className="px-2.5 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl transition-all shadow-2xs flex items-center gap-1 hover:scale-105 active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-900 stroke-[2.5]" />
              <span>{t.customBudget}</span>
            </button>

            {/* Steppers [-] [+] for easy adjustment without keyboard */}
            <div className="flex items-center gap-1 ml-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => adjustBudget(-200)}
                className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs shadow-2xs"
                title="कम करें (-₹200)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-bold text-xs px-2 text-slate-900">
                {tariff.currencySymbol}{budgetValue}
              </span>
              <button
                type="button"
                onClick={() => adjustBudget(+200)}
                className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs shadow-2xs"
                title="बढ़ाएं (+₹200)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Gauge Bar */}
        <div className="relative pt-6 pb-2">
          {/* 80% Marker */}
          <div
            className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-10"
            style={{ left: '80%' }}
          >
            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
              80% {language === 'hi' ? 'सावधानी' : 'Caution'}
            </span>
            <div className="w-0.5 h-7 bg-amber-400 mt-0.5" />
          </div>

          {/* 100% Marker */}
          <div
            className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-10"
            style={{ left: '100%' }}
          >
            <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
              100% {language === 'hi' ? 'सीमा' : 'Limit'}
            </span>
            <div className="w-0.5 h-7 bg-rose-500 mt-0.5" />
          </div>

          <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isExceeded ? 'bg-rose-500' : isCaution ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(4, budgetRatio))}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
            <span>{tariff.currencySymbol}0</span>
            <span className="font-semibold text-slate-800">
              {language === 'hi' ? 'अनुमानित बिल' : 'Projected'}: <strong className="text-slate-900">{tariff.currencySymbol}{monthBill.totalBill.toFixed(0)}</strong> ({budgetRatio.toFixed(0)}%)
            </span>
            <span>{tariff.currencySymbol}{budgetValue}</span>
          </div>
        </div>
      </div>

      {/* Appliance Cost Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slab Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              {t.tariffSlabs}
            </h3>
            <span className="text-xs font-mono text-slate-500">Telescopic</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {monthBill.slabBreakdown.map((s, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-800">{s.slabName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {language === 'hi' ? 'दर' : 'Rate'}: {tariff.currencySymbol}{s.rate.toFixed(2)} / kWh
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900 tabular-nums">
                    {tariff.currencySymbol}{s.cost.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {s.kwh.toFixed(1)} kWh
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appliance Cost Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              {language === 'hi' ? 'उपकरणों के अनुसार मासिक खर्च' : 'Appliance Monthly Breakdown'}
            </h3>
            <span className="text-xs text-blue-600 font-semibold font-mono">AI NILM Est.</span>
          </div>

          <div className="space-y-3 text-xs">
            {applianceStats.map((app) => {
              const allocatedCost = allocateApplianceCost(
                app.monthKwh,
                totalModeledDayKwh * 30,
                monthBill.energyCharge
              );
              return (
                <div
                  key={app.id}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: app.config.color }}
                    />
                    <div>
                      <div className="font-bold text-slate-800">{getTranslatedApplianceName(app.id)}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ≈ {app.monthKwh.toFixed(1)} kWh / mo
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 tabular-nums">
                      ≈ {tariff.currencySymbol}{allocatedCost.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{t.modelEstimated}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive What-If Savings Calculator */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.whatIfTitle}</h3>
              <p className="text-xs text-slate-500">{t.whatIfSubtitle}</p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            + {tariff.currencySymbol}{totalWhatIfSavedCost.toFixed(0)} / mo {language === 'hi' ? 'बचत' : 'saved'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <span className="font-bold text-slate-900 block mb-1">
              {t.kettleName}: {language === 'hi' ? 'रोज 1 बार कम उबालना' : '1 less boil/day'}
            </span>
            <p className="text-[11px] text-slate-500">
              {language === 'hi' ? 'महीने में 3.6 kWh बिजली और ₹26 की बचत होगी।' : 'Saves approx 3.6 kWh and ₹26 per month.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <span className="font-bold text-slate-900 block mb-1">
              {t.washingMachineName}: {language === 'hi' ? 'पूरी क्षमता पर चलाएं' : 'Full load cycles'}
            </span>
            <p className="text-[11px] text-slate-500">
              {language === 'hi' ? 'महीने में 2.8 kWh और ₹22 की बचत होगी।' : 'Saves approx 2.8 kWh and ₹22 per month.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <span className="font-bold text-slate-900 block mb-1">
              {t.fridgeName}: {language === 'hi' ? 'तापमान 3°C पर सही रखें' : 'Optimal cooling'}
            </span>
            <p className="text-[11px] text-slate-500">
              {language === 'hi' ? 'महीने में लगभग ₹20 की बचत होगी।' : 'Saves approx ₹20 per month.'}
            </p>
          </div>
        </div>
      </div>

      {/* Custom Budget Modal inside CostsView */}
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
  );
};
