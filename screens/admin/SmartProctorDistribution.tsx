import React, { useMemo, useState } from 'react';
import {
  CalendarPlus,
  Check,
  FileDown,
  Printer,
  RefreshCcw,
  Repeat,
  Search,
  Shuffle,
  Sparkles,
  Trash2,
  UserMinus,
  Users,
  Wand2,
} from 'lucide-react';
import { Student, Supervision, User } from '../../types';

export interface SmartExamSlot {
  id: string;
  date: string;
  subject: string;
  period: number;
}

export interface SmartDistributionItem {
  id: string;
  slotId: string;
  date: string;
  subject: string;
  period: number;
  committeeNumber: string;
  teacherId: string;
  teacherName: string;
  assignedCount: number;
  previousCount: number;
  forcedRepeat: boolean;
}

interface Props {
  users: User[];
  students: Student[];
  supervisions: Supervision[];
  activeDate?: string;
  onCommit: (items: SmartDistributionItem[], replaceExisting: boolean) => Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);

const SmartProctorDistribution: React.FC<Props> = ({
  users,
  students,
  supervisions,
  activeDate,
  onCommit,
}) => {
  const committees = useMemo(
    () => Array.from(new Set(students.map(s => s.committee_number).filter(Boolean))).sort((a, b) => Number(a) - Number(b)),
    [students],
  );
  const proctors = useMemo(() => users.filter(u => u.role === 'PROCTOR'), [users]);

  const [slots, setSlots] = useState<SmartExamSlot[]>([
    { id: crypto.randomUUID(), date: activeDate || today(), subject: 'اختبار', period: 1 },
  ]);
  const [selectedExclusionDate, setSelectedExclusionDate] = useState(activeDate || today());
  const [exclusionSearch, setExclusionSearch] = useState('');
  const [excludedByDate, setExcludedByDate] = useState<Record<string, string[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem('smart_proctor_exclusions_by_date') || '{}');
    } catch {
      return {};
    }
  });
  const [preview, setPreview] = useState<SmartDistributionItem[]>([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);

  const assignedCounts = useMemo(() => {
    return supervisions.reduce<Record<string, number>>((acc, item) => {
      acc[item.teacher_id] = (acc[item.teacher_id] || 0) + 1;
      return acc;
    }, {});
  }, [supervisions]);
  const previousCounts = useMemo(() => {
    return supervisions.reduce<Record<string, number>>((acc, item) => {
      const d = new Date(item.date);
      const started = item.date && !Number.isNaN(d.getTime()) && !(d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0);
      if (started) acc[item.teacher_id] = (acc[item.teacher_id] || 0) + 1;
      return acc;
    }, {});
  }, [supervisions]);

  const slotDates = useMemo(
    () => Array.from(new Set(slots.map(slot => slot.date || today()))).sort(),
    [slots],
  );
  const excludedIdsForSelectedDate = excludedByDate[selectedExclusionDate] || [];
  const sortedProctors = useMemo(
    () => [...proctors].sort((a, b) => a.full_name.localeCompare(b.full_name, 'ar')),
    [proctors],
  );
  const filteredProctors = useMemo(() => {
    const q = exclusionSearch.trim().toLowerCase();
    if (!q) return sortedProctors;
    return sortedProctors.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      String(p.national_id || '').includes(q),
    );
  }, [sortedProctors, exclusionSearch]);
  const getEligibleProctors = (date: string) => {
    const excluded = excludedByDate[date] || [];
    return proctors.filter(p => !excluded.includes(p.id));
  };
  const eligibleProctors = getEligibleProctors(selectedExclusionDate);
  const toggleExcluded = (date: string, userId: string) => {
    setExcludedByDate(prev => {
      const current = prev[date] || [];
      const nextIds = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId];
      const next = { ...prev, [date]: nextIds };
      localStorage.setItem('smart_proctor_exclusions_by_date', JSON.stringify(next));
      return next;
    });
  };

  const addSlot = () => {
    setSlots(prev => [...prev, { id: crypto.randomUUID(), date: activeDate || today(), subject: 'اختبار', period: 1 }]);
  };

  const updateSlot = (id: string, patch: Partial<SmartExamSlot>) => {
    if (patch.date) setSelectedExclusionDate(patch.date);
    setSlots(prev => prev.map(slot => slot.id === id ? { ...slot, ...patch } : slot));
  };

  const removeSlot = (id: string) => {
    setSlots(prev => prev.filter(slot => slot.id !== id));
    setPreview(prev => prev.filter(item => item.slotId !== id));
  };

  const generateDistribution = () => {
    if (!committees.length || !slots.length) {
      setPreview([]);
      return;
    }

    const runningCounts = { ...assignedCounts };
    const draft: SmartDistributionItem[] = [];

    slots.forEach(slot => {
      const usedThisDay = new Set<string>();
      const eligibleProctors = getEligibleProctors(slot.date);
      if (!eligibleProctors.length) return;
      committees.forEach(committeeNumber => {
        const pool = eligibleProctors
          .map(p => ({
            user: p,
            count: runningCounts[p.id] || 0,
            usedToday: usedThisDay.has(p.id),
          }))
          .sort((a, b) => {
            if (a.usedToday !== b.usedToday) return a.usedToday ? 1 : -1;
            if (a.count !== b.count) return a.count - b.count;
            return a.user.full_name.localeCompare(b.user.full_name, 'ar');
          });

        const selected = pool[0];
        if (!selected) return;

        const forcedRepeat = selected.usedToday;
        draft.push({
          id: crypto.randomUUID(),
          slotId: slot.id,
          date: slot.date,
          subject: slot.subject || 'اختبار',
          period: Number(slot.period) || 1,
          committeeNumber,
          teacherId: selected.user.id,
          teacherName: selected.user.full_name,
          assignedCount: assignedCounts[selected.user.id] || 0,
          previousCount: previousCounts[selected.user.id] || 0,
          forcedRepeat,
        });
        usedThisDay.add(selected.user.id);
        runningCounts[selected.user.id] = (runningCounts[selected.user.id] || 0) + 1;
      });
    });

    setPreview(draft);
  };

  const swapItems = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setPreview(prev => {
      const source = prev.find(item => item.id === sourceId);
      const target = prev.find(item => item.id === targetId);
      if (!source || !target) return prev;
      return prev.map(item => {
        if (item.id === sourceId) {
          return { ...item, teacherId: target.teacherId, teacherName: target.teacherName, assignedCount: target.assignedCount, previousCount: target.previousCount, forcedRepeat: target.forcedRepeat };
        }
        if (item.id === targetId) {
          return { ...item, teacherId: source.teacherId, teacherName: source.teacherName, assignedCount: source.assignedCount, previousCount: source.previousCount, forcedRepeat: source.forcedRepeat };
        }
        return item;
      });
    });
  };

  const replaceOne = (item: SmartDistributionItem) => {
    const usedInSlot = new Set(preview.filter(p => p.slotId === item.slotId && p.id !== item.id).map(p => p.teacherId));
    const candidate = getEligibleProctors(item.date)
      .filter(p => p.id !== item.teacherId)
      .map(p => ({ user: p, count: assignedCounts[p.id] || 0, previous: previousCounts[p.id] || 0, used: usedInSlot.has(p.id) }))
      .sort((a, b) => {
        if (a.used !== b.used) return a.used ? 1 : -1;
        if (a.count !== b.count) return a.count - b.count;
        return a.user.full_name.localeCompare(b.user.full_name, 'ar');
      })[0];

    if (!candidate) return;
    setPreview(prev => prev.map(p => p.id === item.id ? {
      ...p,
      teacherId: candidate.user.id,
      teacherName: candidate.user.full_name,
      assignedCount: candidate.count,
      previousCount: candidate.previous,
      forcedRepeat: candidate.used,
    } : p));
  };

  const printReport = () => {
    window.print();
  };

  const commitPreview = async () => {
    if (!preview.length) return;
    setIsCommitting(true);
    try {
      await onCommit(preview, replaceExisting);
    } finally {
      setIsCommitting(false);
    }
  };

  const forcedRepeatCount = preview.filter(item => item.forcedRepeat).length;

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Wand2 size={28} /></div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">التوزيع الذكي للمراقبين</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">توزيع عادل حسب عدد الإسنادات الحالية، مع إظهار المباشرات الفعلية فقط عند اعتماد اللجنة.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={addSlot} className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-xs flex items-center gap-2 hover:bg-slate-200">
              <CalendarPlus size={18} /> إضافة يوم
            </button>
            <button onClick={generateDistribution} className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black text-xs flex items-center gap-2 shadow-lg hover:bg-blue-700">
              <Sparkles size={18} /> توليد
            </button>
            <button onClick={commitPreview} disabled={!preview.length || isCommitting} className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs flex items-center gap-2 shadow-lg hover:bg-emerald-700 disabled:opacity-40">
              {isCommitting ? <RefreshCcw size={18} className="animate-spin" /> : <Check size={18} />} ربط باللجان
            </button>
            <button onClick={printReport} disabled={!preview.length} className="px-6 py-3 rounded-2xl bg-slate-950 text-white font-black text-xs flex items-center gap-2 shadow-lg disabled:opacity-40">
              <Printer size={18} /> طباعة
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-6">
          <div className="space-y-3">
            {slots.map(slot => (
              <div key={slot.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_48px] gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <input type="date" value={slot.date} onChange={e => updateSlot(slot.id, { date: e.target.value })} className="p-3 rounded-xl bg-white border border-slate-100 font-black text-sm" />
                <input value={slot.subject} onChange={e => updateSlot(slot.id, { subject: e.target.value })} placeholder="المادة" className="p-3 rounded-xl bg-white border border-slate-100 font-black text-sm" />
                <input type="number" min={1} value={slot.period} onChange={e => updateSlot(slot.id, { period: Number(e.target.value) || 1 })} className="p-3 rounded-xl bg-white border border-slate-100 font-black text-sm" />
                <button onClick={() => removeSlot(slot.id)} className="h-12 rounded-xl bg-white text-red-500 border border-red-100 flex items-center justify-center"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 text-white">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h4 className="font-black flex items-center gap-2"><UserMinus size={18} /> المستبعدون حسب تاريخ الاختبار</h4>
              <span className="text-[10px] font-black text-slate-400">{excludedIdsForSelectedDate.length} / {proctors.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-2 mb-3">
              <select
                value={selectedExclusionDate}
                onChange={e => setSelectedExclusionDate(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/10 text-xs font-black outline-none"
              >
                {slotDates.map(date => <option key={date} value={date} className="text-slate-900">{date}</option>)}
              </select>
              <div className="relative">
                <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={exclusionSearch}
                  onChange={e => setExclusionSearch(e.target.value)}
                  placeholder="بحث سريع بالاسم أو الهوية"
                  className="w-full pr-9 pl-3 py-3 rounded-xl bg-white/10 border border-white/10 text-xs font-black outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2">
              {filteredProctors.map(p => {
                const excluded = excludedIdsForSelectedDate.includes(p.id);
                return (
                  <button key={p.id} onClick={() => toggleExcluded(selectedExclusionDate, p.id)} className={`w-full p-3 rounded-xl text-right text-xs font-black border transition-all ${excluded ? 'bg-red-500/15 border-red-400/30 text-red-100' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
                    <span className="block">{p.full_name}</span>
                    <span className="block text-[9px] mt-1 opacity-60">{p.national_id}</span>
                  </button>
                );
              })}
              {!filteredProctors.length && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-black text-slate-400">
                  لا توجد نتائج مطابقة
                </div>
              )}
            </div>
          </div>
        </div>

        <label className="mt-6 flex items-center gap-3 text-sm font-black text-slate-600 cursor-pointer">
          <input type="checkbox" checked={replaceExisting} onChange={e => setReplaceExisting(e.target.checked)} className="w-5 h-5 accent-blue-600" />
          إعادة توزيع اللجان المرتبطة لنفس التاريخ والفترة عند الاعتماد
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400">اللجان</p><p className="text-3xl font-black">{committees.length}</p></div>
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400">المراقبون المتاحون</p><p className="text-3xl font-black">{eligibleProctors.length}</p></div>
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400">بنود المعاينة</p><p className="text-3xl font-black">{preview.length}</p></div>
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400">تكرار اضطراري</p><p className="text-3xl font-black text-amber-600">{forcedRepeatCount}</p></div>
      </div>

      <div className="print:block">
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-black">تقرير التوزيع الرسمي للمراقبين</h1>
          <p className="font-bold">اعتماد توزيع اللجان والفترات</p>
        </div>
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:rounded-none print:border-black">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 no-print">
            <h3 className="text-xl font-black flex items-center gap-2"><Users size={22} /> معاينة التوزيع</h3>
            <p className="text-xs font-bold text-slate-400">اسحب بطاقة مراقب على بطاقة أخرى لتبديلهما.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 print:text-black">
                  <th className="p-4 border-b">التاريخ</th>
                  <th className="p-4 border-b">المادة</th>
                  <th className="p-4 border-b">الفترة</th>
                  <th className="p-4 border-b">اللجنة</th>
                  <th className="p-4 border-b">اسم المراقب</th>
                  <th className="p-4 border-b">مسند له وقت التوزيع</th>
                  <th className="p-4 border-b">مباشرات سابقة</th>
                  <th className="p-4 border-b">ملاحظة</th>
                  <th className="p-4 border-b print:hidden">إجراء</th>
                  <th className="p-4 border-b hidden print:table-cell">توقيع المراقب</th>
                </tr>
              </thead>
              <tbody>
                {preview.length ? preview.map(item => (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedId(item.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      if (draggedId) swapItems(draggedId, item.id);
                      setDraggedId(null);
                    }}
                    className="border-b border-slate-100 hover:bg-blue-50/40 print:hover:bg-white"
                  >
                    <td className="p-4 font-bold">{item.date}</td>
                    <td className="p-4 font-bold">{item.subject}</td>
                    <td className="p-4 font-bold tabular-nums">{item.period}</td>
                    <td className="p-4 font-black tabular-nums">{item.committeeNumber}</td>
                    <td className="p-4 font-black">{item.teacherName}</td>
                    <td className="p-4 font-black tabular-nums">{item.assignedCount}</td>
                    <td className="p-4 font-black tabular-nums">{item.previousCount}</td>
                    <td className="p-4">
                      {item.forcedRepeat ? <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black"><Repeat size={12} className="inline ml-1" /> تكرار اضطراري</span> : <span className="text-emerald-600 text-[10px] font-black">توزيع عادل</span>}
                    </td>
                    <td className="p-4 print:hidden">
                      <button onClick={() => replaceOne(item)} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black flex items-center gap-2">
                        <Shuffle size={14} /> استبدال
                      </button>
                    </td>
                    <td className="p-4 hidden print:table-cell h-12"></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400 font-black">لم يتم توليد توزيع بعد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {preview.length > 0 && (
            <div className="hidden print:grid grid-cols-2 gap-10 mt-10 p-8">
              <div className="border-t border-black pt-3 font-black">توقيع مسؤول الكنترول</div>
              <div className="border-t border-black pt-3 font-black">اعتماد قائد المدرسة</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartProctorDistribution;
