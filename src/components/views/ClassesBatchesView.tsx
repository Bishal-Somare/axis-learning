import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Batch, Subject, GradeLevel, User } from '../../types';
import { 
  Calendar, Clock, Users, BookOpen, 
  Plus, AlertTriangle, CheckCircle, MapPin, 
  X, Layers 
} from 'lucide-react';

export const ClassesBatchesView: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newBatch, setNewBatch] = useState({
    name: '',
    grade: 'Class 10' as GradeLevel,
    stream: 'General',
    academicYear: '2081/2082 BS (2026)',
    primaryTeacherId: '',
    subjectIds: [] as string[],
    scheduleDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startTime: '06:30',
    endTime: '08:00',
    room: 'Room 101',
    maxCapacity: 35
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bList, sList, tList] = await Promise.all([
        api.getBatches(),
        api.getSubjects(),
        api.getTeachers()
      ]);
      setBatches(bList);
      setSubjects(sList);
      setTeachers(tList);
      if (tList.length > 0 && !newBatch.primaryTeacherId) {
        setNewBatch(prev => ({ ...prev, primaryTeacherId: tList[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);
      await api.createBatch(newBatch);
      setShowAddBatchModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Classes, Subjects & Batches
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Morning and evening tuition shifts · Automated teacher conflict detection across timetables
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowAddBatchModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Batch</span>
          </button>
        )}
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {batches.map((batch) => {
          const teacher = teachers.find(t => t.id === batch.primaryTeacherId);
          const batchSubjects = subjects.filter(s => batch.subjectIds.includes(s.id));

          return (
            <div 
              key={batch.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{batch.name}</h3>
                  <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                    {batch.grade}
                  </span>
                </div>

                <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] font-medium text-slate-800 tabular-nums">
                      {batch.startTime} – {batch.endTime}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[11px] text-slate-500">{batch.scheduleDays.join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Head Faculty: <strong className="text-slate-800">{teacher ? teacher.name : 'Unassigned'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Location: {batch.room} (Max: {batch.maxCapacity} students)</span>
                  </div>
                </div>

                {/* Subjects */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Included Curriculum
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {batchSubjects.map((sub) => (
                      <span key={sub.id} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{batch.academicYear}</span>
                <span className="text-emerald-700 font-semibold font-sans">Active Shift</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create New Batch with Conflict Detection */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Create Tuition Batch</h2>
              <button 
                onClick={() => { setShowAddBatchModal(false); setFormError(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Batch Title *</label>
                <input
                  type="text"
                  required
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  placeholder="e.g. Class 10 SEE Target - Evening Gamma"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Grade Level *</label>
                  <select
                    value={newBatch.grade}
                    onChange={(e) => setNewBatch({ ...newBatch, grade: e.target.value as GradeLevel })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                  >
                    <option value="Class 10">Class 10 (SEE)</option>
                    <option value="+2 Science">+2 Science</option>
                    <option value="+2 Management">+2 Management</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8 (BLE)</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 6">Class 6</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Primary Teacher (Conflict Monitored) *</label>
                  <select
                    value={newBatch.primaryTeacherId}
                    onChange={(e) => setNewBatch({ ...newBatch, primaryTeacherId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Start Time (24h) *</label>
                  <input
                    type="time"
                    required
                    value={newBatch.startTime}
                    onChange={(e) => setNewBatch({ ...newBatch, startTime: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">End Time (24h) *</label>
                  <input
                    type="time"
                    required
                    value={newBatch.endTime}
                    onChange={(e) => setNewBatch({ ...newBatch, endTime: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Classroom / Lab</label>
                <input
                  type="text"
                  value={newBatch.room}
                  onChange={(e) => setNewBatch({ ...newBatch, room: e.target.value })}
                  placeholder="e.g. Room 102 (Main Building)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 shadow-xs"
                >
                  {submitting ? 'Checking Conflicts...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
