import React, { useState } from 'react';
import { Family, FamilyMember, User } from '../types';
import { StorageService } from '../services/storageService';
import { Language } from '../utils/translations';
import { UserPlus, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface AddMemberModalProps {
  family: Family;
  currentUser: User;
  currentLang?: Language;
  onClose: () => void;
  onMemberAdded: (member: FamilyMember) => void;
  onRequestTransfer?: (oldNIC: string, qrNumber: string) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  family,
  currentUser,
  currentLang = 'en',
  onClose,
  onMemberAdded,
  onRequestTransfer
}) => {
  const [formData, setFormData] = useState({
    NIC_Elder_ID: '',
    Name: '',
    Relationship: 'Spouse',
    DOB: '',
    Gender: 'Female' as FamilyMember['Gender'],
    Occupation: '',
    Monthly_Income: '',
    Education: 'G.C.E. O/L',
    Disability: 'No' as 'Yes' | 'No',
    Elderly: 'No' as 'Yes' | 'No'
  });

  const [error, setError] = useState<string | null>(null);
  const [conflictMember, setConflictMember] = useState<FamilyMember | null>(null);

  const handleNICChange = (val: string) => {
    setFormData(prev => ({ ...prev, NIC_Elder_ID: val }));
    setError(null);
    setConflictMember(null);

    if (val.trim().length >= 5) {
      const allMembers = StorageService.getMembers();
      const existing = allMembers.find(
        m => m.NIC_Elder_ID.toLowerCase().trim() === val.toLowerCase().trim()
      );
      if (existing) {
        if (existing.QR_Number.toUpperCase() === family.QR_Number.toUpperCase()) {
          setError(`This NIC / Elder ID is already registered in this family for: ${existing.Name}`);
        } else {
          setConflictMember(existing);
          setError(
            `This NIC / Elder ID is already linked to another QR (${existing.QR_Number} - ${existing.Name}). Super Admin approval is required to transfer it.`
          );
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const created = StorageService.addFamilyMember(currentUser, {
        QR_Number: family.QR_Number,
        NIC_Elder_ID: formData.NIC_Elder_ID,
        Name: formData.Name,
        Relationship: formData.Relationship,
        DOB: formData.DOB,
        Gender: formData.Gender,
        Occupation: formData.Occupation,
        Monthly_Income: Number(formData.Monthly_Income) || 0,
        Education: formData.Education,
        Disability: formData.Disability,
        Elderly: formData.Elderly
      });
      onMemberAdded(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add member.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">Add Family Member</h3>
              <p className="text-xs text-slate-500 font-mono">Family QR: {family.QR_Number} • {family.Family_Name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-medium">{error}</p>
                {conflictMember && onRequestTransfer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestTransfer(formData.NIC_Elder_ID, family.QR_Number);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-900 underline hover:text-rose-700 cursor-pointer"
                  >
                    <span>Submit QR / NIC Transfer Request to Super Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              National Identity Card (NIC) / Elder Token ID <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 198512304567 or 851234567V or ELD-012"
              value={formData.NIC_Elder_ID}
              onChange={e => handleNICChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Cross-checked across all 16 GN Divisions for duplicate prevention.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Member Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sivaguru Thavamalar"
                value={formData.Name}
                onChange={e => setFormData({ ...formData, Name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Relationship to Head <span className="text-rose-600">*</span>
              </label>
              <select
                value={formData.Relationship}
                onChange={e => setFormData({ ...formData, Relationship: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="Head of Family">Head of Family</option>
                <option value="Spouse">Spouse</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Other Relative">Other Relative</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.DOB}
                onChange={e => setFormData({ ...formData, DOB: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.Gender}
                onChange={e => setFormData({ ...formData, Gender: e.target.value as FamilyMember['Gender'] })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Occupation</label>
              <input
                type="text"
                placeholder="e.g. Fisherman, Student, None"
                value={formData.Occupation}
                onChange={e => setFormData({ ...formData, Occupation: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Income (LKR)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.Monthly_Income}
                onChange={e => setFormData({ ...formData, Monthly_Income: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level</label>
            <input
              type="text"
              placeholder="e.g. Primary, Grade 9, G.C.E. O/L, G.C.E. A/L, Higher"
              value={formData.Education}
              onChange={e => setFormData({ ...formData, Education: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Disability Status</label>
              <select
                value={formData.Disability}
                onChange={e => setFormData({ ...formData, Disability: e.target.value as 'Yes' | 'No' })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="No">No Disability</option>
                <option value="Yes">Person with Disability</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Elderly Category</label>
              <select
                value={formData.Elderly}
                onChange={e => setFormData({ ...formData, Elderly: e.target.value as 'Yes' | 'No' })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="No">Under 60 years</option>
                <option value="Yes">Elderly (60+ years)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            >
              Register Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
