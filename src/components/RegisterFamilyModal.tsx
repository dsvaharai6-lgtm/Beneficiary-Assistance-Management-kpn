import React, { useState } from 'react';
import { Family, User, FamilyVulnerabilityProfile } from '../types';
import { StorageService } from '../services/storageService';
import { TRANSLATIONS, Language } from '../utils/translations';
import {
  Home,
  X,
  AlertCircle,
  GraduationCap,
  HeartPulse,
  DollarSign,
  Package,
  Building,
  Users2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface RegisterFamilyModalProps {
  currentUser: User;
  currentLang?: Language;
  onClose: () => void;
  onFamilyCreated: (family: Family) => void;
}

export const RegisterFamilyModal: React.FC<RegisterFamilyModalProps> = ({
  currentUser,
  currentLang = 'en',
  onClose,
  onFamilyCreated
}) => {
  const t = TRANSLATIONS[currentLang];
  const divisions = StorageService.getDivisions();
  const isGnOfficer = currentUser.Role === 'GN Officer' || currentUser.Role === 'GN_Officer' || currentUser.Division !== 'ALL';
  const defaultDiv = isGnOfficer ? currentUser.Division : divisions[0]?.Division_Name || 'Panichchankerni';

  const getSuggestedQR = (divName: string) => {
    const div = divisions.find(d => d.Division_Name === divName);
    const code = div ? div.Division_Name.substring(0, 3).toUpperCase() : 'VHR';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `VHR-${code}-${randomSuffix}`;
  };

  const [formData, setFormData] = useState({
    QR_Number: getSuggestedQR(defaultDiv),
    Division_Name: defaultDiv,
    Family_Name: '',
    Address: '',
    Telephone: '',
    Family_Size: '4',
    Monthly_Income: '25000',
    Housing_Status: 'Semi-permanent' as Family['Housing_Status'],
    Priority_Level: 'High' as Family['Priority_Level'],
    is_female_headed: false,
    no_toilet: false,
    no_drinking_water_well: false,
    no_house: false
  });

  const [showOptionalVulnerability, setShowOptionalVulnerability] = useState(false);
  const [activeVulnTab, setActiveVulnTab] = useState<'education' | 'health' | 'economic' | 'assets' | 'housing' | 'demography'>('education');
  const [vulnData, setVulnData] = useState<FamilyVulnerabilityProfile>({
    education_level: '',
    non_schooling_children_count: 0,
    chronic_illness_members: false,
    chronic_illness_details: '',
    disabled_members: false,
    disabled_count: 0,
    monthly_per_capita_income: undefined,
    monthly_per_capita_expenditure: undefined,
    electricity_under_60_units: false,
    no_house_land_ownership: false,
    no_other_building_ownership: false,
    no_cultivable_highland_half_acre: false,
    no_cultivable_paddy_one_acre: false,
    no_mobility_asset: false,
    no_economic_activity_asset: false,
    no_livelihood_livestock_asset: false,
    is_shanty_lineroom: false,
    no_permanent_wall_floor_roof: false,
    floor_area_under_500sqft: false,
    no_clean_drinking_water: false,
    no_adequate_sanitation: false,
    no_electricity_access: false,
    dependency_ratio_high: false,
    is_single_parent: false
  });

  const [error, setError] = useState<string | null>(null);

  const handleDivisionChange = (divName: string) => {
    setFormData(prev => ({
      ...prev,
      Division_Name: divName,
      QR_Number: getSuggestedQR(divName)
    }));
  };

  const flaggedCount = [
    Boolean(vulnData.education_level && vulnData.education_level === 'No formal education'),
    (vulnData.non_schooling_children_count || 0) > 0,
    vulnData.chronic_illness_members,
    vulnData.disabled_members,
    vulnData.electricity_under_60_units,
    vulnData.no_house_land_ownership,
    vulnData.no_other_building_ownership,
    vulnData.no_cultivable_highland_half_acre,
    vulnData.no_cultivable_paddy_one_acre,
    vulnData.no_mobility_asset,
    vulnData.no_economic_activity_asset,
    vulnData.no_livelihood_livestock_asset,
    vulnData.is_shanty_lineroom,
    vulnData.no_permanent_wall_floor_roof,
    vulnData.floor_area_under_500sqft,
    vulnData.no_clean_drinking_water,
    vulnData.no_adequate_sanitation,
    vulnData.no_electricity_access,
    vulnData.dependency_ratio_high,
    vulnData.is_single_parent
  ].filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const created = StorageService.addFamily(currentUser, {
        QR_Number: formData.QR_Number,
        Family_Name: formData.Family_Name,
        Division_Name: formData.Division_Name,
        Address: formData.Address,
        Telephone: formData.Telephone,
        Family_Size: Number(formData.Family_Size) || 1,
        Monthly_Income: Number(formData.Monthly_Income) || 0,
        Housing_Status: formData.Housing_Status,
        Priority_Level: formData.Priority_Level,
        vulnerability: vulnData,
        is_female_headed: formData.is_female_headed,
        no_toilet: formData.no_toilet,
        no_drinking_water_well: formData.no_drinking_water_well,
        no_house: formData.no_house
      });
      onFamilyCreated(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(currentLang === 'ta' ? 'குடும்பத்தைப் பதிவுசெய்வதில் பிழை ஏற்பட்டது.' : 'Failed to register family.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {currentLang === 'ta' ? 'புதிய பயனாளிக் குடும்பப் பதிவு' : 'Register Beneficiary Family'}
              </h3>
              <p className="text-xs text-slate-500">
                {currentLang === 'ta' ? 'அடிப்படை குடும்பத் தகவல்கள் & இடர்பாட்டுக் குறிகாட்டிகள்' : 'Core registry and optional socio-economic indicators'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
              1. {currentLang === 'ta' ? 'அடிப்படை குடும்ப விபரம்' : 'Core Household Details'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.qrNumber} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.QR_Number}
                  onChange={e => setFormData({ ...formData, QR_Number: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-800 bg-emerald-50/30"
                  placeholder="VHR-XXX-000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.gnDivision} <span className="text-rose-600">*</span>
                </label>
                <select
                  disabled={isGnOfficer}
                  value={formData.Division_Name}
                  onChange={e => handleDivisionChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100 disabled:text-slate-600 cursor-pointer"
                >
                  {divisions.map(d => (
                    <option key={d.GN_Code || d.Division_ID} value={d.Division_Name}>
                      {d.GN_Code ? `${d.GN_Code} - ` : ''}{currentLang === 'ta' && d.Tamil_Name ? d.Tamil_Name : d.Division_Name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {currentLang === 'ta' ? 'குடும்பத்தின் பெயர் / தலைவர்' : 'Family Name / Head of Household'} <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={currentLang === 'ta' ? 'உதா: சிவகுரு குடும்பம் (அல்லது குடும்பத் தலைவர் பெயர்)' : 'e.g. Sivaguru Family (or Household Head Name)'}
                value={formData.Family_Name}
                onChange={e => setFormData({ ...formData, Family_Name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {currentLang === 'ta' ? 'வதிவிட முகவரி' : 'Residential Address'}
                </label>
                <input
                  type="text"
                  placeholder={currentLang === 'ta' ? 'வட்டாரம் 03, கடற்கரை வீதி' : 'e.g. Ward 03, Beach Road'}
                  value={formData.Address}
                  onChange={e => setFormData({ ...formData, Address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {currentLang === 'ta' ? 'தொலைபேசி எண்' : 'Contact Telephone'}
                </label>
                <input
                  type="tel"
                  placeholder="+94 7X XXX XXXX"
                  value={formData.Telephone}
                  onChange={e => setFormData({ ...formData, Telephone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {currentLang === 'ta' ? 'குடும்ப அளவு' : 'Family Size'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.Family_Size}
                  onChange={e => setFormData({ ...formData, Family_Size: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {currentLang === 'ta' ? 'மாத வருமானம் (LKR)' : 'Monthly Income'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.Monthly_Income}
                  onChange={e => setFormData({ ...formData, Monthly_Income: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.priority}
                </label>
                <select
                  value={formData.Priority_Level}
                  onChange={e => setFormData({ ...formData, Priority_Level: e.target.value as Family['Priority_Level'] })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer"
                >
                  <option value="Critical">{currentLang === 'ta' ? 'மிக அவசரம் (Critical)' : 'Critical'}</option>
                  <option value="High">{currentLang === 'ta' ? 'அதி முன்னுரிமை (High)' : 'High'}</option>
                  <option value="Medium">{currentLang === 'ta' ? 'நடுத்தர முன்னுரிமை (Medium)' : 'Medium'}</option>
                  <option value="Normal">{currentLang === 'ta' ? 'சாதாரண (Normal)' : 'Normal'}</option>
                </select>
              </div>
            </div>

            {/* Quick check boxes for key vulnerabilities */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_female_headed}
                  onChange={e => setFormData({ ...formData, is_female_headed: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span className="text-[11px] font-semibold text-slate-800">👩 {currentLang === 'ta' ? 'பெண் தலைமை' : 'Female Headed'}</span>
              </label>
              <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.no_toilet}
                  onChange={e => setFormData({ ...formData, no_toilet: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span className="text-[11px] font-semibold text-slate-800">🚻 {currentLang === 'ta' ? 'மலசலகூடமில்லை' : 'No Toilet'}</span>
              </label>
              <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.no_drinking_water_well}
                  onChange={e => setFormData({ ...formData, no_drinking_water_well: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span className="text-[11px] font-semibold text-slate-800">💧 {currentLang === 'ta' ? 'குடிநீரில்லை' : 'No Well'}</span>
              </label>
              <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.no_house}
                  onChange={e => setFormData({ ...formData, no_house: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span className="text-[11px] font-semibold text-slate-800">🏚️ {currentLang === 'ta' ? 'வீடற்றவர்' : 'No House'}</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {t.vulnerabilityAssessment}
                    </span>
                    <span className="text-[11px] text-emerald-800 font-medium">
                      {t.optionalIndicatorsNotice}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {flaggedCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono">
                      {flaggedCount} {currentLang === 'ta' ? 'குறிகாட்டிகள்' : 'flags'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowOptionalVulnerability(!showOptionalVulnerability)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>{showOptionalVulnerability ? (currentLang === 'ta' ? 'மறைக்க' : 'Hide') : (currentLang === 'ta' ? 'விரிவாக்கு' : 'Expand')}</span>
                    {showOptionalVulnerability ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {showOptionalVulnerability && (
                <div className="mt-4 pt-3 border-t border-emerald-200/70 space-y-4">
                  <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-lg border border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setActiveVulnTab('education')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer ${
                        activeVulnTab === 'education' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{t.vulnEducation}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVulnTab('health')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer ${
                        activeVulnTab === 'health' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <HeartPulse className="w-3.5 h-3.5" />
                      <span>{t.vulnHealth}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVulnTab('economic')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer ${
                        activeVulnTab === 'economic' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{t.vulnEconomic}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVulnTab('assets')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer ${
                        activeVulnTab === 'assets' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{t.vulnAssets}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVulnTab('housing')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer ${
                        activeVulnTab === 'housing' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>{t.vulnHousing}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVulnTab('demography')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer ${
                        activeVulnTab === 'demography' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users2 className="w-3.5 h-3.5" />
                      <span>{t.vulnDemography}</span>
                    </button>
                  </div>

                  {activeVulnTab === 'education' && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">{t.educationLevel}</label>
                        <select
                          value={vulnData.education_level || ''}
                          onChange={e => setVulnData({ ...vulnData, education_level: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="">{currentLang === 'ta' ? 'தெரிவுசெய்க' : 'Select'}</option>
                          <option value="No formal education">{currentLang === 'ta' ? 'முறையான கல்வியில்லை' : 'No formal education'}</option>
                          <option value="Primary (Grade 1-5)">Primary (Grade 1-5)</option>
                          <option value="Secondary (Grade 6-11)">Secondary (Grade 6-11)</option>
                          <option value="G.C.E. O/L">G.C.E. O/L</option>
                          <option value="G.C.E. A/L">G.C.E. A/L</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              {currentLang === 'ta' ? 'குடும்பத்தை சேமிக்க' : 'Save Family Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
