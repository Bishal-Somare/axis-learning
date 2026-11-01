import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Batch, Subject, HomeworkAssignment, TestScore, Announcement } from '../../types';
import { 
  BookOpen, Plus, Calendar, Award, 
  Bell, CheckCircle2, FileText, User, 
  X, AlertCircle 
} from 'lucide-react';

export const LmsView: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [testScores, setTestScores] = useState<TestScore[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'homework', 'tests', 'announcements'
  const [activeTab, setActiveTab] = useState<'homework' | 'tests' | 'announcements'>('homework');

  // Modals
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // Homework Form
  const [newHw, setNewHw] = useState({
    batchId: '',
    subjectId: '',
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  });

  // Notice Form
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL' as any,
    isImportant: false
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bList, sList, hwList, tList, annList] = await Promise.all([
        api.getBatches(),
        api.getSubjects(),
        api.getAssignments(),
        api.getTestScores(),
        api.getAnnouncements()
      ]);
      setBatches(bList);
      setSubjects(sList);
      setAssignments(hwList);
      setTestScores(tList);
      setAnnouncements(annList);

      if (bList.length > 0 && !newHw.batchId) {
        setNewHw(prev => ({
          ...prev,
          batchId: bList[0].id,
          subjectId: bList[0].subjectIds[0] || (sList[0] ? sList[0].id : '')
        }));
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

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAssignment(newHw);
      setShowHomeworkModal(false);
      setNewHw(prev => ({ ...prev, title: '', description: '' }));
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment');
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAnnouncement(newNotice);
      setShowNoticeModal(false);
      setNewNotice({ title: '', content: '', targetAudience: 'ALL', isImportant: false });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Academic LMS & Student Progress
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Homework problem sets, model test marks entry, syllabus milestones, and class circulars
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'homework' && (
            <button
              onClick={() => setShowHomeworkModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Homework</span>
            </button>
          )}

          {activeTab === 'announcements' && (
            <button
              onClick={() => setShowNoticeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Circular / Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('homework')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'homework' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Homework Assignments
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'tests' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Model Test Marks
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'announcements' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Notices & Announcements
        </button>
      </div>

      {/* TAB: HOMEWORK */}
      {activeTab === 'homework' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.length === 0 ? (
            <div className="col-span-2 py-10 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
              No homework assignments recorded yet.
            </div>
          ) : (
            assignments.map((hw) => (
              <div key={hw.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{hw.title}</h3>
                      <div className="text-[11px] text-indigo-900 font-semibold">{hw.subjectName} · {hw.batchName}</div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Due: {hw.dueDate}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed my-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {hw.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Assigned by {hw.teacherName} ({hw.assignedDate})</span>
                  <span className="font-semibold text-slate-700">{hw.totalSubmissions} submissions reviewed</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: TESTS & MARKS */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          {testScores.map((test) => (
            <div key={test.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{test.testName}</h3>
                  <div className="text-[11px] text-slate-500">
                    Date: {test.date} · Full Marks: <span className="font-mono font-bold text-slate-800">{test.fullMarks}</span> · Pass Marks: <span className="font-mono font-bold text-slate-800">{test.passMarks}</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded self-start sm:self-auto">
                  Graded
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold">
                    <tr>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3 text-right">Marks (/{test.fullMarks})</th>
                      <th className="py-2 px-3 text-center">Grade Letter</th>
                      <th className="py-2 px-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {test.studentScores.map((sc, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{sc.studentName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                          {sc.marksObtained}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            sc.marksObtained >= test.passMarks ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {sc.gradeLetter}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">{sc.remarks || '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div 
              key={ann.id}
              className={`rounded-xl border p-5 shadow-xs ${
                ann.isImportant ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>{ann.title}</span>
                  {ann.isImportant && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      High Priority Notice
                    </span>
                  )}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {ann.publishedAt.split('T')[0]}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100/60 text-[11px] text-slate-500">
                Posted by <strong className="text-slate-800">{ann.authorName}</strong> ({ann.authorRole}) · Target: {ann.targetAudience}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Homework */}
      {showHomeworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Assign Class Homework</h2>
              <button onClick={() => setShowHomeworkModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateHomework} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Batch *</label>
                  <select
                    value={newHw.batchId}
                    onChange={(e) => setNewHw({ ...newHw, batchId: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200"
                  >
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Subject *</label>
                  <select
                    value={newHw.subjectId}
                    onChange={(e) => setNewHw({ ...newHw, subjectId: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={newHw.title}
                  onChange={(e) => setNewHw({ ...newHw, title: e.target.value })}
                  placeholder="e.g. Vector Geometry Proofs Exercise 8.1"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Instructions & Problem Numbers *</label>
                <textarea
                  required
                  rows={3}
                  value={newHw.description}
                  onChange={(e) => setNewHw({ ...newHw, description: e.target.value })}
                  placeholder="Solve questions 1 through 9. Prove theorem 4 using coordinate geometry..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newHw.dueDate}
                  onChange={(e) => setNewHw({ ...newHw, dueDate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowHomeworkModal(false)} className="px-3.5 py-1.5 rounded-lg border text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Notice */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Post Announcement / Notice</h2>
              <button onClick={() => setShowNoticeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  placeholder="e.g. SEE Model Exam Routine Released"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Content / Circular Details *</label>
                <textarea
                  required
                  rows={4}
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  placeholder="Details for students or faculty..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="not-imp"
                  checked={newNotice.isImportant}
                  onChange={(e) => setNewNotice({ ...newNotice, isImportant: e.target.checked })}
                />
                <label htmlFor="not-imp" className="text-slate-700 font-medium">Mark as High Priority / Urgent</label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowNoticeModal(false)} className="px-3.5 py-1.5 rounded-lg border text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-900 text-white font-semibold">Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
