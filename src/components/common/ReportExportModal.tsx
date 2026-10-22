import React from 'react';
import { HouseInfo, TariffConfig, TimeSeriesPoint } from '../../types/nilm';
import { calculateBill, calculateEnergyWh, whToKwh } from '../../utils/nilmCore';
import { Language, TRANSLATIONS } from '../../i18n/translations';
import { FileDown, Printer, X, CheckCircle2 } from 'lucide-react';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TimeSeriesPoint[];
  house: HouseInfo;
  tariff: TariffConfig;
  language: Language;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  data,
  house,
  tariff,
  language,
}) => {
  if (!isOpen) return null;
  const t = TRANSLATIONS[language];

  const aggPowers = data.map((d) => d.aggregate_w);
  const totalKwh = whToKwh(calculateEnergyWh(aggPowers, 8));
  const bill = calculateBill(totalKwh, tariff, 1);

  const fridgeKwh = whToKwh(calculateEnergyWh(data.map((d) => d.fridge_est_w || 0), 8));
  const wmKwh = whToKwh(calculateEnergyWh(data.map((d) => d.washing_machine_est_w || 0), 8));
  const kettleKwh = whToKwh(calculateEnergyWh(data.map((d) => d.kettle_est_w || 0), 8));
  const otherKwh = Math.max(0, totalKwh - (fridgeKwh + wmKwh + kettleKwh));

  const handleDownloadCsv = () => {
    const csvRows = [
      ['Report Type', 'NILM Household Energy Consumption Summary'],
      ['Generated At', new Date().toISOString()],
      ['Dataset / Source', house.label],
      ['Measured Total Energy (kWh)', totalKwh.toFixed(3)],
      ['Estimated Total Bill', `${tariff.currencySymbol}${bill.totalBill.toFixed(2)}`],
      ['Tariff Applied', tariff.name],
      [],
      ['Appliance', 'Estimated Energy (kWh)', 'Share of Total (%)', 'Status'],
      ['Refrigerator', fridgeKwh.toFixed(3), ((fridgeKwh / totalKwh) * 100).toFixed(1), 'Est. (Seq2point)'],
      ['Washing Machine', wmKwh.toFixed(3), ((wmKwh / totalKwh) * 100).toFixed(1), 'Est. (Seq2point)'],
      ['Electric Kettle', kettleKwh.toFixed(3), ((kettleKwh / totalKwh) * 100).toFixed(1), 'Est. (Seq2point)'],
      ['Other (Unmodelled Base)', otherKwh.toFixed(3), ((otherKwh / totalKwh) * 100).toFixed(1), 'Calculated Residual'],
    ];

    const csvContent = csvRows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nilm_energy_report_${house.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              {language === 'hi' ? 'ऊर्जा खपत रिपोर्ट निर्यात (Export)' : 'Export Household Energy Report'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable summary preview */}
        <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs" id="printable-nilm-report">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <div>
              <div className="font-bold text-sm text-slate-900">VoltDisagg NILM Summary Report</div>
              <div className="text-slate-500">{house.label} · 24-Hour Period</div>
            </div>
            <div className="text-right font-mono text-slate-500">
              {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-slate-500">Measured Total:</span>
              <div className="font-bold font-mono text-sm text-slate-900">{totalKwh.toFixed(2)} kWh</div>
            </div>
            <div>
              <span className="text-slate-500">Estimated Cost:</span>
              <div className="font-bold font-mono text-sm text-slate-900">
                {tariff.currencySymbol}{bill.totalBill.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <div className="font-semibold text-slate-700">Appliance Model Estimates (Seq2point CNN):</div>
            <div className="flex justify-between font-mono">
              <span>Refrigerator:</span>
              <span>{fridgeKwh.toFixed(2)} kWh ({((fridgeKwh / totalKwh) * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Washing Machine:</span>
              <span>{wmKwh.toFixed(2)} kWh ({((wmKwh / totalKwh) * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Electric Kettle:</span>
              <span>{kettleKwh.toFixed(2)} kWh ({((kettleKwh / totalKwh) * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between font-mono text-slate-500 border-t border-slate-200 pt-1">
              <span>Other (Unmodelled Base):</span>
              <span>{otherKwh.toFixed(2)} kWh ({((otherKwh / totalKwh) * 100).toFixed(0)}%)</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span>{t.exportCsv}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>{t.exportPdf}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
