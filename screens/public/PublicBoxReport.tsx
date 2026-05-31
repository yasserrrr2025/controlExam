import React, { useState, useEffect, useMemo } from 'react';
import { Package, Calendar, Tag, AlertCircle, Clock, Users, Database, Loader2, CheckCircle, BookOpen } from 'lucide-react';
import { ArchiveBox, Student, Supervision, DeliveryLog, User, ExamSchedule } from '../../types';
import { db, supabase } from '../../supabase';

interface Props {
  boxId: string;
  students: Student[];
  supervisions?: Supervision[];
  deliveryLogs?: DeliveryLog[];
  users?: User[];
  examSchedule?: ExamSchedule[];
  systemConfig?: any;
}

export const PublicBoxReport: React.FC<Props> = ({
  boxId, students, supervisions = [], deliveryLogs = [], users = [], examSchedule = [], systemConfig
}) => {
  const [box, setBox] = useState<ArchiveBox | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Try Supabase first
        const { data, error: dbErr } = await supabase
          .from('archive_boxes')
          .select('*')
          .eq('id', boxId)
          .maybeSingle();

        if (!dbErr && data) {
          // Supabase returned data — committees may be stored as JSON string
          const committees = Array.isArray(data.committees)
            ? data.committees.map(String)
            : (typeof data.committees === 'string'
              ? JSON.parse(data.committees)
              : []);
          setBox({ ...data, committees });
          setLoading(false);
          return;
        }

        // 2. Fallback: in-memory boxes passed as prop won't work here since this is a public route.
        //    Try localStorage as last resort.
        const stored = localStorage.getItem('control_archive_boxes');
        if (stored) {
          const boxes: ArchiveBox[] = JSON.parse(stored);
          const found = boxes.find(b => b.id === boxId);
          if (found) {
            setBox(found);
            setLoading(false);
            return;
          }
        }

        // 3. Nothing found
        setError('الصندوق غير موجود أو تم حذفه.');
      } catch (e: any) {
        setError('فشل الاتصال بقاعدة البيانات. تحقق من الاتصال بالإنترنت.');
      } finally {
        setLoading(false);
      }
    };
    if (boxId) load();
  }, [boxId]);

  const eqCom = (a: any, b: any) => String(a) === String(b);

  const matchesDate = (isoStr: string | undefined | null, date: string): boolean => {
    if (!isoStr || !date) return false;
    try {
      const strVal = String(isoStr);
      if (strVal.startsWith(date) || date.startsWith(strVal.slice(0, 10))) return true;
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return false;
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return local === date;
    } catch { return false; }
  };

  const safeTime = (isoStr?: string) => {
    if (!isoStr) return '---';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '---';
      return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    } catch { return '---'; }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 font-['Tajawal']" dir="rtl">
        <div className="text-center text-white space-y-6">
          <div className="w-20 h-20 mx-auto bg-white/10 rounded-3xl flex items-center justify-center">
            <Loader2 size={40} className="animate-spin text-indigo-300" />
          </div>
          <p className="text-xl font-black text-indigo-200">جاري تحميل بيانات الصندوق...</p>
        </div>
      </div>
    );
  }

  if (error || !box) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-red-950 font-['Tajawal']" dir="rtl">
        <div className="text-center space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-16">
          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-3xl flex items-center justify-center">
            <AlertCircle size={40} className="text-red-300" />
          </div>
          <h2 className="text-3xl font-black text-white">الصندوق غير موجود</h2>
          <p className="text-slate-300 font-bold max-w-sm mx-auto">{error || 'تأكد من صحة رمز QR أو أن الصندوق لم يُحذف.'}</p>
        </div>
      </div>
    );
  }

  const dateStr = new Date(box.exam_date).toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 font-['Tajawal'] text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-indigo-700 to-slate-900 text-white px-6 py-10 md:px-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center shadow-xl">
              <Package size={40} />
            </div>
            <div>
              <p className="text-indigo-200 font-bold text-sm mb-1">المملكة العربية السعودية — وزارة التعليم</p>
              <h1 className="text-3xl md:text-4xl font-black">تقرير صندوق الاختبارات</h1>
              <p className="text-indigo-200 font-bold mt-1">الصندوق رقم: <span className="text-white text-xl font-black">{box.box_number}</span></p>
            </div>
          </div>
          <div className="text-left bg-white/10 rounded-2xl p-5 border border-white/20">
            <p className="text-indigo-200 text-xs font-black mb-1">تاريخ الاختبار</p>
            <p className="text-white font-black text-lg">{dateStr}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8 pb-24">
        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Tag size={22} />, label: 'المادة', value: box.subject, color: 'indigo' },
            { icon: <BookOpen size={22} />, label: 'الصف الدراسي', value: box.grade, color: 'violet' },
            { icon: <Database size={22} />, label: 'عدد اللجان', value: `${box.committees.length} لجنة`, color: 'emerald' },
          ].map(card => (
            <div key={card.label} className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4`}>
              <div className={`p-3 bg-${card.color}-50 text-${card.color}-600 rounded-2xl`}>{card.icon}</div>
              <div>
                <span className="block text-xs font-bold text-slate-400">{card.label}</span>
                <span className="block font-black text-lg text-slate-800">{card.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Committees */}
        {box.committees.length > 0 ? box.committees.map(committeeNum => {
          const supvsForCom = supervisions.filter(s =>
            eqCom(s.committee_number, committeeNum) &&
            matchesDate(s.date, box.exam_date)
          );
          const proctorNames = supvsForCom.map(s => {
            const u = users.find(u => u.national_id === s.teacher_id || u.id === s.teacher_id);
            return u ? u.full_name : s.teacher_id;
          });

          const closeLog = deliveryLogs.find(l =>
            eqCom(l.committee_number, committeeNum) &&
            matchesDate(l.time, box.exam_date) &&
            l.type === 'RECEIVE'
          );
          const receiptLog = deliveryLogs.find(l =>
            eqCom(l.committee_number, committeeNum) &&
            matchesDate(l.time, box.exam_date) &&
            l.status === 'CONFIRMED'
          );

          const committeeStudents = students
            .filter(s => s.grade === box.grade && eqCom(s.committee_number, committeeNum))
            .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

          const loginTime = supvsForCom.map(s => s.date).filter(Boolean).sort()[0];

          return (
            <div key={committeeNum} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
              {/* Committee Header */}
              <div className="bg-gradient-to-l from-slate-800 to-slate-950 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
                    {committeeNum}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">لجنة {committeeNum}</h3>
                    <p className="text-slate-400 font-bold text-sm">{committeeStudents.length} طالب</p>
                  </div>
                </div>
                <div className="flex gap-4 flex-wrap">
                  {loginTime && (
                    <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white flex items-center gap-2">
                      <Clock size={16} className="text-emerald-400" /> دخول: {safeTime(loginTime)}
                    </div>
                  )}
                  {closeLog && (
                    <div className="bg-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white flex items-center gap-2">
                      <Clock size={16} className="text-amber-400" /> إغلاق: {safeTime(closeLog.time)}
                    </div>
                  )}
                  {receiptLog && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-4 py-2 text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle size={16} /> استلام: {safeTime(receiptLog.time)}
                    </div>
                  )}
                </div>
              </div>

              {/* Proctors */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                <div className="p-2 bg-white shadow-sm rounded-xl text-slate-500 shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <span className="block text-[11px] font-black text-slate-400 mb-1.5">الملاحظون المكلفون</span>
                  <div className="flex gap-2 flex-wrap">
                    {proctorNames.length > 0 ? proctorNames.map((n, i) => (
                      <span key={i} className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">{n}</span>
                    )) : <span className="text-slate-400 text-sm font-bold">لم يُسجَّل ملاحظون</span>}
                  </div>
                </div>
              </div>

              {/* Students */}
              <div className="p-6">
                <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm">{committeeStudents.length}</span>
                  أسماء الطلاب
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {committeeStudents.map((st, idx) => (
                    <div key={st.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-3 hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                      <span className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[11px] font-black text-slate-600 shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <span className="block text-sm font-bold text-slate-800 truncate">{st.name}</span>
                        <span className="block text-[10px] font-bold text-slate-400">مقعد: {st.seating_number || '-'}</span>
                      </div>
                    </div>
                  ))}
                  {committeeStudents.length === 0 && (
                    <p className="text-slate-400 text-sm font-bold py-4 col-span-full text-center">لا يوجد طلاب لهذه اللجنة في هذا الصف.</p>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-16 text-slate-400">
            <Package size={56} className="mx-auto mb-4 opacity-20" />
            <p className="font-black">لا توجد لجان مسجلة في هذا الصندوق.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm font-bold pt-4 border-t border-slate-200">
          تم إنشاء هذا التقرير آلياً عبر نظام الكنترول الرقمي — مدرسة عماد الدين زنكي المتوسطة
        </div>
      </div>
    </div>
  );
};
