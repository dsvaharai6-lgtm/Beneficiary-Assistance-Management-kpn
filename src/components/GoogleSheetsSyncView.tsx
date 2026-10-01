import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { TRANSLATIONS, Language } from '../utils/translations';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Copy,
  Check,
  RefreshCw,
  Database,
  Code2
} from 'lucide-react';

interface GoogleSheetsSyncViewProps {
  currentLang?: Language;
}

export const GoogleSheetsSyncView: React.FC<GoogleSheetsSyncViewProps> = ({
  currentLang = 'en'
}) => {
  const t = TRANSLATIONS[currentLang];
  const isTa = currentLang === 'ta';
  const [copied, setCopied] = useState(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState(StorageService.getAppsScriptUrl());
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const sheets = [
    { name: 'Families', count: StorageService.getFamilies().length, desc: isTa ? 'குடும்பங்கள் & இடர்பாட்டு விபரங்கள்' : 'Household registry & vulnerability status' },
    { name: 'Family_Members', count: StorageService.getMembers().length, desc: isTa ? 'உறுப்பினர்கள் & NIC இலக்கங்கள்' : 'Individual members with unique NICs' },
    { name: 'Assistance_Records', count: StorageService.getAssistance().length, desc: isTa ? 'வழங்கப்பட்ட உதவிகள் & உபகரணங்கள்' : 'Log of delivered aid & equipment' },
    { name: 'Needs', count: StorageService.getNeeds().length, desc: isTa ? 'குடும்பங்களின் தேவைகள் பதிவு' : 'Documented household requirements' },
    { name: 'QR_Change_Requests', count: StorageService.getQRRequests().length, desc: isTa ? 'QR / NIC மாற்றுக் கோரிக்கைகள்' : 'NIC reassignment approval queue' },
    { name: 'GN_Divisions', count: StorageService.getDivisions().length, desc: isTa ? 'வாகரையின் 16 கிராம சேவகர் பிரிவுகள்' : '16 official GN divisions of Vaharai' },
    { name: 'Assistance_Programs', count: StorageService.getPrograms().length, desc: isTa ? 'செயலில் உள்ள உதவித் திட்டங்கள்' : 'Active welfare schemes' },
    { name: 'Users', count: StorageService.getUsers().length, desc: isTa ? 'உத்தியோகத்தர் பயனர் கணக்குகள்' : 'Officer credentials and division roles' },
    { name: 'Audit_Log', count: StorageService.getAuditLogs().length, desc: isTa ? 'கட்டமைப்பு கணக்காய்வுப் பதிவுகள்' : 'Immutable transaction trails' },
    { name: 'Visitor_Log', count: StorageService.getVisits().length, desc: isTa ? 'வரவேற்பு வருகையாளர் பதிவுகள்' : 'Reception visitor queue records' }
  ];

  const handleExportCsv = (sheetName: string) => {
    let csv = '';
    if (sheetName === 'Families') {
      csv = StorageService.exportBeneficiariesCsv({ User_ID: 'admin', Role: 'Super Admin', Division: 'ALL', Name: 'Admin', Status: 'Active', Created_At: '' });
    } else {
      csv = StorageService.exportSheetAsCsv(sheetName);
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${sheetName}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const json = StorageService.exportAllAsJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Beneficiary_System_Full_Backup_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        StorageService.importAllFromJson(content);
        setSyncStatus(isTa ? 'காப்புப் பிரதி வெற்றிகரமாக மீளமைக்கப்பட்டது!' : 'Data imported successfully!');
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        alert(isTa ? 'தவறான JSON கோப்பு.' : 'Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAppsScriptUrl = () => {
    StorageService.setAppsScriptUrl(appsScriptUrl);
    setSyncStatus(isTa ? 'முனைய URL சேமிக்கப்பட்டது!' : 'Endpoint URL saved successfully!');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleTestSync = async () => {
    setTestingConnection(true);
    setSyncStatus(isTa ? 'Google Sheets உடன் இணைக்கப்படுகிறது...' : 'Testing Google Sheets connection...');
    try {
      StorageService.setAppsScriptUrl(appsScriptUrl);
      const res = await StorageService.syncFromCloud();
      setSyncStatus(
        res.synced
          ? (isTa ? `வெற்றி! ${res.message}` : `Success! ${res.message}`)
          : (isTa ? `குறிப்பு: ${res.message}` : `Note: ${res.message}`)
      );
    } catch (err: any) {
      setSyncStatus(isTa ? 'இணைப்பு பிழை.' : 'Connection error: ' + (err.message || 'Failed'));
    } finally {
      setTestingConnection(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            {t.sheetsSyncTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isTa
              ? 'Google Sheets மற்றும் காப்புப் பிரதிகளுக்கான நேரடி ஏற்றுமதி மற்றும் ஒருங்கிணைப்பு.'
              : 'Direct integration with Google Sheets, Apps Script Webhook, and CSV schema backups.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{isTa ? 'JSON மீட்டெடுப்பு' : 'Restore Backup'}</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isTa ? 'முழுமையான காப்புப் பிரதி (JSON)' : 'Full JSON Backup'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {isTa ? 'Google Sheets அட்டவணைகள் (Worksheets) & CSV பதிவிறக்கம்' : 'Target Google Sheets Worksheets'}
            </h3>
            <p className="text-xs text-slate-500">
              {isTa ? 'ஒவ்வொரு அட்டவணைக்கும் தனித்தனி CSV கோப்புகள் பதிவிறக்க வசதி.' : 'Download individual CSV tables or full dataset.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sheets.map(sheet => (
            <div
              key={sheet.name}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
            >
              <div>
                <h4 className="font-mono font-bold text-xs text-slate-900">{sheet.name}</h4>
                <p className="text-[11px] text-slate-500 truncate max-w-[190px]">{sheet.desc}</p>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold">{sheet.count} records</span>
              </div>
              <button
                onClick={() => handleExportCsv(sheet.name)}
                title={`Export ${sheet.name}.csv`}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 rounded-md shadow-xs inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
