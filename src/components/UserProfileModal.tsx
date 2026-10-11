import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  MapPin,
  Heart,
  Clock,
  ShieldCheck,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import type { HomeState } from '../types/careContext.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeState: HomeState;
  onSaveProfile: (updated: {
    userName: string;
    userAge: number;
    homeAddress: string;
    caregiverName?: string;
    caregiverPhone?: string;
    caregiverRelationship?: string;
    useLiveTime?: boolean;
    currentTime?: string;
  }) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  homeState,
  onSaveProfile,
}) => {
  const [name, setName] = useState(homeState.userName || 'Eleanor');
  const [age, setAge] = useState(homeState.userAge || 81);
  const [address, setAddress] = useState(homeState.homeAddress || '742 Evergreen Terrace, Portland, OR');
  const [caregiverName, setCaregiverName] = useState(homeState.caregiverName || 'Sarah Miller');
  const [caregiverPhone, setCaregiverPhone] = useState(homeState.caregiverPhone || '+1 (555) 234-8901');
  const [relationship, setRelationship] = useState(homeState.caregiverRelationship || 'Daughter / Primary Caregiver');
  const [useLiveTime, setUseLiveTime] = useState(homeState.useLiveTime ?? true);
  const [customTime, setCustomTime] = useState(homeState.currentTime || '07:18 AM');

  useEffect(() => {
    if (isOpen) {
      setName(homeState.userName || 'Eleanor');
      setAge(homeState.userAge || 81);
      setAddress(homeState.homeAddress || '742 Evergreen Terrace, Portland, OR');
      setCaregiverName(homeState.caregiverName || 'Sarah Miller');
      setCaregiverPhone(homeState.caregiverPhone || '+1 (555) 234-8901');
      setRelationship(homeState.caregiverRelationship || 'Daughter / Primary Caregiver');
      setUseLiveTime(homeState.useLiveTime ?? true);
      setCustomTime(homeState.currentTime || '07:18 AM');
    }
  }, [isOpen, homeState]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      userName: name.trim() || 'Eleanor',
      userAge: Number(age) || 81,
      homeAddress: address.trim(),
      caregiverName: caregiverName.trim() || 'Sarah Miller',
      caregiverPhone: caregiverPhone.trim() || '+1 (555) 234-8901',
      caregiverRelationship: relationship.trim() || 'Primary Caregiver',
      useLiveTime,
      currentTime: useLiveTime
        ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : customTime.trim() || '07:18 AM',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-stone-100 text-base">Resident & Companion Settings</h2>
              <p className="text-xs text-stone-400">Customize resident name, caregiver contact & clock</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Section: Resident Profile */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Resident Profile</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Resident Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor, Margaret, Arthur"
                  required
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Age *
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  min={50}
                  max={120}
                  required
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Home Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, City, State"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section: Primary Caregiver Dispatch */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              <span>Primary Caregiver (Emergency Dispatch)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Caregiver Name
                </label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  placeholder="e.g. Sarah Miller"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Emergency Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={caregiverPhone}
                    onChange={(e) => setCaregiverPhone(e.target.value)}
                    placeholder="+1 (555) 234-8901"
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g. Daughter / Primary Caregiver, Son, Neighbor"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {/* Section: Real-Time vs Simulated Clock */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Real-Time & Date Configuration</span>
            </h3>

            <div className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useLiveTime}
                  onChange={(e) => setUseLiveTime(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="text-xs font-semibold text-stone-100 block">
                    Use Live System Clock & Date (Real-Time)
                  </span>
                  <span className="text-[11px] text-stone-400 block mt-0.5">
                    CareContext will automatically reflect the actual real-world time ({new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}) and date when answering questions.
                  </span>
                </div>
              </label>

              {!useLiveTime && (
                <div className="pt-2 border-t border-stone-800/80">
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Simulated Time (e.g. Morning Routine)
                  </label>
                  <input
                    type="text"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="07:18 AM"
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-1.5 text-stone-100 text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Update CareContext</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
