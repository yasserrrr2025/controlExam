
import React, { useState, useMemo } from 'react';
import { Supervision, User, Student, DeliveryLog, SystemConfig, CommitteeReport } from '../../types';
import {
  Printer, FileSpreadsheet, Search, History, CheckCircle2,
  Clock, Users, AlertTriangle, X, ChevronDown, Download,
  ClipboardList, UserCheck, Package
} from 'lucide-react';

interface Props {
  supervisions?: Supervision[];
  users?: User[];
  students?: Student[];
  deliveryLogs?: DeliveryLog[];
  systemConfig: SystemConfig;
  committeeReports?: CommitteeReport[];
}

/* ── تصدير CSV ── */
function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const BOM = '\uFEFF';
  const csv = BOM + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ── مساعد قراءة الوقت بأمان ── */
function safeTime(isoStr?: string) {
  if (!isoStr) return '---';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  } catch { return '---'; }
}

/* ── مطابقة التاريخ بمرونة ── */
function matchesDate(isoStr: string | undefined | null, date: string): boolean {
  if (!isoStr || !date) return false;
  // نحول كليهما لصيغة YYYY-MM-DD ثم نقارن
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr.startsWith(date);
    return d.toISOString().startsWith(date);
  } catch { return String(isoStr).startsWith(date); }
}

