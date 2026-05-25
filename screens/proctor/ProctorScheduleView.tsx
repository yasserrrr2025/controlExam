import React, { useMemo } from 'react';
import { CalendarDays, CheckCircle2, Clock, ListChecks, ShieldCheck, Timer } from 'lucide-react';
import { Supervision, SystemConfig, User } from '../../types';

interface Props {
  user: User;
  supervisions: Supervision[];
  systemConfig: SystemConfig;
}

const dateKey = (value: string) => (value || '').slice(0, 10);

const formatDate = (value: string) => {
  const key = dateKey(value);
  if (!key) return 'غير محدد';
  return new Date(`${key}T12:00:00`).toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ProctorScheduleView: React.FC<Props> = ({ user, supervisions, systemConfig }) => {
  const today = systemConfig?.active_exam_date || new Date().toISOString().slice(0, 10);
  const myAssignments = useMemo(
    () =>
      supervisions
        .filter(item => item.teacher_id === user.id)
        .sort((a, b) => {
          const byDate = dateKey(a.date).localeCompare(dateKey(b.date));
          if (byDate !== 0) return byDate;
          return Number(a.committee_number) - Number(b.committee_number);
        }),
    [supervisions, user.id],
  );

  const todayAssignments = myAssignments.filter(item => dateKey(item.date) === today);
  const upcomingAssignments = myAssignments.filter(item => dateKey(item.date) > today);
  const pastAssignments = myAssignments.filter(item => dateKey(item.date) < today);
  const totalDates = new Set(myAssignments.map(item => dateKey(item.date))).size;

  const stats = [
    { label: 'إجمالي لجانك', value: myAssignments.length, icon: ListChecks, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'اختبارات قادمة', value: upcomingAssignments.length, icon: CalendarDays, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'لجان اليوم', value: todayAssignments.length, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'أيام مراقبة', value: totalDates, icon: Timer, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-[3rem] bg-slate-950 text-white p-8 md:p-10 shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,.22),transparent_30%)]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-xs font-black text-blue-100 mb-5">
              <CalendarDays size={16} />
              جدول مراقبتي
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter">مواعيد اللجان المسندة لك</h1>
            <p className="mt-4 text-sm md:text-base font-bold text-slate-300 max-w-2xl">
              تعرض هذه الصفحة أيام المراقبة، رقم اللجنة، الفترة، وحالة كل إسناد حتى تكون الصورة واضحة وعادلة أمام كل مراقب.
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 border border-white/10 p-5 min-w-[220px]">
            <p className="text-[11px] font-black text-slate-400">المراقب</p>
            <p className="text-xl font-black mt-1">{user.full_name}</p>
            <p className="text-xs font-bold text-slate-400 mt-3">تاريخ النظام النشط: {today}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(item => (
          <div key={item.label} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black text-slate-400">{item.label}</p>
              <p className="text-4xl font-black text-slate-950 mt-2 tabular-nums">{item.value}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center`}>
              <item.icon size={26} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-950">تفاصيل الإسناد</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">مرتبة حسب التاريخ، وتظهر لجنة اليوم بوضوح.</p>
          </div>
          <div className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-black">
            بداية الجلسة: {systemConfig?.exam_start_time || '08:00'}
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-3">
          {myAssignments.length ? myAssignments.map(item => {
            const key = dateKey(item.date);
            const isToday = key === today;
            const isPast = key < today;
            const status = isToday ? 'لجنة اليوم' : isPast ? 'منتهية' : 'قادمة';
            return (
              <div
                key={item.id}
                className={`grid grid-cols-1 lg:grid-cols-[1.2fr_.8fr_.8fr_.8fr] gap-4 p-5 rounded-3xl border ${
                  isToday ? 'bg-blue-50 border-blue-200 shadow-lg shadow-blue-100' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isToday ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>
                    {isToday ? <CheckCircle2 size={26} /> : <Clock size={26} />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-950">{formatDate(item.date)}</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1">{key}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400">اللجنة</p>
                  <p className="text-3xl font-black text-slate-950 tabular-nums">{item.committee_number}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400">المادة / الفترة</p>
                  <p className="font-black text-slate-900">{item.subject || 'اختبار'} - فترة {item.period || 1}</p>
                </div>
                <div className="flex lg:justify-end items-center">
                  <span className={`px-4 py-2 rounded-full text-xs font-black ${isToday ? 'bg-blue-600 text-white' : isPast ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                    {status}
                  </span>
                </div>
              </div>
            );
          }) : (
            <div className="p-12 text-center rounded-3xl bg-slate-50 border border-dashed border-slate-200">
              <CalendarDays size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-xl font-black text-slate-600">لا توجد لجان مسندة لك حتى الآن</p>
              <p className="text-sm font-bold text-slate-400 mt-2">عند اعتماد التوزيع الذكي ستظهر هنا تلقائيًا.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProctorScheduleView;
