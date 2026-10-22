import React from 'react';
import { Power, Sparkles, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { SmartThingsTranslation } from '../../i18n/languages';

export interface SmartDevice {
  id: string;
  name: string;
  room: string;
  iconType: 'fridge' | 'washing_machine' | 'kettle' | 'ac' | 'tv' | 'fan';
  isOn: boolean;
  powerW: number;
  todayKwh: number;
  cost: number;
  currencySymbol: string;
  statusLabel: string;
  isAiEstimated: boolean;
  confidence: 'High' | 'Medium' | 'Low';
  color: string;
}

interface DeviceCardProps {
  device: SmartDevice;
  t?: SmartThingsTranslation;
  onTogglePower?: (id: string) => void;
  onClickDetail?: (id: string) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  t,
  onTogglePower,
  onClickDetail,
}) => {
  // Rich, high-fidelity Samsung SmartThings styled visual device art
  const renderVisualAppliance = () => {
    switch (device.iconType) {
      case 'fridge':
        return (
          <div className="w-16 h-20 rounded-xl bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 p-1 flex flex-col justify-between shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform">
            {/* Top Refrigerator Door */}
            <div className="h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg p-1 flex flex-col justify-between border-b border-slate-400/40 relative">
              <div className="flex justify-between items-center">
                <span className="w-2.5 h-0.5 bg-sky-500 rounded-full" />
                <span className="text-[7px] font-mono text-sky-600 font-bold bg-sky-50 px-1 rounded-xs">3°C</span>
              </div>
              <div className="w-1 h-3 bg-slate-400 rounded-full self-end mr-0.5" />
            </div>
            {/* Bottom Freezer Door */}
            <div className="h-7 bg-gradient-to-br from-slate-200 to-slate-300 rounded-b-lg p-1 flex justify-between items-center">
              <span className="text-[6px] font-mono text-slate-500">-18°C</span>
              <div className="w-1 h-2.5 bg-slate-400 rounded-full" />
            </div>
          </div>
        );

      case 'washing_machine':
        return (
          <div className="w-16 h-18 rounded-xl bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 p-1.5 flex flex-col items-center justify-between shadow-inner relative group-hover:scale-105 transition-transform">
            {/* Control dial & display */}
            <div className="w-full flex items-center justify-between px-1">
              <div className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-white" />
              <div className="w-5 h-1.5 bg-emerald-900 rounded-xs flex items-center justify-center">
                <span className="text-[6px] font-mono text-emerald-400">42m</span>
              </div>
            </div>
            {/* Front load glass door */}
            <div className="w-11 h-11 rounded-full bg-slate-800 p-1 flex items-center justify-center shadow-md relative">
              <div className={`w-8 h-8 rounded-full border-2 border-slate-400/80 ${device.isOn ? 'bg-gradient-to-tr from-blue-500 via-sky-400 to-cyan-300 animate-spin-slow' : 'bg-slate-700'} flex items-center justify-center overflow-hidden`}>
                <div className="w-3 h-3 rounded-full bg-slate-900/40" />
              </div>
            </div>
          </div>
        );

      case 'kettle':
        return (
          <div className="w-16 h-18 flex items-center justify-center relative group-hover:scale-105 transition-transform">
            <div className="relative">
              {device.isOn && (
                <div className="absolute -top-3 left-3 flex gap-0.5">
                  <span className="w-1 h-2 bg-amber-300/60 rounded-full animate-pulse" />
                  <span className="w-1 h-3 bg-amber-400/60 rounded-full animate-pulse delay-75" />
                </div>
              )}
              <div className="absolute -left-2 top-3 w-3 h-2 bg-slate-700 rounded-l-full rotate-12" />
              <div className="w-11 h-12 rounded-t-xl rounded-b-lg bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 p-1 flex flex-col justify-between border-t border-slate-600">
                <div className="w-2 h-1 bg-amber-500 rounded-full self-center" />
                <div className="w-1 h-6 bg-amber-400/80 rounded-full self-center" />
                <div className="w-full h-1 bg-slate-600 rounded-xs" />
              </div>
              <div className="absolute -right-2 top-2 w-3 h-8 border-2 border-slate-700 rounded-r-xl" />
              <div className="w-12 h-1.5 bg-slate-950 rounded-full mt-0.5 mx-auto" />
            </div>
          </div>
        );

      case 'ac':
        return (
          <div className="w-18 h-12 rounded-lg bg-gradient-to-b from-slate-50 via-white to-slate-200 border border-slate-300 p-1 flex flex-col justify-between shadow-sm relative group-hover:scale-105 transition-transform">
            <div className="flex justify-between items-center px-1">
              <span className="text-[6px] font-bold text-slate-400">SMART AC</span>
              <span className="text-[7px] font-mono text-cyan-600 font-bold bg-cyan-50 px-1 rounded">24°C</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-xs border-t border-slate-300 flex items-center justify-around px-1">
              <span className="w-full h-0.5 bg-cyan-400/60 rounded-full" />
            </div>
            {device.isOn && (
              <div className="absolute -bottom-2 left-2 right-2 flex justify-around">
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-100" />
              </div>
            )}
          </div>
        );

      case 'tv':
        return (
          <div className="w-18 h-14 flex flex-col items-center justify-center relative group-hover:scale-105 transition-transform">
            <div className="w-16 h-10 rounded-sm bg-slate-900 border border-slate-700 p-0.5 shadow-md flex items-center justify-center overflow-hidden relative">
              {device.isOn ? (
                <div className="w-full h-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 rounded-xs flex items-center justify-center">
                  <span className="text-[6px] text-white/80 font-bold">4K HDR</span>
                </div>
              ) : (
                <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-rose-600" />
                </div>
              )}
            </div>
            <div className="w-2 h-1.5 bg-slate-600" />
            <div className="w-8 h-0.5 bg-slate-500 rounded-full" />
          </div>
        );

      default: // fan
        return (
          <div className="w-16 h-16 flex items-center justify-center relative group-hover:scale-105 transition-transform">
            <div className={`w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center relative ${device.isOn ? 'animate-spin-slow' : ''}`}>
              <div className="w-3 h-3 rounded-full bg-emerald-600 z-10 shadow-xs" />
              <div className="absolute w-10 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-80" />
              <div className="absolute w-10 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full rotate-60 opacity-80" />
              <div className="absolute w-10 h-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full -rotate-60 opacity-80" />
            </div>
          </div>
        );
    }
  };

  const getEmojiIcon = () => {
    switch (device.iconType) {
      case 'fridge': return '🧊';
      case 'washing_machine': return '🧺';
      case 'kettle': return '♨️';
      case 'ac': return '❄️';
      case 'tv': return '📺';
      default: return '🌀';
    }
  };

  return (
    <div
      onClick={() => onClickDetail && onClickDetail(device.id)}
      className={`relative p-5 rounded-3xl transition-all duration-200 cursor-pointer select-none border flex flex-col justify-between ${
        device.isOn
          ? 'bg-white border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1 ring-blue-500/10'
          : 'bg-slate-100/70 border-slate-200/60 opacity-80 hover:opacity-100'
      }`}
    >
      {/* Top row: Visual Appliance Art + Big Tactile Power Switch */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="p-2 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center min-w-[72px] min-h-[72px] relative shadow-2xs">
          {renderVisualAppliance()}
          <span className="absolute -top-1.5 -left-1.5 text-base shadow-xs rounded-full bg-white px-1">
            {getEmojiIcon()}
          </span>
        </div>

        {/* Big visual power toggle: Green when ON, Grey when OFF */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePower && onTogglePower(device.id);
          }}
          title={device.isOn ? (t?.powerOff || 'Switch Off') : (t?.powerOn || 'Switch On')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all shadow-xs ${
            device.isOn
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-95'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
          }`}
        >
          <Power className="w-4 h-4 stroke-[2.5]" />
          <span className="text-xs font-bold font-mono">
            {device.isOn ? (t?.powerOn || 'ON') : (t?.powerOff || 'OFF')}
          </span>
        </button>
      </div>

      {/* Middle: Translated Name + Room & Status */}
      <div className="my-1">
        <h4 className="text-base font-bold text-slate-900 leading-snug flex items-center gap-1.5">
          <span>{device.name}</span>
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
          <span className="font-medium text-slate-600">{device.room}</span>
          <span>&bull;</span>
          <span className={device.isOn ? 'text-emerald-700 font-bold flex items-center gap-1' : 'text-slate-400'}>
            {device.isOn ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {device.statusLabel}
              </>
            ) : (
              t?.powerOff || 'Switched Off'
            )}
          </span>
        </div>
      </div>

      {/* Bottom stats: Big Live Watts & Cost */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-baseline justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
            {t?.liveDrawText || 'Live Power'}
          </span>
          <div className={`text-lg font-black font-mono tabular-nums ${device.isOn ? 'text-slate-900' : 'text-slate-400'}`}>
            {device.isOn ? `${device.powerW} W` : '0 W'}
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
            {t?.todayCostText || "Today's Cost"}
          </span>
          <div className="text-sm font-bold font-mono text-slate-800 tabular-nums">
            ≈ {device.currencySymbol}{device.cost.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Tap hint */}
      <div className="mt-2.5 pt-2 border-t border-slate-100/60 text-[11px] text-blue-600 font-medium flex items-center justify-between">
        <span className="flex items-center gap-1 text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t?.modelEstimated || 'AI Smart Meter'}</span>
        </span>
        <span className="flex items-center gap-0.5 text-blue-600 font-semibold hover:underline">
          <span>{t?.tapToInspect || 'Details'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
