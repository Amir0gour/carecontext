import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Droplets,
  Edit2,
  Heart,
  Pill,
  Plus,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import type { ScheduleItem } from '../types/careContext.ts';

interface DailyScheduleCardProps {
  schedule: ScheduleItem[];
  onToggleScheduleItem: (itemId: string, completed: boolean) => void;
  onSaveScheduleItem: (item: Partial<ScheduleItem>) => void;
  onDeleteScheduleItem: (itemId: string) => void;
}

export const DailyScheduleCard: React.FC<DailyScheduleCardProps> = ({
  schedule,
  onToggleScheduleItem,
  onSaveScheduleItem,
  onDeleteScheduleItem,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Form states
  const [time, setTime] = useState('12:00 PM');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'medication' | 'hydration' | 'appointment' | 'activity'>('medication');
  const [details, setDetails] = useState('');
  const [isCritical, setIsCritical] = useState(false);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'medication':
        return <Pill className="w-4 h-4 text-rose-400" />;
      case 'hydration':
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 'appointment':
        return <UserCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <Heart className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handleOpenNew = () => {
    setEditingItem(null);
    setTime('12:00 PM');
    setTitle('');
    setCategory('medication');
    setDetails('');
    setIsCritical(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setTime(item.time);
    setTitle(item.title);
    setCategory(item.category);
    setDetails(item.details);
    setIsCritical(item.isCritical);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveScheduleItem({
      id: editingItem ? editingItem.id : undefined,
      time: time.trim() || '12:00 PM',
      title: title.trim(),
      category,
      details: details.trim(),
      isCritical,
    });

    setIsFormOpen(false);
    setEditingItem(null);
  };

  const pendingCount = schedule.filter((s) => !s.isCompleted).length;

  return (
    <div className="flex flex-col h-full bg-stone-900 rounded-2xl border border-stone-800 shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-stone-800">
        <div>
          <h2 className="font-bold text-stone-100 text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Daily Schedule & Medication Regimen</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Cross-referenced by CareContext via MCP tool <code className="text-cyan-300 font-mono">get_daily_schedule</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-stone-800 border border-stone-700 px-3 py-1.5 rounded-xl text-stone-300">
            {pendingCount === 0 ? (
              <span className="text-emerald-400 font-semibold">All Done Today!</span>
            ) : (
              <span>
                <strong className="text-amber-300">{pendingCount}</strong> Tasks Pending
              </span>
            )}
          </span>

          <button
            onClick={handleOpenNew}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task / Med</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Add/Edit Schedule Modal / Panel */}
        {isFormOpen && (
          <div className="bg-stone-950 border border-amber-500/40 rounded-2xl p-5 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-2">
              <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>{editingItem ? 'Edit Scheduled Item' : 'Add New Task or Medication'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-stone-400 hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Time *</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 12:00 PM, 06:30 PM"
                    required
                    className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="medication">Medication</option>
                    <option value="hydration">Hydration</option>
                    <option value="appointment">Appointment</option>
                    <option value="activity">Activity</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-200">
                    <input
                      type="checkbox"
                      checked={isCritical}
                      onChange={(e) => setIsCritical(e.target.checked)}
                      className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500"
                    />
                    <span>Mark as Critical</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Metformin 500mg, Afternoon Tea, Dentist Visit"
                  required
                  className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3.5 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Instructions / Details</label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. Take with lunch and 1 glass of water"
                  className="w-full bg-stone-800/90 border border-stone-700 rounded-xl px-3.5 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule Items List */}
        <div className="space-y-3">
          {schedule.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleScheduleItem(item.id, !item.isCompleted)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 group ${
                item.isCompleted
                  ? 'bg-stone-950/40 border-stone-800 opacity-75'
                  : item.isCritical
                  ? 'bg-rose-950/20 border-rose-700/50 hover:border-rose-500/80'
                  : 'bg-stone-800/80 border-stone-700/80 hover:border-stone-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-0.5 text-stone-400 hover:text-stone-200 transition-colors"
                >
                  {item.isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-500" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1 rounded bg-stone-900 border border-stone-800">
                      {getCategoryIcon(item.category)}
                    </span>
                    <span
                      className={`font-semibold text-sm ${
                        item.isCompleted ? 'line-through text-stone-400' : 'text-stone-100'
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.isCritical && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800/60 px-1.5 py-0.5 rounded">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">{item.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-mono text-stone-400">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span>{item.time}</span>
                  </div>
                  {item.isCompleted && item.completedAt && (
                    <span className="text-[10px] font-mono text-emerald-400 block mt-1">
                      Done at {item.completedAt}
                    </span>
                  )}
                </div>

                {/* Edit & Delete Controls */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(item, e)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
                    title="Edit Task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScheduleItem(item.id);
                    }}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Insight Box */}
        <div className="bg-stone-950/60 border border-stone-800/80 rounded-xl p-4 text-xs text-stone-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-stone-200 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Schedule & Voice Integration</span>
          </div>
          <p>
            You can add medications, appointments, or walks right here, or speak directly to CareContext (e.g. <em>&quot;Add a reminder for Metformin at 12:00 PM&quot;</em>). Any changes are instantly cross-referenced via MCP tool <code className="text-cyan-300 font-mono">get_daily_schedule</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
