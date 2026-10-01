import React, { useState } from 'react';
import { User, AssistanceProgram } from '../types';
import { StorageService } from '../services/storageService';
import { TRANSLATIONS, Language } from '../utils/translations';
import {
  Users,
  Shield,
  Layers,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building,
  Key,
  X
} from 'lucide-react';

interface ProgramsAndUsersViewProps {
  currentUser: User;
  currentLang?: Language;
}

export const ProgramsAndUsersView: React.FC<ProgramsAndUsersViewProps> = ({
  currentUser,
  currentLang = 'en'
}) => {
  const t = TRANSLATIONS[currentLang];
  const isTa = currentLang === 'ta';
  const [activeTab, setActiveTab] = useState<'programs' | 'users'>('programs');
  const [programs, setPrograms] = useState<AssistanceProgram[]>(() => StorageService.getPrograms());
  const [users, setUsers] = useState<Omit<User, 'Password'>[]>(() => StorageService.getUsers());
  const divisions = StorageService.getDivisions();

  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [programForm, setProgramForm] = useState({
    Program_Name: '',
    Program_Type: 'Livelihood',
    Description: ''
  });

  const [userForm, setUserForm] = useState({
    User_ID: '',
    Password: '',
    Name: '',
    Role: 'GN_Officer' as User['Role'],
    Division: divisions[0]?.Division_Name || 'Panichchankerni'
  });

  const refreshAll = () => {
    setPrograms(StorageService.getPrograms());
    setUsers(StorageService.getUsers());
  };

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      StorageService.addProgram(currentUser, {
        Program_Name: programForm.Program_Name,
        Program_Type: programForm.Program_Type,
        Description: programForm.Description,
        Status: 'Active'
      });
      refreshAll();
      setShowAddProgram(false);
      setProgramForm({ Program_Name: '', Program_Type: 'Livelihood', Description: '' });
      setFeedback({
        type: 'success',
        message: isTa ? 'உதவித் திட்டம் வெற்றிகரமாக உருவாக்கப்பட்டது.' : 'Assistance program created successfully.'
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      StorageService.createUser(currentUser, {
        User_ID: userForm.User_ID,
        Password: userForm.Password,
        Name: userForm.Name,
        Role: userForm.Role,
        Division: userForm.Role === 'Super_Admin' || userForm.Role === 'Assistance_Officer' || userForm.Role === 'Auditor' || userForm.Role === 'Receptionist' ? 'ALL' : userForm.Division
      });
      refreshAll();
      setShowAddUser(false);
      setUserForm({
        User_ID: '',
        Password: '',
        Name: '',
        Role: 'GN_Officer',
        Division: divisions[0]?.Division_Name || 'Panichchankerni'
      });
      setFeedback({
        type: 'success',
        message: isTa ? 'புதிய உத்தியோகத்தர் கணக்கு உருவாக்கப்பட்டது.' : 'New officer account created successfully.'
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  const isSuperAdmin = currentUser.Role === 'Super_Admin' || currentUser.Role === 'Super Admin';

  const getRoleLabel = (role: User['Role']) => {
    if (isTa) {
      if (role === 'Super_Admin' || role === 'Super Admin') return 'முதன்மை நிர்வாகி (Super Admin)';
      if (role === 'GN_Officer' || role === 'GN Officer') return 'கிராம அலுவலர் (GN Officer)';
      if (role === 'Assistance_Officer' || role === 'Assistance Officer') return 'உதவி வழங்கல் உத்தியோகத்தர்';
      if (role === 'Auditor') return 'கணக்காய்வாளர் (Auditor)';
      if (role === 'Receptionist') return 'வரவேற்பு உத்தியோகத்தர் (Receptionist)';
    }
    return role.replace('_', ' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            {t.programsAndUsersTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isTa
              ? 'உதவித் திட்டங்களை உருவாக்குதல் மற்றும் உத்தியோகத்தர்களின் கணக்குகளை நிர்வகித்தல்.'
              : 'Configure assistance initiatives and divisional officer accounts.'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'programs'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isTa ? 'உதவித் திட்டங்கள்' : 'Assistance Programs'} ({programs.length})
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTa ? 'உத்தியோகத்தர் கணக்குகள்' : 'Officer Accounts'} ({users.length})
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex gap-2 items-center ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Programs Tab */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {isTa ? 'செயலில் உள்ள திட்டங்கள்' : 'Available Assistance Programs'}
            </h3>
            <button
              onClick={() => setShowAddProgram(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isTa ? 'புதிய திட்டம்' : 'Add Program'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map(prog => (
              <div
                key={prog.Program_ID}
                className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs space-y-2.5 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {prog.Program_ID}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {prog.Status}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{prog.Program_Name}</h4>
                  <span className="text-[10px] text-slate-500 font-medium">{prog.Program_Type}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {prog.Description}
                </p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{isTa ? 'ஆரம்பம்:' : 'Started:'} {prog.Start_Date || '-'}</span>
                  <span>{prog.Created_By || 'admin01'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {isTa ? 'அங்கீகரிக்கப்பட்ட உத்தியோகத்தர் கணக்குகள்' : 'Authorized Officer Accounts'}
            </h3>
            <button
              onClick={() => setShowAddUser(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isTa ? 'பயனர் கணக்கு உருவாக்கு' : 'Create User'}</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3 font-mono">{t.userId}</th>
                    <th className="px-3.5 py-3">{isTa ? 'உத்தியோகத்தர் பெயர்' : 'Full Name'}</th>
                    <th className="px-3.5 py-3">{isTa ? 'பதவி (Role)' : 'Role'}</th>
                    <th className="px-3.5 py-3">{t.gnDivision}</th>
                    <th className="px-3.5 py-3 text-center">{isTa ? 'நிலை' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.User_ID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-3 font-mono font-bold text-emerald-700">{u.User_ID}</td>
                      <td className="px-3.5 py-3 font-medium text-slate-900">{u.Name}</td>
                      <td className="px-3.5 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {getRoleLabel(u.Role)}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-slate-700">
                        {u.Division === 'ALL'
                          ? (isTa ? 'அனைத்து பிரிவுகளும்' : 'All Divisions (Master)')
                          : u.Division}
                      </td>
                      <td className="px-3.5 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Program Modal */}
      {showAddProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                {isTa ? 'புதிய உதவித் திட்டம் உருவாக்குதல்' : 'Create Assistance Program'}
              </h3>
              <button onClick={() => setShowAddProgram(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProgram} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isTa ? 'திட்டத்தின் பெயர்' : 'Program Name'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isTa ? 'உதா: வெள்ள நிவாரண உலருணவுத் திட்டம்' : 'e.g. Drought Relief Food Packs'}
                  value={programForm.Program_Name}
                  onChange={e => setProgramForm({ ...programForm, Program_Name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isTa ? 'திட்ட வகை' : 'Program Type'}
                </label>
                <select
                  value={programForm.Program_Type}
                  onChange={e => setProgramForm({ ...programForm, Program_Type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Livelihood">{isTa ? 'வாழ்வாதாரம் (Livelihood)' : 'Livelihood'}</option>
                  <option value="Housing">{isTa ? 'வீடமைப்பு (Housing)' : 'Housing'}</option>
                  <option value="Education">{isTa ? 'கல்வி (Education)' : 'Education'}</option>
                  <option value="Emergency Relief">{isTa ? 'அவசர நிவாரணம்' : 'Emergency Relief'}</option>
                  <option value="Health">{isTa ? 'சுகாதாரம் (Health)' : 'Health'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isTa ? 'விளக்கம்' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={programForm.Description}
                  onChange={e => setProgramForm({ ...programForm, Description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddProgram(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  {isTa ? 'திட்டத்தை சேமிக்க' : 'Save Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">
                {isTa ? 'புதிய உத்தியோகத்தர் கணக்கு உருவாக்கு' : 'Create Officer Account'}
              </h3>
              <button onClick={() => setShowAddUser(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.userId} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. gn017"
                    value={userForm.User_ID}
                    onChange={e => setUserForm({ ...userForm, User_ID: e.target.value.toLowerCase().trim() })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.password} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 chars"
                    value={userForm.Password}
                    onChange={e => setUserForm({ ...userForm, Password: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isTa ? 'உத்தியோகத்தர் முழுப் பெயர்' : 'Officer Full Name'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K. Vigneswaran"
                  value={userForm.Name}
                  onChange={e => setUserForm({ ...userForm, Name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isTa ? 'பதவி (Role)' : 'Role'}
                  </label>
                  <select
                    value={userForm.Role}
                    onChange={e => setUserForm({ ...userForm, Role: e.target.value as User['Role'] })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="GN_Officer">GN Officer</option>
                    <option value="Assistance_Officer">Assistance Officer</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Super_Admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.gnDivision}
                  </label>
                  <select
                    disabled={userForm.Role === 'Super_Admin' || userForm.Role === 'Assistance_Officer' || userForm.Role === 'Auditor' || userForm.Role === 'Receptionist'}
                    value={userForm.Division}
                    onChange={e => setUserForm({ ...userForm, Division: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
                  >
                    {divisions.map(d => (
                      <option key={d.GN_Code} value={d.Division_Name}>
                        {d.Division_Name} ({d.GN_Code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                >
                  {isTa ? 'கணக்கை உருவாக்கு' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
