import React, { useState, useMemo } from 'react';
import { Family, User, FamilyMember, AssistanceRecord } from '../types';
import { StorageService } from '../services/storageService';
import { Language } from '../utils/translations';
import {
  Printer,
  X,
  Filter,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import { AppLogo } from './AppLogo';

interface PrintableRegistryModalProps {
  initialFamilies: Family[];
  currentUser: User;
  currentLang: Language;
  onClose: () => void;
}

export const PrintableRegistryModal: React.FC<PrintableRegistryModalProps> = ({
  initialFamilies,
  currentUser,
  currentLang,
  onClose
}) => {
  const isTa = currentLang === 'ta';
  const isGnOfficer = currentUser.Role === 'GN Officer' || currentUser.Role === 'GN_Officer';
  const divisions = StorageService.getDivisions();
  const allMembers = StorageService.getMembers();
  const allAssistance = StorageService.getAssistance();

  const [printLayout, setPrintLayout] = useState<'table' | 'cards'>('table');
  const [selectedDivision, setSelectedDivision] = useState<string>(
    currentUser.Division !== 'ALL' ? currentUser.Division : 'ALL'
  );
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const printableFamilies = useMemo(() => {
    return initialFamilies.filter(f => {
      if (isGnOfficer && f.Division_Name.toLowerCase() !== currentUser.Division.toLowerCase()) {
        return false;
      }
      if (selectedDivision !== 'ALL' && f.Division_Name.toLowerCase() !== selectedDivision.toLowerCase()) {
        return false;
      }
      if (selectedPriority !== 'ALL' && f.Priority_Level !== selectedPriority) {
        return false;
      }
      return true;
    });
  }, [initialFamilies, selectedDivision, selectedPriority, isGnOfficer, currentUser.Division]);

  const stats = useMemo(() => {
    let totalMembers = 0;
    let totalIncome = 0;
    let totalAidAmount = 0;
    printableFamilies.forEach(f => {
      totalMembers += f.Family_Size || 0;
      totalIncome += f.Monthly_Income || 0;
      const famAid = allAssistance.filter(a => a.QR_Number.toUpperCase() === f.QR_Number.toUpperCase());
      totalAidAmount += famAid.reduce((acc, a) => acc + (a.Amount || 0), 0);
    });
    return {
      totalFamilies: printableFamilies.length,
      totalMembers,
      totalIncome,
      totalAidAmount
    };
  }, [printableFamilies, allAssistance]);

  const handleTriggerPrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString(isTa ? 'ta-LK' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-none sm:rounded-xl shadow-2xl border border-slate-300 w-full max-w-6xl h-full sm:max-h-[96vh] flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg">
              <Printer className="w-5 h-5 text-emerald-400" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{isTa ? 'குடும்பப் பதிவேடு அச்சிடும் கட்டமைப்பு' : 'Family Registry Print Document'}</span>
                <span className="text-xs font-mono font-normal text-emerald-400">
                  ({printableFamilies.length} {isTa ? 'குடும்பங்கள்' : 'Families'})
                </span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isTa ? 'அச்சிடுக (Print)' : 'Print Document'}</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 no-print">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>{isTa ? 'வடிகட்டல்:' : 'Print Filter:'}</span>
            </span>
            <select
              value={isGnOfficer ? currentUser.Division : selectedDivision}
              onChange={e => setSelectedDivision(e.target.value)}
              disabled={isGnOfficer}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium cursor-pointer"
            >
              {!isGnOfficer && (
                <option value="ALL">{isTa ? 'அனைத்து கிராம சேவகர் பிரிவுகளும்' : 'All 16 GN Divisions'}</option>
              )}
              {divisions.map(d => (
                <option key={d.Division_ID} value={d.Division_Name}>{d.Division_Name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white print:p-0">
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-1 flex flex-col items-center">
            <AppLogo size="md" className="mb-1 ring-1 ring-slate-300" />
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-700">
              Democratic Socialist Republic of Sri Lanka
            </div>
            <div className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
              {isTa ? 'பிரதேச செயலகம் – கோரளைப்பற்று வடக்கு (வாகரை)' : 'Divisional Secretariat – Koralaipattu North (Vaharai)'}
            </div>
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
              {isTa ? 'குடும்ப பயனாளிகள் முதன்மைப் பதிவேடு' : 'Family Beneficiary Master Registry Ledger'}
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-600 border-t border-slate-200 mt-2">
              <div>
                <strong>{isTa ? 'பிரிவு:' : 'Division Scope:'}</strong>{' '}
                {isGnOfficer ? currentUser.Division : selectedDivision}
              </div>
              <div>
                <strong>{isTa ? 'திகதி:' : 'Date Generated:'}</strong> {currentDate}
              </div>
              <div>
                <strong>{isTa ? 'உத்தியோகத்தர்:' : 'Generated By:'}</strong> {currentUser.Name} ({currentUser.Role})
              </div>
              <div>
                <strong>{isTa ? 'மொத்தக் குடும்பங்கள்:' : 'Total Families:'}</strong> {stats.totalFamilies}
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-left text-[10px] sm:text-xs">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 text-center w-8">#</th>
                  <th className="p-2 font-mono">{isTa ? 'QR எண்' : 'QR Number'}</th>
                  <th className="p-2">{isTa ? 'பிரிவு' : 'GN Division'}</th>
                  <th className="p-2">{isTa ? 'குடும்பத் தலைவர்' : 'Family Head'}</th>
                  <th className="p-2">{isTa ? 'முகவரி' : 'Address'}</th>
                  <th className="p-2 text-center">{isTa ? 'உறுப்பினர்கள்' : 'Size'}</th>
                  <th className="p-2 text-right">{isTa ? 'வருமானம் (LKR)' : 'Income'}</th>
                  <th className="p-2 text-center">{isTa ? 'முன்னுரிமை' : 'Priority'}</th>
                  <th className="p-2 text-right">{isTa ? 'பெற்ற உதவி' : 'Aid Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {printableFamilies.map((f, idx) => {
                  const famAid = allAssistance.filter(a => a.QR_Number.toUpperCase() === f.QR_Number.toUpperCase());
                  const aidSum = famAid.reduce((acc, a) => acc + (a.Amount || 0), 0);
                  return (
                    <tr key={f.Family_ID} className="break-inside-avoid hover:bg-slate-50/50">
                      <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-2 font-mono font-bold text-slate-900 whitespace-nowrap">{f.QR_Number}</td>
                      <td className="p-2 text-slate-800">{f.Division_Name}</td>
                      <td className="p-2 font-bold text-slate-900">{f.Family_Name}</td>
                      <td className="p-2 text-slate-600">{f.Address}</td>
                      <td className="p-2 text-center font-mono font-bold text-slate-900">{f.Family_Size}</td>
                      <td className="p-2 text-right font-mono text-slate-800">{f.Monthly_Income.toLocaleString()}</td>
                      <td className="p-2 text-center whitespace-nowrap font-bold">{f.Priority_Level}</td>
                      <td className="p-2 text-right font-mono text-slate-800 font-semibold whitespace-nowrap">
                        {aidSum > 0 ? `LKR ${aidSum.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signature Blocks */}
          <div className="mt-8 pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-xs font-mono break-inside-avoid">
            <div className="space-y-8">
              <div className="text-[11px] text-slate-500">...................................................</div>
              <div>
                <strong className="block text-slate-900">{isTa ? 'தயாரித்தவர் (Prepared By)' : 'Prepared By'}</strong>
                <span className="text-[10px] text-slate-600">{currentUser.Name}</span>
              </div>
            </div>
            <div className="space-y-8">
              <div className="text-[11px] text-slate-500">...................................................</div>
              <div>
                <strong className="block text-slate-900">{isTa ? 'சரிபார்த்தவர் (Verified By)' : 'Verified By'}</strong>
                <span className="text-[10px] text-slate-600">{isTa ? 'கிராம அலுவலர்' : 'Grama Niladhari'}</span>
              </div>
            </div>
            <div className="space-y-8">
              <div className="text-[11px] text-slate-500">...................................................</div>
              <div>
                <strong className="block text-slate-900">{isTa ? 'அங்கீகரித்தவர் (Approved By)' : 'Approved By'}</strong>
                <span className="text-[10px] text-slate-600">{isTa ? 'பிரதேச செயலாளர் (வாகரை)' : 'Divisional Secretary (Vaharai)'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableRegistryModal;