const AdminDailyReports: React.FC<Props> = ({
  supervisions = [],
  users = [],
  students = [],
  deliveryLogs = [],
  systemConfig,
  committeeReports = []
}) => {
  const [reportDate, setReportDate] = useState(systemConfig.active_exam_date || new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'SUMMARY' | 'DETAILED'>('SUMMARY');

  /* ─────────────────────────────────────────────────
     بناء بيانات التقرير مع مطابقة مرنة للتاريخ
  ───────────────────────────────────────────────── */
  const reportData = useMemo(() => {
    if (!students.length) return [];

    const committees = Array.from(new Set(students.map(s => s?.committee_number)))
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b)) as string[];

    return committees.map(num => {
      // المراقب المسند لهذه اللجنة في هذا اليوم
      const sv = supervisions.find(s =>
        String(s?.committee_number) === String(num) &&
        matchesDate(s?.date, reportDate)
      );
      const proctor = users.find(u => u?.id === sv?.teacher_id);

      // سجل الإغلاق (المراقب أنهى)
      const closeLog = deliveryLogs.find(l =>
        String(l?.committee_number) === String(num) &&
        matchesDate(l?.time, reportDate) &&
        l?.type === 'RECEIVE'
      );

      // سجل الاستلام (الكنترول استلم)
      const receiptLog = deliveryLogs.find(l =>
        String(l?.committee_number) === String(num) &&
        matchesDate(l?.time, reportDate) &&
        l?.status === 'CONFIRMED'
      );

      // إحصائيات اللجنة
      const committeeStudents = students.filter(s => String(s.committee_number) === String(num));
      const detailedReport = committeeReports.find(r =>
        String(r?.committee_number) === String(num) && r?.date === reportDate
      );

      // حساب إحصائيات الغياب من سجلات deliveryLogs للصفوف
      const gradeSet = Array.from(new Set(committeeStudents.map(s => s.grade)));

      return {
        committee: String(num),
        proctorName: proctor?.full_name || '—',
        joinTime: safeTime(sv?.date),
        closeTime: safeTime(closeLog?.time),
        receiptTime: safeTime(receiptLog?.time),
        receiverName: receiptLog?.teacher_name || '—',
        status: receiptLog ? 'CONFIRMED' : closeLog ? 'CLOSED' : sv ? 'ACTIVE' : 'NOT_STARTED',
        totalStudents: committeeStudents.length,
        grades: gradeSet.length,
        observations: detailedReport?.observations || '',
        resolutions: detailedReport?.resolutions || '',
      };
    }).filter(row => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return row.committee.includes(s) || row.proctorName.toLowerCase().includes(s);
    });
  }, [students, supervisions, users, deliveryLogs, reportDate, searchTerm, committeeReports]);

  /* إحصائيات سريعة */
  const stats = useMemo(() => ({
    total: reportData.length,
    confirmed: reportData.filter(r => r.status === 'CONFIRMED').length,
    closed: reportData.filter(r => r.status === 'CLOSED').length,
    active: reportData.filter(r => r.status === 'ACTIVE').length,
    notStarted: reportData.filter(r => r.status === 'NOT_STARTED').length,
  }), [reportData]);

  /* تصدير Excel */
  const handleExport = () => {
    exportCSV(
      `تقرير_${reportDate}.csv`,
      ['اللجنة', 'المراقب', 'وقت الدخول', 'وقت الإغلاق', 'وقت الاستلام', 'المستلم', 'الحالة', 'عدد الطلاب', 'الملاحظات'],
      reportData.map(r => [
        `لجنة ${r.committee}`, r.proctorName, r.joinTime, r.closeTime,
        r.receiptTime, r.receiverName,
        r.status === 'CONFIRMED' ? 'مستلمة' : r.status === 'CLOSED' ? 'منتهية' : r.status === 'ACTIVE' ? 'نشطة' : 'لم تبدأ',
        r.totalStudents, r.observations
      ])
    );
  };

  const statusLabel = (s: string) => ({
    CONFIRMED:   { text: 'مستلمة ✓', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    CLOSED:      { text: 'منتهية ⏳', cls: 'bg-amber-100  text-amber-700  border-amber-200'  },
    ACTIVE:      { text: 'نشطة 🟢',  cls: 'bg-blue-100   text-blue-700   border-blue-200'   },
    NOT_STARTED: { text: 'لم تبدأ',  cls: 'bg-slate-100  text-slate-500  border-slate-200'  },
  }[s] || { text: s, cls: 'bg-slate-100 text-slate-500 border-slate-200' });

  return (
    <div className="space-y-8 animate-fade-in text-right pb-32" dir="rtl">

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] shadow-2xl text-white no-print relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3.5 rounded-2xl shadow-xl">
                <FileSpreadsheet size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black">تقارير الأداء اليومي</h3>
                <p className="text-slate-400 text-xs font-bold mt-0.5">سجل التوقيتات والاستلامات لكل لجنة</p>
              </div>
            </div>
            {/* تبديل العرض */}
            <div className="bg-white/10 p-1 rounded-2xl flex gap-1 border border-white/5">
              <button onClick={() => setViewMode('SUMMARY')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'SUMMARY' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                ملخص اليوم
              </button>
              <button onClick={() => setViewMode('DETAILED')} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'DETAILED' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}>
                الملاحظات
              </button>
            </div>
          </div>

          {/* فلاتر */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="date"
                className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-black outline-none focus:border-blue-500 text-white"
                value={reportDate}
                onChange={e => setReportDate(e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="اسم المادة (للطباعة)..."
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-blue-500 text-white placeholder:text-slate-500"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="بحث بمراقب أو لجنة..."
                className="w-full p-4 pr-11 bg-white/5 border border-white/10 rounded-2xl font-bold outline-none focus:border-blue-500 text-white placeholder:text-slate-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* أزرار الإجراء */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => window.print()}
              className="flex-1 md:flex-none bg-blue-600 text-white py-4 px-8 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
            >
              <Printer size={18} /> طباعة (A4)
            </button>
            <button
              onClick={handleExport}
              className="flex-1 md:flex-none bg-emerald-600 text-white py-4 px-8 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"
            >
              <Download size={18} /> تصدير Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── بطاقات الإحصائيات ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
        {[
          { label: 'إجمالي اللجان', value: stats.total,      color: 'from-slate-700 to-slate-800', icon: ClipboardList },
          { label: 'مستلمة نظامياً',value: stats.confirmed,  color: 'from-emerald-600 to-emerald-700', icon: CheckCircle2 },
          { label: 'منتهية ⏳',     value: stats.closed,     color: 'from-amber-500 to-orange-600',    icon: Package },
          { label: 'لم تبدأ',      value: stats.notStarted, color: 'from-rose-500 to-rose-700',        icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white p-5 rounded-3xl shadow-lg`}>
            <s.icon size={22} className="opacity-70 mb-2" />
            <p className="text-4xl font-black tabular-nums">{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── الجدول ── */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        {reportData.length === 0 ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <ClipboardList size={56} className="text-slate-200" />
            <p className="text-slate-400 font-black text-xl">لا توجد بيانات لهذا اليوم</p>
            <p className="text-slate-300 text-sm font-bold">
              {students.length === 0
                ? 'يرجى رفع بيانات الطلاب أولاً لتوليد التقرير'
                : `لم يتم تسجيل أي عمليات بتاريخ ${reportDate}`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {viewMode === 'SUMMARY' ? (
              <table className="w-full text-right min-w-[700px]">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">اللجنة</th>
                    <th className="px-6 py-4">المراقب</th>
                    <th className="px-6 py-4 text-center">وقت الدخول</th>
                    <th className="px-6 py-4 text-center">وقت الإغلاق</th>
                    <th className="px-6 py-4 text-center">وقت الاستلام</th>
                    <th className="px-6 py-4 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportData.map((row, idx) => {
                    const st = statusLabel(row.status);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-black">
                            لجنة {row.committee}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-800 text-sm">{row.proctorName}</p>
                          {row.receiverName !== '—' && (
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">مستلم: {row.receiverName}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black tabular-nums text-blue-600 text-sm">{row.joinTime}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black tabular-nums text-amber-600 text-sm">{row.closeTime}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black tabular-nums text-emerald-600 text-sm">{row.receiptTime}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-black border ${st.cls}`}>
                            {st.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-right min-w-[600px]">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">اللجنة</th>
                    <th className="px-6 py-4">المراقب</th>
                    <th className="px-6 py-4">الملاحظات</th>
                    <th className="px-6 py-4">الإجراء المتخذ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-black">لجنة {row.committee}</span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-700 text-sm">{row.proctorName}</td>
                      <td className="px-6 py-4 text-red-600 font-bold text-sm max-w-xs">
                        {row.observations || <span className="text-slate-300 italic text-xs">لا توجد ملاحظات</span>}
                      </td>
                      <td className="px-6 py-4 text-blue-600 font-bold text-sm max-w-xs">
                        {row.resolutions || <span className="text-slate-300 italic text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── قسم الطباعة (مخفي شاشياً) ── */}
      <div className="print-only hidden">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black">تقرير أداء لجان الاختبار</h2>
          <p className="text-sm mt-1">بتاريخ: {reportDate} {subject && `| مادة: ${subject}`}</p>
        </div>
        <table className="w-full border-collapse border text-sm text-right">
          <thead>
            <tr className="bg-slate-100">
              <th className="border p-3">اللجنة</th>
              <th className="border p-3">المراقب</th>
              <th className="border p-3">وقت الدخول</th>
              <th className="border p-3">وقت الإغلاق</th>
              <th className="border p-3">وقت الاستلام</th>
              <th className="border p-3">المستلم</th>
              <th className="border p-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, i) => (
              <tr key={i}>
                <td className="border p-3 font-black">لجنة {row.committee}</td>
                <td className="border p-3">{row.proctorName}</td>
                <td className="border p-3 text-center">{row.joinTime}</td>
                <td className="border p-3 text-center">{row.closeTime}</td>
                <td className="border p-3 text-center">{row.receiptTime}</td>
                <td className="border p-3">{row.receiverName}</td>
                <td className="border p-3 text-center">{statusLabel(row.status).text}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-8 flex justify-between text-xs text-slate-500">
          <span>مكتبة النظام الذكي للكنترول</span>
          <span>طُبع بتاريخ: {new Date().toLocaleString('ar-SA')}</span>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
        @keyframes fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default AdminDailyReports;
